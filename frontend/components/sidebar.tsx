"use client"

import { Button } from "@/components/ui/button"
import { FileText, PlusCircle, Shield } from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  currentView: "proposals" | "create"
  onViewChange: (view: "proposals" | "create") => void
}

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  return (
    <aside className="w-64 border-r border-border bg-card/30 backdrop-blur-sm">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-primary blue-glow" />
          <span className="text-lg font-bold metallic-text">GOVERNANCE</span>
        </div>

        <nav className="space-y-2">
          <Button
            variant={currentView === "proposals" ? "default" : "ghost"}
            className={cn(
              "w-full justify-start font-semibold",
              currentView === "proposals" && "bg-primary text-primary-foreground blue-glow",
            )}
            onClick={() => onViewChange("proposals")}
          >
            <FileText className="w-4 h-4 mr-3" />
            Proposals
          </Button>

          <Button
            variant={currentView === "create" ? "default" : "ghost"}
            className={cn(
              "w-full justify-start font-semibold",
              currentView === "create" && "bg-primary text-primary-foreground blue-glow",
            )}
            onClick={() => onViewChange("create")}
          >
            <PlusCircle className="w-4 h-4 mr-3" />
            Create Proposal
          </Button>
        </nav>

        <div className="mt-8 p-4 rounded-lg border border-primary/30 bg-primary/5">
          <p className="text-xs text-muted-foreground mb-2">Encryption Status</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary blue-glow-strong animate-pulse" />
            <span className="text-sm font-semibold text-primary">FHE Active</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
