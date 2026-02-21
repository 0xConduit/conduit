import { create } from 'zustand';

export type AgentRole = "router" | "executor" | "settler";
export type DeployedChain = "base" | "hedera" | "zerog" | "0g";

export interface AgentEntity {
    id: string;
    role: AgentRole;
    capabilities: string[];
    attestationScore: number;
    settlementBalance: number;
    status: "idle" | "processing" | "dormant";
    deployedChain?: DeployedChain;
    inftTokenId?: string;
    walletAddress?: string;
    conduitRegistered?: boolean;
    conduitTxHash?: string;
    createdAt?: number;
    updatedAt?: number;
}

export interface NetworkConnection {
    id: string;
    sourceAgentId: string;
    targetAgentId: string;
    bandwidth: number;
    lastInteractionAt: number;
}

export interface ActivityPulse {
    id: string;
    connectionId: string;
    pulseType: "task_routed" | "payment_settled" | "attestation_recorded";
    value: number;
}

export interface ActivityEvent {
    id: string;
    timestamp: number;
    message: string;
    type: "hired" | "payment" | "trust";
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

export interface ContractEvent {
    eventName: string;
    blockNumber: number;
    transactionHash: string;
    args: Record<string, string>;
}

interface Vitals {
    totalValueLocked: number;
    systemAttestation: number;
    activeProcesses: number;
}

interface EconomyState {
    vitals: Vitals;
    agents: Record<string, AgentEntity>;
    connections: Record<string, NetworkConnection>;
    activePulses: Record<string, ActivityPulse>;
    selectedAgentId: string | null;
    viewMode: 'landing' | 'explore';
    activityLog: ActivityEvent[];
    backendAvailable: boolean;
    lastActivityTimestamp: number;
    tasks: Record<string, Task>;
    actionPanelOpen: boolean;

    initializeNetwork: () => void;
    emitPulse: (connectionId: string, pulseType: ActivityPulse["pulseType"], value: number) => void;
    removePulse: (pulseId: string) => void;
    setSelectedAgent: (id: string | null) => void;
    setViewMode: (mode: 'landing' | 'explore') => void;
    addActivityEvent: (event: Omit<ActivityEvent, 'id' | 'timestamp'>) => void;
    networkTick: () => void;
    setActionPanelOpen: (open: boolean) => void;
    registerAgent: (params: { id?: string; role: AgentRole; capabilities: string[]; deployedChain: DeployedChain; conduitName?: string; conduitPrice?: string; conduitAbilities?: string }) => Promise<AgentEntity | null>;
    createTask: (params: { title: string; description?: string; requirements: string[]; requesterAgentId: string; escrowAmount?: number }) => Promise<Task | null>;
    dispatchTask: (taskId: string, agentId: string) => Promise<Task | null>;
    completeTask: (taskId: string, result?: string, attestationScore?: number) => Promise<Task | null>;

    // Contract write operations
    contractRegister: (agentId: string, params: { name: string; chain?: string; pricePerMinute?: string; abilitiesMask?: string }) => Promise<{ txHash: string } | null>;
    contractDeregister: (agentId: string) => Promise<{ txHash: string } | null>;
    contractUpdate: (agentId: string, params: { name?: string; chain?: string; pricePerMinute?: string; abilitiesMask?: string }) => Promise<{ updates: { field: string; txHash: string }[] } | null>;
    contractRentAgent: (agentId: string, params: { targetAgentId: string; minutes: number; valueEth: string }) => Promise<{ txHash: string; jobId?: string } | null>;
    contractAcceptJob: (agentId: string, jobId: number) => Promise<{ txHash: string } | null>;
    contractRejectJob: (agentId: string, jobId: number) => Promise<{ txHash: string } | null>;
    contractCompleteJob: (agentId: string, jobId: number, attestation: string) => Promise<{ txHash: string } | null>;
    contractRefundJob: (agentId: string, jobId: number) => Promise<{ txHash: string } | null>;
    contractRateJob: (agentId: string, jobId: number, rating: number) => Promise<{ txHash: string } | null>;
    contractGetOnChainState: (agentId: string) => Promise<Record<string, unknown> | null>;
    fundAgent: (agentId: string, amountEth?: string) => Promise<{ txHash: string } | null>;

