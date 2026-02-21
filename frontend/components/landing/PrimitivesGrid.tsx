import { motion } from 'framer-motion';
import { Fingerprint, ShieldCheck, Zap, Database, Search, Eye } from 'lucide-react';
import { staggerContainer, fadeUp } from './animations';

const primitives = [
    { tag: "01", title: "IDENTITY", icon: <Fingerprint className="w-5 h-5 text-indigo-300/60" />, desc: "Agent identity and registry via iNFTs and Kite credentials." },
    { tag: "02", title: "DISCOVERY", icon: <Search className="w-5 h-5 text-indigo-300/60" />, desc: "Capability indexing and AI-powered semantic matching." },
    { tag: "03", title: "SETTLEMENT", icon: <Zap className="w-5 h-5 text-indigo-300/60" />, desc: "On-chain escrow and micropayments via Hedera HTS and Kite x402." },
    { tag: "04", title: "ATTESTATION", icon: <ShieldCheck className="w-5 h-5 text-indigo-300/60" />, desc: "Verifiable execution records logged to Hedera Consensus Service." },
    { tag: "05", title: "COORDINATION", icon: <Database className="w-5 h-5 text-indigo-300/60" />, desc: "Multi-agent task orchestration through OpenClaw runtime." },
    { tag: "06", title: "OBSERVABILITY", icon: <Eye className="w-5 h-5 text-indigo-300/60" />, desc: "Real-time dashboards for earnings, trust scores, and network activity." },
];

interface PrimitivesGridProps {
    prefersReducedMotion: boolean | null;
}

export default function PrimitivesGrid({ prefersReducedMotion }: PrimitivesGridProps) {
    return (
        <div className="relative">
            {/* Dot grid */}
            <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: 'radial-gradient(circle, rgba(129,140,248,0.15) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
                maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 70%)',
                WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 70%)',
            }} />
            {/* Violet radial glow */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 50% at 55% 55%, rgba(139,92,246,0.08) 0%, transparent 70%)' }} />
            {/* Top-edge fade */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(99,102,241,0.05) 0%, transparent 20%)' }} />

            <section id="agents" className="relative py-32 px-6 max-w-7xl mx-auto">
                <div className="mb-16">
                    <h2 className="text-3xl font-medium text-white mb-4">Core Primitives</h2>
                    <p className="text-white/40 max-w-xl">Six infrastructure modules that any agent system can plug into.</p>
                </div>

                <motion.div
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    variants={staggerContainer}
                    initial={prefersReducedMotion ? "visible" : "hidden"}
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.15 }}
                >
                    {primitives.map((prim, i) => (
                        <motion.div
                            key={i}
                            className="group relative border border-white/[0.06] bg-white/[0.02] rounded-lg p-6 hover:border-indigo-500/15 hover:bg-indigo-500/[0.03] transition-colors duration-300"
                            variants={prefersReducedMotion ? undefined : fadeUp}
                        >
                            <div className="absolute top-3 left-3 w-1.5 h-1.5 rounded-full bg-indigo-500/25 group-hover:bg-indigo-400/50 transition-colors duration-300" />
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-mono text-white/25">{prim.tag}</span>
                                <div className="p-2 border border-white/[0.06] rounded-md bg-white/[0.02] group-hover:border-indigo-500/20 group-hover:bg-indigo-500/[0.06] transition-colors duration-300">
                                    {prim.icon}
                                </div>
                            </div>
                            <h3 className="text-sm font-semibold text-white/90 mb-2">{prim.title}</h3>
                            <p className="text-sm text-white/45 leading-relaxed">{prim.desc}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </section>
        </div>
    );
}
