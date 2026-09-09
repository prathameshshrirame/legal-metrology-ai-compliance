import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  RefreshCw,
  Info,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  BookOpen
} from 'lucide-react';
import { Header } from './components/Header';
import { CameraModal } from './components/CameraModal';
import { DemoPickerModal } from './components/DemoPickerModal';
import { AnalysisProgress } from './components/AnalysisProgress';
import { InspectionResultView } from './components/InspectionResultView';
import { HistoryView } from './components/HistoryView';
import { RulesReferenceModal } from './components/RulesReferenceModal';
import { DemoScenario, InspectionRecord, InspectionDeclaration } from './types';
import { runComplianceScreening } from './utils/complianceEngine';
import {
  getSavedInspections,
  saveInspection,
  deleteInspection,
  clearAllInspections,
} from './utils/storage';

export default function App() {
  const [activeTab, setActiveTab] = useState<'scan' | 'history'>('scan');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isDemoPickerOpen, setIsDemoPickerOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentInspection, setCurrentInspection] = useState<InspectionRecord | null>(null);
  const [historyRecords, setHistoryRecords] = useState<InspectionRecord[]>([]);
  const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const directCameraInputRef = useRef<HTMLInputElement | null>(null);

  // Load history on mount
  useEffect(() => {
    const saved = getSavedInspections();
    setHistoryRecords(saved);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPEG, PNG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedImage(reader.result);
        setCurrentInspection(null);
        setApiErrorMessage(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setSelectedImage(reader.result);
          setCurrentInspection(null);
          setApiErrorMessage(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Analyze the selected image via real server-side Gemini API
  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setApiErrorMessage(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: selectedImage }),
      });

      // Safely read response text and parse JSON
      const rawText = await response.text();
      let data: any = null;
      if (rawText && rawText.trim()) {
        try {
          data = JSON.parse(rawText);
        } catch {
          // If response body is not valid JSON (e.g. gateway or proxy HTML error)
          data = null;
        }
      }

      if (!response.ok || !data || !data.success) {
        const errorMsg =
          data?.error ||
          (data?.details ? `${data.error}: ${data.details}` : null) ||
          (response.status
            ? `Inspection service error (${response.status}: ${response.statusText || 'Unavailable'})`
            : null) ||
          'Failed to inspect product package.';
        throw new Error(errorMsg);
      }

      // Safeguard declarations: do not attempt JSON.parse on an already-parsed response
      let declarations: InspectionDeclaration;
      if (typeof data.declarations === 'object' && data.declarations !== null) {
        declarations = data.declarations;
      } else if (typeof data.declarations === 'string') {
        try {
          declarations = JSON.parse(data.declarations);
        } catch {
          throw new Error('Analysis response contained an unparseable declarations payload.');
        }
      } else {
        throw new Error('Analysis response missing statutory declarations data.');
      }

      const record = runComplianceScreening(declarations, selectedImage);

      setCurrentInspection(record);
      const updated = saveInspection(record);
      setHistoryRecords(updated);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setApiErrorMessage(
        err.message ||
          'Failed to connect to the AI inspection server. You can try built-in Demo Scenarios to evaluate the compliance engine.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Load a demo scenario directly
  const handleSelectScenario = (scenario: DemoScenario) => {
    setSelectedImage(scenario.previewImage);
    const record = runComplianceScreening(
      scenario.declarations,
      scenario.previewImage,
      undefined,
      true
    );
    setCurrentInspection(record);
    const updated = saveInspection(record);
    setHistoryRecords(updated);
    setActiveTab('scan');
  };

  const handleSaveCurrent = (record: InspectionRecord) => {
    const updated = saveInspection(record);
    setHistoryRecords(updated);
  };

  const handleDeleteHistory = (id: string) => {
    const updated = deleteInspection(id);
    setHistoryRecords(updated);
    if (currentInspection?.id === id) {
      setCurrentInspection(null);
    }
  };

  const handleClearHistory = () => {
    const updated = clearAllInspections();
    setHistoryRecords(updated);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        savedCount={historyRecords.length}
        onOpenDemo={() => setIsDemoPickerOpen(true)}
        onOpenRules={() => setIsRulesOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'history' ? (
          <HistoryView
            records={historyRecords}
            onSelectRecord={(rec) => {
              setCurrentInspection(rec);
              setSelectedImage(rec.imageUri);
              setActiveTab('scan');
            }}
            onDeleteRecord={handleDeleteHistory}
            onClearAll={handleClearHistory}
            onStartNewScan={() => {
              setCurrentInspection(null);
              setSelectedImage(null);
              setActiveTab('scan');
            }}
            onOpenDemo={() => setIsDemoPickerOpen(true)}
          />
        ) : currentInspection ? (
          <InspectionResultView
            record={currentInspection}
            onBackToScan={() => {
              setCurrentInspection(null);
              setSelectedImage(null);
            }}
            onSave={handleSaveCurrent}
            isSaved={historyRecords.some((r) => r.id === currentInspection.id)}
          />
        ) : (
          <div className="space-y-8 max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center space-y-3 pt-2 sm:pt-4">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold shadow-xs">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Smart India Hackathon 2026 • Problem Statement SIH 26034</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
                Scan. Extract. Validate. Report.
              </h1>

              <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Automated legal metrology screening of packaged commodities. Inspects packaging labels, extracts statutory declarations using Gemini Multimodal AI, and flags potential non-compliances under the{' '}
                <span className="font-semibold text-slate-800">
                  Legal Metrology (Packaged Commodities) Rules, 2011
                </span>.
              </p>
            </div>

            {/* Error banner if API failure */}
            {apiErrorMessage && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm flex items-start justify-between gap-3">
                <div className="flex items-start space-x-2.5">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-rose-950">AI Inspection Notice</p>
                    <p className="text-rose-800 mt-0.5">{apiErrorMessage}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDemoPickerOpen(true)}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition cursor-pointer"
                >
                  Try Demo Scenarios
                </button>
              </div>
            )}

            {/* Large Upload / Camera Card */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-8">
              {!selectedImage ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 sm:p-12 text-center transition bg-slate-50/50 hover:bg-blue-50/20 flex flex-col items-center justify-center space-y-4"
                >
                  <div className="w-16 h-16 rounded-2xl bg-blue-100/80 text-blue-600 flex items-center justify-center shadow-inner">
                    <Camera className="w-8 h-8" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base sm:text-lg font-bold text-slate-800">
                      Upload or Photograph Packaged Product
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-md">
                      Capture the Principal Display Panel (PDP) showing MRP, Net Quantity, and Manufacturer details
                    </p>
                  </div>

                  {/* Primary Action Buttons */}
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    {/* Live Camera Modal Trigger */}
                    <button
                      id="btn-take-photo"
                      type="button"
                      onClick={() => setIsCameraOpen(true)}
                      className="inline-flex items-center px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition cursor-pointer"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      <span>Take Photo</span>
                    </button>

                    {/* Direct Native Camera (Instant phone shutter on mobile) */}
                    <button
                      id="btn-mobile-camera-native"
                      type="button"
                      onClick={() => directCameraInputRef.current?.click()}
                      className="sm:hidden inline-flex items-center px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs shadow transition cursor-pointer"
                    >
                      <span>Device Camera</span>
                    </button>

                    {/* File Upload Trigger */}
                    <button
                      id="btn-upload-image"
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center px-5 py-3 rounded-xl bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-800 font-semibold text-xs sm:text-sm shadow-xs transition cursor-pointer"
                    >
                      <Upload className="w-4 h-4 mr-2 text-slate-600" />
                      <span>Upload Image</span>
                    </button>

                    {/* Quick Demo Trigger */}
                    <button
                      id="btn-quick-demo"
                      type="button"
                      onClick={() => setIsDemoPickerOpen(true)}
                      className="inline-flex items-center px-4 py-3 rounded-xl bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-900 font-semibold text-xs sm:text-sm transition cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 mr-1.5 text-amber-600" />
                      <span>Try Demo Scenarios</span>
                    </button>
                  </div>

                  {/* Hidden inputs */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <input
                    ref={directCameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileUpload}
                  />

                  <p className="text-[11px] text-slate-400 pt-2">
                    Supports JPG, PNG, WEBP • Max 15MB • Mobile camera ready
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Selected Image Preview */}
                  <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 aspect-[16/10] sm:aspect-[16/9] max-h-[420px] flex items-center justify-center group">
                    <img
                      src={selectedImage}
                      alt="Selected Package Preview"
                      className="w-full h-full object-contain"
                    />

                    <div className="absolute top-3 right-3 flex items-center space-x-2">
                      <button
                        id="btn-change-image"
                        onClick={() => setSelectedImage(null)}
                        className="px-3 py-1.5 rounded-lg bg-black/70 hover:bg-black/90 text-white text-xs font-semibold backdrop-blur-sm transition cursor-pointer"
                      >
                        Change Photo
                      </button>
                    </div>

                    <div className="absolute bottom-3 left-3 bg-black/70 px-3 py-1 rounded-md backdrop-blur-sm text-[11px] text-slate-300">
                      Package ready for Legal Metrology AI Inspection
                    </div>
                  </div>

                  {/* Analyze Button Container */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                    <div className="text-left space-y-0.5">
                      <h4 className="text-sm font-bold text-blue-950">
                        Ready to inspect package declarations
                      </h4>
                      <p className="text-xs text-blue-700">
                        Will run strict evidence-based extraction and Rule 6 compliance screening
                      </p>
                    </div>

                    <div className="flex items-center space-x-3 w-full sm:w-auto">
                      <button
                        id="btn-retake-photo"
                        type="button"
                        onClick={() => setSelectedImage(null)}
                        className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-white text-slate-700 font-semibold text-xs sm:text-sm transition cursor-pointer"
                      >
                        Retake
                      </button>
                      <button
                        id="btn-analyze-product"
                        type="button"
                        onClick={handleAnalyze}
                        className="w-1/2 sm:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/30 transition cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        <span>Analyze Product</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Feature Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Deterministic Rule Engine</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Validates MRP, Net Qty, Mfg Date, Packer, and Consumer Helpline against statutory Rule 6 provisions.
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Strict Evidence-Based AI</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Only reports confidently visible information from printed packaging labels. Missing or unreadable data is explicitly marked as "Not detected".
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Official PDF Reports</h3>
                <p className="text-xs text-slate-500 mt-1">
                  One-click downloadable preliminary inspection reports featuring evidence photos and audit trails.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Camera Viewfinder Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(dataUrl) => {
          setSelectedImage(dataUrl);
          setCurrentInspection(null);
          setApiErrorMessage(null);
        }}
      />

      {/* Demo Scenario Picker Modal */}
      <DemoPickerModal
        isOpen={isDemoPickerOpen}
        onClose={() => setIsDemoPickerOpen(false)}
        onSelectScenario={handleSelectScenario}
      />

      {/* Legal Metrology Rules Reference Modal */}
      <RulesReferenceModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

      {/* Real-time Analysis Progress Modal */}
      {isAnalyzing && <AnalysisProgress />}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Smart India Hackathon 2026 • Problem Statement SIH 26034 • Legal Metrology (Packaged Commodities) Rules, 2011
          </span>
          <span className="text-slate-400">
            AI-Assisted Preliminary Compliance Screening Prototype
          </span>
        </div>
      </footer>
    </div>
  );
}
