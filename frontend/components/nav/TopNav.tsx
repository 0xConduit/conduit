'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Layers, ArrowRight } from 'lucide-react';
import { useAuth } from '../Providers';

interface TopNavProps {
  variant?: 'transparent' | 'solid';
}

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/agents', label: 'Economy' },
  { href: '/register', label: 'Register' },
];

export default function TopNav({ variant = 'solid' }: TopNavProps) {
  const { authenticated, login, logout, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isTransparent = variant === 'transparent';

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-[64px] border-b ${
        isTransparent
          ? 'bg-transparent border-transparent'
          : 'bg-[#0a0a0c]/90 backdrop-blur-md border-white/[0.06]'
      }`}
    >
      <div className="flex items-center justify-between w-full h-full max-w-7xl mx-auto px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-white font-medium tracking-tight">
          <Layers className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">Conduit</span>
        </Link>

        {/* Center links */}
        <div className="hidden md:flex items-center gap-8 text-[12px] font-medium">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-colors ${
                pathname === link.href
                  ? 'text-white'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Auth */}
        <div className="flex items-center gap-3">
          {authenticated ? (
            <>
              <button
                onClick={() => router.push('/dashboard')}
                className="group flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest px-4 py-2 rounded-full bg-white text-black hover:bg-white/90 transition-colors"
              >
                Dashboard
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => logout()}
                className="text-[11px] text-white/40 hover:text-white/70 transition-colors uppercase tracking-widest"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => login()}
              className="group flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest px-4 py-2 rounded-full bg-white/10 text-white border border-transparent hover:bg-white/20 transition-colors"
            >
              Connect
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
