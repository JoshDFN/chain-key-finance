# Teleport - Cross-Chain Asset Management

Teleport is a cross-chain asset management and trading platform built on the Internet Computer. It enables users to deposit Bitcoin, Ethereum, and USDC, and receive chain-key tokens (ckBTC, ckETH, ckUSDC) that can be traded on the integrated DEX.

## Project Overview

Teleport consists of two main components:

1. **ISO Dapp (Chain Key Teleporting)**: Allows users to deposit native assets (BTC, ETH, USDC) and receive chain-key tokens (ckBTC, ckETH, ckUSDC).
2. **DEX with Volatility-Adjusted Spreads**: Enables trading of ck-tokens with dynamic pricing based on market volatility.

## Deployed Canisters

The project has been deployed to the Internet Computer mainnet with the following canister IDs:

- **ckBTC**: ktciv-wqaaa-aaaad-aakhq-cai
- **ckETH**: io7g5-fyaaa-aaaad-aakia-cai
- **ckUSDC**: 4oswu-zaaaa-aaaai-q3una-cai
- **DEX**: 44ubn-vqaaa-aaaai-q3uoa-cai
- **Frontend**: zonwa-fiaaa-aaaai-q3uqq-cai
- **ISO Dapp**: 43vhz-yiaaa-aaaai-q3uoq-cai

## Key Features

- **Bitcoin and Ethereum Integration**: Generate deposit addresses and monitor transactions using the Internet Computer's chain-key technology.
- **Chain-Key Token Minting**: Mint ckBTC, ckETH, and ckUSDC tokens that are 1:1 backed by native assets.
- **DEX Trading**: Trade chain-key tokens with volatility-adjusted spreads (1-4% based on market conditions).
- **Portfolio Management**: Track your assets and transaction history.
- **Initial Service Offering (ISO)**: Participate in the ISO by depositing assets and receive TLP governance tokens.

## Project Status

The project is currently in a pre-production state. While the core functionality is implemented and deployed to mainnet, there are several areas that need improvement before the platform is fully production-ready.

For a detailed overview of the current status and what needs to be done, see the [Project Status](docs/project-status.md) document.

## Documentation

- [Token Flow](docs/token-flow.md): Explains the complete flow of tokens through the system.
- [Blockchain Integration](docs/blockchain-integration.md): Details the integration with Bitcoin and Ethereum.
- [Chain Key Integration](docs/chain-key-integration.md): Explains how the Internet Computer's chain-key technology is used.
- [Chain Key Implementation Plan](docs/chain-key-implementation-plan.md): Outlines the plan for implementing full chain-key integration.
- [Testing with Real Assets](docs/testing-with-real-assets.md): Guide for testing the platform with real assets.
- [Project Status](docs/project-status.md): Current status of the project and what needs to be done.
- [Contributing](CONTRIBUTING.md): Guidelines for contributing to the project.

## Development

### Prerequisites

- Node.js 16+
- DFX 0.14.0+
- Internet Computer Replica (for local development)

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/JoshDFN/teleport.git
   cd teleport
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start a local replica:
   ```
   dfx start --background
   ```

4. Deploy the canisters:
   ```
   dfx deploy
   ```

### Project Structure

- `src/canisters/`: Backend canister code (Motoko)
  - `iso_dapp/`: ISO Dapp canister for deposit and minting
  - `dex/`: DEX canister for trading
  - `token/`: Token canisters for ckBTC, ckETH, ckUSDC
- `src/`: Frontend code (React)
  - `components/`: Reusable UI components
  - `contexts/`: React contexts for state management
  - `pages/`: Main application pages
  - `utils/`: Utility functions
  - `declarations/`: Auto-generated canister interface declarations
- `docs/`: Project documentation

## Deployment

This project uses GitHub Actions for CI/CD:

- Pushing to the `main` branch automatically deploys to the Internet Computer mainnet
- Pull requests are automatically built and tested
- Manual deployments can be triggered from the Actions tab

### Manual Deployment

To trigger a manual deployment:

1. Go to the Actions tab in the GitHub repository
2. Select the "Deploy to IC" workflow
3. Click "Run workflow"
4. Select the target environment (testnet or mainnet)
5. Click "Run workflow"

### Using the Makefile

The project includes a Makefile to standardize build and deployment commands:

```bash
# Build the project
make build

# Deploy to local replica
make deploy-local

# Deploy to testnet
make deploy-testnet

# Deploy to mainnet
make deploy-mainnet
```

## Security Notice

While the application has been deployed to mainnet, some security features are still being implemented. Do not use large amounts of funds for testing until a full security audit has been completed.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
