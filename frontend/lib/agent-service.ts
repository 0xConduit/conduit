import type { Agent } from './types';
import { AgentRole, AgentStatus } from './types';

export interface AgentFilters {
  role?: AgentRole;
  status?: AgentStatus;
  searchQuery?: string;
}

/** Fetch all agents from the API, optionally filtered by role/status server-side */
export async function fetchAgents(filters?: { role?: AgentRole; status?: AgentStatus }): Promise<Agent[]> {
  const params = new URLSearchParams();
  if (filters?.role) params.set('role', filters.role);
  if (filters?.status) params.set('status', filters.status);

  const qs = params.toString();
  const res = await fetch(`/api/agents${qs ? `?${qs}` : ''}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch agents: ${res.status}`);
  }
  const data = await res.json();
  return data.agents as Agent[];
}

/** Fetch a single agent by Supabase UUID */
export async function fetchAgent(id: string): Promise<Agent | null> {
  const res = await fetch(`/api/agents/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Failed to fetch agent: ${res.status}`);
  }
  const data = await res.json();
  return data.agent as Agent;
}

/** Create a new agent via the API */
export async function createAgent(data: {
  name: string;
  description?: string;
  role: AgentRole;
  capabilities?: string[];
}): Promise<Agent> {
  const res = await fetch('/api/agents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `Failed to create agent: ${res.status}`);
  }
  const result = await res.json();
  return result.agent as Agent;
}

/** Client-side filtering — role, status, and search query on name */
export function filterAgents(agents: Agent[], filters: AgentFilters): Agent[] {
  return agents.filter(agent => {
    if (filters.role !== undefined && agent.role !== filters.role) return false;
    if (filters.status !== undefined && agent.status !== filters.status) return false;

    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      if (!agent.name.toLowerCase().includes(q)) return false;
    }

    return true;
  });
}

export type SortField = 'attestation_score' | 'settlement_balance' | 'capabilities' | 'created_at';
export type SortDirection = 'asc' | 'desc';

/** Sort agents by field */
export function sortAgents(agents: Agent[], field: SortField, direction: SortDirection = 'desc'): Agent[] {
  const sorted = [...agents].sort((a, b) => {
    let cmp: number;
    switch (field) {
      case 'attestation_score':
        cmp = a.attestation_score - b.attestation_score;
        break;
      case 'settlement_balance':
        cmp = a.settlement_balance - b.settlement_balance;
        break;
      case 'capabilities':
        cmp = a.capabilities.length - b.capabilities.length;
        break;
      case 'created_at':
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
    }
    return direction === 'asc' ? cmp : -cmp;
  });
  return sorted;
}
