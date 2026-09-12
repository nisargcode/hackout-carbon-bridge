"use client";

import * as React from "react";
import { toast } from "sonner";
import { Ellipsis, RotateCcw, Search, SlidersHorizontal, Inbox as InboxIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/auth-context";
import { fetchUserMessages } from "@/lib/messages";

import type { Mail } from "./data";
import { MailList } from "./mail-list";
import { useMailStore } from "./use-mail";

interface MailInboxProps {
  mails?: Mail[];
  onSelectMail?: (mail: Mail) => void;
}

const FOLDER_TITLES: Record<string, string> = {
  inbox: "Inbox",
  sent: "Sent Messages",
  drafts: "Drafts",
  archive: "Archive",
  trash: "Trash",
};

export function MailInbox({ onSelectMail }: MailInboxProps) {
  const { user, company } = useAuth();
  const { activeFolder, mails, setMails, searchQuery, setSearchQuery } = useMailStore();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const email = user?.email || "trader@carbonbridge.io";
      const name = company?.name || (user?.user_metadata?.company_name as string) || "Trader";
      const refreshed = await fetchUserMessages(email, name, company?.company_id);
      setMails(refreshed);
      toast.success("Mailbox synchronized");
    } catch (err) {
      console.error("Mailbox sync error:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter mails by current active folder
  const folderMails = React.useMemo(() => {
    return mails.filter((mail) => {
      const mailFolder = mail.folder || "inbox";
      return mailFolder === activeFolder;
    });
  }, [mails, activeFolder]);

  // Apply search query filter
  const filteredMails = React.useMemo(() => {
    if (!searchQuery.trim()) return folderMails;
    const q = searchQuery.toLowerCase();
    return folderMails.filter(
      (m) =>
        m.subject.toLowerCase().includes(q) ||
        m.body.toLowerCase().includes(q) ||
        m.from.name.toLowerCase().includes(q) ||
        m.from.email.toLowerCase().includes(q) ||
        m.labels.some((l) => l.toLowerCase().includes(q)),
    );
  }, [folderMails, searchQuery]);

  const pinnedMails = filteredMails.filter((mail) => mail.isPinned);
  const unpinnedMails = filteredMails.filter((mail) => !mail.isPinned);

  const title = FOLDER_TITLES[activeFolder] || "Inbox";

  const groups = [];
  if (pinnedMails.length > 0) {
    groups.push({
      id: "pinned",
      title: "Pinned",
      items: pinnedMails,
    });
  }
  groups.push({
    id: activeFolder,
    title: activeFolder === "inbox" && pinnedMails.length > 0 ? "Other Messages" : title,
    items: unpinnedMails,
  });

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 pt-3">
      <div className="flex items-center justify-between gap-4 px-2">
        <div className="flex items-center">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 ml-1 h-4 data-vertical:self-center" />
          <h1 className="font-medium text-xl leading-none capitalize">{title}</h1>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label="Refresh mailbox"
          >
            <RotateCcw className={isRefreshing ? "animate-spin size-4" : "size-4"} />
          </Button>
        </div>
      </div>

      <div className="px-2">
        <Separator />
      </div>

      <div className="px-2">
        <InputGroup className="h-7 w-full rounded-md">
          <InputGroupInput
            className="h-7 text-xs"
            placeholder={`Search ${title.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <InputGroupAddon>
            <Search className="size-3.5" />
          </InputGroupAddon>
        </InputGroup>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1.5">
        {filteredMails.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <InboxIcon className="mb-2 size-8 stroke-1 text-muted-foreground/60" />
            <p className="font-medium text-sm">No messages in {title.toLowerCase()}</p>
            <p className="text-xs text-muted-foreground/80 mt-0.5">
              {searchQuery ? "No emails match your query." : "Communications will appear here once received or sent."}
            </p>
          </div>
        ) : (
          <MailList groups={groups} onSelectMail={onSelectMail} />
        )}
      </div>
    </div>
  );
}
