'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../components/Providers';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogOut, Copy, Wallet, Layers, Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import LivingCanvas from '../../components/canvas/LivingCanvas';
import GlobalVitals from '../../components/hud/GlobalVitals';
import EntityInspector from '../../components/hud/EntityInspector';
import AgentDetail from '../../components/agent/AgentDetail';
import type { Agent, User } from '../../lib/types';

function truncateAddress(address: string) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function DashboardPage() {
    const { ready, authenticated, user, logout } = useAuth();
    const router = useRouter();
    const [copied, setCopied] = useState(false);
    const [apiUser, setApiUser] = useState<User | null>(null);
    const [myAgent, setMyAgent] = useState<Agent | null>(null);
    const [agentLoading, setAgentLoading] = useState(true);

    useEffect(() => {
        if (ready && !authenticated) {
            router.replace('/');
        }
    }, [ready, authenticated, router]);

    // Fetch user profile from API
    useEffect(() => {
        if (!authenticated) return;
        fetch('/api/auth/me')
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (data?.user) setApiUser(data.user);
            })
            .catch(() => {});
    }, [authenticated]);

    // Fetch current user's agents from API
    useEffect(() => {
        if (!authenticated || !apiUser) return;
        setAgentLoading(true);
        fetch('/api/agents')
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (data?.agents) {
                    const mine = (data.agents as Agent[]).find(a => a.owner_id === apiUser.id);
                    setMyAgent(mine ?? null);
                }
            })
            .catch(() => {})
            .finally(() => setAgentLoading(false));
    }, [authenticated, apiUser]);

    const handleCopyWallet = async () => {
        const address = user?.wallet?.address;
        if (!address) return;
        await navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleLogout = async () => {
        await logout();
        router.replace('/');
    };

    // Show nothing while Privy is loading or if not authenticated
    if (!ready || !authenticated) {
        return (
            <div className="h-screen w-screen bg-[#0a0a0c] flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
            </div>
        );
    }

    const displayName = apiUser?.display_name || user?.email?.address || user?.google?.email || user?.github?.username || 'User';
    const walletAddress = user?.wallet?.address;
    const initials = displayName.charAt(0).toUpperCase();

    return (
        <div className="h-screen w-screen bg-[#0a0a0c] overflow-hidden relative font-sans">
            {/* Live Canvas Background */}
            <LivingCanvas />

            {/* HUD Overlays */}
            <GlobalVitals />
            <EntityInspector />

            {/* Agent Profile / Register CTA — Top-right */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="absolute top-6 right-6 z-20 font-mono w-80"
            >
                {agentLoading ? (
                    <div className="bg-[#0a0a0c]/90 border border-white/10 backdrop-blur-md p-5 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                    </div>
                ) : myAgent ? (
                    <AgentDetail agent={myAgent} />
                ) : (
                    <div className="bg-[#0a0a0c]/90 border border-white/10 backdrop-blur-md p-5 shadow-2xl">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500/50 to-violet-500/30" />
                        <div className="text-sm text-white/80 mb-2">No Agent Registered</div>
                        <p className="text-[10px] text-white/40 mb-4">Register your agent to join the economy.</p>
                        <Link
                            href="/register"
                            className="group inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest text-indigo-300/80 hover:text-indigo-300 transition-colors"
                        >
                            Register Your Agent
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </div>
                )}
            </motion.div>

            {/* Profile Card — Bottom-left */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="absolute bottom-6 left-6 z-20 font-mono"
            >
                <div className="bg-[#0a0a0c]/90 border border-white/10 backdrop-blur-md p-5 w-72 shadow-2xl relative">
                    {/* Accent bar */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500/50 to-violet-500/30" />

                    {/* Header */}
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-sm font-semibold text-indigo-300">
                            {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm text-white/90 truncate">{displayName}</div>
                            <div className="text-[10px] text-white/30 uppercase tracking-widest">
                                Authenticated
                            </div>
                        </div>
                    </div>

                    {/* Wallet */}
                    {walletAddress && (
                        <div className="mb-5">
                            <div className="text-[10px] text-white/40 mb-1.5 tracking-widest uppercase flex items-center gap-1.5">
                                <Wallet className="w-3 h-3" />
                                Embedded Wallet
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-white/70 font-mono">{truncateAddress(walletAddress)}</span>
                                <button
                                    onClick={handleCopyWallet}
                                    className="text-white/30 hover:text-white/60 transition-colors"
                                    title="Copy address"
                                >
                                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-3 border-t border-white/[0.06]">
                        <button
                            onClick={() => router.push('/')}
                            className="flex items-center gap-2 text-[10px] text-white/40 hover:text-white/70 transition-colors uppercase tracking-widest"
                        >
                            <Layers className="w-3 h-3" />
                            Home
                        </button>
                        <div className="flex-1" />
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 text-[10px] text-white/40 hover:text-red-400/70 transition-colors uppercase tracking-widest"
                        >
                            <LogOut className="w-3 h-3" />
                            Logout
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
