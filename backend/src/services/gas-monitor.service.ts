/**
 * Gas Monitor Service — Self-sustaining autonomous agent gas management
 *
 * Periodically monitors agent wallet balances on Base mainnet and automatically
 * funds agents when their balance falls below the minimum threshold.
 *
 * This enables autonomous operation with minimal human intervention.
 */

import { getDb } from "../db/connection.js";
import { listAgents } from "./agent.service.js";
import { getAgentWalletAddress } from "./agent.service.js";
import { ethers } from "ethers";

const BASE_RPC_URL = process.env.BASE_RPC_URL ?? "https://mainnet.base.org";
const BASE_PRIVATE_KEY = process.env.BASE_PRIVATE_KEY ?? "";
const MIN_BALANCE_ETH = process.env.MIN_BALANCE_ETH ?? "0.001";
const FUNDING_AMOUNT_ETH = process.env.FUNDING_AMOUNT_ETH ?? "0.01";
const MONITOR_INTERVAL_MS = parseInt(process.env.GAS_MONITOR_INTERVAL_MS ?? "300000"); // 5 minutes default
const BASE_BUILDER_CODE = process.env.BASE_BUILDER_CODE ?? "";

const MIN_SERVER_BALANCE_ETH = process.env.MIN_SERVER_BALANCE_ETH ?? "0.02"; // Minimum server wallet balance

let monitorInterval: ReturnType<typeof setInterval> | null = null;
let isRunning = false;

/**
 * Checks if the server wallet has sufficient balance to fund agents
 */
async function checkServerWalletBalance(): Promise<{ sufficient: boolean; balance: string; address: string }> {
  if (!BASE_PRIVATE_KEY) {
    return { sufficient: false, balance: "0", address: "" };
  }

  try {
    const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
    const funder = new ethers.Wallet(BASE_PRIVATE_KEY, provider);
    const address = await funder.getAddress();
    const balance = await provider.getBalance(address);
    const balanceEth = ethers.formatEther(balance);
    const minBalance = ethers.parseEther(MIN_SERVER_BALANCE_ETH);
    
    return {
      sufficient: balance >= minBalance,
      balance: balanceEth,
      address,
    };
  } catch (err: any) {
    console.error("[gas-monitor] Failed to check server wallet balance:", err?.message);
    return { sufficient: false, balance: "0", address: "" };
  }
}

/**
 * Checks balance for a single agent and funds if needed
 */
