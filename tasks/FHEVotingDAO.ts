import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

// Task to interact with FHEVotingDAO contract
task("voting:get-proposals", "Get all proposals from FHEVotingDAO")
  .addParam("contract", "The FHEVotingDAO contract address")
  .setAction(async (args: { contract: string }, hre: HardhatRuntimeEnvironment) => {
    const votingDAO = await hre.ethers.getContractAt("FHEVotingDAO", args.contract);

    const count = await votingDAO.getProposalCount();
    console.log(`Total proposals: ${count}`);

    for (let i = 0; i < count; i++) {
      const proposal = await votingDAO.getProposal(i);
      console.log(`\nProposal ${i}:`);
      console.log(`  Title: ${proposal.title}`);
      console.log(`  Creator: ${proposal.creator}`);
      console.log(`  Status: ${Number(proposal.status) === 0 ? "Active" : "Closed"}`);
      console.log(`  Total Votes: ${proposal.totalVotes}`);
      console.log(`  Created: ${new Date(Number(proposal.createdAt) * 1000).toLocaleString()}`);
      console.log(`  Deadline: ${new Date(Number(proposal.deadline) * 1000).toLocaleString()}`);
    }
  });

// Task to create a proposal
task("voting:create-proposal", "Create a new proposal in FHEVotingDAO")
  .addParam("contract", "The FHEVotingDAO contract address")
  .addParam("title", "The proposal title")
  .addParam("description", "The proposal description")
  .setAction(
    async (
      args: { contract: string; title: string; description: string },
      hre: HardhatRuntimeEnvironment
    ) => {
      const votingDAO = await hre.ethers.getContractAt("FHEVotingDAO", args.contract);

      const fee = hre.ethers.parseEther("0.01");
      const tx = await votingDAO.createProposal(args.title, args.description, { value: fee });

      console.log(`Creating proposal...`);
      const receipt = await tx.wait();
      console.log(`✓ Proposal created in transaction: ${receipt?.hash}`);

      const count = await votingDAO.getProposalCount();
      console.log(`Total proposals now: ${count}`);
    }
  );

// Task to check proposal fee balance
task("voting:get-balance", "Get ETH balance of FHEVotingDAO contract")
  .addParam("contract", "The FHEVotingDAO contract address")
  .setAction(async (args: { contract: string }, hre: HardhatRuntimeEnvironment) => {
    const provider = hre.ethers.provider;
    const balance = await provider.getBalance(args.contract);
    console.log(`Contract balance: ${hre.ethers.formatEther(balance)} ETH`);
  });

// Task to withdraw collected fees
task("voting:withdraw-fees", "Withdraw collected proposal fees from FHEVotingDAO")
  .addParam("contract", "The FHEVotingDAO contract address")
  .setAction(async (args: { contract: string }, hre: HardhatRuntimeEnvironment) => {
    const votingDAO = await hre.ethers.getContractAt("FHEVotingDAO", args.contract);

    const tx = await votingDAO.withdrawFees();
    console.log(`Withdrawing fees...`);
    const receipt = await tx.wait();
    console.log(`✓ Fees withdrawn in transaction: ${receipt?.hash}`);
  });

// Task to get user's vote weight on a proposal
// Task to get user's vote weight on a proposal
task("voting:get-vote-weight", "Get user's vote weight on a proposal")
  .addParam("contract", "The FHEVotingDAO contract address")
  .addParam("proposalid", "The proposal ID")
  .addOptionalParam("voter", "The voter address (defaults to signer)")
  .setAction(
    async (
      args: { contract: string; proposalid: string; voter?: string },
      hre: HardhatRuntimeEnvironment
    ) => {
      const votingDAO = await hre.ethers.getContractAt("FHEVotingDAO", args.contract);

      let voterAddress = args.voter;
      if (!voterAddress) {
        const signer = (await hre.ethers.getSigners())[0];
        voterAddress = await signer.getAddress();
      }

      const weight = await votingDAO.getVoteWeight(args.proposalid, voterAddress);
      console.log(`Vote weight for ${voterAddress}: ${weight}`);
    }
  );

// Task to check if user has voted
task("voting:has-voted", "Check if user has voted on a proposal")
  .addParam("contract", "The FHEVotingDAO contract address")
  .addParam("proposalid", "The proposal ID")
  .addOptionalParam("voter", "The voter address (defaults to signer)")
  .setAction(
    async (
      args: { contract: string; proposalid: string; voter?: string },
      hre: HardhatRuntimeEnvironment
    ) => {
      const votingDAO = await hre.ethers.getContractAt("FHEVotingDAO", args.contract);

      let voterAddress = args.voter;
      if (!voterAddress) {
        const signer = (await hre.ethers.getSigners())[0];
        voterAddress = await signer.getAddress();
      }

      const hasVoted = await votingDAO.hasVoted(args.proposalid, voterAddress);
      console.log(`Has ${voterAddress} voted on proposal ${args.proposalid}? ${hasVoted}`);
    }
  );
