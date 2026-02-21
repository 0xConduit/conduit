'use client';

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { User, Layers, Search, Box, ShieldCheck } from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
    User: <User className="w-5 h-5" />,
    Layers: <Layers className="w-5 h-5" />,
    Search: <Search className="w-5 h-5" />,
    Box: <Box className="w-5 h-5" />,
    ShieldCheck: <ShieldCheck className="w-5 h-5" />,
};

interface FlowDiagramNodeData {
    label: string;
    sublabel: string;
    icon: string;
    accent: string;
    step?: string;
    [key: string]: unknown;
}

export const FlowDiagramNode = memo(({ data }: { data: FlowDiagramNodeData }) => {
    const { label, sublabel, icon, accent, step } = data;

    return (
        <div
            className="relative flex items-center gap-4 w-[250px] px-5 py-4 bg-white/[0.03] border border-white/[0.06] rounded-md backdrop-blur-sm font-mono transition-colors duration-200 hover:border-indigo-400/30"
        >
            <Handle type="target" position={Position.Left} className="!opacity-0 !w-1 !h-1" />
            <Handle type="source" position={Position.Right} className="!opacity-0 !w-1 !h-1" />

            {step && (
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded border border-white/10 bg-[#0a0a0c] flex items-center justify-center text-[10px] font-mono text-white/35">
                    {step}
                </span>
            )}

            <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${accent}10`, border: `1px solid ${accent}20` }}
            >
                <span style={{ color: accent }}>{iconMap[icon]}</span>
            </div>

            <div className="flex flex-col">
                <span className="text-sm font-semibold text-white/80 tracking-tight leading-tight">
                    {label}
                </span>
                <span className="text-xs text-white/30 leading-tight mt-0.5 max-w-[200px]">
                    {sublabel}
                </span>
            </div>
        </div>
    );
});

FlowDiagramNode.displayName = 'FlowDiagramNode';

export default FlowDiagramNode;
