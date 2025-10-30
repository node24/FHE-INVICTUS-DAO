import { ethers } from "ethers"
import { ethers } from "ethers"
import { INVICTUS_DAO_ADDRESS, INVICTUS_DAO_ABI, INVICTUS_CONFIG } from "./contract-config"

// Use contract config ABI
const DAO_ABI = INVICTUS_DAO_ABI
const DAO_CONTRACT_ADDRESS = INVICTUS_DAO_ADDRESS
const SEPOLIA_CHAIN_ID = INVICTUS_CONFIG.chainId

// Helper for validateProposalExists
const PROPOSAL_CHECK_ABI = [
  "function getProposalCount() external view returns (uint256)",
]

// Helper function to validate proposal exists
async function validateProposalExists(provider: ethers.Provider, proposalId: number) {
  try {
    const contract = new ethers.Contract(DAO_CONTRACT_ADDRESS, PROPOSAL_CHECK_ABI, provider)
    const count = await contract.getProposalCount()
    const proposalCount = Number(count)
    
    if (proposalId < 0 || proposalId >= proposalCount) {
      throw new Error(`Proposal ${proposalId} does not exist (total: ${proposalCount})`)
    }
    
    return true
  } catch (error) {
    console.error(`[Proposal] Failed to validate proposal ${proposalId}:`, error)
    throw error
  }
}

export async function connectWallet(): Promise<string> {
  if (typeof window.ethereum === "undefined") {
    throw new Error("No Web3 wallet detected. Please install MetaMask.")
  }

  try {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    })
    return accounts[0]
  } catch (error: any) {
    throw new Error(error.message || "Failed to connect wallet")
  }
}

export async function disconnectWallet(): Promise<void> {
  // MetaMask doesn't support programmatic disconnect, but we can clear local state
  console.log("[Web3] Disconnecting wallet...")
  // UI should handle state reset
}

export async function switchToSepolia(): Promise<void> {
  if (typeof window.ethereum === "undefined") {
    throw new Error("No Web3 wallet detected.")
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ethers.toBeHex(SEPOLIA_CHAIN_ID) }],
    })
  } catch (error: any) {
    if (error.code === 4902) {
      // Chain not added, try to add it
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: ethers.toBeHex(SEPOLIA_CHAIN_ID),
              chainName: "Sepolia Testnet",
              nativeCurrency: {
                name: "Sepolia ETH",
                symbol: "ETH",
                decimals: 18,
              },
              rpcUrls: ["https://sepolia.infura.io/v3/36a0b2650cd14cf2b3a13e7497a65b9f"],
              blockExplorerUrls: ["https://sepolia.etherscan.io"],
            },
          ],
        })
      } catch (addError) {
        throw new Error("Failed to add Sepolia network")
      }
    } else {
      throw new Error(error.message || "Failed to switch chain")
    }
  }
}

export async function getCurrentChainId(): Promise<number> {
  if (typeof window.ethereum === "undefined") {
    throw new Error("No Web3 wallet detected.")
  }

  try {
    const chainId = await window.ethereum.request({
      method: "eth_chainId",
    })
    return parseInt(chainId, 16)
  } catch (error: any) {
    throw new Error(error.message || "Failed to get chain ID")
  }
}

