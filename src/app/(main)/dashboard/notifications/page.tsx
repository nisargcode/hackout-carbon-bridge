"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  X,
  Gavel,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  ArrowRight,
  RefreshCw,
  Eye,
  DollarSign,
  PackageCheck,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import {
  fetchUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createNotification,
  type AppNotification,
} from "@/lib/notifications";

export default function NotificationsPage() {
  const { company } = useAuth();
  const supabase = createClient();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadNotifications = async (showToast = false) => {
    if (!company?.company_id) {
      setLoading(false);
      return;
    }
    setRefreshing(true);
    try {
      const res = await fetchUserNotifications(company.company_id);
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
      if (showToast) {
        toast.success("Notifications refreshed");
      }
    } catch (err: any) {
      console.error("Error loading notifications:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    // Re-fetch on custom notification event or periodic check
    const onNotif = () => loadNotifications();
    window.addEventListener("carbon_bridge_notification", onNotif);
    const interval = setInterval(() => loadNotifications(), 10000);

    return () => {
      window.removeEventListener("carbon_bridge_notification", onNotif);
      clearInterval(interval);
    };
  }, [company?.company_id]);

  // Handle Accept Bid
  const handleAcceptBid = async (notif: AppNotification) => {
    const bidId = notif.metadata?.bid_id || notif.reference_id;
    if (!bidId || !company?.company_id) return;

    setActionLoadingId(notif.notification_id);
    try {
      // 1. Update bid status in database
      const { error: bidErr } = await supabase
        .from("bids")
        .update({ status: "ACCEPTED", updated_at: new Date().toISOString() })
        .eq("bid_id", bidId);

      if (bidErr) {
        toast.error(`Failed to accept bid: ${bidErr.message}`);
        setActionLoadingId(null);
        return;
      }

      // 2. Automatically create contract
      const quantity = Number(notif.metadata?.quantity || 100);
      const unitPrice = Number(notif.metadata?.amount || 4000);
      const supplyId = notif.metadata?.supply_id;

      if (supplyId && notif.sender_id) {
        await supabase.from("contracts").insert({
          supply_id: supplyId,
          buyer_id: notif.sender_id,
          seller_id: company.company_id,
          quantity: quantity,
          unit_price: unitPrice,
          total_value: quantity * unitPrice,
          contract_type: "SPOT",
          start_date: new Date().toISOString().split("T")[0],
          end_date: new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0],
          status: "ACTIVE",
        });
      }

      // 3. Notify the buyer of approval
      if (notif.sender_id) {
        await createNotification({
          recipient_id: notif.sender_id,
          sender_id: company.company_id,
          title: "Bid Approved! Contract Created",
          message: `${company.name || "Seller"} approved your offer of Rs. ${unitPrice.toLocaleString()}/t for ${quantity} tons of CO₂. A binding trade contract has been generated!`,
          type: "BID_ACCEPTED",
          reference_id: bidId,
          reference_type: "bid",
          metadata: {
            bid_id: bidId,
            supply_id: supplyId,
            amount: unitPrice,
            quantity: quantity,
            partner_name: company.name,
            status: "ACCEPTED",
          },
        });
      }

      // 4. Mark notification read & refresh
      markNotificationAsRead(notif.notification_id);
      toast.success("Bid accepted! Contract generated and buyer notified.");
      await loadNotifications();
    } catch (err: any) {
      toast.error(err.message || "Could not complete acceptance");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Decline Bid
  const handleDeclineBid = async (notif: AppNotification) => {
    const bidId = notif.metadata?.bid_id || notif.reference_id;
    if (!bidId || !company?.company_id) return;

    setActionLoadingId(notif.notification_id);
    try {
      // 1. Update bid status in database
      const { error: bidErr } = await supabase
        .from("bids")
        .update({ status: "REJECTED", updated_at: new Date().toISOString() })
        .eq("bid_id", bidId);

      if (bidErr) {
        toast.error(`Failed to decline bid: ${bidErr.message}`);
        setActionLoadingId(null);
        return;
      }

      // 2. Notify the buyer of rejection
      if (notif.sender_id) {
        await createNotification({
          recipient_id: notif.sender_id,
          sender_id: company.company_id,
          title: "Bid Declined",
          message: `${company.name || "Seller"} has declined your offer of Rs. ${Number(notif.metadata?.amount || 0).toLocaleString()}/t for ${notif.metadata?.quantity || 0} tons.`,
          type: "BID_REJECTED",
          reference_id: bidId,
          reference_type: "bid",
          metadata: {
            bid_id: bidId,
            amount: notif.metadata?.amount,
            quantity: notif.metadata?.quantity,
            partner_name: company.name,
            status: "REJECTED",
          },
        });
      }

      // 3. Mark notification read & refresh
      markNotificationAsRead(notif.notification_id);
      toast.info("Bid declined and buyer notified.");
      await loadNotifications();
    } catch (err: any) {
      toast.error(err.message || "Could not complete decline");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Mark all as read
  const handleMarkAllRead = () => {
    if (!company?.company_id) return;
    markAllNotificationsAsRead(
      company.company_id,
      notifications.map((n) => n.notification_id),
    );
    setNotifications((prev) => prev.map((n) => ({ ...n, read_status: true })));
    setUnreadCount(0);
    toast.success("All notifications marked as read");
  };

  // Toggle single read
  const handleToggleRead = (id: string) => {
    markNotificationAsRead(id);
    setNotifications((prev) => prev.map((n) => (n.notification_id === id ? { ...n, read_status: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  // Metric counts
  const pendingActionsCount = notifications.filter(
    (n) => n.type === "BID_RECEIVED" && n.metadata?.status === "PENDING",
  ).length;

  const acceptedDealsCount = notifications.filter((n) => n.type === "BID_ACCEPTED").length;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const renderNotificationCard = (n: AppNotification) => {
    const isPendingAction = n.type === "BID_RECEIVED" && n.metadata?.status === "PENDING";
    const partnerName = n.metadata?.partner_name || n.sender?.name || "Marketplace Partner";
    const amount = n.metadata?.amount;
    const quantity = n.metadata?.quantity;
    const total = amount && quantity ? amount * quantity : null;
    const isActing = actionLoadingId === n.notification_id;

    return (
      <Card
        key={n.notification_id}
        className={`transition-all border ${
          !n.read_status ? "border-primary/40 bg-primary/2 dark:bg-primary/5 shadow-xs" : "hover:border-border"
        }`}
      >
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            {/* Left Column: Icon + Text */}
            <div className="flex items-start gap-3.5 flex-1">
              <div
                className={`mt-0.5 p-2.5 rounded-xl shrink-0 ${
                  n.type === "BID_RECEIVED"
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : n.type === "BID_ACCEPTED"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : n.type === "BID_REJECTED"
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                }`}
              >
                {n.type === "BID_RECEIVED" ? (
                  <Gavel className="h-5 w-5" />
                ) : n.type === "BID_ACCEPTED" ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : n.type === "BID_REJECTED" ? (
                  <XCircle className="h-5 w-5" />
                ) : (
                  <FileText className="h-5 w-5" />
                )}
              </div>

              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-base text-foreground">{n.title}</span>
                  {!n.read_status && (
                    <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 text-[10px] px-1.5 py-0 h-4">
                      NEW
                    </Badge>
                  )}
                  {isPendingAction && (
                    <Badge
                      variant="outline"
                      className="border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/10 text-[11px]"
                    >
                      Action Required
                    </Badge>
                  )}
                  {n.type === "BID_ACCEPTED" && (
                    <Badge
                      variant="outline"
                      className="border-emerald-500 text-emerald-600 bg-emerald-500/10 text-[11px]"
                    >
                      Deal Confirmed
                    </Badge>
                  )}
                  {n.type === "BID_REJECTED" && (
                    <Badge variant="outline" className="text-muted-foreground text-[11px]">
                      Declined
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-foreground/90">{n.message}</p>

                {/* Details Pill */}
                {(amount || quantity || total) && (
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
                    {quantity && (
                      <span className="bg-muted/40 px-2 py-0.5 rounded-md">
                        Volume: <strong className="text-foreground">{quantity} tons</strong>
                      </span>
                    )}
                    {amount && (
                      <span className="bg-muted/40 px-2 py-0.5 rounded-md">
                        Unit Price: <strong className="text-foreground">Rs. {amount.toLocaleString()}/t</strong>
                      </span>
                    )}
                    {total && (
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md font-medium">
                        Total Value: Rs. {total.toLocaleString()}
                      </span>
                    )}
                  </div>
                )}

                {n.metadata?.notes && (
                  <p className="text-xs text-muted-foreground italic pt-0.5">"{n.metadata.notes}"</p>
                )}

                <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {partnerName}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Actions */}
            <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0">
              {isPendingAction ? (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                    onClick={() => handleAcceptBid(n)}
                    disabled={isActing}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Accept Bid
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 gap-1"
                    onClick={() => handleDeclineBid(n)}
                    disabled={isActing}
                  >
                    <X className="h-3.5 w-3.5" />
                    Decline
                  </Button>
                </div>
              ) : n.type === "BID_ACCEPTED" ? (
                <Button size="sm" variant="outline" asChild className="gap-1.5">
                  <Link href="/dashboard/contracts">
                    <PackageCheck className="h-3.5 w-3.5 text-emerald-600" />
                    View Contract
                  </Link>
                </Button>
              ) : (
                <Button size="sm" variant="ghost" asChild className="gap-1 text-xs">
                  <Link href="/dashboard/bids">
                    View Bids
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              )}

              {!n.read_status && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => handleToggleRead(n.notification_id)}
                >
                  Mark read
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-bold text-2xl text-foreground flex items-center gap-2.5">
            <Bell className="h-6 w-6 text-primary" />
            Notifications & Trade Activity
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time updates on incoming purchase offers, bid approvals, and executed contracts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadNotifications(true)}
            disabled={refreshing}
            className="gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button size="sm" variant="secondary" onClick={handleMarkAllRead}>
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{notifications.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Unread Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`font-bold text-2xl ${unreadCount > 0 ? "text-emerald-600" : "text-muted-foreground"}`}>
              {unreadCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Action Required</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`font-bold text-2xl ${pendingActionsCount > 0 ? "text-amber-500" : "text-muted-foreground"}`}
            >
              {pendingActionsCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Confirmed Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-primary">{acceptedDealsCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 sm:w-auto sm:inline-flex">
          <TabsTrigger value="all" className="gap-1.5">
            All
            <span className="text-xs text-muted-foreground">({notifications.length})</span>
          </TabsTrigger>
          <TabsTrigger value="action" className="gap-1.5">
            Pending Action
            {pendingActionsCount > 0 && (
              <Badge className="bg-amber-500 text-white h-4 px-1 text-[10px]">{pendingActionsCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="bids" className="gap-1.5">
            Bids & Offers
          </TabsTrigger>
          <TabsTrigger value="deals" className="gap-1.5">
            Confirmed Deals
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: All */}
        <TabsContent value="all" className="space-y-3">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground space-y-3">
                <Bell className="h-10 w-10 mx-auto stroke-1 text-muted-foreground/60" />
                <div className="space-y-1">
                  <p className="font-semibold text-foreground text-base">No Notifications Yet</p>
                  <p className="text-sm">
                    When buyers submit bids on your supply, or when sellers accept your offers, real-time trade
                    notifications will appear here.
                  </p>
                </div>
                <div className="pt-2">
                  <Button variant="outline" asChild>
                    <Link href="/dashboard/marketplace">Browse Marketplace</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            notifications.map(renderNotificationCard)
          )}
        </TabsContent>

        {/* Tab 2: Action Required */}
        <TabsContent value="action" className="space-y-3">
          {notifications.filter((n) => n.type === "BID_RECEIVED" && n.metadata?.status === "PENDING").length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <CheckCircle2 className="h-9 w-9 mx-auto mb-2 text-emerald-600 stroke-1" />
                <p className="font-medium text-foreground">You are all caught up!</p>
                <p className="text-sm mt-1">No pending offers currently require your review.</p>
              </CardContent>
            </Card>
          ) : (
            notifications
              .filter((n) => n.type === "BID_RECEIVED" && n.metadata?.status === "PENDING")
              .map(renderNotificationCard)
          )}
        </TabsContent>

        {/* Tab 3: Bids & Offers */}
        <TabsContent value="bids" className="space-y-3">
          {notifications.filter((n) => n.type.startsWith("BID")).length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <p className="font-medium text-foreground">No bid activity found.</p>
              </CardContent>
            </Card>
          ) : (
            notifications.filter((n) => n.type.startsWith("BID")).map(renderNotificationCard)
          )}
        </TabsContent>

        {/* Tab 4: Confirmed Deals */}
        <TabsContent value="deals" className="space-y-3">
          {notifications.filter((n) => n.type === "BID_ACCEPTED" || n.type === "CONTRACT_CREATED").length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <p className="font-medium text-foreground">No confirmed deals yet.</p>
              </CardContent>
            </Card>
          ) : (
            notifications
              .filter((n) => n.type === "BID_ACCEPTED" || n.type === "CONTRACT_CREATED")
              .map(renderNotificationCard)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
