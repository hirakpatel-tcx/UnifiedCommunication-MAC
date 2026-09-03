import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Phone,
  MessageSquare,
  Clock,
  Search,
  ChevronDown,
  Check,
  Calendar,
} from 'lucide-react';
import { CallRecord } from '../types/pjsip';

interface RecentCallsListProps {
  history: CallRecord[];
  onCall: (destination: string) => void;
  onSelectNumber?: (destination: string) => void;
  onMessage?: (destination: string) => void;
  messagingEnabled?: boolean;
  showSearch?: boolean;
  showFilter?: boolean;
}

type DirectionFilter = 'all' | 'incoming' | 'outgoing';
type DatePreset =
  | 'all'
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_7_days'
  | 'this_month'
  | 'last_3_months'
  | 'custom';

const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  all: 'Any time',
  today: 'Today',
  yesterday: 'Yesterday',
  this_week: 'This week',
  last_7_days: 'Last 7 days',
  this_month: 'This month',
  last_3_months: 'Last 3 months',
  custom: 'Custom range',
};

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const getPresetRange = (preset: DatePreset): { start: number; end: number } | null => {
  const now = new Date();
  const todayStart = startOfDay(now);

  switch (preset) {
    case 'today':
      return { start: todayStart.getTime(), end: Date.now() };
    case 'yesterday': {
      const start = new Date(todayStart);
      start.setDate(start.getDate() - 1);
      return { start: start.getTime(), end: todayStart.getTime() };
    }
    case 'this_week': {
      const start = new Date(todayStart);
      const day = start.getDay();
      start.setDate(start.getDate() - day);
      return { start: start.getTime(), end: Date.now() };
    }
    case 'last_7_days': {
      const start = new Date(todayStart);
      start.setDate(start.getDate() - 7);
      return { start: start.getTime(), end: Date.now() };
    }
    case 'this_month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: start.getTime(), end: Date.now() };
    }
    case 'last_3_months': {
      const start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      return { start: start.getTime(), end: Date.now() };
    }
    default:
      return null;
  }
};

