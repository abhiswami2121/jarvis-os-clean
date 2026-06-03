"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Paperclip,
  Braces,
  CreditCard,
  MessageSquare,
  Workflow,
  Globe,
  BarChart3,
  Terminal,
  Brain,
  Search,
  BookOpen,
  X,
  Play,
  Eye,
  Send,
  Settings,
  ChevronRight,
  Activity,
  FileText,
  Zap,
  RefreshCw,
} from "lucide-react";
import { useConnectorsStore } from "@/lib/stores/connectors-store";

// ── Connector with actions ──────────────────────────────────────

interface ConnectorAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  intent: string;
}

interface ConnectorItem {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: "connector" | "upload";
  status?: "live" | "configured" | "available";
  badge?: string;
  actions?: ConnectorAction[];
}

/**
 * Icon name → Lucide icon component mapping.
 * Used to render icons for store connector types.
 */
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  mcp: Braces,
  slack: MessageSquare,
  nmi: CreditCard,
  ghl: Workflow,
  resend: Globe,
  hyperswitch: CreditCard,
  twenty: BarChart3,
  linear: Terminal,
  n8n: Workflow,
  dify: Brain,
  langfuse: Search,
  notebooklm: BookOpen,
  api: Globe,
  default: Braces,
};

function iconForId(id: string): React.ComponentType<{ className?: string }> {
  const key = id.toLowerCase();
  return ICON_MAP[key] || ICON_MAP.default;
}

const HARDCODED_CONNECTORS: ConnectorItem[] = [
  // ── Upload ──
  {
    id: "upload",
    label: "Upload File",
    description: "PDF, images, CSVs, code, markdown",
    icon: Paperclip,
    category: "upload",
  },

  // ── Live Connectors (with actions) ──
  {
    id: "mcp",
    label: "MCP Connections",
    description: "Model Context Protocol servers",
    icon: Braces,
    category: "connector",
    status: "live",
    badge: "3 active",
    actions: [
      { id: "mcp-browse", label: "Browse Servers", icon: Eye, intent: "browse_mcp" },
      { id: "mcp-test", label: "Test Connections", icon: Activity, intent: "test_mcp" },
      { id: "mcp-configure", label: "Configure", icon: Settings, intent: "configure_mcp" },
    ],
  },
  {
    id: "nmi",
    label: "NMI Payments",
    description: "Payment gateway & customer vaults",
    icon: CreditCard,
    category: "connector",
    status: "live",
    actions: [
      { id: "nmi-charge", label: "Charge Customer", icon: Zap, intent: "nmi_charge" },
      { id: "nmi-txns", label: "View Transactions", icon: FileText, intent: "nmi_transactions" },
      { id: "nmi-link", label: "Create Payment Link", icon: Send, intent: "nmi_payment_link" },
    ],
  },
  {
    id: "slack",
    label: "Slack",
    description: "Messaging & notifications",
    icon: MessageSquare,
    category: "connector",
    status: "live",
    actions: [
      { id: "slack-send", label: "Send Message", icon: Send, intent: "slack_send" },
      { id: "slack-search", label: "Search Messages", icon: Search, intent: "slack_search" },
      { id: "slack-view", label: "View Channel", icon: Eye, intent: "slack_view" },
    ],
  },
  {
    id: "ghl",
    label: "GoHighLevel",
    description: "CRM sync & pipelines",
    icon: Workflow,
    category: "connector",
    status: "live",
    actions: [
      { id: "ghl-contacts", label: "View Contacts", icon: Eye, intent: "ghl_contacts" },
      { id: "ghl-sync", label: "Sync Pipeline", icon: RefreshCw, intent: "ghl_sync" },
    ],
  },
  {
    id: "resend",
    label: "Resend Email",
    description: "Transactional email delivery",
    icon: Globe,
    category: "connector",
    status: "live",
    actions: [
      { id: "resend-send", label: "Send Email", icon: Send, intent: "resend_send" },
      { id: "resend-templates", label: "View Templates", icon: FileText, intent: "resend_templates" },
    ],
  },

  // ── Configured Connectors ──
  {
    id: "hyperswitch",
    label: "Hyperswitch",
    description: "Payment routing & checkout",
    icon: CreditCard,
    category: "connector",
    status: "configured",
    actions: [
      { id: "hs-link", label: "Create Payment Link", icon: Send, intent: "hs_payment_link" },
      { id: "hs-txns", label: "View Transactions", icon: FileText, intent: "hs_transactions" },
      { id: "hs-config", label: "Configure", icon: Settings, intent: "hs_configure" },
    ],
  },
  {
    id: "twenty",
    label: "Twenty CRM",
    description: "Self-hosted CRM",
    icon: BarChart3,
    category: "connector",
    status: "configured",
    actions: [
      { id: "twenty-contacts", label: "View Contacts", icon: Eye, intent: "twenty_contacts" },
      { id: "twenty-deals", label: "View Deals", icon: FileText, intent: "twenty_deals" },
      { id: "twenty-sync", label: "Sync Status", icon: Activity, intent: "twenty_sync" },
    ],
  },
  {
    id: "linear",
    label: "Linear",
    description: "Project & sprint management",
    icon: Terminal,
    category: "connector",
    status: "configured",
    actions: [
      { id: "linear-issues", label: "View Issues", icon: Eye, intent: "linear_issues" },
      { id: "linear-create", label: "Create Issue", icon: Plus, intent: "linear_create" },
      { id: "linear-sprint", label: "Sprint Status", icon: Activity, intent: "linear_sprint" },
    ],
  },
  {
    id: "n8n",
    label: "n8n",
    description: "Workflow automation",
    icon: Workflow,
    category: "connector",
    status: "configured",
    actions: [
      { id: "n8n-trigger", label: "Trigger Workflow", icon: Play, intent: "n8n_trigger" },
      { id: "n8n-execs", label: "View Executions", icon: FileText, intent: "n8n_executions" },
    ],
  },
  {
    id: "dify",
    label: "Dify",
    description: "AI app platform",
    icon: Brain,
    category: "connector",
    status: "configured",
    actions: [
      { id: "dify-run", label: "Run App", icon: Play, intent: "dify_run" },
      { id: "dify-logs", label: "View Logs", icon: FileText, intent: "dify_logs" },
      { id: "dify-config", label: "Configure", icon: Settings, intent: "dify_configure" },
    ],
  },
  {
    id: "langfuse",
    label: "Langfuse",
    description: "LLM observability",
    icon: Search,
    category: "connector",
    status: "configured",
    actions: [
      { id: "langfuse-traces", label: "View Traces", icon: Eye, intent: "langfuse_traces" },
      { id: "langfuse-sessions", label: "View Sessions", icon: Activity, intent: "langfuse_sessions" },
    ],
  },
  {
    id: "notebooklm",
    label: "NotebookLM",
    description: "Deep research & audio",
    icon: BookOpen,
    category: "connector",
    status: "configured",
    actions: [
      { id: "nlm-query", label: "Query Notebook", icon: Search, intent: "nlm_query" },
      { id: "nlm-add", label: "Add Source", icon: Plus, intent: "nlm_add_source" },
      { id: "nlm-audio", label: "Create Audio", icon: Play, intent: "nlm_audio" },
    ],
  },
];

