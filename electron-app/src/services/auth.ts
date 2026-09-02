import { AuthSession, AuthUser, LoginCredentials, LoginResponse } from '../types/auth';
import { SipAccountConfig } from '../types/pjsip';

export const DEFAULT_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  'http://127.0.0.1:8000/api/v1';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  USER: 'auth_user',
  BASE_URL: 'auth_base_url',
  SAVED_PASSWORD: 'auth_saved_password',
  SIP_CONFIG: 'pjsip_account_config',
};

export function normalizeBaseUrl(url?: string): string {
  if (!url || !url.trim()) return DEFAULT_BASE_URL;
  let trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `http://${trimmed}`;
  }
  return trimmed.replace(/\/+$/, '');
}

export function getStoredBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL;
  const stored = localStorage.getItem(STORAGE_KEYS.BASE_URL);

  if (envUrl) {
    if (!stored || stored === 'http://127.0.0.1:8000/api/v1') {
      return normalizeBaseUrl(envUrl);
    }
  }

  return stored || DEFAULT_BASE_URL;
}

export function saveStoredBaseUrl(url: string): void {
  localStorage.setItem(STORAGE_KEYS.BASE_URL, normalizeBaseUrl(url));
}

/**
 * Normalizes a DID / phone number to 10 digits for the X-OverrideCID SIP header.
 * E.g., "+18332715337" -> "8332715337", "18332715337" -> "8332715337", "8332715337" -> "8332715337"
 */
export function extract10DigitCID(numberStr: string): string {
  if (!numberStr) return '';
  const digits = numberStr.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.slice(1);
  }
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
}

/**
 * Derives the effective SIP domain for PBX registration:
 * 1. Checks user.extension.sipdomain or user.extension.sip_domain
 * 2. Checks user.effective_sip_domain / user.sip_domain / user.tenant.sip_domain / user.extension.sip_server
 * 3. Falls back to import.meta.env.VITE_SIP_DOMAIN
 * 4. Fallback: '127.0.0.1'
 */
export function getEffectiveSipDomain(user: AuthUser): string {
  const envDomain = import.meta.env.VITE_SIP_DOMAIN;
  const ext = user.extension as any;

  // 1. Direct extension SIP domain (supports data.extension.sipdomain or sip_domain)
  if (ext?.sipdomain && typeof ext.sipdomain === 'string' && ext.sipdomain.trim()) {
    return ext.sipdomain.trim();
  }
  if (ext?.sip_domain && typeof ext.sip_domain === 'string' && ext.sip_domain.trim()) {
    return ext.sip_domain.trim();
  }

  // 2. User / Tenant level SIP domain
  if (user.effective_sip_domain && user.effective_sip_domain.trim()) {
    return user.effective_sip_domain.trim();
  }
  if (user.sip_domain && user.sip_domain.trim()) {
    return user.sip_domain.trim();
  }
  if (user.tenant?.sip_domain && user.tenant.sip_domain.trim()) {
    return user.tenant.sip_domain.trim();
  }
  if (ext?.sip_server && typeof ext.sip_server === 'string' && ext.sip_server.trim()) {
    return ext.sip_server.trim();
  }

  // 3. Fallback to .env configuration
  if (envDomain && typeof envDomain === 'string' && envDomain.trim()) {
    return envDomain.trim();
  }

  return '127.0.0.1';
}

export function extensionToSipConfig(
  user: AuthUser,
  fallbackPassword?: string
): SipAccountConfig {
  const ext = user.extension;
  const transportStr = (ext?.transport_type || 'TLS').toLowerCase();
  const transport: 'udp' | 'tcp' | 'tls' =
    transportStr === 'udp' || transportStr === 'tcp' || transportStr === 'tls'
      ? transportStr
      : 'tls';

  // TLS standard port is 5061, TCP/UDP default to 5060
  const port = transport === 'tls' ? 5061 : 5060;
  const sipServer = getEffectiveSipDomain(user);
  const sipPassword = ext?.sip_password || fallbackPassword || '';

  return {
    server: sipServer,
    port,
    username: ext?.sip_username || ext?.extension_number || '',
    auth_id: ext?.sip_username || ext?.extension_number || '',
    password: sipPassword,
    transport,
  };
}

