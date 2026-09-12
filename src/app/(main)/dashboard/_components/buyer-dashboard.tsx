import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ShoppingBag, Target, FileText, Award,
  Clock, Bell, Activity, ArrowRight,
  CheckCircle2, AlertCircle, Package, MessageSquare
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, parseISO } from "date-fns";

export function BuyerDashboard() {
  const { company } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    activeDemands: 0,
    demandedVolume: 0,
    executedContracts: 0,
    esgScore: 0,
  });
  
  const [pendingMatches, setPendingMatches] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      if (!company?.company_id) {
        setLoading(false);
        return;
      }
      try {
        const supabase = createClient();

        // 1. Fetch Buyer's demands
        const { data: demandData } = await supabase
          .from("demand_requests")
          .select("*")
          .eq("buyer_id", company.company_id);

        const demands = demandData || [];

        // 2. Fetch Contracts (Buyer)
        const { data: contractData } = await supabase
          .from("contracts")
          .select("*, companies:seller_id(name)")
          .eq("buyer_id", company.company_id)
          .order("created_at", { ascending: false });

        const currentContracts = contractData || [];
        setContracts(currentContracts);

        // 3. Fetch Reputation Score
        const { data: repData } = await supabase
          .from("reputation_scores")
          .select("overall_score")
          .eq("company_id", company.company_id)
          .single();

        // 4. Fetch Pending Bids/Offers on Buyer's demands
        const demandIds = demands.map((d) => d.request_id);
        let matches: any[] = [];
        if (demandIds.length > 0) {
          const { data: bidData } = await supabase
            .from("bids")
            .select("*, companies:bidder_id(name)")
            .in("demand_id", demandIds)
            .eq("status", "PENDING")
            .order("created_at", { ascending: false })
            .limit(5);
          matches = bidData || [];
        }
        setPendingMatches(matches);

        // 5. Fetch Notifications
        const { data: notifData } = await supabase
          .from("notifications")
          .select("*")
          .eq("recipient_id", company.company_id)
          .order("created_at", { ascending: false })
          .limit(5);
        
        setNotifications(notifData || []);

        // Stats calculation
        const activeDemands = demands.filter(d => d.status === "OPEN");
        const demandedVolume = activeDemands.reduce((sum, d) => sum + (parseFloat(d.required_quantity) || 0), 0);
        
        setStats({
          activeDemands: activeDemands.length,
          demandedVolume,
          executedContracts: currentContracts.length,
          esgScore: repData?.overall_score || 0,
        });

        // 6. Build Timeline
        let events: any[] = [];
        
        demands.forEach(d => {
          events.push({
            id: d.request_id,
            date: d.created_at,
            title: `Requested ${d.required_quantity}t CO2`,
            desc: `Application: ${d.application}`,
            type: "demand",
            icon: Target,
            link: "/dashboard/demands",
          });
        });

        currentContracts.forEach(c => {
          events.push({
            id: c.contract_id,
            date: c.created_at,
            title: `Procured ${c.quantity}t CO2`,
            desc: `Contract with ${c.companies?.name || "Supplier"}`,
            type: "contract",
            icon: CheckCircle2,
            link: "/dashboard/contracts",
          });
        });

        matches.forEach(b => {
          events.push({
            id: b.bid_id,
            date: b.created_at,
            title: `Received offer for ${b.quantity}t`,
            desc: `From ${b.companies?.name || "Supplier"}`,
            type: "offer",
            icon: MessageSquare,
            link: "/dashboard/bids",
          });
        });

        // Sort descending
        events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTimeline(events);

      } catch (err) {
        console.error("Failed to load buyer stats:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [company?.company_id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const topMetrics = [
    { label: "Active Demands", value: stats.activeDemands, icon: ShoppingBag },
    { label: "Demanded Volume", value: `${stats.demandedVolume.toLocaleString()} MT`, icon: Target },
    { label: "Executed Contracts", value: stats.executedContracts, icon: FileText },
    { label: "ESG Reputed Score", value: `${stats.esgScore}/100`, icon: Award },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl text-foreground">Personal Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of your CO2 requisitions and supplier contracts.</p>
      </div>

      {/* TOP: METRICS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {topMetrics.map((m) => {
          const Icon = m.icon;
          return (
            <Card key={m.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{m.label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">{m.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* MIDDLE: PENDING MATCHES & NOTIFICATIONS */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending Offers</CardTitle>
            <CardDescription>Supplier bids awaiting your review</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingMatches.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No pending offers.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingMatches.map(match => (
                  <div key={match.bid_id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-sm">{match.companies?.name || "Supplier"}</p>
                      <p className="text-xs text-muted-foreground">{match.quantity} tons @ ₹{match.amount}/ton</p>
                    </div>
                    <Button size="sm" asChild variant="outline">
                      <Link href="/dashboard/bids">Review</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Notifications</CardTitle>
            <CardDescription>System alerts and updates</CardDescription>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">You are all caught up.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map(notif => (
                  <div key={notif.notification_id} className="flex items-start gap-3 border-b pb-3 last:border-0 last:pb-0">
                    <AlertCircle className="h-4 w-4 mt-0.5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">{notif.title}</p>
                      <p className="text-xs text-muted-foreground">{notif.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* BOTTOM: TRANSACTION HISTORY & TIMELINE */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex flex-col h-[400px]">
          <CardHeader>
            <CardTitle className="text-lg">Transaction History</CardTitle>
            <CardDescription>Your recently executed contracts</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full px-6 pb-6">
              {contracts.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No transaction history yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {contracts.map(c => (
                    <div key={c.contract_id} className="flex flex-col gap-1 border border-border p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-sm">{c.companies?.name || "Supplier"}</span>
                        <span className="text-xs text-muted-foreground">{format(parseISO(c.created_at), "MMM d, yyyy")}</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm">{c.quantity} tons</span>
                        <span className="text-sm font-medium text-emerald-600">₹{c.total_value?.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="flex flex-col h-[400px]">
          <CardHeader>
            <CardTitle className="text-lg">Interactive Timeline</CardTitle>
            <CardDescription>Your recent marketplace actions</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full px-6 pb-6">
              {timeline.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent activity.</p>
                </div>
              ) : (
                <div className="relative border-l border-border ml-3 mt-2 space-y-6 pb-4">
                  {timeline.map((event, idx) => {
                    const Icon = event.icon;
                    return (
                      <Link href={event.link} key={idx} className="block relative pl-6 hover:bg-muted/50 rounded-r-lg transition-colors p-2 -ml-2 -mt-2 group">
                        <div className="absolute w-6 h-6 bg-background border border-border rounded-full -left-[14px] top-2 flex items-center justify-center group-hover:border-primary transition-colors">
                          <Icon className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <p className="text-xs text-muted-foreground mb-0.5">{format(parseISO(event.date), "MMM d, yyyy")}</p>
                        <p className="text-sm font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{event.desc}</p>
                      </Link>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
