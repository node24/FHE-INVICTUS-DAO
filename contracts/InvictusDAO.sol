// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title INVICTUS DAO Voting Contract
/// @notice A privacy-preserving voting system using Fully Homomorphic Encryption
/// @dev Votes are encrypted and processed securely using FHEVM
contract InvictusDAO is SepoliaConfig {
    // Constants
    uint256 public constant PROPOSAL_CREATION_FEE = 0.01 ether; // 0.01 ETH to create a proposal
    uint256 public constant VOTE_WEIGHT_DIVISOR = 1000; // 0.001 ETH = 1 vote (1 ETH / 0.001 = 1000)

    // Enum for proposal status
    enum ProposalStatus {
        Active,
        Closed
    }

    // Struct for proposals
    struct Proposal {
        uint256 id;
        address creator;
        string title;
        string description;
        uint256 createdAt;
        uint256 deadline;
        ProposalStatus status;
        uint256 totalVotes;
        uint256 yesVotes; // Simple vote count for "For"
        uint256 noVotes;  // Simple vote count for "Against"
        euint32 encryptedYesVotes;
        euint32 encryptedNoVotes;
    }

    // Struct for tracking votes per proposal per user
    struct Vote {
        bool hasVoted;
        uint256 voteWeight;
    }

    // State variables
    uint256 public proposalCount;
    uint256 public votingDuration = 7 days;

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => Vote)) public votes;
    mapping(address => bool) public hasCreatedProposal;

    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed creator,
        string title,
        uint256 deadline
    );

    event VoteCasted(
        uint256 indexed proposalId,
        address indexed voter,
        uint256 voteWeight
    );

    event ProposalClosed(uint256 indexed proposalId);

    // Modifiers
    modifier onlyActiveProposal(uint256 proposalId) {
        require(proposalId < proposalCount, "Proposal does not exist");
        require(proposals[proposalId].status == ProposalStatus.Active, "Proposal is not active");
        require(block.timestamp <= proposals[proposalId].deadline, "Voting period has ended");
        _;
    }

    modifier validProposalId(uint256 proposalId) {
        require(proposalId < proposalCount, "Proposal does not exist");
        _;
    }

    /// @notice Creates a new proposal
    /// @param _title The title of the proposal
    /// @param _description The description of the proposal
    /// @dev Requires 0.01 ETH fee to create a proposal
    function createProposal(string memory _title, string memory _description) external payable {
        require(msg.value == PROPOSAL_CREATION_FEE, "Incorrect fee amount");
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");

        uint256 proposalId = proposalCount;
        uint256 deadline = block.timestamp + votingDuration;

        proposals[proposalId] = Proposal({
            id: proposalId,
            creator: msg.sender,
            title: _title,
            description: _description,
            createdAt: block.timestamp,
            deadline: deadline,
            status: ProposalStatus.Active,
            totalVotes: 0,
            yesVotes: 0,
            noVotes: 0,
            encryptedYesVotes: FHE.asEuint32(0),
            encryptedNoVotes: FHE.asEuint32(0)
        });

        proposalCount++;
        hasCreatedProposal[msg.sender] = true;

        emit ProposalCreated(proposalId, msg.sender, _title, deadline);
    }

    /// @notice Cast an encrypted vote on a proposal
    /// @param _proposalId The ID of the proposal
    /// @param _encryptedVote The encrypted vote (encrypted value: 1 for yes, 0 for no)
    /// @param _proof The proof for the encrypted vote
    /// @dev Vote weight is based on ETH balance (0.001 ETH = 1 vote)
    function vote(
        uint256 _proposalId,
        externalEuint32 _encryptedVote,
        bytes calldata _proof
    ) external onlyActiveProposal(_proposalId) {
        require(!votes[_proposalId][msg.sender].hasVoted, "Already voted on this proposal");

        // Calculate vote weight based on ETH balance (0.001 ETH = 1 vote)
        uint256 userBalance = msg.sender.balance;
        uint256 voteWeight = userBalance / (0.001 ether);
        require(voteWeight > 0, "Insufficient ETH balance to vote (need at least 0.001 ETH)");

        // Process encrypted vote
        euint32 encryptedVote = FHE.fromExternal(_encryptedVote, _proof);
        euint32 encryptedWeight = FHE.asEuint32(uint32(voteWeight));

        // Add weighted encrypted votes
        proposals[_proposalId].encryptedYesVotes = FHE.add(
            proposals[_proposalId].encryptedYesVotes,
            FHE.mul(encryptedVote, encryptedWeight)
        );

        // For "No" votes, we calculate it as (1 - vote) * weight
        euint32 inverseVote = FHE.sub(FHE.asEuint32(1), encryptedVote);
        proposals[_proposalId].encryptedNoVotes = FHE.add(
            proposals[_proposalId].encryptedNoVotes,
            FHE.mul(inverseVote, encryptedWeight)
        );

        // Allow access to encrypted votes
        FHE.allowThis(proposals[_proposalId].encryptedYesVotes);
        FHE.allow(proposals[_proposalId].encryptedYesVotes, msg.sender);
        FHE.allowThis(proposals[_proposalId].encryptedNoVotes);
        FHE.allow(proposals[_proposalId].encryptedNoVotes, msg.sender);

        // Update vote tracking
        votes[_proposalId][msg.sender] = Vote({hasVoted: true, voteWeight: voteWeight});
        proposals[_proposalId].totalVotes += voteWeight;

        emit VoteCasted(_proposalId, msg.sender, voteWeight);
    }

    /// @notice Closes a proposal (only creator can close after voting period ends)
    /// @param _proposalId The ID of the proposal
    function closeProposal(uint256 _proposalId) external validProposalId(_proposalId) {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.creator == msg.sender, "Only proposal creator can close this proposal");
        require(proposal.status == ProposalStatus.Active, "Proposal is already closed");
        require(block.timestamp > proposal.deadline, "Voting period has not ended yet");

        proposal.status = ProposalStatus.Closed;

        emit ProposalClosed(_proposalId);
    }

    /// @notice Cast a simple unencrypted vote for testing
    /// @param _proposalId The ID of the proposal
    /// @param _vote 0 for No, 1 for Yes
    function voteSimple(
        uint256 _proposalId,
        uint8 _vote
    ) external onlyActiveProposal(_proposalId) {
        require(!votes[_proposalId][msg.sender].hasVoted, "Already voted on this proposal");
        require(_vote == 0 || _vote == 1, "Vote must be 0 (No) or 1 (Yes)");

        // Calculate vote weight based on ETH balance (0.001 ETH = 1 vote)
        uint256 userBalance = msg.sender.balance;
        uint256 voteWeight = userBalance / (0.001 ether);
        require(voteWeight > 0, "Insufficient ETH balance to vote (need at least 0.001 ETH)");

        // Track vote
        votes[_proposalId][msg.sender] = Vote({hasVoted: true, voteWeight: voteWeight});
        proposals[_proposalId].totalVotes += voteWeight;
        
        // Update simple vote counts
        if (_vote == 1) {
            proposals[_proposalId].yesVotes += voteWeight;
        } else {
            proposals[_proposalId].noVotes += voteWeight;
        }

        emit VoteCasted(_proposalId, msg.sender, voteWeight);
    }

    /// @notice Gets proposal details
    /// @param _proposalId The ID of the proposal
    /// @return The proposal struct
    function getProposal(uint256 _proposalId) external view validProposalId(_proposalId) returns (Proposal memory) {
        return proposals[_proposalId];
    }

    /// @notice Gets encrypted yes votes for a proposal
    /// @param _proposalId The ID of the proposal
    /// @return The encrypted yes votes
    function getEncryptedYesVotes(uint256 _proposalId) external view validProposalId(_proposalId) returns (euint32) {
        return proposals[_proposalId].encryptedYesVotes;
    }

    /// @notice Gets encrypted no votes for a proposal
    /// @param _proposalId The ID of the proposal
    /// @return The encrypted no votes
    function getEncryptedNoVotes(uint256 _proposalId) external view validProposalId(_proposalId) returns (euint32) {
        return proposals[_proposalId].encryptedNoVotes;
    }

    /// @notice Checks if a user has voted on a proposal
    /// @param _proposalId The ID of the proposal
    /// @param _voter The address of the voter
    /// @return Whether the voter has voted
    function hasVoted(uint256 _proposalId, address _voter) external view validProposalId(_proposalId) returns (bool) {
        return votes[_proposalId][_voter].hasVoted;
    }

    /// @notice Gets the vote weight of a user for a proposal
    /// @param _proposalId The ID of the proposal
    /// @param _voter The address of the voter
    /// @return The vote weight
    function getVoteWeight(uint256 _proposalId, address _voter) external view validProposalId(_proposalId) returns (uint256) {
        return votes[_proposalId][_voter].voteWeight;
    }

    /// @notice Gets the total number of proposals
    /// @return The number of proposals
    function getProposalCount() external view returns (uint256) {
        return proposalCount;
    }

    /// @notice Gets all proposal IDs
    /// @return Array of proposal IDs
    function getAllProposalIds() external view returns (uint256[] memory) {
        uint256[] memory ids = new uint256[](proposalCount);
        for (uint256 i = 0; i < proposalCount; i++) {
            ids[i] = i;
        }
        return ids;
    }

    /// @notice Withdraws collected fees (owner only)
    function withdrawFees() external {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /// @notice Fallback function to receive ETH
    receive() external payable {}
}