async function checkAndFundAgent(agentId: string, walletAddress: string): Promise<boolean> {
  try {
    const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
    const balance = await provider.getBalance(walletAddress);
    const balanceEth = ethers.formatEther(balance);
    const minBalance = ethers.parseEther(MIN_BALANCE_ETH);

    if (balance >= minBalance) {
      return false; // Balance is sufficient
    }

    console.log(`[gas-monitor] Low balance detected for ${agentId}: ${balanceEth} ETH (min: ${MIN_BALANCE_ETH} ETH)`);

    if (!BASE_PRIVATE_KEY) {
      console.warn(`[gas-monitor] BASE_PRIVATE_KEY not set — cannot auto-fund agent ${agentId}`);
      return false;
    }

    // Check server wallet balance before attempting to fund
    const serverBalance = await checkServerWalletBalance();
    if (!serverBalance.sufficient) {
      const fundingAmount = parseFloat(FUNDING_AMOUNT_ETH);
      const minServerBalance = parseFloat(MIN_SERVER_BALANCE_ETH);
      console.error(
        `[gas-monitor] ⚠️  Server wallet insufficient funds — cannot fund agent ${agentId}\n` +
        `  Server wallet: ${serverBalance.address}\n` +
        `  Server balance: ${serverBalance.balance} ETH (min required: ${minServerBalance} ETH)\n` +
        `  Funding amount needed: ${fundingAmount} ETH\n` +
        `  Please fund the server wallet at ${serverBalance.address}`
      );
      return false;
    }

    // Fund the agent
    const funder = new ethers.Wallet(BASE_PRIVATE_KEY, provider);
    
    // Estimate gas cost first
    const fundingAmountWei = ethers.parseEther(FUNDING_AMOUNT_ETH);
    
    // Create transaction data with ERC-8021 builder code if available
    let txData = "0x";
    if (BASE_BUILDER_CODE) {
      const codeBytes = ethers.toUtf8Bytes(BASE_BUILDER_CODE);
      const padded = ethers.zeroPadValue(codeBytes, 32);
      txData = `0x00000000${padded.slice(2)}`;
    }

    // Estimate gas to ensure we have enough
    try {
      const gasEstimate = await provider.estimateGas({
        from: await funder.getAddress(),
        to: walletAddress,
        value: fundingAmountWei,
        data: txData,
      });
      
      const gasPrice = await provider.getFeeData();
      const totalCost = gasEstimate * (gasPrice.gasPrice || 0n) + fundingAmountWei;
      const serverBalanceWei = await provider.getBalance(await funder.getAddress());
      
      if (serverBalanceWei < totalCost) {
        console.error(
          `[gas-monitor] ⚠️  Insufficient funds for transaction — cannot fund agent ${agentId}\n` +
          `  Server balance: ${ethers.formatEther(serverBalanceWei)} ETH\n` +
          `  Required: ${ethers.formatEther(totalCost)} ETH (gas: ${ethers.formatEther(gasEstimate * (gasPrice.gasPrice || 0n))} + value: ${FUNDING_AMOUNT_ETH})\n` +
          `  Please fund the server wallet at ${await funder.getAddress()}`
        );
        return false;
      }
    } catch (gasErr: any) {
      // If gas estimation fails, still try the transaction but log the error
      console.warn(`[gas-monitor] Gas estimation failed, proceeding anyway:`, gasErr?.message);
    }

    const tx = await funder.sendTransaction({
      to: walletAddress,
      value: fundingAmountWei,
      data: txData,
    });

    console.log(`[gas-monitor] Funding transaction sent for ${agentId}: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`[gas-monitor] Agent ${agentId} funded successfully: ${receipt?.hash || tx.hash}`);

    // Log the funding event
    try {
      const db = getDb();
      const id = `gas-fund-${Math.random().toString(36).substring(2, 11)}`;
      db.prepare(
        "INSERT INTO contract_txns (id, agent_id, method, tx_hash, status, params, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).run(
        id,
        agentId,
        "autoFundGas",
        receipt?.hash || tx.hash,
        "confirmed",
        JSON.stringify({ amount: FUNDING_AMOUNT_ETH, previousBalance: balanceEth }),
        Date.now()
      );
    } catch (dbErr) {
      console.warn("[gas-monitor] Failed to log funding transaction:", dbErr);
    }

    return true;
  } catch (err: any) {
    // Handle insufficient funds error specifically
    if (err?.code === "INSUFFICIENT_FUNDS" || err?.message?.includes("insufficient funds")) {
      const serverBalance = await checkServerWalletBalance();
      console.error(
        `[gas-monitor] ⚠️  Insufficient funds error — cannot fund agent ${agentId}\n` +
        `  Server wallet: ${serverBalance.address}\n` +
        `  Server balance: ${serverBalance.balance} ETH\n` +
        `  Funding amount needed: ${FUNDING_AMOUNT_ETH} ETH\n` +
        `  Please fund the server wallet at ${serverBalance.address}`
      );
    } else {
      console.error(`[gas-monitor] Failed to check/fund agent ${agentId}:`, err?.message);
    }
    return false;
  }
}

/**
 * Monitors all agents and funds those with low balances
 */
async function monitorAgents(): Promise<void> {
  if (!BASE_RPC_URL || BASE_RPC_URL === "https://mainnet.base.org") {
    // Only run if Base is configured
    if (!process.env.BASE_RPC_URL) {
      return; // Skip if not configured
    }
  }

  try {
    const agents = listAgents();
    const baseAgents = agents.filter(agent => agent.deployedChain === "base" && agent.walletAddress);

    if (baseAgents.length === 0) {
      return;
    }

    console.log(`[gas-monitor] Checking balances for ${baseAgents.length} Base agents...`);

    // Check server wallet balance first
    const serverBalance = await checkServerWalletBalance();
    if (!serverBalance.sufficient && BASE_PRIVATE_KEY) {
      console.warn(
        `[gas-monitor] ⚠️  Server wallet low on funds: ${serverBalance.balance} ETH (min: ${MIN_SERVER_BALANCE_ETH} ETH)\n` +
        `  Server wallet address: ${serverBalance.address}\n` +
        `  Please fund the server wallet to enable auto-funding`
      );
    }

    let fundedCount = 0;
    let skippedCount = 0;
    for (const agent of baseAgents) {
      if (agent.walletAddress) {
        const funded = await checkAndFundAgent(agent.id, agent.walletAddress);
        if (funded) {
          fundedCount++;
        } else {
          skippedCount++;
        }
        // Small delay between checks to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (fundedCount > 0) {
      console.log(`[gas-monitor] Auto-funded ${fundedCount} agent(s)`);
    }
    if (skippedCount > 0 && !serverBalance.sufficient) {
      console.warn(`[gas-monitor] Skipped funding ${skippedCount} agent(s) due to insufficient server wallet balance`);
    }
  } catch (err: any) {
    console.error("[gas-monitor] Error during monitoring cycle:", err?.message);
  }
}

/**
 * Starts the gas monitoring service
 */
export function startGasMonitor(): void {
  if (isRunning) {
    console.warn("[gas-monitor] Gas monitor is already running");
    return;
  }

  if (!BASE_RPC_URL || BASE_RPC_URL.includes("testnet") || BASE_RPC_URL.includes("localhost")) {
    console.warn("[gas-monitor] Gas monitor disabled — not configured for Base mainnet");
    return;
  }

  console.log(`[gas-monitor] Starting gas monitor (interval: ${MONITOR_INTERVAL_MS}ms)`);
  
  isRunning = true;
  
  // Run immediately on start
  monitorAgents().catch(err => {
    console.error("[gas-monitor] Error in initial monitoring:", err);
  });

  // Then run periodically
  monitorInterval = setInterval(() => {
    monitorAgents().catch(err => {
      console.error("[gas-monitor] Error in periodic monitoring:", err);
    });
  }, MONITOR_INTERVAL_MS);
}

/**
 * Stops the gas monitoring service
 */
export function stopGasMonitor(): void {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
    isRunning = false;
    console.log("[gas-monitor] Gas monitor stopped");
  }
}

/**
 * Manually trigger a monitoring cycle (useful for testing or manual checks)
 */
export async function triggerGasCheck(): Promise<void> {
  await monitorAgents();
}

/**
 * Get server wallet balance information
 */
export async function getServerWalletInfo(): Promise<{ address: string; balance: string; sufficient: boolean }> {
  const info = await checkServerWalletBalance();
  return {
    address: info.address,
    balance: info.balance,
    sufficient: info.sufficient,
  };
}
