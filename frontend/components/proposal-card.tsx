"use client"
"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { INVICTUS_DAO_ADDRESS, INVICTUS_DAO_ABI } from "@/lib/contract-config"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThumbsUp, ThumbsDown, CheckCircle2, Loader2, Clock } from "lucide-react"
import type { Proposal } from "@/types/proposal"
import { castVote } from "@/lib/web3-contract"

interface ProposalCardProps {
  proposal: Proposal
  walletAddress: string | null
  onVote: (proposalId: string, vote: "for" | "against", votesFor: number, votesAgainst: number) => void
  onClose: (proposalId: string) => void
}

export function ProposalCard({ proposal, walletAddress, onVote, onClose }: ProposalCardProps) {
  const [isVoting, setIsVoting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<string>("")
  const [currentVotesFor, setCurrentVotesFor] = useState(proposal.votesFor)
  const [currentVotesAgainst, setCurrentVotesAgainst] = useState(proposal.votesAgainst)

  // Sync vote counts when proposal data changes (e.g., after wallet reconnect or page refresh)
  useEffect(() => {
    console.log("[ProposalCard] Syncing vote counts from proposal:", { votesFor: proposal.votesFor, votesAgainst: proposal.votesAgainst })
    setCurrentVotesFor(proposal.votesFor)
    setCurrentVotesAgainst(proposal.votesAgainst)
    
    // Check if user already voted by querying contract
    const checkVoteStatus = async () => {
      if (!walletAddress || typeof window.ethereum === "undefined") {
        setHasVoted(false)
        return
      }

      try {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const contract = new ethers.Contract(INVICTUS_DAO_ADDRESS, INVICTUS_DAO_ABI, provider)
        const voted = await contract.hasVoted(BigInt(proposal.id), walletAddress)
        console.log("[ProposalCard] User voted status:", voted)
        setHasVoted(voted)
      } catch (err) {
        console.error("[ProposalCard] Failed to check vote status:", err)
        setHasVoted(false)
      }
    }

    checkVoteStatus()
  }, [proposal.votesFor, proposal.votesAgainst, proposal.id, walletAddress])

  // Calculate and update time remaining
  useEffect(() => {
    if (!proposal.deadline) return

    const updateTimer = () => {
      const now = new Date().getTime()
      const deadline = new Date(proposal.deadline!).getTime()
      const difference = deadline - now

      if (difference <= 0) {
        setTimeRemaining("Voting ended")
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24)
      const minutes = Math.floor((difference / 1000 / 60) % 60)
      const seconds = Math.floor((difference / 1000) % 60)

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h remaining`)
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m remaining`)
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s remaining`)
      } else {
        setTimeRemaining(`${seconds}s remaining`)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [proposal.deadline])

  const handleVote = async (vote: "for" | "against") => {
    if (!walletAddress) {
      alert("Please connect your wallet first")
      return
    }

    // Check if proposal is still active
    if (proposal.status !== "active") {
      alert("This proposal is no longer active")
      return
    }

    // Check if user already voted
    if (hasVoted) {
      alert("You have already voted on this proposal")
      return
    }

    setIsVoting(true)
    try {
      console.log("[Vote] Initiating vote transaction...")
      await castVote(proposal.id, vote, walletAddress)

      console.log("[Vote] Vote successful!")
      setHasVoted(true)

      // Fetch actual vote weight from contract (based on user's ETH balance)
      try {
        if (typeof window.ethereum !== "undefined") {
          const provider = new ethers.BrowserProvider(window.ethereum)
          const contract = new ethers.Contract(INVICTUS_DAO_ADDRESS, INVICTUS_DAO_ABI, provider)
          const voteWeight = await contract.getVoteWeight(BigInt(proposal.id), walletAddress)
          const weight = Number(voteWeight)
          
          console.log("[Vote] User vote weight from contract:", weight)
          console.log("[Vote] Previous vote counts:", { currentVotesFor, currentVotesAgainst })
          
          // Update vote counts with actual weight from contract
          const newVotesFor = vote === "for" ? currentVotesFor + weight : currentVotesFor
          const newVotesAgainst = vote === "against" ? currentVotesAgainst + weight : currentVotesAgainst

          console.log("[Vote] Updated vote counts:", { newVotesFor, newVotesAgainst })
          
          setCurrentVotesFor(newVotesFor)
          setCurrentVotesAgainst(newVotesAgainst)
          onVote(proposal.id, vote, newVotesFor, newVotesAgainst)
        }
      } catch (weightError) {
        console.error("[Vote] Failed to fetch vote weight, using default +1:", weightError)
        // Fallback: increment by 1 if can't get weight
        const newVotesFor = vote === "for" ? currentVotesFor + 1 : currentVotesFor
        const newVotesAgainst = vote === "against" ? currentVotesAgainst + 1 : currentVotesAgainst
        setCurrentVotesFor(newVotesFor)
        setCurrentVotesAgainst(newVotesAgainst)
        onVote(proposal.id, vote, newVotesFor, newVotesAgainst)
      }
    } catch (error: any) {
      console.error("[Vote] Voting failed:", error)
      const errorMsg = error.message || "Transaction rejected"
      alert(`Failed to submit vote: ${errorMsg}`)
    } finally {
      setIsVoting(false)
    }
  }

  const handleClose = async () => {
    try {
      onClose(proposal.id)
    } catch (error) {
      console.error("Failed to close proposal:", error)
    }
  }

  return (
    <Card className="border-primary/30 bg-card/50 backdrop-blur-sm hover:border-primary/60 transition-all border-pulse">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant={proposal.status === "active" ? "default" : "secondary"}
                className={proposal.status === "active" ? "bg-primary text-primary-foreground" : ""}
              >
                {proposal.status === "active" ? "Active" : "Closed"}
              </Badge>
              {proposal.deadline && timeRemaining && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Clock className="w-3 h-3" />
                  {timeRemaining}
                </Badge>
              )}
            </div>
            <CardTitle className="text-xl font-bold text-foreground">{proposal.title}</CardTitle>
          </div>
        </div>
        <CardDescription className="text-muted-foreground mt-2">{proposal.description}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/30 border border-primary/20">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Votes For</p>
            <p className="text-2xl font-bold text-primary">{currentVotesFor}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Votes Against</p>
            <p className="text-2xl font-bold text-destructive">{currentVotesAgainst}</p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-3">
        {proposal.status === "active" && (
          <>
            <Button
              onClick={() => handleVote("for")}
              disabled={isVoting || hasVoted || !walletAddress}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {isVoting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Confirming...
                </>
              ) : hasVoted ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Voted
                </>
              ) : (
                <>
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Vote For
                </>
              )}
            </Button>
            <Button
              onClick={() => handleVote("against")}
              disabled={isVoting || hasVoted || !walletAddress}
              variant="outline"
              className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10 font-semibold"
            >
              {isVoting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <ThumbsDown className="w-4 h-4 mr-2" />
                  Vote Against
                </>
              )}
            </Button>
            <Button onClick={handleClose} variant="secondary" className="font-semibold">
              Close
            </Button>
          </>
        )}
        {proposal.status === "closed" && (
          <div className="w-full text-center py-2">
            <Badge variant="secondary" className="text-sm">
              Proposal Closed
            </Badge>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
