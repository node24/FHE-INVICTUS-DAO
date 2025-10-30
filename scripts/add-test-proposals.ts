import { ethers } from "hardhat"

async function main() {
  const [signer] = await ethers.getSigners()
  console.log("[Script] Deployer address:", signer.address)

  const contractAddress = "0x6eBCcA38597391110950899bCBf8572c74ED088b"
  const contract = await ethers.getContractAt("FHEVotingDAO", contractAddress, signer)

  const proposalFee = ethers.parseEther("0.01")

  const testProposals = [
    {
      title: "Increase Community Fund Allocation",
      description: "Proposal to increase monthly community fund from 50 ETH to 75 ETH to support more projects and initiatives.",
    },
    {
      title: "Implement New Governance Token",
      description: "Introduce a governance token to enable better vote delegation and community participation in decision-making.",
    },
    {
      title: "Establish Developer Grant Program",
      description: "Create a grant program for developers building on our platform with initial budget of 100 ETH for Q1.",
    },
    {
      title: "Upgrade Smart Contract Security",
      description: "Conduct comprehensive security audit and implement recommended improvements for all core contracts.",
    },
    {
      title: "Partner with Web3 Analytics Platform",
      description: "Establish partnership with analytics platform to provide better insights on DAO metrics and user behavior.",
    },
  ]

  console.log("\n[Script] Creating", testProposals.length, "test proposals...\n")

  for (let i = 0; i < testProposals.length; i++) {
    try {
      const proposal = testProposals[i]
      console.log(`[Script] Creating proposal ${i + 1}/${testProposals.length}: "${proposal.title}"...`)

      const tx = await contract.createProposal(proposal.title, proposal.description, {
        value: proposalFee,
      })

      const receipt = await tx.wait()
      console.log(`[Script] ✅ Proposal ${i + 1} created! Tx: ${tx.hash}`)
    } catch (error: any) {
      console.error(`[Script] ❌ Failed to create proposal ${i + 1}:`, error.message)
    }
  }

  // Verify proposals count
  const count = await contract.getProposalCount()
  console.log("\n[Script] Total proposals in contract:", count.toString())

  console.log("\n[Script] ✅ Test proposals creation complete!")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
