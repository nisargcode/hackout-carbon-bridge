import { createClient } from "@/lib/supabase/client";
import { createNotification } from "@/lib/notifications";
import type { Mail } from "@/app/(main)/mail/_components/data";

export interface SendMessagePayload {
  senderId?: string | null;
  senderName: string;
  senderEmail: string;
  recipientId?: string | null;
  recipientName: string;
  recipientEmail: string;
  subject: string;
  body: string;
  folder?: "inbox" | "sent" | "drafts" | "archive" | "trash";
  labels?: string[];
  isPriority?: boolean;
}

const LOCAL_MESSAGES_KEY = "cb_user_messages_v1";

export function getSeedMessages(userEmail: string, userName: string): Mail[] {
  const now = Date.now();
  const minutesAgo = (m: number) => new Date(now - m * 60_000).toISOString();
  const hoursAgo = (h: number) => minutesAgo(h * 60);
  const daysAgo = (d: number) => hoursAgo(d * 24);

  return [
    {
      id: "seed-msg-1",
      accountId: 1,
      from: {
        name: "Tata Steel Jamshedpur",
        email: "carbon@tatasteel.com",
      },
      to: [{ name: userName || "Trader", email: userEmail || "trader@carbonbridge.io" }],
      subject: "CO2 Offtake Confirmation & Purity Spec Sheet",
      body: `Dear ${userName || "Partner"},

We have reviewed your recent requisition for high-purity industrial CO2 (99.2% assay). Attached to our platform records is the Vimta Labs analytical certificate for Q3.

Please confirm if your transport logistics carrier is cryo-equipped for terminal pickup at our Jamshedpur loading bay early next week.

Best regards,
Rajiv Verma
Head of Industrial Decarbonization, Tata Steel`,
      receivedAt: minutesAgo(35),
      folder: "inbox",
      isRead: false,
      isPinned: true,
      isPriority: true,
      labels: ["contract", "important", "purity"],
    },
    {
      id: "seed-msg-2",
      accountId: 1,
      from: {
        name: "CryoTrans Logistics",
        email: "dispatch@cryotrans.in",
      },
      to: [{ name: userName || "Trader", email: userEmail || "trader@carbonbridge.io" }],
      subject: "Fleet Allocation Notice: Cryogenic Tankers #CT-402 & #CT-403",
      body: `Hello,

Two dedicated ISO vacuum-insulated cryogenic road tankers (capacity 25 MT each, operating at 20 bar pressure) have been assigned to your corridor.

Real-time telemetry feeds including tank head pressure, temperature (-20?C target), and GPS geofence alerts will be broadcast directly to your Carbon Bridge logistics monitor.

Warm regards,
CryoTrans Operations Team`,
      receivedAt: hoursAgo(2),
      folder: "inbox",
      isRead: true,
      isPinned: false,
      isPriority: false,
      labels: ["logistics", "freight"],
    },
    {
      id: "seed-msg-3",
      accountId: 1,
      from: {
        name: "CleanFuel Synthesis Ltd",
        email: "procurement@cleanfuel.in",
      },
      to: [{ name: userName || "Trader", email: userEmail || "trader@carbonbridge.io" }],
      subject: "Monthly E-Methanol Carbon Feedstock Contract Inquiry",
      body: `Greetings,

Our synthetic fuel synthesis unit in Pune requires a baseline feed of 2,000 MT/month of captured carbon starting next quarter. We are seeking suppliers interested in a 12-month fixed-spread bilateral agreement.

Could we schedule a call to review volume guarantees and dispatch scheduling?

Sincerely,
Dr. Ananya Sen
Chief Procurement Officer, CleanFuel Synthesis`,
      receivedAt: hoursAgo(6),
      folder: "inbox",
      isRead: true,
      isPinned: false,
      isPriority: false,
      labels: ["demand", "synthesis"],
    },
    {
      id: "seed-msg-4",
      accountId: 1,
      from: {
        name: "National Carbon Authority",
        email: "oversight@carbonreg.gov.in",
      },
      to: [{ name: userName || "Trader", email: userEmail || "trader@carbonbridge.io" }],
      subject: "Official Audit Clearance: ISO 14064-2 MRV Verified",
      body: `Regulatory Notice:

Your carbon capture batch verification filing has successfully passed automated digital MRV audit under ISO 14064-2 standards. Sovereign registry tokens have been minted and linked to your company ledger.

Carbon Market Division
Ministry of Environment & Climate Oversight`,
      receivedAt: daysAgo(1),
      folder: "inbox",
      isRead: true,
      isPinned: true,
      isPriority: true,
      labels: ["regulator", "audit", "verified"],
    },
    {
      id: "seed-msg-5",
      accountId: 1,
      from: {
        name: "ABC Cement Works",
        email: "sales@abccement.com",
      },
      to: [{ name: userName || "Trader", email: userEmail || "trader@carbonbridge.io" }],
      subject: "Amine Scrubbed CO2 Supply Batch Available (1,200 MT)",
      body: `Hello team,

We have 1,200 MT of 98.5% pure captured CO2 ready at our Mumbai facility available for spot purchase or multi-week contract allocation. Minimum order volume is 50 MT.

Let us know if you would like to place a bid on the marketplace.

Regards,
Vikram Mehta
ABC Cement Works`,
      receivedAt: daysAgo(2),
      folder: "inbox",
      isRead: true,
      isPinned: false,
      isPriority: false,
      labels: ["supply", "cement"],
    },
  ];
}

