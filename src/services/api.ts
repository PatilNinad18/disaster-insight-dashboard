// Mock API service — mirrors Express backend spec
// Swap these with real fetch() calls when connecting to Express/Python backend

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

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
