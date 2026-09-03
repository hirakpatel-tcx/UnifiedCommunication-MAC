import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Pause,
  Play,
  Grid,
  Volume2,
  ArrowRightLeft,
  UserPlus,
  X,
  PhoneForwarded,
  Check,
  Headphones,
} from 'lucide-react';
import { playDtmfTone } from '../utils/audio-tones';
import { AudioDevice } from '../types/pjsip';
import { EndCallIcon } from './icons/EndCallIcon';

export interface CallControlsProps {
  callId: number;
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
  /** 'grid' = circular 3x3-style grid (InCallPanel). 'row' = single horizontal row (ActiveCall). */
  layout?: 'grid' | 'row';
  /** Shrinks button size/gaps/keypad for space-constrained screens (e.g. minimized ActiveCall). */
  compact?: boolean;
  /** Externally controlled keypad visibility, so the caller can render the DTMF pad inline above the controls. */
  showKeypad: boolean;
  onToggleKeypad: () => void;
}

const DTMF_DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

const ACTIVE_COLOR_CLASSES = {
  brand: 'bg-brand-600 text-white shadow-md shadow-brand-600/25 ring-2 ring-brand-500/30',
  amber: 'bg-amber-500 text-white shadow-md shadow-amber-500/25 ring-2 ring-amber-500/30',
  rose: 'bg-rose-600 text-white shadow-md shadow-rose-600/25 ring-2 ring-rose-500/30',
} as const;

