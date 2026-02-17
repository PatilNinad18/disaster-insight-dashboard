import { useState, useCallback } from "react";
import MapView from "@/components/MapView";
import ControlPanel from "@/components/ControlPanel";
import ResultsPanel from "@/components/ResultsPanel";
import { loadDistrict, simulate, SimulationResult } from "@/services/api";
import { Shield, Radio } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const INDIA_CENTER: [number, number] = [22.5, 82];
const INDIA_ZOOM = 5;

const Dashboard = () => {
  const { toast } = useToast();

  // Map state
  const [mapCenter, setMapCenter] = useState<[number, number]>(INDIA_CENTER);
  const [mapZoom, setMapZoom] = useState(INDIA_ZOOM);

  // Controls
  const [district, setDistrict] = useState("");
  const [disasterType, setDisasterType] = useState<"flood" | "earthquake">("flood");
  const [rainfall, setRainfall] = useState(150);
  const [magnitude, setMagnitude] = useState(5.0);
  const [rescueTeams, setRescueTeams] = useState(10);
  const [medicalUnits, setMedicalUnits] = useState(5);
  const [reliefCapacity, setReliefCapacity] = useState(500);
  const [delayHours, setDelayHours] = useState(0);

  // Results
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [riskOverlay, setRiskOverlay] = useState<{
    lat: number;
    lng: number;
    type: "flood" | "earthquake";
    intensity: number;
  } | null>(null);

  const handleDistrictChange = useCallback(async (name: string) => {
    setDistrict(name);
    try {
      const data = await loadDistrict(name);
      setMapCenter([data.lat, data.lng]);
      setMapZoom(10);
      setRiskOverlay(null);
      setResult(null);
    } catch {
      toast({ title: "Error", description: "Failed to load district", variant: "destructive" });
    }
  }, [toast]);

  const handleSimulate = useCallback(async () => {
    if (!district) return;
    setIsLoading(true);
    try {
      const res = await simulate({
        district,
        disaster_type: disasterType,
        rainfall: disasterType === "flood" ? rainfall : undefined,
        magnitude: disasterType === "earthquake" ? magnitude : undefined,
        rescue_teams: rescueTeams,
        medical_units: medicalUnits,
        relief_camp_capacity: reliefCapacity,
        delay_hours: delayHours,
      });
      setResult(res);

      // Show risk overlay
      const intensity =
        disasterType === "flood" ? rainfall / 300 : (magnitude - 3) / 6;
      setRiskOverlay({
        lat: mapCenter[0],
        lng: mapCenter[1],
        type: disasterType,
        intensity,
      });

      toast({ title: "Simulation Complete", description: `${district} — ${disasterType}` });
    } catch {
      toast({ title: "Error", description: "Simulation failed", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [district, disasterType, rainfall, magnitude, rescueTeams, medicalUnits, reliefCapacity, delayHours, mapCenter, toast]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* Top Nav */}
      <header className="h-12 border-b border-border panel-gradient flex items-center px-4 gap-3 shrink-0">
        <Shield className="h-5 w-5 text-primary" />
        <h1 className="font-mono text-sm font-bold tracking-wider uppercase text-foreground">
          Disaster Intelligence System
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <Radio className="h-3 w-3 text-primary animate-pulse-glow" />
          <span className="text-[10px] text-muted-foreground font-mono uppercase">Live</span>
        </div>
      </header>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-72 border-r border-border panel-gradient shrink-0 overflow-hidden">
          <ControlPanel
            district={district}
            onDistrictChange={handleDistrictChange}
            disasterType={disasterType}
            onDisasterTypeChange={setDisasterType}
            rainfall={rainfall}
            onRainfallChange={setRainfall}
            magnitude={magnitude}
            onMagnitudeChange={setMagnitude}
            rescueTeams={rescueTeams}
            onRescueTeamsChange={setRescueTeams}
            medicalUnits={medicalUnits}
            onMedicalUnitsChange={setMedicalUnits}
            reliefCapacity={reliefCapacity}
            onReliefCapacityChange={setReliefCapacity}
            delayHours={delayHours}
            onDelayHoursChange={setDelayHours}
            onSimulate={handleSimulate}
            isLoading={isLoading}
          />
        </aside>

        {/* Map */}
        <main className="flex-1 p-2 overflow-hidden">
          <MapView center={mapCenter} zoom={mapZoom} riskOverlay={riskOverlay} />
        </main>

        {/* Right panel */}
        <aside className="w-72 border-l border-border panel-gradient shrink-0 overflow-hidden">
          <ResultsPanel result={result} />
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
