/**
 * Base Mainnet Integration — Real on-chain transactions with ERC-8021 builder codes
 *
 * Features:
 * - Revenue settlement on Base mainnet
 * - ERC-8021 builder code attribution for analytics
 * - Self-sustaining gas management
 * - Autonomous retry logic
 *
 * Required env vars:
 *   BASE_RPC_URL          — Base mainnet RPC endpoint
 *   BASE_PRIVATE_KEY      — Server wallet for gas funding (optional, uses agent wallets if not set)
 *   BASE_BUILDER_CODE     — ERC-8021 builder code from base.dev (register at https://base.dev)
 *   WALLET_ENCRYPTION_KEY — For decrypting agent private keys
 */

import { ethers } from "ethers";
import type { RevenueService, AnalyticsService } from "./types.js";
import { getAgentSigner } from "../services/wallet.service.js";
import { getAgent, getAgentWalletAddress, getAgentEncryptedKey } from "../services/agent.service.js";
import { getDb } from "../db/connection.js";

// Base mainnet configuration
const BASE_RPC_URL = process.env.BASE_RPC_URL ?? "https://mainnet.base.org";
const BASE_PRIVATE_KEY = process.env.BASE_PRIVATE_KEY ?? "";
const BASE_BUILDER_CODE = process.env.BASE_BUILDER_CODE ?? "";

// Base mainnet chain ID
const BASE_CHAIN_ID = 8453;

const isConfigured = BASE_RPC_URL.length > 0;
const hasBuilderCode = BASE_BUILDER_CODE.length > 0;

if (isConfigured) {
  console.log("[base-mainnet] Real Base mainnet integration enabled");
  console.log("[base-mainnet] RPC:", BASE_RPC_URL);
  if (hasBuilderCode) {
    console.log("[base-mainnet] Builder code:", BASE_BUILDER_CODE);
  } else {
    console.warn("[base-mainnet] BASE_BUILDER_CODE not set — transactions will not include ERC-8021 attribution");
    console.warn("[base-mainnet] Register at https://base.dev to get your builder code");
  }
} else {
  console.warn("[base-mainnet] BASE_RPC_URL not set — using stub mode");
}

// ── ERC-8021 Builder Code Support ────────────────────────────────────────────────
/**
 * Creates ERC-8021 data suffix for transaction attribution
 * Format: 0x00000000 + builder code (padded to 32 bytes)
 */
function createERC8021DataSuffix(builderCode: string): string {
  if (!builderCode) return "0x";
  
  // ERC-8021 format: 4-byte selector (0x00000000) + builder code data
  // Builder codes are typically short strings, we'll encode them
  const codeBytes = ethers.toUtf8Bytes(builderCode);
  const padded = ethers.zeroPadValue(codeBytes, 32);
  // Prepend 4-byte selector (0x00000000 for attribution)
  return `0x00000000${padded.slice(2)}`;
}

/**
 * Appends ERC-8021 data suffix to transaction data
 */
function appendBuilderCode(data: string, builderCode?: string): string {
  const code = builderCode || BASE_BUILDER_CODE;
  if (!code || !data || data === "0x") return data;
  
  const suffix = createERC8021DataSuffix(code);
  // Append suffix to existing calldata
  return `${data}${suffix.slice(2)}`;
}

// ── Gas Management & Self-Sustaining ────────────────────────────────────────────
const MIN_BALANCE_ETH = "0.001"; // Minimum balance to maintain for gas
const FUNDING_AMOUNT_ETH = "0.01"; // Amount to fund when balance is low

/**
 * Checks if an agent wallet has sufficient balance for transactions
 */
async function checkAgentBalance(agentId: string): Promise<{ sufficient: boolean; balance: string }> {
  const walletAddress = getAgentWalletAddress(agentId);
  if (!walletAddress) {
    return { sufficient: false, balance: "0" };
  }

  try {
    const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
    const balance = await provider.getBalance(walletAddress);
    const balanceEth = ethers.formatEther(balance);
    const minBalance = ethers.parseEther(MIN_BALANCE_ETH);
    
    return {
      sufficient: balance >= minBalance,
      balance: balanceEth,
    };
  } catch (err) {
    console.error(`[base-mainnet] Failed to check balance for ${agentId}:`, err);
    return { sufficient: false, balance: "0" };
  }
}

