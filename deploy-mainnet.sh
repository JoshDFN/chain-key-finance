#!/bin/bash

# Deploy Chain Key Finance to Internet Computer mainnet
# This script automates the deployment process to the IC mainnet

echo "Starting deployment to Internet Computer mainnet..."

# Step 1: Switch to chain-key-deployer identity for mainnet network
echo "Switching to chain-key-deployer identity for mainnet network..."
dfx identity use chain-key-deployer
dfx identity get-principal

# Step 2: Build the fixed iso_dapp canister
echo "Building ISO Dapp canister..."
dfx build --network ic iso_dapp

# Step 3: Deploy the iso_dapp canister
echo "Deploying ISO Dapp canister to mainnet..."
dfx canister --network ic install iso_dapp --mode upgrade

# Step 4: Deploy the frontend assets
echo "Deploying frontend canister to mainnet..."
dfx canister --network ic install frontend --mode upgrade

# Step 5: Get canister IDs
echo "Deployed canister IDs:"
dfx canister --network ic id iso_dapp
dfx canister --network ic id dex
dfx canister --network ic id ckBTC
dfx canister --network ic id ckETH
dfx canister --network ic id ckSOL
dfx canister --network ic id ckUSDC
dfx canister --network ic id frontend

# Step 6: Top up the canisters that need cycles
echo "Topping up canisters with cycles..."
# Top up ckSOL canister
CKSOL_CANISTER="ij6aj-iaaaa-aaaad-aakiq-cai"
echo "Topping up ckSOL canister $CKSOL_CANISTER with cycles..."
dfx canister --network ic deposit-cycles 2000000000 $CKSOL_CANISTER || echo "Failed to top up ckSOL canister - may need manual intervention"

# Top up Bitcoin service canister
BTC_SERVICE_CANISTER="ghsi2-tqaaa-aaaan-aaaca-cai"
echo "Topping up Bitcoin service canister $BTC_SERVICE_CANISTER with cycles..."
# Bitcoin canister requires 10B cycles per operation
dfx canister --network ic deposit-cycles 20000000000 $BTC_SERVICE_CANISTER || echo "Failed to top up Bitcoin service canister - may need manual intervention"

# Top up DEX canister
DEX_CANISTER=$(dfx canister --network ic id dex)
echo "Topping up DEX canister $DEX_CANISTER with cycles..."
dfx canister --network ic deposit-cycles 10000000000 $DEX_CANISTER || echo "Failed to top up DEX canister - may need manual intervention"

# Top up ISO Dapp canister
ISO_DAPP_CANISTER=$(dfx canister --network ic id iso_dapp)
echo "Topping up ISO Dapp canister $ISO_DAPP_CANISTER with cycles..."
dfx canister --network ic deposit-cycles 10000000000 $ISO_DAPP_CANISTER || echo "Failed to top up ISO Dapp canister - may need manual intervention"

# Step 7: Output frontend URL
FRONTEND_ID=$(dfx canister --network ic id frontend)
ISO_DAPP_ID=$(dfx canister --network ic id iso_dapp)
echo ""
echo "------------------------------------------------------------"
echo "Deployment complete!"
echo "------------------------------------------------------------"
echo "Frontend URL: https://$FRONTEND_ID.icp0.io"
echo "ISO Dapp Canister ID: $ISO_DAPP_ID"
echo ""
echo "NEXT STEPS:"
echo "1. Test with small amounts of real crypto:"
echo "   - Generate a Bitcoin address for a test user"
echo "   - Send a small amount of BTC to that address (~0.0001 BTC)"
echo "   - Monitor the deposit status"
echo "   - Verify ckBTC minting once confirmed"
echo ""
echo "2. Repeat for Ethereum:"
echo "   - Generate an Ethereum address"
echo "   - Send a small amount of ETH (~0.001 ETH)"
echo "   - Monitor the deposit and verification process"
echo "   - Verify ckETH minting"
echo ""
echo "3. Additional configuration if needed:"
echo "   - If you need to set the ISO Dapp as minter:"
echo "     dfx canister --network ic call ckBTC setMinter \"(principal \\\"$ISO_DAPP_ID\\\")\"" 
echo "     dfx canister --network ic call ckETH setMinter \"(principal \\\"$ISO_DAPP_ID\\\")\"" 
echo "     dfx canister --network ic call ckUSDC setMinter \"(principal \\\"$ISO_DAPP_ID\\\")\"" 
echo "   - If you need to initialize the DEX:"
echo "     dfx canister --network ic call dex initialize"
echo "------------------------------------------------------------"