    // Contract read operations
    contractGetJob: (jobId: number) => Promise<OnChainJob | null>;
    contractGetJobCount: () => Promise<{ count: number; jobs?: OnChainJob[] }>;
    contractGetBalance: (address: string) => Promise<{ address: string; balance: string } | null>;
    contractGetContractBalance: () => Promise<{ balance: string } | null>;
    contractQueryEvents: (params?: { type?: string; agent?: string; jobId?: number; fromBlock?: number; limit?: number }) => Promise<ContractEvent[]>;
    contractGetAgentJobs: (agentId: string) => Promise<OnChainJob[]>;
    contractGetAllAgents: () => Promise<OnChainAgent[]>;
    contractGetAgentCount: () => Promise<number>;
    contractGetOpenJobs: (agentId: string) => Promise<OnChainJob[]>;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const fallbackAgents: Record<string, AgentEntity> = {
    'node-alpha':       { id: 'node-alpha',       role: 'router',   capabilities: ['discovery', 'routing'],        attestationScore: 0.99, settlementBalance: 50000,  status: 'idle', deployedChain: 'base' },
    'worker-v7':        { id: 'worker-v7',        role: 'executor', capabilities: ['defi-execution', 'arbitrage'], attestationScore: 0.88, settlementBalance: 12000,  status: 'idle', deployedChain: 'base' },
    'data-ingest':      { id: 'data-ingest',      role: 'executor', capabilities: ['scraping', 'parsing'],         attestationScore: 0.75, settlementBalance: 2500,   status: 'idle', deployedChain: 'hedera' },
    'settlement-layer': { id: 'settlement-layer', role: 'settler',  capabilities: ['escrow', 'zk-verify'],         attestationScore: 0.98, settlementBalance: 300000, status: 'idle', deployedChain: 'zerog' },
    'worker-v2':        { id: 'worker-v2',        role: 'executor', capabilities: ['content-gen'],                 attestationScore: 0.82, settlementBalance: 8000,   status: 'idle', deployedChain: '0g' },
};

const fallbackConnections: Record<string, NetworkConnection> = {
    'conn-1': { id: 'conn-1', sourceAgentId: 'node-alpha',  targetAgentId: 'worker-v7',        bandwidth: 0.8, lastInteractionAt: Date.now() },
    'conn-2': { id: 'conn-2', sourceAgentId: 'node-alpha',  targetAgentId: 'data-ingest',      bandwidth: 0.4, lastInteractionAt: Date.now() },
    'conn-3': { id: 'conn-3', sourceAgentId: 'worker-v7',   targetAgentId: 'settlement-layer', bandwidth: 0.9, lastInteractionAt: Date.now() },
    'conn-4': { id: 'conn-4', sourceAgentId: 'node-alpha',  targetAgentId: 'worker-v2',        bandwidth: 0.5, lastInteractionAt: Date.now() },
    'conn-5': { id: 'conn-5', sourceAgentId: 'data-ingest', targetAgentId: 'settlement-layer', bandwidth: 0.7, lastInteractionAt: Date.now() },
};

async function fetchJson<T>(url: string): Promise<T | null> {
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        return await res.json() as T;
    } catch {
        return null;
    }
}

async function postJson<T>(url: string, body: unknown): Promise<T | null> {
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!res.ok) return null;
        return await res.json() as T;
    } catch {
        return null;
    }
}

