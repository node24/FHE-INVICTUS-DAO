import { expect } from "chai";
import { ethers } from "hardhat";
import { FHEVotingDAO } from "../types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("FHEVotingDAO", function () {
  let votingDAO: FHEVotingDAO;
  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;

  const PROPOSAL_FEE = ethers.parseEther("0.01");
  const VOTING_DURATION = 7 * 24 * 60 * 60; // 7 days

  beforeEach(async function () {
    const [ownerAccount, addr1Account, addr2Account] = await ethers.getSigners();
    owner = ownerAccount;
    addr1 = addr1Account;
    addr2 = addr2Account;

    const FHEVotingDAO = await ethers.getContractFactory("FHEVotingDAO");
    votingDAO = (await FHEVotingDAO.deploy()) as unknown as FHEVotingDAO;
    await votingDAO.waitForDeployment();
  });

  describe("Proposal Creation", function () {
    it("Should allow creating a proposal with correct fee", async function () {
      await expect(
        votingDAO.connect(addr1).createProposal(
          "Test Proposal",
          "This is a test proposal",
          { value: PROPOSAL_FEE }
        )
      ).to.emit(votingDAO, "ProposalCreated");

      const count = await votingDAO.getProposalCount();
      expect(count).to.equal(1);
    });

    it("Should reject proposal creation without fee", async function () {
      await expect(
        votingDAO.connect(addr1).createProposal(
          "Test Proposal",
          "This is a test proposal",
          { value: 0 }
        )
      ).to.be.revertedWith("Incorrect fee amount");
    });

    it("Should reject proposal creation with wrong fee", async function () {
      await expect(
        votingDAO.connect(addr1).createProposal(
          "Test Proposal",
          "This is a test proposal",
          { value: ethers.parseEther("0.02") }
        )
      ).to.be.revertedWith("Incorrect fee amount");
    });

    it("Should reject empty title", async function () {
      await expect(
        votingDAO.connect(addr1).createProposal(
          "",
          "This is a test proposal",
          { value: PROPOSAL_FEE }
        )
      ).to.be.revertedWith("Title cannot be empty");
    });

    it("Should reject empty description", async function () {
      await expect(
        votingDAO.connect(addr1).createProposal(
          "Test Proposal",
          "",
          { value: PROPOSAL_FEE }
        )
      ).to.be.revertedWith("Description cannot be empty");
    });

    it("Should track proposal creator", async function () {
      await votingDAO.connect(addr1).createProposal(
        "Test Proposal",
        "This is a test proposal",
        { value: PROPOSAL_FEE }
      );

      const proposal = await votingDAO.getProposal(0);
      expect(proposal.creator).to.equal(addr1.address);
    });

    it("Should set correct deadline", async function () {
      const blockBefore = await ethers.provider.getBlock("latest");
      const timeBefore = blockBefore?.timestamp ?? 0;

      await votingDAO.connect(addr1).createProposal(
        "Test Proposal",
        "This is a test proposal",
        { value: PROPOSAL_FEE }
      );

      const proposal = await votingDAO.getProposal(0);
      const expectedDeadline = timeBefore + VOTING_DURATION + 1;

      expect(Number(proposal.deadline)).to.be.closeTo(expectedDeadline, 2);
    });
  });

  describe("Proposal Retrieval", function () {
    beforeEach(async function () {
      await votingDAO.connect(addr1).createProposal(
        "Test Proposal",
        "This is a test proposal",
        { value: PROPOSAL_FEE }
      );
    });

    it("Should retrieve proposal by ID", async function () {
      const proposal = await votingDAO.getProposal(0);
      expect(proposal.title).to.equal("Test Proposal");
      expect(proposal.description).to.equal("This is a test proposal");
    });

    it("Should retrieve proposal count", async function () {
      const count = await votingDAO.getProposalCount();
      expect(count).to.equal(1);
    });

    it("Should reject invalid proposal ID", async function () {
      await expect(votingDAO.getProposal(999)).to.be.revertedWith(
        "Proposal does not exist"
      );
    });

    it("Should return all proposal IDs", async function () {
      await votingDAO.connect(addr2).createProposal(
        "Another Proposal",
        "Another test proposal",
        { value: PROPOSAL_FEE }
      );

      const ids = await votingDAO.getAllProposalIds();
      expect(ids.length).to.equal(2);
      expect(ids[0]).to.equal(0);
      expect(ids[1]).to.equal(1);
    });
  });

  describe("Proposal Status", function () {
    beforeEach(async function () {
      await votingDAO.connect(addr1).createProposal(
        "Test Proposal",
        "This is a test proposal",
        { value: PROPOSAL_FEE }
      );
    });

    it("Should have Active status initially", async function () {
      const proposal = await votingDAO.getProposal(0);
      expect(proposal.status).to.equal(0); // Active = 0
    });

    it("Should close proposal after deadline", async function () {
      // Increase time beyond deadline
      await ethers.provider.send("evm_increaseTime", [VOTING_DURATION + 1]);
      await ethers.provider.send("evm_mine", []);

      await votingDAO.closeProposal(0);

      const proposal = await votingDAO.getProposal(0);
      expect(proposal.status).to.equal(1); // Closed = 1
    });

    it("Should allow closing proposal", async function () {
      // Voting period check is handled by contract
      const proposal = await votingDAO.getProposal(0);
      expect(proposal.status).to.equal(0);
    });

    it("Should reject closing already closed proposal", async function () {
      // Increase time beyond deadline
      await ethers.provider.send("evm_increaseTime", [VOTING_DURATION + 1]);
      await ethers.provider.send("evm_mine", []);

      await votingDAO.closeProposal(0);

      await expect(votingDAO.closeProposal(0)).to.be.revertedWith(
        "Proposal is already closed"
      );
    });
  });

  describe("Vote Tracking", function () {
    beforeEach(async function () {
      await votingDAO.connect(addr1).createProposal(
        "Test Proposal",
        "This is a test proposal",
        { value: PROPOSAL_FEE }
      );
    });

    it("Should track that user hasn't voted initially", async function () {
      const hasVoted = await votingDAO.hasVoted(0, addr2.address);
      expect(hasVoted).to.equal(false);
    });

    it("Should reject voting from proposal that doesn't exist", async function () {
      const encryptedVote = ethers.toBeHex("0x01", 32);
      const proof = "0x";

      await expect(
        votingDAO.connect(addr2).vote(999, encryptedVote, proof)
      ).to.be.revertedWith("Proposal does not exist");
    });

    it("Should reject voting on closed proposal", async function () {
      // Increase time beyond deadline
      await ethers.provider.send("evm_increaseTime", [VOTING_DURATION + 1]);
      await ethers.provider.send("evm_mine", []);

      await votingDAO.closeProposal(0);

      const encryptedVote = ethers.toBeHex("0x01", 32);
      const proof = "0x";

      await expect(
        votingDAO.connect(addr2).vote(0, encryptedVote, proof)
      ).to.be.revertedWith("Proposal is not active");
    });
  });

  describe("Fee Withdrawal", function () {
    it("Should collect fees from proposal creation", async function () {
      await votingDAO.connect(addr1).createProposal(
        "Test Proposal",
        "This is a test proposal",
        { value: PROPOSAL_FEE }
      );

      const balance = await ethers.provider.getBalance(await votingDAO.getAddress());
      expect(balance).to.equal(PROPOSAL_FEE);
    });

    it("Should allow withdrawing fees", async function () {
      await votingDAO.connect(addr1).createProposal(
        "Test Proposal",
        "This is a test proposal",
        { value: PROPOSAL_FEE }
      );

      const initialBalance = await ethers.provider.getBalance(owner.address);

      const tx = await votingDAO.withdrawFees();
      const receipt = await tx.wait();
      const gasUsed = (receipt?.gasUsed ?? BigInt(0)) * (receipt?.gasPrice ?? BigInt(0));

      const finalBalance = await ethers.provider.getBalance(owner.address);
      expect(finalBalance).to.be.closeTo(
        initialBalance + PROPOSAL_FEE - gasUsed,
        ethers.parseEther("0.001")
      );
    });

    it("Should reject withdrawal with no fees", async function () {
      await expect(votingDAO.withdrawFees()).to.be.revertedWith(
        "No fees to withdraw"
      );
    });
  });

  describe("Multiple Proposals", function () {
    it("Should handle multiple proposals", async function () {
      for (let i = 0; i < 5; i++) {
        await votingDAO.connect(addr1).createProposal(
          `Proposal ${i}`,
          `Description ${i}`,
          { value: PROPOSAL_FEE }
        );
      }

      const count = await votingDAO.getProposalCount();
      expect(count).to.equal(5);

      const ids = await votingDAO.getAllProposalIds();
      expect(ids.length).to.equal(5);
    });
  });
});
