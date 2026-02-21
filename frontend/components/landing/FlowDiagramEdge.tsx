'use client';

import { memo } from 'react';
import { EdgeProps, getSmoothStepPath } from '@xyflow/react';

interface FlowDiagramEdgeData {
    color: string;
    duration: string;
    delay: string;
    reduceMotion: boolean;
    [key: string]: unknown;
}

export const FlowDiagramEdge = memo(({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
}: EdgeProps) => {
    const { color, duration, delay, reduceMotion } = (data ?? {}) as FlowDiagramEdgeData;

    const [edgePath] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 8,
    });

    return (
        <>
            {/* Base edge path */}
            <path
                d={edgePath}
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth={1}
                strokeDasharray="6 8"
            />

            {/* Animated data packet */}
            {!reduceMotion && (
                <g>
                    <rect
                        width={16}
                        height={6}
                        x={-8}
                        y={-3}
                        rx={1}
                        fill={color ?? '#818cf8'}
                        opacity={0.9}
                    >
                        <animateMotion
                            dur={duration ?? '2.5s'}
                            path={edgePath}
                            calcMode="spline"
                            keySplines="0.4 0 0.2 1"
                            repeatCount="indefinite"
                            begin={delay ?? '0s'}
                        />
                    </rect>
                    {/* Subtle glow trail */}
                    <rect
                        width={24}
                        height={10}
                        x={-12}
                        y={-5}
                        rx={5}
                        fill={color ?? '#818cf8'}
                        opacity={0.15}
                        filter="url(#flow-glow)"
                    >
                        <animateMotion
                            dur={duration ?? '2.5s'}
                            path={edgePath}
                            calcMode="spline"
                            keySplines="0.4 0 0.2 1"
                            repeatCount="indefinite"
                            begin={delay ?? '0s'}
                        />
                    </rect>
                </g>
            )}
        </>
    );
});

FlowDiagramEdge.displayName = 'FlowDiagramEdge';

export default FlowDiagramEdge;
