/**
 * Conduit Contract Service — calls Conduit.sol registry contract on 0G Newton testnet
 *
 * Follows the same pattern as zerog.stub.ts: check isConfigured, real call or stub fallback.
 *
 * Required env vars:
 *   ZEROG_RPC_URL       — RPC endpoint (defaults to 0G testnet)
 *   ZEROG_PRIVATE_KEY   — server wallet for gas funding
 *   CONDUIT_ADDRESS     — deployed Conduit.sol contract address
 *   WALLET_ENCRYPTION_KEY — for decrypting agent private keys
 */

import { ethers } from "ethers";
import { getDb } from "../db/connection.js";
import { getAgentSigner } from "../services/wallet.service.js";

// ── ABI (human-readable) ────────────────────────────────────────────────────────
const CONDUIT_ABI = [
  // Registration
  "function registerAgent(bytes32 name, uint8 chain, uint256 pricePerMinute, uint256 abilitiesMask) external",
  "function deregister() external",
  // Updates
  "function updateName(bytes32 newName) external",
  "function updateChain(uint8 newChain) external",
  "function updatePricePerMinute(uint256 newPrice) external",
  "function updateAbilitiesMask(uint256 newMask) external",
  // Jobs
  "function rentAgent(address agent, uint256 minutes) external payable returns (uint256 jobId)",
  "function acceptJob(uint256 jobId) external",
  "function rejectJob(uint256 jobId) external",
  "function completeJob(uint256 jobId, string calldata attestation) external",
  "function refundJob(uint256 jobId) external",
  // Tasks
  "function createTask(address assignee, uint256 payment) external payable returns (uint256 taskId)",
  "function completeTask(uint256 taskId, int256 reputationDelta) external",
  // Views
  "function agents(address) external view returns (bool exists, bytes32 name, uint8 chain, uint256 pricePerMinute, int256 reputation, uint256 abilitiesMask)",
  "function jobCount() external view returns (uint256)",
  "function taskCount() external view returns (uint256)",
];

const ZEROG_RPC = process.env.ZEROG_RPC_URL ?? "https://evmrpc-testnet.0g.ai";
const SERVER_PRIVATE_KEY = process.env.ZEROG_PRIVATE_KEY ?? "";
const CONDUIT_ADDRESS = process.env.CONDUIT_ADDRESS ?? "0x403b041783B90d628416A4abe11f280f85049097";

const isConfigured = SERVER_PRIVATE_KEY.length > 0 && CONDUIT_ADDRESS.length > 2;

if (isConfigured) {
  console.log("[conduit-contract] Real on-chain calls enabled");
  console.log("[conduit-contract] Conduit address:", CONDUIT_ADDRESS);
} else {
  console.warn("[conduit-contract] ZEROG_PRIVATE_KEY or CONDUIT_ADDRESS not set — using stub mode");
}

// Chain enum mapping matching Conduit.sol
const CHAIN_ENUM: Record<string, number> = { base: 0, hedera: 1, zerog: 2, "0g": 2 };

// ── Helpers ──────────────────────────────────────────────────────────────────────
function stringToBytes32(s: string): string {
  return ethers.encodeBytes32String(s.slice(0, 31));
}

