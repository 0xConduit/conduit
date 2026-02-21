export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
  OPERATOR = "OPERATOR",
}

export enum AgentRole {
  ROUTER = "ROUTER",
  EXECUTOR = "EXECUTOR",
  SETTLER = "SETTLER",
}

export enum AgentStatus {
  IDLE = "IDLE",
  PROCESSING = "PROCESSING",
  DORMANT = "DORMANT",
}

export type LoginMethod = "email" | "google" | "github" | "wallet";

export interface User {
  id: string;
  email: string | null;
  display_name: string | null;
  wallet_address: string | null;
  role: UserRole;
  login_method: LoginMethod;
  onboarded: boolean;
}

export interface Agent {
  id: string;
  name: string;
  description: string | null;
  role: AgentRole;
  capabilities: string[];
  status: AgentStatus;
  attestation_score: number;
  settlement_balance: number;
  metadata: Record<string, unknown> | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}
