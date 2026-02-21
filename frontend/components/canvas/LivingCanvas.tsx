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

    useEffect(() => {
        const agentList = Object.values(agents) as AgentEntity[];
        setRfNodes(prev => {
            const prevById: Record<string, Node> = {};
            for (const n of prev) prevById[n.id] = n;
            return agentList.map(agent => {
                const existing = prevById[agent.id];
                return {
                    id:       agent.id,
                    type:     'infrastructure',
                    position: existing ? existing.position : getPosition(agent.id),
                    data:     { ...agent } as Record<string, unknown>,
                };
            });
        });
    }, [agents]);

    const onNodesChange = useCallback((changes: NodeChange[]) => {
        setRfNodes(nds => applyNodeChanges(changes, nds));
    }, []);

    const edges: Edge[] = useMemo(() => {
        return (Object.values(connections) as NetworkConnection[]).map(conn => ({
            id: conn.id,
            source: conn.sourceAgentId,
            target: conn.targetAgentId,
            type: 'routing',
            animated: true,
        }));
    }, [connections]);

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
        <div className="absolute inset-0 w-full h-full bg-[#0a0a0c] -z-10 font-mono">
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
