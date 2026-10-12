// Kids Breakfast: calendar for the Home screen.
// Reads the family's Google Calendar through its private iCal link (kept in the CALENDAR_ICS_URL
// secret, never in the app) and returns only events from about a day ago to a few days ahead.
// Browsers can't read Google's iCal link directly, which is why this runs on the server.
import ICAL from "npm:ical.js@1.5.0";
import { expandEvents } from "./events.mjs";

// Only devices set up with the family's sync code may read the calendar.
// These are SHA-256 hashes of allowed family codes, so the codes themselves aren't stored here.
const ALLOWED_CODE_SHA256 = [
  "5814669be912feb6e65b96a49cd24e8fddbdd433dd5aa8d15ea0e959e18fab13",
];

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const cache = new Map<string, { at: number; text: string }>(); // per feed, 5 minutes

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function feedText(url: string): Promise<string> {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < 5 * 60_000) return hit.text;
  const res = await fetch(url);
  if (!res.ok) throw new Error("calendar fetch failed: " + res.status);
  const text = await res.text();
  cache.set(url, { at: Date.now(), text });
  return text;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

  let code = "";
  try {
    code = String((await req.json()).code || "");
  } catch (_) { /* no body */ }
  if (!ALLOWED_CODE_SHA256.includes(await sha256Hex(code))) return json(403, { error: "forbidden" });

  // One or more feed links, separated by spaces, commas, or new lines.
  const urls = (Deno.env.get("CALENDAR_ICS_URL") || "").split(/[\s,]+/).filter(Boolean);
  if (!urls.length) return json(503, { error: "not_configured" });

  try {
    const now = Date.now();
    const from = new Date(now - 36 * 3600_000), to = new Date(now + 60 * 3600_000);
    const lists = await Promise.all(urls.map(async (u) => expandEvents(ICAL, await feedText(u), from, to)));
    const events = lists.flat().sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
    return json(200, { events });
  } catch (e) {
    console.error(e);
    return json(502, { error: "calendar_unavailable" });
  }
});
