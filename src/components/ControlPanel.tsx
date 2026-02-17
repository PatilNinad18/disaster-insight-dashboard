import { DISTRICT_LIST } from "@/services/api";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { AlertTriangle, Waves, Activity } from "lucide-react";

interface ControlPanelProps {
  district: string;
  onDistrictChange: (d: string) => void;
  disasterType: "flood" | "earthquake";
  onDisasterTypeChange: (t: "flood" | "earthquake") => void;
  rainfall: number;
  onRainfallChange: (v: number) => void;
  magnitude: number;
  onMagnitudeChange: (v: number) => void;
  rescueTeams: number;
  onRescueTeamsChange: (v: number) => void;
  medicalUnits: number;
  onMedicalUnitsChange: (v: number) => void;
  reliefCapacity: number;
  onReliefCapacityChange: (v: number) => void;
  delayHours: number;
  onDelayHoursChange: (v: number) => void;
  onSimulate: () => void;
  isLoading: boolean;
}

const ControlPanel = ({
  district,
  onDistrictChange,
  disasterType,
  onDisasterTypeChange,
  rainfall,
  onRainfallChange,
  magnitude,
  onMagnitudeChange,
  rescueTeams,
  onRescueTeamsChange,
  medicalUnits,
  onMedicalUnitsChange,
  reliefCapacity,
  onReliefCapacityChange,
  delayHours,
  onDelayHoursChange,
  onSimulate,
  isLoading,
}: ControlPanelProps) => {
  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto p-4">
      <div className="flex items-center gap-2 mb-1">
        <AlertTriangle className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-mono font-semibold tracking-wide uppercase text-foreground">
          Controls
        </h2>
      </div>

      {/* District */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">District</Label>
        <Select value={district} onValueChange={onDistrictChange}>
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue placeholder="Select district" />
          </SelectTrigger>
          <SelectContent>
            {DISTRICT_LIST.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Disaster Type */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Disaster Type</Label>
        <Select value={disasterType} onValueChange={(v) => onDisasterTypeChange(v as "flood" | "earthquake")}>
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="flood">
              <span className="flex items-center gap-2">
                <Waves className="h-3 w-3 text-flood" /> Flood
              </span>
            </SelectItem>
            <SelectItem value="earthquake">
              <span className="flex items-center gap-2">
                <Activity className="h-3 w-3 text-earthquake" /> Earthquake
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Conditional sliders */}
      {disasterType === "flood" && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">
            Rainfall: {rainfall} mm
          </Label>
          <Slider
            value={[rainfall]}
            onValueChange={([v]) => onRainfallChange(v)}
            min={0}
            max={300}
            step={5}
            className="[&_[role=slider]]:bg-flood [&_[role=slider]]:border-flood"
          />
        </div>
      )}

      {disasterType === "earthquake" && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">
            Magnitude: {magnitude.toFixed(1)}
          </Label>
          <Slider
            value={[magnitude]}
            onValueChange={([v]) => onMagnitudeChange(v)}
            min={3}
            max={9}
            step={0.1}
            className="[&_[role=slider]]:bg-earthquake [&_[role=slider]]:border-earthquake"
          />
        </div>
      )}

      {/* Resources */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Rescue Teams</Label>
        <Input
          type="number"
          min={0}
          value={rescueTeams}
          onChange={(e) => onRescueTeamsChange(Number(e.target.value))}
          className="bg-secondary border-border"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Medical Units</Label>
        <Input
          type="number"
          min={0}
          value={medicalUnits}
          onChange={(e) => onMedicalUnitsChange(Number(e.target.value))}
          className="bg-secondary border-border"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Relief Camp Capacity</Label>
        <Input
          type="number"
          min={0}
          value={reliefCapacity}
          onChange={(e) => onReliefCapacityChange(Number(e.target.value))}
          className="bg-secondary border-border"
        />
      </div>

      {/* Time Delay */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Response Delay</Label>
        <Select value={String(delayHours)} onValueChange={(v) => onDelayHoursChange(Number(v))}>
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">0 hours</SelectItem>
            <SelectItem value="2">+2 hours</SelectItem>
            <SelectItem value="4">+4 hours</SelectItem>
            <SelectItem value="6">+6 hours</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Simulate Button */}
      <Button
        onClick={onSimulate}
        disabled={isLoading || !district}
        className="w-full mt-2 bg-primary text-primary-foreground hover:bg-primary/90 glow-primary font-mono uppercase tracking-wider"
      >
        {isLoading ? "Simulating..." : "Run Simulation"}
      </Button>
    </div>
  );
};

export default ControlPanel;
