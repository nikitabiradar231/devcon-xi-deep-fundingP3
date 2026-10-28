'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  Clock,
  AlertTriangle,
  Send,
  CheckCircle2,
  XCircle,
  FileText,
  Lock,
  Info
} from 'lucide-react';
import sampleResult from '../../data/sample-result.json';
import sampleManifest from '../../data/sample-manifest.json';

export default function DisputesPage() {
  const [reason, setReason] = useState('');
  const [evidenceUri, setEvidenceUri] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1200);
  };

  const sampleDisputes = [
    {
      id: 1,
      challenger: '0x3333333333333333333333333333333333333333',
      reason: 'Question regarding mutual cycle flow balance between utils/graph-core and utils/graph-core-adapter',
      evidenceUri: 'ipfs://QmSampleEvidenceHashTarjanSCCAudit',
      createdAt: 'During Challenge Window',
      resolved: true,
      accepted: false,
      resolutionNote: 'Reviewed by dispute resolver: Tarjan SCC cycle resolution and integer water-flow conservation confirmed bit-for-bit reproducible.',
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 uppercase tracking-wider mb-1">
          <ShieldAlert className="w-4 h-4" />
          <span>Dispute & Challenge Mechanism</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold text-white font-display">
          Challenge Window & Verifiability
        </h1>
        <p className="text-sm text-slate-400 max-w-3xl mt-1">
          Every proposed allocation commitment remains challengeable for a fixed window. An open dispute blocks finalization, and an upheld dispute invalidates the proposal.
        </p>
      </div>

      {/* Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="uppercase font-semibold">Distribution ID</span>
            <Lock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white font-display">#{sampleResult.distributionId}</div>
          <div className="text-[11px] text-slate-500 font-mono">Sepolia Chain 11155111</div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="uppercase font-semibold">Challenge Window</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-display">3 Days</div>
          <div className="text-[11px] text-emerald-400 font-medium">Window Elapsed — Finalized</div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="uppercase font-semibold">Active Unresolved Disputes</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-display">0 Open</div>
          <div className="text-[11px] text-slate-500">Unanimous Resolution Reached</div>
        </div>
      </div>

      {/* Main Grid: Submit Dispute & Existing Disputes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Submit Dispute Form */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>Submit Allocation Challenge</span>
            </h2>
            <p className="text-xs text-slate-400">
              Submit verifiable cryptographic or mathematical evidence contesting a proposal.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-300 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              Submitting a challenge submits an onchain transaction to <span className="font-mono text-white">DeepFunding.submitDispute</span>. 
              Submitting a dispute does not guarantee winning; the registered resolver must impartially evaluate the evidence.
            </div>
          </div>

          {submitted ? (
            <div className="p-6 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-center space-y-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <div className="text-base font-bold text-white font-display">Challenge Transaction Recorded</div>
              <p className="text-xs text-slate-300 max-w-sm mx-auto">
                Your dispute has been logged with ID #{sampleDisputes.length + 1}. The distribution is held in disputed state until resolution.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setReason('');
                  setEvidenceUri('');
                }}
                className="mt-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline"
              >
                Submit Another Inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitDispute} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Challenge Reason / Inconsistency
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Unregistered juror address detected in judgment dataset or sum mismatch"
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 p-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Evidence URI / IPFS Hash
                </label>
                <input
                  type="text"
                  value={evidenceUri}
                  onChange={(e) => setEvidenceUri(e.target.value)}
                  placeholder="ipfs://Qm... or https://github.com/.../issues/1"
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 p-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl font-semibold text-xs bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Transacting on Sepolia...' : 'Submit Onchain Challenge'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Existing Disputes Log */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <span>Historical Dispute Log</span>
            </h2>
            <p className="text-xs text-slate-400">
              Complete onchain audit trail of challenged proposals and resolver decisions.
            </p>
          </div>

          <div className="space-y-4">
            {sampleDisputes.map((d) => (
              <div key={d.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-indigo-300">Dispute #{d.id}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    RESOLVED — REJECTED
                  </span>
                </div>

                <div className="text-slate-300">{d.reason}</div>

                <div className="font-mono text-[11px] text-slate-400 truncate">
                  Evidence: <span className="text-cyan-400">{d.evidenceUri}</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 text-[11px] leading-relaxed">
                  <span className="text-emerald-400 font-semibold">Resolver Determination: </span>
                  {d.resolutionNote}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
