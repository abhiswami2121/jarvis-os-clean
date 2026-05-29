import type { Artifact } from "./types";

/**
 * Test fixture: typical subscription health data table
 * Simulates what the VPS agent would return from sub_health_analysis.
 */
export const atRiskSubscriptionsFixture: Artifact = {
  type: "data_table",
  title: "At-Risk Subscriptions",
  subtitle: "$5,234 MRR at risk across 23 subscriptions",
  columns: [
    { key: "customer", label: "Customer", type: "string" },
    { key: "amount", label: "Amount", type: "currency" },
    { key: "nextDate", label: "Next Charge", type: "date", format: "relative" },
    { key: "status", label: "Status", type: "status" },
    { key: "declineReason", label: "Last Decline", type: "string" },
  ],
  rows: [
    { customer: "Sarah Mitchell", amount: 149.99, nextDate: "2026-05-28", status: "at_risk", declineReason: "insufficient_funds" },
    { customer: "James Wilson", amount: 299.0, nextDate: "2026-05-29", status: "declined", declineReason: "do_not_honor" },
    { customer: "Maria Garcia", amount: 89.0, nextDate: "2026-05-30", status: "at_risk", declineReason: "expired_card" },
    { customer: "Robert Chen", amount: 199.99, nextDate: "2026-05-31", status: "warning", declineReason: "velocity_limit" },
    { customer: "Emily Davis", amount: 449.0, nextDate: "2026-06-01", status: "declined", declineReason: "insufficient_funds" },
    { customer: "David Kim", amount: 129.99, nextDate: "2026-06-02", status: "at_risk", declineReason: "invalid_account" },
    { customer: "Lisa Anderson", amount: 79.0, nextDate: "2026-06-03", status: "healthy", declineReason: "—" },
    { customer: "Michael Brown", amount: 249.99, nextDate: "2026-06-04", status: "warning", declineReason: "config_error" },
    { customer: "Jennifer Lee", amount: 189.0, nextDate: "2026-06-05", status: "at_risk", declineReason: "do_not_honor" },
    { customer: "Thomas Wright", amount: 399.99, nextDate: "2026-06-06", status: "declined", declineReason: "insufficient_funds" },
    { customer: "Amanda Taylor", amount: 109.0, nextDate: "2026-06-07", status: "at_risk", declineReason: "expired_card" },
    { customer: "Christopher Harris", amount: 549.0, nextDate: "2026-06-08", status: "critical", declineReason: "fraud_block" },
    { customer: "Jessica Martin", amount: 159.99, nextDate: "2026-06-09", status: "healthy", declineReason: "—" },
    { customer: "Daniel Thompson", amount: 279.0, nextDate: "2026-06-10", status: "warning", declineReason: "velocity_limit" },
    { customer: "Ashley White", amount: 99.99, nextDate: "2026-06-11", status: "at_risk", declineReason: "insufficient_funds" },
  ],
  actions: [
    { label: "Bulk Recovery", intent: "bulk_recovery", variant: "primary", requiresConfirm: true, confirmMessage: "Start bulk recovery for 15 subscriptions?" },
    { label: "Export CSV", intent: "export_csv", variant: "secondary" },
  ],
  metadata: {
    totalRows: 23,
    truncated: false,
    source: "nmi_sub_health_analysis",
    timestamp: new Date().toISOString(),
  },
};

/**
 * Test fixture: status card for subscription health overview
 */
export const subscriptionHealthStatusFixture: Artifact = {
  type: "status_card",
  title: "Subscription Health",
  status: "warning",
  metrics: [
    { label: "Active Subscriptions", value: 847, format: "number", trend: "up", trendValue: "+12" },
    { label: "Monthly MRR", value: 47200, format: "currency", trend: "up", trendValue: "+$2.3K" },
    { label: "At-Risk MRR", value: 5234, format: "currency", trend: "down", trendValue: "-$890" },
    { label: "Decline Rate", value: 4.2, format: "percent", trend: "down", trendValue: "-0.8%" },
    { label: "Recovery Rate", value: 68.5, format: "percent", trend: "up", trendValue: "+3.2%" },
  ],
};

/**
 * Test fixture: chart for revenue trend
 */
export const revenueTrendFixture: Artifact = {
  type: "chart",
  title: "MRR Trend (Last 30 Days)",
  chartType: "line",
  subtitle: "Daily recurring revenue",
  axisLabels: { x: "date", y: "mrr" },
  data: [
    { date: "2026-04-27", mrr: 45200 },
    { date: "2026-04-30", mrr: 45400 },
    { date: "2026-05-03", mrr: 45300 },
    { date: "2026-05-06", mrr: 46100 },
    { date: "2026-05-09", mrr: 45800 },
    { date: "2026-05-12", mrr: 46500 },
    { date: "2026-05-15", mrr: 46300 },
    { date: "2026-05-18", mrr: 46900 },
    { date: "2026-05-21", mrr: 47000 },
    { date: "2026-05-24", mrr: 47200 },
    { date: "2026-05-27", mrr: 47200 },
  ],
};

/**
 * Test fixture: raw text containing artifact block
 * Simulates what the VPS agent would send as text content.
 */
export const sampleArtifactMessage = `Here's the subscription health report you requested:

[[ARTIFACT_START:data_table]]
${JSON.stringify(atRiskSubscriptionsFixture, null, 2)}
[[ARTIFACT_END]]

As you can see, 15 subscriptions are at risk with a total of $5,234 in MRR. I'd recommend running the bulk recovery campaign.

[[ARTIFACT_START:status_card]]
${JSON.stringify(subscriptionHealthStatusFixture, null, 2)}
[[ARTIFACT_END]]

The overall subscription health is showing a warning trend — we're seeing higher decline rates this week compared to last.
`;

/**
 * Large dataset fixture — tests 200-row limit
 */
export function generateLargeDataset(rowCount: number = 200): Artifact {
  return {
    type: "data_table",
    title: `Large Dataset (${rowCount} rows)`,
    columns: [
      { key: "id", label: "ID", type: "number" },
      { key: "name", label: "Name", type: "string" },
      { key: "value", label: "Value", type: "currency" },
      { key: "status", label: "Status", type: "status" },
    ],
    rows: Array.from({ length: rowCount }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
      value: Math.round(Math.random() * 10000 + 100) / 100,
      status: ["active", "pending", "failed", "cancelled"][Math.floor(Math.random() * 4)],
    })),
    metadata: {
      totalRows: rowCount,
      truncated: rowCount > 200,
      source: "test_generator",
    },
  };
}
