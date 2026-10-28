'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Layers,
  Network,
  Users,
  ShieldAlert,
  Coins,
  Wallet,
  CheckCircle2,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const demoAccounts = [
    { label: 'Pune Maintainer (0x2222...)', addr: '0x2222222222222222222222222222222222222222' },
    { label: 'Kavya Lead Maintainer (0x1111...)', addr: '0x1111111111111111111111111111111111111111' },
    { label: 'Hindi i18n Lead (0x3333...)', addr: '0x3333333333333333333333333333333333333333' },
    { label: 'Juror: Aarav Sharma (0x9999...)', addr: '0x9999999999999999999999999999999999999999' },
  ];

  const connectBrowserWallet = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts[0]) {
          setWalletAddress(accounts[0]);
          setIsDemo(false);
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      // Fallback to Pune maintainer for seamless demonstration
      setWalletAddress('0x2222222222222222222222222222222222222222');
      setIsDemo(true);
    }
  };

  const navLinks = [
    { href: '/', label: 'Overview', icon: Layers },
    { href: '/graph', label: 'Dependency Graph', icon: Network },
    { href: '/jury', label: 'Jury Preferences', icon: Users },
    { href: '/packages/pune%2Fqr-ticketing', label: 'Pune "Why?"', icon: Coins },
    { href: '/disputes', label: 'Disputes', icon: ShieldAlert },
    { href: '/claims', label: 'Claim Portal', icon: Coins },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-slate-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Protocol Title */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Network className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-lg text-white tracking-tight">Pay the Wells</span>
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Devcon XI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 -mt-0.5 font-medium">Retroactive Deep Funding</p>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Network indicator & Wallet Connect */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono bg-slate-900 border border-slate-800 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Local Demo Mode (Target: Sepolia 11155111)</span>
            </div>

            <div className="relative">
              {walletAddress ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-slate-850 hover:bg-slate-800 border border-slate-700 text-cyan-300 transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span>{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-72 glass-panel rounded-xl shadow-2xl py-2 z-50 text-xs border border-slate-700">
                      <div className="px-3 py-2 border-b border-slate-800 font-sans text-slate-400">
                        Select Simulation Persona:
                      </div>
                      {demoAccounts.map((acc) => (
                        <button
                          key={acc.addr}
                          onClick={() => {
                            setWalletAddress(acc.addr);
                            setIsDemo(true);
                            setDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-slate-800/70 transition-colors flex flex-col ${
                            walletAddress.toLowerCase() === acc.addr.toLowerCase() ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-300'
                          }`}
                        >
                          <span className="font-medium">{acc.label}</span>
                          <span className="font-mono text-[10px] text-slate-500">{acc.addr}</span>
                        </button>
                      ))}
                      <div className="border-t border-slate-800 pt-1 mt-1">
                        <button
                          onClick={() => {
                            setWalletAddress(null);
                            setDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-1.5 text-rose-400 hover:bg-slate-800/70"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={connectBrowserWallet}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-600/25 transition-all active:scale-95"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Connect Wallet</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
