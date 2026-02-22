// Real API service - connects to FastAPI backend
const API_BASE_URL = "http://localhost:8000/api";

export interface DistrictData {
  name: string;
  lat: number;
  lng: number;
  population: number;
}

/* =========================
   DISTRICTS
========================= */

const DISTRICTS: Record<string, DistrictData> = {
  pune: { name: "Pune", lat: 18.5204, lng: 73.8567, population: 9429408 },
  mumbai: { name: "Mumbai", lat: 19.076, lng: 72.8777, population: 20411274 },
  chennai: { name: "Chennai", lat: 13.0827, lng: 80.2707, population: 10971108 },
  kolkata: { name: "Kolkata", lat: 22.5726, lng: 88.3639, population: 14850066 },
  delhi: { name: "Delhi", lat: 28.7041, lng: 77.1025, population: 19814000 },
  bengaluru: { name: "Bengaluru", lat: 12.9716, lng: 77.5946, population: 12764935 },
  hyderabad: { name: "Hyderabad", lat: 17.385, lng: 78.4867, population: 10534418 },
  ahmedabad: { name: "Ahmedabad", lat: 23.0225, lng: 72.5714, population: 8059441 },
  jaipur: { name: "Jaipur", lat: 26.9124, lng: 75.7873, population: 6626178 },
  guwahati: { name: "Guwahati", lat: 26.1445, lng: 91.7362, population: 1116267 },
};

export const DISTRICT_LIST = Object.values(DISTRICTS).map((d) => d.name);

/* =========================
   SIMULATION TYPES
========================= */

export interface SimulationRequest {
  district: string;
  disaster_type: "flood" | "earthquake";
  rainfall?: number;
  magnitude?: number;
  rescue_teams: number;
  medical_units: number;
  relief_camp_capacity: number;
  delay_hours: number;
}

export interface TimeSeriesPoint {
  hour: number;
  no_resources: number;
  with_resources: number;
}

export interface SimulationResult {
  affected_population: number;
  fatalities: number;
  economic_loss: number;
  time_series: TimeSeriesPoint[];
  predicted_deaths?: number;
  predicted_economic_loss?: number;
  real_population?: number;
  location?: { lat: number; lng: number };
  stress_test_deaths?: number;
  stress_test_loss?: number;
}

/* =========================
   RED TEAM
========================= */

export interface RedTeamRequest {
  district: string;
  disasterType: "flood" | "earthquake";
  userDecision: "Evacuate" | "Monitor" | "Ignore";
  riskScore: number;
}

export interface RedTeamResponse {
  district: string;
  disasterType: string;
  userDecision: "Evacuate" | "Monitor" | "Ignore";
  aiRecommendation: "Evacuate" | "Monitor" | "Ignore";
  conflictPercentage: number;
  conflictLevel: "Low" | "Medium" | "High";
  impactMessage: string;
}

/* =========================
   ZONE ANALYSIS
========================= */

export interface ZoneData {
  id: string;
  name: string;
  riskScore: number;
  population: number;
  priority: number;
  recommendedRescueTeams: number;
  coordinates: [number, number][];
}

export interface ZoneAnalysisRequest {
  district: string;
  disasterType: "flood" | "earthquake";
}

/* =========================
   AUDIT LOGS
========================= */

export interface DecisionLog {
  id: string;
  timestamp: string;
  district: string;
  disasterType: string;
  userDecision: "Evacuate" | "Monitor" | "Ignore";
  aiWarning: string;
  overrideReason?: string;
  predictedImpact: string;
}

/* =========================
   ALERT SYSTEM
========================= */

export interface SendAlertRequest {
  phoneNumber: string;
  message: string;
  source?: "manual" | "red_team";
}

export interface AlertRecord {
  id: string;
  phoneNumber: string;
  message: string;
  source: "manual" | "red_team" | "broadcast";
  timestamp: string;
  status: "sent" | "failed";
  broadcast?: boolean;
}

export interface Subscriber {
  id: string;
  name: string;
  phoneNumber: string;
}

export interface BroadcastRecord {
  id: string;
  message: string;
  timestamp: string;
  recipientCount: number;
}

/* =========================
   MOCK AUTH
========================= */

const AUTH_STORAGE_KEY = "sentinelx_users";

type StoredUser = {
  username: string;
  password: string;
  role: "admin" | "user";
  name: string;
  phoneNumber?: string;
};

const INITIAL_USERS: StoredUser[] = [
  { username: "admin", password: "admin", role: "admin", name: "Admin" },
  { username: "user", password: "user", role: "user", name: "Citizen", phoneNumber: "+919876500001" },
];

function loadUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [...INITIAL_USERS];
}

function saveUsers(list: StoredUser[]) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(list));
}

let users = loadUsers();

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "").slice(-10);
}

export async function login(usernameOrPhone: string, password: string) {
  await delay(300);
  const normalized = normalizePhone(usernameOrPhone);
  const user = users.find(
    (u) =>
      u.password === password &&
      (u.username === usernameOrPhone ||
        (u.phoneNumber && normalizePhone(u.phoneNumber) === normalized))
  );
  return user ? { role: user.role, name: user.name, phoneNumber: user.phoneNumber } : null;
}

