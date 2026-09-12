"use client";

import { useRouter } from "next/navigation";
import { LogOut, Settings, Building2, UserCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

export function AccountSwitcher() {
  const { user, company, companyType, signOut } = useAuth();
  const router = useRouter();

  const displayName = company?.name || user?.email?.split("@")[0] || "Guest User";
  const email = user?.email || company?.contact_details?.email as string || "Not signed in";
  const role = companyType || "MEMBER";

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg p-1 text-left transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <Avatar className="size-8 rounded-lg">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-64 space-y-1 rounded-lg" side="bottom" align="end" sideOffset={4}>
        <DropdownMenuLabel className="font-normal p-2">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold leading-none truncate max-w-[160px]">{displayName}</p>
              <Badge variant="outline" className="text-[10px] font-medium">
                {role}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push("/dashboard/settings")} className="cursor-pointer">
            <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
            Company Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
