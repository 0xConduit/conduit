import { create } from 'zustand';
import type { Agent } from '../lib/types';
import { AgentRole as DbAgentRole } from '../lib/types';

export type AgentRole = "router" | "executor" | "settler";

export interface AgentEntity {
    id: string;
    role: AgentRole;
    capabilities: string[];
    attestationScore: number; // 0.0 to 1.0
    settlementBalance: number;
    status: "idle" | "processing" | "dormant";
}

export interface NetworkConnection {
    id: string;
    sourceAgentId: string;
    targetAgentId: string;
    bandwidth: number; // 0.0 to 1.0 (thickness)
    lastInteractionAt: number;
}

export interface ActivityPulse {
    id: string;
    connectionId: string;
    pulseType: "task_routed" | "payment_settled" | "attestation_recorded";
    value: number; // Value transferred
}

export interface ActivityEvent {
    id: string;
    timestamp: number;
    message: string;
    type: "hired" | "payment" | "trust";
}

interface EconomyState {
    vitals: {
        totalValueLocked: number;
        systemAttestation: number;
        activeProcesses: number;
    };
    agents: Record<string, AgentEntity>;
    connections: Record<string, NetworkConnection>;
    activePulses: Record<string, ActivityPulse>;
    selectedAgentId: string | null;
    viewMode: 'landing' | 'explore';
    activityLog: ActivityEvent[];

    // Actions
    initializeNetwork: () => void;
    initializeFromContractAgents: (agents: Agent[]) => void;
    emitPulse: (connectionId: string, pulseType: ActivityPulse["pulseType"], value: number) => void;
    removePulse: (pulseId: string) => void;
    setSelectedAgent: (id: string | null) => void;
    setViewMode: (mode: 'landing' | 'explore') => void;
    addActivityEvent: (event: Omit<ActivityEvent, 'id' | 'timestamp'>) => void;
    networkTick: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useEconomyStore = create<EconomyState>((set, get) => ({
    vitals: {
        totalValueLocked: 0,
        systemAttestation: 0,
        activeProcesses: 0,
    },
    agents: {},
    connections: {},
    activePulses: {},
    selectedAgentId: null,
    viewMode: 'landing',
    activityLog: [],

    initializeNetwork: () => {
        // No-op — will be populated by real data sources
    },

    initializeFromContractAgents: (dbAgents: Agent[]) => {
        const ROLE_MAP: Record<DbAgentRole, AgentRole> = {
            [DbAgentRole.ROUTER]: 'router',
            [DbAgentRole.EXECUTOR]: 'executor',
            [DbAgentRole.SETTLER]: 'settler',
        };

        const agentEntities: Record<string, AgentEntity> = {};
        for (const a of dbAgents) {
            agentEntities[a.id] = {
                id: a.id,
                role: ROLE_MAP[a.role] ?? 'executor',
                capabilities: a.capabilities,
                attestationScore: a.attestation_score,
                settlementBalance: a.settlement_balance,
                status: a.status.toLowerCase() as AgentEntity['status'],
            };
        }
        set({ agents: agentEntities });
    },

    emitPulse: (connectionId, pulseType, value) => {
        const pulseId = `pulse-${generateId()}`;
        const pulse: ActivityPulse = { id: pulseId, connectionId, pulseType, value };

        set((state) => ({
            activePulses: { ...state.activePulses, [pulseId]: pulse }
        }));

        setTimeout(() => {
            get().removePulse(pulseId);
        }, 1500); // Faster, more mechanical pulse duration
    },

    removePulse: (pulseId) => {
        set((state) => {
            const newPulses = { ...state.activePulses };
            delete newPulses[pulseId];
            return { activePulses: newPulses };
        });
    },

    setSelectedAgent: (id) => set({ selectedAgentId: id }),
    setViewMode: (mode) => set({ viewMode: mode }),

    addActivityEvent: (event) => {
        set((state) => ({
            activityLog: [
                { ...event, id: `evt-${generateId()}`, timestamp: Date.now() },
                ...state.activityLog
            ].slice(0, 50)
        }));
    },

    networkTick: () => {
        // No-op — will be driven by real network events
    }
}));
