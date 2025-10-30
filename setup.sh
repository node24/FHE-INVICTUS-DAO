#!/bin/bash
# Quick Setup Script for FHE Voting DAO

echo "🚀 FHE Voting DAO - Quick Setup"
echo "================================="
echo ""

# Check Node.js version
echo "✓ Checking Node.js version..."
node --version
echo ""

# Install dependencies
echo "📦 Installing backend dependencies..."
npm install
echo ""

# Install frontend dependencies  
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..
echo ""

# Compile contracts
echo "🔧 Compiling smart contracts..."
npm run compile
echo ""

echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Deploy contract: npm run deploy:sepolia"
echo "2. Copy the contract address"
echo "3. Update VOTING_DAO_ADDRESS in frontend/src/App.tsx"
echo "4. Start frontend: cd frontend && npm run dev"
echo ""
echo "📚 For more information, see DAPP_SETUP.md"
