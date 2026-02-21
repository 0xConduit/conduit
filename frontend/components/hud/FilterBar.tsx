'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter } from 'lucide-react';
import { useEconomyStore, type DeployedChain, type AgentRole } from '../../store/useEconomyStore';

const CHAINS: { value: DeployedChain | 'all'; label: string; dot: string }[] = [
    { value: 'all',    label: 'All Chains', dot: 'bg-white/40' },
    { value: 'base',   label: 'Base',       dot: 'bg-blue-400' },
    { value: 'hedera', label: 'Hedera',     dot: 'bg-purple-400' },
    { value: 'zerog',  label: '0G',         dot: 'bg-emerald-400' },
    { value: '0g',     label: '0G AI',      dot: 'bg-emerald-300' },
];

const PAUSED_OPTIONS: { value: 'all' | 'active' | 'paused'; label: string; dot: string }[] = [
    { value: 'all',    label: 'All',    dot: 'bg-white/40' },
    { value: 'active', label: 'Active', dot: 'bg-emerald-400' },
    { value: 'paused', label: 'Paused', dot: 'bg-amber-400' },
];

const ROLE_OPTIONS: { value: AgentRole | 'all'; label: string; dot: string }[] = [
    { value: 'all',      label: 'All Roles', dot: 'bg-white/40' },
    { value: 'router',   label: 'Router',    dot: 'bg-blue-400' },
    { value: 'executor', label: 'Executor',  dot: 'bg-slate-400' },
    { value: 'settler',  label: 'Settler',   dot: 'bg-emerald-400' },
];

const STATUS_OPTIONS: { value: 'idle' | 'processing' | 'dormant' | 'all'; label: string; dot: string }[] = [
    { value: 'all',        label: 'All',        dot: 'bg-white/40' },
    { value: 'idle',       label: 'Idle',       dot: 'bg-sky-400' },
    { value: 'processing', label: 'Processing', dot: 'bg-yellow-400' },
    { value: 'dormant',    label: 'Dormant',    dot: 'bg-red-400' },
];

const REG_OPTIONS: { value: 'all' | 'registered' | 'unregistered'; label: string }[] = [
    { value: 'all',          label: 'All' },
    { value: 'registered',   label: 'Registered' },
    { value: 'unregistered', label: 'Unregistered' },
];

const ATTESTATION_OPTIONS: { value: 'all' | 'high' | 'medium' | 'low'; label: string; desc: string; dot: string }[] = [
    { value: 'all',    label: 'All',    desc: '',          dot: 'bg-white/40' },
    { value: 'high',   label: 'High',   desc: '\u2265 0.9', dot: 'bg-emerald-400' },
    { value: 'medium', label: 'Medium', desc: '0.5\u20130.9', dot: 'bg-yellow-400' },
    { value: 'low',    label: 'Low',    desc: '< 0.5',     dot: 'bg-red-400' },
];

const BALANCE_OPTIONS: { value: 'all' | 'high' | 'medium' | 'low' | 'zero'; label: string; desc: string; dot: string }[] = [
    { value: 'all',    label: 'All',    desc: '',            dot: 'bg-white/40' },
    { value: 'high',   label: 'High',   desc: '\u2265 50k',  dot: 'bg-emerald-400' },
    { value: 'medium', label: 'Medium', desc: '5k\u201350k', dot: 'bg-yellow-400' },
    { value: 'low',    label: 'Low',    desc: '1\u20135k',   dot: 'bg-orange-400' },
    { value: 'zero',   label: 'Zero',   desc: '0',           dot: 'bg-red-400' },
];

const WALLET_OPTIONS: { value: 'all' | 'yes' | 'no'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'yes', label: 'Has Wallet' },
    { value: 'no',  label: 'No Wallet' },
];

const INFT_OPTIONS: { value: 'all' | 'yes' | 'no'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'yes', label: 'Has INFT' },
    { value: 'no',  label: 'No INFT' },
];

