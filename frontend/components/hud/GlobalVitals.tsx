'use client';

import { useEconomyStore } from '../../store/useEconomyStore';
import { useAuth } from '../Providers';
import { Activity, Wallet, Pencil, Check, LogOut, Users, Link2, FileText, Coins } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef, useMemo } from 'react';

function getStoredName(wallet: string): string | null {
    try { return localStorage.getItem(`conduit_name_${wallet}`); } catch { return null; }
}

function storeName(wallet: string, name: string) {
    try { localStorage.setItem(`conduit_name_${wallet}`, name); } catch {}
}

export default function GlobalVitals() {
    const vitals = useEconomyStore(state => state.vitals);
    const agents = useEconomyStore(state => state.agents);
    const connections = useEconomyStore(state => state.connections);
    const tasks = useEconomyStore(state => state.tasks);
    const backendAvailable = useEconomyStore(state => state.backendAvailable);
    const contractGetContractBalance = useEconomyStore(state => state.contractGetContractBalance);
    const contractGetAgentCount = useEconomyStore(state => state.contractGetAgentCount);
    const contractGetJobCount = useEconomyStore(state => state.contractGetJobCount);
    const { user, logout } = useAuth();

    // Derived metrics
    const agentList = useMemo(() => Object.values(agents), [agents]);
    const taskList = useMemo(() => Object.values(tasks), [tasks]);
    const connectionCount = Object.keys(connections).length;
    const registeredCount = agentList.filter(a => a.conduitRegistered).length;
    const activeTaskCount = taskList.filter(t => t.status === 'pending' || t.status === 'dispatched').length;
    const completedTaskCount = taskList.filter(t => t.status === 'completed').length;

    // On-chain data fetched periodically
    const [contractBalance, setContractBalance] = useState<string | null>(null);
    const [onChainAgents, setOnChainAgents] = useState<number | null>(null);
    const [onChainJobs, setOnChainJobs] = useState<number | null>(null);

    useEffect(() => {
        let mounted = true;
        const fetchOnChain = async () => {
            const [bal, count, jobs] = await Promise.all([
                contractGetContractBalance(),
                contractGetAgentCount(),
                contractGetJobCount(),
            ]);
            if (!mounted) return;
            if (bal) setContractBalance(bal.balance);
            setOnChainAgents(count);
            if (jobs) setOnChainJobs(jobs.count);
        };
        fetchOnChain();
        const interval = setInterval(fetchOnChain, 15000);
        return () => { mounted = false; clearInterval(interval); };
    }, [contractGetContractBalance, contractGetAgentCount, contractGetJobCount]);

    const walletAddress = user?.wallet?.address;

    const [customName, setCustomName] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Load saved name when wallet connects
    useEffect(() => {
        if (walletAddress) {
            setCustomName(getStoredName(walletAddress));
        }
    }, [walletAddress]);

    // Focus input when entering edit mode
    useEffect(() => {
        if (isEditing) inputRef.current?.focus();
    }, [isEditing]);

    const displayName = customName
        ?? user?.google?.name
        ?? user?.email?.address
        ?? (walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : null);

    const startEditing = () => {
        setDraft(customName ?? '');
        setIsEditing(true);
    };

    const saveName = () => {
        const trimmed = draft.trim();
        if (walletAddress && trimmed) {
            storeName(walletAddress, trimmed);
            setCustomName(trimmed);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') saveName();
        if (e.key === 'Escape') setIsEditing(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-6 left-20 z-10 font-mono"
        >
            <div className="bg-[#0a0b14]/70 backdrop-blur-xl border border-indigo-500/[0.08] p-5 w-64 shadow-2xl shadow-indigo-500/5 relative rounded-sm">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

                <div className="flex items-center gap-2 mb-6">
                    <Activity className="w-4 h-4 text-white/50" />
                    <h2 className="text-xs font-semibold tracking-[0.2em] text-white/90">STATE_OBSERVER</h2>
                </div>

                <div className="space-y-4">
                    {/* Backend status */}
                    <div className="flex items-center justify-between">
                        <div className="text-[10px] text-white/40 tracking-widest uppercase">Backend</div>
                        <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${backendAvailable ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            <span className={`text-[10px] ${backendAvailable ? 'text-emerald-400' : 'text-red-400'}`}>
                                {backendAvailable ? 'LIVE' : 'OFFLINE'}
                            </span>
                        </div>
                    </div>

                    {/* TVL */}
                    <div>
                        <div className="text-[10px] text-white/40 mb-1 tracking-widest uppercase">Total Value Locked</div>
                        <div className="text-xl text-white tracking-tight">
                            ${vitals.totalValueLocked.toLocaleString()} <span className="text-[10px] text-white/40">USDC</span>
                        </div>
                    </div>

                    {/* System Attestation */}
                    <div>
                        <div className="text-[10px] text-white/40 mb-1 tracking-widest uppercase">System Attestation</div>
                        <div className="text-lg text-white tracking-tight flex items-baseline gap-2">
                            {(vitals.systemAttestation * 100).toFixed(1)}%
                            <span className={`text-[10px] ${vitals.systemAttestation >= 0.8 ? 'text-emerald-400' : vitals.systemAttestation >= 0.5 ? 'text-amber-400' : 'text-red-400'}`}>
                                {vitals.systemAttestation >= 0.8 ? 'NOMINAL' : vitals.systemAttestation >= 0.5 ? 'DEGRADED' : 'CRITICAL'}
                            </span>
                        </div>
                        <div className="mt-2 w-full h-1 bg-white/10 overflow-hidden">
                            <div className="h-full bg-white/40" style={{ width: `${vitals.systemAttestation * 100}%` }} />
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="w-full h-px bg-white/5" />

                    {/* Agents */}
                    <div>
                        <div className="flex items-center gap-1.5 mb-1">
                            <Users className="w-3 h-3 text-white/30" />
                            <div className="text-[10px] text-white/40 tracking-widest uppercase">Agents</div>
                        </div>
                        <div className="flex items-baseline gap-3">
                            <span className="text-lg text-white">{agentList.length}</span>
                            <span className="text-[10px] text-white/30">
                                {registeredCount} on-chain
                            </span>
                            {onChainAgents !== null && onChainAgents !== registeredCount && (
                                <span className="text-[10px] text-indigo-400/60">{onChainAgents} contract</span>
                            )}
                        </div>
                    </div>

                    {/* Tasks */}
                    <div>
                        <div className="flex items-center gap-1.5 mb-1">
                            <FileText className="w-3 h-3 text-white/30" />
                            <div className="text-[10px] text-white/40 tracking-widest uppercase">Tasks</div>
                        </div>
                        <div className="flex items-baseline gap-3">
                            <span className="text-lg text-white">{taskList.length}</span>
                            <span className="text-[10px] text-white/30">
                                {activeTaskCount > 0 && <>{activeTaskCount} active</>}
                                {activeTaskCount > 0 && completedTaskCount > 0 && ' · '}
                                {completedTaskCount > 0 && <>{completedTaskCount} done</>}
                            </span>
                        </div>
                        {onChainJobs !== null && onChainJobs > 0 && (
                            <div className="text-[10px] text-indigo-400/60 mt-0.5">{onChainJobs} on-chain jobs</div>
                        )}
                    </div>

                    {/* Network Links */}
                    <div>
                        <div className="flex items-center gap-1.5 mb-1">
                            <Link2 className="w-3 h-3 text-white/30" />
                            <div className="text-[10px] text-white/40 tracking-widest uppercase">Network Links</div>
                        </div>
                        <div className="flex items-baseline gap-3">
                            <span className="text-lg text-white">{connectionCount}</span>
                            <span className="text-[10px] text-white/30">active</span>
                        </div>
                    </div>

                    {/* Contract Escrow */}
                    {contractBalance !== null && (
                        <div>
                            <div className="flex items-center gap-1.5 mb-1">
                                <Coins className="w-3 h-3 text-white/30" />
                                <div className="text-[10px] text-white/40 tracking-widest uppercase">Contract Escrow</div>
                            </div>
                            <div className="text-lg text-white tracking-tight">
                                {parseFloat(contractBalance).toFixed(4)} <span className="text-[10px] text-white/40">ETH</span>
                            </div>
                        </div>
                    )}

                    {/* Active Processes */}
                    {vitals.activeProcesses > 0 && (
                        <div className="flex items-center justify-between">
                            <div className="text-[10px] text-white/40 tracking-widest uppercase">Active Processes</div>
                            <div className="text-sm text-amber-400">{vitals.activeProcesses}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Wallet identity */}
            {walletAddress && (
                <div className="mt-2 bg-[#0a0b14]/70 backdrop-blur-xl border border-indigo-500/[0.08] p-4 w-64 shadow-2xl shadow-indigo-500/5 relative rounded-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <Wallet className="w-4 h-4 text-white/50" />
                        <h2 className="text-xs font-semibold tracking-[0.2em] text-white/90">IDENTITY</h2>
                    </div>

                    <div className="text-[10px] text-white/40 tracking-widest uppercase mb-1">Name</div>
                    {isEditing ? (
                        <div className="flex items-center gap-1.5 mb-3">
                            <input
                                ref={inputRef}
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onBlur={saveName}
                                placeholder="Enter name"
                                className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white/80 placeholder-white/20 focus:outline-none focus:border-white/30"
                            />
                            <button onClick={saveName} className="p-1.5 rounded border border-white/10 bg-white/[0.03] text-white/40 hover:border-emerald-400/30 hover:text-emerald-400 hover:bg-emerald-400/5 transition-all">
                                <Check className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 mb-3">
                            <span className="text-xs text-white/80 truncate">{displayName}</span>
                            <button onClick={startEditing} className="p-1 rounded border border-white/10 bg-white/[0.03] text-white/40 hover:border-white/20 hover:text-white/70 hover:bg-white/10 transition-all">
                                <Pencil className="w-3 h-3" />
                            </button>
                        </div>
                    )}

                    <div className="text-[10px] text-white/40 tracking-widest uppercase mb-1">Wallet</div>
                    <div className="text-xs text-white/60 font-mono truncate">{walletAddress}</div>

                    <button
                        onClick={() => logout()}
                        className="mt-4 w-full py-1.5 rounded text-xs font-semibold border transition-all flex items-center justify-center gap-2 border-red-400/30 text-red-400/70 hover:bg-red-400/5 hover:text-red-400"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        Logout
                    </button>
                </div>
            )}
        </motion.div>
    );
}
