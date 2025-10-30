# INVICTUS DAO - Privacy-Preserving Voting System

![Invictus DAO](https://img.shields.io/badge/Invictus-DAO-blue?style=flat-square)
![License](https://img.shields.io/badge/License-BSD--3--Clause-green?style=flat-square)
![Network](https://img.shields.io/badge/Network-Sepolia-purple?style=flat-square)
![FHE Enabled](https://img.shields.io/badge/FHE-Enabled-success?style=flat-square)

## 📋 Project Description

**INVICTUS DAO** is a decentralized voting application built on Ethereum Sepolia testnet, leveraging **Fully Homomorphic Encryption (FHE)** technology from Zama to ensure vote privacy. The system uses **@zama-fhe/relayer-sdk** for secure FHE operations on-chain, enabling encrypted votes that remain private while maintaining transparent aggregation.

### 🎯 Core Features

✅ **Privacy-First Voting** - Votes encrypted with FHE before blockchain submission  
✅ **ETH-Weighted Voting** - Voting power based on ETH balance (0.001 ETH = 1 vote)  
✅ **Transparent Results** - Public results but individual votes remain encrypted  
✅ **User-Friendly Interface** - Modern React frontend with MetaMask integration  
✅ **Secure Smart Contracts** - Solidity contracts with FHE operations  
✅ **FHE-Enabled SDK** - Uses @zama-fhe/relayer-sdk for encrypted voting operations  

### 💡 Impact

INVICTUS DAO enables:
- Create proposals with 0.01 ETH fee
- Cast votes publicly or privately (encrypted with FHE via @zama-fhe/relayer-sdk)
- View voting results in real-time
- Ensure individual privacy in decentralized governance
- Utilize Zama's FHE relayer for secure on-chain encryption

---

## 🚀 User Guide

### Prerequisites

- **Node.js**: Version 20 or higher
- **npm**: Version 7 or higher
- **MetaMask**: Browser extension installed
- **Sepolia ETH**: Available from [Sepolia Faucet](https://sepolia-faucet.pk910.de/)

### Installation

#### 1. Clone Repository
```bash
git clone https://github.com/yourusername/invictus-dao.git
cd invictus-dao
```

#### 2. Install Dependencies
```bash
npm install
cd frontend && npm install && cd ..
```

**Note**: Frontend includes **@zama-fhe/relayer-sdk** for encrypted voting operations

#### 3. Configure Environment Variables
```bash
npx hardhat vars set MNEMONIC
npx hardhat vars set INFURA_API_KEY
npx hardhat vars set ETHERSCAN_API_KEY  # Optional
```

#### 4. Compile & Test
```bash
npm run compile
npm run test
```

### Deployment

#### Deploy to Sepolia Testnet
```bash
npm run deploy:sepolia
```

Copy the contract address from output.

#### Update Frontend Config
1. Open `frontend/.env.local`
2. Update `NEXT_PUBLIC_VOTING_DAO_ADDRESS` with contract address

#### Run Frontend
```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000`

### Usage

#### Connect Wallet
1. Click "Connect Wallet" button
2. Select MetaMask
3. Approve connection
4. Ensure Sepolia network is selected (chainId: 11155111)

#### Create Proposal
1. Fill in title and description
2. Click "Create Proposal"
3. Confirm transaction (0.01 ETH fee)
4. Wait for confirmation

#### Cast Vote
1. Select proposal to vote on
2. Click "Vote For" or "Vote Against"
3. Confirm transaction
4. Results update automatically

#### View Results
- Vote counts display in real-time
- Auto-update after each vote
- Individual votes encrypted with FHE (@zama-fhe/relayer-sdk)

---

## 📋 Smart Contract Description

### Contract: InvictusDAO
**Address**: `0x151437944E7C67A1a6D3910aC0A8de8F2B5fc016` (Sepolia)  
**Network**: Ethereum Sepolia Testnet  
**Total Lines**: 267  
**Security**: FHE-enabled with vote encryption  

### Main Functions

#### 1. `createProposal(string title, string description)`
- **Purpose**: Create new proposal
- **Fee**: 0.01 ETH (msg.value)
- **Voting Duration**: 7 days
- **Requirements**: Title and description must not be empty
- **Emits**: `ProposalCreated` event

```solidity
function createProposal(string memory _title, string memory _description) external payable
```

#### 2. `voteSimple(uint256 proposalId, uint8 vote)`
- **Purpose**: Unencrypted vote (for testing)
- **Parameters**:
  - `proposalId`: Proposal ID
  - `vote`: 0 = No, 1 = Yes
- **Vote Weight**: 0.001 ETH = 1 vote
- **Requirements**:
  - Proposal must be active
  - User must not have voted
  - Minimum 0.001 ETH balance

```solidity
function voteSimple(uint256 _proposalId, uint8 _vote) external
```

#### 3. `vote(uint256 proposalId, bytes encryptedVote, bytes proof)`
- **Purpose**: Encrypted vote using FHE (@zama-fhe/relayer-sdk)
- **Parameters**:
  - `proposalId`: Proposal ID
  - `encryptedVote`: Encrypted vote data
  - `proof`: Proof for validation
- **Security**: Fully encrypted vote
- **Requirements**: Proposal must be active

```solidity
function vote(uint256 _proposalId, externalEuint32 _encryptedVote, bytes calldata _proof) external
```

#### 4. `getProposal(uint256 proposalId)` - View
- **Purpose**: Get proposal details
- **Returns**: Proposal struct
- **Gas**: ~50,000

```solidity
function getProposal(uint256 proposalId) external view returns (Proposal memory)
```

#### 5. `getProposalCount()` - View
- **Purpose**: Get total proposals
- **Returns**: uint256

```solidity
function getProposalCount() external view returns (uint256)
```

#### 6. `hasVoted(uint256 proposalId, address voter)` - View
- **Purpose**: Check if user voted
- **Parameters**: Proposal ID and wallet address
- **Returns**: true/false

```solidity
function hasVoted(uint256 proposalId, address voter) external view returns (bool)
```

#### 7. `getVoteWeight(uint256 proposalId, address voter)` - View
- **Purpose**: Get user vote weight
- **Formula**: ETH Balance / 0.001 ETH
- **Example**: 0.05 ETH = 50 votes

```solidity
function getVoteWeight(uint256 proposalId, address voter) external view returns (uint256)
```

#### 8. `closeProposal(uint256 proposalId)`
- **Purpose**: Close proposal (creator only)
- **Requirements**:
  - Only proposal creator
  - Voting period must end
  - Proposal must be active

```solidity
function closeProposal(uint256 _proposalId) external
```

### Proposal Struct
```solidity
struct Proposal {
    uint256 id;                      // Unique ID
    address creator;                 // Proposal creator
    string title;                    // Proposal title
    string description;              // Proposal description
    uint256 createdAt;               // Creation timestamp
    uint256 deadline;                // Deadline (createdAt + 7 days)
    ProposalStatus status;           // Active = 0, Closed = 1
    uint256 totalVotes;              // Total votes count
    uint256 yesVotes;                // Yes votes (unencrypted)
    uint256 noVotes;                 // No votes (unencrypted)
    euint32 encryptedYesVotes;       // Yes votes (FHE encrypted)
    euint32 encryptedNoVotes;        // No votes (FHE encrypted)
}
```

### Constants
| Constant | Value | Description |
|----------|-------|-------------|
| `PROPOSAL_CREATION_FEE` | 0.01 ETH | Proposal creation fee |
| `VOTE_WEIGHT_DIVISOR` | 1e15 wei | Divide balance for vote weight (0.001 ETH/vote) |
| `votingDuration` | 7 days | Voting period per proposal |

### Events
```solidity
event ProposalCreated(uint256 indexed proposalId, address indexed creator, string title, uint256 deadline);
event VoteCasted(uint256 indexed proposalId, address indexed voter, uint256 voteWeight);
event ProposalClosed(uint256 indexed proposalId);
```

### Security Features
- ✅ Vote weight based on ETH balance (prevents sybil attacks)
- ✅ FHE encryption via @zama-fhe/relayer-sdk
- ✅ Proposal validation (exists & active)
- ✅ Duplicate vote prevention (hasVoted mapping)
- ✅ Access control (creator-only functions)
- ✅ 21 comprehensive test cases

## 📁 Project Structure

```
invictus-dao/
├── contracts/
│   ├── InvictusDAO.sol         # Main voting contract (267 lines)
│   └── FHECounter.sol          # Example FHE contract
├── deploy/
│   ├── deploy.ts               # FHECounter deployment
│   └── deployVotingDAO.ts      # InvictusDAO deployment
├── frontend/
│   ├── lib/
│   │   ├── contract-config.ts  # Contract ABI & address
│   │   └── web3-contract.ts    # Web3 interactions
│   ├── components/
│   │   ├── proposal-list.tsx   # Proposal display
│   │   ├── proposal-card.tsx   # Vote interface
│   │   └── ...
│   └── ...
├── test/
│   ├── FHECounter.ts           # Counter tests
│   └── FHEVotingDAO.ts         # 287 lines - 21 test cases
├── hardhat.config.ts
├── package.json
└── README.md
```

## 🛠 Tech Stack

### Smart Contract Development
- **Solidity** ^0.8.24
- **Hardhat** - Development & deployment
- **Zama FHE** - Fully Homomorphic Encryption
- **ethers.js** v6 - Web3 library

### Frontend
- **Next.js** 16 - React framework
- **TypeScript** 5+ - Type safety
- **@zama-fhe/relayer-sdk** - FHE encrypted voting operations
- **ethers.js** v6 - Contract interaction
- **MetaMask** - Wallet integration

### Network & Tools
- **Ethereum Sepolia** - Testnet
- **Infura** - RPC endpoint
- **Etherscan** - Block explorer

## 📊 Project Statistics

| Metric | Value |
|--------|-------|
| Contract Lines | 267 (InvictusDAO.sol) |
| Test Cases | 21 comprehensive tests |
| Test Lines | 287 (FHEVotingDAO.ts) |
| Frontend Components | 6+ major components |
| Network | Ethereum Sepolia |
| Contract Address | 0x151437944E7C67A1a6D3910aC0A8de8F2B5fc016 |

## 🧪 Testing

### Run All Tests
```bash
npm run test
```

### Test Specific File
```bash
npm run test -- test/FHEVotingDAO.ts
```

### Test Coverage
```bash
npm run coverage
```

## 📚 Available Scripts

```bash
# Compilation
npm run compile          # Compile all contracts

# Testing
npm run test           # Run all tests
npm run test:sepolia   # Run on Sepolia
npm run coverage       # Test coverage

# Deployment
npm run deploy:sepolia      # Deploy to Sepolia
npm run verify:sepolia      # Verify on Etherscan

# Development
npm run lint           # ESLint & Solhint
npm run clean          # Remove build artifacts

# Frontend
cd frontend && npm run dev        # Start dev server
cd frontend && npm run build      # Production build
```

## 🚀 Deployment Checklist

- [ ] Node.js v20+ installed
- [ ] Dependencies installed: `npm install`
- [ ] Hardhat vars configured (MNEMONIC, INFURA_API_KEY)
- [ ] Contracts compiled: `npm run compile`
- [ ] All tests pass: `npm run test` (21/21)
- [ ] Deployed to Sepolia: `npm run deploy:sepolia`
- [ ] Contract address copied
- [ ] Frontend .env.local updated
- [ ] Frontend runs: `cd frontend && npm run dev`
- [ ] Wallet connects to Sepolia (chainId: 11155111)
- [ ] Can create proposals (need 0.02 ETH minimum)
- [ ] Can vote (need 0.001 ETH minimum)
- [ ] Verified on Etherscan (optional)

## 🔐 Privacy & Security

### FHE Encryption
- Individual votes encrypted before blockchain submission
- Uses **@zama-fhe/relayer-sdk** for secure encryption
- Vote aggregation is transparent but individual votes remain private
- Cryptographic proofs for vote validation

### Smart Contract Security
- ✅ Input validation on all functions
- ✅ Access control (creator-only functions)
- ✅ Fee management with withdrawal capability
- ✅ Comprehensive error handling
- ✅ Etherscan verified contract

## 🔗 Important Links

### Testnets & Tools
- [Sepolia Faucet](https://sepolia-faucet.pk910.de/) - Get test ETH
- [Sepolia Explorer](https://sepolia.etherscan.io/) - View transactions
- [MetaMask](https://metamask.io/) - Wallet
- [Infura](https://infura.io/) - RPC provider

### Documentation
- [FHEVM Docs](https://docs.zama.ai/fhevm) - FHE protocol
- [Hardhat](https://hardhat.org/) - Development framework
- [ethers.js](https://docs.ethers.org/v6/) - Web3 library
- [Solidity](https://docs.soliditylang.org/) - Smart contract language
- [@zama-fhe/relayer-sdk](https://docs.zama.ai/fhevm) - FHE SDK for encrypted operations

## 🎯 Use Cases

✅ DAO Governance - Privacy-preserving voting  
✅ Community Decisions - Secret ballot systems  
✅ Corporate Voting - Shareholder rights  
✅ Educational Demo - Learn FHE on blockchain  
✅ Research Project - Showcase FHE implementation  

## ⚠️ Troubleshooting

### Common Issues

**Problem**: "Proposal does not exist"
- **Solution**: Ensure proposal ID is correct, check contract was deployed

**Problem**: "Insufficient ETH balance to vote"
- **Solution**: Need minimum 0.001 ETH to vote, get from Sepolia faucet

**Problem**: "Already voted on this proposal"
- **Solution**: Each address can only vote once per proposal

**Problem**: "Network mismatch"
- **Solution**: Ensure MetaMask is on Sepolia (chainId: 11155111)

**Problem**: Contract address not found
- **Solution**: Update NEXT_PUBLIC_VOTING_DAO_ADDRESS in frontend/.env.local

### Debug Mode
```bash
# Check contract on Etherscan
https://sepolia.etherscan.io/address/0x151437944E7C67A1a6D3910aC0A8de8F2B5fc016

# View transaction details
https://sepolia.etherscan.io/tx/<TRANSACTION_HASH>

# Check account balance
https://sepolia.etherscan.io/address/<YOUR_ADDRESS>
```

## 📝 License

This project is licensed under the **BSD-3-Clause-Clear License**.

See [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Built with technology from:
- **Zama** - FHE encryption protocol and @zama-fhe/relayer-sdk
- **OpenZeppelin** - Smart contract security
- **Hardhat** - Development framework
- **ethers.js** - Web3 library
- **React & Next.js** - UI framework

---

## 🎉 Quick Start

```bash
# 1. Clone and install
git clone https://github.com/yourusername/invictus-dao.git
cd invictus-dao
npm install && cd frontend && npm install && cd ..

# 2. Configure environment
npx hardhat vars set MNEMONIC
npx hardhat vars set INFURA_API_KEY

# 3. Test and deploy
npm run test
npm run deploy:sepolia

# 4. Update frontend and run
cd frontend
echo "NEXT_PUBLIC_VOTING_DAO_ADDRESS=0x..." >> .env.local
npm run dev

# 5. Visit http://localhost:3000 and start voting! 🗳️
```

---

**Created with ❤️ for privacy-preserving governance**

**Signature**: queenlivin212wsb
