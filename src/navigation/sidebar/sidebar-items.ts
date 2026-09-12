import {
  BarChart3,
  Banknote,
  FileText,
  Gavel,
  LayoutDashboard,
  Leaf,
  ListTodo,
  Lock,
  Map,
  MessageSquare,
  Package,
  PlusCircle,
  ReceiptText,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  UserRound,
  type LucideIcon,
  Forklift,
  ChartBar,
  Bell,
} from "lucide-react";

export type NavBadge = "new" | "soon" | number | string;

export interface NavSubItem {
  id: string;
  title: string;
  url: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

interface NavItemBase {
  id: string;
  title: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

export interface NavMainLinkItem extends NavItemBase {
  url: string;
  subItems?: never;
}

export interface NavMainParentItem extends NavItemBase {
  subItems: NavSubItem[];
}

export type NavMainItem = NavMainLinkItem | NavMainParentItem;

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

// Emitter / Seller sidebar items
export const emitterSidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Overview",
    items: [
      {
        id: "emitter-dashboard",
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        id: "notifications",
        title: "Notifications",
        url: "/dashboard/notifications",
        icon: Bell,
      },
      {
        id: "messages",
        title: "Messages",
        url: "/dashboard/mail",
        icon: MessageSquare,
      },
    ],
  },
  {
    id: 2,
    label: "Supply",
    items: [
      {
        id: "my-listings",
        title: "My Listings",
        url: "/dashboard/listings",
        icon: Package,
      },
      {
        id: "add-supply",
        title: "Add Supply",
        url: "/dashboard/listings/new",
        icon: PlusCircle,
      },
      {
        id: "verification",
        title: "Verification",
        url: "/dashboard/verification",
        icon: ShieldCheck,
      },
    ],
  },
  {
    id: 3,
    label: "Trade",
    items: [
      {
        id: "incoming-bids",
        title: "Incoming Bids",
        url: "/dashboard/bids",
        icon: Gavel,
      },
      {
        id: "contracts",
        title: "Contracts",
        url: "/dashboard/contracts",
        icon: FileText,
      },
      {
        id: "revenue",
        title: "Revenue",
        url: "/dashboard/revenue",
        icon: Banknote,
      },
    ],
  },
  {
    id: 4,
    label: "Analytics",
    items: [
      {
        id: "analytics",
        title: "Analytics",
        url: "/dashboard/analytics",
        icon: ChartBar,
      },
      {
        id: "carbon-reports",
        title: "Carbon Reports",
        url: "/dashboard/reports",
        icon: Leaf,
      },
    ],
  },
  {
    id: 5,
    label: "Account",
    items: [
      {
        id: "profile",
        title: "Profile",
        url: "/dashboard/profile",
        icon: UserRound,
      },
      {
        id: "settings",
        title: "Settings",
        url: "/dashboard/settings",
        icon: Settings,
      },
    ],
  },
];

// Buyer sidebar items
export const buyerSidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Overview",
    items: [
      {
        id: "buyer-dashboard",
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        id: "notifications",
        title: "Notifications",
        url: "/dashboard/notifications",
        icon: Bell,
      },
      {
        id: "messages",
        title: "Messages",
        url: "/dashboard/mail",
        icon: MessageSquare,
      },
    ],
  },
  {
    id: 2,
    label: "Marketplace",
    items: [
      {
        id: "browse",
        title: "Browse Supplies",
        url: "/dashboard/marketplace",
        icon: ShoppingBag,
      },
      {
        id: "my-demands",
        title: "My Demands",
        url: "/dashboard/demands",
        icon: ListTodo,
      },
      {
        id: "ai-matches",
        title: "AI Matches",
        url: "/dashboard/matches",
        icon: Sparkles,
        badge: "new",
      },
    ],
  },
  {
    id: 3,
    label: "Trade",
    items: [
      {
        id: "active-bids",
        title: "Active Bids",
        url: "/dashboard/bids",
        icon: Gavel,
      },
      {
        id: "contracts",
        title: "Contracts",
        url: "/dashboard/contracts",
        icon: FileText,
      },
    ],
  },
  {
    id: 4,
    label: "Analytics",
    items: [
      {
        id: "analytics",
        title: "Analytics",
        url: "/dashboard/analytics",
        icon: ChartBar,
      },
      {
        id: "spend-reports",
        title: "Spend Reports",
        url: "/dashboard/reports",
        icon: ReceiptText,
      },
    ],
  },
  {
    id: 5,
    label: "Account",
    items: [
      {
        id: "profile",
        title: "Profile",
        url: "/dashboard/profile",
        icon: UserRound,
      },
      {
        id: "settings",
        title: "Settings",
        url: "/dashboard/settings",
        icon: Settings,
      },
    ],
  },
];

// Alias export so existing template imports don't break
export const sidebarItems = emitterSidebarItems;
