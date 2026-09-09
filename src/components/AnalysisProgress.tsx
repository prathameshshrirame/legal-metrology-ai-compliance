import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, Scan, FileSearch, ShieldCheck } from 'lucide-react';

interface AnalysisProgressProps {
  onComplete?: () => void;
}

const STEPS = [
  { label: 'Uploading package...', duration: 1200, icon: Scan },
  { label: 'Reading label...', duration: 1500, icon: FileSearch },
  { label: 'Extracting declarations...', duration: 1500, icon: FileSearch },
  { label: 'Running compliance checks...', duration: 1200, icon: ShieldCheck },
  { label: 'Preparing inspection report...', duration: 1000, icon: CheckCircle2 },
];

export const AnalysisProgress: React.FC<AnalysisProgressProps> = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const advance = (idx: number) => {
      if (idx < STEPS.length - 1) {
        timer = setTimeout(() => {
          setCurrentStep(idx + 1);
          advance(idx + 1);
        }, STEPS[idx].duration);
      }
    };
    advance(0);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-3 shadow-sm relative">
            <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            Analyzing Packaged Commodity
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Multimodal AI inspection under Legal Metrology Rules, 2011
          </p>
        </div>

        {/* Progress steps list */}
        <div className="space-y-3">
          {STEPS.map((step, idx) => {
            const isFinished = currentStep > idx;
            const isCurrent = currentStep === idx;
            const isPending = currentStep < idx;

            return (
              <div
                key={step.label}
                className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 border ${
                  isCurrent
                    ? 'bg-blue-50/80 border-blue-200 text-blue-900 font-semibold shadow-xs'
                    : isFinished
                    ? 'bg-emerald-50/60 border-emerald-100 text-emerald-800'
                    : 'bg-slate-50 border-slate-100 text-slate-400'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="shrink-0">
                    {isFinished ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 bg-white" />
                    )}
                  </div>
                  <span className="text-xs sm:text-sm">{step.label}</span>
                </div>

                <span className="text-[11px] font-mono">
                  {isFinished ? '100%' : isCurrent ? 'Processing' : 'Waiting'}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            Applying strict evidence-based extraction & statutory rule validation
          </p>
        </div>
      </div>
    </div>
  );
};
