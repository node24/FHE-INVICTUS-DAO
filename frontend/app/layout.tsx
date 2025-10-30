import type React from "react"
import { Orbitron, Rajdhani } from "next/font/google"
import "./globals.css"

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  weight: ["400", "500", "600", "700", "800", "900"],
})

const rajdhani = Rajdhani({
  subsets: ["latin"],
  variable: "--font-rajdhani",
  weight: ["300", "400", "500", "600", "700"],
})

export const metadata = {
  title: "IG DAO - Encrypted Voting",
  description: "Invictus Gaming style DAO with FHE encrypted voting",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${orbitron.variable} ${rajdhani.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
