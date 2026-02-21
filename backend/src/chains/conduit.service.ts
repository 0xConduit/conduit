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

// ── ABI (human-readable) — matches Conduit.sol ─────────────────────────────────
const CONDUIT_ABI = [
  // Registration
  "function register(bytes32 name, uint8 chain, uint256 price, uint256 abilities) external",
  "function deregister() external",
  // Updates
  "function updateName(bytes32 name) external",
  "function updateChain(uint8 chain) external",
  "function updatePrice(uint256 price) external",
  "function updateAbilities(uint256 abilities) external",
  "function addAbility(uint8 ability) external",
  "function removeAbility(uint8 ability) external",
  // Jobs
  "function rentAgent(address agent, uint256 mins, string calldata prompt) external payable returns (uint256)",
  "function acceptJob(uint256 id) external",
  "function rejectJob(uint256 id) external",
  "function completeJob(uint256 id, bytes32 attestation) external",
  "function refundJob(uint256 id) external",
  // Jobs — rating
  "function rateJob(uint256 id, int8 rating) external",
  // Views — explicit getters (return full structs with all fields)
  "function getAllAgents() external view returns (tuple(address agent, bytes32 name, uint256 price, int256 reputation, uint256 abilities, uint8 chain, bool exists)[])",
  "function getAgentCount() external view returns (uint256)",
  "function getAgent(address) external view returns (tuple(address agent, bytes32 name, uint256 price, int256 reputation, uint256 abilities, uint8 chain, bool exists))",
  "function getJob(uint256 id) external view returns (tuple(uint256 id, address agent, address renter, uint256 mins, uint256 amount, bytes32 attestation, uint256 expiry, int8 rating, bool accepted, bool rejected, bool completed, bool rated, string prompt))",
  "function getAllJobs(address agent) external view returns (tuple(uint256 id, address agent, address renter, uint256 mins, uint256 amount, bytes32 attestation, uint256 expiry, int8 rating, bool accepted, bool rejected, bool completed, bool rated, string prompt)[])",
  "function getOpenJobs(address agent) external view returns (tuple(uint256 id, address agent, address renter, uint256 mins, uint256 amount, bytes32 attestation, uint256 expiry, int8 rating, bool accepted, bool rejected, bool completed, bool rated, string prompt)[])",
  // Events
  "event AgentRegistered(address indexed agent, bytes32 name, uint8 chain, uint256 price, uint256 abilities)",
  "event AgentUpdated(address indexed agent, bytes32 name, uint8 chain, uint256 price, uint256 abilities)",
  "event AgentDeregistered(address indexed agent)",
  "event JobCreated(uint256 indexed id, address indexed agent, address indexed renter, uint256 mins, uint256 amount, uint256 expiry)",
  "event JobAccepted(uint256 indexed id, uint256 expiry)",
  "event JobRejected(uint256 indexed id)",
  "event JobCompleted(uint256 indexed id, bytes32 attestation)",
  "event JobRefunded(uint256 indexed id)",
  "event JobRated(uint256 indexed id, int8 rating)",
  "event ReputationUpdated(address indexed agent, int256 reputation)",
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

// Chain enum matching Conduit.sol: BASE=0, HEDERA=1, KITEAI=2, ZEROG=3
const CHAIN_ENUM: Record<string, number> = { base: 0, hedera: 1, kiteai: 2, zerog: 3, "0g": 3 };

// ── Helpers ──────────────────────────────────────────────────────────────────────
function stringToBytes32(s: string): string {
  return ethers.encodeBytes32String(s.slice(0, 31));
}

function bytes32ToString(b: string): string {
  try {
    return ethers.decodeBytes32String(b);
  } catch {
    return b;
  }
}

const fakeTxHash = () =>
  "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function getProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(ZEROG_RPC);
}

