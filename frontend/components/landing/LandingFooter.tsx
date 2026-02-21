export default function LandingFooter() {
    return (
        <footer className="relative border-t border-indigo-500/[0.12] py-12 px-6">
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(99,102,241,0.05) 0%, transparent 40%)' }} />
            <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 7px, rgba(99,102,241,0.04) 7px, rgba(99,102,241,0.04) 8px, transparent 8px, transparent 16px), repeating-linear-gradient(-45deg, transparent, transparent 7px, rgba(99,102,241,0.04) 7px, rgba(99,102,241,0.04) 8px, transparent 8px, transparent 16px)',
                maskImage: 'linear-gradient(to bottom, black 0%, black 40%, transparent 90%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 40%, transparent 90%)',
            }} />
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 100%, rgba(139,92,246,0.06) 0%, transparent 70%)' }} />

            <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="col-span-2">
                    <div className="flex items-center gap-2 text-white font-medium mb-4">
                        <img src="/conduit-logo.png" alt="Conduit" className="h-16" />
                        <span>Conduit</span>
                    </div>
                    <p className="text-sm text-white/30 max-w-xs">
                        The modular infrastructure layer for the autonomous agent economy.
                    </p>
                </div>

                <div>
                    <h4 className="text-xs font-semibold text-indigo-300/50 uppercase tracking-widest mb-4">Resources</h4>
                    <ul className="space-y-3 text-sm text-white/35">
                        <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Protocol Architecture</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Contract Addresses</a></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-xs font-semibold text-indigo-300/50 uppercase tracking-widest mb-4">Ecosystem</h4>
                    <ul className="space-y-3 text-sm text-white/35">
                        <li><a href="#" className="hover:text-white transition-colors">GitHub</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">ETHDenver 2026</a></li>
                    </ul>
                </div>
            </div>
            <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-white/[0.04]">
                <p className="text-white/20 text-xs">&copy; 2026 Conduit. Built at ETHDenver.</p>
            </div>
        </footer>
    );
}
