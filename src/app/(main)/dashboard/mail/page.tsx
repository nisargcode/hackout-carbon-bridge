"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { MessageSquare, Send, Loader2, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Partner {
  id: string;
  name: string;
  email: string;
  industry: string;
  type: string;
}

export default function MessagesPage() {
  const { user, company } = useAuth();
  const supabase = createClient();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load all registered users from the companies table
  useEffect(() => {
    const loadPartners = async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("company_id, name, industry, company_type, contact_details")
        .order("name");

      if (error) {
        console.error("Failed to load partners:", error);
        toast.error("Failed to load users: " + error.message);
        setLoadingPartners(false);
        return;
      }

      const list: Partner[] = (data || [])
        .filter((c) => c.company_id !== company?.company_id) // exclude self
        .map((c) => {
          let email = "";
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

      setPartners(list);
      setLoadingPartners(false);
    };

    if (company) {
      loadPartners();
    }
  }, [company]);

  // Fetch chat messages for selected conversation
  const fetchMessages = useCallback(async () => {
    if (!selectedPartner || !company) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        [
          `and(sender_id.eq.${company.company_id},recipient_id.eq.${selectedPartner.id})`,
          `and(sender_id.eq.${selectedPartner.id},recipient_id.eq.${company.company_id})`,
        ].join(","),
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to fetch messages:", error);
      return;
    }

    if (data) {
      setMessages((prev) => {
        // Only update if data actually changed (prevents unnecessary re-renders)
        if (prev.length !== data.length || JSON.stringify(prev.map((m) => m.message_id)) !== JSON.stringify(data.map((m: any) => m.message_id))) {
          return data;
        }
        return prev;
      });
    }
  }, [selectedPartner, company]);

  // When partner is selected, fetch messages and start polling
  useEffect(() => {
    if (!selectedPartner || !company) return;

    setMessages([]);
    setLoadingChat(true);

    fetchMessages().then(() => {
      setLoadingChat(false);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 150);
    });

    // Poll every 3 seconds for new messages (works reliably without Supabase Realtime config)
    pollingRef.current = setInterval(() => {
      fetchMessages().then(() => {
        // Auto-scroll only if user is near the bottom
        if (scrollRef.current) {
          const parent = scrollRef.current.parentElement;
          if (parent) {
            const isNearBottom = parent.scrollHeight - parent.scrollTop - parent.clientHeight < 150;
            if (isNearBottom) {
              scrollRef.current.scrollIntoView({ behavior: "smooth" });
            }
          }
        }
      });
    }, 3000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [selectedPartner, company, fetchMessages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedPartner || !company) return;

    setSending(true);
    const text = inputText.trim();
    setInputText("");

    const senderName = company.name;
    const senderEmail = user?.email || "user@carbonbridge.io";

    // Insert a single message row — the receiver will see it on their next poll
    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: company.company_id,
        sender_name: senderName,
        sender_email: senderEmail,
        recipient_id: selectedPartner.id,
        recipient_name: selectedPartner.name,
        recipient_email: selectedPartner.email,
        subject: "Direct Message",
        body: text,
        folder: "chat",
        is_read: false,
      })
      .select()
      .single();

    setSending(false);

    if (error) {
      toast.error("Failed to send: " + error.message);
      setInputText(text); // Restore on failure
      return;
    }

    if (data) {
      // Optimistically add to local state
      setMessages((prev) => {
        if (prev.some((m) => m.message_id === data.message_id)) return prev;
        return [...prev, data];
      });
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  const filteredPartners = searchQuery
    ? partners.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.industry.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : partners;

  if (!company) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-2 text-muted-foreground">
        <MessageSquare className="h-10 w-10 opacity-30" />
        <p className="text-sm">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-100px)] overflow-hidden rounded-xl border bg-background shadow-sm">
      {/* Sidebar — User List */}
      <div className="w-80 flex-shrink-0 border-r bg-muted/20 flex flex-col">
        <div className="p-4 border-b bg-background space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Messages
          </h2>
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {loadingPartners ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-2 w-1/2" />
                  </div>
                </div>
              ))
            ) : filteredPartners.length === 0 ? (
              <p className="p-4 text-xs text-muted-foreground text-center">No users found.</p>
            ) : (
              filteredPartners.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPartner(p)}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${
                    selectedPartner?.id === p.id
                      ? "bg-primary/10 border-primary/20 border"
                      : "hover:bg-muted/50 border border-transparent"
                  }`}
                >
                  <Avatar className="h-10 w-10 border bg-background">
                    <AvatarFallback className="bg-primary/5 text-primary">{p.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="overflow-hidden flex-1">
                    <div className="font-medium text-sm truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {p.type.replace(/_/g, " ")} · {p.industry}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-background/50 relative">
        {selectedPartner ? (
          <>
            {/* Chat Header */}
            <div className="h-16 flex items-center px-6 border-b bg-background/95 backdrop-blur shrink-0 justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border">
                  <AvatarFallback>{selectedPartner.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-sm">{selectedPartner.name}</h3>
                  <p className="text-xs text-muted-foreground">{selectedPartner.type.replace(/_/g, " ")}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/5">
                  {selectedPartner.industry}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    fetchMessages();
                    toast.info("Messages refreshed");
                  }}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Chat Messages */}
            <ScrollArea className="flex-1 p-6">
              {loadingChat ? (
                <div className="flex items-center justify-center mt-20 text-muted-foreground text-sm">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading conversation...
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-3 mt-20">
                  <MessageSquare className="h-10 w-10 opacity-20" />
                  <p className="text-sm">No messages yet. Send a message to start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-4 pb-4">
                  {messages.map((msg, i) => {
                    const isMe = msg.sender_id === company?.company_id;
                    const showAvatar = i === 0 || messages[i - 1].sender_id !== msg.sender_id;

                    return (
                      <div
                        key={msg.message_id}
                        className={`flex gap-3 max-w-[80%] ${isMe ? "ml-auto flex-row-reverse" : ""}`}
                      >
                        <div className={`shrink-0 w-8 flex flex-col items-center ${isMe ? "items-end" : ""}`}>
                          {showAvatar ? (
                            <Avatar className="h-8 w-8 border bg-background mt-1">
                              <AvatarFallback className="text-xs">
                                {isMe ? company?.name[0] : selectedPartner.name[0]}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="h-8 w-8" />
                          )}
                        </div>
                        <div className={`flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}>
                          {showAvatar && (
                            <span className="text-[10px] text-muted-foreground px-1">
                              {isMe ? "You" : msg.sender_name} ·{" "}
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                          <div
                            className={`px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                              isMe
                                ? "bg-primary text-primary-foreground rounded-tr-sm"
                                : "bg-muted text-foreground border rounded-tl-sm"
                            }`}
                          >
                            {msg.body}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={scrollRef} />
                </div>
              )}
            </ScrollArea>

            {/* Chat Input */}
            <div className="p-4 bg-background border-t">
              <form
                onSubmit={handleSend}
                className="flex items-end gap-2 bg-muted/30 p-1 pl-3 rounded-xl border focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all"
              >
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Message ${selectedPartner.name}...`}
                  className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 shadow-none"
                  autoComplete="off"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!inputText.trim() || sending}
                  className="rounded-lg h-9 w-9 shrink-0 mb-0.5"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-60">
            <MessageSquare className="h-16 w-16 mb-4 stroke-1" />
            <h3 className="text-lg font-medium text-foreground">Your Messages</h3>
            <p className="text-sm">Select a user from the sidebar to view your conversation.</p>
          </div>
        )}
      </div>
    </div>
  );
}