export const RecentCallsList: React.FC<RecentCallsListProps> = ({
  history,
  onCall,
  onSelectNumber,
  onMessage,
  messagingEnabled = false,
  showSearch = true,
  showFilter = true,
}) => {
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'missed'>('all');
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('all');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [isDirectionMenuOpen, setIsDirectionMenuOpen] = useState(false);
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);

  const directionMenuRef = useRef<HTMLDivElement>(null);
  const dateMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDirectionMenuOpen && !isDateMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (directionMenuRef.current && !directionMenuRef.current.contains(e.target as Node)) {
        setIsDirectionMenuOpen(false);
      }
      if (dateMenuRef.current && !dateMenuRef.current.contains(e.target as Node)) {
        setIsDateMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDirectionMenuOpen, isDateMenuOpen]);

  const dateRange = useMemo(() => {
    if (datePreset === 'custom') {
      const start = customStart ? new Date(customStart).getTime() : null;
      const end = customEnd ? new Date(customEnd).getTime() + 24 * 60 * 60 * 1000 - 1 : null;
      if (start === null && end === null) return null;
      return { start: start ?? 0, end: end ?? Date.now() };
    }
    return getPresetRange(datePreset);
  }, [datePreset, customStart, customEnd]);

  const filteredHistory = useMemo(() => {
    let list = history;

    if (statusFilter === 'missed') {
      list = list.filter((h) => h.status === 'missed');
    }

    if (directionFilter === 'incoming') {
      list = list.filter((h) => h.direction === 'inbound');
    } else if (directionFilter === 'outgoing') {
      list = list.filter((h) => h.direction === 'outbound');
    }

    if (dateRange) {
      list = list.filter((h) => h.timestamp >= dateRange.start && h.timestamp <= dateRange.end);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((h) => {
        const cleaned = h.remote_uri.replace(/^sip:/i, '').split('@')[0].toLowerCase();
        const disp = (h.display_name || '').toLowerCase();
        return cleaned.includes(q) || disp.includes(q);
      });
    }

    return list;
  }, [history, statusFilter, directionFilter, dateRange, search]);

  const dateLabel = datePreset === 'custom' && (customStart || customEnd)
    ? `${customStart || '…'} → ${customEnd || '…'}`
    : DATE_PRESET_LABELS[datePreset];

  return (
    <div className="flex flex-col h-full w-full min-h-0">
      {(showSearch || showFilter) && (
        <div className="flex items-center gap-2 shrink-0 mb-2 flex-wrap sm:flex-nowrap">
          {showSearch && (
            <div className="relative flex-1 min-w-[7rem]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -tranzinc-y-1/2 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search call logs..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1.5 focus:ring-brand-500 focus:bg-white dark:focus:bg-zinc-800"
              />
            </div>
          )}

          {showFilter && (
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/60 p-0.5 rounded-lg text-xs shrink-0">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 shadow-2xs'
                      : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('missed')}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    statusFilter === 'missed'
                      ? 'bg-white dark:bg-zinc-700 text-rose-600 dark:text-rose-400 shadow-2xs'
                      : 'text-zinc-500 hover:text-rose-500'
                  }`}
                >
                  Missed
                </button>
              </div>

              {/* Direction Filter */}
              <div className="relative shrink-0" ref={directionMenuRef}>
                <button
                  onClick={() => {
                    setIsDirectionMenuOpen((v) => !v);
                    setIsDateMenuOpen(false);
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                    directionFilter !== 'all'
                      ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-500/30 text-brand-700 dark:text-brand-300'
                      : 'bg-zinc-100 dark:bg-zinc-800/60 border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  {directionFilter === 'incoming' ? (
                    <ArrowDownLeft className="w-3 h-3" />
                  ) : directionFilter === 'outgoing' ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : null}
                  <span>
                    {directionFilter === 'all' ? 'Direction' : directionFilter === 'incoming' ? 'Incoming' : 'Outgoing'}
                  </span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {isDirectionMenuOpen && (
                  <div className="absolute top-full mt-1 left-0 z-30 w-36 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-xl overflow-hidden animate-popIn p-1">
                    {(['all', 'incoming', 'outgoing'] as DirectionFilter[]).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setDirectionFilter(opt);
                          setIsDirectionMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-[11px] font-medium transition-colors cursor-pointer ${
                          directionFilter === opt
                            ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300'
                            : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80'
                        }`}
                      >
                        <span className="capitalize">{opt === 'all' ? 'All calls' : opt}</span>
                        {directionFilter === opt && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Date Filter */}
              <div className="relative shrink-0" ref={dateMenuRef}>
                <button
                  onClick={() => {
                    setIsDateMenuOpen((v) => !v);
                    setIsDirectionMenuOpen(false);
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                    datePreset !== 'all'
                      ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-500/30 text-brand-700 dark:text-brand-300'
                      : 'bg-zinc-100 dark:bg-zinc-800/60 border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  <Calendar className="w-3 h-3" />
                  <span className="max-w-[9rem] truncate">{dateLabel}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {isDateMenuOpen && (
                  <div className="absolute top-full mt-1 right-0 z-30 w-56 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-xl overflow-hidden animate-popIn p-1">
                    {(Object.keys(DATE_PRESET_LABELS) as DatePreset[])
                      .filter((p) => p !== 'custom')
                      .map((opt) => (
                        <button
                          key={opt}
                          onClick={() => {
                            setDatePreset(opt);
                            setIsDateMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-[11px] font-medium transition-colors cursor-pointer ${
                            datePreset === opt
                              ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300'
                              : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80'
                          }`}
                        >
                          <span>{DATE_PRESET_LABELS[opt]}</span>
                          {datePreset === opt && <Check className="w-3.5 h-3.5" />}
                        </button>
                      ))}

                    <div className="border-t border-zinc-100 dark:border-zinc-800 mt-1 pt-1.5 px-1.5 pb-1.5">
                      <p
                        className={`text-[11px] font-medium mb-1.5 ${
                          datePreset === 'custom' ? 'text-brand-700 dark:text-brand-300' : 'text-zinc-500 dark:text-zinc-400'
                        }`}
                      >
                        Custom range
                      </p>
                      <div className="flex flex-col gap-1.5">
                        <input
                          type="date"
                          value={customStart}
                          onChange={(e) => {
                            setCustomStart(e.target.value);
                            setDatePreset('custom');
                          }}
                          className="w-full px-2 py-1 text-[11px] rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                        <input
                          type="date"
                          value={customEnd}
                          onChange={(e) => {
                            setCustomEnd(e.target.value);
                            setDatePreset('custom');
                          }}
                          className="w-full px-2 py-1 text-[11px] rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/80 min-h-0">
        {filteredHistory.length === 0 ? (
          <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center text-zinc-400 text-xs">
            <Clock className="w-10 h-10 mb-2 text-zinc-300 dark:text-zinc-700 stroke-[1.5]" />
            <p className="font-semibold text-zinc-600 dark:text-zinc-300">No call records found</p>
            <p className="text-zinc-400 text-[11px]">Completed and missed calls will appear here</p>
          </div>
        ) : (
          filteredHistory.map((item) => {
            const num = item.remote_uri.replace(/^sip:/i, '').split('@')[0];
            const isMissed = item.status === 'missed';
            const isOutbound = item.direction === 'outbound';

            return (
              <div
                key={item.id}
                className="py-2.5 px-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/60 rounded-xl transition-colors group"
              >
                <button
                  onClick={() => (onSelectNumber || onCall)(num)}
                  title="Click to populate dialer"
                  className="flex items-center gap-3 min-w-0 text-left flex-1 cursor-pointer"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isMissed
                        ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                        : isOutbound
                        ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
                        : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    }`}
                  >
                    {isOutbound ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">
                        {item.display_name || num}
                      </p>
                      {item.display_name && (
                        <span className="text-[11px] font-mono text-zinc-400 hidden sm:inline">
                          ({num})
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                      <span>
                        {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })} at{' '}
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {item.duration > 0 && <span>• {item.duration}s</span>}
                      <span className="capitalize text-[10px] px-1.5 py-0.2 rounded-md bg-zinc-100 dark:bg-zinc-800 font-medium">
                        {item.status}
                      </span>
                    </p>
                  </div>
                </button>

                <div className="flex items-center gap-1.5 shrink-0 ml-3">
                  {messagingEnabled && (
                    <button
                      onClick={() => onMessage?.(num)}
                      title={`Message ${num}`}
                      className="p-2 rounded-xl text-zinc-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onCall(num)}
                    title={`Call ${num}`}
                    className="p-2 rounded-xl text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
