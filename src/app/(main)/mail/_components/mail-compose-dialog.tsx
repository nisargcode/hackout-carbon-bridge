"use client";

import * as React from "react";
import { toast } from "sonner";
import { Building2, Loader2, Mail, Send, Sparkles, User } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { fetchTradingPartners, sendUserMessage } from "@/lib/messages";
import { useMailStore } from "./use-mail";

const SUBJECT_TEMPLATES = [
  "CO2 Supply Allocation Requisition",
  "Purity & ISO 14064 Assay Spec Sheet",
  "Cryogenic Tanker Fleet Transport Quote",
  "Bilateral Long-term Offtake Agreement",
  "Registry Certificate Verification Inquiry",
];

export function MailComposeDialog() {
  const { user, company } = useAuth();
  const { isComposeOpen, setIsComposeOpen, composeDefault, addMail } = useMailStore();

  const [partners, setPartners] = React.useState<
    Array<{ id: string; name: string; email: string; industry: string; type: string }>
  >([]);
  const [recipientType, setRecipientType] = React.useState<"partner" | "custom">("partner");
  const [selectedPartnerId, setSelectedPartnerId] = React.useState<string>("");
  const [customEmail, setCustomEmail] = React.useState<string>("");
  const [customName, setCustomName] = React.useState<string>("");
  const [subject, setSubject] = React.useState<string>("");
  const [body, setBody] = React.useState<string>("");
  const [isSending, setIsSending] = React.useState<boolean>(false);

  // Load trading partners
  React.useEffect(() => {
    fetchTradingPartners().then((list) => {
      // Exclude current company
      const filtered = company
        ? list.filter((p) => p.id !== company.company_id && p.email !== user?.email)
        : list;
      setPartners(filtered);
      if (filtered.length > 0 && !selectedPartnerId) {
        setSelectedPartnerId(filtered[0].id);
      }
    });
  }, [company, user?.email]);

  // Handle compose defaults when opening with prefilled values
  React.useEffect(() => {
    if (composeDefault) {
      if (composeDefault.recipientId) {
        setSelectedPartnerId(composeDefault.recipientId);
        setRecipientType("partner");
      } else if (composeDefault.recipientEmail) {
        setRecipientType("custom");
        setCustomEmail(composeDefault.recipientEmail);
        setCustomName(composeDefault.recipientName || composeDefault.recipientEmail);
      }
      if (composeDefault.subject) {
        setSubject(composeDefault.subject);
      }
    }
  }, [composeDefault]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    let targetName = "";
    let targetEmail = "";
    let targetId: string | null = null;

    if (recipientType === "partner") {
      const p = partners.find((item) => item.id === selectedPartnerId);
      if (!p) {
        toast.error("Please select a recipient company");
        return;
      }
      targetName = p.name;
      targetEmail = p.email;
      targetId = p.id;
    } else {
      if (!customEmail.trim()) {
        toast.error("Please enter recipient email");
        return;
      }
      targetEmail = customEmail.trim();
      targetName = customName.trim() || targetEmail.split("@")[0];
    }

    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }

    if (!body.trim()) {
      toast.error("Please enter message content");
      return;
    }

    setIsSending(true);
    try {
      const senderName =
        company?.name ||
        (user?.user_metadata?.company_name as string) ||
        (user?.email ? user.email.split("@")[0] : "Carbon Trader");
      const senderEmail =
        user?.email ||
        ((company?.contact_details as Record<string, string>)?.email as string) ||
        "trader@carbonbridge.io";

      const sentMail = await sendUserMessage({
        senderId: company?.company_id || null,
        senderName,
        senderEmail,
        recipientId: targetId,
        recipientName: targetName,
        recipientEmail: targetEmail,
        subject,
        body,
        folder: "sent",
        isPriority: true,
      });

      addMail(sentMail);
      toast.success(`Mail sent to ${targetName}!`, {
        description: `Subject: "${subject}"`,
      });

      // Reset
      setSubject("");
      setBody("");
      setCustomEmail("");
      setCustomName("");
      setIsComposeOpen(false);
    } catch (err) {
      console.error("Error sending mail:", err);
      toast.error("Failed to send mail. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const currentSender =
    company?.name ||
    (user?.user_metadata?.company_name as string) ||
    (user?.email ? user.email.split("@")[0] : "Current Trader");

  return (
    <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
      <DialogContent className="max-w-2xl sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Mail className="size-4" />
            </div>
            <div>
              <DialogTitle>Compose Industrial Mail</DialogTitle>
              <DialogDescription>
                Send direct encrypted trade communications, inquiries, and contracts to platform counterparties.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSend} className="space-y-4 pt-1">
          {/* Sender row */}
          <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="size-3.5" />
              <span>From:</span>
              <span className="font-medium text-foreground">{currentSender}</span>
              <span className="text-muted-foreground">({user?.email || "trader@carbonbridge.io"})</span>
            </div>
            {company?.company_type && (
              <Badge variant="outline" className="text-[10px] font-mono uppercase">
                {company.company_type}
              </Badge>
            )}
          </div>

          {/* Recipient Mode Tabs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium">Recipient</label>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="xs"
                  variant={recipientType === "partner" ? "secondary" : "ghost"}
                  onClick={() => setRecipientType("partner")}
                  className="h-6 text-[11px]"
                >
                  <Building2 className="mr-1 size-3" />
                  Registered Company
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant={recipientType === "custom" ? "secondary" : "ghost"}
                  onClick={() => setRecipientType("custom")}
                  className="h-6 text-[11px]"
                >
                  <User className="mr-1 size-3" />
                  Custom Email
                </Button>
              </div>
            </div>

            {recipientType === "partner" ? (
              <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a registered trading partner..." />
                </SelectTrigger>
                <SelectContent>
                  {partners.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center justify-between gap-3 w-full">
                        <span className="font-medium">{p.name}</span>
                        <span className="text-muted-foreground text-xs">
                          ({p.type} ? {p.industry})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Recipient Name or Company"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="text-xs"
                />
                <Input
                  type="email"
                  placeholder="partner@domain.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>
            )}
          </div>

          {/* Subject field */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Subject</label>
            <Input
              placeholder="e.g. CO2 Supply Requisition - 500 MT Liquid"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="text-xs"
              required
            />
            {/* Subject Template Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Sparkles className="size-3 text-primary" /> Suggestions:
              </span>
              {SUBJECT_TEMPLATES.map((tmpl) => (
                <button
                  type="button"
                  key={tmpl}
                  onClick={() => setSubject(tmpl)}
                  className="rounded-full border bg-background px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted hover:text-foreground"
                >
                  {tmpl}
                </button>
              ))}
            </div>
          </div>

          {/* Body field */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Message Content</label>
            <Textarea
              placeholder="State your specifications, volume requirements (MT), delivery schedule, pressure/temperature requirements, or contract pricing offer..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={7}
              className="resize-none text-xs font-sans leading-relaxed"
              required
            />
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between pt-2 border-t">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsComposeOpen(false)}
              disabled={isSending}
            >
              Discard
            </Button>
            <Button type="submit" size="sm" disabled={isSending}>
              {isSending ? (
                <>
                  <Loader2 className="mr-2 size-3.5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 size-3.5" />
                  Send Message
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
