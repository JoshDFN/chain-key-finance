# Chain Key Finance: Technical Implementation Details

## System Architecture

Chain Key Finance is built on the Internet Computer (IC) using a multi-canister architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                      Internet Computer                       │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐  │
│  │ Frontend    │    │ ISO Dapp    │    │ DEX Canister    │  │
│  │ Canister    │◄──►│ Canister    │◄──►│                 │  │
│  │             │    │             │    │                 │  │
│  └─────────────┘    └──────┬──────┘    └────────┬────────┘  │
│                            │                     │           │
│                            ▼                     ▼           │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐  │
│  │ ckBTC       │    │ ckETH       │    │ ckUSDC          │  │
│  │ Canister    │    │ Canister    │    │ Canister        │  │
│  └─────────────┘    └─────────────┘    └─────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
            │                  │                  │
            ▼                  ▼                  ▼
    ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
    │  Bitcoin     │   │  Ethereum    │   │  Ethereum    │
    │  Network     │   │  Network     │   │  Network     │
    └──────────────┘   └──────────────┘   └──────────────┘
```

## Canister Roles

### 1. Frontend Canister
- **Purpose**: Serves the web application assets (HTML, CSS, JavaScript)
- **Implementation**: Static asset canister
- **Canister ID**: `zonwa-fiaaa-aaaai-q3uqq-cai`

### 2. ISO Dapp Canister
- **Purpose**: Manages the deposit and minting process
- **Implementation**: Motoko actor
- **Canister ID**: `43vhz-yiaaa-aaaai-q3uoq-cai`
- **Key Functions**:
  - `generateDepositAddress`: Creates unique deposit addresses for users
  - `simulateDeposit`: For testing, simulates a deposit
  - `mintCkToken`: Mints chain-key tokens after deposit confirmation

### 3. DEX Canister
- **Purpose**: Manages the order book and trading functionality
- **Implementation**: Motoko actor
- **Canister ID**: `44ubn-vqaaa-aaaai-q3uoa-cai`
- **Key Functions**:
  - `placeOrder`: Creates buy/sell orders
  - `getOrderBook`: Retrieves the current order book
  - `getUserOrders`: Gets orders for a specific user

### 4. Token Canisters
- **Purpose**: Manage token balances and transfers
- **Implementation**: Motoko actors
- **Canister IDs**:
  - ckBTC: `ktciv-wqaaa-aaaad-aakhq-cai`
  - ckETH: `io7g5-fyaaa-aaaad-aakia-cai`
  - ckUSDC: `4oswu-zaaaa-aaaai-q3una-cai`
- **Key Functions**:
  - `mint`: Creates new tokens (restricted to ISO Dapp)
  - `transfer`: Moves tokens between users
  - `balanceOf`: Checks token balance

## Deposit Process Technical Flow

1. **Address Generation**:
   ```
   User → Frontend → ISO Dapp Canister → Chain-Key Technology → Deposit Address
   ```

   The ISO Dapp canister uses the Internet Computer's chain-key technology to generate deposit addresses for Bitcoin and Ethereum. These addresses are controlled by the Internet Computer through threshold ECDSA signatures.

2. **Deposit Monitoring**:
   ```
   External Blockchain → Chain-Key Technology → ISO Dapp Canister
   ```

   The Internet Computer continuously monitors the generated addresses on the respective blockchains. When a deposit is detected, it waits for the required number of confirmations:
   - Bitcoin: 6 confirmations (~60 minutes)
   - Ethereum: 12 confirmations (~3 minutes)
   - USDC on Ethereum: 12 confirmations (~3 minutes)

3. **Token Minting**:
   ```
   ISO Dapp Canister → Token Canister → User's IC Wallet
   ```

   Once the deposit is confirmed, the ISO Dapp canister calls the appropriate token canister to mint an equivalent amount of chain-key tokens directly to the user's Internet Computer wallet.

## Asset Security

### Deposit Address Security

All deposit addresses are generated and controlled using the Internet Computer's chain-key technology:

1. **Threshold ECDSA**:
   - Private keys are never fully assembled in one location
   - Signing operations require consensus from multiple nodes
   - No single entity can access or control the private keys

2. **Key Management**:
   - Bitcoin addresses use P2PKH or P2WPKH (SegWit) formats
   - Ethereum addresses use standard EOA format
   - All addresses are derived from threshold-generated keys

### Asset Storage

Deposited assets are held in the following manner:

1. **Bitcoin**:
   - Stored in threshold ECDSA-controlled Bitcoin addresses
   - Addresses: `bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh` (and others)
   - Monitored by the Internet Computer network

2. **Ethereum**:
   - Stored in threshold ECDSA-controlled Ethereum addresses
   - Addresses: `0x71C7656EC7ab88b098defB751B7401B5f6d8976F` (and others)
   - Monitored by the Internet Computer network

3. **USDC on Ethereum**:
   - Stored in the same Ethereum addresses as ETH
   - Managed as ERC-20 tokens

## DEX Implementation Details

### Order Book Management

The DEX uses a traditional order book model:

1. **Order Storage**:
   - Orders are stored in a HashMap within the DEX canister
   - Each order has a unique ID and contains:
     * Owner principal
     * Pair (e.g., "ckBTC-ICP")
     * Order type (buy/sell)
     * Price and amount
     * Status (open, filled, cancelled)

2. **Order Matching**:
   - Orders are matched manually by users
   - When a user fills an order, the DEX canister:
     * Verifies the user has sufficient balance
     * Transfers tokens between the parties
     * Updates the order status

3. **Volatility Calculation**:
   - Volatility is calculated based on recent price changes
   - The DEX maintains a history of price changes for each pair
   - Volatility affects the spread:
     * Low volatility (<1%): 1% spread
     * High volatility (≥1%): 4% spread

## Authentication and Authorization

1. **User Authentication**:
   - Users authenticate using Internet Identity
   - Authentication creates a session with the user's principal ID
   - Principal IDs are used to identify users and their assets

2. **Canister Authorization**:
   - Token canisters only allow minting from the ISO Dapp canister
   - Users can only cancel their own orders
   - Critical operations use caller validation

## Data Flow Diagrams

### Deposit Flow

```
┌──────┐     ┌───────────┐     ┌─────────────┐     ┌──────────────┐
│ User │────►│ Frontend  │────►│ ISO Dapp    │────►│ Blockchain   │
└──────┘     └───────────┘     │ Canister    │     │ Network      │
                                └─────────────┘     └──────────────┘
                                      │                    │
                                      │                    ▼
                                      │              ┌──────────────┐
                                      │              │ Confirmation │
                                      │              └──────────────┘
                                      │                    │
                                      ▼                    │
                               ┌─────────────┐            │
                               │ Token       │◄───────────┘
                               │ Canister    │
                               └─────────────┘
                                      │
                                      ▼
                               ┌─────────────┐
                               │ User's      │
                               │ IC Wallet   │
                               └─────────────┘
