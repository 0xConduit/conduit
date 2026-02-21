'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import LivingCanvas from '../../components/canvas/LivingCanvas';
import DashboardBackground from '../../components/canvas/DashboardBackground';
import GlobalVitals from '../../components/hud/GlobalVitals';
import EntityInspector from '../../components/hud/EntityInspector';
import ActivityStrip from '../../components/hud/ActivityStrip';
import ActionPanel from '../../components/hud/ActionPanel';
import FilterBar from '../../components/hud/FilterBar';
import { useAuth } from '../../components/Providers';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';

export default function Dashboard() {
    const { ready, authenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'auto'; };
    }, []);

    useEffect(() => {
        if (ready && !authenticated) {
            router.push('/');
        }
    }, [ready, authenticated, router]);

    if (!ready || !authenticated) {
        return (
            <main className="relative w-full min-h-screen bg-[#06060a] text-white font-mono flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
                    <span className="text-white/40 text-sm tracking-wider">INITIALIZING</span>
                </div>
            </main>
        );
    }

    return (
        <main className="relative w-full min-h-screen bg-[#06060a] text-white font-mono overflow-hidden">
            {/* Animated background layers */}
            <DashboardBackground />

            <div className="fixed inset-0 z-[2]">
                <LivingCanvas />
            </div>

            {/* Left sidebar */}
            <motion.nav
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="fixed top-0 left-0 z-50 h-full w-14 flex flex-col items-center py-5 gap-4 bg-[#06060a]/70 border-r border-indigo-500/[0.08] backdrop-blur-xl"
            >
                <Image
                    src="/conduit-logo.png"
                    alt="Conduit"
                    width={80}
                    height={80}
                    className="rounded-lg"
                />

                <div className="w-6 border-t border-white/[0.08]" />

                <button
                    onClick={() => router.push('/')}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/[0.06] border border-white/10 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                    title="Back to landing"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
            </motion.nav>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <FilterBar />
                <GlobalVitals />
                <EntityInspector />
                <ActivityStrip />
                <ActionPanel />
            </motion.div>
        </main>
    );
}
