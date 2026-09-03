import React, { useState } from 'react';
import {
  Printer,
  Send,
  FileText,
  Eye,
  Download,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  X,
  UploadCloud,
  RefreshCw,
} from 'lucide-react';
import { UserDID } from '../types/auth';

interface FaxRecord {
  id: string;
  direction: 'inbound' | 'outbound';
  recipientOrSender: string;
  pages: number;
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  timestamp: number;
  fileName?: string;
}

interface FaxViewProps {
  faxBoxes?: any[];
  dids?: UserDID[];
  selectedDidId?: string | null;
}

const SAMPLE_FAXES: FaxRecord[] = [
  {
    id: 'fax-101',
    direction: 'outbound',
    recipientOrSender: '+18005559812',
    pages: 3,
    status: 'delivered',
    timestamp: Date.now() - 1000 * 60 * 120,
    fileName: 'Mutual_NDA_Signed.pdf',
  },
  {
    id: 'fax-102',
    direction: 'inbound',
    recipientOrSender: '+14155554321',
    pages: 1,
    status: 'delivered',
    timestamp: Date.now() - 1000 * 60 * 60 * 24,
    fileName: 'Invoice_Confirmation.pdf',
  },
  {
    id: 'fax-103',
    direction: 'outbound',
    recipientOrSender: '+13105557890',
    pages: 2,
    status: 'failed',
    timestamp: Date.now() - 1000 * 60 * 60 * 30,
    fileName: 'Contract_Draft.pdf',
  },
];

const STATUS_STYLES: Record<FaxRecord['status'], string> = {
  delivered: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
  sent: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
  pending: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
  failed: 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300',
};

export const FaxView: React.FC<FaxViewProps> = () => {
  const [faxes, setFaxes] = useState<FaxRecord[]>(SAMPLE_FAXES);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [destinationNumber, setDestinationNumber] = useState('');
  const [coverPageText, setCoverPageText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const resetSendForm = () => {
    setDestinationNumber('');
    setCoverPageText('');
    setSelectedFile(null);
    setIsSendModalOpen(false);
  };

  const handleSendFax = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinationNumber.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const newFax: FaxRecord = {
        id: `fax-${Date.now()}`,
        direction: 'outbound',
        recipientOrSender: destinationNumber,
        pages: 1,
        status: 'pending',
        timestamp: Date.now(),
        fileName: selectedFile?.name || 'Document.pdf',
      };
      setFaxes((prev) => [newFax, ...prev]);
      setIsSubmitting(false);
      resetSendForm();
    }, 800);
  };

  const handleDelete = (id: string) => {
    setFaxes((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="flex flex-col flex-1 w-full min-h-0 select-none animate-fadeIn rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs p-3 sm:p-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Printer className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            Fax
          </h2>
        </div>

        <button
          onClick={() => setIsSendModalOpen(true)}
          title="Send Fax"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send Fax</span>
        </button>
      </div>

      {/* Fax List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        {faxes.length === 0 ? (
          <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center text-zinc-400 text-xs">
            <Printer className="w-10 h-10 mb-2 text-zinc-300 dark:text-zinc-700 stroke-[1.5]" />
            <p className="font-semibold text-zinc-600 dark:text-zinc-300">No faxes found</p>
            <p className="text-zinc-400 text-[11px]">Sent and received faxes will appear here</p>
          </div>
        ) : (
          faxes.map((fax) => (
            <div
              key={fax.id}
              className="group flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-brand-500/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-all shadow-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    fax.direction === 'outbound'
                      ? 'bg-brand-500/10 text-brand-500'
                      : 'bg-emerald-500/10 text-emerald-500'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 truncate">
                      {fax.recipientOrSender}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full uppercase font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 shrink-0">
                      {fax.direction}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                    {fax.fileName} • {fax.pages} page(s) •{' '}
                    {new Date(fax.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-3">
                <span
                  className={`hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[fax.status]}`}
                >
                  {fax.status === 'delivered' || fax.status === 'sent' ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : fax.status === 'failed' ? (
                    <XCircle className="w-3 h-3" />
                  ) : (
                    <Clock className="w-3 h-3" />
                  )}
                  {fax.status}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    title={`View ${fax.fileName}`}
                    className="p-2 rounded-xl text-zinc-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    title={`Download ${fax.fileName}`}
                    className="p-2 rounded-xl text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(fax.id)}
                    title="Delete fax"
                    className="p-2 rounded-xl text-zinc-400 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Send Fax Modal (dummy — to be tuned later) */}
      {isSendModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 rounded-2xl p-4 animate-fadeIn"
          onClick={resetSendForm}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl animate-popIn overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Send className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                Send Fax
              </h3>
              <button
                onClick={resetSendForm}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendFax} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Destination Fax Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +1 (800) 555-0199"
                  value={destinationNumber}
                  onChange={(e) => setDestinationNumber(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Document Attachment (PDF, TIFF, Word)
                </label>
                <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl hover:border-brand-500 transition-colors cursor-pointer bg-zinc-50/50 dark:bg-zinc-800/40">
                  <UploadCloud className="w-7 h-7 text-zinc-400 mb-2" />
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 text-center">
                    {selectedFile ? selectedFile.name : 'Click to select or drag PDF file here'}
                  </span>
                  <span className="text-[10px] text-zinc-400 mt-0.5">Max size: 25MB</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.tiff,.tif"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Cover Page Note (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Notes or instructions to print on the cover sheet..."
                  value={coverPageText}
                  onChange={(e) => setCoverPageText(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={resetSendForm}
                  className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !destinationNumber.trim()}
                  className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Send Fax
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
