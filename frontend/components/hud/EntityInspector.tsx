'use client';

import { useEconomyStore } from '../../store/useEconomyStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Zap, Box } from 'lucide-react';

export default function EntityInspector() {
    const { selectedAgentId, agents, setSelectedAgent } = useEconomyStore();

    const agent = selectedAgentId ? agents[selectedAgentId] : null;

    return (
        <AnimatePresence mode="wait">
            {agent && (
                <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.12 }}
                    className="absolute top-6 right-6 z-10 w-80 font-mono"
                >
                    <div className="bg-[#0a0b14]/70 backdrop-blur-xl border border-indigo-500/[0.08] p-5 shadow-2xl shadow-indigo-500/5 relative rounded-sm">
                        {/* Structural Accent highlight based on Role */}
                        <div className={`absolute top-0 right-0 w-[2px] h-full ${agent.role === 'router' ? 'bg-blue-500' : agent.role === 'settler' ? 'bg-emerald-500' : 'bg-slate-400'}`} />

                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                            <div className="flex items-center gap-2">
                                <Box className="w-4 h-4 text-white/50" />
                                <h2 className="text-xs font-semibold tracking-[0.2em] text-white/90">ENTITY_INSP</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] text-white/40 uppercase tracking-widest border border-white/10 px-1.5 py-0.5 bg-white/5">
                                    {agent.role}
                                </span>
                                <button
                                    onClick={() => setSelectedAgent(null)}
                                    className="text-white/30 hover:text-white/70 transition-colors text-xs leading-none px-1"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <div className="text-[10px] text-white/40 mb-1 tracking-widest uppercase">Entity ID</div>
                                <div className="text-sm text-white/90 tracking-tight truncate">{agent.id}</div>
                            </div>

                            <div>
                                <div className="text-[10px] text-white/40 mb-2 tracking-widest uppercase">Hardware Capabilities</div>
                                <div className="flex flex-wrap gap-2">
                                    {agent.capabilities.map(cap => (
                                        <span key={cap} className="text-[10px] text-white/70 bg-white/5 border border-white/10 px-2 py-1">
                                            {cap}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="bg-white/[0.02] p-3 border border-white/5">
                                    <div className="flex items-center gap-2 text-[9px] text-white/40 mb-2 uppercase tracking-widest">
                                        <Zap className="w-3 h-3 text-white/30" /> Bal
                                    </div>
                                    <div className="text-sm text-white">${agent.settlementBalance.toLocaleString()}</div>
                                </div>

                                <div className="bg-white/[0.02] p-3 border border-white/5">
                                    <div className="flex items-center gap-2 text-[9px] text-white/40 mb-2 uppercase tracking-widest">
                                        <Cpu className="w-3 h-3 text-white/30" /> Attest
                                    </div>
                                    <div className="text-sm text-white">{(agent.attestationScore * 100).toFixed(0)}%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
