import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from './components/Navbar';

export const metadata: Metadata = {
  title: 'Pay the Wells You Drank From | Road to Devcon XI',
  description: 'Retroactive and dependency-aware deep funding protocol for open source commons, featuring Bradley-Terry jury preference weighting, exact pot conservation, and onchain Merkle verification.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col selection:bg-indigo-500 selection:text-white">
        <Navbar />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-slate-900 bg-slate-950/90 py-8 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="font-medium text-slate-400">Pay the Wells You Drank From</span>
              <span>— Road to Devcon XI Challenge</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
              <span>Sepolia Chain 11155111</span>
              <span>•</span>
              <span>100% Exact Pot Conservation</span>
              <span>•</span>
              <span>Tarjan SCC Cycle-Safe</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
