import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, AlertCircle, Shield, Brain, TrendingUp, Users, Target, Activity } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { evaluateRedTeam } from "@/services/api";
import { loadDistrict } from "@/services/api";
import { toast } from "@/hooks/use-toast";

const RedTeam = () => {
  const { 
    disasterType, 
    riskScore, 
    redTeamAnalysis, 
    setRedTeamAnalysis,
    isLoading,
    setIsLoading,
    selectedDistrict,
    setSelectedDistrict,
    setDisasterType,
    setRiskScore
  } = useAppStore();

  const [userDecision, setUserDecision] = useState<"Evacuate" | "Monitor" | "Ignore">("Monitor");
  const [advisorInsights, setAdvisorInsights] = useState<string[]>([]);
  const [riskFactors, setRiskFactors] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [availableCities] = useState<string[]>(["Delhi", "Mumbai", "Kolkata", "Bengaluru", "Chennai", "Hyderabad", "Ahmedabad", "Pune", "Jaipur", "Guwahati"]);

  // Load city data when selected
  useEffect(() => {
    if (selectedDistrict) {
      loadCityData();
    }
  }, [selectedDistrict]);

  const loadCityData = async () => {
    if (!selectedDistrict) return;
    
    try {
      const data = await loadDistrict(selectedDistrict);
      // Update risk score based on city population and disaster type
      const populationRisk = data.population > 10000000 ? 20 : 10;
      const disasterRisk = disasterType === "flood" ? 30 : 25;
      const baseRisk = populationRisk + disasterRisk;
      setRiskScore(Math.min(100, baseRisk + Math.random() * 30));
    } catch (error) {
      console.error("Failed to load city data:", error);
    }
  };

  const handleCityChange = async (city: string) => {
    setSelectedDistrict(city);
    try {
      const data = await loadDistrict(city);
      // Update risk score based on city population and disaster type
      const populationRisk = data.population > 10000000 ? 20 : 10;
      const disasterRisk = disasterType === "flood" ? 30 : 25;
      const baseRisk = populationRisk + disasterRisk;
      setRiskScore(Math.min(100, baseRisk + Math.random() * 30));
    } catch (error) {
      console.error("Failed to load city data:", error);
      toast({
        title: "Error",
        description: "Failed to load city data",
        variant: "destructive"
      });
    }
  };

  const handleEvaluate = async () => {
    if (!selectedDistrict) {
      toast({
        title: "Error",
        description: "Please select a city first",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const analysis = await evaluateRedTeam({
        district: selectedDistrict,
        disasterType,
        userDecision,
        riskScore
      });
      setRedTeamAnalysis(analysis);
      
      // Generate AI advisor insights based on ML model analysis
      generateAdvisorInsights(analysis);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to evaluate red team analysis",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateAdvisorInsights = (analysis: any) => {
    const insights = [];
    const factors = [];
    const recs = [];

    // Risk assessment insights
    if (analysis.conflictLevel === "High") {
      insights.push("⚠️ High conflict detected between human decision and AI recommendation");
      factors.push("Significant deviation from optimal response strategy");
      factors.push("Potential for increased casualties and economic impact");
      recs.push("Immediately reassess your decision based on AI recommendations");
      recs.push("Consider additional data sources before finalizing decision");
    } else if (analysis.conflictLevel === "Medium") {
      insights.push("🔍 Moderate conflict detected - review recommended");
      factors.push("Some parameters suggest alternative approach may be better");
      factors.push("Current decision may not optimize resource utilization");
      recs.push("Review AI recommendations and consider adjusting strategy");
      recs.push("Monitor situation closely for changing conditions");
    } else {
      insights.push("✅ Low conflict - decision aligns with AI assessment");
      factors.push("Decision consistent with optimal response parameters");
      factors.push("Resource allocation appears appropriate for current conditions");
      recs.push("Proceed with current strategy while maintaining vigilance");
      recs.push("Continue monitoring for any changes in risk parameters");
    }

    // Disaster-specific insights
    if (disasterType === "flood") {
      insights.push("🌊 Flood scenario detected - water level dynamics critical");
      factors.push("Rainfall intensity and duration key factors");
      recs.push("Monitor water levels and evacuation routes");
    } else {
      insights.push("🫠 Earthquake scenario - structural integrity paramount");
      factors.push("Magnitude and aftershock probability critical");
      recs.push("Assess building safety and infrastructure damage");
    }

    // Risk score based insights
    if (riskScore >= 80) {
      insights.push("🚨 Critical risk level - immediate action required");
      recs.push("Execute emergency protocols without delay");
    } else if (riskScore >= 60) {
      insights.push("⚡ High risk level - prepared for rapid response");
      recs.push("Ensure all resources are on standby");
    } else {
      insights.push("📊 Moderate risk level - standard protocols sufficient");
      recs.push("Maintain regular monitoring and communication");
    }

    setAdvisorInsights(insights);
    setRiskFactors(factors);
    setRecommendations(recs);
  };

  const getConflictColor = (level: string) => {
    switch (level) {
      case "Low": return "text-green-600 bg-green-50 border-green-200";
      case "Medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "High": return "text-red-600 bg-red-50 border-red-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getConflictIcon = (level: string) => {
    switch (level) {
      case "Low": return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "Medium": return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case "High": return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <Shield className="h-5 w-5 text-gray-600" />;
    }
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case "Evacuate": return "bg-red-100 text-red-700 border-red-200";
      case "Monitor": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Ignore": return "bg-green-100 text-green-700 border-green-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      {/* Header */}
      <div className="bg-background rounded-lg border border-border p-4 shadow-sm m-4">
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI Red Team Advisor</h1>
            <p className="text-muted-foreground">ML-Powered Decision Intelligence & Risk Analysis</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mx-4">
        {/* Input Configuration */}
        <Card className="bg-background border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Decision Configuration</CardTitle>
            <CardDescription className="text-muted-foreground">
              Configure scenario for AI advisory analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Select City</label>
              <select 
                value={selectedDistrict || ""} 
                onChange={(e) => handleCityChange(e.target.value)}
                className="w-full p-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="">Select a city...</option>
                {availableCities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Disaster Type</label>
              <select 
                value={disasterType}
                onChange={(e) => setDisasterType(e.target.value as "flood" | "earthquake")}
                className="w-full p-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="flood">🌊 Flood</option>
                <option value="earthquake">🫠 Earthquake</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Risk Score</label>
              <div className="flex items-center gap-2">
                <Progress value={riskScore} className="flex-1" />
                <span className="text-lg font-semibold text-foreground">{riskScore}/100</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Your Decision</label>
              <div className="grid grid-cols-3 gap-2">
                {(["Evacuate", "Monitor", "Ignore"] as const).map((decision) => (
                  <Button
                    key={decision}
                    variant={userDecision === decision ? "default" : "outline"}
                    onClick={() => setUserDecision(decision)}
                    className={`p-2 text-xs ${userDecision === decision ? getDecisionColor(decision) : ''}`}
                  >
                    {decision}
                  </Button>
                ))}
              </div>
            </div>

            <Button 
              onClick={handleEvaluate} 
              disabled={isLoading || !selectedDistrict}
              className="w-full"
            >
              {isLoading ? "Analyzing..." : "Get AI Advisory"}
            </Button>
          </CardContent>
        </Card>

        {/* AI Advisor Insights */}
        <Card className="bg-background border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              AI Advisor Analysis
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              ML-powered insights and recommendations based on trained models
            </CardDescription>
          </CardHeader>
          <CardContent>
            {redTeamAnalysis ? (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">
                      {redTeamAnalysis.conflictPercentage}%
                    </div>
                    <div className="text-sm text-blue-700">Conflict Level</div>
                    <Badge className={`${getConflictColor(redTeamAnalysis.conflictLevel)} mt-1`}>
                      {redTeamAnalysis.conflictLevel}
                    </Badge>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-lg font-bold text-green-600 capitalize">
                      {redTeamAnalysis.aiRecommendation}
                    </div>
                    <div className="text-sm text-green-700">AI Recommendation</div>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-lg font-bold text-purple-600 capitalize">
                      {redTeamAnalysis.userDecision}
                    </div>
                    <div className="text-sm text-purple-700">Your Decision</div>
                  </div>
                </div>

                {/* AI Insights */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Brain className="h-5 w-5 text-blue-600" />
                    AI Advisor Insights
                  </h3>
                  <div className="space-y-2">
                    {advisorInsights.map((insight, index) => (
                      <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risk Factors */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    Risk Factors Identified
                  </h3>
                  <div className="space-y-2">
                    {riskFactors.map((factor, index) => (
                      <div key={index} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <p className="text-sm text-orange-800">{factor}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Strategic Recommendations
                  </h3>
                  <div className="space-y-2">
                    {recommendations.map((rec, index) => (
                      <div key={index} className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm text-green-800">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Impact Analysis */}
                <div className={`p-4 rounded-lg border ${getConflictColor(redTeamAnalysis.conflictLevel)}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {getConflictIcon(redTeamAnalysis.conflictLevel)}
                    <span className="font-medium text-foreground">Impact Analysis</span>
                  </div>
                  <div className="text-sm text-foreground">
                    {redTeamAnalysis.impactMessage}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Brain className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">AI Advisor Ready</h3>
                <p>Select a city, configure scenario and click "Get AI Advisory" to receive ML-powered insights and recommendations</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RedTeam;