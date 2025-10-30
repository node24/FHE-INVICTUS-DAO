"use client"

import { X } from "lucide-react"
import { createPortal } from "react-dom"

interface Wallet {
  name: string
  icon: string
  provider: any
}

interface WalletModalProps {
  isOpen: boolean
  onClose: () => void
  wallets: Wallet[]
  onSelectWallet: (provider: any) => void
}

export function WalletModal({ isOpen, onClose, wallets, onSelectWallet }: WalletModalProps) {
  if (!isOpen) return null

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-primary/30 rounded-lg p-6 w-full mx-4 max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Select Wallet</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {wallets.length > 0 ? (
          <div className="space-y-2">
            {wallets.map((wallet, index) => (
              <button
                key={index}
                onClick={() => onSelectWallet(wallet.provider)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-primary/20 hover:border-primary/50 hover:bg-primary/10 transition-all text-left group"
              >
                <span className="text-2xl">{wallet.icon}</span>
                <div className="flex-1">
                  <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {wallet.name}
                  </p>
                  <p className="text-xs text-muted-foreground">Click to connect</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">
              No Web3 wallets detected. Please install MetaMask or another wallet extension.
            </p>
            <a
              href="https://metamask.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-sm"
            >
              Install MetaMask →
            </a>
          </div>
        )}
      </div>
    </div>
  )

  // Use createPortal to render modal outside of header
  if (typeof document !== "undefined") {
    return createPortal(content, document.body)
  }

  return null
}
