export interface Tenant {
  id: string;
  freeswitch_tenant_uuid: string;
  tenant_code: string;
  tenant_name: string;
  sip_domain?: string;
}

export interface UserFeatures {
  fax?: boolean;
  calling?: boolean;
  messaging?: boolean;
  voicemail?: boolean;
}

export interface ExtensionConfig {
  id: string;
  extension_number: string;
  sip_username: string;
  sip_password?: string;
  sip_domain?: string;
  sip_server?: string;
  transport_type: string;
}

export interface UserDID {
  id: string;
  number: string;
  name?: string;
  did_number?: string;
  did_name?: string;
  calling_enabled: boolean;
  messaging_enabled: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  tenant: Tenant;
  sip_domain?: string;
  effective_sip_domain?: string;
  features: UserFeatures;
  extension: ExtensionConfig;
  dids: UserDID[];
  fax_boxes: any[];
  voicemail_boxes: any[];
  created_at: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: AuthUser;
}

export interface LoginCredentials {
  email: string;
  password: string;
  baseUrl?: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  baseUrl: string;
  savedPassword?: string;
}
