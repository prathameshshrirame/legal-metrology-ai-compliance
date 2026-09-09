import React, { useState } from 'react';
import {
  History,
  Search,
  CheckCircle2,
  AlertTriangle,
  Eye,
  FileDown,
  Trash2,
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { InspectionRecord } from '../types';
import { generateInspectionPdf } from '../utils/pdfGenerator';

interface HistoryViewProps {
  records: InspectionRecord[];
  onSelectRecord: (record: InspectionRecord) => void;
  onDeleteRecord: (id: string) => void;
  onClearAll: () => void;
  onStartNewScan: () => void;
  onOpenDemo: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  records,
  onSelectRecord,
  onDeleteRecord,
  onClearAll,
  onStartNewScan,
  onOpenDemo,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASS' | 'REVIEW REQUIRED'>('ALL');
  const [isExportingId, setIsExportingId] = useState<string | null>(null);

  const filtered = records.filter((rec) => {
    const matchesSearch =
      rec.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || rec.overallStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportPdf = async (e: React.MouseEvent, rec: InspectionRecord) => {
    e.stopPropagation();
    try {
      setIsExportingId(rec.id);
      await generateInspectionPdf(rec);
    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF.');
    } finally {
      setIsExportingId(null);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this inspection record?')) {
      onDeleteRecord(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Inspection History & Records
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Audit archive of scanned packaged commodities and preliminary compliance screenings
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {records.length > 0 && (
            <button
              id="history-clear-all"
              onClick={() => {
                if (confirm('Are you sure you want to clear all inspection history?')) {
                  onClearAll();
                }
              }}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800 px-3 py-2 rounded-xl hover:bg-rose-50 transition cursor-pointer"
            >
              Clear All
            </button>
          )}

          <button
            id="history-new-scan-button"
            onClick={onStartNewScan}
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition cursor-pointer"
          >
            <span>+ New Inspection</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="history-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Product name or Inspection ID..."
            className="w-full pl-9.5 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl">
          {(['ALL', 'PASS', 'REVIEW REQUIRED'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === filter
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {filter === 'ALL' ? 'All' : filter === 'PASS' ? 'Pass' : 'Review'}
            </button>
          ))}
        </div>
      </div>

      {/* Record Cards List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No inspections found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {records.length === 0
              ? 'No packages have been inspected yet. Start your first scan or load demo records.'
              : 'No inspections match your search filter criteria.'}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={onStartNewScan}
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 transition cursor-pointer"
            >
              Scan Package Now
            </button>
            <button
              onClick={onOpenDemo}
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" />
              Load Demo Scenarios
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((rec) => {
            const isPass = rec.overallStatus === 'PASS';
            return (
              <div
                key={rec.id}
                id={`history-item-${rec.id}`}
                onClick={() => onSelectRecord(rec)}
                className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all duration-200 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
              >
                {/* Left product & thumb info */}
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center relative">
                    <img
                      src={rec.imageUri}
                      alt={rec.productName}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {rec.id}
                      </span>
                      <span className="flex items-center text-xs text-slate-400">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(rec.timestamp).toLocaleDateString()} {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition">
                      {rec.productName}
                    </h3>

                    <div className="text-xs text-slate-500">
                      <span>MRP: {rec.declarations.mrp || 'Not detected'}</span>
                      <span className="mx-2">•</span>
                      <span>Net Qty: {rec.declarations.netQuantity || 'Not detected'}</span>
                    </div>
                  </div>
                </div>

                {/* Right badges & actions */}
                <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {/* Score badge */}
                  <div className="text-right mr-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Score
                    </span>
                    <span className="font-mono text-sm font-black text-slate-900">
                      {rec.complianceScore}%
                    </span>
                  </div>

                  {/* Status pill */}
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                      isPass
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {isPass ? (
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-600" />
                    )}
                    {rec.overallStatus}
                  </span>

                  {/* PDF download */}
                  <button
                    id={`btn-pdf-${rec.id}`}
                    type="button"
                    onClick={(e) => handleExportPdf(e, rec)}
                    disabled={isExportingId === rec.id}
                    className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                    title="Export Inspection PDF"
                  >
                    <FileDown className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    id={`btn-delete-${rec.id}`}
                    type="button"
                    onClick={(e) => handleDelete(e, rec.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    title="Delete Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* View indicator */}
                  <div className="hidden sm:flex items-center text-slate-400 group-hover:text-blue-600 transition pl-1">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
