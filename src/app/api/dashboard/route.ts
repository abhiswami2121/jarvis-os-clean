import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const B44_URL = process.env.BASE44_API_URL || "https://api.base44.app/v1";
const B44_KEY = process.env.BASE44_API_KEY || "";

interface DashboardCache {
  data: any;
  ts: number;
}
let _cache: DashboardCache | null = null;
const CACHE_TTL = 30_000; // 30 seconds

async function b44Query(entity: string, filter: string): Promise<any[]> {
  const url = `${B44_URL}/entity/${entity}?filter=${encodeURIComponent(filter)}&limit=10`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${B44_KEY}` },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.records || json.data || [];
}

async function b44Count(entity: string, filter: string): Promise<number> {
  const url = `${B44_URL}/entity/${entity}/count?filter=${encodeURIComponent(filter)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${B44_KEY}` },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return 0;
  const json = await res.json();
  return json.count ?? json.total ?? json.records?.length ?? 0;
}

async function fetchDashboardData() {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const results = await Promise.allSettled([
    // enrollments today
    b44Query("CustomerProfile", JSON.stringify({ created_date: { $gte: today } })),
    // payments today
    b44Query("PaymentLog", JSON.stringify({ created_date: { $gte: today } })),
    // at-risk subs
    b44Query("Subscription", JSON.stringify({ status: "past_due" })),
    // calls today
    b44Query("CallLog", JSON.stringify({ created_date: { $gte: today } })),
    // VAPI calls today
    b44Query("VapiCallEvent", JSON.stringify({ created_date: { $gte: today } })),
    // open tickets
    b44Query("SupportTicket", JSON.stringify({ status: { $in: ["open", "in_progress"] } })),
    // recovery items
    b44Query("RecoveryItem", JSON.stringify({ status: { $in: ["pending", "in_progress"] } })),
  ]);

  const getArr = (idx: number) =>
    results[idx].status === "fulfilled" ? (results[idx] as any).value : [];

  return {
    enrollment_today: getArr(0).length,
    payments_today: getArr(1).length,
    at_risk_mrr: getArr(2).length,
    calls_today: getArr(3).length,
    vapi_today: getArr(4).length,
    tickets_open: getArr(5).length,
    recovery_open: getArr(6).length,
    vps_sessions: 0, // filled by VPS proxy
    mvp_count: 0,    // filled by VPS proxy
    golden_run_count: 3, // static: Stream A completed
    ts: Date.now(),
  };
}

export async function GET() {
  try {
    if (_cache && Date.now() - _cache.ts < CACHE_TTL) {
      return NextResponse.json({ ..._cache.data, cached: true, cache_age_ms: Date.now() - _cache.ts });
    }

    const data = await fetchDashboardData();

    // Try VPS for sessions + MVP count
    try {
      const vpsRes = await fetch("http://localhost:8102/v1/sessions?limit=100", {
        headers: { Authorization: `Bearer ${process.env.DIAGNOSTICS_API_KEY || "NL2026061471"}` },
        signal: AbortSignal.timeout(4000),
      });
      if (vpsRes.ok) {
        const vpsJson = await vpsRes.json();
        data.vps_sessions = vpsJson.sessions?.length ?? vpsJson.count ?? 0;
      }
    } catch {}

    try {
      const mvpRes = await fetch("http://localhost:8200/list", {
        signal: AbortSignal.timeout(4000),
      });
      if (mvpRes.ok) {
        const mvpJson = await mvpRes.json();
        data.mvp_count = Object.keys(mvpJson.mvps || {}).length ?? 0;
      }
    } catch {}

    _cache = { data, ts: Date.now() };

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=30, s-maxage=30",
      },
    });
  } catch (err: any) {
    if (_cache) {
      return NextResponse.json({ ..._cache.data, cached: true, stale: true });
    }
    return NextResponse.json(
      { error: err?.message || "Dashboard fetch failed" },
      { status: 502 }
    );
  }
}
