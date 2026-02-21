// Mock API service — mirrors FastAPI backend spec
// Swap these with real fetch() calls when connecting to Python backend

export interface DistrictData {
  name: string;
  lat: number;
  lng: number;
  population: number;
}

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
}

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

export interface ZoneData {
  id: string;
  name: string;
  riskScore: number;
  population: number;
  priority: number;
  recommendedRescueTeams: number;
  coordinates: [number, number][];
}

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

export interface ZoneAnalysisRequest {
  district: string;
  disasterType: "flood" | "earthquake";
}

// Alert / Warning SMS
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

// Mock auth (hackathon — replace with real auth)
const AUTH_STORAGE_KEY = "sentinelx_users";

type StoredUser = { username: string; password: string; role: "admin" | "user"; name: string; phoneNumber?: string };
const INITIAL_USERS: StoredUser[] = [
  { username: "admin", password: "admin", role: "admin", name: "Admin" },
  { username: "user", password: "user", role: "user", name: "Citizen", phoneNumber: "+91 9876500001" },
];

function loadUsers(): StoredUser[] {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(AUTH_STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw) as StoredUser[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* ignore */
  }
  return [...INITIAL_USERS];
}

function saveUsers(list: StoredUser[]) {
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

let users: StoredUser[] = loadUsers();
if (users.length === 0) {
  users = [...INITIAL_USERS];
  saveUsers(users);
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").slice(-10);
}

function findUser(identifier: string, password: string): StoredUser | undefined {
  const id = identifier.trim();
  const normalized = id.replace(/\D/g, "").length >= 10 ? normalizePhone(id) : null;
  return users.find(
    (x) =>
      x.password === password &&
      (x.username.toLowerCase() === id.toLowerCase() || (normalized && x.phoneNumber && normalizePhone(x.phoneNumber) === normalized))
  );
}

export async function login(
  usernameOrPhone: string,
  password: string
): Promise<{ role: "admin" | "user"; name: string; phoneNumber?: string } | null> {
  await delay(300);
  const u = findUser(usernameOrPhone.trim(), password.trim());
  return u ? { role: u.role, name: u.name, phoneNumber: u.phoneNumber } : null;
}

export async function register(
  name: string,
  username: string,
  password: string,
  role: "admin" | "user" = "user",
  phoneNumber?: string
): Promise<{ ok: boolean; error?: string }> {
  await delay(300);
  const trimmed = username.trim().toLowerCase();
  if (!trimmed || !password.trim() || !name.trim()) {
    return { ok: false, error: "Name, username and password are required" };
  }
  if (users.some((x) => x.username.toLowerCase() === trimmed)) {
    return { ok: false, error: "Username already taken" };
  }
  const phone = phoneNumber?.trim();
  if (phone && users.some((x) => x.phoneNumber && normalizePhone(x.phoneNumber) === normalizePhone(phone))) {
    return { ok: false, error: "Phone number already registered" };
  }
  if (password.length < 4) {
    return { ok: false, error: "Password must be at least 4 characters" };
  }
  users.push({ username: trimmed, password: password.trim(), role, name: name.trim(), phoneNumber: phone || undefined });
  saveUsers(users);
  return { ok: true };
}

// Mock list of users who receive broadcast SMS
const MOCK_SUBSCRIBERS: Subscriber[] = [
  { id: "s1", name: "Village Head - Pune", phoneNumber: "+91 9876500001" },
  { id: "s2", name: "Health Officer - Mumbai", phoneNumber: "+91 9876500002" },
  { id: "s3", name: "NGO Coordinator", phoneNumber: "+91 9876500003" },
  { id: "s4", name: "District Officer", phoneNumber: "+91 9876500004" },
  { id: "s5", name: "Citizen Group Rep", phoneNumber: "+91 9876500005" },
];

let broadcastHistory: BroadcastRecord[] = [];

export async function getSubscribers(): Promise<Subscriber[]> {
  await delay(200);
  return [...MOCK_SUBSCRIBERS];
}

export async function sendAlertToAll(message: string, source: "manual" | "red_team" = "manual"): Promise<{ sent: number }> {
  await delay(600);
  const id = `broadcast-${Date.now()}`;
  const timestamp = new Date().toISOString();
  for (const sub of MOCK_SUBSCRIBERS) {
    const record: AlertRecord = {
      id: `${id}-${sub.id}`,
      phoneNumber: sub.phoneNumber,
      message,
      source: "broadcast",
      timestamp,
      status: "sent",
      broadcast: true,
    };
    alertHistory = [record, ...alertHistory].slice(0, 100);
  }
  broadcastHistory = [{ id, message, timestamp, recipientCount: MOCK_SUBSCRIBERS.length }, ...broadcastHistory].slice(0, 30);
  return { sent: MOCK_SUBSCRIBERS.length };
}

export async function getBroadcastHistory(): Promise<BroadcastRecord[]> {
  await delay(200);
  return [...broadcastHistory];
}

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

// GET /api/load-district/:name
export async function loadDistrict(name: string): Promise<DistrictData> {
  await delay(300); // simulate network
  const key = name.toLowerCase();
  const district = DISTRICTS[key];
  if (!district) throw new Error(`District "${name}" not found`);
  return { ...district };
}

// POST /api/simulate
export async function simulate(req: SimulationRequest): Promise<SimulationResult> {
  await delay(800); // simulate processing
  const district = DISTRICTS[req.district.toLowerCase()];
  const pop = district?.population ?? 5000000;

  const severity =
    req.disaster_type === "flood"
      ? (req.rainfall ?? 150) / 300
      : ((req.magnitude ?? 5) - 3) / 6;

  const resourceFactor =
    1 - Math.min(0.5, (req.rescue_teams + req.medical_units) / 200);
  const affected = Math.round(pop * severity * 0.05);
  const fatalities = Math.round(affected * 0.03 * resourceFactor);
  const economic_loss = Math.round(affected * 5000 * severity);

  const hours = [0, 2, 4, 6];
  const time_series: TimeSeriesPoint[] = hours.map((hour) => {
    const growth = 1 + hour * 0.4 * severity;
    const delayPenalty = hour <= req.delay_hours ? 1.2 : 1;
    return {
      hour,
      no_resources: Math.round(affected * 0.3 * growth * delayPenalty),
      with_resources: Math.round(affected * 0.2 * growth * resourceFactor),
    };
  });

  return { affected_population: affected, fatalities, economic_loss, time_series };
}

// POST /api/red-team/evaluate
export async function evaluateRedTeam(req: RedTeamRequest): Promise<RedTeamResponse> {
  await delay(500);
  
  // Mock AI recommendation logic
  const aiRecommendations = {
    high: "Evacuate",
    medium: "Monitor", 
    low: "Ignore"
  };
  
  const aiRec = req.riskScore > 70 ? "Evacuate" : req.riskScore > 40 ? "Monitor" : "Ignore";
  const conflictPercentage = Math.abs(Math.random() * 100);
  
  let conflictLevel: "Low" | "Medium" | "High" = "Low";
  if (conflictPercentage > 70) conflictLevel = "High";
  else if (conflictPercentage > 40) conflictLevel = "Medium";
  
  return {
    district: req.district,
    disasterType: req.disasterType,
    userDecision: req.userDecision,
    aiRecommendation: aiRec as "Evacuate" | "Monitor" | "Ignore",
    conflictPercentage: Math.round(conflictPercentage),
    conflictLevel,
    impactMessage: `Delaying evacuation increases projected fatalities by ${Math.round(conflictPercentage)}%`
  };
}

// GET /api/audit-logs
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

// POST /api/zone-analysis
export async function analyzeZones(req: ZoneAnalysisRequest): Promise<ZoneData[]> {
  await delay(400);
  
  // Mock zone data for Pune
  if (req.district.toLowerCase() === "pune") {
    return [
      {
        id: "zone1",
        name: "Central Pune",
        riskScore: 85,
        population: 2500000,
        priority: 1,
        recommendedRescueTeams: 15,
        coordinates: [[18.5204, 73.8567], [18.5304, 73.8667], [18.5104, 73.8467]]
      },
      {
        id: "zone2", 
        name: "Kothrud",
        riskScore: 72,
        population: 1800000,
        priority: 2,
        recommendedRescueTeams: 12,
        coordinates: [[18.5066, 73.8057], [18.5166, 73.8157], [18.4966, 73.7957]]
      },
      {
        id: "zone3",
        name: "Hinjewadi",
        riskScore: 68,
        population: 1200000,
        priority: 3,
        recommendedRescueTeams: 8,
        coordinates: [[18.5982, 73.7362], [18.6082, 73.7462], [18.5882, 73.7262]]
      },
      {
        id: "zone4",
        name: "Baner",
        riskScore: 45,
        population: 900000,
        priority: 4,
        recommendedRescueTeams: 6,
        coordinates: [[18.5635, 73.7773], [18.5735, 73.7873], [18.5535, 73.7673]]
      }
    ];
  }
  
  // Default zones for other districts
  return [
    {
      id: "zone1",
      name: "Urban Center",
      riskScore: 75,
      population: 2000000,
      priority: 1,
      recommendedRescueTeams: 10,
      coordinates: [[0, 0], [1, 0], [1, 1], [0, 1]]
    }
  ];
}

// In-memory alert history for hackathon demo (replace with API later)
let alertHistory: AlertRecord[] = [];

// POST /api/alerts/send — send warning SMS (mock)
export async function sendAlert(req: SendAlertRequest): Promise<{ success: boolean; id: string }> {
  await delay(400);
  const id = `alert-${Date.now()}`;
  const record: AlertRecord = {
    id,
    phoneNumber: req.phoneNumber,
    message: req.message,
    source: req.source ?? "manual",
    timestamp: new Date().toISOString(),
    status: "sent",
  };
  alertHistory = [record, ...alertHistory].slice(0, 50);
  return { success: true, id };
}

// GET /api/alerts — list recent alerts
export async function getAlertHistory(): Promise<AlertRecord[]> {
  await delay(200);
  return [...alertHistory];
}

// GET /api/alerts/for-phone — alerts sent to a specific number (for logged-in user)
export async function getAlertsSentToPhone(phone: string): Promise<AlertRecord[]> {
  await delay(200);
  const normalized = phone.replace(/\D/g, "").slice(-10);
  if (!normalized) return [];
  return alertHistory.filter((a) => a.phoneNumber.replace(/\D/g, "").slice(-10) === normalized);
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