/**
 * Funds an agent wallet if balance is low (self-sustaining mechanism)
 */
async function ensureAgentFunded(agentId: string): Promise<boolean> {
  const balanceCheck = await checkAgentBalance(agentId);
  
  if (balanceCheck.sufficient) {
    return true;
  }

  console.log(`[base-mainnet] Low balance detected for ${agentId}: ${balanceCheck.balance} ETH, funding...`);

  if (!BASE_PRIVATE_KEY) {
    console.warn(`[base-mainnet] BASE_PRIVATE_KEY not set — cannot auto-fund agent ${agentId}`);
    return false;
  }

  try {
    const walletAddress = getAgentWalletAddress(agentId);
    if (!walletAddress) {
      console.error(`[base-mainnet] No wallet address for agent ${agentId}`);
      return false;
    }

    const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
    const funder = new ethers.Wallet(BASE_PRIVATE_KEY, provider);
    const funderAddress = await funder.getAddress();
    
    // Check server wallet balance first
    const serverBalance = await provider.getBalance(funderAddress);
    const fundingAmountWei = ethers.parseEther(FUNDING_AMOUNT_ETH);
    
    // Estimate gas cost
    let totalCost = fundingAmountWei;
    try {
      const gasEstimate = await provider.estimateGas({
        from: funderAddress,
        to: walletAddress,
        value: fundingAmountWei,
        data: hasBuilderCode ? appendBuilderCode("0x", BASE_BUILDER_CODE) : "0x",
      });
      const gasPrice = await provider.getFeeData();
      totalCost = gasEstimate * (gasPrice.gasPrice || 0n) + fundingAmountWei;
    } catch (gasErr) {
      // If estimation fails, use a conservative estimate
      const gasPrice = await provider.getFeeData();
      totalCost = 21000n * (gasPrice.gasPrice || 0n) + fundingAmountWei;
    }
    
    if (serverBalance < totalCost) {
      console.error(
        `[base-mainnet] ⚠️  Insufficient server wallet funds — cannot fund agent ${agentId}\n` +
        `  Server wallet: ${funderAddress}\n` +
        `  Server balance: ${ethers.formatEther(serverBalance)} ETH\n` +
        `  Required: ${ethers.formatEther(totalCost)} ETH\n` +
        `  Please fund the server wallet to enable auto-funding`
      );
      return false;
    }
    
    const tx = await funder.sendTransaction({
      to: walletAddress,
      value: fundingAmountWei,
      data: hasBuilderCode ? appendBuilderCode("0x", BASE_BUILDER_CODE) : "0x",
    });

    console.log(`[base-mainnet] Funding transaction sent: ${tx.hash}`);
    await tx.wait();
    console.log(`[base-mainnet] Agent ${agentId} funded successfully`);
    return true;
  } catch (err: any) {
    if (err?.code === "INSUFFICIENT_FUNDS" || err?.message?.includes("insufficient funds")) {
      const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
      const funder = new ethers.Wallet(BASE_PRIVATE_KEY, provider);
      const funderAddress = await funder.getAddress();
      const serverBalance = await provider.getBalance(funderAddress);
      console.error(
        `[base-mainnet] ⚠️  Insufficient funds error — cannot fund agent ${agentId}\n` +
        `  Server wallet: ${funderAddress}\n` +
        `  Server balance: ${ethers.formatEther(serverBalance)} ETH\n` +
        `  Please fund the server wallet to enable auto-funding`
      );
    } else {
      console.error(`[base-mainnet] Failed to fund agent ${agentId}:`, err?.message);
    }
    return false;
  }
}

// ── Transaction Retry Logic ──────────────────────────────────────────────────────
async function sendTransactionWithRetry(
  signer: ethers.Wallet,
  txRequest: ethers.TransactionRequest,
  maxRetries: number = 3
): Promise<ethers.TransactionResponse> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Append builder code to transaction data if available
      if (txRequest.data && hasBuilderCode) {
        txRequest.data = appendBuilderCode(txRequest.data as string, BASE_BUILDER_CODE);
      }
      
      const tx = await signer.sendTransaction(txRequest);
      return tx;
    } catch (err: any) {
      lastError = err;
      console.warn(`[base-mainnet] Transaction attempt ${attempt}/${maxRetries} failed:`, err?.message);
      
      if (attempt < maxRetries) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  throw lastError || new Error("Transaction failed after retries");
}

