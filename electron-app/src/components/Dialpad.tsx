import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Phone, Delete, Hash, ChevronDown, User, RotateCcw, Check } from 'lucide-react';
import { playDtmfTone } from '../utils/audio-tones';
import { Contact } from '../types/pjsip';
import { UserDID } from '../types/auth';

interface DialpadProps {
  onCall: (destination: string) => void;
  disabled?: boolean;
  callingFrom?: string;
  onOpenSettings?: () => void;
  contacts?: Contact[];
  lastCalledNumber?: string;
  dids?: UserDID[];
  selectedDidId?: string | null;
  onSelectDid?: (didId: string | null) => void;
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
  lastCalledNumber,
  dids = [],
  selectedDidId = null,
  onSelectDid,
}) => {
  const [inputNumber, setInputNumber] = useState<string>('');
  const [isCidMenuOpen, setIsCidMenuOpen] = useState<boolean>(false);
  const cidMenuRef = useRef<HTMLDivElement>(null);

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
    setInputNumber((prev) => prev + digit);
  }, []);

  const handleBackspace = () => {
    setInputNumber((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setInputNumber('');
  };

  const handleCallSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanNumber = inputNumber.trim();
    if (cleanNumber && !disabled) {
      onCall(cleanNumber);
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
      .slice(0, 3);
  }, [inputNumber, contacts]);

  // Active selected DID object
  const activeDid = useMemo(() => {
    if (!selectedDidId || dids.length === 0) return null;
    return dids.find((d) => d.id === selectedDidId) || null;
  }, [selectedDidId, dids]);

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
    <div className="flex flex-col items-center w-full max-w-sm mx-auto select-none animate-fadeIn">
      {/* Dialpad "Calling from" Picker Badge & Dropdown */}
      <div className="relative flex items-center justify-center mb-3" ref={cidMenuRef}>
        <button
          onClick={() => {
            if (dids.length > 0) {
              setIsCidMenuOpen(!isCidMenuOpen);
            } else if (onOpenSettings) {
              onOpenSettings();
            }
          }}
          title="Change Caller ID / Outbound DID"
          className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 font-medium transition-colors cursor-pointer shadow-xs max-w-xs truncate"
        >
          <span className="text-[11px] text-slate-400 dark:text-slate-400 font-normal shrink-0">Call as:</span>
          {activeDid ? (
            <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
              {activeDid.name || activeDid.did_name || activeDid.number || activeDid.did_number}{' '}
              <span className="text-[10px] text-brand-600 dark:text-brand-400 font-mono">
                ({activeDid.number || activeDid.did_number})
              </span>
            </span>
          ) : (
            <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">{callingFrom}</span>
          )}
          <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5 shrink-0" />
        </button>

        {/* DID / Caller ID Selection Popover (DIDs only) */}
        {isCidMenuOpen && dids.length > 0 && (
          <div className="absolute top-8 z-40 w-72 rounded-2xl bg-white dark:bg-[#1E2330] border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-popIn p-1.5">
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
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                      }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                        <Hash className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate leading-tight">{didName}</div>
                        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                          {didNumber}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Destination Display Input */}
      <div className="w-full mb-3">
        <div className="relative flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 shadow-sm focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
          <input
            type="text"
            value={inputNumber}
            onChange={(e) => setInputNumber(e.target.value)}
            placeholder="Dial a name or number..."
            className="w-full bg-transparent text-2xl font-mono text-center text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none pr-8 tracking-wider"
          />
          {inputNumber && (
            <button
              onClick={handleBackspace}
              onDoubleClick={handleClear}
              title="Click: Backspace | Double-click: Clear"
              className="absolute right-3 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <Delete className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Autocomplete Contact Matching Popup */}
      {matchingContacts.length > 0 && (
        <div className="w-full mb-3 p-1.5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 shadow-md animate-popIn">
          {matchingContacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => setInputNumber(contact.number)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-750 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold text-xs flex items-center justify-center">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                    {contact.name}
                  </div>
                  <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    {contact.number}
                  </div>
                </div>
              </div>
              <Phone className="w-3.5 h-3.5 text-brand-500" />
            </button>
          ))}
        </div>
      )}

      {/* Standard 12-Key DTMF Keypad Grid */}
      <div className="grid grid-cols-3 gap-3 w-full mb-4">
        {KEYPAD_BUTTONS.map((btn) => (
          <button
            key={btn.digit}
            onClick={() => handleDigitPress(btn.digit)}
            disabled={disabled}
            className="tactile-btn flex flex-col items-center justify-center h-14 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <span className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100 leading-none">
              {btn.digit}
            </span>
            {btn.subtext ? (
              <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 tracking-widest uppercase mt-0.5">
                {btn.subtext}
              </span>
            ) : (
              <span className="h-[13px]" />
            )}
          </button>
        ))}
      </div>

      {/* Call Action Bar: Redial + Big Green Call Button */}
      <div className="flex items-center justify-center gap-4 w-full">
        {lastCalledNumber ? (
          <button
            onClick={() => setInputNumber(lastCalledNumber)}
            title={`Redial ${lastCalledNumber}`}
            className="p-3.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-12" />
        )}

        <button
          onClick={() => handleCallSubmit()}
          disabled={disabled || !inputNumber.trim()}
          className="tactile-btn flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white shadow-lg shadow-emerald-500/30 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
        >
          <Phone className="w-7 h-7 fill-white" />
        </button>

        <div className="w-12" />
      </div>
    </div>
  );
};