export const CallControls: React.FC<CallControlsProps> = ({
  callId,
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
  layout = 'grid',
  compact = false,
  showKeypad,
  onToggleKeypad,
}) => {
  const [isTransferMenuOpen, setIsTransferMenuOpen] = useState(false);
  const [isAddCallOpen, setIsAddCallOpen] = useState(false);
  const [isAudioMenuOpen, setIsAudioMenuOpen] = useState(false);
  const [transferMode, setTransferMode] = useState<'blind' | 'attended'>('blind');
  const [transferNumber, setTransferNumber] = useState('');
  const [addCallNumber, setAddCallNumber] = useState('');

  const transferMenuRef = useRef<HTMLDivElement>(null);
  const audioMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isTransferMenuOpen && !isAudioMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (transferMenuRef.current && !transferMenuRef.current.contains(e.target as Node)) {
        setIsTransferMenuOpen(false);
      }
      if (audioMenuRef.current && !audioMenuRef.current.contains(e.target as Node)) {
        setIsAudioMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isTransferMenuOpen, isAudioMenuOpen]);

  const handleDtmfPress = (digit: string) => {
    playDtmfTone(digit);
    onSendDtmf(callId, digit);
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferNumber.trim()) return;
    // Transfer wiring pending backend support — UI only for now.
    setTransferNumber('');
    setIsTransferMenuOpen(false);
  };

  const handleAddCallSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addCallNumber.trim()) return;
    // Conference/add-call wiring pending backend support — UI only for now.
    // When wired, this should call onCall/makeCall(addCallNumber) to place a second,
    // independent line; the resulting new call will naturally appear as a new tab
    // in the line-switcher once App.tsx tracks it in `calls`.
    setAddCallNumber('');
    setIsAddCallOpen(false);
  };

  const isGrid = layout === 'grid';
  const btnSize = compact ? 'w-11 h-11' : 'w-14 h-14';
  const iconSize = compact ? 'w-4 h-4' : 'w-5 h-5';
  const labelSize = compact ? 'text-[9px]' : 'text-[10px]';

  const ControlButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    active?: boolean;
    activeColor?: keyof typeof ACTIVE_COLOR_CLASSES;
    title?: string;
  }> = ({ icon, label, onClick, active, activeColor = 'brand', title }) =>
    isGrid ? (
      <button onClick={onClick} title={title || label} className={`flex flex-col items-center justify-center ${compact ? 'gap-1' : 'gap-1.5'} cursor-pointer group`}>
        <span
          className={`flex items-center justify-center ${btnSize} rounded-full tactile-btn transition-colors ${
            active
              ? ACTIVE_COLOR_CLASSES[activeColor]
              : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700/60'
          }`}
        >
          {icon}
        </span>
        <span className={`${labelSize} font-medium text-zinc-500 dark:text-zinc-400`}>{label}</span>
      </button>
    ) : (
      <button
        onClick={onClick}
        title={title || label}
        className={`flex flex-col items-center justify-center ${btnSize} rounded-2xl tactile-btn cursor-pointer ${
          active
            ? ACTIVE_COLOR_CLASSES[activeColor]
            : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700/60'
        }`}
      >
        {icon}
        <span className="text-[9px] font-medium mt-1">{label}</span>
      </button>
    );

  const audioPopover = (
    <div className="absolute bottom-full mb-2 right-0 z-40 w-64 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-2xl overflow-hidden animate-popIn p-3">
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
    </div>
  );

  const transferPopover = (
    <div className="absolute bottom-full mb-2 right-0 z-40 w-64 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-2xl overflow-hidden animate-popIn p-3">
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
    </div>
  );

  return (
    <>
      <div className={isGrid ? `grid grid-cols-3 ${compact ? 'gap-x-3 gap-y-3 max-w-[220px]' : 'gap-x-4 gap-y-4 max-w-[280px]'} mx-auto` : 'w-full flex items-center justify-around gap-2'}>
        <ControlButton
          icon={isMuted ? <MicOff className={iconSize} /> : <Mic className={iconSize} />}
          label={isMuted ? 'Muted' : 'Mute'}
          active={isMuted}
          activeColor="rose"
          onClick={() => onMute(callId, !isMuted)}
        />
        <ControlButton
          icon={isOnHold ? <Play className={iconSize} /> : <Pause className={iconSize} />}
          label={isOnHold ? 'Resume' : 'Hold'}
          active={isOnHold}
          activeColor="amber"
          onClick={() => onHold(callId, !isOnHold)}
        />

        <div className="relative" ref={transferMenuRef}>
          <ControlButton
            icon={<ArrowRightLeft className={iconSize} />}
            label="Transfer"
            active={isTransferMenuOpen}
            onClick={() => setIsTransferMenuOpen((v) => !v)}
          />
          {isTransferMenuOpen && transferPopover}
        </div>

        <ControlButton icon={<Grid className={iconSize} />} label="Keypad" active={showKeypad} onClick={onToggleKeypad} />
        <ControlButton icon={<UserPlus className={iconSize} />} label="Add Call" onClick={() => setIsAddCallOpen(true)} />

        <div className="relative" ref={audioMenuRef}>
          <ControlButton
            icon={<Volume2 className={iconSize} />}
            label="Audio"
            active={isAudioMenuOpen}
            onClick={() => setIsAudioMenuOpen((v) => !v)}
          />
          {isAudioMenuOpen && audioPopover}
        </div>

        {!isGrid && (
          <button
            onClick={() => onHangup(callId)}
            className={`flex items-center justify-center ${btnSize} rounded-full bg-rose-600 hover:bg-rose-500 active:scale-92 text-white shadow-lg shadow-rose-600/30 tactile-btn cursor-pointer ml-1 ring-2 ring-rose-500/20`}
            title="End Call"
          >
            <EndCallIcon className={compact ? 'w-5 h-5' : 'w-6 h-6'} />
          </button>
        )}
      </div>

      {isGrid && (
        <div className={`flex items-center justify-center ${compact ? 'mt-3' : 'mt-5'}`}>
          <button
            onClick={() => onHangup(callId)}
            className={`flex items-center justify-center gap-2 ${compact ? 'px-6 h-11 text-xs' : 'px-8 h-14 text-sm'} rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-semibold shadow-lg shadow-rose-600/30 tactile-btn cursor-pointer`}
            title="End Call"
          >
            <EndCallIcon className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
            End Call
          </button>
        </div>
      )}

      {/* Keypad Mini Modal */}
      {showKeypad && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 rounded-2xl p-4 animate-fadeIn"
          onClick={onToggleKeypad}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl animate-popIn overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Grid className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                Keypad
              </h3>
              <button
                onClick={onToggleKeypad}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-3 gap-2">
                {DTMF_DIGITS.map((d) => (
                  <button
                    key={d}
                    onClick={() => handleDtmfPress(d)}
                    className="h-11 rounded-xl bg-zinc-50 dark:bg-zinc-800 hover:bg-brand-600 hover:text-white text-zinc-800 dark:text-zinc-100 font-semibold active:scale-92 tactile-btn text-base border border-zinc-200 dark:border-zinc-700/50 shadow-xs cursor-pointer"
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Call / Conference Mini Modal */}
      {isAddCallOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 rounded-2xl p-4 animate-fadeIn"
          onClick={() => setIsAddCallOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl animate-popIn overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                Add to Call
              </h3>
              <button
                onClick={() => setIsAddCallOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddCallSubmit} className="p-4 space-y-3">
              <input
                type="text"
                autoFocus
                required
                placeholder="Number to add..."
                value={addCallNumber}
                onChange={(e) => setAddCallNumber(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
              />
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Start Conference
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
