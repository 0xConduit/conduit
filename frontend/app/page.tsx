'use client';

import { useEconomyStore } from '../store/useEconomyStore';
import { AnimatePresence, motion } from 'framer-motion';
import LivingCanvas from '../components/canvas/LivingCanvas';
import DashboardBackground from '../components/canvas/DashboardBackground';
import GlobalVitals from '../components/hud/GlobalVitals';
import EntityInspector from '../components/hud/EntityInspector';
import LandingOverlay from '../components/hud/LandingOverlay';
import ActivityStrip from '../components/hud/ActivityStrip';
import ActionPanel from '../components/hud/ActionPanel';
import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';

export default function Home() {
    const viewMode = useEconomyStore(state => state.viewMode);

    useEffect(() => {
        if (viewMode === 'explore') {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    }, [viewMode]);

    return (
        <main className={`relative w-full min-h-screen bg-[#06060a] text-white font-mono ${viewMode === 'explore' ? 'overflow-hidden' : ''}`}>
            {/* Animated background layers */}
            <DashboardBackground />

            <div className="fixed inset-0 z-[2]">
                <LivingCanvas />
            </div>

            {/* Landing page */}
            <AnimatePresence>
                {viewMode === 'landing' && <LandingOverlay />}
            </AnimatePresence>

            <AnimatePresence>
                {viewMode === 'landing' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
                        <ActivityStrip />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Observe Economy mode (unauthenticated explore) */}
            <AnimatePresence>
                {viewMode === 'explore' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <button
                            onClick={() => useEconomyStore.getState().setViewMode('landing')}
                            className="fixed top-5 left-5 z-50 flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 border border-white/10 text-white/70 text-xs font-medium backdrop-blur-md hover:bg-white/20 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Back
                        </button>
                        <GlobalVitals />
                        <EntityInspector />
                        <ActivityStrip />
                        <ActionPanel />
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
