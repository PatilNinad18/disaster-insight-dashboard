import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapContainer, TileLayer, Polygon, Marker, Popup } from "react-leaflet";
import { MapPin, Users, AlertTriangle, Shield, TrendingUp } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { analyzeZones } from "@/services/api";
import { ZoneData } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import "leaflet/dist/leaflet.css";

const ZoneAnalysis = () => {
  const { 
    selectedDistrict, 
    disasterType, 
    zones, 
    setZones, 
    selectedZone, 
    setSelectedZone,
    isLoading,
    setIsLoading 
  } = useAppStore();

  const [mapCenter, setMapCenter] = useState<[number, number]>([18.5204, 73.8567]);
  const [mapZoom, setMapZoom] = useState(11);

  useEffect(() => {
    if (selectedDistrict) {
      loadZoneAnalysis();
    }
  }, [selectedDistrict, disasterType]);

  const loadZoneAnalysis = async () => {
    if (!selectedDistrict) return;

    setIsLoading(true);
    try {
      const zoneData = await analyzeZones({
        district: selectedDistrict,
        disasterType
      });
      setZones(zoneData);
      
      // Set map center based on first zone coordinates
      if (zoneData.length > 0 && zoneData[0].coordinates.length > 0) {
        const center = zoneData[0].coordinates[0];
        setMapCenter(center);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load zone analysis",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return "bg-red-100 text-red-800 border-red-200";
    if (score >= 60) return "bg-orange-100 text-orange-800 border-orange-200";
    if (score >= 40) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-green-100 text-green-800 border-green-200";
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return "bg-red-500";
      case 2: return "bg-orange-500";
      case 3: return "bg-yellow-500";
      default: return "bg-blue-500";
    }
  };

  const getPolygonColor = (riskScore: number) => {
    if (riskScore >= 80) return "#ef4444";
    if (riskScore >= 60) return "#f97316";
    if (riskScore >= 40) return "#eab308";
    return "#22c55e";
  };

  const formatPopulation = (pop: number) => {
    if (pop >= 1000000) {
      return `${(pop / 1000000).toFixed(1)}M`;
    }
    return `${(pop / 1000).toFixed(0)}K`;
  };

  if (!selectedDistrict) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2">No District Selected</h2>
          <p className="text-gray-600">Please select a district from the main dashboard to view zone analysis</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <MapPin className="h-6 w-6 text-green-600" />
        <h1 className="text-3xl font-bold">Multi-Zone Risk Analysis</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Map View */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Zone Map - {selectedDistrict}
            </CardTitle>
            <CardDescription>
              Click on zones to view detailed risk information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96 rounded-lg overflow-hidden border">
              <MapContainer 
                center={mapCenter} 
                zoom={mapZoom} 
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                {zones.map((zone) => (
                  <Polygon
                    key={zone.id}
                    positions={zone.coordinates}
                    color={getPolygonColor(zone.riskScore)}
                    fillColor={getPolygonColor(zone.riskScore)}
                    fillOpacity={0.3}
                    weight={selectedZone === zone.id ? 3 : 2}
                    opacity={selectedZone === zone.id ? 1 : 0.7}
                    eventHandlers={{
                      click: () => setSelectedZone(zone.id),
                    }}
                  />
                ))}
                
                {zones.map((zone) => {
                  const center = zone.coordinates[0];
                  return (
                    <Marker key={`marker-${zone.id}`} position={center}>
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-bold">{zone.name}</h3>
                          <p className="text-sm">Risk Score: {zone.riskScore}</p>
                          <p className="text-sm">Population: {formatPopulation(zone.population)}</p>
                          <p className="text-sm">Priority: #{zone.priority}</p>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          </CardContent>
        </Card>

        {/* Zone List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Zone Details
            </CardTitle>
            <CardDescription>
              Risk assessment and resource allocation for each zone
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedZone === zone.id 
                      ? "border-blue-500 bg-blue-50" 
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedZone(zone.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{zone.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`w-3 h-3 rounded-full ${getPriorityColor(zone.priority)}`} />
                        <span className="text-sm text-gray-600">Priority #{zone.priority}</span>
                      </div>
                    </div>
                    <Badge className={getRiskColor(zone.riskScore)}>
                      {zone.riskScore}/100
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span>{formatPopulation(zone.population)} people</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-gray-500" />
                      <span>{zone.recommendedRescueTeams} teams</span>
                    </div>
                  </div>

                  {zone.riskScore >= 70 && (
                    <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                      <div className="flex items-center gap-1 text-red-700">
                        <AlertTriangle className="h-3 w-3" />
                        <span className="text-xs font-medium">High Risk Zone</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {zones.filter(z => z.riskScore >= 70).length}
                </div>
                <p className="text-sm text-gray-600">High Risk Zones</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatPopulation(zones.reduce((sum, z) => sum + z.population, 0))}
                </div>
                <p className="text-sm text-gray-600">Total Population</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {zones.reduce((sum, z) => sum + z.recommendedRescueTeams, 0)}
                </div>
                <p className="text-sm text-gray-600">Total Teams Needed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {zones.length > 0 ? Math.round(zones.reduce((sum, z) => sum + z.riskScore, 0) / zones.length) : 0}
                </div>
                <p className="text-sm text-gray-600">Average Risk Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ZoneAnalysis;
