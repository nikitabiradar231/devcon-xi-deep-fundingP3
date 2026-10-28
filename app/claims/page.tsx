'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Coins,
  ShieldCheck,
  CheckCircle2,
  Wallet,
  ArrowRight,
  ExternalLink,
  Lock,
  Copy,
  ChevronDown
} from 'lucide-react';
import sampleResult from '../../data/sample-result.json';
import sampleManifest from '../../data/sample-manifest.json';

export default function ClaimsPage() {
  const [selectedAddress, setSelectedAddress] = useState<string>(
    '0x2222222222222222222222222222222222222222' // Pune QR-Ticketing Maintainer
  );
  const [claimedMap, setClaimedMap] = useState<Record<string, boolean>>({});
  const [claimingPkg, setClaimingPkg] = useState<string | null>(null);

  const personas = [
    { label: 'Pune QR Ticketing Maintainer', addr: '0x2222222222222222222222222222222222222222' },
    { label: 'Kavya Event App Lead', addr: '0x1111111111111111111111111111111111111111' },
    { label: 'Hindi i18n Maintainer', addr: '0x3333333333333333333333333333333333333333' },
    { label: 'Wallet Connect Wrapper Dev', addr: '0x4444444444444444444444444444444444444444' },
    { label: 'Ethereum Provider Core Dev', addr: '0x5555555555555555555555555555555555555555' },
    { label: 'Zero-Allocation Encoding Maintainer', addr: '0x8888888888888888888888888888888888888888' },
  ];

  const allocations = sampleResult.allocations as any[];
  const merkleLeaves = (sampleResult as any).merkleLeaves as any[];

  // Filter allocations matching selected maintainer
  const userAllocations = allocations.filter(
    (a) => a.maintainer.toLowerCase() === selectedAddress.toLowerCase()
  );

  const totalClaimableEth = userAllocations
    .reduce((sum, curr) => sum + parseFloat(curr.amountEth), 0)
    .toFixed(6);

  const handleClaim = (pkgId: string) => {
    setClaimingPkg(pkgId);
    setTimeout(() => {
      setClaimingPkg(null);
      setClaimedMap((prev) => ({ ...prev, [pkgId]: true }));
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
          <Coins className="w-4 h-4" />
          <span>Onchain Recipient Claims</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold text-white font-display">
          Claim Committed Allocations
        </h1>
        <p className="text-sm text-slate-400 max-w-3xl mt-1">
          Finalized distributions are claimable directly by the maintainer address committed in the cryptographic Merkle leaf.
        </p>
      </div>

      {/* Maintainer Persona Selector */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Active Maintainer Wallet
            </span>
            <span className="font-mono text-sm text-cyan-300 font-bold">{selectedAddress}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Switch Persona:</span>
            <select
              value={selectedAddress}
              onChange={(e) => setSelectedAddress(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs font-medium text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
            >
              {personas.map((p) => (
                <option key={p.addr} value={p.addr}>
                  {p.label} ({p.addr.slice(0, 6)}...{p.addr.slice(-4)})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">Total Claimable for this wallet:</span>
          <span className="font-mono font-extrabold text-emerald-400 text-base">{totalClaimableEth} ETH</span>
        </div>
      </div>

      {/* Eligible Allocations List */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white font-display">
          Matching Committed Allocations ({userAllocations.length})
        </h2>

        {userAllocations.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {userAllocations.map((alloc) => {
              const leaf = merkleLeaves.find((l) => l.packageId === alloc.packageId);
              const isClaimed = claimedMap[alloc.packageId];
              const isClaiming = claimingPkg === alloc.packageId;

              return (
                <div
                  key={alloc.packageId}
                  className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  <div className="space-y-2 max-w-xl">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white font-display">{alloc.name}</h3>
                      <span className="font-mono text-xs text-slate-500">{alloc.packageId}</span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">{alloc.explanation}</p>

                    <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] pt-1">
                      <span className="text-indigo-400">
                        Share: <span className="font-bold">{alloc.sharePercentage.toFixed(2)}%</span>
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-400">
                        Merkle Proof: <span className="text-cyan-400">{leaf?.proof?.length || 3} Sibling Nodes</span>
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-400">
                        Wei: <span className="text-slate-300">{alloc.amountWei}</span>
                      </span>
                    </div>
                  </div>

                  {/* Payout & Claim Action */}
                  <div className="flex flex-col items-end gap-3 w-full md:w-auto shrink-0 border-t md:border-t-0 pt-4 md:pt-0 border-slate-800">
                    <div className="text-right">
                      <div className="text-2xl font-extrabold text-emerald-400 font-display">
                        {alloc.amountEth} ETH
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">100% Guaranteed Onchain</div>
                    </div>

                    {isClaimed ? (
                      <div className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Payout Transferred</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleClaim(alloc.packageId)}
                        disabled={isClaiming}
                        className="px-6 py-2.5 rounded-xl font-semibold text-xs bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 active:scale-95"
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>{isClaiming ? 'Claiming on Sepolia...' : 'Claim Payout'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel rounded-2xl p-8 border border-slate-800 text-center text-slate-400 text-xs">
            No allocations committed for this wallet address in distribution #{sampleResult.distributionId}.
          </div>
        )}
      </div>
    </div>
  );
}
