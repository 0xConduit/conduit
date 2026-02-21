'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../components/Providers';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

export default function OnboardingPage() {
    const { ready, authenticated, user, refreshUser, isWalletOnlyUser } = useAuth();
    const router = useRouter();

    const [displayName, setDisplayName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [checkingStatus, setCheckingStatus] = useState(true);

    // Pre-fill display name from linked accounts
    useEffect(() => {
        if (!user) return;
        const prefill =
            user.google?.name ||
            user.github?.username ||
            user.email?.address ||
            '';
        setDisplayName(prefill);
    }, [user]);

    // Redirect wallet-only users and already-onboarded users
    useEffect(() => {
        if (!ready || !authenticated) return;

        if (isWalletOnlyUser) {
            router.replace('/dashboard');
            return;
        }

        // Check onboarding status via API
        fetch('/api/auth/me')
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (data?.user?.onboarded) {
                    router.replace('/dashboard');
                } else {
                    setCheckingStatus(false);
                }
            })
            .catch(() => setCheckingStatus(false));
    }, [ready, authenticated, isWalletOnlyUser, router]);

    // Redirect unauthenticated
    useEffect(() => {
        if (ready && !authenticated) {
            router.replace('/');
        }
    }, [ready, authenticated, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = displayName.trim();
        if (!trimmed) return;

        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch('/api/auth/onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ display_name: trimmed }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(data.error || 'Failed to save');
            }

            // Refresh the Privy user to pick up new custom_metadata in JWT
            await refreshUser();
            router.push('/dashboard');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
            setSubmitting(false);
        }
    };

    if (!ready || !authenticated || checkingStatus) {
        return (
            <div className="h-screen w-screen bg-[#0a0a0c] flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-screen w-screen bg-[#0a0a0c] flex items-center justify-center font-sans">
            <div className="w-full max-w-md px-6">
                <div className="bg-[#0a0a0c]/90 border border-white/10 backdrop-blur-md p-8 shadow-2xl relative">
                    {/* Accent bar */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500/50 to-violet-500/30" />

                    <h1 className="text-2xl font-medium text-white mb-2">Welcome to Conduit</h1>
                    <p className="text-sm text-white/40 mb-8">Choose a display name to get started.</p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="display-name" className="block text-[10px] text-white/40 uppercase tracking-widest mb-2">
                                Display Name
                            </label>
                            <input
                                id="display-name"
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                maxLength={50}
                                required
                                autoFocus
                                className="w-full bg-white/[0.04] border border-white/10 text-white text-sm px-4 py-3 rounded-lg focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 placeholder:text-white/20 transition-colors"
                                placeholder="Enter your name"
                            />
                        </div>

                        {error && (
                            <p className="text-xs text-red-400/80">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={submitting || !displayName.trim()}
                            className="group w-full flex items-center justify-center gap-2 bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-white/90 transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            ) : (
                                <>
                                    Continue
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
