"use client"

import { Button } from "@/components/ui/button"
import { Wallet, LogOut, Network, X } from "lucide-react"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { connectWallet, disconnectWallet, switchToSepolia, getCurrentChainId } from "@/lib/web3-contract"
import { WalletModal } from "@/components/wallet-modal"

interface HeaderProps {
  walletAddress: string | null
  onWalletConnect: (address: string) => void
}

export function Header({ walletAddress, onWalletConnect }: HeaderProps) {
  const [chainId, setChainId] = useState<number | null>(null)
  const [isWrongChain, setIsWrongChain] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [installedWallets, setInstalledWallets] = useState<Array<{name: string; icon: string; provider: any}>>([])

  useEffect(() => {
    // Detect installed wallet extensions
    const wallets = []
    if (typeof window !== "undefined") {
      const ethereum = window.ethereum as any
      
      // Check MetaMask first (has highest priority)
      if (ethereum?.isMetaMask && !ethereum?.isOKExWallet) {
        wallets.push({
          name: "MetaMask",
          icon: "🦊",
          provider: ethereum,
        })
      }
      
      // Check OKX Wallet (OKX sets both isOKExWallet and might set isMetaMask)
      if (ethereum?.isOKExWallet) {
        wallets.push({
          name: "OKX Wallet",
          icon: "🟦",
          provider: ethereum,
        })
      }
      
      // Check Coinbase Wallet
      if (ethereum?.isCoinbaseWallet) {
        wallets.push({
          name: "Coinbase Wallet",
          icon: "📘",
          provider: ethereum,
        })
      }
      
      // Check WalletConnect
      if (ethereum?.isWalletConnect) {
        wallets.push({
          name: "WalletConnect",
          icon: "🔗",
          provider: ethereum,
        })
      }
      
      // Fallback if no specific wallet detected
      if (!wallets.length && ethereum) {
        wallets.push({
          name: "Connected Wallet",
          icon: "💼",
          provider: ethereum,
        })
      }
    }
    setInstalledWallets(wallets)
  }, [])

  useEffect(() => {
    const checkChain = async () => {
      if (walletAddress && typeof window.ethereum !== "undefined") {
        try {
          const currentChain = await getCurrentChainId()
          setChainId(currentChain)
          setIsWrongChain(currentChain !== 11155111)
        } catch (error) {
          console.error("Failed to get chain ID:", error)
        }
      }
    }

    checkChain()

    if (typeof window.ethereum !== "undefined") {
      const handleChainChanged = (newChainId: string) => {
        const id = parseInt(newChainId, 16)
        setChainId(id)
        setIsWrongChain(id !== 11155111)
      }

      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          console.log("[Header] Account changed to:", accounts[0])
          onWalletConnect(accounts[0])
          checkChain()
        } else {
          console.log("[Header] Wallet disconnected")
          onWalletConnect("")
          setChainId(null)
        }
      }

      window.ethereum.on("chainChanged", handleChainChanged)
      window.ethereum.on("accountsChanged", handleAccountsChanged)

      return () => {
        window.ethereum?.removeListener("chainChanged", handleChainChanged)
        window.ethereum?.removeListener("accountsChanged", handleAccountsChanged)
      }
    }
  }, [walletAddress, onWalletConnect])

  const handleConnectWalletExtension = async (provider: any) => {
    try {
      // Request account access
      const accounts = await provider.request({
        method: "eth_requestAccounts",
      })
      onWalletConnect(accounts[0])
      setShowWalletModal(false)
      // Check chain after connecting
      const currentChain = await getCurrentChainId()
      setChainId(currentChain)
      setIsWrongChain(currentChain !== 11155111)
    } catch (error: any) {
      console.error("[Header] Failed to connect:", error)
      alert(`Failed to connect: ${error.message || "User rejected"}`)
    }
  }

  const handleConnectWallet = () => {
    if (typeof window.ethereum === "undefined") {
      alert("No Web3 wallet found. Please install MetaMask or another Web3 wallet.")
      return
    }
    setShowWalletModal(true)
  }

  const handleDisconnectWallet = async () => {
    try {
      await disconnectWallet()
      onWalletConnect("")
      setChainId(null)
      setIsWrongChain(false)
    } catch (error: any) {
      console.error("[Header] Failed to disconnect:", error)
    }
  }

  const handleSwitchChain = async () => {
    try {
      await switchToSepolia()
      const currentChain = await getCurrentChainId()
      setChainId(currentChain)
      setIsWrongChain(currentChain !== 11155111)
    } catch (error: any) {
      console.error("[Header] Failed to switch chain:", error)
      alert(`Failed to switch chain: ${error.message}`)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 lg:px-8 py-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary flex items-center justify-center blue-glow">
            <span className="text-primary font-bold text-xl">IG</span>
          </div>
          <div>
            <h1 className="text-xl font-bold metallic-text tracking-wider">INVICTUS DAO</h1>
            <p className="text-xs text-muted-foreground">
              {isWrongChain ? (
                <span className="text-destructive">Wrong Network - Please switch to Sepolia</span>
              ) : (
                "Sepolia Testnet Governance"
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {walletAddress && isWrongChain && (
            <Button
              onClick={handleSwitchChain}
              className="bg-destructive hover:bg-destructive/90 text-white font-semibold"
            >
              <Network className="w-4 h-4 mr-2" />
              Switch to Sepolia
            </Button>
          )}

          {!walletAddress ? (
            <>
              <Button
                onClick={handleConnectWallet}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold blue-glow transition-all"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>

              {/* Wallet Selection Modal using Portal */}
              <WalletModal
                isOpen={showWalletModal}
                onClose={() => setShowWalletModal(false)}
                wallets={installedWallets}
                onSelectWallet={handleConnectWalletExtension}
              />
            </>
          ) : (
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">{formatAddress(walletAddress)}</p>
                <p className="text-xs text-muted-foreground">
                  {chainId === 11155111 ? "Sepolia" : `Chain ${chainId}`}
                </p>
              </div>
              <Button
                onClick={handleDisconnectWallet}
                variant="outline"
                className="border-primary/50 text-primary hover:bg-primary/10 font-semibold"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
