'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  HelpCircle,
  Coins,
  ShieldCheck,
  CheckCircle2,
  GitBranch,
  Users,
  Copy,
  ExternalLink,
  ArrowLeft,
  Scale,
  Sparkles,
  Lock,
  Wallet
} from 'lucide-react';
import sampleResult from '../../../data/sample-result.json';
import sampleManifest from '../../../data/sample-manifest.json';
import sampleGraph from '../../../data/sample-graph.json';
import sampleJudgments from '../../../data/sample-judgments.json';

export default function PackageDetailPage() {
  const params = useParams();
  const rawId = params?.packageId ? decodeURIComponent(params.packageId as string) : 'pune/qr-ticketing';
  
  const [copied, setCopied] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const packages = sampleGraph.packages as Record<string, any>;
  const pkg = packages[rawId] || packages['pune/qr-ticketing'];
  const packageId = pkg?.id || 'pune/qr-ticketing';

  const allocations = sampleResult.allocations as any[];
  const alloc = allocations.find((a) => a.packageId === packageId) || allocations[0];

  const merkleLeaves = (sampleResult as any).merkleLeaves as any[];
  const leaf = merkleLeaves.find((l) => l.packageId === packageId);

  // Relevant judgments where this package was compared
  const relevantJudgments = (sampleJudgments.judgments as any[]).filter(
    (j) => j.packageA === packageId || j.packageB === packageId
  );

  const isPune = packageId === 'pune/qr-ticketing';

  const handleCopyProof = () => {
    if (leaf?.proof) {
      navigator.clipboard.writeText(JSON.stringify(leaf.proof, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const simulateClaim = () => {
    setClaiming(true);
    setTimeout(() => {
      setClaiming(false);
      setClaimed(true);
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Back button */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Package Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-500/10 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Package Transparency Report
              </span>
              {isPune && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Devcon Case Study
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-display">
              {pkg?.name}
            </h1>
            <p className="font-mono text-xs text-slate-400">{packageId}</p>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">{pkg?.description}</p>
          </div>

          {/* Big Payout Metric */}
          <div className="glass-card rounded-2xl p-6 border border-slate-700/80 text-right min-w-[240px]">
            <div className="text-xs uppercase font-medium text-slate-400">Allocated Payout</div>
            <div className="text-3xl font-extrabold text-emerald-400 font-display mt-1">
              {alloc.amountEth} ETH
            </div>
            <div className="font-mono text-xs text-indigo-300 font-bold mt-0.5">
              {alloc.sharePercentage.toFixed(2)}% of 1.0 ETH Pot
            </div>
            <div className="font-mono text-[10px] text-slate-500 mt-1 truncate" title={alloc.amountWei}>
              {alloc.amountWei} wei
            </div>

            <div className="pt-4">
              {claimed ? (
                <div className="w-full py-2 px-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Successfully Claimed</span>
                </div>
              ) : (
                <button
                  onClick={simulateClaim}
                  disabled={claiming}
                  className="w-full py-2 px-4 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>{claiming ? 'Verifying Merkle Proof...' : 'Claim Allocation'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CORE ACCEPTANCE QUESTION: WHY DID I RECEIVE THIS MUCH? */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-indigo-500/30 bg-gradient-to-b from-indigo-950/20 to-slate-900/50 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
              Why did I receive this much?
            </h2>
            <p className="text-xs text-slate-400">
              Deterministic mathematical explanation connecting jury preferences, graph propagation, and rounding dust.
            </p>
          </div>
        </div>

        {/* Step-by-Step Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
              <span>Step 1: Peer Judgments</span>
              <Scale className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-white font-display">
              {(alloc.intrinsicJuryScore * 100).toFixed(2)}% Bradley-Terry Score
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              5 registered jurors submitted EIP-712 pairwise rankings. {pkg.name} won or tied the majority of its matchups, giving it the highest intrinsic weight among all dependencies.
            </p>
          </div>

          <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
              <span>Step 2: Water Flow & Retention</span>
              <GitBranch className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xl font-bold text-white font-display">
              {(alloc.retentionFraction * 100).toFixed(0)}% Retention Fraction
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              The root event app retained 20% and passed 80% downwards. {pkg.name} captured incoming water flow proportional to its jury weight, kept 35%, and flowed the remaining 65% to its own dependencies.
            </p>
          </div>

          <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
              <span>Step 3: Exact Wei Conservation</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-white font-display">
              0 Wei Remainder Loss
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              All division operations used exact BigInt arithmetic with floor allocation and remainder redistribution by highest fractional residue, guaranteeing 100% exact pot conservation.
            </p>
          </div>
        </div>

        {/* Mathematical summary text */}
        <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 font-mono text-xs text-indigo-300">
          <span className="text-slate-400 font-sans font-semibold">Exact Formula: </span>
          Payout = FlowThrough({alloc.flowThrough.toFixed(4)}) × Retention({(alloc.retentionFraction * 100)}%) × Pot(10¹⁸ wei) + DustShare = <span className="text-emerald-400 font-bold">{alloc.amountWei} wei</span> ({alloc.amountEth} ETH).
        </div>
      </div>

      {/* Relevant Pairwise Judgments */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white font-display">
              Relevant Registered Juror Judgments ({relevantJudgments.length})
            </h3>
            <p className="text-xs text-slate-400">
              Authenticated EIP-712 pairwise matchups that contributed directly to this package's score.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">Scale: 1 (A &lt;&lt; B) to 5 (A &gt;&gt; B)</span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {relevantJudgments.map((j, idx) => {
            const isWinner = (j.packageA === packageId && j.preference >= 4) || (j.packageB === packageId && j.preference <= 2);
            return (
              <div key={idx} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-indigo-400 font-semibold">{j.packageA}</span>
                    <span className="text-slate-500">vs</span>
                    <span className="font-mono text-slate-300">{j.packageB}</span>
                  </div>
                  <div className="font-mono text-[10px] text-slate-500">
                    Juror: {j.juror} (Nonce #{j.nonce})
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-slate-900 border border-slate-700 text-slate-200">
                    Preference: {j.preference}/5
                  </span>
                  {isWinner ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      FAVORED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
                      NEUTRAL / UNFAVORED
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Merkle Proof Verification Card */}
      {leaf && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white font-display">Onchain Merkle Leaf & Proof</h3>
            </div>
            <button
              onClick={handleCopyProof}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied!' : 'Copy Proof Array'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-sans">Leaf Hash (Double Keccak-256)</span>
              <div className="text-cyan-300 truncate" title={leaf.leafHash}>{leaf.leafHash}</div>
            </div>
            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-sans">Package ID Hash</span>
              <div className="text-indigo-300 truncate" title={leaf.packageIdHash}>{leaf.packageIdHash}</div>
            </div>
          </div>

          <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1 font-mono text-xs">
            <span className="text-slate-400 text-[10px] uppercase font-sans">Merkle Sibling Proof ({leaf.proof.length} nodes)</span>
            <div className="space-y-1 text-slate-300 text-[11px] pt-1">
              {leaf.proof.map((p: string, i: number) => (
                <div key={i} className="truncate text-slate-400">
                  [{i}]: <span className="text-slate-200">{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