export async function loginUser(credentials: LoginCredentials): Promise<LoginResponse> {
  const baseUrl = normalizeBaseUrl(credentials.baseUrl || getStoredBaseUrl());
  const loginUrl = `${baseUrl}/auth/login/`;

  try {
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        email: credentials.email.trim(),
        password: credentials.password,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      let errorMessage = `Login failed (HTTP ${response.status})`;
      if (data) {
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
          errorMessage = data.non_field_errors.join(' ');
        } else {
          // Flatten field errors like { email: ['...'] }
          const errors = Object.entries(data)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join('; ');
          if (errors) errorMessage = errors;
        }
      }
      throw new Error(errorMessage);
    }

    if (!data || !data.access || !data.user) {
      throw new Error('Invalid response structure received from authentication server.');
    }

    return data as LoginResponse;
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error(
        `Unable to reach backend. Please contact administrator.`
      );
    }
    throw err;
  }
}

export function saveAuthSession(
  loginData: LoginResponse,
  baseUrl: string,
  password?: string
): AuthSession {
  const normalizedUrl = normalizeBaseUrl(baseUrl);
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, loginData.access);
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, loginData.refresh);
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(loginData.user));
  localStorage.setItem(STORAGE_KEYS.BASE_URL, normalizedUrl);

  if (password) {
    localStorage.setItem(STORAGE_KEYS.SAVED_PASSWORD, password);
  }

  // Automatically derive and store SIP configuration for PJSIP daemon
  if (loginData.user.extension) {
    const sipConfig = extensionToSipConfig(loginData.user, password);
    localStorage.setItem(STORAGE_KEYS.SIP_CONFIG, JSON.stringify(sipConfig));
  }

  return {
    accessToken: loginData.access,
    refreshToken: loginData.refresh,
    user: loginData.user,
    baseUrl: normalizedUrl,
    savedPassword: password,
  };
}

export function getStoredAuthSession(): AuthSession | null {
  try {
    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    const userJson = localStorage.getItem(STORAGE_KEYS.USER);
    const baseUrl = localStorage.getItem(STORAGE_KEYS.BASE_URL) || DEFAULT_BASE_URL;
    const savedPassword = localStorage.getItem(STORAGE_KEYS.SAVED_PASSWORD) || undefined;

    if (accessToken && refreshToken && userJson) {
      const user: AuthUser = JSON.parse(userJson);
      return {
        accessToken,
        refreshToken,
        user,
        baseUrl,
        savedPassword,
      };
    }
  } catch (e) {
    console.error('[AuthService] Error reading stored session:', e);
  }
  return null;
}

export async function logoutUser(refreshToken?: string, baseUrl?: string): Promise<void> {
  const token = refreshToken || localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  if (!token) return;

  const resolvedBaseUrl = normalizeBaseUrl(baseUrl || getStoredBaseUrl());
  const logoutUrl = `${resolvedBaseUrl}/auth/logout/`;

  try {
    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    await fetch(logoutUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({ refresh: token }),
    });
    console.log('[AuthService] Successfully logged out on server.');
  } catch (err) {
    // Graceful fallback: local logout proceeds even if server endpoint fails or is offline
    console.warn('[AuthService] Logout API request failed (proceeding with local cleanup):', err);
  }
}

export function clearAuthSession(clearAll: boolean = true): void {
  if (clearAll) {
    // Preserve theme preference if desired, but clear all user session/base_url/credentials/SIP config
    const theme = localStorage.getItem('app_theme');
    localStorage.clear();
    if (theme) {
      localStorage.setItem('app_theme', theme);
    }
  } else {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.SAVED_PASSWORD);
    localStorage.removeItem(STORAGE_KEYS.BASE_URL);
    localStorage.removeItem(STORAGE_KEYS.SIP_CONFIG);
  }
}

