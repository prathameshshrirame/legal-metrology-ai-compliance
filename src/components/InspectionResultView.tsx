import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  FileDown,
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Maximize2,
  X,
  Info,
  Building,
  Calendar,
  IndianRupee,
  Scale,
  Phone,
  Globe,
  FileText,
  AlertCircle,
  Tag,
  Clock
} from 'lucide-react';
import { InspectionRecord } from '../types';
import { generateInspectionPdf } from '../utils/pdfGenerator';

interface InspectionResultViewProps {
  record: InspectionRecord;
  onBackToScan: () => void;
  onSave: (record: InspectionRecord) => void;
  isSaved?: boolean;
}

export const InspectionResultView: React.FC<InspectionResultViewProps> = ({
  record,
  onBackToScan,
  onSave,
  isSaved = false,
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSavedState, setIsSavedState] = useState(isSaved);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [showRawText, setShowRawText] = useState(false);
  const [activeEvidenceIndex, setActiveEvidenceIndex] = useState(0);

  const evidenceList =
    record.imageUris && record.imageUris.length > 0
      ? record.imageUris
      : [record.imageUri];
  const activeImage = evidenceList[activeEvidenceIndex] || record.imageUri;

  const isPass = record.overallStatus === 'PASS';

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      await generateInspectionPdf(record);
    } catch (err) {
      console.error('Failed to generate PDF report', err);
      alert('Could not generate PDF. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSaveToggle = () => {
    onSave(record);
    setIsSavedState(true);
  };

  return (
    <div className="space-y-6">
      {/* Top action & status banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <button
          id="result-back-button"
          onClick={onBackToScan}
          className="inline-flex items-center text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          <span>Back to Scanner</span>
        </button>

        <div className="flex items-center space-x-2.5">
          <button
            id="result-save-button"
            onClick={handleSaveToggle}
            className={`inline-flex items-center px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer border ${
              isSavedState
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {isSavedState ? (
              <>
                <BookmarkCheck className="w-4 h-4 mr-1.5 text-emerald-600" />
                <span>Saved to Records</span>
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4 mr-1.5 text-slate-500" />
                <span>Save Inspection</span>
              </>
            )}
          </button>

          <button
            id="result-pdf-button"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            <FileDown className="w-4 h-4 mr-1.5" />
            <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF Report'}</span>
          </button>
        </div>
      </div>

      {/* Mandatory Statutory Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/90 text-amber-900 text-xs flex items-start space-x-3">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold text-amber-950">
            STATUTORY NOTICE: AI-Assisted Compliance Screening (NOT Legal Certification)
          </p>
          <p className="text-amber-800 leading-relaxed">
            This is AI-assisted preliminary compliance screening based on the submitted image. It does not constitute legal certification or a final enforcement decision. Findings indicate whether declarations were detected on visible package panels.
          </p>
        </div>
      </div>

      {/* Inspection Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                {record.id}
              </span>
              <span className="text-xs text-slate-400">
                {new Date(record.timestamp).toLocaleString()}
              </span>
              {record.isDemo && (
                <span className="text-[11px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  Demo Sample
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {record.productName}
            </h1>
            <p className="text-xs text-slate-500">
              Evaluation subject: Packaged Commodity Retail Unit
            </p>
          </div>

          {/* Metric Badges */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Score Ring / Block */}
            <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="text-right" title="Screening score based on declarations detectable in the submitted image.">
                <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Screening Score
                </span>
                <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                  {record.complianceScore}
                  <span className="text-xs font-normal text-slate-400">/100</span>
                </span>
              </div>
              <div
                className={`w-12 h-12 rounded-full border-4 flex items-center justify-center font-bold text-sm ${
                  record.complianceScore >= 80
                    ? 'border-emerald-500 text-emerald-700 bg-emerald-50'
                    : 'border-amber-500 text-amber-700 bg-amber-50'
                }`}
              >
                {record.complianceScore}%
              </div>
            </div>

            {/* Overall Status Badge */}
            <div
              className={`px-4 py-3 rounded-xl border flex items-center space-x-2.5 ${
                isPass
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {isPass ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-7 h-7 text-rose-600 shrink-0" />
              )}
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider opacity-70">
                  Overall Result
                </span>
                <span className="text-base sm:text-lg font-black tracking-tight">
                  {record.overallStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout: Left is Evidence & Declarations, Right is Checks & Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Evidence Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Physical Evidence</h3>
              </div>
              <button
                id="evidence-zoom-button"
                onClick={() => setIsZoomOpen(true)}
                className="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-800 transition cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5 mr-1" />
                <span>Inspect Image</span>
              </button>
            </div>

            <div
              onClick={() => setIsZoomOpen(true)}
              className="relative aspect-[4/3] bg-slate-950 rounded-xl overflow-hidden cursor-zoom-in group border border-slate-200"
            >
              <img
                src={activeImage}
                alt="Product Package Evidence"
                className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold">
                <Maximize2 className="w-5 h-5 mr-1.5" />
                Click to expand evidence view
              </div>
              {evidenceList.length > 1 && (
                <div className="absolute bottom-2 left-2 bg-black/75 px-2.5 py-1 rounded text-[10px] text-white font-semibold backdrop-blur-xs">
                  Photo {activeEvidenceIndex + 1} of {evidenceList.length} • {activeEvidenceIndex === 0 ? 'Front / PDP' : activeEvidenceIndex === 1 ? 'Back Panel' : activeEvidenceIndex === 2 ? 'Side Panel' : 'Other Face'}
                </div>
              )}
            </div>

            {/* Thumbnail switcher if multiple package photos were inspected */}
            {evidenceList.length > 1 && (
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                  <span>Inspected Package Faces ({evidenceList.length})</span>
                  <span className="text-slate-400 font-normal">Click to switch photo</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {evidenceList.map((img, idx) => {
                    const isSelected = idx === activeEvidenceIndex;
                    const label = idx === 0 ? 'Front' : idx === 1 ? 'Back' : idx === 2 ? 'Side' : 'Other';
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveEvidenceIndex(idx)}
                        className={`relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition cursor-pointer ${
                          isSelected
                            ? 'border-blue-600 ring-2 ring-blue-500/20'
                            : 'border-slate-200 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt={`Panel ${idx + 1}`} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-white font-bold text-center truncate px-0.5">
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>Verified Evidence Extraction</span>
              <span className="font-mono">Confidence: {Math.round(record.declarations.confidence * 100)}%</span>
            </div>
          </div>

          {/* Section: Detected Declarations */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Detected Declarations
              </h3>
              <span className="text-[11px] text-slate-500">
                Rule 6 Statutory Mandate
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {/* MRP */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center space-x-1.5 text-slate-500 font-semibold mb-1">
                  <IndianRupee className="w-3.5 h-3.5 text-blue-600" />
                  <span>Maximum Retail Price (MRP)</span>
                </div>
                <p className={`font-semibold ${record.declarations.mrp ? 'text-slate-900' : 'text-amber-600 italic'}`}>
                  {record.declarations.mrp || 'Not detected on visible panels'}
                </p>
              </div>

              {/* Net Quantity */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center space-x-1.5 text-slate-500 font-semibold mb-1">
                  <Scale className="w-3.5 h-3.5 text-blue-600" />
                  <span>Net Quantity</span>
                </div>
                <p className={`font-semibold ${record.declarations.netQuantity ? 'text-slate-900' : 'text-amber-600 italic'}`}>
                  {record.declarations.netQuantity || 'Not detected on visible panels'}
                </p>
              </div>

              {/* Manufacturing / Packing Date */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center space-x-1.5 text-slate-500 font-semibold mb-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Manufacturing / Packing Date</span>
                </div>
                <p className={`font-semibold ${record.declarations.manufacturingDate ? 'text-slate-900' : 'text-amber-600 italic'}`}>
                  {record.declarations.manufacturingDate || 'Not detected on visible panels'}
                </p>
              </div>

              {/* Manufacturer / Packer */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center space-x-1.5 text-slate-500 font-semibold mb-1">
                  <Building className="w-3.5 h-3.5 text-blue-600" />
                  <span>Manufacturer / Packer</span>
                </div>
                <p className={`leading-relaxed ${record.declarations.manufacturer || record.declarations.packer ? 'text-slate-900 font-medium' : 'text-amber-600 italic'}`}>
                  {record.declarations.manufacturer || record.declarations.packer || 'Not detected on visible panels'}
                </p>
              </div>

              {/* Importer (if present) */}
              {record.declarations.importer && (
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center space-x-1.5 text-slate-500 font-semibold mb-1">
                    <Building className="w-3.5 h-3.5 text-purple-600" />
                    <span>Importer Details</span>
                  </div>
                  <p className="text-slate-900 font-medium leading-relaxed">
                    {record.declarations.importer}
                  </p>
                </div>
              )}

              {/* Consumer Care */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center space-x-1.5 text-slate-500 font-semibold mb-1">
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  <span>Consumer Care Information</span>
                </div>
                <p className={`leading-relaxed ${record.declarations.consumerCare ? 'text-slate-900 font-medium' : 'text-amber-600 italic'}`}>
                  {record.declarations.consumerCare || 'Not detected on visible panels'}
                </p>
              </div>

              {/* Country of Origin */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center space-x-1.5 text-slate-500 font-semibold mb-1">
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  <span>Country of Origin</span>
                </div>
                <p className={`font-semibold ${record.declarations.countryOfOrigin ? 'text-slate-900' : 'text-slate-500 italic'}`}>
                  {record.declarations.countryOfOrigin || 'Not detected'}
                </p>
              </div>

              {/* Common / Generic Commodity Name (Rule 6(1)(b)) */}
              {record.declarations.genericName && (
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center space-x-1.5 text-slate-500 font-semibold mb-1">
                    <Tag className="w-3.5 h-3.5 text-blue-600" />
                    <span>Common / Generic Name (Rule 6(1)(b))</span>
                  </div>
                  <p className="text-slate-900 font-medium">
                    {record.declarations.genericName}
                  </p>
                </div>
              )}

              {/* Unit Sale Price (USP) (Rule 6(11)) */}
              {record.declarations.unitSalePrice && (
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center space-x-1.5 text-slate-500 font-semibold mb-1">
                    <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Unit Sale Price (Rule 6(11))</span>
                  </div>
                  <p className="text-slate-900 font-medium">
                    {record.declarations.unitSalePrice}
                  </p>
                </div>
              )}

              {/* Best Before / Use By (Where applicable) */}
              {record.declarations.bestBefore && (
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center space-x-1.5 text-slate-500 font-semibold mb-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Best Before / Expiry</span>
                  </div>
                  <p className="text-slate-900 font-medium">
                    {record.declarations.bestBefore}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section: Issues Requiring Review (if any non-compliances) */}
          {record.issuesRequiringReview && record.issuesRequiringReview.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center space-x-2 text-rose-900 mb-2">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <h3 className="text-sm font-bold">Issues Requiring Review</h3>
              </div>
              <p className="text-xs text-rose-800 mb-3">
                The following statutory declarations appear missing, incomplete, or illegible on the inspected packaging surface:
              </p>
              <ul className="space-y-2">
                {record.issuesRequiringReview.map((issue, idx) => (
                  <li
                    key={idx}
                    className="flex items-start space-x-2 text-xs text-rose-950 font-medium bg-white/70 p-2.5 rounded-lg border border-rose-100"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Section: Compliance Checks */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Compliance Checks
                </h3>
                <p className="text-xs text-slate-500">
                  Automated verification against Legal Metrology Rules, 2011 provisions
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                {record.complianceChecks.filter((c) => c.status === 'PASS').length} / {record.complianceChecks.length} Passed
              </span>
            </div>

            <div className="space-y-3">
              {record.complianceChecks.map((chk) => {
                const isChkPass = chk.status === 'PASS';
                return (
                  <div
                    key={chk.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isChkPass
                        ? 'bg-white border-slate-200 hover:border-emerald-300'
                        : 'bg-rose-50/40 border-rose-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {chk.ruleRef}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900">
                            {chk.checkName}
                          </h4>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black tracking-wide shrink-0 ${
                          isChkPass
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {isChkPass ? (
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-600" />
                        )}
                        {chk.status}
                      </span>
                    </div>

                    <div className="text-xs space-y-1 mt-2">
                      <div className="flex items-baseline space-x-1.5">
                        <span className="text-slate-500 font-semibold">Detected:</span>
                        <span className={`font-medium ${isChkPass ? 'text-slate-800' : 'text-rose-700'}`}>
                          {chk.detectedValue}
                        </span>
                      </div>
                      <p className="text-slate-500 leading-relaxed pt-0.5">
                        {chk.explanation}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Product Information (Factual Ingredients / Nutrition) */}
          {(record.declarations.ingredients || record.declarations.nutritionInfo) && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Product Information (Factual Label Disclosures)
                </h3>
                <p className="text-xs text-slate-500">
                  Direct transcription from package label. No medical or dietary claims made.
                </p>
              </div>

              {/* Ingredients */}
              {record.declarations.ingredients && record.declarations.ingredients.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-1.5">
                    Ingredients List
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {record.declarations.ingredients.map((ing, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200"
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Nutrition Info */}
              {record.declarations.nutritionInfo && (
                <div className="mt-3">
                  <h4 className="text-xs font-bold text-slate-700 mb-1.5">
                    Nutritional Facts Panel
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(record.declarations.nutritionInfo).map(([key, val]) => (
                      <div
                        key={key}
                        className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-xs"
                      >
                        <span className="text-slate-500 block text-[11px] truncate">{key}</span>
                        <span className="font-bold text-slate-900">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Raw Text Accordion for Inspector Audit */}
          {record.declarations.rawVisibleText && (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
              <button
                id="raw-text-toggle"
                onClick={() => setShowRawText(!showRawText)}
                className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-700 cursor-pointer"
              >
                <div className="flex items-center space-x-1.5">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>View Raw Optical Text Transcript</span>
                </div>
                <span className="text-blue-600 text-xs font-medium">
                  {showRawText ? 'Hide' : 'Show OCR'}
                </span>
              </button>

              {showRawText && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <pre className="text-[11px] font-mono text-slate-700 whitespace-pre-wrap bg-white p-3 rounded-lg border border-slate-200 max-h-48 overflow-y-auto leading-relaxed">
                    {record.declarations.rawVisibleText}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Image Zoom Modal */}
      {isZoomOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              id="zoom-modal-close"
              onClick={() => setIsZoomOpen(false)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 p-1 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={activeImage}
              alt="Expanded Evidence"
              className="max-h-[80vh] w-auto object-contain rounded-lg shadow-2xl border border-slate-700"
            />
            {evidenceList.length > 1 && (
              <div className="mt-3 flex items-center gap-2 flex-wrap justify-center">
                {evidenceList.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveEvidenceIndex(idx)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer border ${
                      idx === activeEvidenceIndex
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-black/60 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    Photo {idx + 1} ({idx === 0 ? 'Front' : idx === 1 ? 'Back' : idx === 2 ? 'Side' : 'Other'})
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
