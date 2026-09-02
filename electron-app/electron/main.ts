import { app, BrowserWindow, ipcMain, powerSaveBlocker } from 'electron';
import path from 'path';
import { PjsipService, SipAccountConfig } from './pjsip-service';

let mainWindow: BrowserWindow | null = null;
let powerBlockerId: number | null = null;
const pjsipService = PjsipService.getInstance();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 440,
    minHeight: 600,
    title: 'TCX Connect',
    backgroundColor: '#0B0F19',
    titleBarStyle: 'hiddenInset',
    vibrancy: 'under-window',
    visualEffectState: 'active',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false, // Prevents timer/audio throttling in background
    },
  });

  // Start with maximized mode
  mainWindow.maximize();

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.webContents.on('did-finish-load', () => {
    if (pjsipService.getIsReady() && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('pjsip:event', { event: 'ready', version: '2.17', webrtc_aec: true });
      mainWindow.webContents.send('pjsip:daemon_status', { isRunning: true });
    }
  });

  mainWindow.on('enter-full-screen', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window:fullscreen_change', true);
    }
  });

  mainWindow.on('leave-full-screen', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window:fullscreen_change', false);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Setup PJSIP event forwarding to Renderer
function setupPjsipListeners() {
  pjsipService.on('event', (eventData) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('pjsip:event', eventData);
    }
  });

  pjsipService.on('call_state', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('pjsip:call_state', data);
    }
  });

  pjsipService.on('reg_state', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('pjsip:reg_state', data);
    }
  });

  pjsipService.on('audio_devices', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('pjsip:audio_devices', data);
    }
  });

  pjsipService.on('daemon_status', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('pjsip:daemon_status', data);
    }
  });

  pjsipService.on('log', (logText) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('pjsip:log', logText);
    }
  });
}

// Setup IPC handlers from Renderer to PJSIP Service
function setupIpcHandlers() {
  ipcMain.handle('pjsip:register', (_, config: SipAccountConfig) => {
    return pjsipService.register(config);
  });

  ipcMain.handle('pjsip:unregister', () => {
    return pjsipService.unregister();
  });

  ipcMain.handle('pjsip:make_call', (_, destination: string, extraHeaders?: Record<string, string>) => {
    return pjsipService.makeCall(destination, extraHeaders);
  });

  ipcMain.handle('pjsip:answer', (_, callId: number) => {
    return pjsipService.answerCall(callId);
  });

  ipcMain.handle('pjsip:hangup', (_, callId: number) => {
    return pjsipService.hangupCall(callId);
  });

  ipcMain.handle('pjsip:mute', (_, { callId, mute }: { callId: number; mute: boolean }) => {
    return pjsipService.muteCall(callId, mute);
  });

  ipcMain.handle('pjsip:hold', (_, { callId, hold }: { callId: number; hold: boolean }) => {
    return pjsipService.holdCall(callId, hold);
  });

  ipcMain.handle('pjsip:send_dtmf', (_, { callId, digits }: { callId: number; digits: string }) => {
    return pjsipService.sendDtmf(callId, digits);
  });

  ipcMain.handle('pjsip:get_audio_devices', () => {
    return pjsipService.getAudioDevices();
  });

  ipcMain.handle('pjsip:set_audio_device', (_, { captureDev, playbackDev }: { captureDev: number; playbackDev: number }) => {
    return pjsipService.setAudioDevice(captureDev, playbackDev);
  });

  ipcMain.handle('window:toggle_maximize', () => {
    if (!mainWindow) return false;
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
      return false;
    } else {
      mainWindow.maximize();
      return true;
    }
  });

  ipcMain.handle('window:is_maximized', () => {
    return mainWindow ? mainWindow.isMaximized() : false;
  });

  ipcMain.handle('window:is_fullscreen', () => {
    return mainWindow ? mainWindow.isFullScreen() : false;
  });
}

app.whenReady().then(() => {
  setupIpcHandlers();
  setupPjsipListeners();
  
  // Prevent macOS app suspension / hibernation so SIP keepalives & audio RTP remain active
  powerBlockerId = powerSaveBlocker.start('prevent-app-suspension');
  console.log(`[Main] Hibernation prevention active (powerSaveBlocker ID: ${powerBlockerId})`);

  // Start PJSIP Daemon
  pjsipService.start();

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Clean shutdown
let isQuitting = false;
app.on('before-quit', async (event) => {
  if (!isQuitting) {
    event.preventDefault();
    isQuitting = true;
    console.log('[Main] Shutting down PJSIP daemon before app exit...');
    if (powerBlockerId !== null && powerSaveBlocker.isStarted(powerBlockerId)) {
      powerSaveBlocker.stop(powerBlockerId);
    }
    try {
      await pjsipService.shutdown();
    } catch (e) {
      console.error('[Main] Shutdown error:', e);
    }
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
