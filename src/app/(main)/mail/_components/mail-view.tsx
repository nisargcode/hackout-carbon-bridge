"use client";

import * as React from "react";
import { cn } from "cn";
import { format } from "date-fns/format";
import {
  Archive,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  EllipsisVertical,
  Forward,
  Loader2,
  MailOpen,
  Paperclip,
  Pin,
  Reply,
  ReplyAll,
  Send,
  Smile,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { SimpleIcon } from "@/components/simple-icon";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/auth-context";
import { sendUserMessage, updateMailState } from "@/lib/messages";

import type { Mail } from "./data";
import { useMail, useMailStore } from "./use-mail";

interface MailDisplayProps {
  mail: Mail | null;
  onClose?: () => void;
}

export function MailView({ mail, onClose }: MailDisplayProps) {
  const [, setMail] = useMail();
  const { mails, updateMail, setIsComposeOpen } = useMailStore();
  const { user, company } = useAuth();

  const [replyText, setReplyText] = React.useState("");
  const [isSendingReply, setIsSendingReply] = React.useState(false);
  const replyInputRef = React.useRef<HTMLInputElement>(null);

  // Find index for Prev/Next navigation
  const currentIndex = mail ? mails.findIndex((m) => m.id === mail.id) : -1;

  function handleClose() {
    setMail({ selected: null });
    onClose?.();
  }

  function handlePrev() {
    if (currentIndex > 0) {
      setMail({ selected: mails[currentIndex - 1].id });
    }
  }

  function handleNext() {
    if (currentIndex >= 0 && currentIndex < mails.length - 1) {
      setMail({ selected: mails[currentIndex + 1].id });
    }
  }

  function handleTogglePin() {
    if (!mail) return;
    const newPinned = !mail.isPinned;
    updateMail(mail.id, { isPinned: newPinned });
    updateMailState(mail.id, { isPinned: newPinned });
    toast.success(newPinned ? "Thread pinned" : "Thread unpinned");
  }

  function handleArchive() {
    if (!mail) return;
    updateMail(mail.id, { folder: "archive" });
    updateMailState(mail.id, { folder: "archive" });
    toast.success("Conversation archived");
  }

  function handleDelete() {
    if (!mail) return;
    updateMail(mail.id, { folder: "trash" });
    updateMailState(mail.id, { folder: "trash" });
    toast.success("Conversation moved to trash");
  }

  function handleToggleRead() {
    if (!mail) return;
    const newRead = !mail.isRead;
    updateMail(mail.id, { isRead: newRead });
    updateMailState(mail.id, { isRead: newRead });
    toast.success(newRead ? "Marked as read" : "Marked as unread");
  }

  async function handleSendReply() {
    if (!mail || !replyText.trim()) return;

    setIsSendingReply(true);
    try {
      const senderName =
        company?.name ||
        (user?.user_metadata?.company_name as string) ||
        (user?.email ? user.email.split("@")[0] : "Carbon Trader");
      const senderEmail =
        user?.email ||
        ((company?.contact_details as Record<string, string>)?.email as string) ||
        "trader@carbonbridge.io";

      const replySubject = mail.subject.startsWith("Re: ") ? mail.subject : `Re: ${mail.subject}`;

      await sendUserMessage({
        senderId: company?.company_id || null,
        senderName,
        senderEmail,
        recipientName: mail.from.name,
        recipientEmail: mail.from.email,
        subject: replySubject,
        body: replyText.trim(),
        folder: "sent",
      });

      // Append reply to the current viewed mail body for interactive threading
      const timestamp = format(new Date(), "MMM d, h:mm a");
      const updatedBody = `${mail.body}\n\n--- Reply by ${senderName} (${timestamp}) ---\n${replyText.trim()}`;
      updateMail(mail.id, { body: updatedBody });

      setReplyText("");
      toast.success(`Reply sent to ${mail.from.name}`);
    } catch (err) {
      console.error("Failed to send reply:", err);
      toast.error("Could not send reply");
    } finally {
      setIsSendingReply(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 px-2 py-3">
      <div className="flex items-center">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Close message" onClick={handleClose}>
                <X />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Close message</TooltipContent>
          </Tooltip>
          <Separator className="h-4 data-vertical:self-center" orientation="vertical" />
          <div className="flex items-center gap-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Previous message"
                  onClick={handlePrev}
                  disabled={currentIndex <= 0}
                >
                  <ChevronLeft />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Previous message</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Next message"
                  onClick={handleNext}
                  disabled={currentIndex < 0 || currentIndex >= mails.length - 1}
                >
                  <ChevronRight />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Next message</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Pin thread"
                onClick={handleTogglePin}
                className={mail?.isPinned ? "text-primary" : ""}
              >
                <Pin className={mail?.isPinned ? "fill-primary" : ""} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{mail?.isPinned ? "Unpin thread" : "Pin thread"}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Archive" onClick={handleArchive}>
                <Archive />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Archive</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Reply"
                onClick={() => {
                  if (mail) {
                    setIsComposeOpen(true, {
                      recipientName: mail.from.name,
                      recipientEmail: mail.from.email,
                      subject: mail.subject.startsWith("Re: ") ? mail.subject : `Re: ${mail.subject}`,
                    });
                  }
                }}
              >
                <Reply />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reply</TooltipContent>
          </Tooltip>

          <Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="More actions">
                  <EllipsisVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => {
                      if (mail) {
                        setIsComposeOpen(true, {
                          recipientName: mail.from.name,
                          recipientEmail: mail.from.email,
                          subject: `Re: ${mail.subject}`,
                        });
                      }
                    }}
                  >
                    <ReplyAll />
                    Reply
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      if (mail) {
                        setIsComposeOpen(true, {
                          subject: `Fwd: ${mail.subject}`,
                        });
                      }
                    }}
                  >
                    <Forward />
                    Forward
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={handleToggleRead}>
                    <MailOpen />
                    {mail?.isRead ? "Mark as unread" : "Mark as read"}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <TooltipContent>More actions</TooltipContent>
          </Tooltip>

          <Separator className="h-4 data-vertical:self-center" orientation="vertical" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Move to trash" onClick={handleDelete}>
                <Trash2 className="text-destructive" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Move to trash</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <Separator />

      <div className="flex min-h-0 flex-1 flex-col">
        {mail ? (
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="space-y-1.5">
              <div className="font-medium leading-none text-base">{mail.subject}</div>

              <div className="text-muted-foreground text-xs leading-none">
                {format(new Date(mail.receivedAt), "EEE, d MMM yyyy, h:mm a")}
              </div>
            </div>

            <Separator />

            <div className="flex gap-2">
              <Avatar className="size-9 after:rounded-sm">
                <AvatarFallback className="rounded-sm bg-primary/10 text-primary font-semibold">
                  {mail.from.name[0]}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm leading-none">{mail.from.name}</div>
                  <div className="text-muted-foreground text-xs leading-none">
                    {format(new Date(mail.receivedAt), "h:mm a")}
                  </div>
                </div>

                <div className="mt-1 flex flex-col gap-0.5">
                  <div className="text-muted-foreground text-xs leading-none">{mail.from.email}</div>
                  <div className="text-muted-foreground text-xs">
                    To:{" "}
                    <span className="text-foreground">
                      {mail.to?.map((r) => r.name).join(", ") || "Me"}
                    </span>
                  </div>

                  {mail.cc?.length ? (
                    <div className="text-muted-foreground text-xs">
                      Cc:{" "}
                      <span className="text-foreground">{mail.cc.map((r) => r.name).join(", ")}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <Separator />

            {mail.attachments?.length ? (
              <>
                <Collapsible defaultOpen>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "group p-0 font-normal text-muted-foreground",
                        "hover:bg-transparent hover:text-muted-foreground dark:hover:bg-transparent",
                        "data-[state=open]:bg-transparent data-[state=open]:text-muted-foreground",
                      )}
                    >
                      Attachments ({mail.attachments.length})
                      <ChevronDown className="group-data-[state=open]:rotate-180" />
                    </Button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="flex flex-wrap gap-2">
                      {mail.attachments.map((attachment) => (
                        <Button size="xs" variant="secondary" key={attachment.id}>
                          <SimpleIcon icon={attachment.icon} className="size-3 fill-current" />
                          <span className="font-normal">{attachment.name}</span>
                          <span className="font-normal text-muted-foreground">{attachment.size}</span>
                        </Button>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Separator className="my-2" />
              </>
            ) : null}

            <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed">
              {mail.body}
            </div>

            {/* Functional Reply Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendReply();
              }}
              className="mt-auto flex flex-col gap-3"
            >
              <Separator />
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <Reply className="size-3.5" />
                </InputGroupAddon>
                <InputGroupInput
                  ref={replyInputRef}
                  className="text-xs"
                  placeholder={`Reply to ${mail.from.name}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  disabled={isSendingReply}
                />
                <InputGroupAddon className="gap-1" align="inline-end">
                  <InputGroupButton
                    type="submit"
                    variant="ghost"
                    disabled={isSendingReply || !replyText.trim()}
                    aria-label="Send reply"
                  >
                    {isSendingReply ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </form>
          </div>
        ) : (
          <div className="grid h-full place-items-center text-muted-foreground text-sm">
            No email selected
          </div>
        )}
      </div>
    </div>
  );
}
