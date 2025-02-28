# Teleport: Token Flow Documentation

## Overview

Teleport consists of three main components:
1. **ISO Dapp (Chain Key Teleporting)**: Allows users to deposit native assets (BTC, ETH, USDC) and receive chain-key tokens (ckBTC, ckETH, ckUSDC).
2. **DEX with Volatility-Adjusted Spreads**: Enables trading of ck-tokens with dynamic pricing based on market volatility.
3. **UTOISO (UTO Initial Stock Offering)**: Facilitates the issuance of tokenized shares through a sophisticated order processing and vesting mechanism.

This document explains the complete flow of tokens through the system.

## ISO Dapp: Token Deposit and Minting Process

### 1. User Deposit Flow

When a user deposits native assets (BTC, ETH, USDC):

1. **Address Generation**: 
   - User selects an asset (e.g., BTC) in the ISO Dapp
   - System generates a unique deposit address for that asset
   - This address is controlled by the Internet Computer (IC) via chain-key technology

2. **Deposit Confirmation**:
   - User sends native assets to the generated address
   - The system monitors the blockchain for incoming transactions
   - For BTC: 6 confirmations required (~60 minutes)
   - For ETH: 12 confirmations required (~3 minutes)
   - For USDC on Ethereum: 12 confirmations required (~3 minutes)

3. **Chain-Key Token Minting**:
   - Once deposit is confirmed, the ISO Dapp canister mints an equivalent amount of chain-key tokens
   - These tokens are 1:1 backed by the native assets
   - Tokens are minted directly to the user's Internet Computer wallet
   - The minting process is handled by specialized token canisters (ckBTC, ckETH, ckSOL, ckUSDC)

### 2. Behind the Scenes: Asset Management

The deposited native assets are:

1. **Securely Stored**:
   - BTC: Held in threshold ECDSA-controlled Bitcoin addresses
   - ETH: Held in threshold ECDSA-controlled Ethereum addresses
   - USDC: Held in threshold ECDSA-controlled Ethereum addresses as ERC-20 tokens

2. **Fully Reserved**:
   - All chain-key tokens are 100% backed by the native assets
   - No fractional reserve or lending of deposited assets
   - Reserves can be cryptographically verified on-chain

3. **Managed by Chain-Key Technology**:
   - The Internet Computer's chain-key technology enables direct control of assets on other blockchains
   - No centralized custodian or intermediary is involved
   - The system uses threshold cryptography to secure private keys

## DEX: Trading Chain-Key Tokens

### 1. Trading Mechanism

When users trade on the DEX:

1. **Order Placement**:
   - Users can place buy or sell orders for pairs like ckBTC-ICP, ckETH-ICP, etc.
   - Orders are stored in the DEX canister's order book
   - No assets are locked until an order is matched

2. **Order Matching**:
   - When a buy and sell order match in price, the DEX executes the trade
   - The DEX canister calls the respective token canisters to transfer tokens
   - For example, in a ckBTC-ICP trade, the ckBTC and ICP token canisters are called to transfer tokens

3. **Spread Calculation**:
   - The DEX calculates spreads based on market volatility
   - Low volatility: 1% spread
   - High volatility: 4% spread
   - This protects the system from arbitrage during volatile markets

### 2. Liquidity Management

The DEX maintains liquidity through:

1. **Initial Liquidity**:
   - Pre-minted tokens provide initial liquidity:
     * 10M ckUSDC
     * 100 ckBTC
     * 1,000 ckETH

2. **User-Provided Liquidity**:
   - Users can place limit orders that add to market depth
   - No impermanent loss (unlike AMMs) as this is an order book model

## UTOISO: Tokenized Share Offering Process

### 1. Order Submission Flow

When a user participates in the UTOISO:

1. **Order Placement**:
   - User selects a sale round to participate in
   - User specifies their maximum bid price within the round's price range
   - User indicates their investment amount in cryptocurrencies (BTC, ETH, ICP) or fiat (via financial intermediaries)
   - For crypto orders, funds are transferred to the UTOISO smart contract
   - For fiat orders, the financial intermediary blocks the corresponding funds

2. **Order Book Closure**:
   - At the end of the submission window, all orders are collected
   - Cryptocurrency orders are valued in USD using the prevailing market rate
   - The system verifies that the total demand meets the minimum requirements for the round

