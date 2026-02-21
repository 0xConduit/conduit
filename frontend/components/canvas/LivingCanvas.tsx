'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ReactFlow, Background, Node, Edge, NodeChange, applyNodeChanges } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useEconomyStore, AgentEntity, NetworkConnection } from '../../store/useEconomyStore';
import TopologyNode from '../nodes/TopologyNode';
import TopologyEdge from '../edges/TopologyEdge';

const nodeTypes = { infrastructure: TopologyNode };
const edgeTypes = { routing: TopologyEdge };

const SEED_LAYOUT: Record<string, { x: number; y: number }> = {
    'node-alpha':       { x: 0,    y: 0 },
    'worker-v7':        { x: 300,  y: -150 },
    'data-ingest':      { x: -300, y: -150 },
    'settlement-layer': { x: 0,    y: 300 },
    'worker-v2':        { x: 400,  y: 50 },
};

const DYNAMIC_SLOTS: { x: number; y: number }[] = [
    { x: -450, y: 150 },  { x: 500,  y: 250 },
    { x: -200, y: -350 }, { x: 250,  y: 400 },
    { x: -500, y: -50 },  { x: 550,  y: -200 },
    { x: -350, y: 350 },  { x: 150,  y: -350 },
    { x: -100, y: 450 },  { x: 600,  y: 100 },
    { x: -550, y: -250 }, { x: 350,  y: -300 },
];

export default function LivingCanvas() {
    const agents      = useEconomyStore(state => state.agents);
    const connections = useEconomyStore(state => state.connections);
    const initializeNetwork = useEconomyStore(state => state.initializeNetwork);
    const networkTick       = useEconomyStore(state => state.networkTick);
    const setSelectedAgent  = useEconomyStore(state => state.setSelectedAgent);
    const chainFilter       = useEconomyStore(state => state.chainFilter);
    const registeredFilter  = useEconomyStore(state => state.registeredFilter);
    const pausedFilter      = useEconomyStore(state => state.pausedFilter);
    const roleFilter        = useEconomyStore(state => state.roleFilter);
    const statusFilter      = useEconomyStore(state => state.statusFilter);
    const attestationFilter = useEconomyStore(state => state.attestationFilter);
    const balanceFilter     = useEconomyStore(state => state.balanceFilter);
    const walletFilter      = useEconomyStore(state => state.walletFilter);
    const inftFilter        = useEconomyStore(state => state.inftFilter);
    const capabilityFilter  = useEconomyStore(state => state.capabilityFilter);

    const initialized        = useRef(false);
    const positionCache      = useRef<Record<string, { x: number; y: number }>>({});
    const dynamicSlotIndex   = useRef(0);

    function getPosition(id: string): { x: number; y: number } {
        if (positionCache.current[id]) return positionCache.current[id];
        const pos = SEED_LAYOUT[id] ?? DYNAMIC_SLOTS[dynamicSlotIndex.current++ % DYNAMIC_SLOTS.length];
        positionCache.current[id] = pos;
        return pos;
    }

    const [rfNodes, setRfNodes] = useState<Node[]>([]);

    const filteredAgents = useMemo(() => {
        return (Object.values(agents) as AgentEntity[]).filter(agent => {
            if (chainFilter !== 'all' && agent.deployedChain !== chainFilter) return false;
            if (registeredFilter === 'registered' && !agent.conduitRegistered) return false;
            if (registeredFilter === 'unregistered' && agent.conduitRegistered) return false;
            if (pausedFilter === 'paused' && agent.status !== 'dormant') return false;
            if (pausedFilter === 'active' && agent.status === 'dormant') return false;
            if (roleFilter !== 'all' && agent.role !== roleFilter) return false;
            if (statusFilter !== 'all' && agent.status !== statusFilter) return false;
            if (attestationFilter === 'high' && agent.attestationScore < 0.9) return false;
            if (attestationFilter === 'medium' && (agent.attestationScore < 0.5 || agent.attestationScore >= 0.9)) return false;
            if (attestationFilter === 'low' && agent.attestationScore >= 0.5) return false;
            if (balanceFilter === 'high' && agent.settlementBalance < 50000) return false;
            if (balanceFilter === 'medium' && (agent.settlementBalance < 5000 || agent.settlementBalance >= 50000)) return false;
            if (balanceFilter === 'low' && (agent.settlementBalance < 1 || agent.settlementBalance >= 5000)) return false;
            if (balanceFilter === 'zero' && agent.settlementBalance > 0) return false;
            if (walletFilter === 'yes' && !agent.walletAddress) return false;
            if (walletFilter === 'no' && agent.walletAddress) return false;
            if (inftFilter === 'yes' && !agent.inftTokenId) return false;
            if (inftFilter === 'no' && agent.inftTokenId) return false;
            if (capabilityFilter && !agent.capabilities.some(c => c.toLowerCase().includes(capabilityFilter.toLowerCase()))) return false;
            return true;
        });
    }, [agents, chainFilter, registeredFilter, pausedFilter, roleFilter, statusFilter, attestationFilter, balanceFilter, walletFilter, inftFilter, capabilityFilter]);

    useEffect(() => {
        setRfNodes(prev => {
            const prevById: Record<string, Node> = {};
            for (const n of prev) prevById[n.id] = n;
            return filteredAgents.map(agent => {
                const existing = prevById[agent.id];
                return {
                    id:       agent.id,
                    type:     'infrastructure',
                    position: existing ? existing.position : getPosition(agent.id),
                    data:     { ...agent } as Record<string, unknown>,
                };
            });
        });
    }, [filteredAgents]);

    const onNodesChange = useCallback((changes: NodeChange[]) => {
        setRfNodes(nds => applyNodeChanges(changes, nds));
    }, []);

    const visibleIds = useMemo(() => new Set(rfNodes.map(n => n.id)), [rfNodes]);

    const edges: Edge[] = useMemo(() => {
        return (Object.values(connections) as NetworkConnection[])
            .filter(conn => visibleIds.has(conn.sourceAgentId) && visibleIds.has(conn.targetAgentId))
            .map(conn => ({
                id: conn.id,
                source: conn.sourceAgentId,
                target: conn.targetAgentId,
                type: 'routing',
                animated: true,
            }));
    }, [connections, visibleIds]);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;
        initializeNetwork();
    }, [initializeNetwork]);

    useEffect(() => {
        const interval = setInterval(() => networkTick(), 500);
        return () => clearInterval(interval);
    }, [networkTick]);

    const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        setSelectedAgent(node.id);
    }, [setSelectedAgent]);

    const handlePaneClick = useCallback(() => {
        setSelectedAgent(null);
    }, [setSelectedAgent]);

    const onInit = useCallback((reactFlowInstance: { fitView: (opts?: { padding?: number; duration?: number }) => void }) => {
        reactFlowInstance.fitView({ padding: 0.2, duration: 200 });
    }, []);

    if (rfNodes.length === 0) return null;

    return (
        <div className="absolute inset-0 w-full h-full -z-10 font-mono" style={{ background: 'transparent' }}>
            <ReactFlow
                nodes={rfNodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onNodeClick={handleNodeClick}
                onPaneClick={handlePaneClick}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                style={{ background: 'transparent' }}
                nodesDraggable={true}
                nodesConnectable={false}
                elementsSelectable={true}
                proOptions={{ hideAttribution: true }}
            >
                <Background color="rgba(130,140,248,0.035)" gap={20} size={1} />
            </ReactFlow>
        </div>
    );
}
