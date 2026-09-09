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
  BookOpen,
  Plus,
  X,
  Trash2
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

const PHOTO_SLOT_LABELS = ['Front / PDP', 'Back Panel', 'Side Panel', 'Other Face'];

export default function App() {
  const [activeTab, setActiveTab] = useState<'scan' | 'history'>('scan');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isDemoPickerOpen, setIsDemoPickerOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentInspection, setCurrentInspection] = useState<InspectionRecord | null>(null);
  const [historyRecords, setHistoryRecords] = useState<InspectionRecord[]>([]);
  const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const directCameraInputRef = useRef<HTMLInputElement | null>(null);

  const selectedImage = selectedImages[activeImageIndex] || selectedImages[0] || null;

  // Load history on mount
  useEffect(() => {
    const saved = getSavedInspections();
    setHistoryRecords(saved);
  }, []);

  // Helper to optimize and resize large camera images (max 1800px, 0.90 quality) to ensure fast payload delivery and prevent network drops
  const optimizeImageDataUrl = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      // If already a small data URL or SVG, return directly
      if (dataUrl.length < 200000 || dataUrl.startsWith('data:image/svg+xml')) {
        resolve(dataUrl);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1800;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.90));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  const readFilesAsDataUrls = (files: File[]): Promise<string[]> => {
    return Promise.all(
      files.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async () => {
              if (typeof reader.result === 'string') {
                try {
                  const optimized = await optimizeImageDataUrl(reader.result);
                  resolve(optimized);
                } catch {
                  resolve(reader.result);
                }
              } else {
                reject(new Error('Failed to read image file'));
              }
            };
            reader.onerror = () => reject(reader.error || new Error('File read failed'));
            reader.readAsDataURL(file);
          })
      )
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const validFiles: File[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const item = fileList.item(i);
      if (item && item.type.startsWith('image/')) {
        validFiles.push(item);
      }
    }

    if (validFiles.length === 0) {
      alert('Please upload a valid image file (JPEG, PNG, WEBP).');
      return;
    }

    try {
      const dataUrls = await readFilesAsDataUrls(validFiles);
      if (replacingIndex !== null) {
        setSelectedImages((prev) => {
          const next = [...prev];
          if (replacingIndex < next.length) {
            next[replacingIndex] = dataUrls[0];
          } else {
            next.push(dataUrls[0]);
          }
          return next.slice(0, 4);
        });
        setActiveImageIndex(replacingIndex);
        setReplacingIndex(null);
      } else {
        setSelectedImages((prev) => {
          const remainingSlots = Math.max(0, 4 - prev.length);
          const toAdd = dataUrls.slice(0, remainingSlots);
          const next = [...prev, ...toAdd];
          return next.slice(0, 4);
        });
        if (selectedImages.length === 0 && dataUrls.length > 0) {
          setActiveImageIndex(0);
        }
      }
      setCurrentInspection(null);
      setApiErrorMessage(null);
    } catch (err) {
      console.error('Error reading files:', err);
    } finally {
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const fileList = e.dataTransfer.files;
    if (!fileList || fileList.length === 0) return;

    const validFiles: File[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const item = fileList.item(i);
      if (item && item.type.startsWith('image/')) {
        validFiles.push(item);
      }
    }
    if (validFiles.length === 0) return;

    try {
      const dataUrls = await readFilesAsDataUrls(validFiles);
      if (replacingIndex !== null) {
        setSelectedImages((prev) => {
          const next = [...prev];
          if (replacingIndex < next.length) {
            next[replacingIndex] = dataUrls[0];
          } else {
            next.push(dataUrls[0]);
          }
          return next.slice(0, 4);
        });
        setActiveImageIndex(replacingIndex);
        setReplacingIndex(null);
      } else {
        setSelectedImages((prev) => {
          const remainingSlots = Math.max(0, 4 - prev.length);
          const toAdd = dataUrls.slice(0, remainingSlots);
          return [...prev, ...toAdd].slice(0, 4);
        });
      }
      setCurrentInspection(null);
      setApiErrorMessage(null);
    } catch (err) {
      console.error('Error reading dropped files:', err);
    }
  };

  const handleCameraCapture = (dataUrl: string) => {
    if (replacingIndex !== null) {
      setSelectedImages((prev) => {
        const next = [...prev];
        if (replacingIndex < next.length) {
          next[replacingIndex] = dataUrl;
        } else {
          next.push(dataUrl);
        }
        return next.slice(0, 4);
      });
      setActiveImageIndex(replacingIndex);
      setReplacingIndex(null);
    } else {
      setSelectedImages((prev) => {
        if (prev.length >= 4) return prev;
        const next = [...prev, dataUrl];
        setActiveImageIndex(next.length - 1);
        return next;
      });
    }
    setIsCameraOpen(false);
    setCurrentInspection(null);
    setApiErrorMessage(null);
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setSelectedImages((prev) => {
      const next = prev.filter((_, idx) => idx !== indexToRemove);
      setActiveImageIndex((curr) => {
        if (curr >= next.length) {
          return Math.max(0, next.length - 1);
        }
        return curr;
      });
      return next;
    });
    setApiErrorMessage(null);
  };

  const handleStartReplace = (indexToReplace: number) => {
    setReplacingIndex(indexToReplace);
    fileInputRef.current?.click();
  };

  const handleClearAllImages = () => {
    setSelectedImages([]);
    setActiveImageIndex(0);
    setReplacingIndex(null);
    setCurrentInspection(null);
    setApiErrorMessage(null);
  };

  // Analyze the selected images via real server-side Gemini API in ONE unified inspection
  const handleAnalyze = async () => {
    if (selectedImages.length === 0) return;

    setIsAnalyzing(true);
    setApiErrorMessage(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: selectedImages,
          image: selectedImages[0],
        }),
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
        let errorMsg =
          data?.error ||
          (data?.details ? `${data.error || 'Error'}: ${data.details}` : null) ||
          data?.message;

        if (!errorMsg) {
          if (response.status === 200 && !data) {
            errorMsg = 'Inspection service returned an invalid non-JSON response.';
          } else if (response.status) {
            errorMsg = `Inspection service error (${response.status}${response.statusText ? ': ' + response.statusText : ''})`;
          } else {
            errorMsg = 'Failed to inspect product package.';
          }
        }
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

      const record = runComplianceScreening(declarations, selectedImages[0]);
      record.imageUris = selectedImages;

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
    setSelectedImages([scenario.previewImage]);
    setActiveImageIndex(0);
    setReplacingIndex(null);
    const record = runComplianceScreening(
      scenario.declarations,
      scenario.previewImage,
      undefined,
      true
    );
    record.imageUris = [scenario.previewImage];
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
              setSelectedImages(rec.imageUris && rec.imageUris.length > 0 ? rec.imageUris : [rec.imageUri]);
              setActiveImageIndex(0);
              setActiveTab('scan');
            }}
            onDeleteRecord={handleDeleteHistory}
            onClearAll={handleClearHistory}
            onStartNewScan={() => {
              setCurrentInspection(null);
              setSelectedImages([]);
              setActiveImageIndex(0);
              setActiveTab('scan');
            }}
            onOpenDemo={() => setIsDemoPickerOpen(true)}
          />
        ) : currentInspection ? (
          <InspectionResultView
            record={currentInspection}
            onBackToScan={() => {
              setCurrentInspection(null);
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

            {/* Hidden inputs accessible from any button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
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

            {/* Large Upload / Camera Card */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-8">
              {selectedImages.length === 0 ? (
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
                      Capture up to 4 package panels (Front PDP, Back, Side, or Other) showing MRP, Net Quantity, and Manufacturer details
                    </p>
                  </div>

                  {/* Primary Action Buttons */}
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    {/* Live Camera Modal Trigger */}
                    <button
                      id="btn-take-photo"
                      type="button"
                      onClick={() => {
                        setReplacingIndex(null);
                        setIsCameraOpen(true);
                      }}
                      className="inline-flex items-center px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition cursor-pointer"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      <span>Take Photo</span>
                    </button>

                    {/* Direct Native Camera (Instant phone shutter on mobile) */}
                    <button
                      id="btn-mobile-camera-native"
                      type="button"
                      onClick={() => {
                        setReplacingIndex(null);
                        directCameraInputRef.current?.click();
                      }}
                      className="sm:hidden inline-flex items-center px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs shadow transition cursor-pointer"
                    >
                      <span>Device Camera</span>
                    </button>

                    {/* File Upload Trigger */}
                    <button
                      id="btn-upload-image"
                      type="button"
                      onClick={() => {
                        setReplacingIndex(null);
                        fileInputRef.current?.click();
                      }}
                      className="inline-flex items-center px-5 py-3 rounded-xl bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-800 font-semibold text-xs sm:text-sm shadow-xs transition cursor-pointer"
                    >
                      <Upload className="w-4 h-4 mr-2 text-slate-600" />
                      <span>Upload Photos (Up to 4)</span>
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

                  <p className="text-[11px] text-slate-400 pt-2">
                    Supports JPG, PNG, WEBP • Max 15MB each • Up to 4 package faces analyzed in one inspection
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Selected Active Image Preview */}
                  <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 aspect-[16/10] sm:aspect-[16/9] max-h-[420px] flex items-center justify-center group">
                    <img
                      src={selectedImage!}
                      alt="Selected Package Preview"
                      className="w-full h-full object-contain"
                    />

                    {/* Top-right overlay actions */}
                    <div className="absolute top-3 right-3 flex items-center space-x-2">
                      <button
                        id="btn-replace-current"
                        type="button"
                        onClick={() => handleStartReplace(activeImageIndex)}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg bg-black/70 hover:bg-black/90 text-white text-xs font-semibold backdrop-blur-sm transition cursor-pointer"
                        title="Replace this photo"
                      >
                        <RefreshCw className="w-3.5 h-3.5 mr-1" />
                        <span>Replace</span>
                      </button>

                      {selectedImages.length > 1 && (
                        <button
                          id="btn-remove-current"
                          type="button"
                          onClick={() => handleRemoveImage(activeImageIndex)}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-black/70 hover:bg-rose-600 text-white text-xs font-semibold backdrop-blur-sm transition cursor-pointer"
                          title="Remove this photo"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          <span>Remove</span>
                        </button>
                      )}

                      <button
                        id="btn-clear-all"
                        type="button"
                        onClick={handleClearAllImages}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg bg-black/70 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold backdrop-blur-sm transition cursor-pointer"
                        title="Clear all photos"
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        <span>Clear All</span>
                      </button>
                    </div>

                    {/* Bottom-left metadata badge */}
                    <div className="absolute bottom-3 left-3 bg-black/75 px-3 py-1.5 rounded-md backdrop-blur-sm text-[11px] text-slate-200 flex items-center space-x-2">
                      <span className="font-bold text-white">
                        {PHOTO_SLOT_LABELS[activeImageIndex] || `Photo ${activeImageIndex + 1}`}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span>Photo {activeImageIndex + 1} of {selectedImages.length}</span>
                      {selectedImages.length > 1 && (
                        <>
                          <span className="text-slate-400">•</span>
                          <span className="text-blue-300 font-medium hidden sm:inline">
                            Synthesizing across {selectedImages.length} panels
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Multi-Photo Thumbnails Tray */}
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-800">
                          Package Panel Photos ({selectedImages.length}/4)
                        </span>
                        <span className="text-[11px] text-slate-500 hidden sm:inline">
                          • Click thumbnail to inspect • Sent in 1 Gemini inspection
                        </span>
                      </div>

                      {selectedImages.length < 4 && (
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setReplacingIndex(null);
                              setIsCameraOpen(true);
                            }}
                            className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5 mr-1" />
                            <span>Take Photo</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setReplacingIndex(null);
                              fileInputRef.current?.click();
                            }}
                            className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5 mr-1" />
                            <span>Upload File</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 4-Column Thumbnail Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {selectedImages.map((img, idx) => {
                        const isActive = idx === activeImageIndex;
                        const label = PHOTO_SLOT_LABELS[idx] || `Photo ${idx + 1}`;
                        return (
                          <div
                            key={idx}
                            onClick={() => setActiveImageIndex(idx)}
                            className={`group relative rounded-xl border-2 overflow-hidden aspect-[4/3] cursor-pointer transition shadow-xs ${
                              isActive
                                ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/20'
                                : 'border-slate-200 hover:border-slate-300 bg-slate-100'
                            }`}
                          >
                            <img
                              src={img}
                              alt={label}
                              className="w-full h-full object-cover"
                            />

                            {/* Label Badge */}
                            <div className="absolute top-1.5 left-1.5 bg-black/75 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-bold text-white tracking-wide">
                              {label}
                            </div>

                            {/* Action Buttons Overlay */}
                            <div className="absolute top-1.5 right-1.5 flex items-center space-x-1 opacity-90 group-hover:opacity-100 transition">
                              <button
                                type="button"
                                title="Replace this photo"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartReplace(idx);
                                }}
                                className="p-1 rounded bg-black/70 hover:bg-black/90 text-white transition cursor-pointer"
                              >
                                <RefreshCw className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                title="Remove photo"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveImage(idx);
                                }}
                                className="p-1 rounded bg-black/70 hover:bg-rose-600 text-white transition cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Active indicator bar */}
                            {isActive && (
                              <div className="absolute bottom-0 inset-x-0 bg-blue-600 text-[10px] text-white font-bold text-center py-0.5">
                                Active Preview
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Empty Slot Placeholder (if under 4) */}
                      {selectedImages.length < 4 && (
                        <div
                          onClick={() => {
                            setReplacingIndex(null);
                            fileInputRef.current?.click();
                          }}
                          className="rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50/70 hover:bg-blue-50/30 aspect-[4/3] flex flex-col items-center justify-center text-slate-500 hover:text-blue-600 transition cursor-pointer p-2 text-center"
                        >
                          <div className="w-7 h-7 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center mb-1 text-slate-600">
                            <Plus className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold">
                            + Add {PHOTO_SLOT_LABELS[selectedImages.length] || 'Panel'}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            Up to 4 panels
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Unified Analyze Button Container */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                    <div className="text-left space-y-0.5">
                      <h4 className="text-sm font-bold text-blue-950">
                        {selectedImages.length === 1
                          ? 'Ready to inspect package declarations'
                          : `Ready to inspect ${selectedImages.length} package photos`}
                      </h4>
                      <p className="text-xs text-blue-700">
                        {selectedImages.length === 1
                          ? 'Will run strict evidence-based extraction and Rule 6 compliance screening'
                          : `Gemini will synthesize evidence across all ${selectedImages.length} package photos into one unified statutory declaration`}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3 w-full sm:w-auto">
                      <button
                        id="btn-retake-photo"
                        type="button"
                        onClick={handleClearAllImages}
                        className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-white text-slate-700 font-semibold text-xs sm:text-sm transition cursor-pointer"
                      >
                        Clear All
                      </button>
                      <button
                        id="btn-analyze-product"
                        type="button"
                        onClick={handleAnalyze}
                        className="w-1/2 sm:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/30 transition cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        <span>
                          {selectedImages.length === 1
                            ? 'Analyze Product'
                            : `Analyze ${selectedImages.length} Photos`}
                        </span>
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
        onClose={() => {
          setIsCameraOpen(false);
          setReplacingIndex(null);
        }}
        onCapture={handleCameraCapture}
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
