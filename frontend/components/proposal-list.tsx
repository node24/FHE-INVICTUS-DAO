"use client"

import { useState, useEffect } from "react"
import { ProposalCard } from "@/components/proposal-card"
import { Button } from "@/components/ui/button"
import { RotateCcw } from "lucide-react"
import type { Proposal } from "@/types/proposal"
import { ethers } from "ethers"
import { INVICTUS_DAO_ADDRESS, INVICTUS_DAO_ABI, INVICTUS_CONFIG } from "@/lib/contract-config"

const DAO_ABI = INVICTUS_DAO_ABI
const DAO_CONTRACT_ADDRESS = INVICTUS_DAO_ADDRESS
const RPC_URL = INVICTUS_CONFIG.rpcUrl
const FALLBACK_RPC_URL = INVICTUS_CONFIG.fallbackRpcUrl

interface ProposalListProps {
  walletAddress: string | null
}

export function ProposalList({ walletAddress }: ProposalListProps) {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProposalsFromContract = async (retryCount = 0) => {
    try {
      setLoading(true)
      setError(null)

      // Use fallback RPC if primary fails
      const currentRPC = retryCount > 0 ? FALLBACK_RPC_URL : RPC_URL
      console.log("[ProposalList] Using RPC:", currentRPC.substring(0, 40) + "...")

      const provider = new ethers.JsonRpcProvider(currentRPC)
      const contract = new ethers.Contract(DAO_CONTRACT_ADDRESS, DAO_ABI, provider)

      // Test connection with timeout
      const networkPromise = provider.getNetwork()
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("RPC timeout after 10 seconds")), 10000)
      )
      await Promise.race([networkPromise, timeoutPromise])

      // Get total proposal count
      const proposalCount = await contract.getProposalCount()
      const count = Number(proposalCount)

      console.log("[ProposalList] Total proposals in contract:", count)

      if (count === 0) {
        setProposals([])
        setLoading(false)
        return
      }

      // Fetch all proposals
      const fetchedProposals: Proposal[] = []
      for (let i = 0; i < count; i++) {
        try {
          // Fetch real proposal data from contract
          const proposal = await contract.getProposal(BigInt(i))
          const now = Math.floor(Date.now() / 1000)
          
          console.log(`[ProposalList] Proposal ${i}:`, {
            title: proposal.title,
            status: proposal.status,
            yesVotes: Number(proposal.yesVotes),
            noVotes: Number(proposal.noVotes),
          })
          
          // Map contract status: 0 = Active, 1 = Closed
          const statusMap: { [key: number]: "active" | "closed" } = {
            0: "active",
            1: "closed",
          }
          
          fetchedProposals.push({
            id: i.toString(),
            title: proposal.title || `Proposal #${i}`,
            description: proposal.description || "No description provided",
            status: statusMap[proposal.status] || "active",
            votesFor: Number(proposal.yesVotes) || 0,
            votesAgainst: Number(proposal.noVotes) || 0,
            isPublic: false,
            createdAt: new Date(Number(proposal.createdAt) * 1000),
            deadline: new Date(Number(proposal.deadline) * 1000),
          })
        } catch (err) {
          console.error(`[ProposalList] Failed to fetch proposal ${i}:`, err)
        }
      }

      // Sort proposals by createdAt (newest first)
      fetchedProposals.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

      setProposals(fetchedProposals)
    } catch (err: any) {
      console.error("[ProposalList] Failed to fetch proposals:", err)
      
      // Retry with fallback RPC if not already retried
      if (retryCount === 0 && err.message?.includes("network")) {
        console.log("[ProposalList] Retrying with fallback RPC...")
        setTimeout(() => fetchProposalsFromContract(1), 2000)
        return
      }
      
      setError(err.message || "Failed to fetch proposals")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProposalsFromContract()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold metallic-text tracking-wide">Active Proposals</h2>
          <p className="text-muted-foreground mt-1">Vote on proposals with Sepolia ETH gas fees</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={() => fetchProposalsFromContract()}
            disabled={loading}
            variant="outline"
            size="sm"
            className="text-primary border-primary/50 hover:bg-primary/10"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Proposals</p>
            <p className="text-2xl font-bold text-primary">{proposals.length}</p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading proposals...</p>
        </div>
      )}

      {error && (
        <div className="bg-destructive/20 border border-destructive/50 rounded-lg p-4">
          <p className="text-destructive">Error loading proposals: {error}</p>
        </div>
      )}

      {!loading && proposals.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No proposals found. Create one to get started!</p>
        </div>
      )}

      <div className="grid gap-4">
        {proposals.map((proposal) => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            walletAddress={walletAddress}
            onVote={(proposalId, vote, votesFor, votesAgainst) => {
              console.log("[ProposalList] Updating proposal", proposalId, "with new counts:", { votesFor, votesAgainst })
              setProposals((prev) => prev.map((p) => (p.id === proposalId ? { ...p, votesFor, votesAgainst } : p)))
              // Auto-refresh proposals from contract after vote to ensure data consistency
              setTimeout(() => {
                console.log("[ProposalList] Auto-refreshing proposals after vote...")
                fetchProposalsFromContract()
              }, 2000)
            }}
            onClose={(proposalId) => {
              setProposals((prev) =>
                prev.map((p) => (p.id === proposalId ? { ...p, status: "closed" as const, isPublic: true } : p)),
              )
            }}
          />
        ))}
      </div>
    </div>
  )
}
