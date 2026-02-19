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

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