export const useEconomyStore = create<EconomyState>((set, get) => ({
    vitals: { totalValueLocked: 1250000, systemAttestation: 0.92, activeProcesses: 0 },
    agents: {},
    connections: {},
    activePulses: {},
    selectedAgentId: null,
    viewMode: 'landing',
    activityLog: [],
    backendAvailable: false,
    lastActivityTimestamp: 0,
    tasks: {},
    actionPanelOpen: false,

    initializeNetwork: async () => {
        const [agents, connections, vitals, activity, tasks] = await Promise.all([
            fetchJson<AgentEntity[]>('/api/agents'),
            fetchJson<NetworkConnection[]>('/api/connections'),
            fetchJson<Vitals>('/api/vitals'),
            fetchJson<ActivityEvent[]>('/api/activity?limit=50'),
            fetchJson<Task[]>('/api/tasks'),
        ]);

        if (agents && connections) {
            const agentMap: Record<string, AgentEntity> = {};
            for (const a of agents) agentMap[a.id] = a;
            const connMap: Record<string, NetworkConnection> = {};
            for (const c of connections) connMap[c.id] = c;
            const taskMap: Record<string, Task> = {};
            for (const t of (tasks ?? [])) taskMap[t.id] = t;

            set({
                agents: agentMap,
                connections: connMap,
                tasks: taskMap,
                vitals: vitals ?? { totalValueLocked: 1250000, systemAttestation: 0.92, activeProcesses: 0 },
                activityLog: activity ?? [],
                backendAvailable: true,
                lastActivityTimestamp: activity && activity.length > 0 ? activity[0].timestamp : 0,
            });
        } else {
            set({ agents: fallbackAgents, connections: fallbackConnections, backendAvailable: false });
        }
    },

    emitPulse: (connectionId, pulseType, value) => {
        const pulseId = `pulse-${generateId()}`;
        const pulse: ActivityPulse = { id: pulseId, connectionId, pulseType, value };
        set((state) => ({ activePulses: { ...state.activePulses, [pulseId]: pulse } }));
        // 2600ms — 100ms longer than the 2.5s animation so the packet finishes before removal
        setTimeout(() => get().removePulse(pulseId), 2600);
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
    setActionPanelOpen: (open) => set({ actionPanelOpen: open }),

    addActivityEvent: (event) => {
        set((state) => ({
            activityLog: [
                { ...event, id: `evt-${generateId()}`, timestamp: Date.now() },
                ...state.activityLog,
            ].slice(0, 50),
        }));
    },

    registerAgent: async (params) => {
        const agent = await postJson<AgentEntity>('/api/agents', params);
        if (!agent) return null;
        set((state) => ({ agents: { ...state.agents, [agent.id]: agent } }));
        return agent;
    },

    createTask: async (params) => {
        const task = await postJson<Task>('/api/tasks', params);
        if (!task) return null;
        set((state) => ({ tasks: { ...state.tasks, [task.id]: task } }));
        return task;
    },

    dispatchTask: async (taskId, agentId) => {
        const task = await postJson<Task>(`/api/tasks/${taskId}/dispatch`, { agentId });
        if (!task) return null;
        set((state) => ({ tasks: { ...state.tasks, [task.id]: task } }));
        return task;
    },

    completeTask: async (taskId, result, attestationScore) => {
        const task = await postJson<Task>(`/api/tasks/${taskId}/complete`, { result, attestationScore });
        if (!task) return null;
        set((state) => ({ tasks: { ...state.tasks, [task.id]: task } }));
        return task;
    },

    // ── Contract operations ──────────────────────────────────────────────────
    contractRegister: async (agentId, params) => {
        return postJson<{ txHash: string }>(`/api/agents/${agentId}/contract/register`, params);
    },

    contractDeregister: async (agentId) => {
        return postJson<{ txHash: string }>(`/api/agents/${agentId}/contract/deregister`, {});
    },

    contractUpdate: async (agentId, params) => {
        return postJson<{ updates: { field: string; txHash: string }[] }>(`/api/agents/${agentId}/contract/update`, params);
    },

    contractRentAgent: async (agentId, params) => {
        return postJson<{ txHash: string; jobId?: string }>(`/api/agents/${agentId}/contract/rent`, params);
    },

    contractAcceptJob: async (agentId, jobId) => {
        return postJson<{ txHash: string }>(`/api/agents/${agentId}/contract/accept-job`, { jobId });
    },

    contractRejectJob: async (agentId, jobId) => {
        return postJson<{ txHash: string }>(`/api/agents/${agentId}/contract/reject-job`, { jobId });
    },

    contractCompleteJob: async (agentId, jobId, attestation) => {
        return postJson<{ txHash: string }>(`/api/agents/${agentId}/contract/complete-job`, { jobId, attestation });
    },

    contractRefundJob: async (agentId, jobId) => {
        return postJson<{ txHash: string }>(`/api/agents/${agentId}/contract/refund-job`, { jobId });
    },

    contractRateJob: async (agentId, jobId, rating) => {
        return postJson<{ txHash: string }>(`/api/agents/${agentId}/contract/rate-job`, { jobId, rating });
    },

    contractGetOnChainState: async (agentId) => {
        return fetchJson<Record<string, unknown>>(`/api/agents/${agentId}/contract`);
    },

    fundAgent: async (agentId, amountEth) => {
        return postJson<{ txHash: string }>(`/api/agents/${agentId}/fund`, amountEth ? { amountEth } : {});
    },

    // ── Contract read operations ────────────────────────────────────────────
    contractGetJob: async (jobId) => {
        return fetchJson<OnChainJob>(`/api/contract/jobs/${jobId}`);
    },

    contractGetJobCount: async () => {
        return (await fetchJson<{ count: number; jobs?: OnChainJob[] }>('/api/contract/jobs')) ?? { count: 0 };
    },

    contractGetBalance: async (address) => {
        return fetchJson<{ address: string; balance: string }>(`/api/contract/balance/${address}`);
    },

    contractGetContractBalance: async () => {
        return fetchJson<{ balance: string }>('/api/contract/balance');
    },

    contractQueryEvents: async (params) => {
        const qs = new URLSearchParams();
        if (params?.type) qs.set('type', params.type);
        if (params?.agent) qs.set('agent', params.agent);
        if (params?.jobId !== undefined) qs.set('jobId', String(params.jobId));
        if (params?.fromBlock !== undefined) qs.set('fromBlock', String(params.fromBlock));
        if (params?.limit !== undefined) qs.set('limit', String(params.limit));
        const result = await fetchJson<{ events: ContractEvent[] }>(`/api/contract/events?${qs.toString()}`);
        return result?.events ?? [];
    },

    contractGetAgentJobs: async (agentId) => {
        const result = await fetchJson<{ jobs: OnChainJob[] }>(`/api/agents/${agentId}/contract/jobs`);
        return result?.jobs ?? [];
    },

    contractGetAllAgents: async () => {
        const result = await fetchJson<{ agents: OnChainAgent[]; count: number }>('/api/contract/agents');
        return result?.agents ?? [];
    },

    contractGetAgentCount: async () => {
        const result = await fetchJson<{ count: number }>('/api/contract/agents/count');
        return result?.count ?? 0;
    },

    contractGetOpenJobs: async (agentId) => {
        const result = await fetchJson<{ jobs: OnChainJob[] }>(`/api/agents/${agentId}/contract/open-jobs`);
        return result?.jobs ?? [];
    },

    networkTick: async () => {
        const { backendAvailable, connections, emitPulse, addActivityEvent, agents, lastActivityTimestamp } = get();

        if (backendAvailable) {
            const [agentsData, vitals, activity, tasksData] = await Promise.all([
                fetchJson<AgentEntity[]>('/api/agents'),
                fetchJson<Vitals>('/api/vitals'),
                fetchJson<ActivityEvent[]>('/api/activity?limit=50'),
                fetchJson<Task[]>('/api/tasks'),
            ]);

            if (agentsData) {
                const agentMap: Record<string, AgentEntity> = {};
                for (const a of agentsData) agentMap[a.id] = a;
                set({ agents: agentMap });
            }
            if (vitals) set({ vitals });
            if (tasksData) {
                const taskMap: Record<string, Task> = {};
                for (const t of tasksData) taskMap[t.id] = t;
                set({ tasks: taskMap });
            }
            if (activity && activity.length > 0) {
                const newEvents = activity.filter(e => e.timestamp > lastActivityTimestamp);
                if (newEvents.length > 0) {
                    set({ activityLog: activity, lastActivityTimestamp: activity[0].timestamp });
                    const connectionKeys = Object.keys(get().connections);
                    for (const evt of newEvents) {
                        if (connectionKeys.length > 0) {
                            const randomConnId = connectionKeys[Math.floor(Math.random() * connectionKeys.length)];
                            const pulseType = evt.type === 'hired' ? 'task_routed'
                                : evt.type === 'payment' ? 'payment_settled'
                                : 'attestation_recorded';
                            emitPulse(randomConnId, pulseType, 1000);
                        }
                    }
                }
            }
            const connectionsData = await fetchJson<NetworkConnection[]>('/api/connections');
            if (connectionsData) {
                const connMap: Record<string, NetworkConnection> = {};
                for (const c of connectionsData) connMap[c.id] = c;
                set({ connections: connMap });
            }
        } else {
            // Offline simulation
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
    },
}));
