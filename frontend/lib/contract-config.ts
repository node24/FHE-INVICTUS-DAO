/**
 * INVICTUS DAO Contract Configuration
 * Contains contract addresses, ABIs, and deployment info
 */

// Sepolia Testnet Configuration
export const INVICTUS_CONFIG = {
  network: "sepolia",
  chainId: 11155111,
  chainName: "Sepolia Testnet",
  rpcUrl: "https://sepolia.infura.io/v3/36a0b2650cd14cf2b3a13e7497a65b9f",
  fallbackRpcUrl: "https://rpc.sepolia.org",
  blockExplorer: "https://sepolia.etherscan.io",
} as const

// INVICTUS DAO Contract Address
export const INVICTUS_DAO_ADDRESS = process.env.NEXT_PUBLIC_VOTING_DAO_ADDRESS || "0x151437944E7C67A1a6D3910aC0A8de8F2B5fc016"

// INVICTUS DAO ABI (Minimal for frontend use)
export const INVICTUS_DAO_ABI = [
  "function voteSimple(uint256 proposalId, uint8 vote) external",
  "function vote(uint256 proposalId, bytes encryptedVote, bytes proof) external",
  "function createProposal(string title, string description) external payable",
  "function closeProposal(uint256 proposalId) external",
  "function getProposal(uint256 proposalId) external view returns (tuple(uint256 id, address creator, string title, string description, uint256 createdAt, uint256 deadline, uint8 status, uint256 totalVotes, uint256 yesVotes, uint256 noVotes, bytes32 encryptedYesVotes, bytes32 encryptedNoVotes))",
  "function getProposalCount() external view returns (uint256)",
  "function hasVoted(uint256 proposalId, address voter) external view returns (bool)",
  "function getVoteWeight(uint256 proposalId, address voter) external view returns (uint256)",
  "function getAllProposalIds() external view returns (uint256[])",
  "function withdrawFees() external",
  "function PROPOSAL_CREATION_FEE() external view returns (uint256)",
  "function VOTE_WEIGHT_DIVISOR() external view returns (uint256)",
  "event ProposalCreated(uint256 indexed proposalId, address indexed creator, string title, uint256 deadline)",
  "event VoteCasted(uint256 indexed proposalId, address indexed voter, uint256 voteWeight)",
  "event ProposalClosed(uint256 indexed proposalId)",
]

// Proposal Status Enum
export enum ProposalStatus {
  Active = 0,
  Closed = 1,
}

// Vote Constants
export const VOTE_CONSTANTS = {
  PROPOSAL_CREATION_FEE: BigInt("10000000000000000"), // 0.01 ETH in wei
  MIN_VOTE_BALANCE: BigInt("1000000000000000"),       // 0.001 ETH in wei (minimum to vote)
  MIN_CREATE_BALANCE: BigInt("20000000000000000"),    // 0.02 ETH (0.01 fee + gas)
  VOTE_WEIGHT_DIVISOR: BigInt("1000000000000000"),    // 1e15 wei = 0.001 ETH, so dividing balance by this gives vote weight
} as const

// Utility function to get contract ABI as string array (for ethers.js Contract)
export function getContractABI(): string[] {
  return INVICTUS_DAO_ABI
}

// Utility function to validate contract address
export function isValidContractAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

// Export contract info for Vercel deployment
export const CONTRACT_INFO = {
  name: "InvictusDAO",
  version: "1.0.0",
  network: INVICTUS_CONFIG.network,
  address: INVICTUS_DAO_ADDRESS,
  chainId: INVICTUS_CONFIG.chainId,
  blockExplorer: `${INVICTUS_CONFIG.blockExplorer}/address/${INVICTUS_DAO_ADDRESS}`,
}
