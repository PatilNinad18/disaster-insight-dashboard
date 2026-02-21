import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Send, Shield, MessageSquare, Loader2, Users, Megaphone, AlertTriangle, FileText } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import {
  sendAlert,
  sendAlertToAll,
  getAlertHistory,
  getAlertsSentToPhone,
  getSubscribers,
  getBroadcastHistory,
  AlertRecord,
  SendAlertRequest,
  Subscriber,
  BroadcastRecord,
} from "@/services/api";
import { toast } from "@/hooks/use-toast";

const ALERT_TEMPLATES: { id: string; label: string; body: (district: string, type: string) => string }[] = [
  { id: "flood", label: "Flood warning", body: (d, _) => `[FLOOD ALERT] ${d || "District"}. Heavy rain expected. Avoid low-lying areas. Move to higher ground. Stay tuned. - SentinelX` },
  { id: "earthquake", label: "Earthquake alert", body: (d, _) => `[EARTHQUAKE ALERT] ${d || "District"}. Seismic activity reported. Drop, cover, hold. Stay away from buildings. - SentinelX` },
  { id: "evacuate", label: "Evacuate immediately", body: (d, t) => `[EVACUATE] ${d || "District"} - ${t || "disaster"}. Leave now. Follow official routes. Do not return until all-clear. - SentinelX` },
  { id: "monitor", label: "Monitor — no evacuation", body: (d, _) => `[MONITOR] ${d || "District"}. Situation under watch. No evacuation yet. Stay informed. - SentinelX` },
  { id: "allclear", label: "All-clear", body: (d) => `[ALL-CLEAR] ${d || "District"}. Threat passed. Follow local advisories for return. - SentinelX` },
];

