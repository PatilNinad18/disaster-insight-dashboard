import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Marker,
  Popup,
  Circle
} from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/appStore";
import { analyzeZones, loadDistrict } from "@/services/api";

/* ---------------- Create custom red dot icon for disaster-prone areas (medium-large) */
const redDotIcon = new Icon({
  iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Ccircle cx='10' cy='10' r='8' fill='%23dc2626' stroke='%23b91c1c' stroke-width='1'/%3E%3Ccircle cx='10' cy='10' r='3' fill='white'/%3E%3C/svg%3E",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10]
});

/* ---------------- Create custom blue dot icon for flood-prone areas */
const blueDotIcon = new Icon({
  iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Ccircle cx='10' cy='10' r='8' fill='%232563eb' stroke='%231d4ed8' stroke-width='1'/%3E%3Ccircle cx='10' cy='10' r='3' fill='white'/%3E%3C/svg%3E",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10]
});

/* ---------------- Haversine Distance ---------------- */
const calculateDistanceKm = (
  coord1: [number, number],
  coord2: [number, number]
) => {
  const R = 6371;
  const dLat = ((coord2[0] - coord1[0]) * Math.PI) / 180;
  const dLng = ((coord2[1] - coord1[1]) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((coord1[0] * Math.PI) / 180) *
      Math.cos((coord2[0] * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/* ---------------- Safe Zone Center ---------------- */
const getZoneCenter = (coordinates: [number, number][]) => {
  if (!coordinates || coordinates.length === 0) return null;

  const lat =
    coordinates.reduce((sum, c) => sum + Number(c[0]), 0) /
    coordinates.length;

  const lng =
    coordinates.reduce((sum, c) => sum + Number(c[1]), 0) /
    coordinates.length;

  return [lat, lng] as [number, number];
};

const ZoneAnalysis = () => {
  const {
    selectedDistrict,
    disasterType,
    zones,
    setZones
  } = useAppStore();

  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [mapZoom, setMapZoom] = useState(12);
  const [affectedZones, setAffectedZones] = useState<string[]>([]);
  const [epicenter, setEpicenter] = useState<[number, number] | null>(null);

  /* ---------------- Load Data ---------------- */
  useEffect(() => {
    if (!selectedDistrict) return;

    const loadData = async () => {
      const district = await loadDistrict(selectedDistrict);

      const center: [number, number] = [
        Number(district.lat),
        Number(district.lng)
      ];

      setMapCenter(center);
      setMapZoom(12);

      const zoneData = await analyzeZones({
        district: selectedDistrict,
        disasterType
      });

      setZones(zoneData);
      setAffectedZones([]);
      setEpicenter(null);
    };

    loadData();
  }, [selectedDistrict, disasterType]);

  /* ---------------- Detect Disaster ---------------- */
  const detectDisaster = () => {
  if (!zones.length || !mapCenter) {
    console.log("No zones or no mapCenter");
    return;
  }

  console.log(`🌊 Detecting ${disasterType} disaster...`);
  console.log("Zones:", zones);
  console.log("Zone names:", zones.map(z => z.name));

  // Predefined disaster-prone areas for each city
  const getDisasterProneAreas = (city: string, disasterType: string) => {
    const cityLower = city.toLowerCase();
    console.log(`🔍 Looking for areas in city: "${city}" -> "${cityLower}"`);
    
    // Try multiple city name variations
    const cityVariations = [
      cityLower,
      cityLower.replace(' ', ''),
      cityLower.replace(' ', ''),
    ];
    
    console.log(`🔍 City variations to check:`, cityVariations);
    
    // Flood-prone areas (water bodies, low-lying areas)
    const floodAreas: Record<string, string[]> = {
      'guwahati': ['Ganeshguri', 'Khanapara', 'Panjabari', 'Dispur'],
      'pune': ['Kothrud', 'Hinjewadi', 'Baner', 'Central Pune'],
      'mumbai': ['Worli', 'Bandra', 'Dadar', 'Marine Lines'],
      'delhi': ['Karol Bagh', 'Lajpat Nagar', 'Connaught Place', 'Dwarka'],
      'chennai': ['T. Nagar', 'Anna Salai', 'Velachery', 'Adyar'],
      'bengaluru': ['Whitefield', 'Indiranagar', 'Koramangala', 'MG Road'],
      'hyderabad': ['Banjara Hills', 'Hitech City', 'Secunderabad', 'Charminar'],
      'kolkata': ['Park Street', 'Salt Lake', 'Howrah', 'Dumdum'],
      'ahmedabad': ['Maninagar', 'Navrangpura', 'Bodakdev', 'Satellite'],
      'jaipur': ['Pink City', 'Malviya Nagar', 'Vaishali Nagar', 'Mansarovar']
    } as const;
    
    // Earthquake-prone areas (urban density, building density)
    const earthquakeAreas: Record<string, string[]> = {
      'guwahati': ['Dispur', 'Ganeshguri', 'Panjabari', 'Khanapara'],
      'pune': ['Central Pune', 'Kothrud', 'Hinjewadi', 'Baner'],
      'mumbai': ['Dadar', 'Bandra', 'Worli', 'Marine Lines'],
      'delhi': ['Connaught Place', 'Karol Bagh', 'Lajpat Nagar', 'Dwarka'],
      'chennai': ['Anna Salai', 'T. Nagar', 'Velachery', 'Adyar'],
      'bengaluru': ['MG Road', 'Indiranagar', 'Koramangala', 'Whitefield'],
      'hyderabad': ['Charminar', 'Banjara Hills', 'Hitech City', 'Secunderabad'],
      'kolkata': ['Park Street', 'Salt Lake', 'Howrah', 'Dumdum'],
      'ahmedabad': ['Navrangpura', 'Maninagar', 'Bodakdev', 'Satellite'],
      'jaipur': ['Pink City', 'Malviya Nagar', 'Vaishali Nagar', 'Mansarovar']
    } as const;
    
    // Try to find areas using all city variations
    let areas: string[] = [];
    for (const variation of cityVariations) {
      const foundAreas = disasterType === "flood" ? floodAreas[variation] : earthquakeAreas[variation];
      if (foundAreas && foundAreas.length > 0) {
        areas = foundAreas;
        console.log(`✅ Found ${disasterType} areas for ${variation}:`, foundAreas);
        break;
      }
    }
    
    console.log(`📍 Predefined ${disasterType} areas for ${city}:`, areas.length > 0 ? areas : ['NO AREAS FOUND']);
    return areas;
  };
  
  // Get disaster-prone areas for current city
  const targetAreas = getDisasterProneAreas(selectedDistrict, disasterType);
  console.log(`🎯 Target areas: ${targetAreas.length > 0 ? targetAreas.join(', ') : 'NONE'}`);

  // Filter and sort zones by target areas and risk score
  console.log("🔍 Filtering zones...");
  console.log("Available zones:", zones.map(z => z.name));
  console.log("Target areas:", targetAreas);
  
  const filteredZones = zones
    .filter(zone => {
      const matches = targetAreas && targetAreas.includes(zone.name);
      console.log(`🔍 ${zone.name} matches target areas: ${matches}`);
      return matches;
    })
    .sort((a, b) => {
      // Disaster-specific sorting
      if (disasterType === "flood") {
        // For floods: prioritize water areas (Ganeshguri, Khanapara) first
        const aIsWater = a.name.toLowerCase().includes('guri') || a.name.toLowerCase().includes('khanapara');
        const bIsWater = b.name.toLowerCase().includes('guri') || b.name.toLowerCase().includes('khanapara');
        
        if (aIsWater && !bIsWater) return -1;
        if (!aIsWater && bIsWater) return 1;
        
        // Within water areas, prioritize Ganeshguri over Khanapara
        if (aIsWater && bIsWater) {
          if (a.name === 'Ganeshguri' && b.name !== 'Ganeshguri') return -1;
          if (b.name === 'Ganeshguri' && a.name !== 'Ganeshguri') return 1;
        }
      } else if (disasterType === "earthquake") {
        // For earthquakes: prioritize urban areas (Dispur, Panjabari) first
        const aIsUrban = a.name.toLowerCase().includes('dispur') || a.name.toLowerCase().includes('panjabari');
        const bIsUrban = b.name.toLowerCase().includes('dispur') || b.name.toLowerCase().includes('panjabari');
        
        if (aIsUrban && !bIsUrban) return -1;
        if (!aIsUrban && bIsUrban) return 1;
        
        // Within urban areas, prioritize Dispur over Panjabari
        if (aIsUrban && bIsUrban) {
          if (a.name === 'Dispur' && b.name !== 'Dispur') return -1;
          if (b.name === 'Dispur' && a.name !== 'Dispur') return 1;
        }
      }
      
      // Fallback to risk score
      return b.riskScore - a.riskScore;
    });
    
  console.log("Filtered zones:", filteredZones.map(z => z.name));

  const topZones = filteredZones.slice(0, 4);

  console.log(`📍 Top 4 ${disasterType} zones selected:`);
  topZones.forEach((zone, index) => {
    const priorityField = disasterType === "flood" ? "floodPriority" : "quakePriority";
    const actualPriority = zone[priorityField] || zone.riskScore;
    console.log(`  ${index + 1}. ${zone.name} - Priority: ${actualPriority}% (was ${zone.riskScore}%)`);
  });

  const validZones = topZones
    .map(zone => {
      const center = getZoneCenter(zone.coordinates);
      if (!center) {
        console.log("❌ Invalid center for zone:", zone.name);
        return null;
      }

      const distance = calculateDistanceKm(mapCenter, center);
      const riskField = disasterType === "flood" ? "floodRisk" : "quakeRisk";
      const actualRisk = zone[riskField] || zone.riskScore;
      
      console.log(`✅ ${zone.name}: Center [${center[0].toFixed(4)}, ${center[1].toFixed(4)}], Distance: ${distance.toFixed(2)}km, ${disasterType} Risk: ${actualRisk}%`);

      return {
        id: zone.id,
        center,
        distance,
        zone
      };
    })
    .filter(Boolean);

  setAffectedZones(validZones.map(z => z!.id));

  if (validZones.length > 0) {
    // Set epicenter to the highest priority zone (first in sorted list)
    const epicenterZone = validZones[0]!;
    setEpicenter(epicenterZone.center);
    console.log(`🎯 ${disasterType.toUpperCase()} Epicenter set to: ${epicenterZone.zone.name} (Priority: ${epicenterZone.zone.riskScore}%)`);
  }
};

  if (!selectedDistrict || !mapCenter) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Select a city in Dashboard first.
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-6">
     // OLD LOGIC DISABLED - Using new predefined area system
  // The old zone selection logic has been replaced with predefined areas
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>
            Zone Map — {selectedDistrict}
          </CardTitle>

          <Button
            onClick={detectDisaster}
            disabled={!zones.length}
            className="bg-red-600 hover:bg-red-700"
          >
            🚨 Detect Disaster Impact
          </Button>
        </CardHeader>

        <CardContent>
          <div className="h-[600px] w-full rounded border overflow-hidden">
            <MapContainer
              key={`${selectedDistrict}-${mapCenter[0]}`}
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Draw Zones */}
              {zones.map(zone => (
                <Polygon
                  key={zone.id}
                  positions={zone.coordinates}
                  pathOptions={{
                    color: zone.name.toLowerCase().includes('center') ||
                           zone.name.toLowerCase().includes('dispur') ||
                           zone.name.toLowerCase().includes('bazaar') ||
                           zone.name.toLowerCase().includes('colony') ||
                           zone.name.toLowerCase().includes('panjabari') ? "#007bff" : "#94a3b8",
                    weight: 1,
                    fillOpacity: zone.name.toLowerCase().includes('guri') ||
                                  zone.name.toLowerCase().includes('bank') ||
                                  zone.name.toLowerCase().includes('nagar') ||
                                  zone.name.toLowerCase().includes('khanapara') ? 0.2 : 0.05
                  }}
                />
              ))}

              {/* Red Dots Within 10km */}
              {zones
                .filter(zone => affectedZones.includes(zone.id))
                .map(zone => {
                  const center = getZoneCenter(zone.coordinates);
                  if (!center) return null;

                  const distance = calculateDistanceKm(
                    mapCenter,
                    center
                  );

                  if (distance > 10) return null;

                  // Use disaster-specific icon
                  const icon = disasterType === "flood" ? blueDotIcon : redDotIcon;
                  const disasterSymbol = disasterType === "flood" ? "🌊" : "🫠";

                  return (
                    <Marker
                      key={`dot-${zone.id}`}
                      position={center}
                      icon={icon}
                    >
                      <Popup>
                        <div className="text-center">
                          <div className="font-bold text-lg">
                            {disasterSymbol} {zone.name}
                          </div>
                          <div className="text-sm mt-1">
                            <div><strong>Risk Score:</strong> {zone.riskScore}%</div>
                            <div><strong>Distance:</strong> {distance.toFixed(2)} km</div>
                            <div><strong>Disaster Type:</strong> {disasterType === "flood" ? "🌊 Flood" : "🫠 Earthquake"}</div>
                            <div><strong>Population:</strong> {(zone.population / 1000).toFixed(0)}K</div>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

              {/* Epicenter Highlight */}
              {epicenter && (
                <Circle
                  center={epicenter}
                  radius={500}
                  pathOptions={{
                    color: "red",
                    fillOpacity: 0.2
                  }}
                />
              )}
            </MapContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ZoneAnalysis;