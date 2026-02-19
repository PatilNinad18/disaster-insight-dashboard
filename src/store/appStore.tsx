import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Types
export interface SimulationResult {
  affected_population: number;
  fatalities: number;
  economic_loss: number;
  time_series: TimeSeriesPoint[];
}

export interface TimeSeriesPoint {
  hour: number;
  no_resources: number;
  with_resources: number;
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

export interface RedTeamAnalysis {
  district: string;
  disasterType: string;
  userDecision: "Evacuate" | "Monitor" | "Ignore";
  aiRecommendation: "Evacuate" | "Monitor" | "Ignore";
  conflictPercentage: number;
  conflictLevel: "Low" | "Medium" | "High";
  impactMessage: string;
}

// State interface
interface AppState {
  selectedDistrict: string;
  disasterType: "flood" | "earthquake";
  riskScore: number;
  lastSimulationResult: SimulationResult | null;
  isLoading: boolean;
  zones: ZoneData[];
  selectedZone: string | null;
  decisionLogs: DecisionLog[];
  redTeamAnalysis: RedTeamAnalysis | null;
}

// Action types
type AppAction =
  | { type: "SET_SELECTED_DISTRICT"; payload: string }
  | { type: "SET_DISASTER_TYPE"; payload: "flood" | "earthquake" }
  | { type: "SET_RISK_SCORE"; payload: number }
  | { type: "SET_LAST_SIMULATION_RESULT"; payload: SimulationResult | null }
  | { type: "SET_IS_LOADING"; payload: boolean }
  | { type: "SET_ZONES"; payload: ZoneData[] }
  | { type: "SET_SELECTED_ZONE"; payload: string | null }
  | { type: "SET_DECISION_LOGS"; payload: DecisionLog[] }
  | { type: "SET_RED_TEAM_ANALYSIS"; payload: RedTeamAnalysis | null };

// Initial state
const initialState: AppState = {
  selectedDistrict: "",
  disasterType: "flood",
  riskScore: 0,
  lastSimulationResult: null,
  isLoading: false,
  zones: [],
  selectedZone: null,
  decisionLogs: [],
  redTeamAnalysis: null,
};

// Reducer
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case "SET_SELECTED_DISTRICT":
      return { ...state, selectedDistrict: action.payload };
    case "SET_DISASTER_TYPE":
      return { ...state, disasterType: action.payload };
    case "SET_RISK_SCORE":
      return { ...state, riskScore: action.payload };
    case "SET_LAST_SIMULATION_RESULT":
      return { ...state, lastSimulationResult: action.payload };
    case "SET_IS_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ZONES":
      return { ...state, zones: action.payload };
    case "SET_SELECTED_ZONE":
      return { ...state, selectedZone: action.payload };
    case "SET_DECISION_LOGS":
      return { ...state, decisionLogs: action.payload };
    case "SET_RED_TEAM_ANALYSIS":
      return { ...state, redTeamAnalysis: action.payload };
    default:
      return state;
  }
};

// Context
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

// Provider
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// Hook
export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppStore must be used within an AppProvider");
  }

  // Extract individual values and actions for zustand-like API
  const { state, dispatch } = context;

  return {
    // State
    selectedDistrict: state.selectedDistrict,
    disasterType: state.disasterType,
    riskScore: state.riskScore,
    lastSimulationResult: state.lastSimulationResult,
    isLoading: state.isLoading,
    zones: state.zones,
    selectedZone: state.selectedZone,
    decisionLogs: state.decisionLogs,
    redTeamAnalysis: state.redTeamAnalysis,

    // Actions
    setSelectedDistrict: (district: string) => dispatch({ type: "SET_SELECTED_DISTRICT", payload: district }),
    setDisasterType: (type: "flood" | "earthquake") => dispatch({ type: "SET_DISASTER_TYPE", payload: type }),
    setRiskScore: (score: number) => dispatch({ type: "SET_RISK_SCORE", payload: score }),
    setLastSimulationResult: (result: SimulationResult | null) => dispatch({ type: "SET_LAST_SIMULATION_RESULT", payload: result }),
    setIsLoading: (loading: boolean) => dispatch({ type: "SET_IS_LOADING", payload: loading }),
    setZones: (zones: ZoneData[]) => dispatch({ type: "SET_ZONES", payload: zones }),
    setSelectedZone: (zoneId: string | null) => dispatch({ type: "SET_SELECTED_ZONE", payload: zoneId }),
    setDecisionLogs: (logs: DecisionLog[]) => dispatch({ type: "SET_DECISION_LOGS", payload: logs }),
    setRedTeamAnalysis: (analysis: RedTeamAnalysis | null) => dispatch({ type: "SET_RED_TEAM_ANALYSIS", payload: analysis }),
  };
};
