'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { ReactFlow, Background, OnSelectionChangeParams, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useEconomyStore, AgentEntity, NetworkConnection } from '../../store/useEconomyStore';
import TopologyNode from '../nodes/TopologyNode';
import TopologyEdge from '../edges/TopologyEdge';

const nodeTypes = {
    infrastructure: TopologyNode,
};

const edgeTypes = {
    routing: TopologyEdge,
};

// Structural layout for infrastructural components
const initialLayout: Record<string, { x: number; y: number }> = {
    'node-alpha': { x: 0, y: 0 },
    'worker-v7': { x: 300, y: -150 },
    'data-ingest': { x: -300, y: -150 },
    'settlement-layer': { x: 0, y: 300 },
    'worker-v2': { x: 400, y: 50 },
};

export default function LivingCanvas() {
    const agents = useEconomyStore(state => state.agents);
    const connections = useEconomyStore(state => state.connections);
    const initializeNetwork = useEconomyStore(state => state.initializeNetwork);
    const networkTick = useEconomyStore(state => state.networkTick);
    const setSelectedAgent = useEconomyStore(state => state.setSelectedAgent);
    const initialized = useRef(false);
    const selectedAgentIdRef = useRef<string | null>(useEconomyStore.getState().selectedAgentId);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;
        initializeNetwork();
    }, [initializeNetwork]);

    useEffect(() => {
        const unsub = useEconomyStore.subscribe(
            state => { selectedAgentIdRef.current = state.selectedAgentId; }
        );
        return unsub;
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            networkTick();
        }, 500);

        return () => clearInterval(interval);
    }, [networkTick]);

    const nodes: Node[] = useMemo(() => {
        return (Object.values(agents) as AgentEntity[]).map(agent => ({
            id: agent.id,
            type: 'infrastructure',
            position: initialLayout[agent.id] || { x: Math.random() * 500, y: Math.random() * 500 },
            data: { ...agent } as Record<string, unknown>,
        }));
    }, [agents]);

    const edges: Edge[] = useMemo(() => {
        return (Object.values(connections) as NetworkConnection[]).map(conn => ({
            id: conn.id,
            source: conn.sourceAgentId,
            target: conn.targetAgentId,
            type: 'routing',
            animated: true, // Subtle standard dashed animation fallback
        }));
    }, [connections]);

    const handleSelectionChange = useCallback((params: OnSelectionChangeParams) => {
        const newId = params.nodes.length > 0 ? params.nodes[0].id : null;
        if (newId !== selectedAgentIdRef.current) {
            setSelectedAgent(newId);
        }
    }, [setSelectedAgent]);

    if (Object.keys(agents).length === 0) return null;

    return (
        <div className="absolute inset-0 w-full h-full bg-[#0a0a0c] -z-10 font-mono">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onSelectionChange={handleSelectionChange}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                className="bg-[#0a0a0c]"
                nodesDraggable={true}
                nodesConnectable={false}
                elementsSelectable={true}
                proOptions={{ hideAttribution: true }}
            >
                <Background color="rgba(255,255,255,0.03)" gap={20} size={1} />
            </ReactFlow>
        </div>
    );
}
