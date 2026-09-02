import React, { useState } from 'react';
import {
  Phone,
  Clock,
  Voicemail,
  PhoneCall,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Users,
  Search,
  Volume2,
  PhoneForwarded,
  Sparkles,
} from 'lucide-react';
import { AuthUser, UserDID } from '../types/auth';
import { CallRecord, Contact, SipAccountConfig } from '../types/pjsip';

interface DashboardViewProps {
  user: AuthUser;
  account: SipAccountConfig | null;
  isRegistered: boolean;
  registrationStatus: string;
  history: CallRecord[];
  contacts?: Contact[];
  dids: UserDID[];
  selectedDidId: string | null;
  onNavigateTab: (tab: any) => void;
  onCall: (destination: string) => void;
  onOpenSettings?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  isRegistered,
  registrationStatus,
  history,
  contacts = [],
  dids,
  selectedDidId,
  onNavigateTab,
  onCall,
  onOpenSettings,
}) => {
  const [directorySearch, setDirectorySearch] = useState<string>('');
  const activeDid = dids.find((d) => d.id === selectedDidId) || dids[0];
  const totalCalls = history.length;
  const missedCalls = history.filter((h) => h.status === 'missed').length;
  const connectedCalls = history.filter((h) => h.status === 'connected').length;

  const filteredContacts = contacts.filter((c) => {
    if (!directorySearch.trim()) return true;
    const q = directorySearch.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.number.toLowerCase().includes(q) ||
      (c.company && c.company.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex flex-col h-full w-full mx-auto p-1 sm:p-2 md:p-3 overflow-y-auto space-y-3 sm:space-y-4 animate-fadeIn">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-brand-600 to-indigo-700 p-3.5 sm:p-4 md:p-5 text-white shadow-md shadow-indigo-600/15 shrink-0">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/20 backdrop-blur-md text-[10px] sm:text-[11px] font-medium text-white/95">
              <span
                className={`w-2 h-2 rounded-full ${
                  isRegistered ? 'bg-emerald-400 ring-2 ring-emerald-400/40' : 'bg-amber-300 ring-2 ring-amber-300/40'
                }`}
              />
              <span>
                {isRegistered
                  ? 'Line Active & Registered'
                  : registrationStatus.toLowerCase().includes('reg') && !registrationStatus.toLowerCase().includes('unreg')
                  ? 'Registering...'
                  : 'Unregistered'}
              </span>
              <span className="text-white/40">•</span>
              <span className="font-mono font-semibold text-white">
                Ext {user.extension?.extension_number || '101'}
              </span>
            </div>

            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-tight">
              Welcome back, {user.email.split('@')[0]}
            </h1>
            <p className="text-indigo-100/85 text-[11px] sm:text-xs">
              Tenant: <span className="font-semibold text-white">{user.tenant?.tenant_name || user.tenant?.tenant_code}</span> | Caller ID: <span className="font-mono font-semibold text-white">{activeDid?.number || 'Default'}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigateTab('keypad')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 active:scale-95 font-semibold text-xs transition-all shadow-sm cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5 text-indigo-600" />
              Open Keypad
            </button>
            <button
              onClick={() => onNavigateTab('recents')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-medium text-xs transition-all border border-white/20 cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              History
            </button>
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-medium text-xs transition-all border border-white/20 cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                Audio
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards Row (Balanced 4 Column) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 shrink-0">
        <div className="p-3 sm:p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">Total Calls</p>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 leading-none">{totalCalls}</h3>
          </div>
        </div>

        <div className="p-3 sm:p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Activity className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">Connected</p>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 leading-none">{connectedCalls}</h3>
          </div>
        </div>

        <div className="p-3 sm:p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Phone className="w-4.5 h-4.5 rotate-135" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">Missed Calls</p>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 leading-none">{missedCalls}</h3>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('voicemail')}
          className="group p-3 sm:p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-2 hover:border-amber-400/60 dark:hover:border-amber-500/40 hover:shadow-xs transition-all cursor-pointer text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Voicemail className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">Voicemails</p>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 leading-none">
                {user.voicemail_boxes?.length || 0}
              </h3>
            </div>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
        </button>
      </div>

      {/* Balanced 2-Column Grid (Call Logs + Quick Directory with Search) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 flex-1 items-stretch min-h-0">
        
        {/* Left Column: Recent Call Activity */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                  Recent Call Logs
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('recents')}
                className="text-[11px] sm:text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                View all ({history.length}) <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
                <Clock className="w-8 h-8 stroke-[1.5] text-slate-300 dark:text-slate-700 mb-1.5" />
                <p className="text-xs font-medium">No recent calls recorded yet</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Calls will appear here automatically</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {history.slice(0, 5).map((record) => {
                  const cleaned = record.remote_uri.replace(/^sip:/i, '').split('@')[0];
                  return (
                    <div
                      key={record.id}
                      className="py-1.5 sm:py-2 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50 px-1.5 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            record.status === 'missed'
                              ? 'bg-rose-500/10 text-rose-500'
                              : 'bg-emerald-500/10 text-emerald-500'
                          }`}
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 font-mono text-xs truncate">
                            {cleaned}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {new Date(record.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {record.duration ? ` • ${record.duration}s` : ''}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => onCall(cleaned)}
                        title="Redial"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <PhoneForwarded className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 mt-2">
            <button
              onClick={() => onNavigateTab('keypad')}
              className="w-full py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <PhoneCall className="w-3 h-3" />
              Open Dialer Keypad
            </button>
          </div>
        </div>

        {/* Right Column: Quick Directory with Built-In Search */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                  Quick Directory
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('contacts')}
                className="text-[11px] sm:text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                All Contacts ({contacts.length}) <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            {/* Quick Directory Search Bar */}
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={directorySearch}
                onChange={(e) => setDirectorySearch(e.target.value)}
                placeholder="Search contacts..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1.5 focus:ring-brand-500"
              />
            </div>

            {filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
                <Users className="w-8 h-8 stroke-[1.5] text-slate-300 dark:text-slate-700 mb-1.5" />
                <p className="text-xs font-medium">No contacts match "{directorySearch}"</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredContacts.slice(0, 5).map((c) => (
                  <div
                    key={c.id}
                    className="py-1.5 sm:py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 px-1.5 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 font-bold text-[11px] flex items-center justify-center shrink-0">
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {c.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">
                          {c.number} {c.company ? `• ${c.company}` : ''}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => onCall(c.number)}
                      title={`Call ${c.name}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer shrink-0"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 mt-2">
            <button
              onClick={() => onNavigateTab('contacts')}
              className="w-full py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3 h-3" />
              Manage All Contacts
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
