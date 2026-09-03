import React, { useEffect, useState } from 'react';
import { AudioDevice } from '../types/pjsip';
import { LineSwitcher, LineSwitcherCall } from './LineSwitcher';
import { CallControls } from './CallControls';

interface InCallPanelProps {
  callId: number;
  remoteUri: string;
  state: string;
  reason?: string;
  lastStatus?: number;
  isMuted: boolean;
  isOnHold: boolean;
  onHangup: (callId: number) => void;
  onMute: (callId: number, mute: boolean) => void;
  onHold: (callId: number, hold: boolean) => void;
  onSendDtmf: (callId: number, digit: string) => void;
  audioDevices?: AudioDevice[];
  currentCaptureDev?: number;
  currentPlaybackDev?: number;
  onSelectAudioDevices?: (captureDev: number, playbackDev: number) => void;
  /** All active lines, for the line-switcher tab row (only shown when 2+ calls). */
  calls?: LineSwitcherCall[];
  onFocusCall?: (callId: number) => void;
}

const parseCaller = (uri: string) => {
  const clean = uri.replace(/^sip:/i, '');
  const atIdx = clean.indexOf('@');
  return atIdx > 0 ? clean.substring(0, atIdx) : clean;
};

const formatTimer = (totalSecs: number) => {
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const InCallPanel: React.FC<InCallPanelProps> = ({
  callId,
  remoteUri,
  state,
  reason,
  lastStatus,
  isMuted,
  isOnHold,
  onHangup,
  onMute,
  onHold,
  onSendDtmf,
  audioDevices = [],
  currentCaptureDev = -1,
  currentPlaybackDev = -2,
  onSelectAudioDevices,
  calls = [],
  onFocusCall,
}) => {
  const [seconds, setSeconds] = useState(0);
  const [showKeypad, setShowKeypad] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (state === 'CONFIRMED' && !isOnHold) {
      interval = setInterval(() => setSeconds((prev) => prev + 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state, isOnHold]);

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

  return (
    <div className="hidden lg:flex flex-1 flex-col rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs min-h-0 overflow-hidden">
      {onFocusCall && calls.length > 1 && (
        <div className="shrink-0 px-6 pt-5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <LineSwitcher calls={calls} focusedCallId={callId} onSelect={onFocusCall} />
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center overflow-y-auto">
        <div className="relative flex items-center justify-center w-24 h-24 mb-4">
          <div className="relative z-10 flex items-center justify-center w-[70px] h-[70px] rounded-full bg-brand-600 text-white text-xl font-bold shadow-xl shadow-brand-500/30">
            {parseCaller(remoteUri).slice(0, 2).toUpperCase()}
          </div>
        </div>

        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          {parseCaller(remoteUri)}
        </h2>

        <div className="mt-3.5 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/60 shadow-xs">
          <span className={`w-2 h-2 rounded-full ${statusDotClass}`} />
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{statusLabel}</span>
        </div>
      </div>

      {/* Circular Call Control Grid */}
      <div className="shrink-0 px-6 py-5 bg-white dark:bg-zinc-900">
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
          showKeypad={showKeypad}
          onToggleKeypad={() => setShowKeypad((prev) => !prev)}
        />
      </div>
    </div>
  );
};
