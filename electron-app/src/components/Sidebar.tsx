import React from 'react';
import {
  LayoutDashboard,
  Phone,
  Clock,
  Voicemail,
  MessageSquare,
  Printer,
  Users,
  Settings,
  Terminal,
} from 'lucide-react';
import { UserFeatures } from '../types/auth';

export type NavTab =
  | 'dashboard'
  | 'keypad'
  | 'recents'
  | 'contacts'
  | 'voicemail'
  | 'messaging'
  | 'fax';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenSettings: () => void;
  onOpenLogs: () => void;
  isLogsOpen: boolean;
  isRegistered?: boolean;
  features?: UserFeatures;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onOpenSettings,
  onOpenLogs,
  isLogsOpen,
  isRegistered,
  features = { calling: true, fax: false, messaging: false },
}) => {
  // Build navigation items based on user features
  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string; fill?: string }> }[] = [];

  // Calling features: Dashboard, Keypad (Dialer), Recents, Voicemail
  if (features.calling !== false) {
    navItems.push({ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard });
    navItems.push({ id: 'keypad', label: 'Phone', icon: Phone });
    navItems.push({ id: 'recents', label: 'Recents', icon: Clock });
    navItems.push({ id: 'voicemail', label: 'Voicemail', icon: Voicemail });
  }

  // Messaging feature
  if (features.messaging) {
    navItems.push({ id: 'messaging', label: 'Messages', icon: MessageSquare });
  }

  // Fax feature
  if (features.fax) {
    navItems.push({ id: 'fax', label: 'Fax', icon: Printer });
  }

  // Contacts
  navItems.push({ id: 'contacts', label: 'Contacts', icon: Users });

  return (
    <aside className="hidden md:flex w-16 md:w-18 flex-col items-center justify-between py-2.5 border-r border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md z-20 select-none transition-colors shrink-0">
      {/* Top Section: Navigation Items */}
      <nav className="flex flex-col items-center gap-1 w-full px-1.5 overflow-y-auto no-scrollbar py-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              title={item.label}
              className={`relative flex flex-col items-center justify-center w-12 h-11 rounded-xl transition-all duration-150 cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-300'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80'
              }`}
            >
              <Icon className="w-4.5 h-4.5" fill="none" />
              <span className="text-[8px] font-medium mt-0.5 tracking-tight truncate max-w-full px-0.5 leading-none">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Section: Utility Actions (Terminal & Settings) */}
      <div className="flex flex-col items-center gap-1.5 w-full px-2 pb-1 shrink-0 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
        {/* Live SIP Log Console Trigger */}
        <button
          onClick={onOpenLogs}
          title="Live SIP Log Console"
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
            isLogsOpen
              ? 'bg-brand-600/20 text-brand-600 dark:text-brand-300'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Terminal className="w-4 h-4" />
        </button>

        {/* Settings & Preferences Button */}
        <button
          onClick={onOpenSettings}
          title="Preferences & Settings (Audio, Themes, SIP)"
          className="relative p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4" />
          {isRegistered !== undefined && (
            <span
              className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${
                isRegistered ? 'bg-emerald-500' : 'bg-amber-400'
              }`}
            />
          )}
        </button>
      </div>
    </aside>
  );
};
