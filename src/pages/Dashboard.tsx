import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import  MapView  from "@/components/MapView";
import ControlPanel  from "@/components/ControlPanel";
import ResultsPanel  from "@/components/ResultsPanel";
import { loadDistrict, simulate, SimulationResult } from "@/services/api";
import { useAppStore } from "@/store/appStore";
import { Shield, Radio, TrendingUp, Users, AlertTriangle, Activity, ChevronDown, ChevronUp } from "lucide-react";
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

  // Local state
  const [mapCenter, setMapCenter] = useState<[number, number]>(INDIA_CENTER);
  const [mapZoom, setMapZoom] = useState(INDIA_ZOOM);
  const [controlsCollapsed, setControlsCollapsed] = useState(false);
  const [rainfall, setRainfall] = useState(150);
  const [magnitude, setMagnitude] = useState(5.0);
  const [rescueTeams, setRescueTeams] = useState(10);
  const [medicalUnits, setMedicalUnits] = useState(5);
  const [reliefCapacity, setReliefCapacity] = useState(500);
  const [delayHours, setDelayHours] = useState(0);
  const [riskOverlay, setRiskOverlay] = useState<{
    lat: number;
    lng: number;
    type: "flood" | "earthquake";
    intensity: number;
  } | null>(null);

  // Calculate risk score based on current parameters
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
    
    // Adjust for delay
    score = Math.min(100, score + (delayHours * 5));
    
    setRiskScore(Math.round(score));
  }, [selectedDistrict, disasterType, rainfall, magnitude, delayHours, setRiskScore]);

  const handleDistrictChange = useCallback(async (name: string) => {
    setSelectedDistrict(name);
    try {
      const data = await loadDistrict(name);
      setMapCenter([data.lat, data.lng]);
      setMapZoom(10);
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
        delay_hours: delayHours,
      });
      setLastSimulationResult(res);

      // Show risk overlay
      const intensity =
        disasterType === "flood" ? rainfall / 300 : (magnitude - 3) / 6;
      setRiskOverlay({
        lat: mapCenter[0],
        lng: mapCenter[1],
        type: disasterType,
        intensity,
      });

      toast({ title: "Simulation Complete", description: `${selectedDistrict} — ${disasterType}` });
    } catch {
      toast({ title: "Error", description: "Simulation failed", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [selectedDistrict, disasterType, rainfall, magnitude, rescueTeams, medicalUnits, reliefCapacity, delayHours, mapCenter, toast, setIsLoading, setLastSimulationResult]);

  const getRiskColor = (score: number) => {
    if (score >= 80) return "text-red-600";
    if (score >= 60) return "text-orange-600";
    if (score >= 40) return "text-yellow-600";
    return "text-green-600";
  };

  const getRiskBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 80) return "destructive";
    if (score >= 60) return "default";
    if (score >= 40) return "secondary";
    return "outline";
  };

  const calculateResourceEfficiency = () => {
    if (!lastSimulationResult) return 0;
    const totalResources = rescueTeams + medicalUnits + (reliefCapacity / 100);
    const savedPerResource = lastSimulationResult.affected_population / totalResources;
    return Math.min(100, Math.round(savedPerResource / 100));
  };

  const getRecommendedAction = () => {
    if (!selectedDistrict) return { text: "Select a district and run simulation", variant: "secondary" as const };
    if (riskScore >= 70) return { text: "EVACUATE high-risk zones — send alert immediately", variant: "destructive" as const };
    if (riskScore >= 40) return { text: "MONITOR — Prepare resources and consider targeted alerts", variant: "default" as const };
    return { text: "No immediate action — continue monitoring", variant: "secondary" as const };
  };

  const recommendedAction = getRecommendedAction();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Recommended action — one-line decision for officials */}
      <div className="rounded-lg border-2 border-orange-200 bg-orange-50 px-4 py-3 flex items-center gap-3">
        <span className="text-sm font-medium text-orange-900 shrink-0">Recommended action:</span>
        <Badge variant={recommendedAction.variant} className="text-sm font-normal">
          {recommendedAction.text}
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Risk Score</CardTitle>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Fatalities</CardTitle>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Economic Loss</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {isLoading ? <Skeleton className="h-8 w-24" /> : 
                lastSimulationResult ? `₹${(lastSimulationResult.economic_loss / 1000000).toFixed(1)}M` : "₹0M"}
            </div>
            <p className="text-xs text-muted-foreground">
              Projected economic impact
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resource Efficiency</CardTitle>
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Control Panel */}
        <div className="lg:col-span-3">
          <Collapsible open={!controlsCollapsed} onOpenChange={setControlsCollapsed}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                Control Panel
                {controlsCollapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Simulation Controls</CardTitle>
                  <CardDescription>
                    Configure disaster parameters and resources
                  </CardDescription>
                </CardHeader>
                <CardContent>
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
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Map */}
        <div className="lg:col-span-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Disaster Map - {selectedDistrict || "Select a district"}
              </CardTitle>
              <CardDescription>
                Real-time disaster visualization and risk assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 rounded-lg overflow-hidden border">
                <MapView center={mapCenter} zoom={mapZoom} riskOverlay={riskOverlay} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Simulation Results</CardTitle>
              <CardDescription>
                Detailed analysis and projections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResultsPanel result={lastSimulationResult} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
