import { createClient } from "@/lib/supabase/client";

export type NotificationType =
  | "BID_RECEIVED"
  | "BID_ACCEPTED"
  | "BID_REJECTED"
  | "BID_COUNTERED"
  | "CONTRACT_CREATED";

export interface AppNotification {
  notification_id: string;
  recipient_id: string;
  sender_id?: string;
  title: string;
  message: string;
  type: NotificationType;
  reference_id?: string;
  reference_type?: string;
  read_status: boolean;
  metadata?: {
    bid_id?: string;
    supply_id?: string;
    amount?: number;
    quantity?: number;
    partner_name?: string;
    industry?: string;
    location?: string;
    notes?: string;
    [key: string]: any;
  };
  created_at: string;
  sender?: {
    name?: string;
    location?: string;
    company_id?: string;
  };
}

const LOCAL_READ_KEY = "cb_read_notifications";

function getLocalReadIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(LOCAL_READ_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveLocalReadId(id: string) {
  if (typeof window === "undefined") return;
  try {
    const ids = getLocalReadIds();
    ids.add(id);
    localStorage.setItem(LOCAL_READ_KEY, JSON.stringify(Array.from(ids)));
  } catch {}
}

export async function createNotification(params: {
  recipient_id: string;
  sender_id?: string;
  title: string;
  message: string;
  type: NotificationType;
  reference_id?: string;
  reference_type?: string;
  metadata?: Record<string, any>;
}) {
  const supabase = createClient();

  // 1. Try writing to Supabase notifications table
  try {
    await supabase.from("notifications").insert({
      recipient_id: params.recipient_id,
      sender_id: params.sender_id || null,
      title: params.title,
      message: params.message,
      type: params.type,
      reference_id: params.reference_id || null,
      reference_type: params.reference_type || "bid",
      metadata: params.metadata || {},
      read_status: false,
    });
  } catch (err) {
    console.warn("Notifications table insert skipped or unavailable:", err);
  }

  // 2. Dispatch event for real-time reactivity in browser
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("carbon_bridge_notification", { detail: params })
    );
  }
}

