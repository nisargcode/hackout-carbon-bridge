"use client";

import { useAuth } from "@/contexts/auth-context";
import { EmitterDashboard } from "./_components/emitter-dashboard";
import { BuyerDashboard } from "./_components/buyer-dashboard";
import { LogisticsDashboard } from "./_components/logistics-dashboard";
import { RegulatorDashboard } from "./_components/regulator-dashboard";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { user, company, companyType, isLoading } = useAuth();

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

  if (!user) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-4 text-center">
        <h2 className="text-2xl font-bold">Authentication Required</h2>
        <p className="text-muted-foreground">You must be logged in to view the dashboard.</p>
        <button
          type="button"
          onClick={() => (window.location.href = "/")}
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
        >
          Go to Home
        </button>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-4 text-center max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-destructive">Company Profile Missing</h2>
        <p className="text-muted-foreground">
          We could not load your company profile. This usually happens if registration failed or your account is
          incomplete.
        </p>
        <div className="space-y-2 w-full pt-4">
          <p className="text-sm font-semibold">Diagnostic Info:</p>
          <pre className="text-xs bg-muted p-4 rounded-md text-left overflow-auto">
            User ID: {user.id}
            {"\n"}
            Email: {user.email}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground mt-4"
          >
            Retry Loading Profile
          </button>
        </div>
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
