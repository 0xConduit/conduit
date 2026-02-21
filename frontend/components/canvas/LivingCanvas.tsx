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

// Structural layout for infrastructural components (stable positions)
const initialLayout: Record<string, { x: number; y: number }> = {
    'node-alpha': { x: 0, y: 0 },
    'worker-v7': { x: 300, y: -150 },
    'data-ingest': { x: -300, y: -150 },
    'settlement-layer': { x: 0, y: 300 },
    'worker-v2': { x: 400, y: 50 },
};

const NODE_MIN_DISTANCE = 220; // node ~160px wide; keep center-to-center gap

// Deterministic list of candidate positions (rings) so new agents get non-overlapping spots
function getCandidatePositions(): { x: number; y: number }[] {
    const out: { x: number; y: number }[] = [];
    const radii = [280, 420, 560, 700];
    const steps = [8, 12, 16, 20];
    radii.forEach((r, i) => {
        const n = steps[i];
        for (let k = 0; k < n; k++) {
            const angle = (2 * Math.PI * k) / n;
            out.push({ x: Math.round(r * Math.cos(angle)), y: Math.round(r * Math.sin(angle)) });
        }
    });
    return out;
}

const CANDIDATES = getCandidatePositions();

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function findNonOverlappingPosition(occupied: { x: number; y: number }[]): { x: number; y: number } {
    for (const pos of CANDIDATES) {
        if (occupied.every(o => distance(o, pos) >= NODE_MIN_DISTANCE))
            return pos;
    }
    // fallback: offset from last occupied or (500, 500)
    const last = occupied[occupied.length - 1] ?? { x: 500, y: 500 };
    return { x: last.x + NODE_MIN_DISTANCE, y: last.y };
}

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
        const list = (Object.values(agents) as AgentEntity[]).sort((a, b) => a.id.localeCompare(b.id));
        const occupied: { x: number; y: number }[] = Object.values(initialLayout);
        const positions: Record<string, { x: number; y: number }> = { ...initialLayout };

        return list.map(agent => {
            let position = positions[agent.id];
            if (position === undefined) {
                position = findNonOverlappingPosition(occupied);
                positions[agent.id] = position;
                occupied.push(position);
            }
            return {
                id: agent.id,
                type: 'infrastructure',
                position,
                data: { ...agent } as Record<string, unknown>,
            };
        });
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

    const onInit = useCallback((reactFlowInstance: { fitView: (opts?: { padding?: number; duration?: number }) => void }) => {
        reactFlowInstance.fitView({ padding: 0.2, duration: 200 });
    }, []);

    if (Object.keys(agents).length === 0) return null;

    return (
        <div className="absolute inset-0 w-full h-full bg-[#0a0a0c] -z-10 font-mono">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onSelectionChange={handleSelectionChange}
                onInit={onInit}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView={false}
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
