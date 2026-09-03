import React from 'react';
import { CallRecord } from '../types/pjsip';
import { RecentCallsList } from './RecentCallsList';

interface CallHistoryProps {
  history: CallRecord[];
  onCall: (destination: string) => void;
  onClearHistory: () => void;
}

export const CallHistory: React.FC<CallHistoryProps> = ({
  history,
  onCall,
}) => {
  return (
    <div className="flex flex-col flex-1 w-full min-h-0 select-none animate-fadeIn rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs p-3 sm:p-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Recents</h2>
        </div>
      </div>

      <RecentCallsList history={history} onCall={onCall} />
    </div>
  );
};
