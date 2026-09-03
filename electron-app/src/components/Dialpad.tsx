import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Phone,
  Delete,
  Hash,
  ChevronDown,
  User,
  RotateCcw,
  Check,
  Clock,
  Search,
  Users,
  Building,
  Mail,
  Sparkles,
  X,
  MessageSquare,
} from 'lucide-react';
import { playDtmfTone } from '../utils/audio-tones';
import { Contact, CallRecord, AudioDevice } from '../types/pjsip';
import { UserDID, UserFeatures } from '../types/auth';
import { RecentCallsList } from './RecentCallsList';
import { InCallPanel } from './InCallPanel';
import { FixedPopover } from './FixedPopover';

interface ActiveCallInfo {
  callId: number;
  remoteUri: string;
  state: string;
  reason?: string;
  lastStatus?: number;
  isMuted: boolean;
  isOnHold: boolean;
}

interface DialpadProps {
  onCall: (destination: string) => void;
  disabled?: boolean;
  callingFrom?: string;
  onOpenSettings?: () => void;
  contacts?: Contact[];
  history?: CallRecord[];
  lastCalledNumber?: string;
  dids?: UserDID[];
  selectedDidId?: string | null;
  onSelectDid?: (didId: string | null) => void;
  features?: UserFeatures;
  activeCall?: ActiveCallInfo | null;
  /** All active lines (for the line-switcher tab row inside InCallPanel). */
  calls?: ActiveCallInfo[];
  focusedCallId?: number | null;
  onFocusCall?: (callId: number) => void;
  onHangup?: (callId: number) => void;
  onMute?: (callId: number, mute: boolean) => void;
  onHold?: (callId: number, hold: boolean) => void;
  onSendDtmf?: (callId: number, digit: string) => void;
  audioDevices?: AudioDevice[];
  currentCaptureDev?: number;
  currentPlaybackDev?: number;
  onSelectAudioDevices?: (captureDev: number, playbackDev: number) => void;
}

interface KeypadButton {
  digit: string;
  subtext: string;
}

const KEYPAD_BUTTONS: KeypadButton[] = [
  { digit: '1', subtext: '' },
  { digit: '2', subtext: 'ABC' },
  { digit: '3', subtext: 'DEF' },
  { digit: '4', subtext: 'GHI' },
  { digit: '5', subtext: 'JKL' },
  { digit: '6', subtext: 'MNO' },
  { digit: '7', subtext: 'PQRS' },
  { digit: '8', subtext: 'TUV' },
  { digit: '9', subtext: 'WXYZ' },
  { digit: '*', subtext: '' },
  { digit: '0', subtext: '+' },
  { digit: '#', subtext: '' },
];

