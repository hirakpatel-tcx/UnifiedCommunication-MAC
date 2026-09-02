import React, { useState, useEffect } from 'react';
import {
  X,
  Volume2,
  Mic,
  Sun,
  Moon,
  Server,
  Shield,
  Building2,
  Phone,
  Sparkles,
  RefreshCw,
  Play,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Monitor,
  Check,
  Lock,
} from 'lucide-react';
import { AudioDevice, SipAccountConfig } from '../types/pjsip';
import { AuthUser, UserFeatures } from '../types/auth';
import { playTestChime } from '../utils/audio-tones';

export type SettingsTab = 'audio' | 'appearance' | 'sip' | 'account';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: SettingsTab;

  // Audio settings
  devices: AudioDevice[];
  currentCaptureDev: number;
  currentPlaybackDev: number;
  onSelectDevices: (captureDev: number, playbackDev: number) => void;
  onRefreshDevices: () => void;

  // Theme settings
  theme: 'light' | 'dark';
  onSetTheme: (theme: 'light' | 'dark') => void;

  // SIP Account settings
  currentAccount?: SipAccountConfig | null;
  isRegistered: boolean;
  registrationStatus: string;
  onSaveAndRegister: (config: SipAccountConfig) => void;
  onUnregister: () => void;

  // Auth User / Tenant info
  authUser?: AuthUser | null;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'audio',
  devices,
  currentCaptureDev,
  currentPlaybackDev,
  onSelectDevices,
  onRefreshDevices,
  theme,
  onSetTheme,
  currentAccount,
  isRegistered,
  registrationStatus,
  onSaveAndRegister,
  onUnregister,
  authUser,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>(defaultTab);

  // Audio state
  const [selectedCapture, setSelectedCapture] = useState<number>(currentCaptureDev);
  const [selectedPlayback, setSelectedPlayback] = useState<number>(currentPlaybackDev);

  // SIP Account form state
  const [server, setServer] = useState<string>(currentAccount?.server || 'sip.linphone.org');
  const [port, setPort] = useState<number>(currentAccount?.port || 5060);
  const [username, setUsername] = useState<string>(currentAccount?.username || 'hirakpatel');
  const [authId, setAuthId] = useState<string>(currentAccount?.auth_id || 'hirakpatel');
  const [password, setPassword] = useState<string>(currentAccount?.password || '');
  const [transport, setTransport] = useState<'udp' | 'tcp' | 'tls'>(currentAccount?.transport || 'udp');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedCapture(currentCaptureDev);
      setSelectedPlayback(currentPlaybackDev);
      if (currentAccount) {
        setServer(currentAccount.server || '');
        setPort(currentAccount.port || 5060);
        setUsername(currentAccount.username || '');
        setAuthId(currentAccount.auth_id || currentAccount.username || '');
        setPassword(currentAccount.password || '');
        setTransport(currentAccount.transport || 'udp');
      }
    }
  }, [isOpen, currentCaptureDev, currentPlaybackDev, currentAccount]);

  useEffect(() => {
    if (isOpen && defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  const captureDevices = devices.filter((d) => d.input_count > 0);
  const playbackDevices = devices.filter((d) => d.output_count > 0);

  const handleApplyAudio = () => {
    onSelectDevices(selectedCapture, selectedPlayback);
  };

  const handleSaveSip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!server.trim() || !username.trim()) return;

    const config: SipAccountConfig = {
      server: server.trim(),
      port: Number(port) || 5060,
      username: username.trim(),
      auth_id: authId.trim() || username.trim(),
      password,
      transport,
    };

    onSaveAndRegister(config);
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'audio', label: 'Audio & Devices', icon: Volume2 },
    { id: 'appearance', label: 'Appearance', icon: Sun },
    { id: 'sip', label: 'SIP Account', icon: Server },
    { id: 'account', label: 'Tenant & User', icon: Building2 },
  ];

  const features: UserFeatures = authUser?.features || {
    calling: true,
    fax: false,
    messaging: false,
    voicemail: false,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel w-full max-w-2xl h-[92vh] sm:h-[560px] max-h-[640px] rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 shrink-0">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">
                Preferences & Settings
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate hidden sm:block">
                Manage audio routing, themes, and PBX credentials
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content Body (Responsive horizontal tabs on small screens, vertical sidebar rail on sm+) */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {/* Navigation Bar / Rail */}
          <div className="flex sm:flex-col flex-row overflow-x-auto sm:overflow-x-visible w-full sm:w-44 shrink-0 p-1.5 sm:p-3 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 gap-1 scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 sm:py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left whitespace-nowrap shrink-0 sm:shrink ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Panes */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
            {/* 1. AUDIO & DEVICES TAB */}
            {activeTab === 'audio' && (
              <div className="space-y-4 sm:space-y-5 animate-fadeIn">
                {/* WebRTC AEC Info Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 sm:py-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/30 gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-pulse shrink-0" />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 truncate">
                        WebRTC Echo Cancellation (AEC)
                      </h4>
                      <p className="text-[11px] text-indigo-700 dark:text-indigo-300">Active • 48kHz HD Audio • Hardware DSP</p>
                    </div>
                  </div>
                  <span className="self-start sm:self-auto text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Active
                  </span>
                </div>

                {/* Input Device (Microphone) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <Mic className="w-4 h-4 text-brand-500" />
                      Microphone (Input Device)
                    </label>
                    <button
                      type="button"
                      onClick={onRefreshDevices}
                      title="Refresh device list"
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Refresh</span>
                    </button>
                  </div>

                  <select
                    value={selectedCapture}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSelectedCapture(val);
                      onSelectDevices(val, selectedPlayback);
                    }}
                    className="glass-input w-full px-3 py-2.5 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none"
                  >
                    <option value={-1} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                      Default Microphone (System Audio)
                    </option>
                    {captureDevices.map((d) => (
                      <option key={d.id} value={d.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                        {d.name} ({d.driver})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Output Device (Speakers) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <Volume2 className="w-4 h-4 text-brand-500" />
                      Speakers / Headphones (Output Device)
                    </label>
                    <button
                      type="button"
                      onClick={() => playTestChime()}
                      className="flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 hover:underline font-semibold cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Test Sound</span>
                    </button>
                  </div>

                  <select
                    value={selectedPlayback}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSelectedPlayback(val);
                      onSelectDevices(selectedCapture, val);
                    }}
                    className="glass-input w-full px-3 py-2.5 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none"
                  >
                    <option value={-2} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                      Default Speakers (System Audio)
                    </option>
                    {playbackDevices.map((d) => (
                      <option key={d.id} value={d.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                        {d.name} ({d.driver})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleApplyAudio}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer text-center"
                  >
                    Save Audio Preferences
                  </button>
                </div>
              </div>
            )}

            {/* 2. APPEARANCE TAB */}
            {activeTab === 'appearance' && (
              <div className="space-y-4 sm:space-y-6 animate-fadeIn">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">Theme Selection</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Choose how the softphone interface looks on your desktop
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Light Mode Option Card */}
                  <button
                    onClick={() => onSetTheme('light')}
                    className={`p-3.5 sm:p-4 rounded-2xl border flex flex-row sm:flex-col items-center sm:text-center gap-3 transition-all cursor-pointer ${
                      theme === 'light'
                        ? 'border-brand-500 bg-brand-50/40 dark:bg-brand-950/20 ring-2 ring-brand-500/20 shadow-md'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="p-2.5 sm:p-3 rounded-full bg-amber-100 text-amber-600 shrink-0">
                      <Sun className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="text-left sm:text-center min-w-0">
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 sm:justify-center">
                        <span>Light Mode</span>
                        {theme === 'light' && <Check className="w-4 h-4 text-brand-600 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Crisp, high-contrast light surfaces</p>
                    </div>
                  </button>

                  {/* Dark Mode Option Card */}
                  <button
                    onClick={() => onSetTheme('dark')}
                    className={`p-3.5 sm:p-4 rounded-2xl border flex flex-row sm:flex-col items-center sm:text-center gap-3 transition-all cursor-pointer ${
                      theme === 'dark'
                        ? 'border-brand-500 bg-brand-50/40 dark:bg-brand-950/20 ring-2 ring-brand-500/20 shadow-md'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="p-2.5 sm:p-3 rounded-full bg-slate-900 text-indigo-400 shrink-0">
                      <Moon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="text-left sm:text-center min-w-0">
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 sm:justify-center">
                        <span>Dark Mode</span>
                        {theme === 'dark' && <Check className="w-4 h-4 text-brand-600 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Sleek dark macOS glassmorphic aesthetic</p>
                    </div>
                  </button>
                </div>

                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    <Monitor className="w-4 h-4 text-brand-500 shrink-0" />
                    <span>macOS Vibrancy & Styling</span>
                  </div>
                  The app automatically coordinates with your system glassmorphism and macOS titlebar controls.
                </div>
              </div>
            )}

            {/* 3. SIP & PBX ACCOUNT TAB */}
            {activeTab === 'sip' && (() => {
              const isSuperAdmin = authUser?.role?.toLowerCase() === 'superadmin';

              return (
                <div className="space-y-3.5 sm:space-y-4 animate-fadeIn">
                  {/* Registration Status Banner */}
                  <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Registration Status:</span>
                    <div className="flex items-center gap-2">
                      {isRegistered ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Registered</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[120px] sm:max-w-none">
                            {registrationStatus || 'Unregistered'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Read-Only Banner for non-superadmins */}
                  {!isSuperAdmin && (
                    <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-800 dark:text-amber-300">
                      <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>
                        SIP credentials are read-only for <strong>{authUser?.role || 'User'}</strong> accounts. Only a <strong>Superadmin</strong> can modify PBX connection settings.
                      </span>
                    </div>
                  )}

                  <form onSubmit={handleSaveSip} className="space-y-3 sm:space-y-3.5">
                    {/* Server & Port */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">SIP Server / Domain</label>
                        <input
                          type="text"
                          required
                          value={server}
                          disabled={!isSuperAdmin}
                          readOnly={!isSuperAdmin}
                          onChange={(e) => setServer(e.target.value)}
                          placeholder="sip.example.com"
                          className={`glass-input w-full px-3 py-2 rounded-xl text-xs font-mono font-medium outline-none ${
                            !isSuperAdmin ? 'bg-slate-100/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 cursor-not-allowed opacity-90' : ''
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Port</label>
                        <input
                          type="number"
                          required
                          value={port}
                          disabled={!isSuperAdmin}
                          readOnly={!isSuperAdmin}
                          onChange={(e) => setPort(Number(e.target.value))}
                          className={`glass-input w-full px-3 py-2 rounded-xl text-xs font-mono font-medium outline-none ${
                            !isSuperAdmin ? 'bg-slate-100/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 cursor-not-allowed opacity-90' : ''
                          }`}
                        />
                      </div>
                    </div>

                    {/* Username & Auth ID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">SIP Username</label>
                        <input
                          type="text"
                          required
                          value={username}
                          disabled={!isSuperAdmin}
                          readOnly={!isSuperAdmin}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="101"
                          className={`glass-input w-full px-3 py-2 rounded-xl text-xs font-mono outline-none ${
                            !isSuperAdmin ? 'bg-slate-100/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 cursor-not-allowed opacity-90' : ''
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Auth ID</label>
                        <input
                          type="text"
                          value={authId}
                          disabled={!isSuperAdmin}
                          readOnly={!isSuperAdmin}
                          onChange={(e) => setAuthId(e.target.value)}
                          placeholder="Leave blank for username"
                          className={`glass-input w-full px-3 py-2 rounded-xl text-xs font-mono outline-none ${
                            !isSuperAdmin ? 'bg-slate-100/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 cursor-not-allowed opacity-90' : ''
                          }`}
                        />
                      </div>
                    </div>

                    {/* Password Field */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">SIP Password</label>
                      <div className="relative flex items-center">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          disabled={!isSuperAdmin}
                          readOnly={!isSuperAdmin}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className={`glass-input w-full px-3 pr-10 py-2 rounded-xl text-xs font-mono outline-none ${
                            !isSuperAdmin ? 'bg-slate-100/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 cursor-not-allowed opacity-90' : ''
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Transport Type */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Transport Protocol</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['tls', 'tcp', 'udp'] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            disabled={!isSuperAdmin}
                            onClick={() => isSuperAdmin && setTransport(t)}
                            className={`py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                              transport === t
                                ? 'bg-brand-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            } ${!isSuperAdmin ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Form Action Buttons (Only visible to superadmin) */}
                    {isSuperAdmin ? (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                        {isRegistered ? (
                          <button
                            type="button"
                            onClick={onUnregister}
                            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer text-center"
                          >
                            Unregister
                          </button>
                        ) : (
                          <div className="hidden sm:block" />
                        )}
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md shadow-brand-600/30 transition-all cursor-pointer text-center"
                        >
                          Save & Register
                        </button>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 italic">
                        Account parameters auto-provisioned from tenant profile.
                      </div>
                    )}
                  </form>
                </div>
              );
            })()}

            {/* 4. TENANT & USER TAB */}
            {activeTab === 'account' && (
              <div className="space-y-3.5 sm:space-y-4 animate-fadeIn">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">User & Tenant Information</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Authenticated Cloud-PBX profile details</p>
                </div>

                {authUser ? (
                  <div className="space-y-3">
                    {/* User & Role Card */}
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium shrink-0">Email / Identity</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono truncate">{authUser.email}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium shrink-0">Role</span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-600 dark:text-brand-400">
                          {authUser.role}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium shrink-0">Tenant</span>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {authUser.tenant?.tenant_name} ({authUser.tenant?.tenant_code})
                        </span>
                      </div>
                    </div>

                    {/* Extension Card */}
                    {authUser.extension && (
                      <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 shrink-0">
                            <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            Extension Number
                          </span>
                          <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                            {authUser.extension.extension_number}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium shrink-0">SIP Username</span>
                          <span className="text-xs font-mono text-slate-700 dark:text-slate-300 truncate">
                            {authUser.extension.sip_username}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* DIDs Card */}
                    {authUser.dids && authUser.dids.length > 0 && (
                      <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Assigned Phone Numbers (DIDs)
                        </span>
                        <div className="space-y-1.5">
                          {authUser.dids.map((d) => (
                            <div key={d.id} className="flex items-center justify-between text-xs font-mono gap-2">
                              <span className="text-slate-600 dark:text-slate-400 truncate">{d.name || d.did_name || 'Line'}</span>
                              <span className="font-semibold text-brand-600 dark:text-brand-400 shrink-0">
                                {d.number || d.did_number}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Features Pill Row */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-slate-500">Enabled Features:</span>
                      {features.calling && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                          Calling
                        </span>
                      )}
                      {features.voicemail && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold">
                          Voicemail
                        </span>
                      )}
                      {features.fax && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold">
                          Fax
                        </span>
                      )}
                      {features.messaging && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold">
                          Messaging
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Not signed into a Cloud-PBX user account.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
