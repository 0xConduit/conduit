// Shared TypeScript types — mirrors frontend store interfaces

export type AgentRole = "router" | "executor" | "settler";
export type DeployedChain = "base" | "hedera" | "zerog" | "0g";

export interface AgentEntity {
  id: string;
  role: AgentRole;
  capabilities: string[];
  attestationScore: number; // 0.0 to 1.0
  settlementBalance: number;
  status: "idle" | "processing" | "dormant";
  deployedChain: DeployedChain;
  inftTokenId?: string;       // INFT token ID from AgentNFT contract (0G chain)
  walletAddress?: string;     // agent's own wallet address
  conduitRegistered?: boolean; // whether on-chain Conduit registration succeeded
  conduitTxHash?: string;     // the registerAgent tx hash
  createdAt: number;
  updatedAt: number;
}

export interface NetworkConnection {
  id: string;
  sourceAgentId: string;
  targetAgentId: string;
  bandwidth: number; // 0.0 to 1.0
  lastInteractionAt: number;
}

export interface ActivityEvent {
  id: string;
  timestamp: number;
  message: string;
  type: "hired" | "payment" | "trust";
  connectionId?: string;
  taskId?: string;
}

export type TaskStatus = "pending" | "dispatched" | "completed" | "failed";

export interface Task {
  id: string;
  title: string;
  description?: string;
  requirements: string[];
  status: TaskStatus;
  requesterAgentId: string;
  assignedAgentId?: string;
  escrowAmount?: number;
  result?: string;
  createdAt: number;
  completedAt?: number;
  chainTxHash?: string;
}

export interface Attestation {
  id: string;
  agentId: string;
  attesterId: string;
  taskId?: string;
  score: number;
  metadata?: Record<string, unknown>;
  chain?: string;
  chainTxHash?: string;
  createdAt: number;
}

export type EscrowStatus = "locked" | "released" | "refunded";

export interface Escrow {
  id: string;
  taskId: string;
  payerAgentId: string;
  payeeAgentId?: string;
  amount: number;
  status: EscrowStatus;
  chain?: string;
  chainTxHash?: string;
  createdAt: number;
  settledAt?: number;
}

export interface Vitals {
  totalValueLocked: number;
  systemAttestation: number;
  activeProcesses: number;
}
