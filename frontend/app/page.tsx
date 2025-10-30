"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { ProposalList } from "@/components/proposal-list"
import { CreateProposal } from "@/components/create-proposal"

export default function Home() {
  const [currentView, setCurrentView] = useState<"proposals" | "create">("proposals")
  const [walletAddress, setWalletAddress] = useState<string | null>(null)

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />

      <div className="flex-1 flex flex-col">
        <Header walletAddress={walletAddress} onWalletConnect={setWalletAddress} />

        <main className="flex-1 p-6 lg:p-8">
          {currentView === "proposals" ? (
            <ProposalList walletAddress={walletAddress} />
          ) : (
            <CreateProposal walletAddress={walletAddress} />
          )}
        </main>
      </div>
    </div>
  )
}