const btnCls = (active: boolean) =>
    `flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs transition-all ${
        active
            ? 'border-white/30 bg-white/10 text-white'
            : 'border-white/[0.06] bg-white/[0.03] text-white/40 hover:border-white/15 hover:text-white/60'
    }`;

const sectionLabel = "text-[10px] uppercase tracking-widest text-white/30 font-semibold mb-2 block";

export default function FilterBar() {
    const [open, setOpen] = useState(false);

    const chainFilter = useEconomyStore(s => s.chainFilter);
    const registeredFilter = useEconomyStore(s => s.registeredFilter);
    const pausedFilter = useEconomyStore(s => s.pausedFilter);
    const roleFilter = useEconomyStore(s => s.roleFilter);
    const statusFilter = useEconomyStore(s => s.statusFilter);
    const attestationFilter = useEconomyStore(s => s.attestationFilter);
    const balanceFilter = useEconomyStore(s => s.balanceFilter);
    const walletFilter = useEconomyStore(s => s.walletFilter);
    const inftFilter = useEconomyStore(s => s.inftFilter);
    const capabilityFilter = useEconomyStore(s => s.capabilityFilter);

    const setChainFilter = useEconomyStore(s => s.setChainFilter);
    const setRegisteredFilter = useEconomyStore(s => s.setRegisteredFilter);
    const setPausedFilter = useEconomyStore(s => s.setPausedFilter);
    const setRoleFilter = useEconomyStore(s => s.setRoleFilter);
    const setStatusFilter = useEconomyStore(s => s.setStatusFilter);
    const setAttestationFilter = useEconomyStore(s => s.setAttestationFilter);
    const setBalanceFilter = useEconomyStore(s => s.setBalanceFilter);
    const setWalletFilter = useEconomyStore(s => s.setWalletFilter);
    const setInftFilter = useEconomyStore(s => s.setInftFilter);
    const setCapabilityFilter = useEconomyStore(s => s.setCapabilityFilter);

    const activeCount = [
        chainFilter !== 'all',
        registeredFilter !== 'all',
        pausedFilter !== 'all',
        roleFilter !== 'all',
        statusFilter !== 'all',
        attestationFilter !== 'all',
        balanceFilter !== 'all',
        walletFilter !== 'all',
        inftFilter !== 'all',
        capabilityFilter !== '',
    ].filter(Boolean).length;

    const hasActiveFilter = activeCount > 0;

    const clearAll = () => {
        setChainFilter('all');
        setRegisteredFilter('all');
        setPausedFilter('all');
        setRoleFilter('all');
        setStatusFilter('all');
        setAttestationFilter('all');
        setBalanceFilter('all');
        setWalletFilter('all');
        setInftFilter('all');
        setCapabilityFilter('');
    };

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
            <button
                onClick={() => setOpen(o => !o)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium backdrop-blur-md transition-all ${
                    hasActiveFilter
                        ? 'bg-violet-500/20 border-violet-400/40 text-violet-300'
                        : 'bg-[#0a0b14]/70 border-indigo-500/[0.08] text-white/60 hover:border-indigo-500/20 hover:text-white/80 backdrop-blur-xl'
                }`}
            >
                <Filter className="w-3.5 h-3.5" />
                <span>Filter{activeCount > 0 ? ` (${activeCount})` : ''}</span>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="bg-[#0a0b14]/80 border border-indigo-500/[0.08] rounded-xl p-4 backdrop-blur-xl shadow-2xl shadow-indigo-500/5 w-[340px] max-h-[75vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10"
                    >
                        {/* ── On-Chain Filters ── */}
                        <div className="text-[9px] uppercase tracking-[0.2em] text-violet-400/60 font-bold mb-2">On-Chain (Contract)</div>

                        {/* Chain */}
                        <div className="mb-3">
                            <label className={sectionLabel}>Chain</label>
                            <div className="flex flex-wrap gap-1.5">
                                {CHAINS.map(c => (
                                    <button key={c.value} onClick={() => setChainFilter(c.value)} className={btnCls(chainFilter === c.value)}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                                        {c.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Paused / Active */}
                        <div className="mb-3">
                            <label className={sectionLabel}>Agent State</label>
                            <div className="flex flex-wrap gap-1.5">
                                {PAUSED_OPTIONS.map(o => (
                                    <button key={o.value} onClick={() => setPausedFilter(o.value)} className={btnCls(pausedFilter === o.value)}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${o.dot}`} />
                                        {o.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Registration */}
                        <div className="mb-3">
                            <label className={sectionLabel}>Contract Registration</label>
                            <div className="flex gap-1.5">
                                {REG_OPTIONS.map(o => (
                                    <button key={o.value} onClick={() => setRegisteredFilter(o.value)} className={btnCls(registeredFilter === o.value)}>
                                        {o.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Attestation Score */}
                        <div className="mb-3">
                            <label className={sectionLabel}>Reputation / Attestation</label>
                            <div className="flex flex-wrap gap-1.5">
                                {ATTESTATION_OPTIONS.map(o => (
                                    <button key={o.value} onClick={() => setAttestationFilter(o.value)} className={btnCls(attestationFilter === o.value)}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${o.dot}`} />
                                        {o.label}
                                        {o.desc && <span className="text-white/20 text-[9px]">{o.desc}</span>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Balance */}
                        <div className="mb-3">
                            <label className={sectionLabel}>Settlement Balance</label>
                            <div className="flex flex-wrap gap-1.5">
                                {BALANCE_OPTIONS.map(o => (
                                    <button key={o.value} onClick={() => setBalanceFilter(o.value)} className={btnCls(balanceFilter === o.value)}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${o.dot}`} />
                                        {o.label}
                                        {o.desc && <span className="text-white/20 text-[9px]">{o.desc}</span>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-white/[0.06] my-3" />
                        <div className="text-[9px] uppercase tracking-[0.2em] text-sky-400/60 font-bold mb-2">Agent Properties</div>

                        {/* Role */}
                        <div className="mb-3">
                            <label className={sectionLabel}>Role</label>
                            <div className="flex flex-wrap gap-1.5">
                                {ROLE_OPTIONS.map(o => (
                                    <button key={o.value} onClick={() => setRoleFilter(o.value)} className={btnCls(roleFilter === o.value)}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${o.dot}`} />
                                        {o.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Status */}
                        <div className="mb-3">
                            <label className={sectionLabel}>Status</label>
                            <div className="flex flex-wrap gap-1.5">
                                {STATUS_OPTIONS.map(o => (
                                    <button key={o.value} onClick={() => setStatusFilter(o.value)} className={btnCls(statusFilter === o.value)}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${o.dot}`} />
                                        {o.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Wallet */}
                        <div className="mb-3">
                            <label className={sectionLabel}>Wallet</label>
                            <div className="flex gap-1.5">
                                {WALLET_OPTIONS.map(o => (
                                    <button key={o.value} onClick={() => setWalletFilter(o.value)} className={btnCls(walletFilter === o.value)}>
                                        {o.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* INFT */}
                        <div className="mb-3">
                            <label className={sectionLabel}>INFT Token (0G Identity)</label>
                            <div className="flex gap-1.5">
                                {INFT_OPTIONS.map(o => (
                                    <button key={o.value} onClick={() => setInftFilter(o.value)} className={btnCls(inftFilter === o.value)}>
                                        {o.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Capability search */}
                        <div className="mb-1">
                            <label className={sectionLabel}>Capability</label>
                            <input
                                type="text"
                                value={capabilityFilter}
                                onChange={e => setCapabilityFilter(e.target.value)}
                                placeholder="e.g. routing, defi, scraping..."
                                className="w-full bg-[#0a0a0c] border border-white/10 rounded-md px-2.5 py-1.5 text-xs text-white/80 placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                            />
                        </div>

                        {/* Clear all */}
                        {hasActiveFilter && (
                            <button
                                onClick={clearAll}
                                className="mt-3 w-full text-[10px] text-white/30 hover:text-white/60 transition-colors"
                            >
                                Clear all filters
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
