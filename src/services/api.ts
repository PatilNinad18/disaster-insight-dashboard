// Real API service - connects to FastAPI backend
// Base URL for backend API
const API_BASE_URL = 'http://localhost:8000/api';

export interface DistrictData {
  name: string;
  lat: number;
  lng: number;
  population: number;
}

// Get list of available cities from backend
export const DISTRICT_LIST = [
  'Delhi', 'Mumbai', 'Kolkata', 'Bengaluru', 'Chennai',
  'Hyderabad', 'Ahmedabad', 'Pune', 'Jaipur', 'Guwahati'
];

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
  // New ML prediction fields
  predicted_deaths?: number;
  predicted_economic_loss?: number;
  real_population?: number;
  location?: {
    lat: number;
    lng: number;
  };
  // Red team stress test results
  stress_test_deaths?: number;
  stress_test_loss?: number;
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

// GET /api/load-district/:name
export async function loadDistrict(name: string): Promise<DistrictData> {
  const response = await fetch(`${API_BASE_URL}/load-district/${name}`);
  if (!response.ok) {
    throw new Error(`Failed to load district: ${response.statusText}`);
  }
  return await response.json();
}

// POST /api/simulate
export async function simulate(req: SimulationRequest): Promise<SimulationResult> {
  const response = await fetch(`${API_BASE_URL}/simulate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req),
  });
  
  if (!response.ok) {
    throw new Error(`Simulation failed: ${response.statusText}`);
  }
  
  return await response.json();
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
  const response = await fetch(`${API_BASE_URL}/zone-analysis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req),
  });
  
  if (!response.ok) {
    throw new Error(`Zone analysis failed: ${response.statusText}`);
  }
  
  return await response.json();
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