const Alerts = () => {
  const { user, redTeamAnalysis, selectedDistrict, disasterType, riskScore } = useAppStore();
  const isAdmin = user?.role === "admin";

  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [sending, setSending] = useState(false);
  const [sendingToAll, setSendingToAll] = useState(false);
  const [history, setHistory] = useState<AlertRecord[]>([]);
  const [broadcastHistory, setBroadcastHistory] = useState<BroadcastRecord[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [alertsToMyNumber, setAlertsToMyNumber] = useState<AlertRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const [list, broadcasts] = await Promise.all([getAlertHistory(), getBroadcastHistory()]);
      setHistory(list);
      setBroadcastHistory(broadcasts);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadSubscribers = async () => {
    if (!isAdmin) return;
    const list = await getSubscribers();
    setSubscribers(list);
  };

  const loadAlertsToMyNumber = async (phone: string) => {
    const list = await getAlertsSentToPhone(phone);
    setAlertsToMyNumber(list);
  };

  useEffect(() => {
    loadHistory();
    loadSubscribers();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin && user?.phoneNumber) {
      loadAlertsToMyNumber(user.phoneNumber);
    }
  }, [isAdmin, user?.phoneNumber]);

  const useRedTeamWarning = () => {
    if (!redTeamAnalysis) {
      toast({
        title: "No Red Team data",
        description: "Run Red Team analysis first to use AI warning",
        variant: "destructive",
      });
      return;
    }
    const text = [
      `[DISASTER ALERT] ${redTeamAnalysis.district} - ${redTeamAnalysis.disasterType}`,
      `AI Recommendation: ${redTeamAnalysis.aiRecommendation}. Conflict: ${redTeamAnalysis.conflictLevel}.`,
      redTeamAnalysis.impactMessage,
      `Risk score: ${riskScore}/100. Act accordingly. - SentinelX`,
    ].join(" ");
    setMessage(text);
    toast({ title: "Message prefilled", description: "AI Red Team warning loaded" });
  };

  const applyTemplate = (templateId: string) => {
    const t = ALERT_TEMPLATES.find((x) => x.id === templateId);
    if (t) {
      setMessage(t.body(selectedDistrict, disasterType));
      setSelectedTemplateId(templateId);
      toast({ title: "Template applied", description: t.label });
    }
  };

  const handleSend = async () => {
    const phone = phoneNumber.trim();
    const msg = message.trim();
    if (!phone || !msg) {
      toast({
        title: "Missing fields",
        description: "Enter phone number and message",
        variant: "destructive",
      });
      return;
    }
    setSending(true);
    try {
      const req: SendAlertRequest = {
        phoneNumber: phone,
        message: msg,
        source: redTeamAnalysis ? "red_team" : "manual",
      };
      await sendAlert(req);
      toast({ title: "SMS sent", description: `Warning sent to ${phone}` });
      setMessage("");
      setPhoneNumber("");
      loadHistory();
    } catch {
      toast({
        title: "Send failed",
        description: "Could not send warning SMS",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleSendToAll = async () => {
    const msg = message.trim();
    if (!msg) {
      toast({
        title: "Enter message",
        description: "Write or prefill the alert before sending to all users",
        variant: "destructive",
      });
      return;
    }
    setSendingToAll(true);
    try {
      const { sent } = await sendAlertToAll(msg, redTeamAnalysis ? "red_team" : "manual");
      toast({ title: "Broadcast sent", description: `Alert sent via SMS to ${sent} users` });
      setMessage("");
      loadHistory();
    } catch {
      toast({
        title: "Broadcast failed",
        description: "Could not send alert to all users",
        variant: "destructive",
      });
    } finally {
      setSendingToAll(false);
    }
  };

  // ——— User view: alerts received (to my number + broadcasts)
  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Bell className="h-6 w-6 text-orange-600" />
          <h1 className="text-3xl font-bold">Alerts sent to you</h1>
        </div>
        <p className="text-muted-foreground">
          {user?.phoneNumber
            ? `Alerts sent to ${user.phoneNumber} and broadcasts to everyone are shown below.`
            : "When admin sends an alert, you see broadcasts here. Add your phone when registering to also see alerts sent to your number."}
        </p>

        {user?.phoneNumber && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Alerts sent to your number ({user.phoneNumber})
              </CardTitle>
              <CardDescription>Alerts admin sent directly to this phone</CardDescription>
            </CardHeader>
            <CardContent>
              {alertsToMyNumber.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No alerts sent to your number yet.</p>
                </div>
              ) : (
                <ul className="space-y-3 max-h-[300px] overflow-y-auto">
                  {alertsToMyNumber.map((a) => (
                    <li key={a.id} className="p-4 rounded-lg border bg-card">
                      <p className="text-xs text-muted-foreground mb-1">{new Date(a.timestamp).toLocaleString()}</p>
                      <p className="text-sm">{a.message}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Broadcasts to everyone
            </CardTitle>
            <CardDescription>Alerts sent by admin to all users</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingHistory ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : broadcastHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No broadcasts yet.</p>
              </div>
            ) : (
              <ul className="space-y-3 max-h-[400px] overflow-y-auto">
                {broadcastHistory.map((b) => (
                  <li key={b.id} className="p-4 rounded-lg border bg-card">
                    <p className="text-sm text-muted-foreground mb-1">
                      {new Date(b.timestamp).toLocaleString()} · Sent to {b.recipientCount} users
                    </p>
                    <p className="text-sm">{b.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ——— Admin view: receive alert, send to one or send to all users
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Bell className="h-6 w-6 text-orange-600" />
        <h1 className="text-3xl font-bold">Alerts & Warning SMS</h1>
      </div>

      {/* Admin: new alert to broadcast (incoming) */}
      {(redTeamAnalysis || (selectedDistrict && riskScore > 50)) && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle>New alert to broadcast</AlertTitle>
          <AlertDescription>
            {redTeamAnalysis
              ? `${redTeamAnalysis.district} – ${redTeamAnalysis.disasterType}. AI: ${redTeamAnalysis.aiRecommendation}. Use “Use AI Red Team warning” below, then “Send to all users”.`
              : `Risk alert: ${selectedDistrict} – ${disasterType}, score ${riskScore}/100. Compose a message and send to all users.`}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Send warning SMS
            </CardTitle>
            <CardDescription>
              Send to one number or to all users below. Use a template or AI Red Team warning to prefill.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Quick template
              </Label>
              <Select value={selectedTemplateId} onValueChange={applyTemplate}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent>
                  {ALERT_TEMPLATES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {redTeamAnalysis && (
              <Button
                type="button"
                variant="outline"
                className="w-full border-orange-200 text-orange-700 hover:bg-orange-50"
                onClick={useRedTeamWarning}
              >
                <Shield className="h-4 w-4 mr-2" />
                Use AI Red Team warning
              </Button>
            )}
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Enter warning or use AI Red Team warning above"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="mt-1"
              />
            </div>
            <Button
              onClick={handleSendToAll}
              disabled={sendingToAll || !message.trim()}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {sendingToAll ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending to all users...
                </>
              ) : (
                <>
                  <Megaphone className="h-4 w-4 mr-2" />
                  Send to all users via SMS
                </>
              )}
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or send to one number</span>
              </div>
            </div>
            <div>
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                placeholder="+91 9876543210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={sending || !phoneNumber.trim() || !message.trim()}
              variant="outline"
              className="w-full"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send to this number
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Users who receive broadcast ({subscribers.length})
              </CardTitle>
              <CardDescription>Everyone below gets the SMS when you click “Send to all users”</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 max-h-[200px] overflow-y-auto">
                {subscribers.map((s) => (
                  <li key={s.id} className="flex justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                    <span>{s.name}</span>
                    <span className="font-mono text-muted-foreground">{s.phoneNumber}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent alerts sent</CardTitle>
              <CardDescription>History of single and broadcast SMS</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No alerts sent yet.</p>
                </div>
              ) : (
                <ul className="space-y-3 max-h-[280px] overflow-y-auto">
                  {history.map((a) => (
                    <li key={a.id} className="p-3 rounded-lg border bg-card text-card-foreground">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-mono text-sm">{a.phoneNumber}</span>
                        <Badge
                          variant={
                            a.source === "broadcast" ? "default" : a.source === "red_team" ? "secondary" : "outline"
                          }
                        >
                          {a.source === "broadcast" ? "Broadcast" : a.source === "red_team" ? "AI Red Team" : "Manual"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{a.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(a.timestamp).toLocaleString()} · {a.status}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Alerts;
