import React, { useState, useEffect } from 'react';
import { MicOff, Volume2, ChevronDown } from 'lucide-react';
import { LineSwitcher, LineSwitcherCall } from './LineSwitcher';
import { CallControls } from './CallControls';
import { AudioDevice } from '../types/pjsip';

interface ActiveCallProps {
  callId: number;
  remoteUri: string;
  state: string;
  reason?: string;
  lastStatus?: number;
  onHangup: (callId: number) => void;
  onMute: (callId: number, mute: boolean) => void;
  onHold: (callId: number, hold: boolean) => void;
  onSendDtmf: (callId: number, digit: string) => void;
  audioDevices?: AudioDevice[];
  currentCaptureDev?: number;
  currentPlaybackDev?: number;
  onSelectAudioDevices?: (captureDev: number, playbackDev: number) => void;
  onCollapse?: () => void;
  isMuted: boolean;
  isOnHold: boolean;
  /** All active lines, for the line-switcher tab row (only shown when 2+ calls). */
  calls?: LineSwitcherCall[];
  onFocusCall?: (callId: number) => void;
}

export const ActiveCall: React.FC<ActiveCallProps> = ({
  callId,
  remoteUri,
  state,
  reason,
  lastStatus,
  onHangup,
  onMute,
  onHold,
  onSendDtmf,
  audioDevices,
  currentCaptureDev,
  currentPlaybackDev,
  onSelectAudioDevices,
  onCollapse,
  isMuted,
  isOnHold,
  calls = [],
  onFocusCall,
}) => {
  const [seconds, setSeconds] = useState<number>(0);
  const [showKeypad, setShowKeypad] = useState<boolean>(false);

  // Timer counter starts when call reaches CONFIRMED state
  useEffect(() => {
    let interval: any = null;
    if (state === 'CONFIRMED' && !isOnHold) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state, isOnHold]);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Extract display name or number from SIP URI
  const parseCaller = (uri: string) => {
    const clean = uri.replace(/^sip:/i, '');
    const atIdx = clean.indexOf('@');
    return atIdx > 0 ? clean.substring(0, atIdx) : clean;
  };

  const statusLabel =
    state === 'DISCONNECTED'
      ? reason || (lastStatus ? `Ended (${lastStatus})` : 'Call Ended')
      : isOnHold
      ? 'On Hold'
      : state === 'CONFIRMED'
      ? formatTimer(seconds)
      : state === 'CALLING'
      ? 'Calling...'
      : state === 'EARLY' || state === 'CONNECTING'
      ? 'Ringing...'
      : state;

  const statusDotClass =
    state === 'DISCONNECTED'
      ? 'bg-rose-500'
      : isOnHold
      ? 'bg-amber-400'
      : state === 'CONFIRMED'
      ? 'bg-emerald-500 ring-2 ring-emerald-500/30'
      : 'bg-indigo-500';

  const renderControls = (compact: boolean) => (
    <CallControls
      callId={callId}
      isMuted={isMuted}
      isOnHold={isOnHold}
      onHangup={onHangup}
      onMute={onMute}
      onHold={onHold}
      onSendDtmf={onSendDtmf}
      audioDevices={audioDevices}
      currentCaptureDev={currentCaptureDev}
      currentPlaybackDev={currentPlaybackDev}
      onSelectAudioDevices={onSelectAudioDevices}
      layout="grid"
      compact={compact}
      showKeypad={showKeypad}
      onToggleKeypad={() => setShowKeypad((prev) => !prev)}
    />
  );

  return (
    <div className="flex-1 flex items-stretch justify-center w-full h-full p-3 sm:p-4 select-none animate-fadeIn min-h-0 overflow-hidden">
      {/* Compact layout: single card filling available space (used at any width below lg) */}
      <div className="w-full max-w-md lg:hidden rounded-3xl bg-white dark:bg-[#151B28] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col text-center transition-all relative overflow-hidden">
        {onCollapse && (
          <button
            onClick={onCollapse}
            title="Minimize"
            className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer z-10"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        )}

        {onFocusCall && calls.length > 1 && (
          <div className="w-full px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <LineSwitcher calls={calls} focusedCallId={callId} onSelect={onFocusCall} />
          </div>
        )}

        <div className="flex-1 min-h-0 w-full px-5 sm:px-8 py-4 sm:py-6 flex flex-col items-center justify-between overflow-y-auto">
        <div className="flex flex-col items-center">
        <div className="relative flex items-center justify-center w-16 h-16 sm:w-32 sm:h-32 mb-3">
          <div className="relative z-10 flex items-center justify-center w-12 h-12 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-xl shadow-brand-500/30">
            <Volume2 className="w-5 h-5 sm:w-10 sm:h-10" />
          </div>
        </div>

        <h2 className="text-lg sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          {parseCaller(remoteUri)}
        </h2>

        <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 shadow-xs">
          <span className={`w-2 h-2 rounded-full ${statusDotClass}`} />
          <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">{statusLabel}</span>
        </div>
        </div>

        <div className="w-full shrink-0 mt-4">{renderControls(true)}</div>
        </div>
      </div>

      {/* Large layout: side-by-side info + controls (lg and up) */}
      <div className="hidden lg:flex flex-col w-full max-w-4xl rounded-3xl bg-white dark:bg-[#151B28] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative">
        {onCollapse && (
          <button
            onClick={onCollapse}
            title="Minimize"
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer z-10"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        )}

        {onFocusCall && calls.length > 1 && (
          <div className="w-full px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <LineSwitcher calls={calls} focusedCallId={callId} onSelect={onFocusCall} />
          </div>
        )}

        <div className="flex-1 flex">
        {/* Left: Caller info */}
        <div className="w-1/2 p-10 flex flex-col items-center justify-center text-center border-r border-slate-200 dark:border-slate-800">
          {isMuted && (
            <div className="w-full mb-3 py-1 px-3 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center justify-center gap-1.5 animate-fadeIn">
              <MicOff className="w-3.5 h-3.5" />
              <span>Microphone is muted</span>
            </div>
          )}

          <div className="relative flex items-center justify-center w-36 h-36 mb-5">
            <div className="relative z-10 flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-xl shadow-brand-500/30">
              <Volume2 className="w-12 h-12" />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {parseCaller(remoteUri)}
          </h2>

          <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 shadow-xs">
            <span className={`w-2 h-2 rounded-full ${statusDotClass}`} />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{statusLabel}</span>
          </div>
        </div>

        {/* Right: Controls (same grid layout as the InCallPanel) */}
        <div className="w-1/2 p-10 flex flex-col items-center justify-center">
          {renderControls(false)}
        </div>
        </div>
      </div>
    </div>
  );
};
