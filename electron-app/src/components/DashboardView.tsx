import React from 'react';
import {
  Phone,
  Clock,
  Voicemail,
  PhoneCall,
  Activity,
  ShieldCheck,
  Hash,
  Globe,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { AuthUser, UserDID } from '../types/auth';
import { CallRecord, SipAccountConfig } from '../types/pjsip';

interface DashboardViewProps {
  user: AuthUser;
  account: SipAccountConfig | null;
  isRegistered: boolean;
  registrationStatus: string;
  history: CallRecord[];
  dids: UserDID[];
  selectedDidId: string | null;
  onNavigateTab: (tab: any) => void;
  onCall: (destination: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  account,
  isRegistered,
  registrationStatus,
  history,
  dids,
  selectedDidId,
  onNavigateTab,
  onCall,
}) => {
  const activeDid = dids.find((d) => d.id === selectedDidId) || dids[0];
  const totalCalls = history.length;
  const missedCalls = history.filter((h) => h.status === 'missed').length;
  const connectedCalls = history.filter((h) => h.status === 'connected').length;

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto p-4 md:p-6 overflow-y-auto space-y-6 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 to-indigo-600 p-6 md:p-8 text-white shadow-xl shadow-brand-600/15">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold mb-2">
              <span className={`w-2 h-2 rounded-full ${isRegistered ? 'bg-emerald-400' : 'bg-amber-300'}`} />
              {isRegistered ? 'Line Ready & Registered' : registrationStatus}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Welcome back, {user.email.split('@')[0]}
            </h1>
            <p className="text-white/80 text-sm mt-1">
              Tenant: <span className="font-semibold text-white">{user.tenant?.tenant_name || user.tenant?.tenant_code}</span> | Ext: <span className="font-semibold text-white">{user.extension?.extension_number}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateTab('keypad')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-brand-600 font-semibold text-sm hover:bg-slate-50 active:scale-95 transition-all shadow-md cursor-pointer"
            >
              <PhoneCall className="w-4 h-4" />
              Start Call
            </button>
            <button
              onClick={() => onNavigateTab('recents')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-all border border-white/20 cursor-pointer"
            >
              <Clock className="w-4 h-4" />
              History
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total Recent Calls</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalCalls}</h3>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Connected</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{connectedCalls}</h3>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
            <Phone className="w-6 h-6 rotate-135" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Missed</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{missedCalls}</h3>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Voicemail className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Voicemail Boxes</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {user.voicemail_boxes?.length || 0}
            </h3>
          </div>
        </div>
      </div>

      {/* Account Info & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line & Extension Details */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              Line Configuration
            </h3>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {account?.transport?.toUpperCase() || 'TLS'}
            </span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5" /> Extension
              </span>
              <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">
                {user.extension?.extension_number || '101'}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> SIP Username
              </span>
              <span className="font-mono text-slate-800 dark:text-slate-200">
                {user.extension?.sip_username || account?.username || '-'}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-500 dark:text-slate-400">Outbound Caller ID</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {activeDid ? `${activeDid.number} (${activeDid.name || 'Default'})` : 'Default'}
              </span>
            </div>

            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 dark:text-slate-400">PBX Domain / Gateway</span>
              <span className="font-mono text-xs text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                {account?.server || user.tenant?.sip_domain || 'pbx.local'}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Call Activity */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                Latest Call Activity
              </h3>
              <button
                onClick={() => onNavigateTab('recents')}
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                View all <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No recent calls recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {history.slice(0, 4).map((record) => {
                  const cleaned = record.remote_uri.replace(/^sip:/i, '').split('@')[0];
                  return (
                    <div
                      key={record.id}
                      className="py-2.5 flex items-center justify-between text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 px-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            record.status === 'missed'
                              ? 'bg-rose-500/10 text-rose-500'
                              : 'bg-emerald-500/10 text-emerald-500'
                          }`}
                        >
                          <Phone className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs font-mono">
                            {cleaned}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {new Date(record.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => onCall(cleaned)}
                        title="Redial"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <PhoneCall className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              onClick={() => onNavigateTab('keypad')}
              className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              Open Dialer Keypad
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
