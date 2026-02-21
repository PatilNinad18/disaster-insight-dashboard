import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, AlertCircle, Shield, Bell } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { evaluateRedTeam } from "@/services/api";
import { toast } from "@/hooks/use-toast";

const RedTeam = () => {
  const navigate = useNavigate();
  const { 
    user,
    selectedDistrict, 
    disasterType, 
    riskScore, 
    redTeamAnalysis, 
    setRedTeamAnalysis,
    isLoading,
    setIsLoading 
  } = useAppStore();

  const [userDecision, setUserDecision] = useState<"Evacuate" | "Monitor" | "Ignore">("Monitor");
  const showAiWarningCta = redTeamAnalysis && (redTeamAnalysis.conflictLevel === "High" || redTeamAnalysis.aiRecommendation === "Evacuate");

  const handleEvaluate = async () => {
    if (!selectedDistrict) {
      toast({
        title: "Error",
        description: "Please select a district first",
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-orange-600" />
        <h1 className="text-3xl font-bold">Red Team Analysis</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Decision Configuration</CardTitle>
            <CardDescription>
              Configure the scenario to analyze decision conflicts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Selected District</label>
              <p className="text-lg font-semibold">{selectedDistrict || "None selected"}</p>
            </div>

            <div>
              <label className="text-sm font-medium">Disaster Type</label>
              <p className="text-lg font-semibold capitalize">{disasterType}</p>
            </div>

            <div>
              <label className="text-sm font-medium">Risk Score</label>
              <p className="text-lg font-semibold">{riskScore}/100</p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">User Decision</label>
              <div className="flex gap-2">
                {(["Evacuate", "Monitor", "Ignore"] as const).map((decision) => (
                  <Button
                    key={decision}
                    variant={userDecision === decision ? "default" : "outline"}
                    onClick={() => setUserDecision(decision)}
                    className="flex-1"
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
              {isLoading ? "Analyzing..." : "Evaluate Decision"}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>
              AI-powered decision conflict analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            {redTeamAnalysis ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">AI Recommendation</span>
                  <Badge variant="outline" className="capitalize">
                    {redTeamAnalysis.aiRecommendation}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">User Decision</span>
                  <Badge variant="outline" className="capitalize">
                    {redTeamAnalysis.userDecision}
                  </Badge>
                </div>

                <div className={`p-4 rounded-lg border ${getConflictColor(redTeamAnalysis.conflictLevel)}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {getConflictIcon(redTeamAnalysis.conflictLevel)}
                    <span className="font-medium">Conflict Level: {redTeamAnalysis.conflictLevel}</span>
                  </div>
                  <div className="text-2xl font-bold mb-1">
                    {redTeamAnalysis.conflictPercentage}%
                  </div>
                  <div className="text-sm">
                    {redTeamAnalysis.impactMessage}
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Analysis:</strong> The AI system {redTeamAnalysis.userDecision === redTeamAnalysis.aiRecommendation ? 'agrees' : 'disagrees'} with your decision. 
                    {redTeamAnalysis.conflictLevel === "High" && " Consider reviewing the available data and reassessing your approach."}
                    {redTeamAnalysis.conflictLevel === "Medium" && " There are some factors that may warrant additional consideration."}
                    {redTeamAnalysis.conflictLevel === "Low" && " Your decision aligns well with the AI assessment."}
                  </p>
                </div>

                {showAiWarningCta && user?.role === "admin" && (
                  <div className="p-4 rounded-lg border-2 border-orange-200 bg-orange-50">
                    <p className="text-sm font-medium text-orange-900 mb-2">AI Red Team recommends immediate action</p>
                    <Button
                      onClick={() => navigate("/alerts")}
                      className="w-full bg-orange-600 hover:bg-orange-700"
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Send AI warning via SMS
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Configure the scenario and click "Evaluate Decision" to see analysis results</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RedTeam;
