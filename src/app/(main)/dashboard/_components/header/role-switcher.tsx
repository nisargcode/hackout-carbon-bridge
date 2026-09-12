"use client";

import { Factory, ShoppingBag, ArrowLeftRight, Check, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import type { CompanyType } from "@/types";

export function RoleSwitcher() {
  const { companyType, switchRole } = useAuth();

  const isSeller = companyType === "EMITTER";
  const isBuyer = companyType === "CO2_BUYER";

  const router = useRouter();

  const handleRoleSwitch = async (targetRole: CompanyType) => {
    if (targetRole === companyType) return;
    const res = await switchRole(targetRole);
    if (res.error) {
      toast.error(`Could not switch role: ${res.error}`);
    } else {
      const label =
        targetRole === "EMITTER"
          ? "Seller (CO₂ Emitter)"
          : targetRole === "CO2_BUYER"
            ? "Buyer (CO₂ Offtaker)"
            : targetRole;
      toast.success(`Switched to ${label} mode!`);
      router.push("/dashboard");
      router.refresh();
    }
  };

  const handleQuickToggle = async () => {
    const targetRole = isSeller ? "CO2_BUYER" : "EMITTER";
    await handleRoleSwitch(targetRole);
  };

  return (
    <div className="flex items-center gap-1.5">
      {/* 1-Click Quick Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleQuickToggle}
        className={`h-8 gap-1.5 text-xs font-semibold transition-colors ${
          isSeller
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400"
            : "border-blue-500/40 bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 dark:text-blue-400"
        }`}
        title={`Click to switch to ${isSeller ? "Buyer" : "Seller"} mode`}
      >
        {isSeller ? (
          <>
            <Factory className="h-3.5 w-3.5" />
            <span>Seller</span>
            <ArrowLeftRight className="h-3 w-3 text-muted-foreground ml-0.5" />
            <span className="hidden md:inline font-normal text-muted-foreground text-[11px]">Switch to Buyer</span>
          </>
        ) : (
          <>
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Buyer</span>
            <ArrowLeftRight className="h-3 w-3 text-muted-foreground ml-0.5" />
            <span className="hidden md:inline font-normal text-muted-foreground text-[11px]">Switch to Seller</span>
          </>
        )}
      </Button>

      {/* Role Selection Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-6 p-0 text-muted-foreground">
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground">Active Mode</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => handleRoleSwitch("EMITTER")}
            className="cursor-pointer flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <Factory className="h-4 w-4 text-emerald-600" />
              Seller Mode (Emitter)
            </span>
            {isSeller && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleRoleSwitch("CO2_BUYER")}
            className="cursor-pointer flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-blue-600" />
              Buyer Mode (Offtaker)
            </span>
            {isBuyer && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
