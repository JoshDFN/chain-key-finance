#!/bin/bash

# Deploy Chain Key Finance to Internet Computer mainnet
# This script automates the deployment process to the IC mainnet

echo "Starting deployment to Internet Computer mainnet..."

# Step 1: Switch to mainnet network
echo "Switching to mainnet network..."
dfx identity use default
dfx identity get-principal

# Step 2: Create production canister IDs
echo "Creating production canisters..."
dfx canister --network ic create --all

# Step 3: Build the canisters
echo "Building canisters..."
dfx build --network ic

# Step 4: Deploy the canisters
echo "Deploying canisters to mainnet..."
dfx canister --network ic install --all --mode upgrade

# Step 5: Get canister IDs
echo "Deployed canister IDs:"
dfx canister --network ic id iso_dapp
dfx canister --network ic id dex
dfx canister --network ic id ckBTC
dfx canister --network ic id ckETH
dfx canister --network ic id ckSOL
dfx canister --network ic id ckUSDC
dfx canister --network ic id frontend

# Step 6: Set up inter-canister calls
echo "Setting up inter-canister calls..."
ISO_DAPP_ID=$(dfx canister --network ic id iso_dapp)

# Set the ISO Dapp as the minter for token canisters
echo "Setting ISO Dapp as minter for token canisters..."
dfx canister --network ic call ckBTC setMinter "(principal \"$ISO_DAPP_ID\")"
dfx canister --network ic call ckETH setMinter "(principal \"$ISO_DAPP_ID\")"
dfx canister --network ic call ckSOL setMinter "(principal \"$ISO_DAPP_ID\")"
dfx canister --network ic call ckUSDC setMinter "(principal \"$ISO_DAPP_ID\")"

# Step 7: Initialize the DEX
echo "Initializing DEX..."
dfx canister --network ic call dex initialize

# Step 8: Output frontend URL
FRONTEND_ID=$(dfx canister --network ic id frontend)
echo "Frontend deployed at: https://$FRONTEND_ID.ic0.app"
echo "Deployment complete!"
