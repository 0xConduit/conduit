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

    // Each edge needs a stable DOM id so <mpath> can reference the path element.
    // Using the path attribute directly on animateMotion treats coordinates as
    // relative offsets from the element's current position, not absolute — which
    // is why the packet was flying to the wrong place. mpath follows the actual
    // rendered geometry of the named path element in the same SVG coordinate space.
    const pathId = `motion-path-${id}`;

    return (
        <>
            {/* Hidden path element used only as the motion track for <mpath> */}
            <path id={pathId} d={edgePath} fill="none" stroke="none" />

            <BaseEdge
                path={edgePath}
                markerEnd={markerEnd}
                className="transition-colors duration-300"
                style={{
                    ...style,
                    stroke: activePulses.length > 0 ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)',
                    strokeWidth: 1.5,
                    strokeDasharray: '4 4',
                }}
            />

            {activePulses.map((pulse: ActivityPulse) => {
                const color =
                    pulse.pulseType === 'payment_settled' ? '#10b981' :
                    pulse.pulseType === 'task_routed'     ? '#3b82f6' :
                                                            '#94a3b8';
                return (
                    <g key={pulse.id}>
                        <rect width={14} height={6} x={-7} y={-3} fill={color} rx={1}>
                            <animateMotion
                                dur="2.5s"
                                calcMode="linear"
                                repeatCount="1"
                                fill="remove"
                            >
                                <mpath href={`#${pathId}`} />
                            </animateMotion>
                        </rect>
                    </g>
                );
            })}
        </>
    );
});

export default TopologyEdge;