```

### Trading Flow

```
┌──────┐     ┌───────────┐     ┌─────────────┐
│ User │────►│ Frontend  │────►│ DEX         │
└──────┘     └───────────┘     │ Canister    │
                                └─────────────┘
                                      │
                                      ▼
                               ┌─────────────┐
                               │ Order Book  │
                               └─────────────┘
                                      │
                                      │
                 ┌───────────────────┴───────────────────┐
                 │                                       │
                 ▼                                       ▼
          ┌─────────────┐                        ┌─────────────┐
          │ Token A     │                        │ Token B     │
          │ Canister    │                        │ Canister    │
          └─────────────┘                        └─────────────┘
                 │                                       │
                 ▼                                       ▼
          ┌─────────────┐                        ┌─────────────┐
          │ Seller's    │                        │ Buyer's     │
          │ IC Wallet   │                        │ IC Wallet   │
          └─────────────┘                        └─────────────┘
```

## Performance Considerations

1. **Scalability**:
   - The Internet Computer's subnet architecture allows for horizontal scaling
   - Each canister runs on a specific subnet
   - Token canisters can be distributed across subnets for load balancing

2. **Latency**:
   - Internet Computer consensus time: ~2 seconds
   - External blockchain confirmation times:
     * Bitcoin: ~60 minutes (6 confirmations)
     * Ethereum: ~3 minutes (12 confirmations)

3. **Storage**:
   - Order history is pruned periodically to maintain performance
   - User balances are stored efficiently using principal-indexed maps

## Security Measures

1. **Code Security**:
   - All canisters are written in Motoko, a type-safe language
   - Critical functions include caller validation
   - Proper error handling prevents unexpected behavior

2. **Economic Security**:
   - Volatility-adjusted spreads protect against market manipulation
   - All chain-key tokens are fully backed by native assets
   - No fractional reserve or lending of deposited assets

3. **Audit Trail**:
   - All transactions are recorded on the Internet Computer
   - External blockchain transactions provide additional verification
   - Users can verify their balances independently

## Future Technical Enhancements

1. **Cross-Subnet Communication**:
   - Implement XNet calls for improved scalability
   - Distribute token canisters across multiple subnets

2. **Advanced Order Types**:
   - Limit orders with time-in-force options
   - Stop-loss and take-profit orders
   - Algorithmic trading capabilities

3. **Enhanced Security**:
   - Multi-signature withdrawal requirements
   - Time-locked transactions for large withdrawals
   - Advanced anomaly detection
