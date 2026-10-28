'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Network,
  ArrowRight,
  RefreshCw,
  GitCommit,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  GitBranch
} from 'lucide-react';
import sampleGraph from '../../data/sample-graph.json';
import sampleResult from '../../data/sample-result.json';

export default function GraphExplorerPage() {
  const [selectedPkgId, setSelectedPkgId] = useState<string>('pune/qr-ticketing');

  const packages = sampleGraph.packages as Record<string, any>;
  const allocationsMap = (sampleResult.allocations as any[]).reduce((acc, curr) => {
    acc[curr.packageId] = curr;
    return acc;
  }, {} as Record<string, any>);

  const selectedNode = packages[selectedPkgId];
  const selectedAlloc = allocationsMap[selectedPkgId];

  // Defined depth levels from cycle analysis BFS
  const depthLevels = [
    {
      level: 0,
      title: 'Root Application (Depth 0)',
      description: 'End-user facing event application that initiated retro deep funding',
      nodes: ['kavya/event-app'],
    },
    {
      level: 1,
      title: 'Direct Dependencies (Depth 1)',
      description: 'Immediate modules imported by the root application',
      nodes: ['pune/qr-ticketing', 'indic/hindi-i18n', 'wallet/connect-wrapper'],
    },
    {
      level: 2,
      title: 'Transitive Infrastructure & Cycles (Depth 2)',
      description: 'Underlying engines, network bridges, and mutual graph algorithms',
      nodes: ['crypto/ethereum-provider', 'utils/graph-core', 'utils/graph-core-adapter'],
    },
    {
      level: 3,
      title: 'Terminal Primitives (Depth 3+)',
      description: 'Deep zero-allocation memory and binary encoding primitives',
      nodes: ['utils/encoding'],
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
            <Network className="w-4 h-4" />
            <span>Interactive Dependency Graph</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-white font-display">
            Transitive Flow & Directed Cycles
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl mt-1">
            Explore the multi-tier dependency topology with directed cycles resolved via Tarjan’s Strongly Connected Components (SCC).
          </p>
        </div>

        {/* Cycle notice badge */}
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-300">
          <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin-slow" />
          <div>
            <div className="font-semibold text-white">Directed Cycle Detected</div>
            <div className="font-mono text-[11px] text-slate-400">utils/graph-core ⇄ utils/graph-core-adapter</div>
          </div>
        </div>
      </div>

      {/* Main Content: Graph Visualizer and Node Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Visual Tiered Representation */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Topological Depth Tiers (Shortest Path BFS)
              </span>
              <span className="text-xs text-slate-400">Click any package to inspect allocation flow</span>
            </div>

            <div className="space-y-6">
              {depthLevels.map((tier) => (
                <div key={tier.level} className="relative pl-6 border-l-2 border-slate-800 space-y-3">
                  <div className="absolute -left-[9px] top-0.5 w-4 h-4 rounded-full bg-slate-900 border-2 border-indigo-500 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-indigo-300">{tier.level}</span>
                  </div>

                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      {tier.title}
                    </h2>
                    <p className="text-[11px] text-slate-500">{tier.description}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {tier.nodes.map((nodeId) => {
                      const pkg = packages[nodeId];
                      const alloc = allocationsMap[nodeId];
                      const isSelected = selectedPkgId === nodeId;
                      const isCycle = nodeId.startsWith('utils/graph-core');
                      const isPune = nodeId === 'pune/qr-ticketing';

                      return (
                        <button
                          key={nodeId}
                          onClick={() => setSelectedPkgId(nodeId)}
                          className={`text-left p-3.5 rounded-xl border transition-all ${
                            isSelected
                              ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-500'
                              : isCycle
                              ? 'bg-slate-900/80 border-cyan-500/30 hover:border-cyan-500/60'
                              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-white truncate max-w-[130px]">
                              {pkg?.name}
                            </span>
                            {isPune && (
                              <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                PUNE
                              </span>
                            )}
                            {isCycle && (
                              <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                CYCLE
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-[10px] text-slate-400 truncate mb-2">{nodeId}</div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 font-mono">{(alloc?.retentionFraction * 100).toFixed(0)}% kept</span>
                            <span className="text-emerald-400 font-mono font-bold">{alloc?.amountEth} ETH</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Selected Package Inspector */}
        <div className="space-y-6">
          {selectedNode && selectedAlloc ? (
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-5 sticky top-24">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Node Inspector
                </span>
                <Link
                  href={`/packages/${encodeURIComponent(selectedPkgId)}`}
                  className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  <span>Full "Why?" Breakdown</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white font-display">{selectedNode.name}</h3>
                <div className="font-mono text-xs text-slate-400">{selectedPkgId}</div>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">{selectedNode.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase font-sans">Payout (ETH)</div>
                  <div className="text-emerald-400 font-bold text-base mt-0.5">{selectedAlloc.amountEth} ETH</div>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase font-sans">Share of Pot</div>
                  <div className="text-indigo-300 font-bold text-base mt-0.5">{selectedAlloc.sharePercentage.toFixed(2)}%</div>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase font-sans">Retention</div>
                  <div className="text-cyan-300 font-bold mt-0.5">{(selectedAlloc.retentionFraction * 100).toFixed(0)}%</div>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase font-sans">Jury Score</div>
                  <div className="text-amber-300 font-bold mt-0.5">{(selectedAlloc.intrinsicJuryScore * 100).toFixed(1)}%</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Outbound Dependencies:
                </div>
                {selectedNode.dependencies && selectedNode.dependencies.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedNode.dependencies.map((depId: string) => (
                      <button
                        key={depId}
                        onClick={() => setSelectedPkgId(depId)}
                        className="w-full text-left p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-indigo-300 flex items-center justify-between"
                      >
                        <span>{depId}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic p-2 bg-slate-900/40 rounded-lg">
                    Terminal leaf node (No outbound dependencies). Retains 100% of received flow.
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Link
                  href={`/packages/${encodeURIComponent(selectedPkgId)}`}
                  className="w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg transition-all"
                >
                  <span>Answer: "Why did I receive this much?"</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
