import React, { useEffect, useRef, useState } from 'react';
import {
  Voicemail,
  Play,
  Pause,
  Trash2,
  PhoneCall,
  Search,
  Volume2,
  ChevronDown,
  Check,
} from 'lucide-react';

interface VoicemailItem {
  id: string;
  caller: string;
  callerName?: string;
  duration: number; // in seconds
  timestamp: number;
  isRead: boolean;
  audioUrl?: string;
}

interface VoicemailViewProps {
  onCall: (destination: string) => void;
  voicemailBoxes?: any[];
}

const SAMPLE_VOICEMAILS: VoicemailItem[] = [
  {
    id: 'vm-1',
    caller: '+18332715337',
    callerName: 'Client Support Line',
    duration: 42,
    timestamp: Date.now() - 1000 * 60 * 24, // 24 mins ago
    isRead: false,
  },
  {
    id: 'vm-2',
    caller: '102',
    callerName: 'Alex Johnson',
    duration: 18,
    timestamp: Date.now() - 1000 * 60 * 180, // 3 hours ago
    isRead: true,
  },
];

type ReadFilter = 'all' | 'unread' | 'read';

const READ_FILTER_LABELS: Record<ReadFilter, string> = {
  all: 'All',
  unread: 'Unread',
  read: 'Read',
};

export const VoicemailView: React.FC<VoicemailViewProps> = ({ onCall }) => {
  const [voicemails, setVoicemails] = useState<VoicemailItem[]>(SAMPLE_VOICEMAILS);
  const [searchQuery, setSearchQuery] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isFilterOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFilterOpen]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const togglePlay = (id: string) => {
    if (playingId === id) {
      setPlayingId(null);
    } else {
      setPlayingId(id);
      // mark as read
      setVoicemails((prev) =>
        prev.map((vm) => (vm.id === id ? { ...vm, isRead: true } : vm))
      );
    }
  };

  const handleDelete = (id: string) => {
    if (playingId === id) setPlayingId(null);
    setVoicemails((prev) => prev.filter((vm) => vm.id !== id));
  };

  const filtered = voicemails.filter((vm) => {
    if (readFilter === 'unread' && vm.isRead) return false;
    if (readFilter === 'read' && !vm.isRead) return false;
    const q = searchQuery.toLowerCase();
    return (
      vm.caller.toLowerCase().includes(q) ||
      (vm.callerName && vm.callerName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex flex-col flex-1 w-full min-h-0 overflow-hidden animate-fadeIn rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs p-3 sm:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-zinc-100 dark:border-zinc-800 gap-3">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Voicemail className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            Voicemail Inbox
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search voicemails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-zinc-800 dark:text-zinc-200 w-full sm:w-56"
            />
          </div>

          {/* Read / Unread Filter */}
          <div className="relative shrink-0" ref={filterRef}>
            <button
              onClick={() => setIsFilterOpen((v) => !v)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                readFilter !== 'all'
                  ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-300'
                  : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {READ_FILTER_LABELS[readFilter]}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {isFilterOpen && (
              <div className="absolute top-full mt-1 right-0 z-30 w-32 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-2xl overflow-hidden animate-popIn p-1">
                {(Object.keys(READ_FILTER_LABELS) as ReadFilter[]).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setReadFilter(opt);
                      setIsFilterOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs font-medium transition-colors cursor-pointer ${
                      readFilter === opt
                        ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300'
                        : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80'
                    }`}
                  >
                    <span>{READ_FILTER_LABELS[opt]}</span>
                    {readFilter === opt && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Voicemails List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {filtered.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-zinc-400">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 flex items-center justify-center mb-3">
              <Voicemail className="w-6 h-6 text-zinc-400" />
            </div>
            <p className="text-sm font-medium">No voicemails found</p>
            <p className="text-xs text-zinc-500 mt-1">
              New audio messages left by callers will appear here.
            </p>
          </div>
        ) : (
          filtered.map((vm) => {
            const isPlaying = playingId === vm.id;
            return (
              <div
                key={vm.id}
                className={`p-4 rounded-2xl border transition-all ${
                  !vm.isRead
                    ? 'bg-brand-50/40 dark:bg-brand-950/20 border-brand-200 dark:border-brand-900/40'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                } shadow-xs`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => togglePlay(vm.id)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer ${
                        isPlaying
                          ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                          {vm.callerName || vm.caller}
                        </span>
                        {!vm.isRead && (
                          <span className="w-2 h-2 rounded-full bg-brand-600 dark:bg-brand-400 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                        <span className="font-mono">{vm.caller}</span>
                        <span>•</span>
                        <span>{formatDuration(vm.duration)}</span>
                        <span>•</span>
                        <span>
                          {new Date(vm.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onCall(vm.caller)}
                      title="Call back"
                      className="p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-brand-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <PhoneCall className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(vm.id)}
                      title="Delete"
                      className="p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Audio Waveform / Progress Bar Simulation */}
                {isPlaying && (
                  <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
                    <Volume2 className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                    <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-600 dark:bg-brand-500 animate-pulse w-3/4 rounded-full" />
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">
                      0:28 / {formatDuration(vm.duration)}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
