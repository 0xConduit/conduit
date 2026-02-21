'use client';

import { useEconomyStore } from '../../store/useEconomyStore';
import { useAuth } from '../Providers';
import { Activity, Wallet, Pencil, Check, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

function getStoredName(wallet: string): string | null {
    try { return localStorage.getItem(`conduit_name_${wallet}`); } catch { return null; }
}

function storeName(wallet: string, name: string) {
    try { localStorage.setItem(`conduit_name_${wallet}`, name); } catch {}
}

export default function GlobalVitals() {
    const vitals = useEconomyStore(state => state.vitals);
    const { user, logout } = useAuth();

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
            <div className="bg-[#0a0a0c] border border-white/10 p-5 w-64 shadow-2xl relative">
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

            {/* Wallet identity */}
            {walletAddress && (
                <div className="mt-2 bg-[#0a0a0c] border border-white/10 p-4 w-64 shadow-2xl relative">
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
                                className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white/90 placeholder:text-white/20 outline-none focus:border-indigo-400/40"
                            />
                            <button onClick={saveName} className="p-1 text-white/40 hover:text-emerald-400 transition-colors">
                                <Check className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 mb-3">
                            <span className="text-sm text-white/80 truncate">{displayName}</span>
                            <button onClick={startEditing} className="p-0.5 text-white/30 hover:text-white/70 transition-colors">
                                <Pencil className="w-3 h-3" />
                            </button>
                        </div>
                    )}

                    <div className="text-[10px] text-white/40 tracking-widest uppercase mb-1">Wallet</div>
                    <div className="text-xs text-white/60 font-mono truncate">{walletAddress}</div>

                    <button
                        onClick={() => logout()}
                        className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 rounded bg-white/5 border border-white/10 text-white/50 text-xs font-medium hover:bg-red-500/10 hover:border-red-400/20 hover:text-red-400 transition-colors"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        Logout
                    </button>
                </div>
            )}
        </motion.div>
    );
}
