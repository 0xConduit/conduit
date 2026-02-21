import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { AgentRole } from '../../store/useEconomyStore';
import { Box, Layers, ShieldCheck } from 'lucide-react';

const roleIcons: Record<AgentRole, React.ReactNode> = {
    router: <Layers className="w-4 h-4 text-blue-400" />,
    executor: <Box className="w-4 h-4 text-slate-300" />,
    settler: <ShieldCheck className="w-4 h-4 text-emerald-400" />
};

export const TopologyNode = memo(({ data, selected }: { data: any, selected: boolean }) => {
    const { role, id, status, attestationScore } = data;

    return (
        <div className={`
            relative flex flex-col items-start min-w-[160px] w-[160px] min-h-[88px] cursor-pointer 
            bg-[#0F1115] border transition-colors duration-200
            ${selected ? 'border-white/40 shadow-lg shadow-white/5' : 'border-white/10 hover:border-white/20'}
        `}>
            {/* Minimalist handles for straight wiring */}
            <Handle type="target" position={Position.Top} className="opacity-0" />
            <Handle type="source" position={Position.Bottom} className="opacity-0" />

            {/* Header / Identity Layer */}
            <div className="flex items-center gap-2 w-full p-2 border-b border-white/5 bg-white/[0.02]">
                {roleIcons[role as AgentRole]}
                <span className="font-mono text-xs font-semibold text-white tracking-tight uppercase">
                    {id}
                </span>

                {/* Status Dot */}
                <span className={`ml-auto w-1.5 h-1.5 rounded-full ${status === 'idle' ? 'bg-slate-500' : 'bg-emerald-500 animate-pulse'}`} />
            </div>

            {/* Properties Layer */}
            <div className="p-2 w-full space-y-1 font-mono text-[10px]">
                <div className="flex justify-between text-white/50">
                    <span>ROLE</span>
                    <span className="text-white/80 uppercase">{role}</span>
                </div>
                <div className="flex justify-between text-white/50">
                    <span>ATTEST</span>
                    <span className="text-blue-400">{(attestationScore * 100).toFixed(0)}%</span>
                </div>
            </div>
        </div>
    );
});

export default TopologyNode;