export async function fetchTradingPartners(): Promise<
  Array<{ id: string; name: string; email: string; industry: string; type: string }>
> {
  const supabase = createClient();
  const fallback = [
    { id: "11111111-1111-1111-1111-111111111111", name: "ABC Cement Works", email: "sales@abccement.com", industry: "Cement", type: "EMITTER" },
    { id: "22222222-2222-2222-2222-222222222222", name: "Tata Steel Jamshedpur", email: "carbon@tatasteel.com", industry: "Steel", type: "EMITTER" },
    { id: "33333333-3333-3333-3333-333333333333", name: "CleanFuel Synthesis Ltd", email: "procurement@cleanfuel.in", industry: "Synthetic Fuels", type: "CO2_BUYER" },
    { id: "44444444-4444-4444-4444-444444444444", name: "GreenGrow AgriTech", email: "supply@greengrow.org", industry: "Agriculture", type: "CO2_BUYER" },
    { id: "55555555-5555-5555-5555-555555555555", name: "CryoTrans Logistics", email: "dispatch@cryotrans.in", industry: "Cryogenic Freight", type: "LOGISTICS_PROVIDER" },
    { id: "66666666-6666-6666-6666-666666666666", name: "National Carbon Authority", email: "oversight@carbonreg.gov.in", industry: "Regulator", type: "REGULATOR" },
  ];

  try {
    const { data, error } = await supabase
      .from("companies")
      .select("company_id, name, industry, company_type, contact_details");

    if (error || !data || data.length === 0) return fallback;

    return data.map((c) => {
      let email = `${c.name.toLowerCase().replace(/[^a-z0-9]/g, "")}@carbonbridge.io`;
      if (c.contact_details && typeof c.contact_details === "object" && "email" in c.contact_details) {
        email = String(c.contact_details.email);
      }
      return {
        id: c.company_id,
        name: c.name,
        email,
        industry: c.industry || "Industrial",
        type: c.company_type,
      };
    });
  } catch {
    return fallback;
  }
}

