"use client";

import Link from "next/link";

import { siGithub } from "simple-icons";

import { SimpleIcon } from "@/components/simple-icon";
import { Button } from "@/components/ui/button";


export function GitHubRepositoriesMenu() {
  return (
    <Button size="icon" aria-label="Open project on GitHub" asChild>
      <Link href="https://github.com/nisargcode" target="_blank" rel="noreferrer">
        <SimpleIcon icon={siGithub} className="fill-primary-foreground" />
      </Link>
    </Button>
  );
}