export async function fetchUserNotifications(companyId: string): Promise<{
  notifications: AppNotification[];
  unreadCount: number;
}> {
  if (!companyId) return { notifications: [], unreadCount: 0 };

  const supabase = createClient();
  const readIds = getLocalReadIds();
  const allNotifications: AppNotification[] = [];

  // A. Attempt to read from dedicated notifications table
  try {
    const { data: dbNotifs, error } = await supabase
      .from("notifications")
      .select("*, sender:companies!sender_id(name, location, company_id)")
      .eq("recipient_id", companyId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && dbNotifs && dbNotifs.length > 0) {
      for (const n of dbNotifs) {
        allNotifications.push({
          ...n,
          read_status: n.read_status || readIds.has(n.notification_id),
        });
      }
    }
  } catch (err) {
    // If table doesn't exist yet, proceed seamlessly to synthesized live bids
  }

  // B. Synthesize live bid and contract events from DB to ensure 100% real-time reliability!
  try {
    // 1. Get company's supplies to identify incoming bids
    const { data: mySupplies } = await supabase
      .from("co2_supplies")
      .select("supply_id, source_industry, location, asking_price")
      .eq("emitter_id", companyId);

    const mySupplyIds = (mySupplies || []).map((s) => s.supply_id);

    // 2. Query incoming bids on my supplies (for emitters/sellers)
    if (mySupplyIds.length > 0) {
      const { data: incomingBids } = await supabase
        .from("bids")
        .select("*, bidder:companies!bidder_id(name, location, company_id)")
        .in("supply_id", mySupplyIds)
        .order("created_at", { ascending: false })
        .limit(20);

      if (incomingBids) {
        for (const bid of incomingBids) {
          const supply = mySupplies?.find((s) => s.supply_id === bid.supply_id);
          const notifId = `bid-incoming-${bid.bid_id}`;
          const isRead = readIds.has(notifId) || bid.status !== "PENDING";
          const partner = bid.bidder?.name || "Industrial Buyer";

          allNotifications.push({
            notification_id: notifId,
            recipient_id: companyId,
            sender_id: bid.bidder_id,
            title:
              bid.status === "PENDING"
                ? `New Purchase Offer: Rs. ${Number(bid.amount).toLocaleString()}/t`
                : bid.status === "ACCEPTED"
                  ? `Offer Accepted: Rs. ${Number(bid.amount).toLocaleString()}/t`
                  : `Offer Declined`,
            message:
              bid.status === "PENDING"
                ? `${partner} placed an offer to buy ${bid.quantity} tons of ${supply?.source_industry || "CO₂"} at Rs. ${Number(bid.amount).toLocaleString()}/ton.`
                : bid.status === "ACCEPTED"
                  ? `You accepted the offer from ${partner} for ${bid.quantity} tons. Contract is active.`
                  : `You declined the offer from ${partner}.`,
            type:
              bid.status === "PENDING"
                ? "BID_RECEIVED"
                : bid.status === "ACCEPTED"
                  ? "BID_ACCEPTED"
                  : "BID_REJECTED",
            reference_id: bid.bid_id,
            reference_type: "bid",
            read_status: isRead,
            metadata: {
              bid_id: bid.bid_id,
              supply_id: bid.supply_id,
              amount: Number(bid.amount),
              quantity: Number(bid.quantity),
              partner_name: partner,
              industry: supply?.source_industry,
              location: bid.bidder?.location || supply?.location,
              notes: bid.notes,
              status: bid.status,
            },
            created_at: bid.created_at,
            sender: bid.bidder,
          });
        }
      }
    }

    // 3. Query outgoing bids placed by me (for buyers)
    const { data: myOutgoingBids } = await supabase
      .from("bids")
      .select("*, supply:co2_supplies!supply_id(supply_id, source_industry, location, emitter:companies!emitter_id(name, location, company_id))")
      .eq("bidder_id", companyId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (myOutgoingBids) {
      for (const bid of myOutgoingBids) {
        const emitterName = bid.supply?.emitter?.name || "CO₂ Supplier";
        const notifId = `bid-outgoing-${bid.bid_id}-${bid.status}`;
        const isRead = readIds.has(notifId);

        if (bid.status === "ACCEPTED") {
          allNotifications.push({
            notification_id: notifId,
            recipient_id: companyId,
            sender_id: bid.supply?.emitter?.company_id,
            title: `Offer Approved! Trade Confirmed`,
            message: `${emitterName} approved your purchase bid of Rs. ${Number(bid.amount).toLocaleString()}/t for ${bid.quantity} tons of CO₂. A binding trade contract has been generated!`,
            type: "BID_ACCEPTED",
            reference_id: bid.bid_id,
            reference_type: "bid",
            read_status: isRead,
            metadata: {
              bid_id: bid.bid_id,
              amount: Number(bid.amount),
              quantity: Number(bid.quantity),
              partner_name: emitterName,
              industry: bid.supply?.source_industry,
              status: "ACCEPTED",
            },
            created_at: bid.updated_at || bid.created_at,
            sender: bid.supply?.emitter,
          });
        } else if (bid.status === "REJECTED") {
          allNotifications.push({
            notification_id: notifId,
            recipient_id: companyId,
            sender_id: bid.supply?.emitter?.company_id,
            title: `Offer Declined`,
            message: `${emitterName} declined your offer of Rs. ${Number(bid.amount).toLocaleString()}/t for ${bid.quantity} tons. You can browse other supplies on the marketplace.`,
            type: "BID_REJECTED",
            reference_id: bid.bid_id,
            reference_type: "bid",
            read_status: isRead,
            metadata: {
              bid_id: bid.bid_id,
              amount: Number(bid.amount),
              quantity: Number(bid.quantity),
              partner_name: emitterName,
              status: "REJECTED",
            },
            created_at: bid.updated_at || bid.created_at,
            sender: bid.supply?.emitter,
          });
        }
      }
    }
  } catch (err) {
    console.error("Error synthesizing live bid notifications:", err);
  }

  // Deduplicate by notification_id or reference_id + type
  const seen = new Set<string>();
  const uniqueList: AppNotification[] = [];
  for (const item of allNotifications) {
    const key = `${item.type}-${item.reference_id || item.notification_id}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueList.push(item);
    }
  }

  // Sort by date descending
  uniqueList.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const unreadCount = uniqueList.filter((n) => !n.read_status).length;
  return { notifications: uniqueList, unreadCount };
}

export function markNotificationAsRead(notificationId: string) {
  saveLocalReadId(notificationId);
  try {
    const supabase = createClient();
    supabase
      .from("notifications")
      .update({ read_status: true })
      .eq("notification_id", notificationId)
      .then(() => {});
  } catch {}
}

export function markAllNotificationsAsRead(companyId: string, notifIds: string[]) {
  for (const id of notifIds) {
    saveLocalReadId(id);
  }
  try {
    const supabase = createClient();
    supabase
      .from("notifications")
      .update({ read_status: true })
      .eq("recipient_id", companyId)
      .then(() => {});
  } catch {}
}
