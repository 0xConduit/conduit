'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import LivingCanvas from '../../components/canvas/LivingCanvas';
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
            <main className="relative w-full min-h-screen bg-[#0a0a0c] text-white font-mono flex items-center justify-center">
                <span className="text-white/40 text-sm">Loading...</span>
            </main>
        );
    }

    return (
        <main className="relative w-full min-h-screen bg-[#0a0a0c] text-white font-mono overflow-hidden">
            <div className="fixed inset-0 z-0">
                <LivingCanvas />
            </div>

            {/* Background grid */}
            <div className="fixed inset-0 z-[1] pointer-events-none" style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                backgroundSize: '48px 48px',
            }} />

            {/* Left sidebar */}
            <motion.nav
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="fixed top-0 left-0 z-50 h-full w-14 flex flex-col items-center py-5 gap-4 bg-[#0a0a0c]/80 border-r border-white/[0.06] backdrop-blur-md"
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