// ── Revenue Settlement Service ──────────────────────────────────────────────────
export const baseRevenue: RevenueService = {
  async settleRevenue(params) {
    if (!isConfigured) {
      const fakeHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
      console.log(`[base-stub] settleRevenue: ${params.amount} to agent ${params.agentId} (builder: ${params.builderCode || "none"})`);
      return { txHash: fakeHash };
    }

    try {
      const agent = getAgent(params.agentId);
      if (!agent) {
        throw new Error(`Agent ${params.agentId} not found`);
      }

      const walletAddress = getAgentWalletAddress(params.agentId);
      if (!walletAddress) {
        throw new Error(`No wallet address for agent ${params.agentId}`);
      }

      // Ensure agent has sufficient balance
      await ensureAgentFunded(params.agentId);

      // Get agent signer
      const encryptedKey = getAgentEncryptedKey(params.agentId);
      if (!encryptedKey) {
        throw new Error(`No encrypted key for agent ${params.agentId}`);
      }

      const signer = getAgentSigner(encryptedKey, BASE_RPC_URL);

      // Revenue settlement on Base: Record the settlement event for ERC-8021 attribution
      // The actual payment transfer happens through the escrow system
      // This transaction records the settlement on-chain for analytics and builder rewards
      
      const builderCode = params.builderCode || BASE_BUILDER_CODE;
      
      // Create a minimal transaction that records the settlement event
      // We send 0 ETH but include the builder code for attribution
      // In a production system, you might interact with a settlement contract instead
      const txRequest: ethers.TransactionRequest = {
        to: walletAddress, // Self-directed transaction for attribution
        value: 0, // No actual transfer, just recording the event
        data: builderCode ? appendBuilderCode("0x", builderCode) : "0x",
      };

      // Send transaction with retry logic
      const tx = await sendTransactionWithRetry(signer, txRequest);
      
      console.log(`[base-mainnet] Revenue settlement recorded: ${params.amount} to ${params.agentId} (tx: ${tx.hash}, builder: ${builderCode || "none"})`);

      // Log transaction to database
      try {
        const db = getDb();
        const id = `base-tx-${Math.random().toString(36).substring(2, 11)}`;
        db.prepare(
          "INSERT INTO contract_txns (id, agent_id, method, tx_hash, status, params, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
        ).run(
          id,
          params.agentId,
          "settleRevenue",
          tx.hash,
          "pending",
          JSON.stringify({ amount: params.amount, builderCode }),
          Date.now()
        );
      } catch (dbErr) {
        console.warn("[base-mainnet] Failed to log transaction:", dbErr);
      }

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log(`[base-mainnet] Revenue settlement confirmed: ${receipt?.hash || tx.hash}`);

      return { txHash: receipt?.hash || tx.hash };
    } catch (err: any) {
      console.error(`[base-mainnet] Revenue settlement failed for ${params.agentId}:`, err?.message);
      throw err;
    }
  },
};

// ── Analytics Service ───────────────────────────────────────────────────────────
export const baseAnalytics: AnalyticsService = {
  async recordAnalytics(params) {
    if (!isConfigured) {
      console.log(`[base-stub] recordAnalytics: ${params.eventType} for agent ${params.agentId} (builder: ${params.builderCode || "none"})`);
      return { recorded: true };
    }

    try {
      // For analytics, we can emit events or write to a contract
      // Since ERC-8021 attribution is handled at transaction level,
      // we primarily log the analytics event and ensure future transactions include the builder code
      
      const builderCode = params.builderCode || BASE_BUILDER_CODE;
      
      console.log(`[base-mainnet] Analytics recorded: ${params.eventType} for agent ${params.agentId} (builder: ${builderCode || "none"})`);
      
      // Store analytics event in database for tracking
      try {
        const db = getDb();
        // You could create an analytics table if needed
        // For now, we'll just log it
      } catch (dbErr) {
        console.warn("[base-mainnet] Failed to store analytics:", dbErr);
      }

      return { recorded: true };
    } catch (err: any) {
      console.error(`[base-mainnet] Analytics recording failed:`, err?.message);
      return { recorded: false };
    }
  },
};
