import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PhoneIncoming, PhoneOff, Check, Terminal, X, Trash2, Settings } from 'lucide-react';
import { Sidebar, NavTab } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { ProfileMenu, PresenceStatus } from './components/ProfileMenu';
import { Dialpad } from './components/Dialpad';
import { ActiveCall } from './components/ActiveCall';
import { CallHistory } from './components/CallHistory';
import { Contacts } from './components/Contacts';
import { SettingsModal, SettingsTab } from './components/SettingsModal';
import { LoginScreen } from './components/LoginScreen';
import { DashboardView } from './components/DashboardView';
import { VoicemailView } from './components/VoicemailView';
import { MessagingView } from './components/MessagingView';
import { FaxView } from './components/FaxView';
import {
  SipAccountConfig,
  AudioDevice,
  CallStateEvent,
  RegStateEvent,
  AudioDevicesEvent,
  DaemonStatusEvent,
  CallRecord,
  Contact,
} from './types/pjsip';
import { AuthSession, LoginResponse } from './types/auth';
import {
  getStoredAuthSession,
  clearAuthSession,
  logoutUser,
  extensionToSipConfig,
  getStoredBaseUrl,
  extract10DigitCID,
} from './services/auth';
import { startRinger, stopRinger } from './utils/audio-tones';

export const DEFAULT_SIP_CONFIG: SipAccountConfig = {
  server: import.meta.env.VITE_SIP_DOMAIN || '127.0.0.1',
  port: 5061,
  username: 'hirakpatel',
  auth_id: 'hirakpatel',
  password: '',
  transport: 'tls',
};

const INITIAL_CONTACTS: Contact[] = [
  { id: '1', name: 'Linphone Echo Test', number: 'sip:echo@sip.linphone.org', company: 'Belledonne Communications' },
  { id: '2', name: 'FreeSWITCH Echo Test', number: '8004444444', company: 'FreeSWITCH IVR' },
  { id: '3', name: 'Sales & Support', number: '900', company: 'TCX Connect' },
];