const STATUS_COLORS: Record<string, string> = {
  live: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  configured: "bg-amber-500/10 text-amber-400/80 border-amber-500/15",
  available: "bg-zinc-500/10 text-zinc-400 border-zinc-500/15",
};

const STATUS_DOT: Record<string, string> = {
  live: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.4)]",
  configured: "bg-amber-400/70",
  available: "bg-zinc-500/50",
};

// ── Component ─────────────────────────────────────────────────

interface ConnectorMenuProps {
  onUploadClick?: () => void;
  onConnectorClick?: (id: string) => void;
  onConnectorAction?: (connectorId: string, action: ConnectorAction) => void;
}

export function ConnectorMenu({ onUploadClick, onConnectorClick, onConnectorAction }: ConnectorMenuProps) {
  const [open, setOpen] = useState(false);
  const [expandedConnector, setExpandedConnector] = useState<string | null>(null);

  // ── Merge store connectors with hardcoded catalog ─────────────
  const storeConnectors = useConnectorsStore((s) => s.connectors);

  const connectorItems = useMemo((): ConnectorItem[] => {
    // Build set of store connector IDs for dedup
    const storeIds = new Set(storeConnectors.map((c) => c.id));

    // Map store connectors → menu items (these are "configured" or "live")
    const storeItems: ConnectorItem[] = storeConnectors.map((c) => {
      // Map store status → UI status
      const uiStatus: ConnectorItem["status"] =
        c.status === "connected" ? "live" :
        c.status === "configuring" || c.status === "testing" ? "configured" :
        "available";
      return {
        id: c.id,
        label: c.name,
        description: c.description || `${c.type.toUpperCase()} connection`,
        icon: iconForId(c.id),
        category: "connector" as const,
        status: uiStatus,
        badge: c.status === "connected" ? "online" : (c.status === "error" ? "error" : undefined),
        actions: [
          { id: `${c.id}-test`, label: "Test Connection", icon: Activity, intent: `test_${c.id}` },
          { id: `${c.id}-configure`, label: "Configure", icon: Settings, intent: `configure_${c.id}` },
        ],
      };
    });

    // Filter hardcoded catalog: only show entries NOT already in store
    const catalogItems: ConnectorItem[] = HARDCODED_CONNECTORS.filter(
      (c) => c.category === "connector" && !storeIds.has(c.id)
    );

    return [...storeItems, ...catalogItems];
  }, [storeConnectors]);

  const handleItemClick = (item: ConnectorItem) => {
    if (item.id === "upload") {
      onUploadClick?.();
      setOpen(false);
      return;
    }

    // Toggle actions submenu
    if (expandedConnector === item.id) {
      setExpandedConnector(null);
    } else {
      setExpandedConnector(item.id);
    }
    onConnectorClick?.(item.id);
  };

  const handleActionClick = (connectorId: string, action: ConnectorAction) => {
    onConnectorAction?.(connectorId, action);
    setOpen(false);
    setExpandedConnector(null);
  };

  // Separate upload from connectors
  const uploadItem = HARDCODED_CONNECTORS.find((c) => c.id === "upload");

  return (
    <div className="relative">
      {/* Trigger button — Claude-style circular + */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex size-9 items-center justify-center rounded-full transition-all duration-200 ${
          open
            ? "bg-white/10 text-zinc-200 rotate-45"
            : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06]"
        }`}
        aria-label="Open integrations menu"
      >
        <Plus className="size-5 transition-transform duration-200" />
      </button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="fixed inset-0 z-40"
              onClick={() => { setOpen(false); setExpandedConnector(null); }}
            />

            {/* Menu panel — Claude-style: clean, rounded, glass */}
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.97 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="absolute bottom-full left-0 mb-2 z-50 w-80 max-h-[520px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d0d15]/98 backdrop-blur-3xl"
              style={{
                boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 12px 48px -16px rgba(0,0,0,0.7), inset 0 1px 0 0 rgba(255,255,255,0.04)",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  Integrations
                </span>
                <button
                  onClick={() => { setOpen(false); setExpandedConnector(null); }}
                  className="flex size-6 items-center justify-center rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="overflow-y-auto max-h-[440px] p-2 space-y-1">
                {/* Upload action — prominent, first item */}
                {uploadItem && (
                  <button
                    type="button"
                    onClick={() => handleItemClick(uploadItem)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150 hover:bg-white/[0.05] active:scale-[0.98] mb-2 border border-white/[0.04] bg-white/[0.015]"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] border border-white/[0.08]">
                      <Paperclip className="size-4 text-zinc-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-zinc-200">
                        {uploadItem.label}
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        {uploadItem.description}
                      </p>
                    </div>
                  </button>
                )}

                {/* Section: Connected apps */}
                <div className="px-2 py-1">
                  <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                    Connected Apps
                  </span>
                </div>

                {connectorItems.map((item) => {
                  const isExpanded = expandedConnector === item.id;
                  return (
                    <div key={item.id} className="relative">
                      {/* Connector row */}
                      <button
                        type="button"
                        onClick={() => handleItemClick(item)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150 hover:bg-white/[0.04] active:scale-[0.98] ${
                          isExpanded ? "bg-white/[0.04]" : ""
                        }`}
                      >
                        {/* Icon */}
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.03] border border-white/[0.05] relative">
                          <item.icon className="size-4 text-zinc-400" />
                          {item.status && (
                            <span className={`absolute -top-0.5 -right-0.5 size-2 rounded-full border-2 border-[#0d0d15] ${STATUS_DOT[item.status]}`} />
                          )}
                        </div>

                        {/* Label + desc */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-medium text-zinc-200 truncate">
                              {item.label}
                            </span>
                            {item.status && (
                              <span
                                className={`inline-flex shrink-0 items-center rounded-full px-1.5 py-px text-[9px] font-semibold uppercase tracking-wider border ${
                                  STATUS_COLORS[item.status] || STATUS_COLORS.available
                                }`}
                              >
                                {item.status}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                            {item.description}
                          </p>
                        </div>

                        {/* Expand chevron + badge */}
                        {item.badge && !isExpanded && (
                          <span className="text-[10px] text-zinc-500 shrink-0">{item.badge}</span>
                        )}
                        {item.actions && item.actions.length > 0 && (
                          <ChevronRight
                            className={`size-3.5 shrink-0 text-zinc-600 transition-transform duration-200 ${
                              isExpanded ? "rotate-90" : ""
                            }`}
                          />
                        )}
                      </button>

                      {/* Actions submenu — Claude-style: slides out below connector */}
                      <AnimatePresence>
                        {isExpanded && item.actions && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="ml-11 mr-3 mb-1 border-l border-white/[0.06] pl-3 py-1 space-y-0.5">
                              {item.actions.map((action) => (
                                <button
                                  key={action.id}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleActionClick(item.id, action);
                                  }}
                                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all duration-100 hover:bg-white/[0.05] active:scale-[0.98]"
                                >
                                  <action.icon className="size-3.5 shrink-0 text-zinc-500" />
                                  <span className="text-[12px] text-zinc-300">{action.label}</span>
                                  <span className="ml-auto text-[9px] text-zinc-600 font-mono uppercase">
                                    {action.intent}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-white/[0.05] bg-white/[0.01]">
                <p className="text-[10px] text-zinc-600 text-center">
                  MCP · API · n8n · TypeScript connections
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ConnectorMenu;
