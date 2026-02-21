import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, FileText, AlertTriangle } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { getAuditLogs } from "@/services/api";
import { DecisionLog } from "@/services/api";
import { toast } from "@/hooks/use-toast";

const AuditLog = () => {
  const { decisionLogs, setDecisionLogs, isLoading, setIsLoading } = useAppStore();
  const [filteredLogs, setFilteredLogs] = useState<DecisionLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [districtFilter, setDistrictFilter] = useState<string>("all");
  const [disasterTypeFilter, setDisasterTypeFilter] = useState<string>("all");

  useEffect(() => {
    loadAuditLogs();
  }, []);

  useEffect(() => {
    let filtered = decisionLogs;

    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userDecision.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.aiWarning.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (districtFilter !== "all") {
      filtered = filtered.filter(log => log.district === districtFilter);
    }

    if (disasterTypeFilter !== "all") {
      filtered = filtered.filter(log => log.disasterType === disasterTypeFilter);
    }

    setFilteredLogs(filtered);
  }, [decisionLogs, searchTerm, districtFilter, disasterTypeFilter]);

  const loadAuditLogs = async () => {
    setIsLoading(true);
    try {
      const logs = await getAuditLogs();
      setDecisionLogs(logs);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load audit logs",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case "Evacuate": return "bg-red-100 text-red-800 border-red-200";
      case "Monitor": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Ignore": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  const getDisasterTypeColor = (type: string) => {
    switch (type) {
      case "flood": return "bg-blue-100 text-blue-800 border-blue-200";
      case "earthquake": return "bg-orange-100 text-orange-800 border-orange-200";
      default: return "bg-purple-100 text-purple-800 border-purple-200";
    }
  };

  const uniqueDistricts = [...new Set(decisionLogs.map(log => log.district))];
  const uniqueDisasterTypes = [...new Set(decisionLogs.map(log => log.disasterType))];

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="h-6 w-6 text-blue-600" />
        <h1 className="text-3xl font-bold">Decision Audit Log</h1>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>
            Filter audit logs by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div>
              <Label htmlFor="district-filter">District</Label>
              <Select value={districtFilter} onValueChange={setDistrictFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All districts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" all ">All districts</SelectItem>
                  {uniqueDistricts.map(district => (
                    <SelectItem key={district} value={district}>
                      {district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="disaster-filter">Disaster Type</Label>
              <Select value={disasterTypeFilter} onValueChange={setDisasterTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {uniqueDisasterTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={loadAuditLogs} 
                variant="outline" 
                className="w-full"
              >
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{filteredLogs.length}</div>
            <p className="text-sm text-gray-600">Total Logs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {filteredLogs.filter(log => log.userDecision === "Evacuate").length}
            </div>
            <p className="text-sm text-gray-600">Evacuations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {filteredLogs.filter(log => log.userDecision === "Monitor").length}
            </div>
            <p className="text-sm text-gray-600">Monitoring</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">
              {filteredLogs.filter(log => log.userDecision === "Ignore").length}
            </div>
            <p className="text-sm text-gray-600">Ignored</p>
          </CardContent>
        </Card>
      </div>

      {/* Audit Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
          <CardDescription>
            Complete history of disaster response decisions and AI warnings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No audit logs found matching the current filters</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>District</TableHead>
                    <TableHead>Disaster Type</TableHead>
                    <TableHead>User Decision</TableHead>
                    <TableHead>AI Warning</TableHead>
                    <TableHead>Override Reason</TableHead>
                    <TableHead>Predicted Impact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {formatDate(log.timestamp)}
                      </TableCell>
                      <TableCell className="font-medium">{log.district}</TableCell>
                      <TableCell>
                        <Badge className={getDisasterTypeColor(log.disasterType)}>
                          {log.disasterType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getDecisionColor(log.userDecision)}>
                          {log.userDecision}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 text-orange-500" />
                          <span className="text-sm">{log.aiWarning}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {log.overrideReason || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-green-600">
                          {log.predictedImpact}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLog;