export const App: React.FC = () => {
  // Theme State (light / dark)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('app_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'dark';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleSetTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
  };

  // Authentication State
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => getStoredAuthSession());

  // Selected Outbound Caller ID / DID State
  const [selectedDidId, setSelectedDidId] = useState<string | null>(() => {
    const saved = localStorage.getItem('selected_did_id');
    if (saved) return saved;
    const stored = getStoredAuthSession();
    const availableDids = stored?.user?.dids?.filter((d) => d.calling_enabled !== false) || [];
    return availableDids.length > 0 ? availableDids[0].id : null;
  });

  useEffect(() => {
    if (selectedDidId) {
      localStorage.setItem('selected_did_id', selectedDidId);
    } else {
      localStorage.removeItem('selected_did_id');
    }
  }, [selectedDidId]);

  // Navigation Tab
  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    const session = getStoredAuthSession();
    if (session?.user?.features) {
      if (session.user.features.calling !== false) return 'dashboard';
      if (session.user.features.messaging) return 'messaging';
      if (session.user.features.fax) return 'fax';
    }
    return 'dashboard';
  });

  // Ensure activeTab is valid if user features change
  useEffect(() => {
    if (!authSession?.user?.features) return;
    const f = authSession.user.features;
    const callingTabs: NavTab[] = ['dashboard', 'keypad', 'recents', 'voicemail'];
    if (!f.calling && callingTabs.includes(activeTab)) {
      if (f.messaging) {
        setActiveTab('messaging');
      } else if (f.fax) {
        setActiveTab('fax');
      } else {
        setActiveTab('contacts');
      }
    } else if (activeTab === 'fax' && !f.fax) {
      setActiveTab(f.calling ? 'dashboard' : f.messaging ? 'messaging' : 'contacts');
    } else if (activeTab === 'messaging' && !f.messaging) {
      setActiveTab(f.calling ? 'dashboard' : f.fax ? 'fax' : 'contacts');
    }
  }, [authSession?.user?.features, activeTab]);

  // Application State
  const [isDaemonRunning, setIsDaemonRunning] = useState<boolean>(false);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [registrationStatus, setRegistrationStatus] = useState<string>('Unregistered');
  const [currentAccount, setCurrentAccount] = useState<SipAccountConfig | null>(() => {
    const stored = getStoredAuthSession();
    if (stored?.user?.extension) {
      return extensionToSipConfig(stored.user, stored.savedPassword);
    }
    try {
      const savedConfig = localStorage.getItem('pjsip_account_config');
      return savedConfig ? JSON.parse(savedConfig) : DEFAULT_SIP_CONFIG;
    } catch {
      return DEFAULT_SIP_CONFIG;
    }
  });

  // Call State
  const [activeCall, setActiveCall] = useState<CallStateEvent | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallStateEvent | null>(null);
  const callStartTimeRef = useRef<number>(0);

  // Call History State
  const [callHistory, setCallHistory] = useState<CallRecord[]>(() => {
    try {
      const saved = localStorage.getItem('call_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Contacts State
  const [contacts, setContacts] = useState<Contact[]>(() => {
    try {
      const saved = localStorage.getItem('contacts');
      return saved ? JSON.parse(saved) : INITIAL_CONTACTS;
    } catch {
      return INITIAL_CONTACTS;
    }
  });

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('call_history', JSON.stringify(callHistory));
  }, [callHistory]);

  // Save contacts to localStorage
  useEffect(() => {
    localStorage.setItem('contacts', JSON.stringify(contacts));
  }, [contacts]);

  // Audio Device State
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [currentCaptureDev, setCurrentCaptureDev] = useState<number>(-1);
  const [currentPlaybackDev, setCurrentPlaybackDev] = useState<number>(-2);

  // Modals & Drawers
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);
  const [presence, setPresence] = useState<PresenceStatus>('available');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [settingsDefaultTab, setSettingsDefaultTab] = useState<SettingsTab>('audio');
  const [isLogDrawerOpen, setIsLogDrawerOpen] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Check window fullscreen state on mount
  useEffect(() => {
    if (window.pjsip?.isFullScreen) {
      window.pjsip.isFullScreen().then((fs) => setIsFullScreen(fs));
    }
    const cleanupFs = window.pjsip?.onFullScreenChange?.((fs) => {
      setIsFullScreen(fs);
    });
    return () => {
      if (cleanupFs) cleanupFs();
    };
  }, []);

  const handleOpenSettings = (tab: SettingsTab = 'audio') => {
    window.pjsip?.getAudioDevices();
    setSettingsDefaultTab(tab);
    setIsSettingsOpen(true);
  };

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (isLogDrawerOpen && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isLogDrawerOpen]);

  // Listen to PJSIP events from Electron preload bridge
  useEffect(() => {
    if (!window.pjsip) return;

    // Initial audio devices fetch
    window.pjsip.getAudioDevices();

    // Call state listener
    const cleanupCallState = window.pjsip.onCallState((state) => {
      console.log('[APP] Call state event:', state);
      if (state.state === 'INCOMING') {
        setIncomingCall(state);
        startRinger();
      } else if (state.state === 'CONFIRMED') {
        stopRinger();
        callStartTimeRef.current = Date.now();
        setIncomingCall(null);
        setActiveCall(state);
      } else if (state.state === 'DISCONNECTED') {
        stopRinger();
        setIncomingCall(null);

        // Record into Call History
        const durationSecs = callStartTimeRef.current > 0
          ? Math.max(0, Math.floor((Date.now() - callStartTimeRef.current) / 1000))
          : 0;

        if (activeCall) {
          const newRecord: CallRecord = {
            id: Date.now().toString(),
            remote_uri: activeCall.remote_uri,
            direction: 'outbound',
            status: durationSecs > 0 ? 'connected' : 'declined',
            duration: durationSecs,
            timestamp: Date.now(),
          };
          setCallHistory((prev) => [newRecord, ...prev.slice(0, 49)]);
        }

        callStartTimeRef.current = 0;

        setActiveCall({
          event: 'call_state',
          call_id: state.call_id,
          state: 'DISCONNECTED',
          remote_uri: state.remote_uri || 'Call',
          last_status: state.last_status,
          reason: state.reason || (state.last_status ? `Ended (${state.last_status})` : 'Call Ended'),
        });

        // Auto-dismiss after 2 seconds
        setTimeout(() => {
          setActiveCall((curr) => (curr?.state === 'DISCONNECTED' ? null : curr));
        }, 2000);
      } else {
        stopRinger();
        setIncomingCall(null);
        setActiveCall(state);
      }
    });

    // Registration state listener
    const cleanupRegState = window.pjsip.onRegState((reg: RegStateEvent) => {
      console.log('[APP] Registration event:', reg);
      setIsRegistered(reg.is_registered);
      if (reg.is_registered) {
        setRegistrationStatus('Registered');
      } else {
        const r = (reg.reason || '').toLowerCase();
        if (r.includes('gethostbyname') || r.includes('error') || r.includes('failed') || r.includes('timeout') || r.includes('unregistered') || r.includes('disconnect')) {
          setRegistrationStatus('Unregistered');
        } else {
          setRegistrationStatus(reg.reason || 'Unregistered');
        }
      }
    });

    // Audio devices listener
    const cleanupAudioDevices = window.pjsip.onAudioDevices((event: AudioDevicesEvent) => {
      setAudioDevices(event.devices || []);
      setCurrentCaptureDev(event.current_capture_dev);
      setCurrentPlaybackDev(event.current_playback_dev);
    });

    // Daemon status listener
    const cleanupDaemonStatus = window.pjsip.onDaemonStatus((status: DaemonStatusEvent) => {
      setIsDaemonRunning(status.isRunning);
    });

    // Live SIP logs from daemon
    const cleanupLog = window.pjsip.onLog((logText: string) => {
      setLogs((prev) => [...prev.slice(-200), logText.trim()]);
    });

    // Connect and register SIP extension for logged-in user or stored configuration
    const connectSipAccount = () => {
      if (!window.pjsip) return;
      try {
        const session = getStoredAuthSession();
        if (session?.user?.extension) {
          const sipConfig = extensionToSipConfig(session.user, session.savedPassword);
          if (sipConfig.password && sipConfig.password.trim().length > 0) {
            console.log('[App] Auto-connecting SIP for logged-in user:', sipConfig.username, 'to', sipConfig.server);
            setCurrentAccount(sipConfig);
            setRegistrationStatus('Registering...');
            window.pjsip.register(sipConfig);
            return;
          }
        }

        // Fallback: stored manual config
        const savedConfig = localStorage.getItem('pjsip_account_config');
        if (savedConfig) {
          const config: SipAccountConfig = JSON.parse(savedConfig);
          if (config.password && config.password.trim().length > 0) {
            console.log('[App] Auto-connecting SIP using stored config:', config.username);
            setCurrentAccount(config);
            setRegistrationStatus('Registering...');
            window.pjsip.register(config);
          }
        }
      } catch (e) {
        console.error('[App] Auto-connect error:', e);
      }
    };

    // Auto-connect immediately on listener mount if user is authenticated
    connectSipAccount();

    // Generic events
    const cleanupEvent = window.pjsip.onEvent((evt) => {
      if (evt.event === 'ready') {
        setIsDaemonRunning(true);
        connectSipAccount();
      }
    });

    return () => {
      cleanupCallState();
      cleanupRegState();
      cleanupAudioDevices();
      cleanupDaemonStatus();
      cleanupLog();
      cleanupEvent();
      stopRinger();
    };
  }, [activeCall]);

  // Handle Login Success
  const handleLoginSuccess = (loginResponse: LoginResponse, password?: string) => {
    const session: AuthSession = {
      accessToken: loginResponse.access,
      refreshToken: loginResponse.refresh,
      user: loginResponse.user,
      baseUrl: getStoredBaseUrl(),
      savedPassword: password,
    };
    setAuthSession(session);

    // Auto-select first calling-enabled DID if available
    const availableDids = loginResponse.user.dids?.filter((d) => d.calling_enabled !== false) || [];
    if (availableDids.length > 0 && !selectedDidId) {
      setSelectedDidId(availableDids[0].id);
    }

    // Auto-configure & register SIP extension
    if (loginResponse.user.extension) {
      const sipConfig = extensionToSipConfig(loginResponse.user, password);
      setCurrentAccount(sipConfig);
      if (sipConfig.password && sipConfig.password.trim().length > 0) {
        setRegistrationStatus('Registering...');
        window.pjsip?.register(sipConfig);
      } else {
        setRegistrationStatus('Enter Password');
        handleOpenSettings('sip');
      }
    }
  };

  // Handle Sign Out
  const handleSignOut = () => {
    // Notify backend to blacklist refresh token
    const token = authSession?.refreshToken;
    const url = authSession?.baseUrl;
    if (token) {
      logoutUser(token, url).catch(() => {});
    }

    clearAuthSession();
    window.pjsip?.unregister();
    setIsRegistered(false);
    setRegistrationStatus('Unregistered');
    setAuthSession(null);
    setSelectedDidId(null);
    setIsProfileMenuOpen(false);
    setIsSettingsOpen(false);
    setActiveCall(null);
    setIncomingCall(null);
  };

  // Softphone Actions with X-OverrideCID
  const handleMakeCall = useCallback(
    (destination: string) => {
      if (!window.pjsip) return;

      // Extract 10-digit CID from selected DID
      let extraHeaders: Record<string, string> | undefined = undefined;
      if (authSession?.user?.dids && selectedDidId) {
        const did = authSession.user.dids.find((d) => d.id === selectedDidId);
        if (did) {
          const tenDigitCid = extract10DigitCID(did.number || did.did_number || '');
          if (tenDigitCid) {
            extraHeaders = {
              'X-OverrideCID': tenDigitCid,
            };
            console.log('[APP] Initiating call with X-OverrideCID:', tenDigitCid);
          }
        }
      }

      window.pjsip.makeCall(destination, extraHeaders);
      callStartTimeRef.current = 0;
      // Optimistic active call state
      setActiveCall({
        event: 'call_state',
        call_id: 0,
        state: 'CALLING',
        remote_uri: destination,
      });
    },
    [authSession, selectedDidId]
  );

  const handleAnswerCall = (callId: number) => {
    stopRinger();
    if (!window.pjsip) return;
    window.pjsip.answerCall(callId);
    callStartTimeRef.current = Date.now();
    if (incomingCall) {
      setActiveCall({
        ...incomingCall,
        state: 'CONFIRMED',
      });
      setIncomingCall(null);
    }
  };

  const handleDeclineCall = (callId: number) => {
    stopRinger();
    if (!window.pjsip) return;
    window.pjsip.hangupCall(callId);
    if (incomingCall) {
      const newRecord: CallRecord = {
        id: Date.now().toString(),
        remote_uri: incomingCall.remote_uri,
        direction: 'inbound',
        status: 'missed',
        duration: 0,
        timestamp: Date.now(),
      };
      setCallHistory((prev) => [newRecord, ...prev.slice(0, 49)]);
    }
    setIncomingCall(null);
  };

  const handleHangup = (callId: number) => {
    stopRinger();
    if (window.pjsip) {
      window.pjsip.hangupCall(callId);
    }
    setActiveCall(null);
  };

  const handleMute = (callId: number, mute: boolean) => {
    window.pjsip?.muteCall(callId, mute);
  };

  const handleHold = (callId: number, hold: boolean) => {
    window.pjsip?.holdCall(callId, hold);
  };

  const handleSendDtmf = (callId: number, digits: string) => {
    window.pjsip?.sendDtmf(callId, digits);
  };

  const handleSaveAndRegister = (config: SipAccountConfig) => {
    localStorage.setItem('pjsip_account_config', JSON.stringify(config));
    setCurrentAccount(config);
    setRegistrationStatus('Registering...');
    window.pjsip?.register(config);
    setIsSettingsOpen(false);
  };

  const handleUnregister = () => {
    window.pjsip?.unregister();
    setIsSettingsOpen(false);
  };

  const handleSelectAudioDevices = (captureDev: number, playbackDev: number) => {
    window.pjsip?.setAudioDevice(captureDev, playbackDev);
    setCurrentCaptureDev(captureDev);
    setCurrentPlaybackDev(playbackDev);
  };

  const handleRefreshDevices = () => {
    window.pjsip?.getAudioDevices();
  };

  const handleAddContact = (newContact: Omit<Contact, 'id'>) => {
    const contact: Contact = {
      ...newContact,
      id: Date.now().toString(),
    };
    setContacts((prev) => [contact, ...prev]);
  };

  const handleDeleteContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const handleClearHistory = () => {
    setCallHistory([]);
  };

  const handleTabChange = (tab: NavTab) => {
    setActiveTab(tab);
  };

  // If not authenticated, render Login Screen
  if (!authSession) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  const user = authSession.user;
  const displayName = user.email.split('@')[0];
  const extensionNum = user.extension?.extension_number || currentAccount?.username || 'hirakpatel';

  return (
    <div className="relative flex flex-col h-screen w-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 overflow-hidden select-none transition-colors duration-200">
      {/* Top Full-Width Window Titlebar & Header */}
      <header className="titlebar-drag flex items-center justify-between px-3 md:px-4 h-11 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/70 backdrop-blur-md z-30 shrink-0">
        {/* Left Branding / macOS Traffic Lights Area */}
        <div className="flex items-center min-w-0 gap-2">
          {/* macOS Traffic Lights Clearance Spacer: 72px in windowed/maximized mode, 0 in native fullscreen */}
          {!isFullScreen && (
            <div className="w-[72px] shrink-0 pointer-events-none transition-all duration-200" />
          )}

          {/* TCX Connect App Title */}
          <div className="flex items-center gap-2 select-none py-1">
            <span className="font-bold text-xs tracking-tight text-slate-800 dark:text-slate-200">
              TCX Connect
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 font-semibold font-mono">
              v1.0
            </span>
          </div>
        </div>

        <div className="no-drag flex items-center gap-1.5">
          {/* Live SIP Log Console (Mobile Only - Desktop has it in Sidebar) */}
          <button
            onClick={() => setIsLogDrawerOpen(!isLogDrawerOpen)}
            title="Live SIP Log Console"
            className={`md:hidden p-1.5 rounded-xl transition-colors cursor-pointer ${isLogDrawerOpen
                ? 'bg-brand-600/20 text-brand-600 dark:text-brand-300'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
          >
            <Terminal className="w-4 h-4" />
          </button>

          {/* Preferences & Settings Trigger (Mobile Only - Desktop has it in Sidebar) */}
          <button
            onClick={() => handleOpenSettings('audio')}
            title="Preferences & Settings (Audio, Themes, SIP)"
            className="md:hidden relative p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span
              className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${
                isRegistered ? 'bg-emerald-500' : 'bg-amber-400'
              }`}
            />
          </button>

          {/* User Profile Badge with Live Presence Indicator */}
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            title={isRegistered ? `${displayName} (${presence})` : isDaemonRunning ? registrationStatus || 'Unregistered' : 'Connecting to PJSIP...'}
            className="relative group p-0.5 rounded-xl transition-transform hover:scale-105 cursor-pointer ml-1"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {(displayName || 'HP').slice(0, 2).toUpperCase()}
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${isRegistered
                  ? presence === 'available'
                    ? 'bg-emerald-500 ring-1 ring-emerald-500/40'
                    : presence === 'busy' || presence === 'dnd'
                      ? 'bg-rose-500 ring-1 ring-rose-500/40'
                      : 'bg-amber-400 ring-1 ring-amber-400/40'
                  : registrationStatus.toLowerCase().includes('reg')
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-slate-400'
                }`}
            />
          </button>
        </div>
      </header>

      {/* Main Body: Desktop Left Sidebar + Content Viewport */}
      <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
        {/* Desktop Left Sidebar Rail with bottom settings trigger */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onOpenSettings={() => handleOpenSettings('audio')}
          onOpenLogs={() => setIsLogDrawerOpen(!isLogDrawerOpen)}
          isLogsOpen={isLogDrawerOpen}
          isRegistered={isRegistered}
          features={user.features}
        />

        {/* Content Viewport */}
        <main className="flex-1 flex flex-col p-2.5 sm:p-4 md:p-5 overflow-y-auto w-full">
          {activeCall ? (
            <div className="flex-1 flex items-center justify-center">
              <ActiveCall
                callId={activeCall.call_id}
                remoteUri={activeCall.remote_uri}
                state={activeCall.state}
                reason={activeCall.reason}
                lastStatus={activeCall.last_status}
                onHangup={handleHangup}
                onMute={handleMute}
                onHold={handleHold}
                onSendDtmf={handleSendDtmf}
                onOpenAudioModal={() => handleOpenSettings('audio')}
              />
            </div>
          ) : (
            <div className="w-full h-full flex flex-col">
              {activeTab === 'dashboard' && (
                <DashboardView
                  user={user}
                  account={currentAccount}
                  isRegistered={isRegistered}
                  registrationStatus={registrationStatus}
                  history={callHistory}
                  contacts={contacts}
                  dids={user.dids || []}
                  selectedDidId={selectedDidId}
                  onNavigateTab={handleTabChange}
                  onCall={handleMakeCall}
                  onOpenSettings={() => handleOpenSettings('audio')}
                />
              )}

              {activeTab === 'keypad' && (
                <Dialpad
                  onCall={handleMakeCall}
                  callingFrom={`${currentAccount?.username || extensionNum} (${currentAccount?.server || 'sip.example.com'})`}
                  onOpenSettings={() => handleOpenSettings('sip')}
                  contacts={contacts}
                  dids={authSession?.user?.dids || []}
                  selectedDidId={selectedDidId}
                  onSelectDid={setSelectedDidId}
                  lastCalledNumber={
                    callHistory.length > 0
                      ? callHistory[0].remote_uri.replace(/^sip:/i, '').split('@')[0]
                      : undefined
                  }
                />
              )}

              {activeTab === 'recents' && (
                <CallHistory
                  history={callHistory}
                  onCall={handleMakeCall}
                  onClearHistory={handleClearHistory}
                />
              )}

              {activeTab === 'voicemail' && (
                <VoicemailView
                  onCall={handleMakeCall}
                  voicemailBoxes={user.voicemail_boxes || []}
                />
              )}

              {activeTab === 'messaging' && (
                <MessagingView
                  dids={user.dids || []}
                  selectedDidId={selectedDidId}
                  onSelectDid={setSelectedDidId}
                  onCall={handleMakeCall}
                />
              )}

              {activeTab === 'fax' && (
                <FaxView
                  faxBoxes={user.fax_boxes || []}
                  dids={user.dids || []}
                  selectedDidId={selectedDidId}
                />
              )}

              {activeTab === 'contacts' && (
                <Contacts
                  contacts={contacts}
                  onCall={handleMakeCall}
                  onAddContact={handleAddContact}
                  onDeleteContact={handleDeleteContact}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Bottom Navigation Bar for mobile */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenSettings={() => handleOpenSettings('audio')}
        isRegistered={isRegistered}
        features={user.features}
      />

      {/* Incoming Call Alert Modal */}
      {incomingCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-xs rounded-3xl p-6 shadow-2xl border border-emerald-500/40 text-center animate-bounce-subtle bg-white dark:bg-slate-900">
            <div className="relative flex items-center justify-center w-24 h-24 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping"></div>
              <div className="relative z-10 flex items-center justify-center w-18 h-18 rounded-full bg-emerald-600 text-white shadow-xl shadow-emerald-500/40">
                <PhoneIncoming className="w-8 h-8 animate-pulse" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">Incoming Call</h3>
            <p className="text-sm font-mono text-emerald-600 dark:text-emerald-400 mb-6 truncate">
              {incomingCall.remote_uri.replace(/^sip:/i, '')}
            </p>

            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() => handleDeclineCall(incomingCall.call_id)}
                className="flex items-center justify-center w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 text-white shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
                title="Decline"
              >
                <PhoneOff className="w-6 h-6" />
              </button>

              <button
                onClick={() => handleAnswerCall(incomingCall.call_id)}
                className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white shadow-lg shadow-emerald-500/40 transition-all cursor-pointer"
                title="Answer"
              >
                <Check className="w-8 h-8 stroke-[3]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live SIP Log Console Drawer */}
      {isLogDrawerOpen && (
        <div className="absolute bottom-0 inset-x-0 h-64 bg-slate-950/95 border-t border-slate-800 backdrop-blur-xl z-40 flex flex-col shadow-2xl animate-fadeIn">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/80 bg-slate-900/50">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs font-mono font-semibold text-slate-300">Live PJSIP / SIP Logs</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 font-mono">
                {logs.length} lines
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLogs([])}
                title="Clear Logs"
                className="p-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsLogDrawerOpen(false)}
                title="Close Drawer"
                className="p-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 p-2.5 overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-300 space-y-0.5 selection:bg-indigo-500/30">
            {logs.length === 0 ? (
              <p className="text-slate-500 italic">No logs received yet. SIP events will appear here in real time...</p>
            ) : (
              logs.map((line, idx) => (
                <div key={idx} className="whitespace-pre-wrap break-all hover:bg-white/[0.03] px-1 rounded">
                  {line}
                </div>
              ))
            )}
            <div ref={logEndRef} />
          </div>
        </div>
      )}

      {/* Dialpad-style Profile Dropdown Menu */}
      <ProfileMenu
        isOpen={isProfileMenuOpen}
        onClose={() => setIsProfileMenuOpen(false)}
        displayName={displayName}
        username={currentAccount?.username || extensionNum}
        server={currentAccount?.server || 'sip.example.com'}
        isRegistered={isRegistered}
        registrationStatus={registrationStatus}
        presence={presence}
        onChangePresence={setPresence}
        onViewProfile={() => handleOpenSettings('account')}
        onSignOut={handleSignOut}
        authUser={authSession.user}
      />

      {/* Unified Revamped Preferences & Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        defaultTab={settingsDefaultTab}
        devices={audioDevices}
        currentCaptureDev={currentCaptureDev}
        currentPlaybackDev={currentPlaybackDev}
        onSelectDevices={handleSelectAudioDevices}
        onRefreshDevices={handleRefreshDevices}
        theme={theme}
        onSetTheme={handleSetTheme}
        currentAccount={currentAccount}
        isRegistered={isRegistered}
        registrationStatus={registrationStatus}
        onSaveAndRegister={handleSaveAndRegister}
        onUnregister={handleUnregister}
        authUser={authSession.user}
      />
    </div>
  );
};
