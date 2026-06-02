// ─── Connectors Type System ───────────────────────────────────────────
// Jarvis-OS Connectors Marketplace & MCP Management
// Phase 11.1 — Claude-like connector experience

export type ConnectorType = 'mcp' | 'custom_api' | 'n8n' | 'typescript_sdk';
export type ConnectorTransport = 'stdio' | 'sse' | 'http' | 'websocket';
export type ConnectorAuthType = 'none' | 'api_key' | 'oauth2' | 'bearer' | 'basic';
export type ConnectorStatus = 'connected' | 'disconnected' | 'error' | 'configuring' | 'testing';
export type MarketplaceCategory = 'all' | 'mcp' | 'api' | 'n8n' | 'sdk' | 'featured';

export interface OAuthConfig {
  clientId: string;
  clientSecret?: string;
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  redirectUri: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface ConnectorDefinition {
  id: string;
  name: string;
  type: ConnectorType;
  description: string;
  icon: string;
  transport: ConnectorTransport;
  authType: ConnectorAuthType;
  endpoint?: string;
  apiKey?: string;
  oauthConfig?: OAuthConfig;
  headers?: Record<string, string>;
  status: ConnectorStatus;
  lastTested?: number;
  createdAt: number;
  updatedAt: number;
  category: string;
  tags: string[];
  version?: string;
  serverCommand?: string;
  serverArgs?: string[];
  errorMessage?: string;
}

export interface MarketplaceEntry {
  id: string;
  name: string;
  type: ConnectorType;
  description: string;
  longDescription?: string;
  icon: string;
  category: string;
  installs: number;
  rating: number;
  author: string;
  version: string;
  transport: ConnectorTransport;
  authTypes: ConnectorAuthType[];
  homepage?: string;
  docs?: string;
  configTemplate: Partial<ConnectorDefinition>;
}

// ─── Category & Transport Helpers ────────────────────────────────────

export const CONNECTOR_TYPE_LABELS: Record<ConnectorType, string> = {
  mcp: 'MCP Server',
  custom_api: 'Custom API',
  n8n: 'n8n Workflow',
  typescript_sdk: 'TypeScript SDK',
};

export const TRANSPORT_LABELS: Record<ConnectorTransport, string> = {
  stdio: 'Standard I/O',
  sse: 'Server-Sent Events',
  http: 'HTTP REST',
  websocket: 'WebSocket',
};

export const AUTH_TYPE_LABELS: Record<ConnectorAuthType, string> = {
  none: 'No Auth',
  api_key: 'API Key',
  oauth2: 'OAuth 2.0',
  bearer: 'Bearer Token',
  basic: 'Basic Auth',
};

export const STATUS_COLORS: Record<ConnectorStatus, string> = {
  connected: 'bg-emerald-500',
  disconnected: 'bg-zinc-600',
  error: 'bg-red-500',
  configuring: 'bg-amber-500',
  testing: 'bg-blue-500 animate-pulse',
};

export const STATUS_LABELS: Record<ConnectorStatus, string> = {
  connected: 'Connected',
  disconnected: 'Disconnected',
  error: 'Error',
  configuring: 'Configuring',
  testing: 'Testing…',
};

export const CATEGORY_COLORS: Record<string, string> = {
  mcp: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
  api: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  n8n: 'text-pink-400 border-pink-500/30 bg-pink-500/10',
  sdk: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
};

export function generateConnectorId(): string {
  return `conn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
