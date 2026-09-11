"use client";

import { useAuth } from "@/contexts/auth-context";
import { EmitterDashboard } from "./_components/emitter-dashboard";
import { BuyerDashboard } from "./_components/buyer-dashboard";
import { LogisticsDashboard } from "./_components/logistics-dashboard";
import { RegulatorDashboard } from "./_components/regulator-dashboard";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { companyType, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: loading skeleton
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  switch (companyType) {
    case "EMITTER":
      return <EmitterDashboard />;
    case "CO2_BUYER":
      return <BuyerDashboard />;
    case "LOGISTICS_PROVIDER":
      return <LogisticsDashboard />;
    case "REGULATOR":
    case "ADMIN":
      return <RegulatorDashboard />;
    default:
      return <EmitterDashboard />;
  }
}
