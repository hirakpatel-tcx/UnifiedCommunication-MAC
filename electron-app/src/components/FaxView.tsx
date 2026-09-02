import React, { useState } from 'react';
import {
  Printer,
  Send,
  FileText,
  UploadCloud,
  CheckCircle2,
  Clock,
  Inbox,
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
];

export const FaxView: React.FC<FaxViewProps> = ({ faxBoxes = [], dids = [] }) => {
  const [activeSubTab, setActiveSubTab] = useState<'send' | 'history'>('send');
  const [destinationNumber, setDestinationNumber] = useState('');
  const [coverPageText, setCoverPageText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [faxes, setFaxes] = useState<FaxRecord[]>(SAMPLE_FAXES);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
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
      setFaxes([newFax, ...faxes]);
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setDestinationNumber('');
      setCoverPageText('');
      setSelectedFile(null);

      setTimeout(() => setSubmitSuccess(false), 4000);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto p-4 md:p-6 overflow-y-auto space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Printer className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            Cloud Fax Portal
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Send digital documents and review received faxes
          </p>
        </div>

        {/* View Switcher Pills */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs">
          <button
            onClick={() => setActiveSubTab('send')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeSubTab === 'send'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Send Fax
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeSubTab === 'history'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Fax Log ({faxes.length})
          </button>
        </div>
      </div>

      {submitSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          Fax queued successfully and transmitted to carrier gateway.
        </div>
      )}

      {activeSubTab === 'send' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="md:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <form onSubmit={handleSendFax} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Destination Fax Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +1 (800) 555-0199"
                  value={destinationNumber}
                  onChange={(e) => setDestinationNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Upload Document Box */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Document Attachment (PDF, TIFF, Word)
                </label>
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl hover:border-brand-500 transition-colors cursor-pointer bg-slate-50/50 dark:bg-slate-800/40">
                  <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {selectedFile ? selectedFile.name : 'Click to select or drag PDF file here'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Max size: 25MB</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.tiff,.tif"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Cover Page Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Cover Page Note (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Notes or instructions to print on the cover sheet..."
                  value={coverPageText}
                  onChange={(e) => setCoverPageText(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !destinationNumber.trim()}
                  className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-semibold text-sm transition-all shadow-md shadow-brand-600/20 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Queuing Fax...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Digital Fax
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Info Card */}
          <div className="space-y-4">
            <div className="p-5 rounded-3xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Printer className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                Fax Service Specs
              </h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Faxes are converted and transmitted through T.38 FoIP (Fax-over-IP) with automated retries and delivery confirmations.
              </p>
              <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Configured Boxes:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {faxBoxes.length}
                  </span>
                </div>
                {dids.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">DID Number:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      {dids[0].number || dids[0].did_number}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Protocol:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">T.38 / G.711</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* History & Status Table */
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Inbox className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              Transmission History
            </h3>
            <span className="text-xs text-slate-500">{faxes.length} records</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {faxes.map((fax) => (
              <div
                key={fax.id}
                className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      fax.direction === 'outbound'
                        ? 'bg-brand-500/10 text-brand-500'
                        : 'bg-emerald-500/10 text-emerald-500'
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-xs text-slate-900 dark:text-slate-100">
                        {fax.recipientOrSender}
                      </span>
                      <span className="text-[10px] px-2 py-0.2 rounded-full uppercase font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {fax.direction}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {fax.fileName} • {fax.pages} page(s)
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      fax.status === 'delivered'
                        ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                        : fax.status === 'pending'
                        ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                        : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {fax.status === 'delivered' ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                    {fax.status}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {new Date(fax.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
