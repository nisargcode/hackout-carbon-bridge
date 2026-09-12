"use client";

import { useEffect, useState, useRef } from "react";
import { MessageSquare, Send, Building2, User, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { fetchTradingPartners } from "@/lib/messages";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function MessagesPage() {
  const { user, company } = useAuth();
  const [partners, setPartners] = useState<any[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchTradingPartners().then((list) => {
      const filtered = company ? list.filter((p) => p.id !== company.company_id) : list;
      setPartners(filtered);
      setLoading(false);
    });
  }, [company]);

  useEffect(() => {
    if (!selectedPartner || !company) return;

    // Fetch messages for selected partner
    const fetchChat = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${company.company_id},recipient_id.eq.${selectedPartner.id}),and(sender_id.eq.${selectedPartner.id},recipient_id.eq.${company.company_id})`,
        )
        .order("created_at", { ascending: true });

      if (!error && data) {
        setMessages(data);
        setTimeout(() => {
          scrollRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    };

    fetchChat();

    // Realtime subscription for incoming messages
    const channel = supabase
      .channel("chat")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const newMessage = payload.new;
        if (
          (newMessage.sender_id === company.company_id && newMessage.recipient_id === selectedPartner.id) ||
          (newMessage.sender_id === selectedPartner.id && newMessage.recipient_id === company.company_id)
        ) {
          setMessages((prev) => {
            if (prev.some((m) => m.message_id === newMessage.message_id)) return prev;
            return [...prev, newMessage];
          });
          setTimeout(() => {
            scrollRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedPartner, company]); // Removed supabase from deps as it's created on every render, but better to keep it stable.

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedPartner || !company) return;

    setSending(true);
    const text = inputText.trim();
    setInputText("");

    const senderName = company.name;
    const senderEmail = user?.email || "user@carbonbridge.io";

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
        folder: "inbox",
        is_read: false,
      })
      .select()
      .single();

    setSending(false);
    if (error) {
      toast.error("Failed to send message: " + error.message);
      setInputText(text); // Restore text on failure
    } else if (data) {
      setMessages((prev) => {
        if (prev.some((m) => m.message_id === data.message_id)) return prev;
        return [...prev, data];
      });
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading partners...
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-100px)] overflow-hidden rounded-xl border bg-background shadow-sm">
      {/* Sidebar / User List */}
      <div className="w-80 flex-shrink-0 border-r bg-muted/20 flex flex-col">
        <div className="p-4 border-b bg-background">
          <h2 className="font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Messages
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Select a trading partner to chat</p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {partners.map((p) => (
              <button
                key={p.id}
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
                  <div className="text-xs text-muted-foreground truncate">{p.industry}</div>
                </div>
              </button>
            ))}
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
                  <p className="text-xs text-muted-foreground">{selectedPartner.type.replace("_", " ")}</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-primary/5">
                {selectedPartner.industry}
              </Badge>
            </div>

            {/* Chat Messages */}
            <ScrollArea className="flex-1 p-6">
              {messages.length === 0 ? (
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
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
            <p className="text-sm">Select a partner from the sidebar to view your conversation.</p>
          </div>
        )}
      </div>
    </div>
  );
}
