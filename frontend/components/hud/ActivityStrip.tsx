'use client';

import { useEconomyStore, ActivityEvent } from '../../store/useEconomyStore';
import { useShallow } from 'zustand/react/shallow';
import { AnimatePresence, motion } from 'framer-motion';

export default function ActivityStrip() {
    const activityLog = useEconomyStore(useShallow(state => state.activityLog.slice(0, 5)));

    return (
        <div className="fixed bottom-0 left-14 right-0 h-12 border-t border-indigo-500/[0.08] bg-[#06060a]/70 backdrop-blur-xl z-30 font-mono text-[11px] flex items-center px-6">
            <div className="shrink-0 flex items-center gap-2 text-white/40 tracking-widest uppercase mr-8">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                SYSTEM_LOG
            </div>

            <div className="flex-1 overflow-hidden relative flex items-center gap-8 whitespace-nowrap">
                <AnimatePresence initial={false}>
                    {activityLog.map((evt: ActivityEvent) => (
                        <motion.div
                            key={evt.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, position: 'absolute' }}
                            className="flex items-center gap-2"
                        >
                            <span className="text-white/30 truncate max-w-[50px]">
                                [{new Date(evt.timestamp).toISOString().split('T')[1].slice(0, 8)}]
                            </span>

                            <span className={`px-1.5 py-0.5 text-[9px] uppercase tracking-wider rounded-sm ${evt.type === 'hired' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                    evt.type === 'payment' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                        'bg-slate-500/10 text-slate-300 border border-slate-500/20'
                                }`}>
                                {evt.type}
                            </span>

                            <span className="text-white/70 truncate max-w-[200px] md:max-w-md">
                                {evt.message}
                            </span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Fade right edge */}
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#06060a]/70 to-transparent pointer-events-none" />
        </div>
    );
}
