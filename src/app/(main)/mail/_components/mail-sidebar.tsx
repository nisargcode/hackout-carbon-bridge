"use client";

import * as React from "react";
import { cn } from "cn";
import { Check, EllipsisVertical, LogOut, PenLine, Settings2, UserPlus, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { getInitials } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

import { accounts as defaultAccounts, type MailNavItem, mailNavigation } from "./data";
import { useMailStore, type MailFolder } from "./use-mail";
import { MailComposeDialog } from "./mail-compose-dialog";

type Account = {
  id: number;
  label: string;
  email: string;
};

export function MailSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { user, company, signOut } = useAuth();
  const { activeFolder, setActiveFolder, setIsComposeOpen, mails } = useMailStore();

  // Dynamic user account using genuine authenticated details
  const activeUserAccount: Account = React.useMemo(() => {
    const label =
      company?.name ||
      (user?.user_metadata?.company_name as string) ||
      (user?.email ? user.email.split("@")[0] : "Carbon Trader");
    const email =
      user?.email ||
      ((company?.contact_details as Record<string, string>)?.email as string) ||
      "trader@carbonbridge.io";

    return {
      id: 1,
      label,
      email,
    };
  }, [user, company]);

  const allAccounts = React.useMemo(() => {
    return [activeUserAccount, ...defaultAccounts.slice(1)];
  }, [activeUserAccount]);

  const [selectedAccount, setSelectedAccount] = React.useState<Account>(activeUserAccount);

  React.useEffect(() => {
    setSelectedAccount(activeUserAccount);
  }, [activeUserAccount]);

  // Compute folder counts
  const unreadInboxCount = mails.filter((m) => m.folder === "inbox" && !m.isRead).length;
  const sentCount = mails.filter((m) => m.folder === "sent").length;
  const draftsCount = mails.filter((m) => m.folder === "drafts").length;
  const archiveCount = mails.filter((m) => m.folder === "archive").length;
  const trashCount = mails.filter((m) => m.folder === "trash").length;

  const getFolderBadge = (folderId: string) => {
    switch (folderId) {
      case "inbox":
        return unreadInboxCount > 0 ? String(unreadInboxCount) : undefined;
      case "sent":
        return sentCount > 0 ? String(sentCount) : undefined;
      case "drafts":
        return draftsCount > 0 ? String(draftsCount) : undefined;
      case "archive":
        return archiveCount > 0 ? String(archiveCount) : undefined;
      case "trash":
        return trashCount > 0 ? String(trashCount) : undefined;
      default:
        return undefined;
    }
  };

  const renderNavItem = (nav: MailNavItem) => {
    const isCurrentActive = activeFolder === nav.id;
    const badge = getFolderBadge(nav.id);

    return (
      <SidebarMenuItem key={nav.id}>
        <SidebarMenuButton
          className="[&_svg]:size-3.5 cursor-pointer"
          size="sm"
          isActive={isCurrentActive}
          tooltip={nav.title}
          onClick={() => {
            setActiveFolder(nav.id as MailFolder);
          }}
        >
          <nav.icon />
          <span className="font-medium">{nav.title}</span>
        </SidebarMenuButton>
        {badge && <SidebarMenuBadge className="font-medium">{badge}</SidebarMenuBadge>}
      </SidebarMenuItem>
    );
  };

  return (
    <>
      <Sidebar collapsible="icon" className="absolute inset-y-0 h-full **:data-[sidebar=sidebar]:bg-background">
        <SidebarHeader className="gap-3 py-3 pb-1">
          <div className="flex items-center justify-between">
            {isCollapsed ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className={accountTriggerClassName}
                    aria-label={`Open ${selectedAccount.label} menu`}
                  >
                    <AccountMarker account={selectedAccount} isSelected />
                  </Button>
                </DropdownMenuTrigger>
                <AccountMenuContent
                  accounts={allAccounts}
                  selectedAccountId={selectedAccount.id}
                  onSelectAccount={setSelectedAccount}
                  onSignOut={signOut}
                  showAccounts
                  side="right"
                  align="start"
                />
              </DropdownMenu>
            ) : (
              <>
                <ToggleGroup
                  type="single"
                  value={String(selectedAccount.id)}
                  onValueChange={(value) => {
                    const account = allAccounts.find((item) => item.id === Number(value));
                    if (account) {
                      setSelectedAccount(account);
                    }
                  }}
                  spacing={2}
                >
                  {allAccounts.map((account) => (
                    <ToggleGroupItem
                      key={account.id}
                      className={accountTriggerClassName}
                      value={String(account.id)}
                      aria-label={`Select ${account.label}`}
                    >
                      <AccountMarker account={account} />
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label="Open account menu">
                      <EllipsisVertical />
                    </Button>
                  </DropdownMenuTrigger>
                  <AccountMenuContent
                    accounts={allAccounts}
                    selectedAccountId={selectedAccount.id}
                    onSelectAccount={setSelectedAccount}
                    onSignOut={signOut}
                  />
                </DropdownMenu>
              </>
            )}
          </div>

          <Separator />

          <div className="flex flex-col gap-1.5 group-data-[state=collapsed]:hidden">
            <div className="font-medium text-sm leading-none truncate">{selectedAccount.label}</div>
            <div className="truncate text-muted-foreground text-xs leading-none">{selectedAccount.email}</div>
          </div>

          <Button
            size={isCollapsed ? "icon-sm" : "sm"}
            variant="default"
            className="group-data-[state=expanded]:w-full"
            onClick={() => setIsComposeOpen(true)}
          >
            <PenLine data-icon="inline-start" />
            <span className="group-data-[state=collapsed]:hidden">New email</span>
          </Button>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu className="gap-1">{mailNavigation.navMain.map(renderNavItem)}</SidebarMenu>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="font-normal">Folders</SidebarGroupLabel>
            <SidebarMenu className="gap-1">{mailNavigation.folders.map(renderNavItem)}</SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu className="gap-1">{mailNavigation.navFooter.map(renderNavItem)}</SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <MailComposeDialog />
    </>
  );
}

const accountTriggerClassName = cn(
  "relative size-7 min-w-7 rounded-sm p-0 transition-colors",
  "bg-primary text-primary-foreground text-xs hover:bg-primary/90 hover:text-primary-foreground",
  "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground",
  "data-[state=on]:ring data-[state=on]:ring-green-600",
  "focus-visible:border-transparent focus-visible:ring-0",
);

function AccountMarker({ account, isSelected = false }: { account: Account; isSelected?: boolean }) {
  return (
    <>
      {getInitials(account.label).slice(0, 1)}
      <span
        className={cn(
          "absolute right-0 bottom-0 z-10 hidden size-2.5 items-center justify-center rounded-full bg-green-600 text-primary-foreground ring-[1.25px] ring-background group-data-[state=on]/toggle:flex",
          isSelected && "flex",
        )}
      >
        <Check className="size-2" />
      </span>
    </>
  );
}

function AccountMenuContent({
  accounts,
  selectedAccountId,
  onSelectAccount,
  onSignOut,
  showAccounts = false,
  ...props
}: {
  accounts: Account[];
  selectedAccountId: number;
  onSelectAccount: (account: Account) => void;
  onSignOut?: () => Promise<void>;
  showAccounts?: boolean;
} & Pick<React.ComponentProps<typeof DropdownMenuContent>, "align" | "side">) {
  return (
    <DropdownMenuContent className="w-60" {...props}>
      {showAccounts && (
        <>
          <DropdownMenuLabel>Trading Accounts</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuRadioGroup
              value={String(selectedAccountId)}
              onValueChange={(value) => {
                const account = accounts.find((item) => item.id === Number(value));
                if (account) {
                  onSelectAccount(account);
                }
              }}
            >
              {accounts.map((account) => (
                <DropdownMenuRadioItem key={account.id} value={String(account.id)}>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">{account.label}</span>
                    <span className="truncate text-muted-foreground text-xs">{account.email}</span>
                  </div>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
        </>
      )}
      <DropdownMenuGroup>
        <DropdownMenuItem asChild>
          <a href="/dashboard/profile" className="flex items-center gap-2 cursor-pointer">
            <Settings2 className="size-4" />
            <span>Profile Settings</span>
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="/dashboard/marketplace" className="flex items-center gap-2 cursor-pointer">
            <UsersRound className="size-4" />
            <span>Trading Marketplace</span>
          </a>
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      {onSignOut && (
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => onSignOut()}
            className="text-destructive focus:text-destructive cursor-pointer"
          >
            <LogOut className="size-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      )}
    </DropdownMenuContent>
  );
}
