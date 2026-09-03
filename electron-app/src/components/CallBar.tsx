import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Pause,
  Play,
  ChevronDown,
  ArrowRightLeft,
  Grid,
  UserPlus,
  Volume2,
  PhoneForwarded,
  Check,
  Headphones,
  X,
} from 'lucide-react';
import { EndCallIcon } from './icons/EndCallIcon';
import { LineSwitcherCall } from './LineSwitcher';
import { playDtmfTone } from '../utils/audio-tones';
import { AudioDevice } from '../types/pjsip';
import { FixedPopover } from './FixedPopover';

interface CallBarProps {
  callId: number;
  remoteUri: string;
  state: string;
  isMuted: boolean;
  isOnHold: boolean;
  onExpand: () => void;
  onHangup: () => void;
  onMuteToggle: () => void;
  onHoldToggle: () => void;
  onSendDtmf?: (digit: string) => void;
  audioDevices?: AudioDevice[];
  currentCaptureDev?: number;
  currentPlaybackDev?: number;
  onSelectAudioDevices?: (captureDev: number, playbackDev: number) => void;
  /** All active lines, for the compact line-switcher dropdown (only shown when 2+ calls). */
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

const lineStatusDotClass = (call: LineSwitcherCall) =>
  call.state === 'DISCONNECTED'
    ? 'bg-rose-500'
    : call.isOnHold
    ? 'bg-amber-400'
    : call.state === 'CONFIRMED'
    ? 'bg-emerald-500 ring-2 ring-emerald-500/30'
    : 'bg-indigo-500';

const DTMF_DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

type Popover = 'lines' | 'transfer' | 'keypad' | 'addCall' | 'audio' | null;

export const CallBar: React.FC<CallBarProps> = ({
  callId,
  remoteUri,
  state,
  isMuted,
  isOnHold,
  onExpand,
  onHangup,
  onMuteToggle,
  onHoldToggle,
  onSendDtmf,
  audioDevices = [],
  currentCaptureDev = -1,
  currentPlaybackDev = -2,
  onSelectAudioDevices,
  calls = [],
  onFocusCall,
}) => {
  const [seconds, setSeconds] = useState(0);
  const [openPopover, setOpenPopover] = useState<Popover>(null);
  const [transferMode, setTransferMode] = useState<'blind' | 'attended'>('blind');
  const [transferNumber, setTransferNumber] = useState('');
  const [addCallNumber, setAddCallNumber] = useState('');

  const barRef = useRef<HTMLDivElement>(null);
  const linesBtnRef = useRef<HTMLButtonElement>(null);
  const transferBtnRef = useRef<HTMLButtonElement>(null);
  const keypadBtnRef = useRef<HTMLButtonElement>(null);
  const addCallBtnRef = useRef<HTMLButtonElement>(null);
  const audioBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let interval: any = null;
    if (state === 'CONFIRMED' && !isOnHold) {
      interval = setInterval(() => setSeconds((prev) => prev + 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state, isOnHold]);

  useEffect(() => {
    if (!openPopover) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenPopover(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openPopover]);

  const togglePopover = (p: Popover) => setOpenPopover((cur) => (cur === p ? null : p));

  const statusLabel = isOnHold
    ? 'On Hold'
    : state === 'CONFIRMED'
    ? formatTimer(seconds)
    : state === 'CALLING'
    ? 'Calling...'
    : state === 'EARLY' || state === 'CONNECTING'
    ? 'Ringing...'
    : state;

  const handleDtmfPress = (digit: string) => {
    playDtmfTone(digit);
    onSendDtmf?.(digit);
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferNumber.trim()) return;
    // Transfer wiring pending backend support — UI only for now.
    setTransferNumber('');
    setOpenPopover(null);
  };

  const handleAddCallSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addCallNumber.trim()) return;
    // Conference/add-call wiring pending backend support — UI only for now.
    setAddCallNumber('');
    setOpenPopover(null);
  };

  const iconBtnClass = (active: boolean, activeClass: string) =>
    `p-2 rounded-xl transition-colors cursor-pointer ${
      active ? activeClass : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
    }`;