export async function castVote(
  proposalId: string,
  vote: "for" | "against",
  voterAddress: string
): Promise<void> {
  if (typeof window.ethereum === "undefined") {
    throw new Error("No Web3 wallet detected. Please install MetaMask.")
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    const contract = new ethers.Contract(DAO_CONTRACT_ADDRESS, DAO_ABI, signer)

    console.log("[Vote] Checking proposal and user balance...")
    
    // Validate proposal exists
    await validateProposalExists(provider, Number(proposalId))
    console.log("[Vote] Proposal", proposalId, "exists")
    
    // Check user balance
    const userBalance = await provider.getBalance(voterAddress)
    const balanceInEth = parseFloat(ethers.formatEther(userBalance))
    const MIN_VOTE_BALANCE = 0.001 // Minimum 0.001 ETH to vote
    console.log("[Vote] User balance:", balanceInEth, "ETH")
    
    if (balanceInEth < MIN_VOTE_BALANCE) {
      throw new Error(`Insufficient balance: need ${MIN_VOTE_BALANCE} ETH to vote, you have ${balanceInEth.toFixed(4)} ETH`)
    }
    
    // Check if already voted
    const alreadyVoted = await contract.hasVoted(BigInt(proposalId), voterAddress)
    if (alreadyVoted) {
      throw new Error("You have already voted on this proposal")
    }

    console.log("[Vote] Submitting vote to contract...")
    
    // Use simple vote function (0 = No, 1 = Yes)
    const voteValue = vote === "for" ? 1 : 0
    console.log("[Vote] Vote value:", voteValue)
    
    const tx = await contract.voteSimple(BigInt(proposalId), voteValue)

    console.log("[Vote] Transaction sent:", tx.hash)
    console.log("[Vote] Waiting for confirmation...")

    const receipt = await tx.wait()
    console.log("[Vote] Transaction confirmed in block:", receipt?.blockNumber)
  } catch (error: any) {
    console.error("[Vote] Vote transaction failed:", error)

    // Parse error messages
    const errorMsg = error.message || error.reason || ""
    
    if (error.code === "ACTION_REJECTED") {
      throw new Error("Transaction was rejected by user")
    } else if (error.code === "INSUFFICIENT_FUNDS" || errorMsg.includes("insufficient funds")) {
      throw new Error("Insufficient ETH for gas fees")
    } else if (errorMsg.includes("Insufficient ETH balance to vote")) {
      throw new Error("Need at least 0.1 ETH in your wallet to vote")
    } else if (errorMsg.includes("Already voted")) {
      throw new Error("You have already voted on this proposal")
    } else if (errorMsg.includes("not active")) {
      throw new Error("Proposal is not active or voting has ended")
    } else if (error.code === "CALL_EXCEPTION" && !error.reason) {
      // Contract call failed without specific reason - might be proposal issue
      throw new Error("Contract call failed - proposal may not exist or voting may have ended. Please refresh and try again.")
    } else {
      throw new Error(error.reason || error.message || "Transaction failed")
    }
  }
}

export async function createProposal(title: string, description: string): Promise<string> {
  if (typeof window.ethereum === "undefined") {
    throw new Error("No Web3 wallet detected. Please install MetaMask.")
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    const contract = new ethers.Contract(DAO_CONTRACT_ADDRESS, DAO_ABI, signer)

    console.log("[Proposal] Creating proposal with 0.01 ETH fee...")

    // Send transaction with 0.01 ETH creation fee
    const tx = await contract.createProposal(title, description, {
      value: ethers.parseEther("0.01"),
    })

    console.log("[Proposal] Creation transaction sent:", tx.hash)

    const receipt = await tx.wait()
    console.log("[Proposal] Created in block:", receipt?.blockNumber)

    // Extract proposal ID from event logs
    if (receipt?.logs && receipt.logs.length > 0) {
      const event = receipt.logs.find(
        (log: any) => log.topics[0] === ethers.id("ProposalCreated(uint256,address,string,uint256)"),
      )
      if (event) {
        const proposalId = ethers.toNumber(event.topics[1])
        return proposalId.toString()
      }
    }

    return Date.now().toString()
  } catch (error: any) {
    console.error("[Proposal] Creation failed:", error)

    if (error.code === "ACTION_REJECTED") {
      throw new Error("Transaction was rejected by user")
    } else if (error.code === "INSUFFICIENT_FUNDS") {
      throw new Error("Insufficient ETH. You need at least 0.01 ETH + gas fees")
    } else {
      throw new Error(error.message || "Transaction failed")
    }
  }
}

export async function getProposalCount(): Promise<number> {
  if (typeof window.ethereum === "undefined") {
    return 0
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum)
    const contract = new ethers.Contract(DAO_CONTRACT_ADDRESS, DAO_ABI, provider)

    const count = await contract.getProposalCount()
    return Number(count)
  } catch (error) {
    console.error("[Proposal] Failed to get count:", error)
    return 0
  }
}

export async function getProposal(proposalId: string): Promise<any> {
  if (typeof window.ethereum === "undefined") {
    return null
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum)
    const contract = new ethers.Contract(DAO_CONTRACT_ADDRESS, DAO_ABI, provider)

    const proposal = await contract.getProposal(BigInt(proposalId))
    return proposal
  } catch (error) {
    console.error("[Proposal] Failed to get proposal:", error)
    return null
  }
}