3. **Price Determination**:
   - The pricing engine performs a parameter sweep from the minimum to maximum price
   - For each price point, it calculates the total share demand by:
     * Identifying eligible orders (bid price ≥ current price)
     * Summing the total funding amount for these orders
     * Dividing by the current price to get share demand
   - The optimal price is the highest price at which the share demand meets or exceeds the sell target

4. **Share Allocation**:
   - Orders are prioritized based on bid price
   - Orders with bid price > sale price are fully filled
   - Orders with bid price = sale price may be partially filled if demand exceeds supply
   - Partially filled orders are allocated shares on a pro-rata basis
   - Unfilled or partially filled orders have unused funds returned

### 2. Token Vesting Mechanism

The UTO tokens issued through the UTOISO are subject to vesting:

1. **Base Vesting Schedule**:
   - 12 sale rounds with decreasing vesting periods:
     * Round 1: 44 months
     * Round 2: 40 months
     * ...
     * Round 12: 0 months
   - Tokens are locked during the vesting period and cannot be transferred

2. **Vesting Acceleration**:
   - Vesting can be accelerated based on market performance
   - Acceleration occurs if the 30-day average market price exceeds the next batch price by 20%
   - The acceleration factor is calculated as: min(market_price / next_batch_price, 2)
   - The waiting interval is adjusted by dividing by the acceleration factor
   - Maximum acceleration is 2x (halving the waiting interval)

3. **Token Release**:
   - As tokens vest, they become transferable
   - The system tracks vesting status for each user's purchases
   - Users can view their vesting schedule and upcoming releases in their portfolio

### 3. Behind the Scenes: Share Management

The tokenized shares are:

1. **Legally Compliant**:
   - UTO tokens adhere to the CMTA Token (CMTAT) framework
   - Tokens represent actual equity securities under Swiss law
   - All issuance and transfers comply with relevant regulations

2. **Securely Managed**:
   - Token ledger is maintained on the Internet Computer
   - Transfer restrictions enforce vesting requirements
   - Compliance checks are performed for all transfers

3. **Transparently Allocated**:
   - All sale rounds and allocations are publicly verifiable
   - The pricing mechanism ensures fair and transparent price discovery
   - All participants in a round pay the same price

## Redeeming Chain-Key Tokens

Users can convert chain-key tokens back to native assets:

1. **Redemption Request**:
   - User initiates a redemption in the ISO Dapp
   - Provides the native blockchain address to receive funds

2. **Verification and Processing**:
   - System verifies the user has sufficient chain-key tokens
   - Burns the chain-key tokens from the user's account
   - Initiates a transfer of native assets to the user's provided address

3. **Confirmation**:
   - User receives native assets on the original blockchain
   - Transaction is recorded in the ISO Dapp for transparency

## Security Measures

1. **Audits**:
   - Smart contract audits by leading security firms
   - Regular security assessments of the entire system

2. **Transparency**:
   - All minted chain-key tokens are publicly verifiable
   - Reserve proof can be cryptographically verified
   - UTOISO sale rounds and allocations are transparent

3. **Decentralization**:
   - No single entity controls the private keys to the reserves
   - Threshold cryptography ensures distributed security

## Token Offerings Timeline

### Teleport Initial Service Offering:

1. **Start Date**: April 20, 2025, 12:00 UTC
2. **Duration**: 14 days
3. **Allocation**: Based on contribution amount
   - Minimum: 0.01 BTC / 0.1 ETH / 100 USDC
   - Maximum: 10 BTC / 100 ETH / 100,000 USDC
4. **Token Distribution**: TLP governance tokens distributed proportionally to contribution
5. **Vesting**: 25% at TGE, 75% vested over 12 months

### UTOISO (UTO Initial Stock Offering):

1. **Start Date**: To be determined
2. **Duration**: 24 months (12 sale rounds)
3. **Allocation**: Based on bid price and investment amount
   - Each round has a defined price range and share sell target
   - Optimal price determined by parameter sweep algorithm
4. **Token Distribution**: UTO tokens representing equity in UTOPIA AG
5. **Vesting**: Varies by round (44 months for round 1 to 0 months for round 12)
   - Acceleration based on market performance

## Conclusion

The Teleport platform provides a secure, transparent, and efficient way to bring native blockchain assets onto the Internet Computer and trade them with dynamic pricing. All user deposits are fully backed and securely managed through chain-key technology, ensuring the integrity of the system.

With the addition of the UTOISO functionality, the platform now also enables sophisticated tokenized share offerings with dynamic pricing and vesting mechanisms. This transforms Teleport from a basic cross-chain asset management system into a comprehensive financial services platform on the Internet Computer.
