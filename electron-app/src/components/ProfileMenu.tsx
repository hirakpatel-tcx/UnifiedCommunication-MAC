import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronRight, LogOut, Building2, Phone, Sparkles, Settings } from 'lucide-react';
import { AuthUser, UserFeatures } from '../types/auth';

export type PresenceStatus = 'available' | 'busy' | 'away' | 'dnd';

interface ProfileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  displayName: string;
  username: string;
  server: string;
  isRegistered: boolean;
  registrationStatus?: string;
  presence: PresenceStatus;
  onChangePresence: (presence: PresenceStatus) => void;
  onViewProfile: () => void;
  onSignOut: () => void;
  authUser?: AuthUser | null;
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({
  isOpen,
  onClose,
  displayName,
  username,
  server,
  isRegistered,
  presence,
  onChangePresence,
  onViewProfile,
  onSignOut,
  authUser,
}) => {
  const [showStatusSubmenu, setShowStatusSubmenu] = useState<boolean>(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape key
  useEffect(() => {
    if (!isOpen) {
      setShowStatusSubmenu(false);
      setUpdateMessage(null);
      return;
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getInitials = (name: string) => {
    if (!name) return 'HP';
    const clean = name.trim();
    const parts = clean.split(/[\s\-_@.]+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  const presenceLabels: Record<PresenceStatus, { label: string; color: string }> = {
    available: { label: 'Available', color: 'bg-emerald-500' },
    busy: { label: 'Busy', color: 'bg-rose-500' },
    away: { label: 'Away', color: 'bg-amber-400' },
    dnd: { label: 'Do not disturb', color: 'bg-rose-600' },
  };

  const currentPresenceInfo = presenceLabels[presence] || presenceLabels.available;

  const handleCheckUpdates = () => {
    setUpdateMessage('You are on the latest version (v1.0.0 - PJSIP 2.17)');
    setTimeout(() => setUpdateMessage(null), 3500);
  };

  const email = authUser?.email || username;
  const role = authUser?.role;
  const tenantName = authUser?.tenant?.tenant_name;
  const tenantCode = authUser?.tenant?.tenant_code;
  const extensionNum = authUser?.extension?.extension_number || username;
  const features: UserFeatures = authUser?.features || {
    calling: true,
    fax: false,
    messaging: false,
    voicemail: false,
  };

  return (
    <div
      ref={menuRef}
      className="absolute top-12 right-3 w-80 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-750 shadow-2xl z-50 overflow-hidden text-zinc-800 dark:text-zinc-100 select-none animate-fadeIn transition-colors duration-150"
    >
      {/* Top Section: Avatar & User Identity */}
      <div className="p-4 flex items-center gap-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white font-bold text-base flex items-center justify-center shadow-md">
            {getInitials(displayName || email)}
          </div>
          {/* Presence Ring */}
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-zinc-800 ${isRegistered ? presenceLabels[presence].color : 'bg-zinc-400'
              }`}
          />
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate leading-tight">
              {displayName || email.split('@')[0]}
            </h3>
            {role && (
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-md font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400">
                {role}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate font-mono">
            {email}
          </p>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate font-mono">
            SIP: {authUser?.effective_sip_domain || authUser?.sip_domain || authUser?.tenant?.sip_domain || authUser?.extension?.sip_server || server}
          </p>

          {/* Tenant & Ext Badge */}
          <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
            {tenantCode && (
              <span className="flex items-center gap-1 truncate" title={tenantName || tenantCode}>
                <Building2 className="w-3 h-3 text-brand-500 shrink-0" />
                <span className="truncate">{tenantName || tenantCode}</span>
              </span>
            )}
            <span className="flex items-center gap-1 font-mono shrink-0">
              <Phone className="w-3 h-3 text-emerald-500" />
              <span>Ext: {extensionNum}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Enabled Features Pill Row */}
      <div className="px-4 py-2.5 bg-zinc-50/80 dark:bg-zinc-900/40 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2.5">
        <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 dark:text-zinc-500 shrink-0">
          Features
        </span>
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          {features.calling && (
            <span className="text-[10px] leading-none px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
              Calling
            </span>
          )}
          {features.voicemail && (
            <span className="text-[10px] leading-none px-2 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/20">
              Voicemail
            </span>
          )}
          {features.messaging && (
            <span className="text-[10px] leading-none px-2 py-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold border border-purple-500/20">
              Messaging
            </span>
          )}
          {features.fax && (
            <span className="text-[10px] leading-none px-2 py-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/20">
              Fax
            </span>
          )}
        </div>
      </div>

      {/* Share Status Section */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 py-1">
        <div className="px-4 pt-2 pb-1 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
          Share status
        </div>

        <div className="px-1.5 pb-1">
          <button
            onClick={() => setShowStatusSubmenu(!showStatusSubmenu)}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <span className={`w-3 h-3 rounded-full ${currentPresenceInfo.color} ring-2 ring-white dark:ring-zinc-800 shrink-0`} />
              <span className="text-zinc-900 dark:text-zinc-100 font-semibold text-sm">
                {currentPresenceInfo.label}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-400" />
          </button>

          {/* Submenu for Presence States */}
          {showStatusSubmenu && (
            <div className="mt-1 mb-1 p-1 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-0.5 animate-fadeIn">
              {(Object.keys(presenceLabels) as PresenceStatus[]).map((key) => {
                const item = presenceLabels[key];
                const isSelected = presence === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      onChangePresence(key);
                      setShowStatusSubmenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${isSelected
                        ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${item.color}`} />
                      <span>{item.label}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Account Settings, Check for updates & Sign out */}
      <div className="p-1.5 space-y-0.5">
        <button
          onClick={() => {
            onViewProfile();
            onClose();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4 text-zinc-400" />
          <span>Settings & Preferences</span>
        </button>

        <button
          onClick={handleCheckUpdates}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Check for updates</span>
        </button>

        {updateMessage && (
          <div className="px-3 py-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg mx-1 my-1 animate-fadeIn">
            {updateMessage}
          </div>
        )}

        <button
          onClick={() => {
            onSignOut();
            onClose();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
};
