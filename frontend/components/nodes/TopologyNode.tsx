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

    const roleGlow: Record<string, string> = {
        router: 'shadow-blue-500/20',
        executor: 'shadow-slate-400/15',
        settler: 'shadow-emerald-500/20',
    };

    const roleBorder: Record<string, string> = {
        router: 'border-blue-500/30',
        executor: 'border-slate-400/20',
        settler: 'border-emerald-500/30',
    };

    return (
        <div className={`
            relative flex flex-col items-start min-w-[160px] w-[160px] min-h-[88px] cursor-pointer
            bg-[#0c0d12]/80 backdrop-blur-sm border rounded-sm transition-all duration-300
            ${selected
                ? `${roleBorder[role] || 'border-white/40'} shadow-lg ${roleGlow[role] || 'shadow-white/10'}`
                : 'border-white/[0.08] hover:border-white/20 hover:shadow-md hover:shadow-indigo-500/10'}
        `}>
            {/* Top accent line */}
            <div className={`absolute top-0 left-0 right-0 h-px ${
                role === 'router' ? 'bg-gradient-to-r from-transparent via-blue-500/50 to-transparent'
                : role === 'settler' ? 'bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent'
                : 'bg-gradient-to-r from-transparent via-slate-400/30 to-transparent'
            }`} />

            <Handle type="target" position={Position.Top} className="opacity-0" />
            <Handle type="source" position={Position.Bottom} className="opacity-0" />

            {/* Header / Identity Layer */}
            <div className="flex items-center gap-2 w-full p-2 border-b border-white/5 bg-white/[0.02]">
                {roleIcons[role as AgentRole]}
                <span className="font-mono text-xs font-semibold text-white/90 tracking-tight uppercase">
                    {id}
                </span>
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
