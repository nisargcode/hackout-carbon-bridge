"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Leaf, LogOut } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { APP_CONFIG } from "@/config/app-config";
import { useAuth } from "@/contexts/auth-context";
import {
  emitterSidebarItems,
  buyerSidebarItems,
  type NavGroup,
} from "@/navigation/sidebar/sidebar-items";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

import { useEffect, useState, useMemo } from "react";
import { fetchUserNotifications } from "@/lib/notifications";

function getRoleNav(companyType: string | null): NavGroup[] {
  switch (companyType) {
    case "EMITTER":
      return emitterSidebarItems;
    case "CO2_BUYER":
      return buyerSidebarItems;
    default:
      return emitterSidebarItems;
  }
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { sidebarVariant, sidebarCollapsible, isSynced } = usePreferencesStore(
    useShallow((s) => ({
      sidebarVariant: s.values.sidebar_variant,
      sidebarCollapsible: s.values.sidebar_collapsible,
      isSynced: s.isSynced,
    })),
  );
  const { user, company, companyType, signOut } = useAuth();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!company?.company_id) return;
    const checkNotifs = async () => {
      try {
        const res = await fetchUserNotifications(company.company_id);
        setUnreadCount(res.unreadCount);
      } catch {}
    };

    checkNotifs();
    const interval = setInterval(checkNotifs, 30000);

    const onCustomNotif = () => checkNotifs();
    window.addEventListener("carbon_bridge_notification", onCustomNotif);

    return () => {
      clearInterval(interval);
      window.removeEventListener("carbon_bridge_notification", onCustomNotif);
    };
  }, [company?.company_id]);

  const variant = isSynced ? sidebarVariant : props.variant;
  const collapsible = isSynced ? sidebarCollapsible : props.collapsible;

  const baseNavItems = getRoleNav(companyType);

  const navItems = useMemo(() => {
    return baseNavItems.map((group) => ({
      ...group,
      items: group.items.map((item) => {
        if (item.id === "notifications") {
          return {
            ...item,
            badge: unreadCount > 0 ? unreadCount : undefined,
          };
        }
        return item;
      }),
    }));
  }, [baseNavItems, unreadCount]);

  const currentUser = {
    name: company?.name ?? user?.email ?? "User",
    email: user?.email ?? "",
    avatar:
      (company?.contact_details?.avatar_url as string) ||
      (user?.user_metadata?.avatar_url as string) ||
      (user?.user_metadata?.picture as string) ||
      "",
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <Sidebar {...props} variant={variant} collapsible={collapsible}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/dashboard">
                <Leaf className="text-green-600" />
                <span className="font-semibold text-base">{APP_CONFIG.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={currentUser} onSignOut={handleSignOut} />
      </SidebarFooter>
    </Sidebar>
  );
}
