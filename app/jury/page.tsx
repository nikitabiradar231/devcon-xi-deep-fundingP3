import React from 'react';
import { Users, Scale, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import sampleJudgments from '../../data/sample-judgments.json';
import sampleResult from '../../data/sample-result.json';
import sampleManifest from '../../data/sample-manifest.json';

export default function JuryExplorerPage() {
  const jurors = sampleJudgments.jurors;
  const judgments = sampleJudgments.judgments;
  const allocations = sampleResult.allocations;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
          <Users className="w-4 h-4" />
          <span>Registered Jury & Peer Weighting</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold text-white font-display">
          Bradley–Terry Preference Derivation
        </h1>
        <p className="text-sm text-slate-400 max-w-3xl mt-1">
          Pairwise evaluations submitted by registered jurors are aggregated into maximum likelihood scores via Bradley–Terry Minorize-Maximization (MM).
        </p>
      </div>

      {/* Model Parameters & Registered Jurors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Juror List */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white font-display flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <span>Active Registered Jurors ({jurors.length})</span>
          </h2>

          <div className="space-y-3">
            {jurors.map((juror) => (
              <div key={juror.address} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">{juror.name}</div>
                  <div className="font-mono text-[10px] text-slate-500">{juror.address}</div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Model Mathematics & Convergence */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white font-display flex items-center gap-2">
            <Scale className="w-4 h-4 text-indigo-400" />
            <span>Mathematical Model & Convergence Parameters</span>
          </h2>

          <p className="text-xs text-slate-300 leading-relaxed">
            The probability that package <span className="font-mono text-cyan-300">A</span> is preferred over package <span className="font-mono text-cyan-300">B</span> is given by the logistic Bradley–Terry formula:
          </p>

          <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-cyan-300 border border-slate-800 text-center">
            P(A &gt; B) = score(A) / ( score(A) + score(B) )
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-[10px] uppercase font-sans">Prior Alpha</div>
              <div className="text-indigo-300 font-bold mt-0.5">{sampleManifest.parameters.priorAlpha}</div>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-[10px] uppercase font-sans">Max Iterations</div>
              <div className="text-indigo-300 font-bold mt-0.5">{sampleManifest.parameters.maxIterations}</div>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-[10px] uppercase font-sans">Tolerance</div>
              <div className="text-indigo-300 font-bold mt-0.5">1e-12</div>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-[10px] uppercase font-sans">Total Judgments</div>
              <div className="text-emerald-400 font-bold mt-0.5">{judgments.length}</div>
            </div>
          </div>

          <div className="text-xs text-slate-400 leading-relaxed pt-2">
            Judgments are normalized on a 1..5 scale (1: strong loss, 3: neutral tie, 5: strong win). The algorithm enforces strict non-negative score convergence and normalizes total score sum = 1.0.
          </div>
        </div>
      </div>

      {/* Pairwise Judgments Log */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white font-display">Authenticated Pairwise Log ({judgments.length})</h2>
            <p className="text-xs text-slate-400">All registered juror preferences bound to the canonical graph hash.</p>
          </div>
          <span className="text-xs font-mono text-emerald-400">All EIP-712 Nonces Valid</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/70 text-slate-400 uppercase text-[10px] font-semibold tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Juror</th>
                <th className="py-3 px-4">Package A</th>
                <th className="py-3 px-4">Package B</th>
                <th className="py-3 px-4 text-center">Preference (1..5)</th>
                <th className="py-3 px-4 text-right">Nonce</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {judgments.map((j, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-400">
                    {j.juror.slice(0, 8)}...{j.juror.slice(-6)}
                  </td>
                  <td className="py-3 px-4 font-mono text-indigo-300 font-semibold">{j.packageA}</td>
                  <td className="py-3 px-4 font-mono text-slate-300">{j.packageB}</td>
                  <td className="py-3 px-4 text-center font-mono">
                    <span className="px-2 py-0.5 rounded font-bold bg-slate-900 border border-slate-700 text-cyan-300">
                      {j.preference} / 5
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-500">#{j.nonce}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