export async function register(
  name: string,
  username: string,
  password: string,
  role: "admin" | "user" = "user",
  phoneNumber?: string
) {
  await delay(300);
  if (users.some((u) => u.username === username)) {
    return { ok: false, error: "Username already exists" };
  }
  users.push({ username, password, role, name, phoneNumber });
  saveUsers(users);
  return { ok: true };
}

/* =========================
   API CALLS
========================= */

export async function loadDistrict(name: string): Promise<DistrictData> {
  const response = await fetch(`${API_BASE_URL}/load-district/${name}`);
  if (!response.ok) throw new Error("Failed to load district");
  return response.json();
}

export async function simulate(req: SimulationRequest): Promise<SimulationResult> {
  const response = await fetch(`${API_BASE_URL}/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!response.ok) throw new Error("Simulation failed");
  return response.json();
}

export async function analyzeZones(
  req: ZoneAnalysisRequest
): Promise<ZoneData[]> {
  const response = await fetch(`${API_BASE_URL}/zone-analysis`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req),
  });

  if (!response.ok) {
    throw new Error(`Zone analysis failed: ${response.statusText}`);
  }

  return await response.json();
}

export async function evaluateRedTeam(req: RedTeamRequest): Promise<RedTeamResponse> {
  await delay(500);

  const aiRec =
    req.riskScore > 70 ? "Evacuate" : req.riskScore > 40 ? "Monitor" : "Ignore";

  const conflictPercentage = Math.round(Math.random() * 100);

  let conflictLevel: "Low" | "Medium" | "High" = "Low";
  if (conflictPercentage > 70) conflictLevel = "High";
  else if (conflictPercentage > 40) conflictLevel = "Medium";

  return {
    district: req.district,
    disasterType: req.disasterType,
    userDecision: req.userDecision,
    aiRecommendation: aiRec,
    conflictPercentage,
    conflictLevel,
    impactMessage: `Projected impact increases by ${conflictPercentage}% if ignored.`,
  };
}

/* =========================
   ALERT STORAGE
========================= */

let alertHistory: AlertRecord[] = [];
let broadcastHistory: BroadcastRecord[] = [];

export async function sendAlert(req: SendAlertRequest) {
  await delay(400);
  const id = `alert-${Date.now()}`;
  alertHistory.unshift({
    id,
    phoneNumber: req.phoneNumber,
    message: req.message,
    source: req.source ?? "manual",
    timestamp: new Date().toISOString(),
    status: "sent",
  });
  return { success: true, id };
}

export async function getAlertHistory() {
  await delay(200);
  return [...alertHistory];
}

export async function sendAlertToAll(message: string) {
  await delay(600);
  const id = `broadcast-${Date.now()}`;
  broadcastHistory.unshift({
    id,
    message,
    timestamp: new Date().toISOString(),
    recipientCount: 5,
  });
  return { sent: 5 };
}

export async function getAlertsSentToPhone(phoneNumber: string) {
  await delay(200);
  return alertHistory.filter(alert => alert.phoneNumber === phoneNumber);
}

export async function getSubscribers() {
  await delay(300);
  return [
    { id: "1", name: "Admin", phoneNumber: "+919876500001" },
    { id: "2", name: "User", phoneNumber: "+919876500002" },
    { id: "3", name: "Citizen", phoneNumber: "+919876500003" },
  ];
}

export async function getBroadcastHistory() {
  await delay(200);
  return [...broadcastHistory];
}

export async function getAuditLogs(filters?: {
  district?: string;
  disasterType?: string;
}): Promise<DecisionLog[]> {
  await delay(300);
  
  // Mock audit logs
  const mockLogs: DecisionLog[] = [
    {
      id: "1",
      timestamp: "2024-01-15T10:30:00Z",
      district: "Pune",
      disasterType: "flood",
      userDecision: "Evacuate",
      aiWarning: "High risk detected",
      overrideReason: "Manual override due to updated weather data",
      predictedImpact: "5000 lives saved"
    },
    {
      id: "2", 
      timestamp: "2024-01-14T15:45:00Z",
      district: "Mumbai",
      disasterType: "earthquake",
      userDecision: "Monitor",
      aiWarning: "Moderate seismic activity",
      predictedImpact: "No immediate action required"
    },
    {
      id: "3",
      timestamp: "2024-01-13T09:15:00Z",
      district: "Guwahati",
      disasterType: "flood",
      userDecision: "Evacuate",
      aiWarning: "Critical flood risk",
      predictedImpact: "3000 lives saved"
    },
    {
      id: "4",
      timestamp: "2024-01-12T14:20:00Z",
      district: "Delhi",
      disasterType: "earthquake",
      userDecision: "Ignore",
      aiWarning: "Low seismic activity",
      overrideReason: "False alarm - equipment malfunction",
      predictedImpact: "No impact"
    }
  ];
  
  if (filters?.district) {
    return mockLogs.filter(log => log.district === filters.district);
  }
  if (filters?.disasterType) {
    return mockLogs.filter(log => log.disasterType === filters.disasterType);
  }
  
  return mockLogs;
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}