function getReadContract(providerOrSigner?: ethers.Provider | ethers.Signer): ethers.Contract {
  return new ethers.Contract(CONDUIT_ADDRESS, CONDUIT_ABI, providerOrSigner ?? getProvider());
}

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
    const provider = getProvider();
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
    console.log(`[conduit-stub] register ${agentId} name=${name} — tx=${txHash}`);
    logContractTxn(agentId, "register", txHash, "confirmed", { name, chain, pricePerMinute, abilitiesMask });
    return { txHash };
  }

  try {
    const signer = getAgentSigner(params.encryptedPrivateKey, ZEROG_RPC);
    const contract = getReadContract(signer);
    const chainEnum = CHAIN_ENUM[chain] ?? 0;
    const tx = await contract.register(
      stringToBytes32(name),
      chainEnum,
      ethers.parseEther(pricePerMinute),
      BigInt(abilitiesMask)
    );
    console.log(`[conduit-contract] register tx sent: ${tx.hash}`);
    logContractTxn(agentId, "register", tx.hash, "pending", { name, chain, pricePerMinute, abilitiesMask });
    const receipt = await tx.wait();
    logContractTxn(agentId, "register", receipt?.hash ?? tx.hash, "confirmed");
    return { txHash: receipt?.hash ?? tx.hash };
  } catch (err: any) {
    console.error("[conduit-contract] register failed:", err);
    logContractTxn(agentId, "register", null, "failed", undefined, err?.message);
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
    const contract = getReadContract(signer);
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
    const contract = getReadContract(signer);
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
    const contract = getReadContract(signer);
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
    logContractTxn(params.agentId, "updatePrice", txHash, "confirmed", { pricePerMinute: params.pricePerMinute });
    return { txHash };
  }

  try {
    const signer = getAgentSigner(params.encryptedPrivateKey, ZEROG_RPC);
    const contract = getReadContract(signer);
    const tx = await contract.updatePrice(ethers.parseEther(params.pricePerMinute));
    logContractTxn(params.agentId, "updatePrice", tx.hash, "pending", { pricePerMinute: params.pricePerMinute });
    const receipt = await tx.wait();
    logContractTxn(params.agentId, "updatePrice", receipt?.hash ?? tx.hash, "confirmed");
    return { txHash: receipt?.hash ?? tx.hash };
  } catch (err: any) {
    console.error("[conduit-contract] updatePrice failed:", err);
    logContractTxn(params.agentId, "updatePrice", null, "failed", undefined, err?.message);
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
    logContractTxn(params.agentId, "updateAbilities", txHash, "confirmed", { abilitiesMask: params.abilitiesMask });
    return { txHash };
  }

  try {
    const signer = getAgentSigner(params.encryptedPrivateKey, ZEROG_RPC);
    const contract = getReadContract(signer);
    const tx = await contract.updateAbilities(BigInt(params.abilitiesMask));
    logContractTxn(params.agentId, "updateAbilities", tx.hash, "pending", { abilitiesMask: params.abilitiesMask });
    const receipt = await tx.wait();
    logContractTxn(params.agentId, "updateAbilities", receipt?.hash ?? tx.hash, "confirmed");
    return { txHash: receipt?.hash ?? tx.hash };
  } catch (err: any) {
    console.error("[conduit-contract] updateAbilities failed:", err);
    logContractTxn(params.agentId, "updateAbilities", null, "failed", undefined, err?.message);
    return { txHash: "0x0" };
  }
}

