'use client';

import { useMemo } from 'react';
import { ReactFlow, ReactFlowProvider, Node, Edge } from '@xyflow/react';
import { useReducedMotion } from 'framer-motion';
import '@xyflow/react/dist/style.css';

import FlowDiagramNode from './FlowDiagramNode';
import FlowDiagramEdge from './FlowDiagramEdge';

const nodeTypes = { flowNode: FlowDiagramNode };
const edgeTypes = { flowEdge: FlowDiagramEdge };

const DEMO_NODES: Node[] = [
    {
        id: 'client',
        type: 'flowNode',
        position: { x: 0, y: 150 },
        data: { label: 'Client dApp', sublabel: 'Intent source', icon: 'User', accent: '#818cf8' },
    },
    {
        id: 'router',
        type: 'flowNode',
        position: { x: 320, y: 0 },
        data: { label: 'Router Agent', sublabel: 'AI-powered matching & task dispatch', icon: 'Layers', accent: '#818cf8', step: '02' },
    },
    {
        id: 'registry',
        type: 'flowNode',
        position: { x: 320, y: 300 },
        data: { label: 'Registry', sublabel: 'On-chain identity & capability publishing', icon: 'Search', accent: '#818cf8', step: '01' },
    },
    {
        id: 'executor',
        type: 'flowNode',
        position: { x: 640, y: 150 },
        data: { label: 'Executor Agent', sublabel: 'Task completion & escrow settlement', icon: 'Box', accent: '#3b82f6', step: '03' },
    },
    {
        id: 'settler',
        type: 'flowNode',
        position: { x: 960, y: 150 },
        data: { label: 'Settlement', sublabel: 'On-chain attestation & reputation update', icon: 'ShieldCheck', accent: '#10b981', step: '04' },
    },
];

function buildEdges(reduceMotion: boolean): Edge[] {
    return [
        {
            id: 'e-client-router',
            source: 'client',
            target: 'router',
            type: 'flowEdge',
            data: { color: '#818cf8', duration: '2.5s', delay: '0s', reduceMotion },
        },
        {
            id: 'e-router-registry',
            source: 'router',
            target: 'registry',
            type: 'flowEdge',
            data: { color: '#818cf8', duration: '1.8s', delay: '0.8s', reduceMotion },
        },
        {
            id: 'e-registry-router',
            source: 'registry',
            target: 'router',
            type: 'flowEdge',
            data: { color: '#818cf8', duration: '1.8s', delay: '1.8s', reduceMotion },
        },
        {
            id: 'e-router-executor',
            source: 'router',
            target: 'executor',
            type: 'flowEdge',
            data: { color: '#3b82f6', duration: '2.5s', delay: '2.8s', reduceMotion },
        },
        {
            id: 'e-executor-settler',
            source: 'executor',
            target: 'settler',
            type: 'flowEdge',
            data: { color: '#10b981', duration: '2.5s', delay: '4.5s', reduceMotion },
        },
        {
            id: 'e-settler-client',
            source: 'settler',
            target: 'client',
            type: 'flowEdge',
            data: { color: '#94a3b8', duration: '3.0s', delay: '6.0s', reduceMotion },
        },
    ];
}

function FlowDiagramInner() {
    const prefersReducedMotion = useReducedMotion() ?? false;

    const edges = useMemo(
        () => buildEdges(prefersReducedMotion),
        [prefersReducedMotion],
    );

    return (
        <div
            className="relative h-[450px] md:h-[550px] overflow-hidden"
            role="img"
            aria-label="Animated diagram showing the agent coordination flow: Client dApp sends intent to Router Agent, which queries the Registry for discovery, then dispatches to the Executor Agent, which settles on-chain before returning results to the client."
        >
            {/* Subtle radial glow behind the graph */}
            <div
                className="absolute inset-0 pointer-events-none z-0"
                style={{
                    background:
                        'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(99,102,241,0.08) 0%, transparent 70%)',
                }}
            />

            {/* SVG defs for glow filter (used by FlowDiagramEdge) */}
            <svg className="absolute w-0 h-0">
                <defs>
                    <filter id="flow-glow">
                        <feGaussianBlur stdDeviation="3" />
                    </filter>
                </defs>
            </svg>

            <ReactFlow
                nodes={DEMO_NODES}
                edges={edges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                panOnDrag={false}
                zoomOnScroll={false}
                zoomOnPinch={false}
                zoomOnDoubleClick={false}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                preventScrolling={false}
                proOptions={{ hideAttribution: true }}
                className="!bg-transparent"
            />
        </div>
    );
}

export default function CoordinationFlowDiagram() {
    return (
        <ReactFlowProvider>
            <FlowDiagramInner />
        </ReactFlowProvider>
    );
}
