"use client";

import { useState } from "react";
import { Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoryCardDialog } from "@/components/ui/story-card-dialog";
import { StoryCardData } from "@/lib/story-card-generator";

export function ShareStoryButton({ data }: { data: StoryCardData }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5 h-8 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
        title="Compartilhar no Instagram Stories"
      >
        <Instagram className="h-3.5 w-3.5 text-emerald-400" />
        <span className="hidden sm:inline">Story</span>
      </Button>

      <StoryCardDialog data={data} isOpen={open} onOpenChange={setOpen} />
    </>
  );
}
