import React from 'react';

export interface LineSwitcherCall {
  callId: number;
  remoteUri: string;
  state: string;
  isOnHold: boolean;
}

interface LineSwitcherProps {
  calls: LineSwitcherCall[];
  focusedCallId: number | null;
  onSelect: (callId: number) => void;
}

const parseCaller = (uri: string) => {
  const clean = uri.replace(/^sip:/i, '');
  const atIdx = clean.indexOf('@');
  return atIdx > 0 ? clean.substring(0, atIdx) : clean;
};

const lineStatusDotClass = (call: LineSwitcherCall) =>
  call.state === 'DISCONNECTED'
    ? 'bg-rose-500'
    : call.isOnHold
    ? 'bg-amber-400'
    : call.state === 'CONFIRMED'
    ? 'bg-emerald-500 ring-2 ring-emerald-500/30'
    : 'bg-indigo-500';

// Horizontal row of small pill tabs, one per active call ("line"), so the user can
// switch which call is front-and-center. Only meaningful with 2+ concurrent calls.
export const LineSwitcher: React.FC<LineSwitcherProps> = ({ calls, focusedCallId, onSelect }) => {
  if (calls.length <= 1) return null;

  return (
    <div className="w-full flex items-center justify-center gap-1.5 flex-wrap">
      {calls.map((call, idx) => {
        const isFocused = call.callId === focusedCallId;
        return (
          <button
            key={call.callId}
            onClick={() => onSelect(call.callId)}
            title={parseCaller(call.remoteUri)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer max-w-[9.5rem] ${
              isFocused
                ? 'bg-brand-50 dark:bg-brand-950/50 border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-300'
                : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 opacity-80'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${lineStatusDotClass(call)}`} />
            <span className="truncate">
              Line {idx + 1} — {parseCaller(call.remoteUri)}
            </span>
          </button>
        );
      })}
    </div>
  );
};
