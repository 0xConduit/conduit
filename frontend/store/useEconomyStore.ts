import { create } from 'zustand';

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
        totalValueLocked: 1250000,
        systemAttestation: 0.92,
        activeProcesses: 0,
    },
    agents: {},
    connections: {},
    activePulses: {},
    selectedAgentId: null,
    viewMode: 'landing',
    activityLog: [],

    initializeNetwork: () => {
        // Scaffold initial infrastructure agents
        const initialAgents: Record<string, AgentEntity> = {
            'node-alpha': { id: 'node-alpha', role: 'router', capabilities: ['discovery', 'routing'], attestationScore: 0.99, settlementBalance: 50000, status: 'idle' },
            'worker-v7': { id: 'worker-v7', role: 'executor', capabilities: ['defi-execution', 'arbitrage'], attestationScore: 0.88, settlementBalance: 12000, status: 'idle' },
            'data-ingest': { id: 'data-ingest', role: 'executor', capabilities: ['scraping', 'parsing'], attestationScore: 0.75, settlementBalance: 2500, status: 'idle' },
            'settlement-layer': { id: 'settlement-layer', role: 'settler', capabilities: ['escrow', 'zk-verify'], attestationScore: 0.98, settlementBalance: 300000, status: 'idle' },
            'worker-v2': { id: 'worker-v2', role: 'executor', capabilities: ['content-gen'], attestationScore: 0.82, settlementBalance: 8000, status: 'idle' }
        };

        const initialConnections: Record<string, NetworkConnection> = {
            'conn-1': { id: 'conn-1', sourceAgentId: 'node-alpha', targetAgentId: 'worker-v7', bandwidth: 0.8, lastInteractionAt: Date.now() },
            'conn-2': { id: 'conn-2', sourceAgentId: 'node-alpha', targetAgentId: 'data-ingest', bandwidth: 0.4, lastInteractionAt: Date.now() },
            'conn-3': { id: 'conn-3', sourceAgentId: 'worker-v7', targetAgentId: 'settlement-layer', bandwidth: 0.9, lastInteractionAt: Date.now() },
            'conn-4': { id: 'conn-4', sourceAgentId: 'node-alpha', targetAgentId: 'worker-v2', bandwidth: 0.5, lastInteractionAt: Date.now() },
            'conn-5': { id: 'conn-5', sourceAgentId: 'data-ingest', targetAgentId: 'settlement-layer', bandwidth: 0.7, lastInteractionAt: Date.now() },
        };

        set({ agents: initialAgents, connections: initialConnections });
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
        const { connections, emitPulse, addActivityEvent, agents } = get();
        const connectionKeys = Object.keys(connections);
        if (connectionKeys.length === 0) return;

        if (Math.random() < 0.15) {
            const randomConnId = connectionKeys[Math.floor(Math.random() * connectionKeys.length)];
            const connection = connections[randomConnId];
            const source = agents[connection.sourceAgentId];
            const target = agents[connection.targetAgentId];

            const types: ActivityPulse["pulseType"][] = ['task_routed', 'payment_settled', 'attestation_recorded'];
            const randomType = types[Math.floor(Math.random() * types.length)];
            const randomValue = Math.floor(Math.random() * 5000) + 100;

            emitPulse(randomConnId, randomType, randomValue);

            let message = "";
            let eventType: ActivityEvent["type"] = "payment";

            if (randomType === 'task_routed') {
                message = `[ROUTING] Task dispatched: ${source.id} → ${target.id}`;
                eventType = "hired";
            } else if (randomType === 'payment_settled') {
                message = `[SETTLEMENT] ${randomValue} USDC settled: ${source.id} → ${target.id}`;
                eventType = "payment";
            } else {
                message = `[ATTEST] Trust attestation logged between ${source.id} & ${target.id}`;
                eventType = "trust";
            }

            addActivityEvent({ message, type: eventType });
        }
    }
}));