const fakeTxHash = () =>
  "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function logContractTxn(
  agentId: string,
  method: string,
  txHash: string | null,
  status: "pending" | "confirmed" | "failed",
  params?: Record<string, unknown>,
  error?: string
): void {
  try {
    const db = getDb();
    const id = `ctx-${Math.random().toString(36).substring(2, 11)}`;
    db.prepare(
      "INSERT INTO contract_txns (id, agent_id, method, tx_hash, status, params, error, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(id, agentId, method, txHash, status, params ? JSON.stringify(params) : null, error ?? null, Date.now());
  } catch (err) {
    console.warn("[conduit-contract] Failed to log contract txn:", err);
  }
}

// ── Gas Funding ──────────────────────────────────────────────────────────────────
export async function fundAgentWallet(
  address: string,
  amountEth: string = "0.01"
): Promise<{ txHash: string }> {
  if (!isConfigured) {
    await delay(200);
    const txHash = fakeTxHash();
    console.log(`[conduit-stub] Fund agent wallet ${address} with ${amountEth} ETH — tx=${txHash}`);
    return { txHash };
  }

  try {
    const provider = new ethers.JsonRpcProvider(ZEROG_RPC);
    const serverWallet = new ethers.Wallet(SERVER_PRIVATE_KEY, provider);
    const tx = await serverWallet.sendTransaction({
      to: address,
      value: ethers.parseEther(amountEth),
    });
    console.log(`[conduit-contract] Funding ${address} with ${amountEth} ETH — tx=${tx.hash}`);
    const receipt = await tx.wait();
    return { txHash: receipt?.hash ?? tx.hash };
  } catch (err) {
    console.error("[conduit-contract] fundAgentWallet failed:", err);
    return { txHash: "0x0" };
  }
}

// ── Write Functions ──────────────────────────────────────────────────────────────

export async function conduitRegisterAgent(params: {
  agentId: string;
  encryptedPrivateKey: string;
  name: string;
  chain: string;
  pricePerMinute: string;
  abilitiesMask: string;
}): Promise<{ txHash: string }> {
  const { agentId, name, chain, pricePerMinute, abilitiesMask } = params;

  if (!isConfigured) {
    await delay(300);
    const txHash = fakeTxHash();
    console.log(`[conduit-stub] registerAgent ${agentId} name=${name} — tx=${txHash}`);
    logContractTxn(agentId, "registerAgent", txHash, "confirmed", { name, chain, pricePerMinute, abilitiesMask });
    return { txHash };
  }

  try {
    const signer = getAgentSigner(params.encryptedPrivateKey, ZEROG_RPC);
    const contract = new ethers.Contract(CONDUIT_ADDRESS, CONDUIT_ABI, signer);
    const chainEnum = CHAIN_ENUM[chain] ?? 0;
    const tx = await contract.registerAgent(
      stringToBytes32(name),
      chainEnum,
      ethers.parseEther(pricePerMinute),
      BigInt(abilitiesMask)
    );
    console.log(`[conduit-contract] registerAgent tx sent: ${tx.hash}`);
    logContractTxn(agentId, "registerAgent", tx.hash, "pending", { name, chain, pricePerMinute, abilitiesMask });
    const receipt = await tx.wait();
    logContractTxn(agentId, "registerAgent", receipt?.hash ?? tx.hash, "confirmed");
    return { txHash: receipt?.hash ?? tx.hash };
  } catch (err: any) {
    console.error("[conduit-contract] registerAgent failed:", err);
    logContractTxn(agentId, "registerAgent", null, "failed", undefined, err?.message);
    return { txHash: "0x0" };
  }
}

export async function conduitDeregister(params: {
  agentId: string;
  encryptedPrivateKey: string;
}): Promise<{ txHash: string }> {
  if (!isConfigured) {
    await delay(200);
    const txHash = fakeTxHash();
    logContractTxn(params.agentId, "deregister", txHash, "confirmed");
    return { txHash };
  }

  try {
    const signer = getAgentSigner(params.encryptedPrivateKey, ZEROG_RPC);
    const contract = new ethers.Contract(CONDUIT_ADDRESS, CONDUIT_ABI, signer);
    const tx = await contract.deregister();
    logContractTxn(params.agentId, "deregister", tx.hash, "pending");
    const receipt = await tx.wait();
    logContractTxn(params.agentId, "deregister", receipt?.hash ?? tx.hash, "confirmed");
    return { txHash: receipt?.hash ?? tx.hash };
  } catch (err: any) {
    console.error("[conduit-contract] deregister failed:", err);
    logContractTxn(params.agentId, "deregister", null, "failed", undefined, err?.message);
    return { txHash: "0x0" };
  }
}

export async function conduitUpdateName(params: {
  agentId: string;
  encryptedPrivateKey: string;
  name: string;
}): Promise<{ txHash: string }> {
  if (!isConfigured) {
    await delay(200);
    const txHash = fakeTxHash();
    logContractTxn(params.agentId, "updateName", txHash, "confirmed", { name: params.name });
    return { txHash };
  }

  try {
    const signer = getAgentSigner(params.encryptedPrivateKey, ZEROG_RPC);
    const contract = new ethers.Contract(CONDUIT_ADDRESS, CONDUIT_ABI, signer);
    const tx = await contract.updateName(stringToBytes32(params.name));
    logContractTxn(params.agentId, "updateName", tx.hash, "pending", { name: params.name });
    const receipt = await tx.wait();
    logContractTxn(params.agentId, "updateName", receipt?.hash ?? tx.hash, "confirmed");
    return { txHash: receipt?.hash ?? tx.hash };
  } catch (err: any) {
    console.error("[conduit-contract] updateName failed:", err);
    logContractTxn(params.agentId, "updateName", null, "failed", undefined, err?.message);
    return { txHash: "0x0" };
  }
}

export async function conduitUpdateChain(params: {
  agentId: string;
  encryptedPrivateKey: string;
  chain: string;
}): Promise<{ txHash: string }> {
  if (!isConfigured) {
    await delay(200);
    const txHash = fakeTxHash();
    logContractTxn(params.agentId, "updateChain", txHash, "confirmed", { chain: params.chain });
    return { txHash };
  }

  try {
    const signer = getAgentSigner(params.encryptedPrivateKey, ZEROG_RPC);
    const contract = new ethers.Contract(CONDUIT_ADDRESS, CONDUIT_ABI, signer);
    const chainEnum = CHAIN_ENUM[params.chain] ?? 0;
    const tx = await contract.updateChain(chainEnum);
    logContractTxn(params.agentId, "updateChain", tx.hash, "pending", { chain: params.chain });
    const receipt = await tx.wait();
    logContractTxn(params.agentId, "updateChain", receipt?.hash ?? tx.hash, "confirmed");
    return { txHash: receipt?.hash ?? tx.hash };
  } catch (err: any) {
    console.error("[conduit-contract] updateChain failed:", err);
    logContractTxn(params.agentId, "updateChain", null, "failed", undefined, err?.message);
    return { txHash: "0x0" };
  }
}

export async function conduitUpdatePrice(params: {
  agentId: string;
  encryptedPrivateKey: string;
  pricePerMinute: string;
}): Promise<{ txHash: string }> {
  if (!isConfigured) {
    await delay(200);
    const txHash = fakeTxHash();
    logContractTxn(params.agentId, "updatePricePerMinute", txHash, "confirmed", { pricePerMinute: params.pricePerMinute });
    return { txHash };
  }

  try {
    const signer = getAgentSigner(params.encryptedPrivateKey, ZEROG_RPC);
    const contract = new ethers.Contract(CONDUIT_ADDRESS, CONDUIT_ABI, signer);
    const tx = await contract.updatePricePerMinute(ethers.parseEther(params.pricePerMinute));
    logContractTxn(params.agentId, "updatePricePerMinute", tx.hash, "pending", { pricePerMinute: params.pricePerMinute });
    const receipt = await tx.wait();
    logContractTxn(params.agentId, "updatePricePerMinute", receipt?.hash ?? tx.hash, "confirmed");
    return { txHash: receipt?.hash ?? tx.hash };
  } catch (err: any) {
    console.error("[conduit-contract] updatePricePerMinute failed:", err);
    logContractTxn(params.agentId, "updatePricePerMinute", null, "failed", undefined, err?.message);
    return { txHash: "0x0" };
  }
}

export async function conduitUpdateAbilities(params: {
  agentId: string;
  encryptedPrivateKey: string;
  abilitiesMask: string;
}): Promise<{ txHash: string }> {
  if (!isConfigured) {
    await delay(200);
    const txHash = fakeTxHash();
    logContractTxn(params.agentId, "updateAbilitiesMask", txHash, "confirmed", { abilitiesMask: params.abilitiesMask });
    return { txHash };
  }

  try {
    const signer = getAgentSigner(params.encryptedPrivateKey, ZEROG_RPC);
    const contract = new ethers.Contract(CONDUIT_ADDRESS, CONDUIT_ABI, signer);
    const tx = await contract.updateAbilitiesMask(BigInt(params.abilitiesMask));
    logContractTxn(params.agentId, "updateAbilitiesMask", tx.hash, "pending", { abilitiesMask: params.abilitiesMask });
    const receipt = await tx.wait();
    logContractTxn(params.agentId, "updateAbilitiesMask", receipt?.hash ?? tx.hash, "confirmed");
    return { txHash: receipt?.hash ?? tx.hash };
  } catch (err: any) {
    console.error("[conduit-contract] updateAbilitiesMask failed:", err);
    logContractTxn(params.agentId, "updateAbilitiesMask", null, "failed", undefined, err?.message);
    return { txHash: "0x0" };
  }
}

export async function conduitRentAgent(params: {
  agentId: string;
  encryptedPrivateKey: string;
  targetAddress: string;
  minutes: number;
  valueEth: string;
}): Promise<{ txHash: string; jobId?: string }> {
  if (!isConfigured) {
    await delay(300);
    const txHash = fakeTxHash();
    const jobId = String(Math.floor(Math.random() * 100000));
    logContractTxn(params.agentId, "rentAgent", txHash, "confirmed", { target: params.targetAddress, minutes: params.minutes });
    return { txHash, jobId };
  }

  try {
    const signer = getAgentSigner(params.encryptedPrivateKey, ZEROG_RPC);
    const contract = new ethers.Contract(CONDUIT_ADDRESS, CONDUIT_ABI, signer);
    const tx = await contract.rentAgent(params.targetAddress, params.minutes, {
      value: ethers.parseEther(params.valueEth),
    });
    logContractTxn(params.agentId, "rentAgent", tx.hash, "pending", { target: params.targetAddress, minutes: params.minutes });
    const receipt = await tx.wait();
    // Try to parse jobId from logs
    let jobId: string | undefined;
    try {
      const iface = new ethers.Interface(CONDUIT_ABI);
      for (const log of receipt?.logs ?? []) {
        try {
          const parsed = iface.parseLog(log);
          if (parsed?.name === "JobCreated") {
            jobId = parsed.args[0]?.toString();
          }
        } catch { /* not our event */ }
      }
    } catch { /* ignore */ }
    logContractTxn(params.agentId, "rentAgent", receipt?.hash ?? tx.hash, "confirmed");
    return { txHash: receipt?.hash ?? tx.hash, jobId };
  } catch (err: any) {
    console.error("[conduit-contract] rentAgent failed:", err);
    logContractTxn(params.agentId, "rentAgent", null, "failed", undefined, err?.message);
    return { txHash: "0x0" };
  }
}

export async function conduitAcceptJob(params: {
  agentId: string;
  encryptedPrivateKey: string;
  jobId: number;
}): Promise<{ txHash: string }> {
  if (!isConfigured) {
    await delay(200);
    const txHash = fakeTxHash();
    logContractTxn(params.agentId, "acceptJob", txHash, "confirmed", { jobId: params.jobId });
    return { txHash };
  }

  try {
    const signer = getAgentSigner(params.encryptedPrivateKey, ZEROG_RPC);
    const contract = new ethers.Contract(CONDUIT_ADDRESS, CONDUIT_ABI, signer);
    const tx = await contract.acceptJob(params.jobId);
    logContractTxn(params.agentId, "acceptJob", tx.hash, "pending", { jobId: params.jobId });
    const receipt = await tx.wait();
    logContractTxn(params.agentId, "acceptJob", receipt?.hash ?? tx.hash, "confirmed");
    return { txHash: receipt?.hash ?? tx.hash };
  } catch (err: any) {
    console.error("[conduit-contract] acceptJob failed:", err);
    logContractTxn(params.agentId, "acceptJob", null, "failed", undefined, err?.message);
    return { txHash: "0x0" };
  }
}

export async function conduitRejectJob(params: {
  agentId: string;
  encryptedPrivateKey: string;
  jobId: number;
}): Promise<{ txHash: string }> {
  if (!isConfigured) {
    await delay(200);
    const txHash = fakeTxHash();
    logContractTxn(params.agentId, "rejectJob", txHash, "confirmed", { jobId: params.jobId });
    return { txHash };
  }

  try {
    const signer = getAgentSigner(params.encryptedPrivateKey, ZEROG_RPC);
    const contract = new ethers.Contract(CONDUIT_ADDRESS, CONDUIT_ABI, signer);
    const tx = await contract.rejectJob(params.jobId);
    logContractTxn(params.agentId, "rejectJob", tx.hash, "pending", { jobId: params.jobId });
    const receipt = await tx.wait();
    logContractTxn(params.agentId, "rejectJob", receipt?.hash ?? tx.hash, "confirmed");
    return { txHash: receipt?.hash ?? tx.hash };
  } catch (err: any) {
    console.error("[conduit-contract] rejectJob failed:", err);
    logContractTxn(params.agentId, "rejectJob", null, "failed", undefined, err?.message);
    return { txHash: "0x0" };
  }
}

export async function conduitCompleteJob(params: {
  agentId: string;
  encryptedPrivateKey: string;
  jobId: number;
  attestation: string;
}): Promise<{ txHash: string }> {
  if (!isConfigured) {
    await delay(200);
    const txHash = fakeTxHash();
    logContractTxn(params.agentId, "completeJob", txHash, "confirmed", { jobId: params.jobId });
    return { txHash };
  }

  try {
    const signer = getAgentSigner(params.encryptedPrivateKey, ZEROG_RPC);
    const contract = new ethers.Contract(CONDUIT_ADDRESS, CONDUIT_ABI, signer);
    const tx = await contract.completeJob(params.jobId, params.attestation);
    logContractTxn(params.agentId, "completeJob", tx.hash, "pending", { jobId: params.jobId });
    const receipt = await tx.wait();
    logContractTxn(params.agentId, "completeJob", receipt?.hash ?? tx.hash, "confirmed");
    return { txHash: receipt?.hash ?? tx.hash };
  } catch (err: any) {
    console.error("[conduit-contract] completeJob failed:", err);
    logContractTxn(params.agentId, "completeJob", null, "failed", undefined, err?.message);
    return { txHash: "0x0" };
  }
}

export async function conduitRefundJob(params: {
  agentId: string;
  encryptedPrivateKey: string;
  jobId: number;
}): Promise<{ txHash: string }> {
  if (!isConfigured) {
    await delay(200);
    const txHash = fakeTxHash();
    logContractTxn(params.agentId, "refundJob", txHash, "confirmed", { jobId: params.jobId });
    return { txHash };
  }

  try {
    const signer = getAgentSigner(params.encryptedPrivateKey, ZEROG_RPC);
    const contract = new ethers.Contract(CONDUIT_ADDRESS, CONDUIT_ABI, signer);
    const tx = await contract.refundJob(params.jobId);
    logContractTxn(params.agentId, "refundJob", tx.hash, "pending", { jobId: params.jobId });
    const receipt = await tx.wait();
    logContractTxn(params.agentId, "refundJob", receipt?.hash ?? tx.hash, "confirmed");
    return { txHash: receipt?.hash ?? tx.hash };
  } catch (err: any) {
    console.error("[conduit-contract] refundJob failed:", err);
    logContractTxn(params.agentId, "refundJob", null, "failed", undefined, err?.message);
    return { txHash: "0x0" };
  }
}

export async function conduitCreateTask(params: {
  agentId: string;
  encryptedPrivateKey: string;
  assigneeAddress: string;
  paymentEth: string;
}): Promise<{ txHash: string; taskId?: string }> {
  if (!isConfigured) {
    await delay(300);
    const txHash = fakeTxHash();
    const taskId = String(Math.floor(Math.random() * 100000));
    logContractTxn(params.agentId, "createTask", txHash, "confirmed", { assignee: params.assigneeAddress, payment: params.paymentEth });
    return { txHash, taskId };
  }

  try {
    const signer = getAgentSigner(params.encryptedPrivateKey, ZEROG_RPC);
    const contract = new ethers.Contract(CONDUIT_ADDRESS, CONDUIT_ABI, signer);
    const payment = ethers.parseEther(params.paymentEth);
    const tx = await contract.createTask(params.assigneeAddress, payment, { value: payment });
    logContractTxn(params.agentId, "createTask", tx.hash, "pending", { assignee: params.assigneeAddress, payment: params.paymentEth });
    const receipt = await tx.wait();
    let taskId: string | undefined;
    try {
      const iface = new ethers.Interface(CONDUIT_ABI);
      for (const log of receipt?.logs ?? []) {
        try {
          const parsed = iface.parseLog(log);
          if (parsed?.name === "TaskCreated") {
            taskId = parsed.args[0]?.toString();
          }
        } catch { /* not our event */ }
      }
    } catch { /* ignore */ }
    logContractTxn(params.agentId, "createTask", receipt?.hash ?? tx.hash, "confirmed");
    return { txHash: receipt?.hash ?? tx.hash, taskId };
  } catch (err: any) {
    console.error("[conduit-contract] createTask failed:", err);
    logContractTxn(params.agentId, "createTask", null, "failed", undefined, err?.message);
    return { txHash: "0x0" };
  }
}

export async function conduitCompleteTask(params: {
  agentId: string;
  encryptedPrivateKey: string;
  taskId: number;
  reputationDelta: number;
}): Promise<{ txHash: string }> {
  if (!isConfigured) {
    await delay(200);
    const txHash = fakeTxHash();
    logContractTxn(params.agentId, "completeTask", txHash, "confirmed", { taskId: params.taskId, reputationDelta: params.reputationDelta });
    return { txHash };
  }

  try {
    const signer = getAgentSigner(params.encryptedPrivateKey, ZEROG_RPC);
    const contract = new ethers.Contract(CONDUIT_ADDRESS, CONDUIT_ABI, signer);
    const tx = await contract.completeTask(params.taskId, params.reputationDelta);
    logContractTxn(params.agentId, "completeTask", tx.hash, "pending", { taskId: params.taskId, reputationDelta: params.reputationDelta });
    const receipt = await tx.wait();
    logContractTxn(params.agentId, "completeTask", receipt?.hash ?? tx.hash, "confirmed");
    return { txHash: receipt?.hash ?? tx.hash };
  } catch (err: any) {
    console.error("[conduit-contract] completeTask failed:", err);
    logContractTxn(params.agentId, "completeTask", null, "failed", undefined, err?.message);
    return { txHash: "0x0" };
  }
}

// ── Read Function ────────────────────────────────────────────────────────────────

export async function conduitGetAgent(address: string): Promise<{
  exists: boolean;
  name: string;
  chain: number;
  pricePerMinute: string;
  reputation: number;
  abilitiesMask: string;
} | null> {
  if (!isConfigured) {
    return {
      exists: false,
      name: "",
      chain: 0,
      pricePerMinute: "0",
      reputation: 0,
      abilitiesMask: "0",
    };
  }

  try {
    const provider = new ethers.JsonRpcProvider(ZEROG_RPC);
    const contract = new ethers.Contract(CONDUIT_ADDRESS, CONDUIT_ABI, provider);
    const result = await contract.agents(address);
    return {
      exists: result[0],
      name: ethers.decodeBytes32String(result[1]),
      chain: Number(result[2]),
      pricePerMinute: ethers.formatEther(result[3]),
      reputation: Number(result[4]),
      abilitiesMask: result[5].toString(),
    };
  } catch (err) {
    console.error("[conduit-contract] getAgent failed:", err);
    return null;
  }
}