  return (
    <div
      ref={barRef}
      className="relative shrink-0 mb-1.5 sm:mb-2 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs overflow-visible"
    >
      <div className="w-full flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 flex-wrap sm:flex-nowrap">
        <button
          onClick={onExpand}
          className="flex items-center gap-2.5 text-left cursor-pointer shrink-0 min-w-0 pr-1"
        >
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isOnHold
                ? 'bg-amber-400'
                : state === 'CONFIRMED'
                ? 'bg-emerald-500 ring-2 ring-emerald-500/30'
                : 'bg-indigo-500'
            }`}
          />
          <span className="min-w-0 max-w-[9rem] sm:max-w-[12rem]">
            <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {parseCaller(remoteUri)}
            </span>
            <span className="block text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">{statusLabel}</span>
          </span>
        </button>

        {calls.length > 1 && (
          <div className="relative shrink-0">
            <button
              ref={linesBtnRef}
              onClick={() => togglePopover('lines')}
              title="Switch line"
              className={`flex items-center gap-1 px-2 py-1.5 rounded-xl text-[11px] font-semibold border transition-colors cursor-pointer ${
                openPopover === 'lines'
                  ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-300'
                  : 'bg-zinc-100 dark:bg-zinc-800/80 border-transparent text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {calls.length} lines
              <ChevronDown className="w-3 h-3" />
            </button>

            {openPopover === 'lines' && (
              <FixedPopover anchorRef={linesBtnRef} align="left" className="w-56 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-2xl overflow-hidden p-1.5">
                {calls.map((call, idx) => {
                  const isFocused = call.callId === callId;
                  return (
                    <button
                      key={call.callId}
                      onClick={() => {
                        onFocusCall?.(call.callId);
                        setOpenPopover(null);
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-[11px] font-medium transition-colors cursor-pointer ${
                        isFocused
                          ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300'
                          : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${lineStatusDotClass(call)}`} />
                      <span className="truncate">
                        Line {idx + 1} — {parseCaller(call.remoteUri)}
                      </span>
                    </button>
                  );
                })}
              </FixedPopover>
            )}
          </div>
        )}

        <div className="flex items-center gap-1 shrink-0 ml-auto">
          <button onClick={onMuteToggle} title={isMuted ? 'Unmute' : 'Mute'} className={iconBtnClass(isMuted, 'bg-rose-600 text-white')}>
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button onClick={onHoldToggle} title={isOnHold ? 'Resume' : 'Hold'} className={iconBtnClass(isOnHold, 'bg-amber-500 text-white')}>
            {isOnHold ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>

          <div className="relative">
            <button
              ref={transferBtnRef}
              onClick={() => togglePopover('transfer')}
              title="Transfer"
              className={iconBtnClass(openPopover === 'transfer', 'bg-brand-600 text-white')}
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>

            {openPopover === 'transfer' && (
              <FixedPopover anchorRef={transferBtnRef} align="right" className="w-64 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-2xl overflow-hidden p-3">
                <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/60 p-0.5 rounded-lg text-xs mb-2.5">
                  <button
                    type="button"
                    onClick={() => setTransferMode('blind')}
                    className={`flex-1 px-2 py-1.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                      transferMode === 'blind'
                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                        : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                    }`}
                  >
                    Blind
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransferMode('attended')}
                    className={`flex-1 px-2 py-1.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                      transferMode === 'attended'
                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                        : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                    }`}
                  >
                    Attended
                  </button>
                </div>

                <form onSubmit={handleTransferSubmit} className="space-y-2">
                  <input
                    type="text"
                    autoFocus
                    required
                    placeholder="Transfer to number..."
                    value={transferNumber}
                    onChange={(e) => setTransferNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                  />
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <PhoneForwarded className="w-3.5 h-3.5" />
                    {transferMode === 'blind' ? 'Transfer Now' : 'Consult & Transfer'}
                  </button>
                </form>
              </FixedPopover>
            )}
          </div>

          <div className="relative">
            <button
              ref={keypadBtnRef}
              onClick={() => togglePopover('keypad')}
              title="Keypad"
              className={iconBtnClass(openPopover === 'keypad', 'bg-brand-600 text-white')}
            >
              <Grid className="w-4 h-4" />
            </button>

            {openPopover === 'keypad' && (
              <FixedPopover anchorRef={keypadBtnRef} align="right" className="w-56 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-2xl overflow-hidden p-3">
                <div className="grid grid-cols-3 gap-1.5">
                  {DTMF_DIGITS.map((d) => (
                    <button
                      key={d}
                      onClick={() => handleDtmfPress(d)}
                      className="h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-brand-600 hover:text-white text-zinc-800 dark:text-zinc-100 font-semibold active:scale-92 tactile-btn text-sm cursor-pointer"
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </FixedPopover>
            )}
          </div>

          <div className="relative">
            <button
              ref={addCallBtnRef}
              onClick={() => togglePopover('addCall')}
              title="Add Call"
              className={iconBtnClass(openPopover === 'addCall', 'bg-brand-600 text-white')}
            >
              <UserPlus className="w-4 h-4" />
            </button>

            {openPopover === 'addCall' && (
              <FixedPopover anchorRef={addCallBtnRef} align="right" className="w-64 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-2xl overflow-hidden p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Add to Call</p>
                  <button
                    type="button"
                    onClick={() => setOpenPopover(null)}
                    className="p-0.5 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <form onSubmit={handleAddCallSubmit} className="space-y-2">
                  <input
                    type="text"
                    autoFocus
                    required
                    placeholder="Number to add..."
                    value={addCallNumber}
                    onChange={(e) => setAddCallNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                  />
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Start Conference
                  </button>
                </form>
              </FixedPopover>
            )}
          </div>

          <div className="relative">
            <button
              ref={audioBtnRef}
              onClick={() => togglePopover('audio')}
              title="Audio"
              className={iconBtnClass(openPopover === 'audio', 'bg-brand-600 text-white')}
            >
              <Volume2 className="w-4 h-4" />
            </button>

            {openPopover === 'audio' && (
              <FixedPopover anchorRef={audioBtnRef} align="right" className="w-64 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-2xl overflow-hidden p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  <Mic className="w-3 h-3" /> Microphone
                </p>
                <div className="space-y-1 mb-3">
                  {audioDevices.filter((d) => d.input_count > 0).length === 0 ? (
                    <p className="text-[11px] text-zinc-400 px-1">No input devices found</p>
                  ) : (
                    audioDevices
                      .filter((d) => d.input_count > 0)
                      .map((d) => (
                        <button
                          key={`mic-${d.id}`}
                          type="button"
                          onClick={() => onSelectAudioDevices?.(d.id, currentPlaybackDev)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-[11px] font-medium transition-colors cursor-pointer ${
                            currentCaptureDev === d.id
                              ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300'
                              : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80'
                          }`}
                        >
                          <span className="truncate">{d.name}</span>
                          {currentCaptureDev === d.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      ))
                  )}
                </div>

                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  <Headphones className="w-3 h-3" /> Speaker
                </p>
                <div className="space-y-1">
                  {audioDevices.filter((d) => d.output_count > 0).length === 0 ? (
                    <p className="text-[11px] text-zinc-400 px-1">No output devices found</p>
                  ) : (
                    audioDevices
                      .filter((d) => d.output_count > 0)
                      .map((d) => (
                        <button
                          key={`spk-${d.id}`}
                          type="button"
                          onClick={() => onSelectAudioDevices?.(currentCaptureDev, d.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-[11px] font-medium transition-colors cursor-pointer ${
                            currentPlaybackDev === d.id
                              ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300'
                              : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80'
                          }`}
                        >
                          <span className="truncate">{d.name}</span>
                          {currentPlaybackDev === d.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      ))
                  )}
                </div>
              </FixedPopover>
            )}
          </div>

          <button
            onClick={onHangup}
            title="End Call"
            className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer"
          >
            <EndCallIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
