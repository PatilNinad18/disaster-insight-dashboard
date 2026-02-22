import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import MapView from "@/components/MapView";
import ControlPanel from "@/components/ControlPanel";
import ResultsPanel from "@/components/ResultsPanel";
import { loadDistrict, simulate, SimulationResult } from "@/services/api";
import { useAppStore } from "@/store/appStore";
import { Shield, Radio, TrendingUp, Users, AlertTriangle, Activity, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const INDIA_CENTER: [number, number] = [22.5, 82];
const INDIA_ZOOM = 5;

const Dashboard = () => {
  const { toast } = useToast();

  const {
    selectedDistrict,
    disasterType,
    riskScore,
    setRiskScore,
    lastSimulationResult,
    setLastSimulationResult,
    isLoading,
    setIsLoading,
    setSelectedDistrict,
    setDisasterType
  } = useAppStore();

  const [mapCenter, setMapCenter] = useState<[number, number]>(INDIA_CENTER);
  const [mapZoom, setMapZoom] = useState(INDIA_ZOOM);
  const [controlsCollapsed, setControlsCollapsed] = useState(false);

  const [rainfall, setRainfall] = useState(150);
  const [magnitude, setMagnitude] = useState(5.0);
  const [rescueTeams, setRescueTeams] = useState(10);
  const [medicalUnits, setMedicalUnits] = useState(5);
  const [reliefCapacity, setReliefCapacity] = useState(500);
  const [delayHours, setDelayHours] = useState(0);

  const [currentCityData, setCurrentCityData] = useState<{ population: number } | null>(null);

  const [riskOverlay, setRiskOverlay] = useState<{
    lat: number;
    lng: number;
    type: "flood" | "earthquake";
    intensity: number;
  } | null>(null);

  useEffect(() => {
    if (!selectedDistrict) {
      setRiskScore(0);
      return;
    }

    let score = 0;

    if (disasterType === "flood") {
      score = Math.min(100, (rainfall / 300) * 100);
    } else {
      score = Math.min(100, ((magnitude - 3) / 6) * 100);
    }

    score = Math.min(100, score + delayHours * 5);

    setRiskScore(Math.round(score));
  }, [selectedDistrict, disasterType, rainfall, magnitude, delayHours, setRiskScore]);

  const handleDistrictChange = useCallback(async (name: string) => {
    setSelectedDistrict(name);

    try {
      const data = await loadDistrict(name);
      setMapCenter([data.lat, data.lng]);
      setMapZoom(10);
      setCurrentCityData({ population: data.population });
      setRiskOverlay(null);
      setLastSimulationResult(null);
    } catch {
      toast({ title: "Error", description: "Failed to load district", variant: "destructive" });
    }
  }, [toast, setSelectedDistrict, setLastSimulationResult]);

  const handleSimulate = useCallback(async () => {
    if (!selectedDistrict) return;

    setIsLoading(true);

    try {
      const res = await simulate({
        district: selectedDistrict,
        disaster_type: disasterType,
        rainfall: disasterType === "flood" ? rainfall : undefined,
        magnitude: disasterType === "earthquake" ? magnitude : undefined,
        rescue_teams: rescueTeams,
        medical_units: medicalUnits,
        relief_camp_capacity: reliefCapacity,
        delay_hours: delayHours
      });

      setLastSimulationResult(res);

      if (res.location) {
        setMapCenter([res.location.lat, res.location.lng]);
        setMapZoom(10);
      }

      const intensity =
        disasterType === "flood" ? rainfall / 300 : (magnitude - 3) / 6;

      setRiskOverlay({
        lat: res.location?.lat || mapCenter[0],
        lng: res.location?.lng || mapCenter[1],
        type: disasterType,
        intensity
      });

      toast({
        title: "Simulation Complete",
        description: `${selectedDistrict} — ${disasterType}`
      });

    } catch {
      toast({ title: "Error", description: "Simulation failed", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedDistrict,
    disasterType,
    rainfall,
    magnitude,
    rescueTeams,
    medicalUnits,
    reliefCapacity,
    delayHours,
    mapCenter,
    toast,
    setIsLoading,
    setLastSimulationResult
  ]);

  const getRiskColor = (score: number) => {
    if (score >= 80) return "text-red-600";
    if (score >= 60) return "text-orange-600";
    if (score >= 40) return "text-yellow-600";
    return "text-green-600";
  };

  const getRiskBadgeVariant = (score: number) => {
    if (score >= 80) return "destructive";
    if (score >= 60) return "default";
    if (score >= 40) return "secondary";
    return "outline";
  };

  const calculateResourceEfficiency = () => {
    if (!lastSimulationResult) return 0;
    const totalResources = rescueTeams + medicalUnits + reliefCapacity / 100;
    const savedPerResource = lastSimulationResult.affected_population / totalResources;
    return Math.min(100, Math.round(savedPerResource / 100));
  };

  const getRecommendedAction = () => {
    if (!selectedDistrict)
      return { text: "Select a district and run simulation", variant: "secondary" as const };

    if (riskScore >= 70)
      return { text: "EVACUATE high-risk zones — send alert immediately", variant: "destructive" as const };

    if (riskScore >= 40)
      return { text: "MONITOR — Prepare resources and consider targeted alerts", variant: "default" as const };

    return { text: "No immediate action — continue monitoring", variant: "secondary" as const };
  };

  const recommendedAction = getRecommendedAction();

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Header */}
      <div className="bg-background rounded-lg border border-border p-4 shadow-sm m-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">Disaster Intelligence Platform</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="px-3 py-1">
              {selectedDistrict || "No City Selected"}
            </Badge>
            <Badge variant={disasterType === "flood" ? "default" : "secondary"} className="px-3 py-1">
              {disasterType === "flood" ? "🌊 Flood" : "🫠 Earthquake"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mx-4">
        <Card className="bg-background border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">City Population</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {currentCityData ? currentCityData.population.toLocaleString() : "Select City"}
            </div>
            <p className="text-xs text-muted-foreground">
              Total population
            </p>
          </CardContent>
        </Card>

        <Card className="bg-background border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Risk Score</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${getRiskColor(riskScore)}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRiskColor(riskScore)}`}>
              {riskScore}/100
            </div>
            <Badge variant={getRiskBadgeVariant(riskScore)} className="mt-1">
              {riskScore >= 80 ? "Critical" : riskScore >= 60 ? "High" : riskScore >= 40 ? "Medium" : "Low"}
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-background border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Estimated Fatalities</CardTitle>
            <Users className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {isLoading ? <Skeleton className="h-8 w-20" /> : lastSimulationResult?.fatalities.toLocaleString() || "0"}
            </div>
            <p className="text-xs text-muted-foreground">
              Based on current parameters
            </p>
          </CardContent>
        </Card>

        <Card className="bg-background border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Resource Efficiency</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {calculateResourceEfficiency()}%
            </div>
            <p className="text-xs text-muted-foreground">
              Resource utilization score
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className={`flex-1 grid gap-6 mx-4 mb-4 ${controlsCollapsed ? 'grid-cols-12' : 'grid-cols-12'}`}>
        {/* Control Panel */}
        <div 
          className={`${controlsCollapsed ? 'lg:col-span-1' : 'lg:col-span-3'} transition-all duration-300 cursor-pointer`}
          onClick={() => setControlsCollapsed(!controlsCollapsed)}
        >
          {!controlsCollapsed ? (
            <Card className="h-full bg-background border-border">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">Simulation Controls</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Configure disaster parameters and resources
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-y-auto h-[calc(100%-80px)]" onClick={(e) => e.stopPropagation()}>
                <ControlPanel
                  district={selectedDistrict}
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
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center bg-background border border-border rounded-lg">
              <ChevronRight className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Map */}
        <div className={`${controlsCollapsed ? 'lg:col-span-7' : 'lg:col-span-6'} transition-all duration-300`}>
          <Card className="h-full bg-background border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Shield className="h-5 w-5" />
                Disaster Map - {selectedDistrict || "Select a district"}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Real-time disaster visualization and risk assessment
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[calc(100%-80px)] p-0">
              <div className="h-full rounded-lg overflow-hidden border">
                <MapView center={mapCenter} zoom={mapZoom} riskOverlay={riskOverlay} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className={`${controlsCollapsed ? 'lg:col-span-4' : 'lg:col-span-3'} transition-all duration-300`}>
          <Card className="h-full bg-background border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Simulation Results</CardTitle>
              <CardDescription className="text-muted-foreground">
                Detailed analysis and projections
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-y-auto h-[calc(100%-80px)]">
              <ResultsPanel result={lastSimulationResult} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;