export async function fetchUserMessages(userEmail: string, userName: string, companyId?: string): Promise<Mail[]> {
  const supabase = createClient();
  const seed = getSeedMessages(userEmail, userName);

  let localMails: Mail[] = [];
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(LOCAL_MESSAGES_KEY);
      if (stored) localMails = JSON.parse(stored);
    } catch (e) {
      console.warn("Could not read local messages:", e);
    }
  }

  try {
    let query = supabase.from("messages").select("*").order("created_at", { ascending: false });
    if (companyId || userEmail) {
      query = query.or(
        `recipient_id.eq.${companyId || "00000000-0000-0000-0000-000000000000"},recipient_email.eq.${userEmail},sender_email.eq.${userEmail},recipient_email.eq.marketplace@carbonbridge.io`
      );
    }
    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      const remoteMails: Mail[] = data.map((item) => ({
        id: item.message_id,
        accountId: 1,
        from: { name: item.sender_name, email: item.sender_email },
        to: [{ name: item.recipient_name, email: item.recipient_email }],
        subject: item.subject,
        body: item.body,
        receivedAt: item.created_at,
        folder: (item.folder as Mail["folder"]) || "inbox",
        isRead: Boolean(item.is_read),
        isPinned: Boolean(item.is_pinned),
        isPriority: Boolean(item.is_priority),
        labels: Array.isArray(item.labels) ? item.labels : ["trade"],
      }));
      const combined = [...remoteMails];
      for (const m of localMails) {
        if (!combined.some((x) => x.id === m.id)) combined.push(m);
      }
      for (const s of seed) {
        if (!combined.some((x) => x.id === s.id)) combined.push(s);
      }
      return combined;
    }
  } catch (err) {
    console.warn("Supabase messages query error:", err);
  }

  const combined = [...localMails];
  for (const s of seed) {
    if (!combined.some((x) => x.id === s.id)) combined.push(s);
  }
  return combined;
}

export async function sendUserMessage(payload: SendMessagePayload): Promise<Mail> {
  const supabase = createClient();
  const messageId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}`;
  const now = new Date().toISOString();

  const newMail: Mail = {
    id: messageId,
    accountId: 1,
    from: { name: payload.senderName, email: payload.senderEmail },
    to: [{ name: payload.recipientName, email: payload.recipientEmail }],
    subject: payload.subject,
    body: payload.body,
    receivedAt: now,
    folder: payload.folder || "sent",
    isRead: true,
    isPinned: false,
    isPriority: Boolean(payload.isPriority),
    labels: payload.labels || ["trade", "sent"],
  };

  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(LOCAL_MESSAGES_KEY);
      const list: Mail[] = stored ? JSON.parse(stored) : [];
      list.unshift(newMail);
      localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn("Could not save to local messages:", e);
    }
  }

  try {
    await supabase.from("messages").insert({
      message_id: messageId,
      sender_id: payload.senderId || null,
      sender_name: payload.senderName,
      sender_email: payload.senderEmail,
      recipient_id: payload.recipientId || null,
      recipient_name: payload.recipientName,
      recipient_email: payload.recipientEmail,
      subject: payload.subject,
      body: payload.body,
      folder: "inbox",
      is_read: false,
      is_pinned: false,
      is_priority: Boolean(payload.isPriority),
      labels: payload.labels || ["trade"],
      created_at: now,
    });
  } catch (err) {
    console.warn("Supabase message insert error:", err);
  }

  if (payload.recipientId) {
    try {
      await createNotification({
        recipient_id: payload.recipientId,
        sender_id: payload.senderId || undefined,
        title: `New Mail from ${payload.senderName}`,
        message: `${payload.subject}: "${payload.body.slice(0, 80)}..."`,
        type: "BID_RECEIVED",
        reference_type: "trade",
        metadata: { mailId: messageId, senderEmail: payload.senderEmail },
      });
    } catch (notifErr) {
      console.warn("Could not dispatch message notification:", notifErr);
    }
  }

  return newMail;
}

export async function updateMailState(
  mailId: string,
  updates: Partial<Pick<Mail, "isRead" | "isPinned" | "folder">>
) {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(LOCAL_MESSAGES_KEY);
      if (stored) {
        const list: Mail[] = JSON.parse(stored);
        const idx = list.findIndex((m) => m.id === mailId);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...updates };
          localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify(list));
        }
      }
    } catch (e) {
      console.warn("Local update error:", e);
    }
  }

  try {
    const supabase = createClient();
    const dbUpdates: Record<string, unknown> = {};
    if (updates.isRead !== undefined) dbUpdates.is_read = updates.isRead;
    if (updates.isPinned !== undefined) dbUpdates.is_pinned = updates.isPinned;
    if (updates.folder !== undefined) dbUpdates.folder = updates.folder;
    if (Object.keys(dbUpdates).length > 0) {
      await supabase.from("messages").update(dbUpdates).eq("message_id", mailId);
    }
  } catch (e) {
    console.warn("Remote mail state update error:", e);
  }
}
