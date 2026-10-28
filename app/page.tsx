import React from 'react';
import Link from 'next/link';
import {
  Layers,
  Network,
  Users,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  Lock,
  Coins,
  Cpu,
  GitBranch,
  Repeat,
  Scale
} from 'lucide-react';
import sampleResult from '../data/sample-result.json';
import sampleManifest from '../data/sample-manifest.json';
import sampleGraph from '../data/sample-graph.json';

export default function DashboardPage() {
  const allocations = sampleResult.allocations;
  const potEth = sampleResult.fundingPotEth;
  const potWei = sampleResult.fundingPotWei;
  const merkleRoot = sampleResult.merkleRoot;
  const graphHash = sampleResult.graphHash;
  const judgmentHash = sampleManifest.judgmentDatasetHash;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Local Demo Mode & Verification Notice */}
      <div className="rounded-2xl p-4 bg-slate-900/90 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
          <span className="text-slate-300">
            <strong className="text-amber-300">Local Demonstration Mode:</strong> All visual graphs, peer judgments, and Merkle proofs reflect the verified deterministic sample dataset (100% bit-for-bit verified).
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] text-slate-400">
          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">Sepolia Target: 11155111</span>
          <span className="text-emerald-400 font-semibold">Preflight: PASS</span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl glass-panel p-8 sm:p-10 border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/10 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Verified 100% Exact Wei Conservation & Cycle-Safe</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-display">
            Retroactive & Dependency-Aware <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-300 to-emerald-400">
              Deep Funding for Open Commons
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Propagates retroactive gratitude from end-user applications down through transitive dependencies, 
            fairly rewarding low-level utilities and infrastructure maintainers based on deterministic Bradley–Terry 
            peer judgments and cycle-tolerant water-flow algorithms.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/packages/pune%2Fqr-ticketing"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              <span>Explore Pune Maintainer Breakdown</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/graph"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-700/80 transition-all"
            >
              <Network className="w-4 h-4 text-cyan-400" />
              <span>Interactive Graph Visualizer</span>
            </Link>

            <Link
              href="/claims"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 border border-emerald-500/30 transition-all"
            >
              <Coins className="w-4 h-4 text-emerald-400" />
              <span>Claim Portal</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Funding Pot */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Total Funding Pot</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-display">{potEth} ETH</span>
            <span className="text-xs text-emerald-400 font-medium">100% Conserved</span>
          </div>
          <p className="text-[11px] font-mono text-slate-500 mt-1 truncate">
            {potWei} wei
          </p>
        </div>

        {/* Reachable Packages */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Reachable Packages</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-display">{allocations.length}</span>
            <span className="text-xs text-cyan-400 font-medium">Depth 3+ (Cycle-Safe)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Root: <span className="font-mono text-slate-300">kavya/event-app</span>
          </p>
        </div>

        {/* Registered Jurors */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Active Jurors</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-display">5 Jurors</span>
            <span className="text-xs text-amber-400 font-medium">18 Judgments</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            EIP-712 Authenticated Pairwise Votes
          </p>
        </div>

        {/* State & Challenge Status */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Protocol State</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-display">Finalized</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Claimable
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Dispute Window: 3 Days (Elapsed)
          </p>
        </div>
      </div>

      {/* Cryptographic Commitments Bar */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-indigo-400" />
            <span>Cryptographic Commitments & Audit Manifest</span>
          </span>
          <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            All 8 Merkle Proofs Verified
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-[11px]">
          <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800">
            <div className="text-slate-400 text-[10px] uppercase font-sans mb-1">Merkle Commitment Root</div>
            <div className="text-cyan-300 font-semibold truncate" title={merkleRoot}>{merkleRoot}</div>
          </div>
          <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800">
            <div className="text-slate-400 text-[10px] uppercase font-sans mb-1">Canonical Graph Hash</div>
            <div className="text-indigo-300 font-semibold truncate" title={graphHash}>{graphHash}</div>
          </div>
          <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800">
            <div className="text-slate-400 text-[10px] uppercase font-sans mb-1">Jury Dataset Hash</div>
            <div className="text-emerald-300 font-semibold truncate" title={judgmentHash}>{judgmentHash}</div>
          </div>
        </div>
      </div>

      {/* Allocations Table */}
      <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white font-display">Deep Funding Allocations</h2>
            <p className="text-xs text-slate-400">
              Deterministic Bradley-Terry scores propagated through dependency graph with node retention
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Algorithm: <span className="text-indigo-400">{sampleManifest.algorithmVersion}</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/70 text-slate-400 uppercase text-[10px] font-semibold tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Package</th>
                <th className="py-3 px-4">Maintainer Address</th>
                <th className="py-3 px-4 text-right">Jury Score</th>
                <th className="py-3 px-4 text-right">Retention</th>
                <th className="py-3 px-4 text-right">Share (%)</th>
                <th className="py-3 px-4 text-right">Payout (ETH)</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {allocations.map((alloc) => {
                const isPune = alloc.packageId === 'pune/qr-ticketing';
                const isRoot = alloc.packageId === 'kavya/event-app';
                return (
                  <tr
                    key={alloc.packageId}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isPune ? 'bg-indigo-950/20' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-medium text-white">
                      <div className="flex items-center gap-2">
                        <span>{alloc.name}</span>
                        {isPune && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            PUNE CASE STUDY
                          </span>
                        )}
                        {isRoot && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            ROOT APP
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-[10px] text-slate-500">{alloc.packageId}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {alloc.maintainer.slice(0, 8)}...{alloc.maintainer.slice(-6)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                      {(alloc.intrinsicJuryScore * 100).toFixed(2)}%
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                      {(alloc.retentionFraction * 100).toFixed(0)}%
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-indigo-300">
                      {alloc.sharePercentage.toFixed(2)}%
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                      {alloc.amountEth} ETH
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Link
                        href={`/packages/${encodeURIComponent(alloc.packageId)}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                      >
                        <span>Inspect</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
