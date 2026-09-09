import React from 'react';
import { ShieldCheck, History, Sparkles, BookOpen, ScanLine } from 'lucide-react';

interface HeaderProps {
  activeTab: 'scan' | 'history';
  setActiveTab: (tab: 'scan' | 'history') => void;
  savedCount: number;
  onOpenDemo: () => void;
  onOpenRules: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  savedCount,
  onOpenDemo,
  onOpenRules,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('scan')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-2 ring-blue-400/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base sm:text-lg font-bold tracking-tight text-white">
                  Legal Metrology AI
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-900/80 text-blue-300 border border-blue-700/50">
                  SIH 26034
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden xs:block">
                Packaged Commodities Rules, 2011 Compliance Screening
              </p>
            </div>
          </div>

          {/* Navigation & Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick Demo Mode Trigger */}
            <button
              id="header-demo-button"
              onClick={onOpenDemo}
              className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition cursor-pointer"
              title="Open Built-in Demo Scenarios"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-400" />
              <span>Demo Mode</span>
            </button>

            {/* Rules reference */}
            <button
              id="header-rules-button"
              onClick={onOpenRules}
              className="hidden md:inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="View Legal Metrology Rules Summary"
            >
              <BookOpen className="w-3.5 h-3.5 mr-1 text-slate-400" />
              <span>Rules Guide</span>
            </button>

            {/* Tab switchers */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                id="nav-tab-scan"
                onClick={() => setActiveTab('scan')}
                className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'scan'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <ScanLine className="w-3.5 h-3.5 mr-1.5" />
                <span>Scanner</span>
              </button>
              <button
                id="nav-tab-history"
                onClick={() => setActiveTab('history')}
                className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5 mr-1.5" />
                <span>History</span>
                {savedCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700 text-slate-200">
                    {savedCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
