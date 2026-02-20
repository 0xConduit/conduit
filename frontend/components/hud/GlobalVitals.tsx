'use client';

import { useEconomyStore } from '../../store/useEconomyStore';
import { Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GlobalVitals() {
    const vitals = useEconomyStore(state => state.vitals);

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-6 left-6 z-10 font-mono"
        >
            <div className="bg-[#0a0a0c] border border-white/10 p-5 w-64 shadow-2xl relative">
                {/* Accent top border, uncolored */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-white/20" />

                <div className="flex items-center gap-2 mb-6">
                    <Activity className="w-4 h-4 text-white/50" />
                    <h2 className="text-xs font-semibold tracking-[0.2em] text-white/90">STATE_OBSERVER</h2>
                </div>

                <div className="space-y-5">
                    <div>
                        <div className="text-[10px] text-white/40 mb-1 tracking-widest uppercase">Total Value Locked</div>
                        <div className="text-xl text-white tracking-tight">
                            ${vitals.totalValueLocked.toLocaleString()} <span className="text-[10px] text-white/40">USDC</span>
                        </div>
                    </div>

                    <div>
                        <div className="text-[10px] text-white/40 mb-1 tracking-widest uppercase">System Attestation</div>
                        <div className="text-lg text-white tracking-tight flex items-baseline gap-2">
                            {(vitals.systemAttestation * 100).toFixed(1)}%
                            <span className="text-[10px] text-emerald-400">NOMINAL</span>
                        </div>
                        <div className="mt-2 w-full h-1 bg-white/10 overflow-hidden">
                            <div className="h-full bg-white/40" style={{ width: `${vitals.systemAttestation * 100}%` }} />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
