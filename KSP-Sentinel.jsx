/**
 * apps/sentinel-web/src/App.jsx
 *
 * KSP Sentinel-AI — Unified Intelligence & Predictive Policing Suite
 * Internal cut for Datathon 2026 submission. NOT wired to production CCTNS —
 * all query routing, SQL/Cypher generation, and forecasts below are mocked
 * against static fixtures pending Catalyst function deployment (see JIRA
 * SENTINEL-214). Do not point this build at prod credentials.
 *
 * Build: 2026.07.24-rc2 | Env: STAGING | Cluster: ksp-prod-blr-03
 * Owners: KSP-IT Cell (Applications) / Zoho Catalyst Engineering
 *
 * Changelog:
 *  - 2026.07.24  Anomaly panel added; fixed off-by-one in hour-density matrix
 *                on DST-adjacent dates. — R. Prasad
 *  - 2026.07.16  Crime-code refs migrated from IPC to BNS 2023 section
 *                numbers; TODO confirm 331(4) mapping with Law Cell before
 *                external demo. — S. Nayak
 *  - 2026.06.30  Initial scaffold for internal review.
 */
import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import {
  Shield, MessageSquare, MapPin, TrendingUp, Network, LayoutDashboard,
  Search, Bell, ChevronDown, ChevronsLeft, ChevronsRight, Mic, Send,
  Users, Car, Phone, AlertTriangle, Globe, Sparkles, FileText,
  Download, ThumbsUp, ThumbsDown, X, Command, Radio,
  Link2, RefreshCw, Lock, Fingerprint, KeyRound, Hash, Siren, Timer,
  ClipboardList, HeartPulse, PlayCircle, ArrowRight, CheckCircle2,
  Camera, Wifi, WifiOff, Activity, ChevronLeft, ChevronRight, Zap,
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/* DESIGN TOKENS                                                          */
/* ---------------------------------------------------------------------- */
const C = {
  navy: "#0B192C",
  navyDeep: "#081222",
  panel: "#132238",
  panelAlt: "#182C46",
  border: "#24374F",
  borderLight: "#324B69",
  gold: "#D4AF37",
  goldDim: "#8C7530",
  red: "#DC2626",
  blue: "#2264E5",
  blueDim: "#1B4FB8",
  green: "#22C55E",
  amber: "#F59E0B",
  text: "#E7EDF5",
  muted: "#8DA0BC",
  mutedDark: "#5C7091",
  steel: "#4A6FA5",
};
const FONT_DISPLAY = "'Space Grotesk', 'Inter', ui-sans-serif, system-ui";
const FONT_MONO = "'JetBrains Mono', 'IBM Plex Mono', ui-monospace, monospace";

/* ---------------------------------------------------------------------- */
/* MOCK DATA                                                              */
/* ---------------------------------------------------------------------- */
const NAV_GROUPS = [
  { label: "INTELLIGENCE", items: [{ id: "chat", label: "AI Query Engine", icon: MessageSquare }] },
  { label: "SPATIAL ANALYTICS", items: [{ id: "map", label: "Geospatial Command", icon: MapPin }] },
  { label: "PREDICTIVE", items: [{ id: "predictive", label: "Forecast & Hotspots", icon: TrendingUp }] },
  { label: "NETWORK", items: [{ id: "graph", label: "Suspect Link Analysis", icon: Network }] },
  {
    label: "DASHBOARDS",
    items: [
      { id: "dashboard", label: "Executive Overview", icon: LayoutDashboard },
      { id: "safety", label: "Women & Child Safety", icon: Siren },
    ],
  },
  {
    label: "AI OPERATIONS",
    items: [
      { id: "cctv", label: "Camera Crime Tracking", icon: Radio },
      { id: "dispatch", label: "Voice Dispatch", icon: Mic },
      { id: "alerts", label: "Automatic Alerts", icon: Siren },
    ],
  },
  { label: "RECORDS", items: [{ id: "reports", label: "Crime Reports (500)", icon: FileText }] },
  { label: "COMMAND", items: [{ id: "bulletin", label: "Crime Bulletin Generator", icon: ClipboardList }] },
  { label: "ZOHO INTEGRATIONS", items: [{ id: "zoho", label: "Ecosystem Status", icon: Link2 }] },
  { label: "SYSTEM ADMIN", items: [{ id: "security", label: "RBAC & Compliance", icon: Lock }] },
];

const LABELS = {
  EN: { subtitle: "Unified Intelligence & Predictive Policing Suite", search: "Search FIR, suspect, vehicle, location\u2026" },
  KN: { subtitle: "\u0C8F\u0C95\u0CC0\u0C95\u0CD5\u0CDD\u0CA4 \u0C97\u0CC1\u0CAA\u0CCD\u0CA4\u0CAE\u0CBE\u0CB9\u0CBF\u0CA4\u0CBF \u0CAE\u0CA4\u0CCD\u0CA4\u0CC1 \u0CAE\u0CC1\u0CA8\u0CCD\u0CB8\u0CC2\u0CDA\u0CA8\u0CC6 \u0CAA\u0CCA\u0CB2\u0CBF\u0CB8\u0CBF\u0C82\u0C97\u0CCD", search: "\u0CB9\u0CC1\u0CA1\u0CC1\u0C95\u0CBF" },
};

const HOTSPOTS = [
  { id: 1, name: "Koramangala", station: "Koramangala PS, Bengaluru City", x: 63, y: 70, intensity: 82, type: "Property Crime", color: C.red },
  { id: 2, name: "Indiranagar", station: "Indiranagar PS, Bengaluru City", x: 67, y: 65, intensity: 64, type: "Cybercrime", color: C.blue },
  { id: 3, name: "Hubballi-Dharwad", station: "Vidyanagar PS, Hubballi-Dharwad Commr.", x: 22, y: 26, intensity: 71, type: "Vehicle Theft", color: C.amber },
  { id: 4, name: "Mysuru Urban", station: "Devaraja PS, Mysuru City", x: 44, y: 80, intensity: 58, type: "Chain Snatching", color: C.red },
  { id: 5, name: "Shivamogga", station: "Town PS, Shivamogga", x: 37, y: 47, intensity: 45, type: "Narcotics (NDPS)", color: C.amber },
  { id: 6, name: "Belagavi", station: "Camp PS, Belagavi", x: 15, y: 10, intensity: 39, type: "Property Crime", color: C.amber },
];

const CRIME_CATEGORY_DATA = [
  { name: "Property", value: 18420 },
  { name: "Cyber", value: 6210 },
  { name: "Vs. Women", value: 4890 },
  { name: "Narcotics", value: 2340 },
  { name: "Violent", value: 3120 },
  { name: "Traffic Fatal.", value: 1180 },
];

const MONTHLY_TREND = [
  { month: "Jan", firs: 6210 }, { month: "Feb", firs: 5840 }, { month: "Mar", firs: 6510 },
  { month: "Apr", firs: 6890 }, { month: "May", firs: 7120 }, { month: "Jun", firs: 6970 },
  { month: "Jul", firs: 6540 },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SLOTS = ["00-04", "04-08", "08-12", "12-16", "16-20", "20-24"];
const HOUR_MATRIX = DAYS.map((d, di) =>
  SLOTS.map((s, si) => {
    const weekend = di >= 5;
    const night = si === 0 || si === 5;
    let base = 30 + Math.round(Math.sin(di + si) * 15);
    if (night) base += weekend ? 38 : 22;
    if (si === 2) base += 10;
    return Math.max(8, Math.min(96, base));
  })
);

const FORECAST_DATA = [
  { week: "W1", actual: 11, predicted: null },
  { week: "W2", actual: 13, predicted: null },
  { week: "W3", actual: 12, predicted: null },
  { week: "W4", actual: 16, predicted: null },
  { week: "W5", actual: 15, predicted: 15 },
  { week: "W6", actual: null, predicted: 18 },
  { week: "W7", actual: null, predicted: 22 },
  { week: "W8", actual: null, predicted: 20 },
];

const HOTSPOT_RANKING = [
  { rank: 1, location: "Devaraja PS Jurisdiction, Mysuru", crime: "Chain Snatching", score: 87, confidence: "High" },
  { rank: 2, location: "Koramangala PS, Bengaluru City", crime: "Chain / Vehicle Theft", score: 79, confidence: "High" },
  { rank: 3, location: "Vidyanagar PS, Hubballi-Dharwad", crime: "Vehicle Theft", score: 74, confidence: "Medium" },
  { rank: 4, location: "Indiranagar PS, Bengaluru City", crime: "Cyber Fraud (UPI)", score: 68, confidence: "Medium" },
  { rank: 5, location: "Town PS, Shivamogga", crime: "Narcotics (NDPS)", score: 52, confidence: "Low" },
];

const ANOMALIES = [
  { id: 1, sev: "high", text: "Cybercrime (UPI fraud) complaints up 38% week-on-week \u2014 Indiranagar PS jurisdiction" },
  { id: 2, sev: "med", text: "Chain-snatching cluster forming around 3 intersections \u2014 Devaraja PS, Mysuru" },
  { id: 3, sev: "low", text: "Narcotics seizure rate below rolling threshold \u2014 Shivamogga Rural sub-division" },
];

const GRAPH_NODES = [
  { id: "S1", label: "Ravi Kumar B.", sub: "Suspect \u2014 Prime", type: "suspect", x: 400, y: 110 },
  { id: "S2", label: "Manjunath G.", sub: "Suspect \u2014 Associate", type: "suspect", x: 220, y: 210 },
  { id: "V1", label: "KA-09 MZ 4471", sub: "Vehicle \u2014 Two-wheeler", type: "vehicle", x: 560, y: 200 },
  { id: "P1", label: "+91 98xxxxx241", sub: "Phone \u2014 Tower co-located", type: "phone", x: 150, y: 350 },
  { id: "L1", label: "Chamarajpet", sub: "Last known location", type: "location", x: 400, y: 400 },
  { id: "F1", label: "FIR 0142/2026", sub: "Koramangala PS", type: "fir", x: 610, y: 360 },
];
const GRAPH_EDGES = [["S1", "S2"], ["S1", "V1"], ["S1", "P1"], ["S2", "L1"], ["V1", "F1"], ["S1", "F1"]];
const NODE_STYLE = {
  suspect: { color: C.gold, icon: Users },
  vehicle: { color: C.blue, icon: Car },
  phone: { color: C.green, icon: Phone },
  location: { color: C.amber, icon: MapPin },
  fir: { color: C.red, icon: FileText },
};

const CHIPS = [
  "Night-time chain snatching in Mysuru, last 90 days",
  "Cybercrime spike Indiranagar this month",
  "Suspects linked to FIR 0142/2026 Koramangala PS",
  "Predicted hotspots next 7 days, Bengaluru City",
];

/* ---- Zoho ecosystem status ---- */
const ZOHO_SERVICES = [
  { name: "Zoho Catalyst \u2014 Serverless Functions", role: "Background ML scoring, forecast jobs", status: "Online", lastSync: "12s ago", detail: "38 functions deployed \u00b7 avg cold start 340ms" },
  { name: "Zoho Analytics \u2014 Embedded Reports", role: "Executive dashboards & custom report bridge", status: "Online", lastSync: "40s ago", detail: "214 workspaces synced" },
  { name: "Zoho Creator \u2014 Field Incident Forms", role: "Low-code FIR intake for field officers", status: "Syncing", lastSync: "3m ago", detail: "1 form schema pending publish (v12)" },
  { name: "Zoho Sign \u2014 e-Signatures", role: "Charge sheets & search warrant sign-off", status: "Online", lastSync: "1m ago", detail: "6 documents awaiting SP countersignature" },
  { name: "Zoho Cliq \u2014 Emergency Bot", role: "P1 alert webhooks to station-house channels", status: "Online", lastSync: "5s ago", detail: "312 stations subscribed" },
  { name: "Zoho Desk \u2014 Citizen Grievance", role: "Complaint escalation ticketing", status: "Degraded", lastSync: "6m ago", detail: "Webhook retries elevated \u2014 SENTINEL-238" },
  { name: "Zoho Vault \u2014 Secrets", role: "DB credentials & API key custody (mock)", status: "Online", lastSync: "2m ago", detail: "Rotation policy: 90 days" },
  { name: "Zoho DataPrep \u2014 CCTNS Legacy Pipelines", role: "Cleans & transforms raw CCTNS exports", status: "Online", lastSync: "18m ago", detail: "Batch KA-DIST-07 \u2014 99.1% match rate" },
];

/* ---- RBAC matrix ---- */
const RBAC_DOMAINS = ["Victim / Complainant PII", "Case Files (Active)", "Predictive Model Outputs", "Financial / CDR Records", "System Administration"];
const RBAC_MATRIX = {
  Constable: ["None", "Read (own beat)", "None", "None", "None"],
  IO: ["Masked", "Read/Write (assigned)", "Read", "Request-only", "None"],
  SHO: ["Masked", "Read/Write (station)", "Read", "Read", "None"],
  SP: ["Full", "Read/Write (district)", "Read/Write", "Read", "Read"],
  DGP: ["Full", "Read (state)", "Read/Write", "Read", "Read"],
  "Data Analyst": ["Masked", "Read (anonymized)", "Read/Write", "None", "None"],
};

const AUDIT_TRAIL = [
  { ts: "24/07/2026 09:41:12", officer: "KSP-IO-4471", action: "QUERY_EXEC", detail: "NL-to-SQL: chain_snatching / mysuru_urban", hash: "7f3a9c\u2026e21b" },
  { ts: "24/07/2026 09:38:55", officer: "KSP-SHO-1182", action: "CASE_UPDATE", detail: "FIR 0142/2026 status \u2192 Under Investigation", hash: "b4e102\u202688af" },
  { ts: "24/07/2026 09:30:07", officer: "KSP-SP-0093", action: "BREAK_GLASS", detail: "Emergency access granted \u2014 Op. Nightwatch", hash: "1d55f6\u2026c904" },
  { ts: "24/07/2026 09:12:44", officer: "SYSTEM", action: "DATAPREP_SYNC", detail: "Batch KA-DIST-07 ingested, 4,812 rows", hash: "9a02e7\u20263310" },
];

/* ---- Missing persons & women's safety ---- */
const MISSING_PERSONS = [
  { id: "MP-2026-1842", initials: "K.S.", age: 14, gender: "F", lastSeen: "Yeshwanthpur Bus Stand, Bengaluru", daysOpen: 3, uidbMatch: null, slaHrs: 21 },
  { id: "MP-2026-1839", initials: "R.M.", age: 67, gender: "M", lastSeen: "Devaraja Market, Mysuru", daysOpen: 9, uidbMatch: "62% \u2014 UIDB/2026/0071 (Mysuru GH)", slaHrs: 0 },
  { id: "MP-2026-1847", initials: "A.N.", age: 22, gender: "F", lastSeen: "Hubballi Railway Station", daysOpen: 1, uidbMatch: null, slaHrs: 47 },
];

const SAFETY_ALERTS = [
  { id: "SOS-88231", type: "Panic Button (App)", location: "Koramangala 5th Block, Bengaluru", ts: "09:44:02", status: "Unit Dispatched", eta: "4 min", priority: "P1" },
  { id: "SOS-88229", type: "1091 Helpline Call", location: "Vidyanagar, Hubballi", ts: "09:31:18", status: "Resolved", eta: "\u2014", priority: "P2" },
  { id: "SOS-88225", type: "CCTV Auto-flag (Loitering)", location: "Devaraja Market, Mysuru", ts: "09:02:51", status: "Under Review", eta: "\u2014", priority: "P3" },
];

/* ---- AI Camera Crime Tracking ---- */
const CAMERAS = [
  { id: "CAM-KOR-014", station: "Koramangala PS", district: "Bengaluru City", junction: "Koramangala 80ft Rd x 5th Block", status: "Online" },
  { id: "CAM-IND-007", station: "Indiranagar PS", district: "Bengaluru City", junction: "100ft Rd x CMH Rd", status: "Online" },
  { id: "CAM-MYS-021", station: "Devaraja PS", district: "Mysuru Urban", junction: "Devaraja Market Gate 2", status: "Online" },
  { id: "CAM-HDW-009", station: "Vidyanagar PS", district: "Hubballi-Dharwad", junction: "Vidyanagar Bus Stand", status: "Offline \u2014 fibre cut" },
  { id: "CAM-SHV-004", station: "Town PS", district: "Shivamogga", junction: "Old Town Circle", status: "Online" },
  { id: "CAM-BLG-011", station: "Camp PS", district: "Belagavi", junction: "Camp Railway Crossing", status: "Online" },
  { id: "CAM-KOR-015", station: "Koramangala PS", district: "Bengaluru City", junction: "Sony World Signal", status: "Online" },
  { id: "CAM-MYS-022", station: "Devaraja PS", district: "Mysuru Urban", junction: "Sayyaji Rao Rd", status: "Online" },
];
const DETECTION_TEMPLATES = [
  { label: "Loitering > 5 min", conf: 78, sev: "med" },
  { label: "Unattended object flagged", conf: 64, sev: "med" },
  { label: "Rapid crowd dispersal", conf: 71, sev: "med" },
  { label: "Two-wheeler triple-riding", conf: 88, sev: "low" },
  { label: "Suspect match \u2014 watchlist (low confidence)", conf: 52, sev: "high" },
  { label: "Altercation / physical struggle", conf: 81, sev: "high" },
  { label: "Vehicle plate match \u2014 KA-09 MZ 4471", conf: 91, sev: "high" },
  { label: "Wrong-side movement, night window", conf: 69, sev: "low" },
];

/* ---- Voice Dispatch ---- */
const VOICE_COMMANDS = [
  "Dispatch nearest unit to Koramangala 5th Block",
  "Send patrol to Devaraja Market, Mysuru",
  "Confirm status of Unit Bravo-12",
  "Broadcast alert to Indiranagar beat officers",
];
const PATROL_UNITS = [
  { id: "Bravo-12", base: "Koramangala PS", eta: "4 min" },
  { id: "Charlie-05", base: "Indiranagar PS", eta: "6 min" },
  { id: "Delta-09", base: "Devaraja PS, Mysuru", eta: "3 min" },
  { id: "Echo-02", base: "Vidyanagar PS, Hubballi-Dharwad", eta: "8 min" },
];

/* ---- Automatic alert rule engine ---- */
const ALERT_RULES = [
  { id: "R1", name: "SOS / panic button trigger", source: "Citizen App", enabled: true, triggers: 14 },
  { id: "R2", name: "CCTV high-confidence weapon/altercation flag", source: "AI Camera Tracking", enabled: true, triggers: 6 },
  { id: "R3", name: "Cybercrime complaint spike > 30% WoW", source: "Predictive Analytics", enabled: true, triggers: 2 },
  { id: "R4", name: "Missing person SLA breach", source: "Safety Dashboard", enabled: true, triggers: 1 },
  { id: "R5", name: "ANPR watchlist plate match", source: "VAHAN / ANPR", enabled: false, triggers: 0 },
];
const ALERT_TEMPLATES = [
  { rule: "R1", sev: "high", text: "Panic button activated \u2014 Koramangala 5th Block, unit auto-dispatched" },
  { rule: "R2", sev: "high", text: "CAM-KOR-014 flagged possible altercation, confidence 81%" },
  { rule: "R2", sev: "med", text: "CAM-MYS-021 flagged unattended object near Devaraja Market Gate 2" },
  { rule: "R3", sev: "med", text: "Indiranagar cybercrime complaints up 38% week-on-week" },
  { rule: "R4", sev: "high", text: "Missing person MP-2026-1839 has breached response SLA" },
  { rule: "R1", sev: "med", text: "1091 helpline call logged \u2014 Vidyanagar, Hubballi-Dharwad" },
  { rule: "R2", sev: "low", text: "CAM-BLG-011 flagged wrong-side two-wheeler movement" },
];

/* ---- 500-record crime report dataset (procedurally generated, seeded) ---- */
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const RPT_DISTRICTS = [
  { d: "Bengaluru City", stations: ["Koramangala PS", "Indiranagar PS", "Sony World Signal PS", "Whitefield PS", "Jayanagar PS"] },
  { d: "Mysuru Urban", stations: ["Devaraja PS", "Vijayanagar PS", "Krishnaraja PS"] },
  { d: "Hubballi-Dharwad", stations: ["Vidyanagar PS", "Gokul Road PS", "Ashok Nagar PS"] },
  { d: "Shivamogga", stations: ["Town PS", "Vinoba Nagar PS"] },
  { d: "Belagavi", stations: ["Camp PS", "Tilakwadi PS"] },
  { d: "Mangaluru", stations: ["Kadri PS", "Bunder PS"] },
];
const RPT_CRIMES = [
  { head: "Chain Snatching", section: "BNS 304" },
  { head: "Theft", section: "BNS 303(2)" },
  { head: "House-breaking", section: "BNS 331(4)" },
  { head: "Motor Vehicle Theft", section: "BNS 303(2)" },
  { head: "Cyber Fraud (UPI/Banking)", section: "BNS 318(4) / IT Act 66C" },
  { head: "Assault / Grievous Hurt", section: "BNS 118(2)" },
  { head: "Crimes Against Women (Sec. 74)", section: "BNS 74" },
  { head: "Narcotics (NDPS)", section: "NDPS Act 20(b)" },
  { head: "Cheating / Criminal Breach of Trust", section: "BNS 316(2)" },
  { head: "Public Nuisance", section: "BNS 296" },
];
const RPT_STATUS = ["FIR Registered", "Under Investigation", "Charge Sheet Filed", "Case Closed"];
function generateCrimeReports(n) {
  const rnd = mulberry32(20260724);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const rows = [];
  for (let i = 1; i <= n; i++) {
    const dist = pick(RPT_DISTRICTS);
    const crime = pick(RPT_CRIMES);
    const month = 1 + Math.floor(rnd() * 7); // Jan-Jul 2026
    const day = 1 + Math.floor(rnd() * 28);
    const hour = Math.floor(rnd() * 24);
    const min = Math.floor(rnd() * 60);
    rows.push({
      id: i,
      firNo: `${String(100 + Math.floor(rnd() * 900)).padStart(4, "0")}/2026`,
      date: `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/2026`,
      time: `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`,
      district: dist.d,
      station: pick(dist.stations),
      crimeHead: crime.head,
      section: crime.section,
      status: pick(RPT_STATUS),
      severity: rnd() > 0.8 ? "High" : rnd() > 0.45 ? "Medium" : "Low",
    });
  }
  return rows;
}
const CRIME_REPORTS = generateCrimeReports(500);

/* ---------------------------------------------------------------------- */
/* GUIDED DEMO SCRIPT                                                     */
/* ---------------------------------------------------------------------- */
const JUDGING_CRITERIA = [
  { label: "Innovation", note: "Hybrid NL-to-SQL/Cypher engine with live query-safety validation" },
  { label: "Technical feasibility", note: "Multi-DB routing, RBAC data masking, mocked Catalyst function layer" },
  { label: "UX for field officers", note: "Kannada/English input, voice, deep-linked chat \u2194 map \u2194 graph" },
  { label: "Public safety impact", note: "SLA-timed missing persons & SOS triage dashboard" },
  { label: "Zoho ecosystem fit", note: "Catalyst, Analytics, Creator, Sign, Cliq, Desk, Vault, DataPrep" },
];

const DEMO_STEPS = [
  { module: "dashboard", title: "Open on the Executive Overview", desc: "State-wide KPIs, category mix, and the day\u00d7hour density matrix set the scale of the problem in one screen." },
  { module: "chat", title: "Run a live Kanglish query", desc: "Type a chip prompt, show the generated SQL/Cypher, execution telemetry, and PII masking toggling with role." },
  { module: "map", title: "Jump to the map from a query result", desc: "Click a hotspot to show the deep link back into AI chat \u2014 this bidirectional link is the core differentiator." },
  { module: "predictive", title: "Show the 7-day forecast", desc: "Actual-vs-predicted line and the ranked hotspot table demonstrate the predictive layer, not just BI." },
  { module: "graph", title: "Open Suspect Link Analysis", desc: "Click through the network from FIR 0142/2026 to show cross-entity investigation support." },
  { module: "safety", title: "Show the SLA-timed safety dashboard", desc: "Missing persons countdown timers and SOS triage make the public-safety impact concrete for judges." },
  { module: "cctv", title: "Open AI Camera Crime Tracking", desc: "Live simulated junction feed with an AI tracking box, plus a rolling detection feed across the camera network." },
  { module: "dispatch", title: "Trigger a Voice Dispatch command", desc: "Tap the mic or a sample phrase to show speech-to-intent routing to the nearest patrol unit." },
  { module: "alerts", title: "Watch the Automatic Alert engine", desc: "Toggle a rule off/on and watch the live alert stream react \u2014 demonstrates automation over static dashboards." },
  { module: "reports", title: "Filter the 500-record Crime Reports table", desc: "Search, filter by district/status, and paginate through the full procedurally generated FIR dataset." },
  { module: "bulletin", title: "Generate the Daily Crime Bulletin", desc: "One click compiles the day's data into a Zoho Writer-style bulletin \u2014 shows automation, not just dashboards." },
  { module: "zoho", title: "Close on Zoho ecosystem status", desc: "Tie every prior screen back to the underlying Zoho services \u2014 reinforces this is a Zoho-native build." },
];

/* ---- Bulletin content builder ---- */
function buildBulletin() {
  return {
    ref: "KSP/DCB/2026/206",
    date: "24 July 2026",
    summary: "State-wide FIR registrations stable week-on-week (+1.8%). Cybercrime complaints in Indiranagar jurisdiction elevated 38% WoW \u2014 flagged for SP Bengaluru City East review. No P1 incidents unresolved beyond SLA as of 09:45 hrs.",
    lines: [
      "Total FIRs registered (last 24h): 187",
      "Property crime: 74 \u00b7 Cybercrime: 31 \u00b7 Crimes against women: 22 \u00b7 Narcotics (NDPS): 9",
      "Chain-snatching cluster under active surveillance \u2014 Devaraja PS jurisdiction, Mysuru",
      "1 missing person case (MP-2026-1839) matched to UIDB/2026/0071, Mysuru GH \u2014 confirmation pending",
      "Active SOS alerts: 1 dispatched (ETA 4 min), 1 resolved, 1 under review",
    ],
  };
}

function sqlFor(kind) {
  if (kind === "mysuru")
    return `SELECT DATE_TRUNC('week', occurrence_ts) AS week_bucket,
       COUNT(*) AS incident_count
FROM cctns.fir_master
WHERE crime_head = 'CHAIN_SNATCHING'
  AND district = 'MYSURU_URBAN'
  AND EXTRACT(HOUR FROM occurrence_ts) BETWEEN 20 AND 5
  AND occurrence_ts >= NOW() - INTERVAL '90 days'
GROUP BY 1
ORDER BY 1;`;
  if (kind === "cyber")
    return `SELECT occurrence_date,
       COUNT(*) AS complaint_count
FROM cctns.cyber_complaints
WHERE ps_jurisdiction = 'INDIRANAGAR'
  AND occurrence_date >= CURRENT_DATE - 14
GROUP BY 1
ORDER BY 1;`;
  if (kind === "suspects")
    return `MATCH (f:FIR {fir_no: '0142/2026', ps: 'KORAMANGALA'})
      -[:INVOLVES]->(s:Suspect)
OPTIONAL MATCH (s)-[r:LINKED_TO]-(n)
RETURN s, r, n
LIMIT 25;`;
  return `SELECT ps_jurisdiction, crime_head, risk_score
FROM predictive.hotspot_scores
WHERE district = 'BENGALURU_CITY'
  AND forecast_window = '7_DAYS'
ORDER BY risk_score DESC
LIMIT 5;`;
}

function highlightSQL(sql) {
  const kw = /\b(SELECT|FROM|WHERE|AND|OR|GROUP BY|ORDER BY|LIMIT|MATCH|OPTIONAL MATCH|RETURN|COUNT|DATE_TRUNC|EXTRACT|INTERVAL|BETWEEN|CURRENT_DATE|NOW)\b/g;
  const parts = sql.split(/(\b(?:SELECT|FROM|WHERE|AND|OR|GROUP BY|ORDER BY|LIMIT|MATCH|OPTIONAL MATCH|RETURN|COUNT|DATE_TRUNC|EXTRACT|INTERVAL|BETWEEN|CURRENT_DATE|NOW)\b)/g);
  return parts.map((p, i) => {
    if (kw.test(p)) {
      kw.lastIndex = 0;
      return <span key={i} style={{ color: C.blue, fontWeight: 600 }}>{p}</span>;
    }
    if (/^'.*'$/.test(p.trim())) return <span key={i} style={{ color: C.gold }}>{p}</span>;
    return <span key={i}>{p}</span>;
  });
}

function aiRespond(query) {
  const q = query.toLowerCase();
  if (q.includes("mysuru") || q.includes("chain")) {
    return {
      text: "Routed to CCTNS Relational DB. Interpreted as: night-window (20:00\u201305:00) chain-snatching incidents, Mysuru Urban district, trailing 90 days, grouped weekly.",
      sqlKind: "mysuru",
      chart: [{ w: "Wk 1", c: 4 }, { w: "Wk 2", c: 7 }, { w: "Wk 3", c: 5 }, { w: "Wk 4", c: 9 }, { w: "Wk 5", c: 6 }, { w: "Wk 6", c: 8 }],
      masked: true,
      exec: "142 ms \u00b7 3,214 rows scanned \u00b7 index: idx_fir_district_head",
    };
  }
  if (q.includes("cyber") || q.includes("indiranagar")) {
    return {
      text: "Routed to CCTNS Cyber Complaints table. Interpreted as: daily UPI/online-fraud complaint volume, Indiranagar PS jurisdiction, trailing 14 days.",
      sqlKind: "cyber",
      chart: [{ w: "D1", c: 3 }, { w: "D4", c: 5 }, { w: "D7", c: 6 }, { w: "D10", c: 9 }, { w: "D14", c: 12 }],
      masked: true,
      exec: "89 ms \u00b7 1,006 rows scanned \u00b7 index: idx_cyber_ps_date",
    };
  }
  if (q.includes("suspect") || q.includes("0142") || q.includes("fir")) {
    return {
      text: "Routed to Graph DB (Neo4j). FIR 0142/2026, Koramangala PS \u2014 2 suspects, 1 registered vehicle, 1 associated phone number, and 1 last-known location resolved within 2 degrees of separation. Open the Suspect Link Analysis module for the full graph.",
      sqlKind: "suspects",
      chart: null,
      masked: true,
      exec: "61 ms \u00b7 graph traversal depth: 2",
    };
  }
  if (q.includes("predict") || q.includes("hotspot")) {
    return {
      text: "Routed to Predictive Analytics service. Top-5 forecast hotspots for Bengaluru City district, 7-day forecast window, ranked by composite risk score.",
      sqlKind: "predictive",
      chart: null,
      masked: false,
      exec: "412 ms \u00b7 model: gradient-boosted risk v3.2",
    };
  }
  return {
    text: "Parsing via Hybrid Kanglish NLU\u2026 query intent partially resolved. [Demo mode] Try one of the suggested prompts below for a full walkthrough of NL-to-SQL, NL-to-Graph, and predictive routing.",
    sqlKind: "predictive",
    chart: null,
    masked: false,
    exec: "\u2014",
  };
}

/* ---------------------------------------------------------------------- */
/* lib/api.js (mock) — stands in for the Catalyst function gateway.       */
/* Simulated latency + occasional stale-cache flag, matching how the real */
/* /v1/kpis endpoint behaves when read replicas lag master by >30s.       */
/* ---------------------------------------------------------------------- */
const KPI_FIXTURE = [
  { label: "Total FIRs (YTD 2026)", value: "48,762", color: C.text, asOf: "24/07/2026 09:12 hrs" },
  { label: "Disposal Rate", value: "71.4%", color: C.green, asOf: "24/07/2026 06:00 hrs" },
  { label: "Pending Investigation", value: "13,958", color: C.amber, asOf: "24/07/2026 09:12 hrs" },
  { label: "Active P1 Alerts", value: "7", color: C.red, asOf: "moments ago" },
];
function fetchKPIs() {
  return new Promise((resolve) => {
    setTimeout(() => resolve(KPI_FIXTURE), 650 + Math.round(Math.random() * 400));
  });
}

/* ---------------------------------------------------------------------- */
/* SMALL UI PRIMITIVES                                                    */
/* ---------------------------------------------------------------------- */
function Panel({ children, style, className = "", ...rest }) {
  return (
    <div
      className={`ksp-hoverlift ksp-panel ${className}`}
      style={{
        background: `linear-gradient(160deg, ${C.panelAlt} 0%, ${C.panel} 60%)`,
        border: `1px solid ${C.border}`,
        borderRadius: 4,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

function Badge({ children, color = C.blue, dim = false }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-1.5 py-0.5 text-xs font-medium uppercase tracking-wide"
      style={{
        background: dim ? "transparent" : `${color}14`,
        color,
        borderLeft: `2px solid ${color}`,
        fontSize: 10.5,
        fontFamily: FONT_MONO,
      }}
    >
      {children}
    </span>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold tracking-widest mb-3" style={{ color: C.mutedDark, letterSpacing: "0.12em" }}>
      <span style={{ width: 5, height: 5, background: C.gold, display: "inline-block", flexShrink: 0 }} />
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* MODULE: AI CHAT / NL-TO-SQL                                            */
/* ---------------------------------------------------------------------- */
function ChatModule({ role, messages, setMessages, prefill, setPrefill }) {
  const [input, setInput] = useState(prefill || "");

  React.useEffect(() => {
    if (prefill) setInput(prefill);
  }, [prefill]);

  function send(text) {
    const q = (text || input).trim();
    if (!q) return;
    const resp = aiRespond(q);
    setMessages((m) => [...m, { role: "officer", text: q }, { role: "ai", ...resp }]);
    setInput("");
    setPrefill("");
  }

  const masked = role === "Constable" || role === "IO";

  return (
    <div className="grid grid-cols-3 gap-4 h-full">
      <div className="col-span-2 flex flex-col" style={{ minHeight: 560 }}>
        <Panel style={{ flex: 1, display: "flex", flexDirection: "column", padding: 16 }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles size={16} style={{ color: C.gold }} />
              <span className="text-sm font-semibold" style={{ color: C.text }}>Conversational Query Engine</span>
              <Badge color={C.green}>Kannada + English</Badge>
            </div>
            <Badge color={masked ? C.red : C.green}>{masked ? "PII Masking: ON" : "PII Masking: OFF (SP/DGP)"}</Badge>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1" style={{ maxHeight: 420 }}>
            {messages.length === 0 && (
              <div className="text-sm" style={{ color: C.muted }}>
                Ask about FIRs, suspects, patterns, or predictions in plain English or Kannada. Try a prompt template below.
              </div>
            )}
            {messages.map((m, i) =>
              m.role === "officer" ? (
                <div key={i} className="flex justify-end">
                  <div className="px-3 py-2 rounded-sm text-sm max-w-[80%]" style={{ background: C.blueDim, color: "#fff" }}>
                    {m.text}
                  </div>
                </div>
              ) : (
                <div key={i} className="space-y-2">
                  <div className="px-3 py-2 rounded-sm text-sm max-w-[90%]" style={{ background: C.panelAlt, color: C.text, border: `1px solid ${C.border}` }}>
                    {m.text}
                  </div>
                  <div className="rounded-sm overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
                    <div className="px-3 py-1.5 text-xs flex items-center justify-between" style={{ background: C.navyDeep, color: C.mutedDark }}>
                      <span>Generated Query \u2014 {m.sqlKind === "suspects" ? "Cypher / Neo4j" : "SQL / PostgreSQL"}</span>
                      <span>{m.exec}</span>
                    </div>
                    <pre className="px-3 py-2 text-xs font-mono overflow-x-auto" style={{ margin: 0, color: C.muted }}>
                      {highlightSQL(sqlFor(m.sqlKind))}
                    </pre>
                  </div>
                  {m.chart && (
                    <div style={{ height: 160 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={m.chart}>
                          <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                          <XAxis dataKey="w" tick={{ fill: C.muted, fontSize: 11 }} axisLine={{ stroke: C.border }} tickLine={false} />
                          <YAxis tick={{ fill: C.muted, fontSize: 11 }} axisLine={{ stroke: C.border }} tickLine={false} />
                          <Tooltip contentStyle={{ background: C.panelAlt, border: `1px solid ${C.border}`, fontSize: 12 }} />
                          <Bar dataKey="c" fill={C.gold} radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  {m.masked && (
                    <div className="text-xs flex items-center gap-1" style={{ color: C.mutedDark }}>
                      <Shield size={12} /> Complainant / victim PII redacted per RBAC profile: {role}
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-xs" style={{ color: C.mutedDark }}>
                    <button className="flex items-center gap-1 hover:opacity-80"><ThumbsUp size={12} /> Accurate</button>
                    <button className="flex items-center gap-1 hover:opacity-80"><ThumbsDown size={12} /> Inaccurate</button>
                    <button className="flex items-center gap-1 hover:opacity-80"><Download size={12} /> Export (PDF/XLS)</button>
                  </div>
                </div>
              )
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {CHIPS.map((c) => (
              <button
                key={c}
                onClick={() => send(c)}
                className="text-xs px-2.5 py-1 rounded-sm hover:opacity-90"
                style={{ background: C.panelAlt, color: C.muted, border: `1px solid ${C.border}` }}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button className="p-2 rounded-sm" style={{ background: C.panelAlt, border: `1px solid ${C.border}` }} title="Voice input">
              <Mic size={16} style={{ color: C.muted }} />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Type in English or Kannada\u2026 e.g. 'ಮೈಸೂರಿನಲ್ಲಿ ಸರಗಳ್ಳತನ ಪ್ರಕರಣಗಳು'"
              className="flex-1 text-sm px-3 py-2 rounded-sm outline-none"
              style={{ background: C.navyDeep, color: C.text, border: `1px solid ${C.border}` }}
            />
            <button onClick={() => send()} className="p-2 rounded-sm" style={{ background: C.blue }}>
              <Send size={16} color="#fff" />
            </button>
          </div>
        </Panel>
      </div>

      <div className="space-y-4">
        <Panel style={{ padding: 16 }}>
          <SectionLabel>ROUTING</SectionLabel>
          <div className="space-y-2 text-xs" style={{ color: C.muted }}>
            <div className="flex justify-between"><span>CCTNS Relational DB</span><Badge color={C.green}>Online</Badge></div>
            <div className="flex justify-between"><span>Graph DB (Neo4j)</span><Badge color={C.green}>Online</Badge></div>
            <div className="flex justify-between"><span>Vector DB (Embeddings)</span><Badge color={C.green}>Online</Badge></div>
            <div className="flex justify-between"><span>Predictive Model Service</span><Badge color={C.amber}>Degraded</Badge></div>
          </div>
        </Panel>
        <Panel style={{ padding: 16 }}>
          <SectionLabel>SESSION AUDIT LOG</SectionLabel>
          <div className="text-xs space-y-1.5 font-mono" style={{ color: C.mutedDark }}>
            <div>officer_id: KSP-IO-4471</div>
            <div>session: SESS-8827-KA</div>
            <div>queries_this_session: {messages.filter((m) => m.role === "officer").length}</div>
            <div>ip: 10.42.6.118 (KSP-Intranet)</div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* MODULE: GEOSPATIAL MAP                                                 */
/* ---------------------------------------------------------------------- */
function MapModule({ onAskAI }) {
  const [threshold, setThreshold] = useState(0);
  const [selected, setSelected] = useState(HOTSPOTS[0]);
  const [range, setRange] = useState("30D");
  const visible = HOTSPOTS.filter((h) => h.intensity >= threshold);

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {["24H", "7D", "30D", "5Y"].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className="text-xs px-3 py-1.5 rounded-sm"
                style={{
                  background: range === r ? C.blue : C.panelAlt,
                  color: range === r ? "#fff" : C.muted,
                  border: `1px solid ${range === r ? C.blue : C.border}`,
                }}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: C.muted }}>
            <span>KDE intensity \u2265</span>
            <input type="range" min={0} max={90} value={threshold} onChange={(e) => setThreshold(+e.target.value)} />
            <span style={{ color: C.gold, width: 24 }}>{threshold}</span>
          </div>
        </div>

        <Panel style={{ padding: 0, overflow: "hidden" }}>
          <div
            className="relative"
            style={{
              height: 480,
              background:
                `linear-gradient(${C.navyDeep}, ${C.navyDeep}), repeating-linear-gradient(0deg, ${C.border}22 0 1px, transparent 1px 40px), repeating-linear-gradient(90deg, ${C.border}22 0 1px, transparent 1px 40px)`,
            }}
          >
            <div className="absolute top-3 left-3 text-xs" style={{ color: C.mutedDark }}>
              KARNATAKA STATE \u2014 KDE CRIME HEATMAP \u00b7 {range} WINDOW
            </div>
            {visible.map((h) => (
              <button
                key={h.id}
                onClick={() => setSelected(h)}
                className="absolute rounded-full transition-transform hover:scale-110"
                style={{
                  left: `${h.x}%`,
                  top: `${h.y}%`,
                  width: 14 + h.intensity * 0.5,
                  height: 14 + h.intensity * 0.5,
                  transform: "translate(-50%,-50%)",
                  background: `${h.color}33`,
                  border: `2px solid ${h.color}`,
                  boxShadow: selected?.id === h.id ? `0 0 0 4px ${h.color}33` : "none",
                }}
                title={h.name}
              >
                <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 text-[10px] whitespace-nowrap" style={{ color: C.muted }}>
                  {h.name}
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 px-4 py-2 text-xs" style={{ borderTop: `1px solid ${C.border}`, color: C.mutedDark }}>
            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: C.red }} />Violent / Grievous</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: C.amber }} />Property</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: C.blue }} />Cybercrime</span>
          </div>
        </Panel>
      </div>

      <div className="space-y-4">
        {selected && (
          <Panel style={{ padding: 16 }}>
            <SectionLabel>SELECTED HOTSPOT</SectionLabel>
            <div className="text-sm font-semibold mb-1" style={{ color: C.text }}>{selected.name}</div>
            <div className="text-xs mb-3" style={{ color: C.muted }}>{selected.station}</div>
            <div className="space-y-2 text-xs" style={{ color: C.muted }}>
              <div className="flex justify-between"><span>Dominant crime head</span><span style={{ color: C.text }}>{selected.type}</span></div>
              <div className="flex justify-between"><span>KDE intensity</span><span style={{ color: C.gold }}>{selected.intensity}/100</span></div>
              <div className="flex justify-between"><span>Nearest response ETA</span><span style={{ color: C.text }}>6\u20139 min</span></div>
            </div>
            <button
              onClick={() => onAskAI(`Show recent ${selected.type} incidents near ${selected.name}, ${selected.station}`)}
              className="mt-4 w-full text-xs py-2 rounded-sm flex items-center justify-center gap-1.5"
              style={{ background: C.blue, color: "#fff" }}
            >
              <MessageSquare size={13} /> Ask AI about this location
            </button>
          </Panel>
        )}
        <Panel style={{ padding: 16 }}>
          <SectionLabel>LAYERS</SectionLabel>
          <div className="space-y-2 text-xs" style={{ color: C.muted }}>
            {["CCTV Coverage Cones", "Beat Boundaries", "Liquor Shop / ATM Overlay", "Street-light Vulnerability Index", "Isochrone (Response Time)"].map((l) => (
              <label key={l} className="flex items-center gap-2">
                <input type="checkbox" defaultChecked={l === "Beat Boundaries"} />
                {l}
              </label>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* MODULE: SUSPECT NETWORK GRAPH                                          */
/* ---------------------------------------------------------------------- */
function GraphModule({ onAskAI }) {
  const [selected, setSelected] = useState(null);
  const connected = useMemo(() => {
    if (!selected) return new Set();
    const s = new Set([selected]);
    GRAPH_EDGES.forEach(([a, b]) => {
      if (a === selected) s.add(b);
      if (b === selected) s.add(a);
    });
    return s;
  }, [selected]);

  const selNode = GRAPH_NODES.find((n) => n.id === selected);

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2">
        <Panel style={{ padding: 12 }}>
          <div className="flex items-center justify-between mb-2">
            <SectionLabel>LINK ANALYSIS \u2014 FIR 0142/2026, KORAMANGALA PS</SectionLabel>
            <Badge color={C.mutedDark} dim>Zoom / Pan enabled</Badge>
          </div>
          <svg viewBox="0 0 700 460" width="100%" height="460">
            {GRAPH_EDGES.map(([a, b], i) => {
              const na = GRAPH_NODES.find((n) => n.id === a);
              const nb = GRAPH_NODES.find((n) => n.id === b);
              const active = selected && connected.has(a) && connected.has(b);
              return (
                <line
                  key={i}
                  x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
                  stroke={active ? C.gold : C.border}
                  strokeWidth={active ? 2 : 1.2}
                />
              );
            })}
            {GRAPH_NODES.map((n) => {
              const style = NODE_STYLE[n.type];
              const dim = selected && !connected.has(n.id);
              return (
                <g
                  key={n.id}
                  transform={`translate(${n.x},${n.y})`}
                  onClick={() => setSelected(n.id === selected ? null : n.id)}
                  style={{ cursor: "pointer", opacity: dim ? 0.35 : 1 }}
                >
                  <circle r={selected === n.id ? 26 : 22} fill={`${style.color}22`} stroke={style.color} strokeWidth={selected === n.id ? 3 : 1.5} />
                  <text textAnchor="middle" dy={5} fontSize={10} fill={style.color} fontWeight={700}>
                    {n.type.slice(0, 3).toUpperCase()}
                  </text>
                  <text textAnchor="middle" dy={40} fontSize={11} fill={C.text}>{n.label}</text>
                  <text textAnchor="middle" dy={53} fontSize={9} fill={C.mutedDark}>{n.sub}</text>
                </g>
              );
            })}
          </svg>
        </Panel>
      </div>
      <div className="space-y-4">
        <Panel style={{ padding: 16 }}>
          <SectionLabel>NODE DETAIL</SectionLabel>
          {selNode ? (
            <div>
              <div className="text-sm font-semibold" style={{ color: C.text }}>{selNode.label}</div>
              <div className="text-xs mb-3" style={{ color: C.muted }}>{selNode.sub}</div>
              <div className="space-y-1.5 text-xs" style={{ color: C.muted }}>
                <div className="flex justify-between"><span>Node type</span><span style={{ color: C.text, textTransform: "capitalize" }}>{selNode.type}</span></div>
                <div className="flex justify-between"><span>Direct links</span><span style={{ color: C.text }}>{connected.size - 1}</span></div>
                <div className="flex justify-between"><span>Degrees from FIR 0142</span><span style={{ color: C.text }}>{selNode.id === "F1" ? 0 : 1}</span></div>
                {selNode.type === "suspect" && (
                  <>
                    <div className="flex justify-between"><span>Photo on file</span><span style={{ color: selNode.id === "S1" ? C.green : C.amber }}>{selNode.id === "S1" ? "Yes (2024)" : "Not on file"}</span></div>
                    <div className="flex justify-between"><span>Aadhaar linkage</span><span style={{ color: C.amber }}>Withheld \u2014 DPDP consent pending</span></div>
                  </>
                )}
                {selNode.type === "vehicle" && (
                  <div className="flex justify-between"><span>VAHAN RC status</span><span style={{ color: C.amber }}>2 pending challans</span></div>
                )}
              </div>
              <button
                onClick={() => onAskAI(`Give me the full profile and prior case history for ${selNode.label}`)}
                className="mt-4 w-full text-xs py-2 rounded-sm flex items-center justify-center gap-1.5"
                style={{ background: C.blue, color: "#fff" }}
              >
                <MessageSquare size={13} /> Ask AI about {selNode.label.split(" ")[0]}
              </button>
            </div>
          ) : (
            <div className="text-xs" style={{ color: C.mutedDark }}>Select a node to view suspect, vehicle, phone, or location detail.</div>
          )}
        </Panel>
        <Panel style={{ padding: 16 }}>
          <SectionLabel>LEGEND</SectionLabel>
          <div className="space-y-2 text-xs" style={{ color: C.muted }}>
            {Object.entries(NODE_STYLE).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: v.color }} />
                <span className="capitalize">{k}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* MODULE: PREDICTIVE ANALYTICS                                           */
/* ---------------------------------------------------------------------- */
function PredictiveModule() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Panel style={{ padding: 16 }} className="col-span-2">
          <SectionLabel>CHAIN-SNATCHING FORECAST \u2014 MYSURU URBAN (ARIMA/PROPHET, 3-WEEK HORIZON)</SectionLabel>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={FORECAST_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="week" tick={{ fill: C.muted, fontSize: 11 }} axisLine={{ stroke: C.border }} tickLine={false} />
                <YAxis tick={{ fill: C.muted, fontSize: 11 }} axisLine={{ stroke: C.border }} tickLine={false} />
                <Tooltip contentStyle={{ background: C.panelAlt, border: `1px solid ${C.border}`, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11, color: C.muted }} />
                <Line type="monotone" dataKey="actual" name="Actual" stroke={C.blue} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                <Line type="monotone" dataKey="predicted" name="Predicted" stroke={C.gold} strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel style={{ padding: 16 }}>
          <SectionLabel>ANOMALY ALERTS</SectionLabel>
          <div className="space-y-3">
            {ANOMALIES.map((a) => (
              <div key={a.id} className="flex items-start gap-2 text-xs">
                <AlertTriangle size={13} style={{ color: a.sev === "high" ? C.red : a.sev === "med" ? C.amber : C.mutedDark, marginTop: 1, flexShrink: 0 }} />
                <span style={{ color: C.muted }}>{a.text}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel style={{ padding: 16 }}>
        <SectionLabel>TOP 5 PREDICTED HOTSPOTS \u2014 NEXT 7 DAYS</SectionLabel>
        <table className="w-full text-xs" style={{ color: C.muted, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ color: C.mutedDark, textAlign: "left" }}>
              <th className="py-2 pr-4 font-medium">#</th>
              <th className="py-2 pr-4 font-medium">Jurisdiction</th>
              <th className="py-2 pr-4 font-medium">Predicted crime head</th>
              <th className="py-2 pr-4 font-medium">Risk score</th>
              <th className="py-2 pr-4 font-medium">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {HOTSPOT_RANKING.map((h) => (
              <tr key={h.rank} style={{ borderTop: `1px solid ${C.border}` }}>
                <td className="py-2 pr-4" style={{ color: C.text }}>{h.rank}</td>
                <td className="py-2 pr-4" style={{ color: C.text }}>{h.location}</td>
                <td className="py-2 pr-4">{h.crime}</td>
                <td className="py-2 pr-4">
                  <div className="flex items-center gap-2">
                    <div style={{ width: 80, height: 6, background: C.border, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${h.score}%`, height: "100%", background: h.score > 75 ? C.red : h.score > 55 ? C.amber : C.green }} />
                    </div>
                    <span>{h.score}</span>
                  </div>
                </td>
                <td className="py-2 pr-4">
                  <Badge color={h.confidence === "High" ? C.red : h.confidence === "Medium" ? C.amber : C.green}>{h.confidence}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* MODULE: EXECUTIVE COMMAND CENTER                                       */
/* ---------------------------------------------------------------------- */
/* ---------------------------------------------------------------------- */
/* MODULE: WOMEN & CHILD SAFETY / MISSING PERSONS                         */
/* ---------------------------------------------------------------------- */
function SafetyModule({ onAskAI }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Panel style={{ padding: 16 }}>
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>MISSING PERSONS \u2014 AUTO-MATCH AGAINST UIDB</SectionLabel>
          <Badge color={C.blue}>{MISSING_PERSONS.length} open</Badge>
        </div>
        <div className="space-y-3">
          {MISSING_PERSONS.map((p) => (
            <div key={p.id} style={{ borderLeft: `2px solid ${p.slaHrs === 0 ? C.red : p.slaHrs < 24 ? C.amber : C.border}`, paddingLeft: 10 }}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono" style={{ color: C.text }}>{p.id}</span>
                <Badge color={p.slaHrs === 0 ? C.red : p.slaHrs < 24 ? C.amber : C.mutedDark}>
                  {p.slaHrs === 0 ? "SLA breached" : `${p.slaHrs}h to SLA`}
                </Badge>
              </div>
              <div className="text-xs mt-1" style={{ color: C.muted }}>
                {p.initials} \u00b7 {p.age}{p.gender} \u00b7 Last seen: {p.lastSeen} \u00b7 Day {p.daysOpen} open
              </div>
              <div className="text-xs mt-1" style={{ color: p.uidbMatch ? C.green : C.mutedDark }}>
                {p.uidbMatch ? `UIDB match: ${p.uidbMatch}` : "No UIDB match on file"}
              </div>
              <button
                onClick={() => onAskAI(`Give me the case history and search-zone radius for missing person ${p.id}`)}
                className="text-xs mt-1 mb-2 flex items-center gap-1"
                style={{ color: C.blue }}
              >
                <MessageSquare size={11} /> Ask AI for search-zone radius
              </button>
            </div>
          ))}
        </div>
      </Panel>

      <Panel style={{ padding: 16 }}>
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>SOS / PANIC ALERT TRIAGE</SectionLabel>
          <span className="flex items-center gap-1 text-xs" style={{ color: C.red }}><Siren size={12} /> Live</span>
        </div>
        <div className="space-y-3">
          {SAFETY_ALERTS.map((a) => (
            <div key={a.id} className="flex items-start justify-between text-xs pb-3" style={{ borderBottom: `1px solid ${C.border}` }}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono" style={{ color: C.text }}>{a.id}</span>
                  <Badge color={a.priority === "P1" ? C.red : a.priority === "P2" ? C.amber : C.mutedDark}>{a.priority}</Badge>
                </div>
                <div className="mt-1" style={{ color: C.muted }}>{a.type} \u00b7 {a.location}</div>
                <div className="mt-1" style={{ color: C.mutedDark }}>{a.ts} hrs</div>
              </div>
              <div className="text-right">
                <div style={{ color: a.status === "Resolved" ? C.green : C.amber }}>{a.status}</div>
                <div style={{ color: C.mutedDark }}>ETA {a.eta}</div>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* MODULE: DAILY CRIME BULLETIN GENERATOR                                 */
/* ---------------------------------------------------------------------- */
function BulletinModule() {
  const [bulletin, setBulletin] = useState(null);
  const [generating, setGenerating] = useState(false);

  function generate() {
    setGenerating(true);
    setBulletin(null);
    setTimeout(() => {
      setBulletin(buildBulletin());
      setGenerating(false);
    }, 900);
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2">
        <Panel style={{ padding: 16, minHeight: 420 }}>
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>DAILY CRIME BULLETIN (DCB) \u2014 ZOHO WRITER ENGINE</SectionLabel>
            <button onClick={generate} className="text-xs px-3 py-1.5 rounded-sm flex items-center gap-1.5" style={{ background: C.blue, color: "#fff" }}>
              <ClipboardList size={13} /> {generating ? "Compiling\u2026" : "Generate today's bulletin"}
            </button>
          </div>
          {!bulletin && !generating && (
            <div className="text-xs" style={{ color: C.mutedDark }}>No bulletin compiled for this session yet. Click generate to pull today's figures.</div>
          )}
          {generating && (
            <div className="space-y-2">
              {[70, 90, 55, 80].map((w, i) => <div key={i} style={{ height: 10, width: `${w}%`, background: C.panelAlt, borderRadius: 2 }} />)}
            </div>
          )}
          {bulletin && (
            <div className="text-xs font-mono" style={{ color: C.muted, lineHeight: 1.7 }}>
              <div style={{ color: C.gold }}>Ref: {bulletin.ref} &nbsp;|&nbsp; {bulletin.date}</div>
              <div className="mt-2" style={{ color: C.text }}>{bulletin.summary}</div>
              <ul className="mt-3 space-y-1 list-disc pl-4">
                {bulletin.lines.map((l, i) => <li key={i}>{l}</li>)}
              </ul>
              <div className="mt-4 flex items-center gap-3">
                <button className="flex items-center gap-1 px-2 py-1 rounded-sm" style={{ border: `1px solid ${C.border}` }}><Download size={12} /> PDF</button>
                <button className="flex items-center gap-1 px-2 py-1 rounded-sm" style={{ border: `1px solid ${C.border}` }}><Download size={12} /> DOCX (Zoho Writer)</button>
                <button className="flex items-center gap-1 px-2 py-1 rounded-sm" style={{ border: `1px solid ${C.border}` }}><Send size={12} /> Route to Cliq #daily-briefing</button>
              </div>
            </div>
          )}
        </Panel>
      </div>
      <Panel style={{ padding: 16 }}>
        <SectionLabel>DISTRIBUTION LIST</SectionLabel>
        <div className="space-y-1.5 text-xs" style={{ color: C.muted }}>
          <div>DGP Secretariat \u2014 auto</div>
          <div>SP, Bengaluru City \u2014 auto</div>
          <div>SP, Mysuru \u2014 auto</div>
          <div>SP, Hubballi-Dharwad \u2014 auto</div>
          <div>Home Dept. Press Cell \u2014 on approval</div>
        </div>
      </Panel>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* MODULE: ZOHO ECOSYSTEM STATUS                                          */
/* ---------------------------------------------------------------------- */
function ZohoModule() {
  const statusColor = { Online: C.green, Syncing: C.blue, Degraded: C.amber };
  return (
    <div className="space-y-4">
      <Panel style={{ padding: 16 }}>
        <SectionLabel>SERVICE MESH \u2014 8 CONNECTED ZOHO SERVICES</SectionLabel>
        <div className="space-y-0">
          {ZOHO_SERVICES.map((s, i) => (
            <div key={s.name} className="flex items-center justify-between py-2.5 text-xs" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}>
              <div>
                <div style={{ color: C.text }}>{s.name}</div>
                <div style={{ color: C.mutedDark }}>{s.role}</div>
              </div>
              <div className="flex items-center gap-4">
                <span style={{ color: C.mutedDark }}>{s.detail}</span>
                <span style={{ color: C.mutedDark }}>synced {s.lastSync}</span>
                <Badge color={statusColor[s.status]}>{s.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel style={{ padding: 16 }}>
        <SectionLabel>BI-DIRECTIONAL SYNC MONITOR</SectionLabel>
        <div className="flex items-center gap-2 text-xs" style={{ color: C.muted }}>
          <RefreshCw size={13} style={{ color: C.blue }} />
          CCTNS \u2194 Zoho Analytics \u2014 last full reconciliation 24/07/2026 06:00 hrs \u00b7 next scheduled 24/07/2026 18:00 hrs
        </div>
      </Panel>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* MODULE: RBAC & COMPLIANCE                                              */
/* ---------------------------------------------------------------------- */
function SecurityModule() {
  const [breakGlass, setBreakGlass] = useState(false);
  const permColor = (v) => (v === "Full" || v.startsWith("Read/Write")) ? C.green : v === "None" ? C.mutedDark : C.amber;

  return (
    <div className="space-y-4">
      <Panel style={{ padding: 16, overflowX: "auto" }}>
        <SectionLabel>ROLE-BASED ACCESS MATRIX</SectionLabel>
        <table className="text-xs" style={{ color: C.muted, borderCollapse: "collapse", minWidth: 640 }}>
          <thead>
            <tr>
              <th className="text-left py-2 pr-4" style={{ color: C.mutedDark }}>Role</th>
              {RBAC_DOMAINS.map((d) => <th key={d} className="text-left py-2 pr-4 font-medium" style={{ color: C.mutedDark }}>{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {Object.entries(RBAC_MATRIX).map(([role, perms]) => (
              <tr key={role} style={{ borderTop: `1px solid ${C.border}` }}>
                <td className="py-2 pr-4" style={{ color: C.text }}>{role}</td>
                {perms.map((p, i) => <td key={i} className="py-2 pr-4" style={{ color: permColor(p) }}>{p}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <div className="grid grid-cols-3 gap-4">
        <Panel style={{ padding: 16 }}>
          <SectionLabel>MFA / BIOMETRIC LOGIN</SectionLabel>
          <div className="flex items-center gap-2 text-xs mb-2" style={{ color: C.green }}>
            <Fingerprint size={14} /> Biometric verified \u00b7 09:02:14 hrs
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: C.green }}>
            <KeyRound size={14} /> OTP + Hardware key \u2014 both factors satisfied
          </div>
        </Panel>
        <Panel style={{ padding: 16 }}>
          <SectionLabel>DPDP ACT COMPLIANCE</SectionLabel>
          <label className="flex items-center gap-2 text-xs" style={{ color: C.muted }}>
            <input type="checkbox" defaultChecked /> Enforce Digital Personal Data Protection Act masking
          </label>
          <div className="text-[10px] mt-2" style={{ color: C.mutedDark }}>Consent registry last audited: 20/07/2026</div>
        </Panel>
        <Panel style={{ padding: 16, borderLeft: breakGlass ? `2px solid ${C.red}` : undefined }}>
          <SectionLabel>EMERGENCY BREAK-GLASS ACCESS</SectionLabel>
          <button
            onClick={() => setBreakGlass(!breakGlass)}
            className="text-xs px-3 py-1.5 rounded-sm w-full"
            style={{ background: breakGlass ? C.red : C.panelAlt, color: breakGlass ? "#fff" : C.muted, border: `1px solid ${breakGlass ? C.red : C.border}` }}
          >
            {breakGlass ? "Active \u2014 tap to revoke" : "Grant tactical override"}
          </button>
          {breakGlass && <div className="text-[10px] mt-2" style={{ color: C.mutedDark }}>Logged to immutable audit trail \u00b7 requires SP countersign within 24h</div>}
        </Panel>
      </div>

      <Panel style={{ padding: 16 }}>
        <SectionLabel>IMMUTABLE AUDIT TRAIL</SectionLabel>
        <div className="space-y-2 text-xs font-mono">
          {AUDIT_TRAIL.map((a, i) => (
            <div key={i} className="flex items-center justify-between" style={{ color: C.muted, borderTop: i === 0 ? "none" : `1px solid ${C.border}`, paddingTop: i === 0 ? 0 : 6 }}>
              <span style={{ color: C.mutedDark, width: 150 }}>{a.ts}</span>
              <span style={{ width: 120, color: C.text }}>{a.officer}</span>
              <span style={{ width: 130, color: C.blue }}>{a.action}</span>
              <span className="flex-1" style={{ color: C.muted }}>{a.detail}</span>
              <span className="flex items-center gap-1" style={{ color: C.mutedDark }}><Hash size={11} />{a.hash}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function DashboardModule() {
  const [kpis, setKpis] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchKPIs().then((data) => { if (!cancelled) setKpis(data); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {(kpis || Array.from({ length: 4 })).map((k, i) => (
          <Panel key={k?.label || i} style={{ padding: 16, borderLeft: k ? `2px solid ${k.color}` : undefined, borderRadius: 4 }}>
            {k ? (
              <>
                <div className="text-xs mb-1" style={{ color: C.mutedDark }}>{k.label}</div>
                <div className="text-2xl font-semibold" style={{ color: k.color, fontFamily: FONT_DISPLAY }}>{k.value}</div>
                <div className="text-[10px] mt-1" style={{ color: C.mutedDark }}>as of {k.asOf}</div>
              </>
            ) : (
              <>
                <div style={{ height: 10, width: "70%", background: C.panelAlt, borderRadius: 2, marginBottom: 10 }} />
                <div style={{ height: 22, width: "45%", background: C.panelAlt, borderRadius: 2 }} />
              </>
            )}
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Panel style={{ padding: 16 }}>
          <SectionLabel>FIRs BY CRIME CATEGORY \u2014 STATEWIDE</SectionLabel>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CRIME_CATEGORY_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="name" tick={{ fill: C.muted, fontSize: 10 }} axisLine={{ stroke: C.border }} tickLine={false} />
                <YAxis tick={{ fill: C.muted, fontSize: 11 }} axisLine={{ stroke: C.border }} tickLine={false} />
                <Tooltip contentStyle={{ background: C.panelAlt, border: `1px solid ${C.border}`, fontSize: 12 }} />
                <Bar dataKey="value" fill={C.blue} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel style={{ padding: 16 }}>
          <SectionLabel>MONTHLY FIR TREND \u2014 2026</SectionLabel>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MONTHLY_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="month" tick={{ fill: C.muted, fontSize: 11 }} axisLine={{ stroke: C.border }} tickLine={false} />
                <YAxis tick={{ fill: C.muted, fontSize: 11 }} axisLine={{ stroke: C.border }} tickLine={false} />
                <Tooltip contentStyle={{ background: C.panelAlt, border: `1px solid ${C.border}`, fontSize: 12 }} />
                <Line type="monotone" dataKey="firs" stroke={C.gold} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel style={{ padding: 16 }}>
        <SectionLabel>DAY \u00d7 HOUR INCIDENT DENSITY MATRIX</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: `80px repeat(${SLOTS.length}, 1fr)`, gap: 4 }}>
          <div />
          {SLOTS.map((s) => (
            <div key={s} className="text-[10px] text-center" style={{ color: C.mutedDark }}>{s}</div>
          ))}
          {DAYS.map((d, di) => (
            <React.Fragment key={d}>
              <div className="text-xs flex items-center" style={{ color: C.muted }}>{d}</div>
              {SLOTS.map((s, si) => {
                const v = HOUR_MATRIX[di][si];
                return (
                  <div
                    key={s}
                    title={`${d} ${s}: density ${v}`}
                    style={{
                      height: 28,
                      borderRadius: 4,
                      background: `${C.red}${Math.round((v / 96) * 255).toString(16).padStart(2, "0")}`,
                      border: `1px solid ${C.border}`,
                    }}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* MODULE: AI CAMERA CRIME TRACKING                                       */
/* ---------------------------------------------------------------------- */
function CCTVModule({ onAskAI }) {
  const [selected, setSelected] = useState(CAMERAS[0].id);
  const [feed, setFeed] = useState([]);
  const [box, setBox] = useState({ x: 30, y: 30, w: 28, h: 28 });

  useEffect(() => {
    const t = setInterval(() => {
      const onlineCams = CAMERAS.filter((c) => c.status === "Online");
      const cam = onlineCams[Math.floor(Math.random() * onlineCams.length)];
      const tmpl = DETECTION_TEMPLATES[Math.floor(Math.random() * DETECTION_TEMPLATES.length)];
      const conf = Math.max(48, Math.min(97, tmpl.conf + Math.round((Math.random() - 0.5) * 14)));
      const entry = {
        id: `${Date.now()}-${Math.random()}`,
        cam: cam.id,
        station: cam.station,
        label: tmpl.label,
        sev: tmpl.sev,
        conf,
        ts: new Date().toLocaleTimeString("en-IN", { hour12: false }),
      };
      setFeed((f) => [entry, ...f].slice(0, 30));
    }, 3200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setBox({
        x: 8 + Math.random() * 55,
        y: 8 + Math.random() * 55,
        w: 20 + Math.random() * 16,
        h: 20 + Math.random() * 16,
      });
    }, 1400);
    return () => clearInterval(t);
  }, []);

  const activeCam = CAMERAS.find((c) => c.id === selected);
  const sevColor = { high: C.red, med: C.amber, low: C.blue };
  const onlineCount = CAMERAS.filter((c) => c.status === "Online").length;

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2 space-y-4">
        <Panel style={{ padding: 0, overflow: "hidden" }}>
          <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: `1px solid ${C.border}` }}>
            <div className="flex items-center gap-2 text-xs" style={{ color: C.text }}>
              <Camera size={14} style={{ color: C.gold }} /> {activeCam.id} \u00b7 {activeCam.junction}
            </div>
            <Badge color={activeCam.status === "Online" ? C.green : C.mutedDark}>{activeCam.status}</Badge>
          </div>
          <div className="relative" style={{ height: 300, background: "#050B14", overflow: "hidden" }}>
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `linear-gradient(${C.border}22 1px, transparent 1px), linear-gradient(90deg, ${C.border}22 1px, transparent 1px)`,
                backgroundSize: "28px 28px",
              }}
            />
            {activeCam.status === "Online" ? (
              <>
                <div
                  className="absolute"
                  style={{
                    left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%`, height: `${box.h}%`,
                    border: `2px solid ${C.gold}`, borderRadius: 3, transition: "all 1.1s ease",
                    boxShadow: `0 0 14px ${C.gold}55`,
                  }}
                >
                  <span className="absolute -top-5 left-0 text-[10px] px-1 font-mono" style={{ background: C.gold, color: "#0B192C" }}>
                    TRACKING
                  </span>
                </div>
                <div
                  className="absolute left-0 w-full"
                  style={{ top: 0, height: 2, background: `linear-gradient(90deg, transparent, ${C.blue}, transparent)`, animation: "ksp-scan 3.5s linear infinite" }}
                />
                <div className="absolute top-3 right-3 flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded" style={{ background: "rgba(0,0,0,0.5)", color: C.red }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.red, animation: "ksp-pulse 1s ease-in-out infinite" }} /> LIVE \u00b7 AI TRACKING ON
                </div>
                <div className="absolute bottom-3 left-3 text-[10px] font-mono px-2 py-1 rounded" style={{ background: "rgba(0,0,0,0.5)", color: C.muted }}>
                  {activeCam.station} \u00b7 {activeCam.district}
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={{ color: C.mutedDark }}>
                <WifiOff size={22} />
                <div className="text-xs">Feed unavailable \u2014 fibre cut reported</div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto" style={{ borderTop: `1px solid ${C.border}` }}>
            {CAMERAS.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className="flex-shrink-0 flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded-sm"
                style={{
                  background: selected === c.id ? `${C.gold}18` : "transparent",
                  color: selected === c.id ? C.gold : c.status === "Online" ? C.muted : C.mutedDark,
                  border: `1px solid ${selected === c.id ? C.goldDim : C.border}`,
                }}
              >
                {c.status === "Online" ? <Wifi size={10} /> : <WifiOff size={10} />} {c.id}
              </button>
            ))}
          </div>
        </Panel>

        <Panel style={{ padding: 16 }}>
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>LIVE AI DETECTION FEED \u2014 ALL JUNCTIONS</SectionLabel>
            <span className="flex items-center gap-1 text-xs" style={{ color: C.green }}>
              <Activity size={12} style={{ animation: "ksp-pulse 2s ease-in-out infinite" }} /> {onlineCount}/{CAMERAS.length} cameras online
            </span>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto ksp-scrollbar">
            {feed.length === 0 && <div className="text-xs" style={{ color: C.mutedDark }}>Listening for AI-flagged events\u2026</div>}
            {feed.map((e) => (
              <div key={e.id} className="flex items-center justify-between text-xs pb-2" style={{ borderBottom: `1px solid ${C.border}` }}>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: sevColor[e.sev] }} />
                  <div>
                    <div style={{ color: C.text }}>{e.label}</div>
                    <div style={{ color: C.mutedDark }}>{e.cam} \u00b7 {e.station} \u00b7 {e.ts}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge color={sevColor[e.sev]}>{e.conf}% conf.</Badge>
                  {e.sev === "high" && (
                    <button onClick={() => onAskAI(`Escalate CCTV detection: ${e.label} at ${e.cam}`)} className="text-xs" style={{ color: C.blue }}>
                      Escalate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="space-y-4">
        <Panel style={{ padding: 16 }}>
          <SectionLabel>CAMERA NETWORK STATUS</SectionLabel>
          <div className="space-y-2">
            {CAMERAS.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-xs pb-2" style={{ borderBottom: `1px solid ${C.border}` }}>
                <div>
                  <div style={{ color: C.text }}>{c.id}</div>
                  <div style={{ color: C.mutedDark }}>{c.station}</div>
                </div>
                <Badge color={c.status === "Online" ? C.green : C.red}>{c.status === "Online" ? "Online" : "Offline"}</Badge>
              </div>
            ))}
          </div>
        </Panel>
        <Panel style={{ padding: 16 }}>
          <SectionLabel>DETECTION MODEL</SectionLabel>
          <div className="text-xs space-y-1.5" style={{ color: C.muted }}>
            <div className="flex items-center gap-1.5"><Zap size={12} style={{ color: C.gold }} /> Model: YOLO-KSP-anomaly v3.2 (mock)</div>
            <div>Classes: loitering, crowd dispersal, altercation, ANPR match, unattended object</div>
            <div>Inference: edge (Catalyst-managed) \u00b7 avg latency 210ms</div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* MODULE: VOICE DISPATCH                                                 */
/* ---------------------------------------------------------------------- */
function DispatchModule() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [log, setLog] = useState([]);

  function logDispatch(cmd) {
    const unit = PATROL_UNITS[Math.floor(Math.random() * PATROL_UNITS.length)];
    setLog((l) => [
      { id: `${Date.now()}-${Math.random()}`, cmd, unit: unit.id, eta: unit.eta, ts: new Date().toLocaleTimeString("en-IN", { hour12: false }) },
      ...l,
    ].slice(0, 12));
  }

  function startListening() {
    if (listening) return;
    setListening(true);
    setTranscript("");
    const cmd = VOICE_COMMANDS[Math.floor(Math.random() * VOICE_COMMANDS.length)];
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setTranscript(cmd.slice(0, i));
      if (i >= cmd.length) {
        clearInterval(t);
        setListening(false);
        logDispatch(cmd);
      }
    }, 45);
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2 space-y-4">
        <Panel style={{ padding: 20 }}>
          <div className="flex items-center justify-between mb-4">
            <SectionLabel>VOICE DISPATCH \u2014 SPEECH-TO-INTENT ROUTING</SectionLabel>
            <Badge color={C.blue}>Kanglish NLU</Badge>
          </div>
          <div className="flex flex-col items-center justify-center py-6 gap-4">
            <button
              onClick={startListening}
              disabled={listening}
              className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: listening ? `${C.red}22` : `${C.gold}18`,
                border: `2px solid ${listening ? C.red : C.goldDim}`,
                boxShadow: listening ? `0 0 0 8px ${C.red}14` : "none",
                transition: "box-shadow 0.3s ease",
              }}
            >
              <Mic size={22} style={{ color: listening ? C.red : C.gold }} />
            </button>
            {listening && (
              <div className="flex items-end gap-1" style={{ height: 20 }}>
                {Array.from({ length: 9 }).map((_, i) => (
                  <span
                    key={i}
                    style={{
                      width: 3, height: "100%", background: C.gold, borderRadius: 2,
                      animation: `ksp-bar ${0.5 + (i % 4) * 0.1}s ease-in-out infinite`,
                      animationDelay: `${i * 0.05}s`,
                    }}
                  />
                ))}
              </div>
            )}
            <div className="text-xs font-mono min-h-[16px] text-center" style={{ color: C.text }}>
              {transcript || (listening ? "" : "Tap the mic to simulate a voice dispatch command")}
              {listening && <span style={{ animation: "ksp-blink 0.9s step-end infinite" }}>|</span>}
            </div>
          </div>
          <div>
            <SectionLabel>SAMPLE COMMANDS</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {VOICE_COMMANDS.map((c) => (
                <button
                  key={c}
                  onClick={() => { setListening(false); setTranscript(c); logDispatch(c); }}
                  className="text-xs px-2.5 py-1.5 rounded-sm"
                  style={{ border: `1px solid ${C.border}`, color: C.muted }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </Panel>

        <Panel style={{ padding: 16 }}>
          <SectionLabel>DISPATCH LOG</SectionLabel>
          <div className="space-y-2 max-h-64 overflow-y-auto ksp-scrollbar">
            {log.length === 0 && <div className="text-xs" style={{ color: C.mutedDark }}>No dispatch commands issued this session.</div>}
            {log.map((l) => (
              <div key={l.id} className="flex items-center justify-between text-xs pb-2" style={{ borderBottom: `1px solid ${C.border}` }}>
                <div>
                  <div style={{ color: C.text }}>{l.cmd}</div>
                  <div style={{ color: C.mutedDark }}>{l.ts} hrs</div>
                </div>
                <Badge color={C.green}>Unit {l.unit} \u00b7 ETA {l.eta}</Badge>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel style={{ padding: 16 }}>
        <SectionLabel>PATROL UNITS \u2014 AVAILABLE</SectionLabel>
        <div className="space-y-2">
          {PATROL_UNITS.map((u) => (
            <div key={u.id} className="flex items-center justify-between text-xs pb-2" style={{ borderBottom: `1px solid ${C.border}` }}>
              <div>
                <div style={{ color: C.text }}>Unit {u.id}</div>
                <div style={{ color: C.mutedDark }}>{u.base}</div>
              </div>
              <Badge color={C.blue}>ETA {u.eta}</Badge>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* MODULE: AUTOMATIC ALERTS                                               */
/* ---------------------------------------------------------------------- */
function AlertsModule({ onAskAI }) {
  const [rules, setRules] = useState(ALERT_RULES);
  const [stream, setStream] = useState([]);

  useEffect(() => {
    const t = setInterval(() => {
      const enabledRules = rules.filter((r) => r.enabled).map((r) => r.id);
      const pool = ALERT_TEMPLATES.filter((a) => enabledRules.includes(a.rule));
      if (pool.length === 0) return;
      const tmpl = pool[Math.floor(Math.random() * pool.length)];
      const entry = { id: `${Date.now()}-${Math.random()}`, ...tmpl, ts: new Date().toLocaleTimeString("en-IN", { hour12: false }) };
      setStream((s) => [entry, ...s].slice(0, 25));
      setRules((rs) => rs.map((r) => (r.id === tmpl.rule ? { ...r, triggers: r.triggers + 1 } : r)));
    }, 4200);
    return () => clearInterval(t);
  }, [rules]);

  function toggle(id) {
    setRules((rs) => rs.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  }

  const sevColor = { high: C.red, med: C.amber, low: C.blue };

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2">
        <Panel style={{ padding: 16 }}>
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>LIVE ALERT STREAM</SectionLabel>
            <span className="flex items-center gap-1 text-xs" style={{ color: C.red }}>
              <Siren size={12} style={{ animation: "ksp-pulse 1.4s ease-in-out infinite" }} /> Auto-triggering
            </span>
          </div>
          <div className="space-y-3 max-h-[440px] overflow-y-auto ksp-scrollbar">
            {stream.length === 0 && <div className="text-xs" style={{ color: C.mutedDark }}>Monitoring enabled rule sources for triggers\u2026</div>}
            {stream.map((a) => (
              <div key={a.id} style={{ borderLeft: `2px solid ${sevColor[a.sev]}`, paddingLeft: 10 }} className="pb-1">
                <div className="flex items-center justify-between text-xs">
                  <Badge color={sevColor[a.sev]}>{a.sev.toUpperCase()}</Badge>
                  <span style={{ color: C.mutedDark }}>{a.ts} hrs</span>
                </div>
                <div className="text-xs mt-1" style={{ color: C.text }}>{a.text}</div>
                {a.sev === "high" && (
                  <button onClick={() => onAskAI(a.text)} className="text-xs mt-1 flex items-center gap-1" style={{ color: C.blue }}>
                    <MessageSquare size={11} /> Investigate with AI
                  </button>
                )}
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel style={{ padding: 16 }}>
        <SectionLabel>ALERT RULES ENGINE</SectionLabel>
        <div className="space-y-3">
          {rules.map((r) => (
            <div key={r.id} className="pb-3" style={{ borderBottom: `1px solid ${C.border}` }}>
              <div className="flex items-center justify-between text-xs gap-2">
                <span style={{ color: C.text }}>{r.name}</span>
                <button
                  onClick={() => toggle(r.id)}
                  className="w-8 h-4 rounded-full relative flex-shrink-0"
                  style={{ background: r.enabled ? C.green : C.border, transition: "background 0.2s ease" }}
                >
                  <span
                    className="absolute top-0.5 rounded-full"
                    style={{ width: 12, height: 12, left: r.enabled ? 18 : 2, background: "#fff", transition: "left 0.2s ease" }}
                  />
                </button>
              </div>
              <div className="text-[10px] mt-1" style={{ color: C.mutedDark }}>{r.source} \u00b7 {r.triggers} triggers this session</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* MODULE: CRIME REPORTS (500-RECORD DATASET)                             */
/* ---------------------------------------------------------------------- */
function ReportsModule() {
  const [q, setQ] = useState("");
  const [district, setDistrict] = useState("All");
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(1);
  const perPage = 12;

  const districts = ["All", ...RPT_DISTRICTS.map((d) => d.d)];
  const statuses = ["All", ...RPT_STATUS];

  const filtered = useMemo(() => {
    return CRIME_REPORTS.filter((r) => {
      if (district !== "All" && r.district !== district) return false;
      if (status !== "All" && r.status !== status) return false;
      if (q && !`${r.firNo} ${r.crimeHead} ${r.station}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [q, district, status]);

  useEffect(() => setPage(1), [q, district, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageRows = filtered.slice((page - 1) * perPage, page * perPage);

  const sevColor = { High: C.red, Medium: C.amber, Low: C.mutedDark };
  const statusColor = { "FIR Registered": C.blue, "Under Investigation": C.amber, "Charge Sheet Filed": C.gold, "Case Closed": C.green };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <Panel style={{ padding: 14 }}>
          <div className="text-xs" style={{ color: C.mutedDark }}>Total Reports</div>
          <div className="text-xl font-semibold" style={{ color: C.text, fontFamily: FONT_DISPLAY }}>{CRIME_REPORTS.length}</div>
        </Panel>
        <Panel style={{ padding: 14 }}>
          <div className="text-xs" style={{ color: C.mutedDark }}>Matching Filter</div>
          <div className="text-xl font-semibold" style={{ color: C.gold, fontFamily: FONT_DISPLAY }}>{filtered.length}</div>
        </Panel>
        <Panel style={{ padding: 14 }}>
          <div className="text-xs" style={{ color: C.mutedDark }}>Charge Sheets Filed</div>
          <div className="text-xl font-semibold" style={{ color: C.green, fontFamily: FONT_DISPLAY }}>{CRIME_REPORTS.filter((r) => r.status === "Charge Sheet Filed").length}</div>
        </Panel>
        <Panel style={{ padding: 14 }}>
          <div className="text-xs" style={{ color: C.mutedDark }}>High Severity</div>
          <div className="text-xl font-semibold" style={{ color: C.red, fontFamily: FONT_DISPLAY }}>{CRIME_REPORTS.filter((r) => r.severity === "High").length}</div>
        </Panel>
      </div>

      <Panel style={{ padding: 16 }}>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm flex-1 min-w-[220px]" style={{ background: C.panelAlt, border: `1px solid ${C.border}` }}>
            <Search size={13} style={{ color: C.mutedDark }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search FIR no., crime head, station\u2026"
              className="bg-transparent outline-none text-xs flex-1"
              style={{ color: C.text }}
            />
          </div>
          <select value={district} onChange={(e) => setDistrict(e.target.value)} className="text-xs px-2 py-1.5 rounded-sm outline-none" style={{ background: C.panelAlt, color: C.text, border: `1px solid ${C.border}` }}>
            {districts.map((d) => <option key={d}>{d}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="text-xs px-2 py-1.5 rounded-sm outline-none" style={{ background: C.panelAlt, color: C.text, border: `1px solid ${C.border}` }}>
            {statuses.map((s) => <option key={s}>{s}</option>)}
          </select>
          <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-sm" style={{ background: C.blue, color: "#fff" }}>
            <Download size={13} /> Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ color: C.mutedDark, borderBottom: `1px solid ${C.border}` }}>
                {["FIR No.", "Date", "District", "Station", "Crime Head", "Section", "Status", "Severity"].map((h) => (
                  <th key={h} className="text-left py-2 pr-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r) => (
                <tr key={r.id} className="ksp-hoverlift" style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td className="py-2 pr-3 font-mono" style={{ color: C.text }}>{r.firNo}</td>
                  <td className="py-2 pr-3" style={{ color: C.muted }}>{r.date} {r.time}</td>
                  <td className="py-2 pr-3" style={{ color: C.muted }}>{r.district}</td>
                  <td className="py-2 pr-3" style={{ color: C.muted }}>{r.station}</td>
                  <td className="py-2 pr-3" style={{ color: C.text }}>{r.crimeHead}</td>
                  <td className="py-2 pr-3 font-mono" style={{ color: C.mutedDark }}>{r.section}</td>
                  <td className="py-2 pr-3"><Badge color={statusColor[r.status]}>{r.status}</Badge></td>
                  <td className="py-2 pr-3"><Badge color={sevColor[r.severity]}>{r.severity}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4 text-xs" style={{ color: C.mutedDark }}>
          <div>Showing {(page - 1) * perPage + 1}\u2013{Math.min(page * perPage, filtered.length)} of {filtered.length}</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1 rounded-sm" style={{ border: `1px solid ${C.border}`, opacity: page === 1 ? 0.4 : 1 }}>
              <ChevronLeft size={13} />
            </button>
            <span>Page {page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1 rounded-sm" style={{ border: `1px solid ${C.border}`, opacity: page === totalPages ? 0.4 : 1 }}>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </Panel>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* SHELL                                                                  */
/* ---------------------------------------------------------------------- */
export default function App() {
  const [active, setActive] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [role, setRole] = useState("IO");
  const [lang, setLang] = useState("EN");
  const [messages, setMessages] = useState([]);
  const [prefill, setPrefill] = useState("");
  const [now, setNow] = useState(new Date());
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const istTime = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

  function askAI(text) {
    setPrefill(text);
    setActive("chat");
  }

  const titles = {
    chat: "AI Query Engine",
    map: "Geospatial Command",
    predictive: "Forecast & Hotspots",
    graph: "Suspect Link Analysis",
    dashboard: "Executive Overview",
    safety: "Women & Child Safety",
    cctv: "Camera Crime Tracking",
    dispatch: "Voice Dispatch",
    alerts: "Automatic Alerts",
    reports: "Crime Reports (500)",
    bulletin: "Crime Bulletin Generator",
    zoho: "Zoho Ecosystem Status",
    security: "RBAC & Compliance",
  };

  return (
    <div className="w-full h-full flex flex-col" style={{ background: C.navy, minHeight: 640, fontFamily: "Inter, ui-sans-serif, system-ui" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes ksp-pulse { 0%,100% { opacity: 1; } 50% { opacity: .35; } }
        @keyframes ksp-blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes ksp-scan { 0% { transform: translateY(-100%); } 100% { transform: translateY(220%); } }
        @keyframes ksp-bar { 0%,100% { transform: scaleY(0.25); } 50% { transform: scaleY(1); } }
        .ksp-hoverlift { transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease; }
        .ksp-panel { position: relative; }
        .ksp-panel:hover { transform: translateY(-1px); box-shadow: 0 10px 24px rgba(0,0,0,0.4); border-color: ${C.borderLight}; }
        .ksp-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .ksp-scrollbar::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
        .ksp-scrollbar::-webkit-scrollbar-track { background: transparent; }
        @keyframes ksp-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .ksp-topbar-accent { height: 2px; background: linear-gradient(90deg, transparent, ${C.gold}, transparent); background-size: 200% 100%; animation: ksp-shimmer 4.5s linear infinite; }
        @keyframes ksp-radar-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .ksp-radar-ring { position: absolute; inset: -5px; border-radius: 8px; background: conic-gradient(from 0deg, ${C.gold} 0deg, transparent 60deg, transparent 360deg); animation: ksp-radar-spin 3.2s linear infinite; opacity: 0.55; }
        .ksp-radar-mask { position: absolute; inset: 2px; border-radius: 6px; background: ${C.navyDeep}; }
        .ksp-nav-btn { position: relative; transition: background 0.15s ease, color 0.15s ease; }
        .ksp-nav-btn:hover { background: ${C.panelAlt} !important; color: ${C.text} !important; }
        .ksp-search-wrap { transition: border-color 0.15s ease, box-shadow 0.15s ease; }
        .ksp-search-wrap:focus-within { border-color: ${C.goldDim} !important; box-shadow: 0 0 0 3px ${C.gold}14; }
        .ksp-sidebar-fade { background: linear-gradient(180deg, ${C.navyDeep} 0%, #0A1728 100%); }
      `}</style>
      {/* TOP BAR */}
      <div className="flex items-center justify-between px-4 h-14 flex-shrink-0" style={{ background: `linear-gradient(90deg, ${C.navyDeep} 0%, #0A1A30 100%)`, borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 flex-shrink-0">
            <div className="ksp-radar-ring" />
            <div className="ksp-radar-mask" />
            <div className="relative w-8 h-8 rounded flex items-center justify-center" style={{ background: `${C.gold}18`, border: `1px solid ${C.goldDim}` }}>
              <Shield size={16} style={{ color: C.gold }} />
            </div>
          </div>
          <div>
            <div className="text-sm font-bold" style={{ color: C.text, fontFamily: FONT_DISPLAY, letterSpacing: "0.03em" }}>
              KSP <span style={{ color: C.gold }}>SENTINEL-AI</span>
            </div>
            <div className="text-[10px]" style={{ color: C.mutedDark }}>{LABELS[lang].subtitle}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-md mx-6">
          <div className="ksp-search-wrap flex items-center gap-2 w-full px-3 py-1.5 rounded-sm" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
            <Search size={13} style={{ color: C.mutedDark }} />
            <input placeholder={LABELS[lang].search} className="bg-transparent outline-none text-xs flex-1" style={{ color: C.text }} />
            <span className="text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5" style={{ background: C.navyDeep, color: C.mutedDark, border: `1px solid ${C.border}`, fontFamily: FONT_MONO }}>
              <Command size={9} />K
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { setDemoOpen(true); setDemoStep(0); setActive(DEMO_STEPS[0].module); }}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-sm"
            style={{ background: `${C.gold}18`, color: C.gold, border: `1px solid ${C.goldDim}` }}
          >
            <PlayCircle size={13} /> Guided Demo
          </button>
          <button onClick={() => setLang(lang === "EN" ? "KN" : "EN")} className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-sm" style={{ color: C.muted, border: `1px solid ${C.border}` }}>
            <Globe size={13} /> {lang}
          </button>
          <div className="relative">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="text-xs px-2 py-1.5 rounded-sm outline-none appearance-none pr-6"
              style={{ background: C.panel, color: C.text, border: `1px solid ${C.border}` }}
            >
              {["Constable", "IO", "SHO", "SP", "DGP"].map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <button className="relative p-1.5 rounded-sm" style={{ border: `1px solid ${C.border}` }}>
            <Bell size={14} style={{ color: C.muted }} />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-[9px] flex items-center justify-center" style={{ background: C.red, color: "#fff" }}>7</span>
          </button>
          <div className="text-xs tabular-nums" style={{ color: C.mutedDark, fontFamily: FONT_MONO }}>{istTime} IST</div>
          <div className="flex items-center gap-1.5 text-xs pl-2 py-1 pr-2 rounded-sm" style={{ color: C.green, borderLeft: `2px solid ${C.green}`, background: `${C.green}0d` }}>
            <Radio size={12} style={{ animation: "ksp-pulse 2s ease-in-out infinite" }} /> SYSTEMS NOMINAL
          </div>
        </div>
      </div>

      <div className="ksp-topbar-accent flex-shrink-0" />

      <div className="flex flex-1 min-h-0">
        {/* SIDEBAR */}
        <div className="ksp-sidebar-fade flex-shrink-0 flex flex-col" style={{ width: collapsed ? 56 : 220, borderRight: `1px solid ${C.border}`, transition: "width 0.15s ease" }}>
          <div className="flex-1 py-4 overflow-y-auto">
            {NAV_GROUPS.map((g) => (
              <div key={g.label} className="mb-5 px-3">
                {!collapsed && <div className="text-[10px] font-semibold mb-2 px-1" style={{ color: C.mutedDark, letterSpacing: "0.1em", fontFamily: FONT_MONO }}>{g.label}</div>}
                {g.items.map((it) => {
                  const Icon = it.icon;
                  const isActive = active === it.id;
                  return (
                    <button
                      key={it.id}
                      onClick={() => setActive(it.id)}
                      className="ksp-nav-btn w-full flex items-center gap-2.5 px-2.5 py-2 rounded-sm text-xs mb-1"
                      style={{
                        background: isActive ? `${C.gold}14` : "transparent",
                        color: isActive ? C.gold : C.muted,
                        borderLeft: isActive ? `2px solid ${C.gold}` : "2px solid transparent",
                        boxShadow: isActive ? `inset 0 0 12px ${C.gold}0d` : "none",
                      }}
                    >
                      <Icon size={15} className="flex-shrink-0" />
                      {!collapsed && <span className="text-left">{it.label}</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <button onClick={() => setCollapsed(!collapsed)} className="flex items-center justify-center h-10 flex-shrink-0" style={{ borderTop: `1px solid ${C.border}`, color: C.mutedDark }}>
            {collapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
          </button>
        </div>

        {/* MAIN */}
        <div className="flex-1 overflow-y-auto p-5 min-w-0" style={{ background: `radial-gradient(circle at 15% 0%, ${C.panelAlt}30, transparent 45%)` }}>
          <div className="flex items-center gap-2 mb-4 text-xs" style={{ color: C.mutedDark }}>
            <span style={{ fontFamily: FONT_MONO }}>KSP Sentinel-AI</span>
            <ChevronDown size={11} style={{ transform: "rotate(-90deg)" }} />
            <span className="text-sm font-semibold" style={{ color: C.text, fontFamily: FONT_DISPLAY }}>{titles[active]}</span>
          </div>

          {active === "chat" && <ChatModule role={role} messages={messages} setMessages={setMessages} prefill={prefill} setPrefill={setPrefill} />}
          {active === "map" && <MapModule onAskAI={askAI} />}
          {active === "predictive" && <PredictiveModule />}
          {active === "graph" && <GraphModule onAskAI={askAI} />}
          {active === "dashboard" && <DashboardModule />}
          {active === "safety" && <SafetyModule onAskAI={askAI} />}
          {active === "cctv" && <CCTVModule onAskAI={askAI} />}
          {active === "dispatch" && <DispatchModule />}
          {active === "alerts" && <AlertsModule onAskAI={askAI} />}
          {active === "reports" && <ReportsModule />}
          {active === "bulletin" && <BulletinModule />}
          {active === "zoho" && <ZohoModule />}
          {active === "security" && <SecurityModule />}
        </div>
      </div>

      {demoOpen && (
        <div className="fixed inset-0 flex justify-end z-50" style={{ background: "rgba(3,8,16,0.55)" }}>
          <div className="h-full flex flex-col" style={{ width: 360, background: C.navyDeep, borderLeft: `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: C.gold }}>
                <PlayCircle size={15} /> Guided Demo \u00b7 Datathon 2026
              </div>
              <button onClick={() => setDemoOpen(false)}><X size={15} style={{ color: C.mutedDark }} /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              <div>
                <div className="text-xs mb-1" style={{ color: C.mutedDark }}>STEP {demoStep + 1} OF {DEMO_STEPS.length}</div>
                <div className="text-sm font-semibold mb-1" style={{ color: C.text }}>{DEMO_STEPS[demoStep].title}</div>
                <div className="text-xs" style={{ color: C.muted }}>{DEMO_STEPS[demoStep].desc}</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={demoStep === 0}
                  onClick={() => { const s = demoStep - 1; setDemoStep(s); setActive(DEMO_STEPS[s].module); }}
                  className="text-xs px-3 py-1.5 rounded-sm flex-1"
                  style={{ border: `1px solid ${C.border}`, color: demoStep === 0 ? C.mutedDark : C.muted, opacity: demoStep === 0 ? 0.5 : 1 }}
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    if (demoStep < DEMO_STEPS.length - 1) {
                      const s = demoStep + 1; setDemoStep(s); setActive(DEMO_STEPS[s].module);
                    } else setDemoOpen(false);
                  }}
                  className="text-xs px-3 py-1.5 rounded-sm flex-1 flex items-center justify-center gap-1"
                  style={{ background: C.blue, color: "#fff" }}
                >
                  {demoStep < DEMO_STEPS.length - 1 ? <>Next <ArrowRight size={12} /></> : "Finish"}
                </button>
              </div>

              <div>
                <SectionLabel>DEMO FLOW</SectionLabel>
                <div className="space-y-1">
                  {DEMO_STEPS.map((s, i) => (
                    <button
                      key={s.title}
                      onClick={() => { setDemoStep(i); setActive(s.module); }}
                      className="w-full text-left text-xs px-2 py-1.5 rounded-sm flex items-center gap-2"
                      style={{ background: i === demoStep ? `${C.gold}14` : "transparent", color: i === demoStep ? C.gold : C.muted }}
                    >
                      <span className="font-mono" style={{ color: C.mutedDark, width: 16 }}>{i + 1}</span>
                      {s.title}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <SectionLabel>JUDGING CRITERIA ALIGNMENT</SectionLabel>
                <div className="space-y-2">
                  {JUDGING_CRITERIA.map((j) => (
                    <div key={j.label} className="flex items-start gap-2 text-xs">
                      <CheckCircle2 size={13} style={{ color: C.green, marginTop: 1, flexShrink: 0 }} />
                      <div>
                        <span style={{ color: C.text }}>{j.label}</span>
                        <span style={{ color: C.mutedDark }}> \u2014 {j.note}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className="flex items-center justify-between px-4 flex-shrink-0 text-[10px] font-mono"
        style={{ height: 26, background: C.navyDeep, borderTop: `1px solid ${C.border}`, color: C.mutedDark }}
      >
        <span>Dept. of Home Affairs, Govt. of Karnataka \u00b7 Technology Partner: Zoho Corporation</span>
        <span className="flex items-center gap-3">
          <span>build 2026.07.24-rc2</span>
          <span>env: staging</span>
          <span>session: SESS-8827-KA</span>
          <span>node: ksp-prod-blr-03</span>
        </span>
      </div>
    </div>
  );
}
