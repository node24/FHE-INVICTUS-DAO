"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { PlusCircle, Coins, Loader2, AlertCircle } from "lucide-react"
import { createProposal } from "@/lib/web3-contract"
import { ethers } from "ethers"

interface CreateProposalProps {
  walletAddress: string | null
}

export function CreateProposal({ walletAddress }: CreateProposalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [balance, setBalance] = useState<number | null>(null)
  const [isCheckingBalance, setIsCheckingBalance] = useState(false)

  // Check wallet balance on mount and when address changes
  useEffect(() => {
    if (!walletAddress) {
      setBalance(null)
      return
    }

    const checkBalance = async () => {
      try {
        setIsCheckingBalance(true)
        if (typeof window === "undefined" || !window.ethereum) {
          setBalance(null)
          return
        }
        const provider = new ethers.BrowserProvider(window.ethereum)
        const balanceWei = await provider.getBalance(walletAddress)
        const balanceEth = parseFloat(ethers.formatEther(balanceWei))
        setBalance(balanceEth)
      } catch (error) {
        console.error("[CreateProposal] Failed to check balance:", error)
        setBalance(null)
      } finally {
        setIsCheckingBalance(false)
      }
    }

    checkBalance()
  }, [walletAddress])

  const handleCreate = async () => {
    if (!walletAddress) {
      alert("Please connect your wallet first")
      return
    }

    if (!title || !description) {
      alert("Please fill in all fields")
      return
    }

    setIsCreating(true)
    try {
      console.log("[v0] Creating proposal with Web3 transaction...")
      const proposalId = await createProposal(title, description)

      console.log("[v0] Proposal created successfully with ID:", proposalId)
      alert(`Proposal created successfully! ID: ${proposalId}`)

      setTitle("")
      setDescription("")
    } catch (error: any) {
      console.error("[v0] Failed to create proposal:", error)
      alert(`Failed to create proposal: ${error.message || "Transaction failed"}`)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold metallic-text tracking-wide">Create New Proposal</h2>
        <p className="text-muted-foreground mt-1">Submit a new governance proposal to the DAO</p>
      </div>

      <Card className="border-primary/30 bg-card/50 backdrop-blur-sm blue-glow">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Proposal Details</CardTitle>
          <CardDescription>
            Provide clear information about your proposal. A creation fee of 0.01 ETH + gas is required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-foreground font-semibold">
              Proposal Title
            </Label>
            <Input
              id="title"
              placeholder="Enter a clear, concise title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-background border-primary/30 focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground font-semibold">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Provide detailed information about your proposal..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={8}
              className="bg-background border-primary/30 focus:border-primary resize-none"
            />
          </div>

          <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">Creation Fee</span>
              </div>
              <span className="text-xl font-bold text-primary">0.01 ETH</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              This fee + Sepolia gas costs help prevent spam and support DAO operations
            </p>
          </div>

          {walletAddress && balance !== null && balance < 0.02 && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-destructive">Insufficient Balance</p>
                  <p className="text-sm text-destructive/80 mt-1">
                    Your wallet has {balance.toFixed(4)} ETH, but you need at least 0.02 ETH (0.01 fee + gas).
                  </p>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleCreate}
            disabled={isCreating || !walletAddress || !title || !description || balance === null || balance < 0.02}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg py-6 blue-glow-strong disabled:opacity-50 disabled:cursor-not-allowed"
            title={balance !== null && balance < 0.02 ? "Insufficient balance to create proposal" : ""}
          >
            {isCreating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Confirming Transaction...
              </>
            ) : (
              <>
                <PlusCircle className="w-5 h-5 mr-2" />
                Create Proposal (0.01 ETH)
              </>
            )}
          </Button>

          {!walletAddress && (
            <p className="text-center text-sm text-destructive">Please connect your wallet to create a proposal</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
