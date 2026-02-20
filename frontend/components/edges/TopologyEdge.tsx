import { memo } from 'react';
import { BaseEdge, EdgeProps, getSmoothStepPath } from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';
import { useEconomyStore, ActivityPulse } from '../../store/useEconomyStore';

export const TopologyEdge = memo(({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
}: EdgeProps) => {
    // Smooth step path makes it look like circuit/infrastructure rather than organic bezier
    const [edgePath] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 4
    });

    const activePulses = useEconomyStore(useShallow(state =>
        Object.values(state.activePulses).filter((p: ActivityPulse) => p.connectionId === id)
    ));

    return (
        <>
            <BaseEdge
                path={edgePath}
                markerEnd={markerEnd}
                className="transition-colors duration-300"
                style={{
                    ...style,
                    stroke: activePulses.length > 0 ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)',
                    strokeWidth: 1.5,
                    strokeDasharray: '4 4'
                }}
            />

            {activePulses.map((pulse: ActivityPulse) => {
                const color = pulse.pulseType === 'payment_settled' ? '#10b981' : pulse.pulseType === 'task_routed' ? '#3b82f6' : '#94a3b8';

                return (
                    <g key={pulse.id}>
                        {/* Structural data packet vs glowing orb */}
                        <rect width={16} height={6} x={-8} y={-3} fill={color} rx={1}>
                            <animateMotion
                                dur="1.5s"
                                path={edgePath}
                                calcMode="spline"
                                keySplines="0.4 0 0.2 1"
                                repeatCount="1"
                                fill="freeze"
                            />
                        </rect>
                    </g>
                );
            })}
        </>
    );
});

export default TopologyEdge;