export async function conduitRentAgent(params: {
  agentId: string;
  encryptedPrivateKey: string;
  targetAddress: string;
  minutes: number;
  valueEth: string;
  prompt?: string;
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
    const contract = getReadContract(signer);
    const prompt = params.prompt ?? "";
    const tx = await contract.rentAgent(params.targetAddress, params.minutes, prompt, {
      value: ethers.parseEther(params.valueEth),
    });
    logContractTxn(params.agentId, "rentAgent", tx.hash, "pending", { target: params.targetAddress, minutes: params.minutes });
    const receipt = await tx.wait();
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
    const contract = getReadContract(signer);
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
    const contract = getReadContract(signer);
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
    const contract = getReadContract(signer);
    const attestationBytes = stringToBytes32(params.attestation || "done");
    const tx = await contract.completeJob(params.jobId, attestationBytes);
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
    const contract = getReadContract(signer);
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

export async function conduitRateJob(params: {
  agentId: string;
  encryptedPrivateKey: string;
  jobId: number;
  rating: number;
}): Promise<{ txHash: string }> {
  if (!isConfigured) {
    await delay(200);
    const txHash = fakeTxHash();
    logContractTxn(params.agentId, "rateJob", txHash, "confirmed", { jobId: params.jobId, rating: params.rating });
    return { txHash };
  }

  try {
    const signer = getAgentSigner(params.encryptedPrivateKey, ZEROG_RPC);
    const contract = getReadContract(signer);
    const tx = await contract.rateJob(params.jobId, params.rating);
    logContractTxn(params.agentId, "rateJob", tx.hash, "pending", { jobId: params.jobId, rating: params.rating });
    const receipt = await tx.wait();
    logContractTxn(params.agentId, "rateJob", receipt?.hash ?? tx.hash, "confirmed");
    return { txHash: receipt?.hash ?? tx.hash };
  } catch (err: any) {
    console.error("[conduit-contract] rateJob failed:", err);
    logContractTxn(params.agentId, "rateJob", null, "failed", undefined, err?.message);
    return { txHash: "0x0" };
  }
}

// ── Read Functions ───────────────────────────────────────────────────────────────

export async function conduitGetAgent(address: string): Promise<OnChainAgent | null> {
  if (!isConfigured) {
    return {
      address,
      exists: false,
      name: "",
      chain: 0,
      pricePerMinute: "0",
      reputation: 0,
      abilitiesMask: "0",
    };
  }

  try {
    const contract = getReadContract();
    const result = await contract.getAgent(address);
    return {
      address: result.agent,
      exists: result.exists,
      name: bytes32ToString(result.name),
      chain: Number(result.chain),
      pricePerMinute: ethers.formatEther(result.price),
      reputation: Number(result.reputation),
      abilitiesMask: result.abilities.toString(),
    };
  } catch (err) {
    console.error("[conduit-contract] getAgent failed:", err);
    return null;
  }
}

export interface OnChainAgent {
  address: string;
  exists: boolean;
  name: string;
  chain: number;
  pricePerMinute: string;
  reputation: number;
  abilitiesMask: string;
}

export interface OnChainJob {
  jobId: number;
  agent: string;
  renter: string;
  mins: number;
  amount: string;
  attestation: string;
  expiry: number;
  rating: number;
  accepted: boolean;
  rejected: boolean;
  completed: boolean;
  rated: boolean;
  prompt: string;
}

function parseJobTuple(j: any): OnChainJob {
  return {
    jobId: Number(j.id),
    agent: j.agent,
    renter: j.renter,
    mins: Number(j.mins),
    amount: ethers.formatEther(j.amount),
    attestation: bytes32ToString(j.attestation),
    expiry: Number(j.expiry),
    rating: Number(j.rating),
    accepted: j.accepted,
    rejected: j.rejected,
    completed: j.completed,
    rated: j.rated,
    prompt: j.prompt,
  };
}

export async function conduitGetJob(jobId: number): Promise<OnChainJob | null> {
  if (!isConfigured) {
    console.log(`[conduit-stub] getJob(${jobId})`);
    return null;
  }

  try {
    const contract = getReadContract();
    const result = await contract.getJob(jobId);
    if (result.agent === ethers.ZeroAddress) return null;
    return parseJobTuple(result);
  } catch (err) {
    console.error("[conduit-contract] getJob failed:", err);
    return null;
  }
}

export async function conduitGetJobCount(): Promise<number> {
  if (!isConfigured) {
    console.log("[conduit-stub] getJobCount");
    return 0;
  }

  try {
    const contract = getReadContract();
    // counter is private, so count via JobCreated events
    const filter = contract.filters.JobCreated();
    const events = await contract.queryFilter(filter, 0, "latest");
    return events.length;
  } catch (err) {
    console.error("[conduit-contract] getJobCount failed:", err);
    return 0;
  }
}

export async function conduitGetBalance(address: string): Promise<string> {
  if (!isConfigured) {
    console.log(`[conduit-stub] getBalance(${address})`);
    return "0";
  }

  try {
    const provider = getProvider();
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (err) {
    console.error("[conduit-contract] getBalance failed:", err);
    return "0";
  }
}

export async function conduitGetContractBalance(): Promise<string> {
  return conduitGetBalance(CONDUIT_ADDRESS);
}

export interface ContractEvent {
  eventName: string;
  blockNumber: number;
  transactionHash: string;
  args: Record<string, string>;
}

export async function conduitQueryEvents(params: {
  eventType?: string;
  agentAddress?: string;
  jobId?: number;
  fromBlock?: number;
  toBlock?: number | string;
  limit?: number;
}): Promise<ContractEvent[]> {
  if (!isConfigured) {
    console.log("[conduit-stub] queryEvents", params);
    return [];
  }

  try {
    const contract = getReadContract();
    const fromBlock = params.fromBlock ?? 0;
    const toBlock = params.toBlock ?? "latest";

    let filter: ethers.ContractEventName;
    if (params.eventType) {
      // Use specific event filter
      switch (params.eventType) {
        case "JobCreated":
          filter = contract.filters.JobCreated(
            params.jobId ?? null,
            params.agentAddress ?? null,
            null
          );
          break;
        case "JobAccepted":
          filter = contract.filters.JobAccepted(params.jobId ?? null);
          break;
        case "JobRejected":
          filter = contract.filters.JobRejected(params.jobId ?? null);
          break;
        case "JobCompleted":
          filter = contract.filters.JobCompleted(params.jobId ?? null);
          break;
        case "JobRefunded":
          filter = contract.filters.JobRefunded(params.jobId ?? null);
          break;
        case "AgentRegistered":
          filter = contract.filters.AgentRegistered(params.agentAddress ?? null);
          break;
        case "AgentUpdated":
          filter = contract.filters.AgentUpdated(params.agentAddress ?? null);
          break;
        case "AgentDeregistered":
          filter = contract.filters.AgentDeregistered(params.agentAddress ?? null);
          break;
        case "JobRated":
          filter = contract.filters.JobRated(params.jobId ?? null);
          break;
        case "ReputationUpdated":
          filter = contract.filters.ReputationUpdated(params.agentAddress ?? null);
          break;
        default:
          filter = "*";
      }
    } else {
      filter = "*";
    }

    const rawEvents = await contract.queryFilter(filter, fromBlock, toBlock);
    const limit = params.limit ?? 100;
    const sliced = rawEvents.slice(-limit);

    const iface = new ethers.Interface(CONDUIT_ABI);
    return sliced.map((ev) => {
      const parsed = ev instanceof ethers.EventLog ? ev : null;
      const args: Record<string, string> = {};
      if (parsed && parsed.args) {
        const fragment = parsed.fragment;
        if (fragment && fragment.inputs) {
          fragment.inputs.forEach((input, i) => {
            args[input.name] = parsed.args[i]?.toString() ?? "";
          });
        }
      } else {
        // Try manual parse for non-EventLog
        try {
          const log = iface.parseLog({ topics: ev.topics as string[], data: ev.data });
          if (log) {
            log.fragment.inputs.forEach((input, i) => {
              args[input.name] = log.args[i]?.toString() ?? "";
            });
          }
        } catch { /* unparsable */ }
      }
      return {
        eventName: parsed?.eventName ?? "Unknown",
        blockNumber: ev.blockNumber,
        transactionHash: ev.transactionHash,
        args,
      };
    });
  } catch (err) {
    console.error("[conduit-contract] queryEvents failed:", err);
    return [];
  }
}

export async function conduitGetJobsForAgent(agentAddress: string): Promise<OnChainJob[]> {
  if (!isConfigured) {
    console.log(`[conduit-stub] getJobsForAgent(${agentAddress})`);
    return [];
  }

  try {
    const contract = getReadContract();
    const jobs = await contract.getAllJobs(agentAddress);
    return jobs.map(parseJobTuple);
  } catch (err) {
    console.error("[conduit-contract] getJobsForAgent failed:", err);
    return [];
  }
}

export async function conduitGetAllAgents(): Promise<OnChainAgent[]> {
  if (!isConfigured) {
    console.log("[conduit-stub] getAllAgents");
    return [];
  }

  try {
    const contract = getReadContract();
    const agents = await contract.getAllAgents();
    return agents.map((a: any) => ({
      address: a.agent,
      exists: a.exists,
      name: bytes32ToString(a.name),
      chain: Number(a.chain),
      pricePerMinute: ethers.formatEther(a.price),
      reputation: Number(a.reputation),
      abilitiesMask: a.abilities.toString(),
    }));
  } catch (err) {
    console.error("[conduit-contract] getAllAgents failed:", err);
    return [];
  }
}

export async function conduitGetAgentCount(): Promise<number> {
  if (!isConfigured) {
    console.log("[conduit-stub] getAgentCount");
    return 0;
  }

  try {
    const contract = getReadContract();
    const count = await contract.getAgentCount();
    return Number(count);
  } catch (err) {
    console.error("[conduit-contract] getAgentCount failed:", err);
    return 0;
  }
}

export async function conduitGetOpenJobs(agentAddress: string): Promise<OnChainJob[]> {
  if (!isConfigured) {
    console.log(`[conduit-stub] getOpenJobs(${agentAddress})`);
    return [];
  }

  try {
    const contract = getReadContract();
    const jobs = await contract.getOpenJobs(agentAddress);
    return jobs.map(parseJobTuple);
  } catch (err) {
    console.error("[conduit-contract] getOpenJobs failed:", err);
    return [];
  }
}
