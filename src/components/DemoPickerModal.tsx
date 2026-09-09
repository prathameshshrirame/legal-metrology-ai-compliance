import React from 'react';
import { Sparkles, X, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { DEMO_SCENARIOS } from '../data/demoScenarios';
import { DemoScenario } from '../types';

interface DemoPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScenario: (scenario: DemoScenario) => void;
}

export const DemoPickerModal: React.FC<DemoPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectScenario,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Select Demo Scenario</h3>
              <p className="text-xs text-slate-400">
                Pre-configured packaged commodities for offline evaluation & live hackathon demos
              </p>
            </div>
          </div>
          <button
            id="demo-modal-close"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {DEMO_SCENARIOS.map((scenario) => {
            const isPass = scenario.badge === 'PASS';
            return (
              <div
                key={scenario.id}
                id={`demo-card-${scenario.id}`}
                onClick={() => {
                  onSelectScenario(scenario);
                  onClose();
                }}
                className="group border border-slate-200 hover:border-blue-500 hover:shadow-md rounded-xl p-4 transition-all duration-200 cursor-pointer bg-slate-50/50 hover:bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                    <img
                      src={scenario.previewImage}
                      alt={scenario.title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
                        {scenario.title}
                      </h4>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          isPass
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {isPass ? (
                          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" />
                        )}
                        {scenario.badge}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-600 mt-0.5">
                      {scenario.subtitle}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-md">
                      {scenario.description}
                    </p>
                  </div>
                </div>

                <div className="self-end sm:self-center shrink-0">
                  <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition">
                    <span>Load Scenario</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Demonstrates deterministic rule engine & strict evidence-based extraction.</span>
          <button
            id="demo-modal-cancel"
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