export const Dialpad: React.FC<DialpadProps> = ({
  onCall,
  disabled = false,
  callingFrom = 'hirakpatel',
  onOpenSettings,
  contacts = [],
  history = [],
  lastCalledNumber,
  dids = [],
  selectedDidId = null,
  onSelectDid,
  features,
  activeCall = null,
  calls = [],
  focusedCallId = null,
  onFocusCall,
  onHangup,
  onMute,
  onHold,
  onSendDtmf,
  audioDevices = [],
  currentCaptureDev = -1,
  currentPlaybackDev = -2,
  onSelectAudioDevices,
}) => {
  const messagingEnabled = !!features?.messaging;
  const [inputNumber, setInputNumber] = useState<string>('');
  const [isCidMenuOpen, setIsCidMenuOpen] = useState<boolean>(false);
  const [sidebarSearch, setSidebarSearch] = useState<string>('');
  const [sideTab, setSideTab] = useState<'recents' | 'contacts'>('recents');
  const [suggestionsDismissed, setSuggestionsDismissed] = useState<boolean>(false);
  const cidMenuRef = useRef<HTMLDivElement>(null);
  const cidBtnRef = useRef<HTMLButtonElement>(null);

  // Close CID dropdown on outside click or Escape
  useEffect(() => {
    if (!isCidMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (cidMenuRef.current && !cidMenuRef.current.contains(e.target as Node)) {
        setIsCidMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsCidMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCidMenuOpen]);

  const handleDigitPress = useCallback((digit: string) => {
    playDtmfTone(digit);
    setSuggestionsDismissed(false);
    setInputNumber((prev) => prev + digit);
  }, []);

  const handleBackspace = () => {
    setInputNumber((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setInputNumber('');
  };

  const handleCallSubmit = (dest?: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const target = (dest || inputNumber).trim();
    if (target && !disabled) {
      onCall(target);
    }
  };

  // Autocomplete suggestions matching input
  const matchingContacts = useMemo(() => {
    if (!inputNumber.trim() || contacts.length === 0) return [];
    const query = inputNumber.trim().toLowerCase();
    return contacts
      .filter(
        (c) =>
          c.number.toLowerCase().includes(query) ||
          c.name.toLowerCase().includes(query)
      )
      .slice(0, 4);
  }, [inputNumber, contacts]);

  // Active selected DID object
  const activeDid = useMemo(() => {
    if (!selectedDidId || dids.length === 0) return null;
    return dids.find((d) => d.id === selectedDidId) || null;
  }, [selectedDidId, dids]);

  // Filtered contacts for side quick list
  const filteredSideContacts = useMemo(() => {
    if (!sidebarSearch.trim()) return contacts;
    const q = sidebarSearch.toLowerCase();
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.number.toLowerCase().includes(q) ||
        (c.company && c.company.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q))
    );
  }, [contacts, sidebarSearch]);

  // Physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;

      if (/^[0-9*#]$/.test(e.key)) {
        e.preventDefault();
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleCallSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigitPress, inputNumber, disabled]);

  return (
    <div className="flex-1 w-full flex flex-col select-none animate-fadeIn min-h-0 overflow-hidden">
      {/* 2-Column Responsive Full-Height Workspace */}
      <div className="w-full h-full flex flex-col lg:flex-row gap-4 lg:gap-6 items-stretch min-h-0">

        {/* Left Column: Keypad Console */}
        <div className="w-full h-full lg:h-auto lg:w-[430px] xl:w-[460px] shrink-0 flex flex-col justify-center gap-2 sm:gap-3 p-2.5 sm:p-5 lg:p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs overflow-y-auto">

          {/* Top: Caller ID / DID Selector */}
          <div className="relative flex items-center justify-center gap-1.5 min-h-8 sm:min-h-10 pb-2 sm:pb-3 border-b border-zinc-100 dark:border-zinc-800/80" ref={cidMenuRef}>
            <span className="text-[10px] sm:text-[11px] font-semibold text-zinc-400 uppercase tracking-wider shrink-0">Calling as:</span>
            <button
              ref={cidBtnRef}
              onClick={() => {
                if (dids.length > 1) {
                  setIsCidMenuOpen(!isCidMenuOpen);
                } else if (dids.length === 0 && onOpenSettings) {
                  onOpenSettings();
                }
              }}
              title={dids.length > 1 ? 'Change Caller ID / Outbound DID' : undefined}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-750 text-[10px] sm:text-xs text-zinc-700 dark:text-zinc-200 font-medium transition-colors max-w-full min-w-0 ${dids.length > 1 || dids.length === 0
                  ? 'hover:bg-zinc-200 dark:hover:bg-zinc-700/80 cursor-pointer'
                  : 'cursor-default'
                }`}
            >
              {activeDid ? (
                <span className="truncate min-w-0">
                  <span className="font-semibold text-zinc-900 dark:text-white">
                    {activeDid.name || activeDid.did_name || activeDid.number || activeDid.did_number}
                  </span>{' '}
                  <span className="text-[10px] text-brand-600 dark:text-brand-400 font-mono">
                    ({activeDid.number || activeDid.did_number})
                  </span>
                </span>
              ) : (
                <span className="font-semibold text-zinc-900 dark:text-white truncate">{callingFrom}</span>
              )}
              {dids.length > 1 && <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0 ml-0.5" />}
            </button>

            {/* DID / Caller ID Selection Popover */}
            {isCidMenuOpen && dids.length > 1 && (
              <FixedPopover anchorRef={cidBtnRef} align="center" className="w-[min(18rem,calc(100vw-2rem))] rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-2xl overflow-hidden p-1.5">
                <div className="max-h-56 overflow-y-auto py-0.5 space-y-0.5">
                  {dids.map((did) => {
                    const isSelected = selectedDidId === did.id;
                    const didName = did.name || did.did_name || 'Direct Line';
                    const didNumber = did.number || did.did_number;
                    return (
                      <button
                        key={did.id}
                        onClick={() => {
                          if (onSelectDid) onSelectDid(did.id);
                          setIsCidMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${isSelected
                            ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 font-semibold'
                            : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80'
                          }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                            <Hash className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold truncate leading-tight">{didName}</div>
                            <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
                              {didNumber}
                            </div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </FixedPopover>
            )}
          </div>

          {/* Number Display Input & Clear */}
          <div className="relative z-20 w-full">
            <div className="w-full">
              <div className="relative flex items-center bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-750 rounded-2xl p-2 sm:p-3.5 shadow-xs focus-within:bg-white dark:focus-within:bg-zinc-800 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
                <input
                  type="text"
                  value={inputNumber}
                  onChange={(e) => {
                    setSuggestionsDismissed(false);
                    setInputNumber(e.target.value);
                  }}
                  placeholder="Dial number or name..."
                  className="min-w-0 w-full bg-transparent text-base sm:text-2xl lg:text-3xl font-mono text-center text-zinc-900 dark:text-zinc-100 placeholder:text-xs placeholder:sm:text-base placeholder:font-sans placeholder-zinc-400 dark:placeholder-zinc-500 outline-none px-1 sm:px-2 tracking-wide truncate"
                />
                {inputNumber && (
                  <button
                    onClick={handleBackspace}
                    onDoubleClick={handleClear}
                    title="Click: Backspace | Double-click: Clear"
                    className="absolute right-3 p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors cursor-pointer"
                  >
                    <Delete className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Autocomplete Contact Matching Dropdown */}
            {matchingContacts.length > 0 && !suggestionsDismissed && (
              <div className="absolute left-0 right-0 top-full mt-1 z-30 p-1.5 rounded-2xl bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-750 shadow-xl animate-popIn max-h-56 overflow-y-auto">
                <div className="flex items-center justify-between px-2.5 py-1">
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Suggested Match
                  </span>
                  <button
                    onClick={() => setSuggestionsDismissed(true)}
                    title="Dismiss suggestions"
                    className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {matchingContacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => setInputNumber(contact.number)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-750 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold text-xs flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 leading-tight truncate">
                          {contact.name}
                        </div>
                        <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400 truncate">
                          {contact.number}
                        </div>
                      </div>
                    </div>
                    <Phone className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Keypad Grid (Scales comfortably on all screen heights) */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full py-1 sm:py-2 shrink-0">
            {KEYPAD_BUTTONS.map((btn) => (
              <button
                key={btn.digit}
                onClick={() => handleDigitPress(btn.digit)}
                disabled={disabled}
                className="tactile-btn flex flex-col items-center justify-center h-12 sm:h-16 lg:h-17 rounded-2xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200/80 dark:border-zinc-750 hover:bg-white dark:hover:bg-zinc-750 hover:border-brand-500/30 hover:shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <span className="text-xl sm:text-3xl font-bold font-mono text-zinc-800 dark:text-zinc-100 leading-none">
                  {btn.digit}
                </span>
                {btn.subtext ? (
                  <span className="text-[8px] sm:text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 tracking-widest uppercase mt-0.5 sm:mt-1">
                    {btn.subtext}
                  </span>
                ) : (
                  <span className="h-[10px] sm:h-[14px]" />
                )}
              </button>
            ))}
          </div>

          {/* Action Bar: Redial + Dial Call Button */}
          <div className="shrink-0 pt-2 sm:pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-4 w-full bg-white dark:bg-zinc-900">
            {lastCalledNumber ? (
              <button
                onClick={() => setInputNumber(lastCalledNumber)}
                title={`Redial ${lastCalledNumber}`}
                className="flex items-center gap-2 px-3.5 py-1.5 sm:py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer text-xs font-medium"
              >
                <RotateCcw className="w-4 h-4 text-zinc-500" />
                <span className="font-mono text-xs hidden sm:inline">{lastCalledNumber}</span>
              </button>
            ) : (
              <div className="text-[11px] text-zinc-400 font-mono">Ready to call</div>
            )}

            <button
              onClick={() => handleCallSubmit()}
              disabled={disabled || !inputNumber.trim()}
              className="tactile-btn flex items-center justify-center gap-2.5 px-6 sm:px-8 h-11 sm:h-13 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
            >
              <Phone className="w-5 h-5" />
              <span>Call</span>
            </button>
          </div>
        </div>

        {/* Right Column: In-Call Panel OR Recents & Directory */}
        {activeCall ? (
          <InCallPanel
            key={focusedCallId ?? activeCall.callId}
            callId={activeCall.callId}
            remoteUri={activeCall.remoteUri}
            state={activeCall.state}
            reason={activeCall.reason}
            lastStatus={activeCall.lastStatus}
            isMuted={activeCall.isMuted}
            isOnHold={activeCall.isOnHold}
            onHangup={onHangup || (() => { })}
            onMute={onMute || (() => { })}
            onHold={onHold || (() => { })}
            onSendDtmf={onSendDtmf || (() => { })}
            audioDevices={audioDevices}
            currentCaptureDev={currentCaptureDev}
            currentPlaybackDev={currentPlaybackDev}
            onSelectAudioDevices={onSelectAudioDevices}
            calls={calls.map((c) => ({ callId: c.callId, remoteUri: c.remoteUri, state: c.state, isOnHold: c.isOnHold }))}
            onFocusCall={onFocusCall}
          />
        ) : (
          <div className="hidden lg:flex flex-1 flex-col rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs min-h-0 overflow-hidden">

            {/* Header & Tabs */}
            <div className="px-4 pt-4 pb-3 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 text-xs">
                  <button
                    onClick={() => setSideTab('recents')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${sideTab === 'recents'
                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                      }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Recent Calls</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-zinc-200 dark:bg-zinc-600 text-[10px] font-mono">
                      {history.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setSideTab('contacts')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${sideTab === 'contacts'
                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                      }`}
                  >
                    <Users className="w-3.5 h-3.5 text-brand-500" />
                    <span>Contacts & Directory</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-zinc-200 dark:bg-zinc-600 text-[10px] font-mono">
                      {contacts.length}
                    </span>
                  </button>
                </div>
              </div>

              {/* Quick Search (Contacts tab only — Recents has its own search) */}
              {sideTab === 'contacts' && (
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -tranzinc-y-1/2 text-zinc-400 pointer-events-none" />
                  <input
                    type="text"
                    value={sidebarSearch}
                    onChange={(e) => setSidebarSearch(e.target.value)}
                    placeholder="Search directory..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1.5 focus:ring-brand-500 focus:bg-white dark:focus:bg-zinc-800"
                  />
                </div>
              )}
            </div>

            {/* List Content Area: Expands smoothly to fill all available vertical & horizontal space */}
            {sideTab === 'recents' ? (
              <div className="flex-1 min-h-0 px-3 sm:px-4 pt-2 pb-3 sm:pb-4">
                <RecentCallsList
                  history={history}
                  onCall={handleCallSubmit}
                  onSelectNumber={setInputNumber}
                  messagingEnabled={messagingEnabled}
                />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 divide-y divide-zinc-100 dark:divide-zinc-800/80 min-h-0">
                {filteredSideContacts.length === 0 ? (
                  <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center text-zinc-400 text-xs">
                    <Users className="w-10 h-10 mb-2 text-zinc-300 dark:text-zinc-700 stroke-[1.5]" />
                    <p className="font-semibold text-zinc-600 dark:text-zinc-300">No contacts found</p>
                    <p className="text-zinc-400 text-[11px]">Team members and directory contacts will show up here</p>
                  </div>
                ) : (
                  filteredSideContacts.map((c) => (
                    <div
                      key={c.id}
                      className="py-2.5 px-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/60 rounded-xl transition-colors group"
                    >
                      <button
                        onClick={() => setInputNumber(c.number)}
                        title="Click to populate dialer"
                        className="flex items-center gap-3 min-w-0 text-left flex-1 cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 font-bold text-xs flex items-center justify-center shrink-0 border border-brand-500/20">
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">
                              {c.name}
                            </p>
                            <span className="font-mono text-[11px] text-brand-600 dark:text-brand-400 font-medium">
                              {c.number}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-zinc-400 truncate mt-0.5">
                            {c.company && (
                              <span className="flex items-center gap-1 truncate">
                                <Building className="w-3 h-3 text-zinc-400 shrink-0" />
                                {c.company}
                              </span>
                            )}
                            {c.email && (
                              <span className="flex items-center gap-1 truncate hidden sm:inline-flex">
                                <Mail className="w-3 h-3 text-zinc-400 shrink-0" />
                                {c.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>

                      <div className="flex items-center gap-1.5 shrink-0 ml-3">
                        {messagingEnabled && (
                          <button
                            title={`Message ${c.name}`}
                            className="p-2 rounded-xl text-zinc-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors cursor-pointer"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleCallSubmit(c.number)}
                          title={`Call ${c.name}`}
                          className="p-2 rounded-xl text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Bottom Bar Hints */}
            <div className="p-3 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50 text-[11px] text-zinc-400 flex items-center justify-between shrink-0">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                Click any item to load into dialer or call directly
              </span>
              <span className="font-mono text-[10px]">NumPad & Enter keys active</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
