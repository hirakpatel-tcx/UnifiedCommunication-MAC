import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Phone,
  Clock,
  Voicemail,
  MessageSquare,
  Printer,
  Users,
  MoreHorizontal,
  X,
} from 'lucide-react';
import { NavTab } from './Sidebar';
import { UserFeatures } from '../types/auth';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenSettings?: () => void;
  isRegistered: boolean;
  features?: UserFeatures;
}

interface NavItemDef {
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  features = { calling: true, fax: false, messaging: false },
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    if (isMoreOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMoreOpen]);

  // Build full available items based on enabled features
  const allAvailableItems: NavItemDef[] = [];

  if (features.calling !== false) {
    allAvailableItems.push({ id: 'keypad', label: 'Keypad', icon: Phone });
    allAvailableItems.push({ id: 'recents', label: 'Recents', icon: Clock });
    allAvailableItems.push({ id: 'voicemail', label: 'Voicemail', icon: Voicemail });
  }

  if (features.messaging) {
    allAvailableItems.push({ id: 'messaging', label: 'Messages', icon: MessageSquare });
  }

  if (features.fax) {
    allAvailableItems.push({ id: 'fax', label: 'Fax', icon: Printer });
  }

  if (features.calling !== false) {
    allAvailableItems.push({ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard });
  }

  allAvailableItems.push({ id: 'contacts', label: 'Contacts', icon: Users });

  // Priority order requested: Keypad, Recents, Voicemail, Messages, Fax
  // Show up to four in primary bottom bar
  const primaryFourCandidates: NavTab[] = ['keypad', 'recents', 'voicemail', 'messaging', 'fax'];

  const primaryItems: NavItemDef[] = [];
  const overflowItems: NavItemDef[] = [];

  for (const item of allAvailableItems) {
    if (primaryFourCandidates.includes(item.id) && primaryItems.length < 4) {
      primaryItems.push(item);
    } else {
      overflowItems.push(item);
    }
  }

  // If primary items still less than 4 and we have overflow items, fill up to 4
  while (primaryItems.length < 4 && overflowItems.length > 0) {
    primaryItems.push(overflowItems.shift()!);
  }

  const isOverflowActive = overflowItems.some((item) => item.id === activeTab);

  return (
    <div className="relative md:hidden shrink-0 z-30">
      {/* "More" Popup Drawer / Sheet */}
      {isMoreOpen && (
        <div
          ref={moreMenuRef}
          className="absolute bottom-16 right-2 left-2 p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl backdrop-blur-xl animate-fadeIn z-40"
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              More Options
            </span>
            <button
              onClick={() => setIsMoreOpen(false)}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {overflowItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setIsMoreOpen(false);
                  }}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer text-left ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                      : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main 5-button Bottom Nav Bar */}
      <nav className="flex items-center justify-around h-14 px-2 border-t border-zinc-200 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg select-none transition-colors">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setIsMoreOpen(false);
                onTabChange(item.id);
              }}
              className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'text-brand-600 dark:text-brand-400 scale-105'
                  : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 inset-x-3 h-0.5 bg-brand-600 dark:bg-brand-500 rounded-full shadow-xs shadow-brand-500" />
              )}
              <Icon className="w-5 h-5" />
              <span className={`text-[10px] mt-0.5 font-medium tracking-tight ${isActive ? 'font-bold' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}

        {/* More Button (if there are overflow items) */}
        {overflowItems.length > 0 && (
          <button
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-150 cursor-pointer ${
              isOverflowActive || isMoreOpen
                ? 'text-brand-600 dark:text-brand-400 scale-105'
                : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            {(isOverflowActive || isMoreOpen) && (
              <span className="absolute top-0 inset-x-3 h-0.5 bg-brand-600 dark:bg-brand-500 rounded-full shadow-xs shadow-brand-500" />
            )}
            <MoreHorizontal className="w-5 h-5" />
            <span className={`text-[10px] mt-0.5 font-medium tracking-tight ${isOverflowActive ? 'font-bold' : ''}`}>
              More
            </span>
          </button>
        )}
      </nav>
    </div>
  );
};
