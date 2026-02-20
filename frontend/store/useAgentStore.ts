import { create } from 'zustand';
import type { Agent } from '../lib/types';
import {
  type AgentFilters,
  type SortField,
  type SortDirection,
  fetchAgents,
  fetchAgent,
  createAgent as createAgentApi,
  filterAgents,
  sortAgents,
} from '../lib/agent-service';

interface AgentState {
  agents: Agent[];
  selectedAgent: Agent | null;
  isLoading: boolean;
  error: string | null;
  filters: AgentFilters;
  sortField: SortField;
  sortDirection: SortDirection;
  filteredAgents: Agent[];

  loadAgents: () => Promise<void>;
  selectAgent: (id: string) => Promise<void>;
  createAgent: (data: { name: string; description?: string; role: Agent['role']; capabilities?: string[] }) => Promise<Agent>;
  setFilters: (filters: AgentFilters) => void;
  clearFilters: () => void;
  setSort: (field: SortField, direction?: SortDirection) => void;
}

function applyFiltersAndSort(
  agents: Agent[],
  filters: AgentFilters,
  sortField: SortField,
  sortDirection: SortDirection,
): Agent[] {
  const filtered = filterAgents(agents, filters);
  return sortAgents(filtered, sortField, sortDirection);
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: [],
  selectedAgent: null,
  isLoading: false,
  error: null,
  filters: {},
  sortField: 'attestation_score',
  sortDirection: 'desc',
  filteredAgents: [],

  loadAgents: async () => {
    set({ isLoading: true, error: null });
    try {
      const agents = await fetchAgents();
      const { filters, sortField, sortDirection } = get();
      set({
        agents,
        filteredAgents: applyFiltersAndSort(agents, filters, sortField, sortDirection),
        isLoading: false,
      });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },

  selectAgent: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const agent = await fetchAgent(id);
      set({ selectedAgent: agent, isLoading: false });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },

  createAgent: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const agent = await createAgentApi(data);
      const { agents, filters, sortField, sortDirection } = get();
      const updated = [agent, ...agents];
      set({
        agents: updated,
        filteredAgents: applyFiltersAndSort(updated, filters, sortField, sortDirection),
        isLoading: false,
      });
      return agent;
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
      throw e;
    }
  },

  setFilters: (filters: AgentFilters) => {
    const { agents, sortField, sortDirection } = get();
    set({
      filters,
      filteredAgents: applyFiltersAndSort(agents, filters, sortField, sortDirection),
    });
  },

  clearFilters: () => {
    const { agents, sortField, sortDirection } = get();
    set({
      filters: {},
      filteredAgents: applyFiltersAndSort(agents, {}, sortField, sortDirection),
    });
  },

  setSort: (field: SortField, direction?: SortDirection) => {
    const dir = direction ?? (field === get().sortField && get().sortDirection === 'desc' ? 'asc' : 'desc');
    const { agents, filters } = get();
    set({
      sortField: field,
      sortDirection: dir,
      filteredAgents: applyFiltersAndSort(agents, filters, field, dir),
    });
  },
}));
