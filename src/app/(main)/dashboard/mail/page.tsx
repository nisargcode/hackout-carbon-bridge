import Link from "next/link";
import { ExternalLink, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-primary" />
            <h1 className="font-medium text-sm leading-none">Industrial Mail & Messages</h1>
          </div>
          <p className="text-muted-foreground text-xs">
            Secure communications channel between emitters, buyers, logistics providers, and regulatory authorities.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/mail" target="_blank" rel="noreferrer" className="flex items-center gap-1.5">
            <span>Open Standalone Mail</span>
            <ExternalLink className="size-3.5" />
          </Link>
        </Button>
      </div>

      <iframe src="/mail" title="Industrial Mail" className="min-h-0 flex-1 rounded-lg border bg-background shadow-sm" />
    </div>
  );
}
