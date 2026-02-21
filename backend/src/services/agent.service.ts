import { getDb } from "../db/connection.js";
import type { AgentEntity, AgentRole, DeployedChain } from "../shared/types.js";
import { zerogNFT } from "../chains/zerog.stub.js";
import { generateAgentWallet } from "./wallet.service.js";
import { fundAgentWallet, conduitRegisterAgent } from "../chains/conduit.service.js";

function rowToAgent(row: Record<string, unknown>): AgentEntity {
  return {
    id: row.id as string,
    role: row.role as AgentRole,
    capabilities: JSON.parse(row.capabilities as string),
    attestationScore: row.attestation_score as number,
    settlementBalance: row.settlement_balance as number,
    status: row.status as AgentEntity["status"],
    deployedChain: (row.deployed_chain as DeployedChain) ?? "base",
    inftTokenId: (row.inft_token_id as string) || undefined,
    walletAddress: (row.wallet_address as string) || undefined,
    conduitRegistered: (row.conduit_registered as number) === 1,
    conduitTxHash: (row.conduit_tx_hash as string) || undefined,
    createdAt: row.created_at as number,
    updatedAt: row.updated_at as number,
  };
}

const generateId = () => Math.random().toString(36).substring(2, 11);

export async function registerAgent(params: {
  id?: string;
  role: AgentRole;
  capabilities: string[];
  deployedChain?: DeployedChain;
  conduitName?: string;
  conduitPrice?: string;
  conduitAbilities?: string;
}): Promise<AgentEntity> {
  const db = getDb();
  const now = Date.now();
  const id = params.id || `agent-${generateId()}`;
  const chain: DeployedChain = params.deployedChain ?? "base";

  // Generate wallet for the agent
  let walletAddress: string | null = null;
  let encryptedPrivateKey: string | null = null;
  try {
    const wallet = generateAgentWallet();
    walletAddress = wallet.address;
    encryptedPrivateKey = wallet.encryptedPrivateKey;
    console.log(`[conduit] Wallet generated for ${id}: ${walletAddress}`);
  } catch (err) {
    console.warn(`[conduit] Wallet generation failed for ${id}:`, err);
  }

  db.prepare(
    "INSERT INTO agents (id, role, capabilities, attestation_score, settlement_balance, status, deployed_chain, inft_token_id, wallet_address, encrypted_private_key, conduit_registered, conduit_tx_hash, created_at, updated_at) VALUES (?, ?, ?, 0.5, 0, 'idle', ?, NULL, ?, ?, 0, NULL, ?, ?)"
  ).run(id, params.role, JSON.stringify(params.capabilities), chain, walletAddress, encryptedPrivateKey, now, now);

  // Mint an INFT identity token for every agent on every chain
  try {
    const nftResult = await zerogNFT.mintAgentNFT({
      agentId: id,
      metadata: { role: params.role, capabilities: params.capabilities, chain },
    });
    db.prepare("UPDATE agents SET inft_token_id = ? WHERE id = ?").run(nftResult.tokenId, id);
    console.log(`[conduit] INFT minted for ${id}: tokenId=${nftResult.tokenId} txHash=${nftResult.txHash}`);
  } catch (err) {
    console.warn(`[conduit] INFT mint failed for ${id}:`, err);
  }

  // Fund agent wallet with gas and optionally register on Conduit contract
  if (walletAddress && encryptedPrivateKey) {
    try {
      await fundAgentWallet(walletAddress, "0.01");
      console.log(`[conduit] Gas funded for ${id}: ${walletAddress}`);
    } catch (err) {
      console.warn(`[conduit] Gas funding failed for ${id}:`, err);
    }

    if (params.conduitName) {
      try {
        const result = await conduitRegisterAgent({
          agentId: id,
          encryptedPrivateKey,
          name: params.conduitName,
          chain: chain,
          pricePerMinute: params.conduitPrice ?? "0",
          abilitiesMask: params.conduitAbilities ?? "0",
        });
        db.prepare("UPDATE agents SET conduit_registered = 1, conduit_tx_hash = ? WHERE id = ?")
          .run(result.txHash, id);
        console.log(`[conduit] Registered on Conduit contract: ${id} tx=${result.txHash}`);
      } catch (err) {
        console.warn(`[conduit] Conduit registration failed for ${id}:`, err);
      }
    }
  }

  return getAgent(id)!;
}

export function getAgent(agentId: string): AgentEntity | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM agents WHERE id = ?").get(agentId) as Record<string, unknown> | null;
  return row ? rowToAgent(row) : null;
}

export function listAgents(): AgentEntity[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM agents ORDER BY created_at ASC").all() as Record<string, unknown>[];
  return rows.map(rowToAgent);
}

export function discoverAgents(params: {
  capabilities?: string[];
  role?: AgentRole;
  minReputation?: number;
}): AgentEntity[] {
  const agents = listAgents();
  return agents.filter((agent) => {
    if (params.role && agent.role !== params.role) return false;
    if (params.minReputation !== undefined && agent.attestationScore < params.minReputation) return false;
    if (params.capabilities && params.capabilities.length > 0) {
      const hasCapability = params.capabilities.some((cap) =>
        agent.capabilities.includes(cap)
      );
      if (!hasCapability) return false;
    }
    return true;
  });
}

export function updateAgentStatus(
  agentId: string,
  status: AgentEntity["status"]
): AgentEntity | null {
  const db = getDb();
  const now = Date.now();
  db.prepare("UPDATE agents SET status = ?, updated_at = ? WHERE id = ?").run(
    status,
    now,
    agentId
  );
  return getAgent(agentId);
}

export function updateAgentBalance(agentId: string, delta: number): void {
  const db = getDb();
  const now = Date.now();
  db.prepare(
    "UPDATE agents SET settlement_balance = settlement_balance + ?, updated_at = ? WHERE id = ?"
  ).run(delta, now, agentId);
}

export function updateAgentAttestationScore(agentId: string): void {
  const db = getDb();
  const now = Date.now();
  const result = db
    .prepare("SELECT AVG(score) as avg_score FROM attestations WHERE agent_id = ?")
    .get(agentId) as { avg_score: number | null } | null;
  const avgScore = result?.avg_score ?? 0.5;
  db.prepare(
    "UPDATE agents SET attestation_score = ?, updated_at = ? WHERE id = ?"
  ).run(avgScore, now, agentId);
}

/** Internal-only: retrieve encrypted private key for an agent (never expose to clients) */
export function getAgentEncryptedKey(agentId: string): string | null {
  const db = getDb();
  const row = db.prepare("SELECT encrypted_private_key FROM agents WHERE id = ?").get(agentId) as { encrypted_private_key: string | null } | null;
  return row?.encrypted_private_key ?? null;
}

/** Internal-only: retrieve wallet address for an agent */
export function getAgentWalletAddress(agentId: string): string | null {
  const db = getDb();
  const row = db.prepare("SELECT wallet_address FROM agents WHERE id = ?").get(agentId) as { wallet_address: string | null } | null;
  return row?.wallet_address ?? null;
}
