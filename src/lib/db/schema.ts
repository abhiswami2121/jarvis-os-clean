import { pgTable, text, varchar, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";

// ── Users table (matches existing Supabase schema) ──────────────────────
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  provider: text("provider"),
  externalId: text("external_id"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  scope: text("scope"),
  username: text("username"),
  email: text("email"),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  routingMode: text("routing_mode").notNull().default("gateway"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at").defaultNow(),
});

// ── Tasks table (matches existing Supabase schema + new routing cols) ───
export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  prompt: text("prompt"),
  title: text("title"),
  repoUrl: text("repo_url"),
  selectedAgent: text("selected_agent").default("claude"),
  selectedModel: text("selected_model"),
  installDependencies: boolean("install_dependencies").default(false),
  maxDuration: integer("max_duration").default(300),
  keepAlive: boolean("keep_alive").default(false),
  enableBrowser: boolean("enable_browser").default(false),
  status: text("status").notNull().default("pending"),
  progress: integer("progress").default(0),
  logs: jsonb("logs"),
  error: text("error"),
  branchName: text("branch_name"),
  sandboxId: text("sandbox_id"),
  agentSessionId: text("agent_session_id"),
  sandboxUrl: text("sandbox_url"),
  previewUrl: text("preview_url"),
  prUrl: text("pr_url"),
  prNumber: integer("pr_number"),
  prStatus: text("pr_status"),
  prMergeCommitSha: text("pr_merge_commit_sha"),
  mcpServerIds: jsonb("mcp_server_ids"),
  // NEPTUNE-7: unified routing columns
  routingMode: text("routing_mode").notNull().default("gateway"),
  resolvedModel: text("resolved_model"),
  resolvedProvider: text("resolved_provider"),
  resolvedBaseUrl: text("resolved_base_url"),
  resolvedKeyPrefix: varchar("resolved_key_prefix", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  deletedAt: timestamp("deleted_at"),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
