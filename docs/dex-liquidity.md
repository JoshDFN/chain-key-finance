# DEX Liquidity and Trading Pairs

This document outlines the steps to add more trading pairs and liquidity to the Chain Key Finance DEX.

## 1. Adding New Trading Pairs

### Supported Token Pairs

The DEX will support the following trading pairs:

| Base Token | Quote Token | Description |
|------------|-------------|-------------|
| ckBTC      | ICP         | Bitcoin/Internet Computer |
| ckETH      | ICP         | Ethereum/Internet Computer |
| ckSOL      | ICP         | Solana/Internet Computer |
| ckUSDC     | ICP         | USDC/Internet Computer |
| ckBTC      | ckUSDC      | Bitcoin/USDC |
| ckETH      | ckUSDC      | Ethereum/USDC |
| ckSOL      | ckUSDC      | Solana/USDC |
| ckBTC      | ckETH       | Bitcoin/Ethereum |

### Implementation Steps

1. Update the DEX canister to support new trading pairs:

```motoko
// Add to dex/main.mo

// Initialize additional trading pairs
public shared(msg) func addTradingPair(baseToken : Text, quoteToken : Text) : async () {
  if (msg.caller != owner_) {
    throw Error.reject("Unauthorized: only the owner can add trading pairs");
  };
  
  let pair = baseToken # "-" # quoteToken;
  
  if (Option.isNull(orderBooksMap.get(pair))) {
    orderBooksMap.put(pair, {
      pair = pair;
      buyOrders = [];
      sellOrders = [];
      lastPrice = null;
      volatility = 0.02; // Initial volatility at 2%
    });
    
    volatilityHistoryMap.put(pair, []);
  };
}

// Get all supported trading pairs
public query func getSupportedPairs() : async [Text] {
  let pairs = Buffer.Buffer<Text>(0);
  
  for ((pair, _) in orderBooksMap.entries()) {
    pairs.add(pair);
  };
  
  Buffer.toArray(pairs)
}
```

2. Add a script to initialize all trading pairs:

```bash
#!/bin/bash

# Add all trading pairs to the DEX
echo "Adding trading pairs to DEX..."

# Get DEX canister ID
DEX_ID=$(dfx canister id dex)

# Add trading pairs
dfx canister call dex addTradingPair '("ckBTC", "ICP")'
dfx canister call dex addTradingPair '("ckETH", "ICP")'
dfx canister call dex addTradingPair '("ckSOL", "ICP")'
dfx canister call dex addTradingPair '("ckUSDC", "ICP")'
dfx canister call dex addTradingPair '("ckBTC", "ckUSDC")'
dfx canister call dex addTradingPair '("ckETH", "ckUSDC")'
dfx canister call dex addTradingPair '("ckSOL", "ckUSDC")'
dfx canister call dex addTradingPair '("ckBTC", "ckETH")'

echo "Trading pairs added successfully!"
```

## 2. Seeding Initial Liquidity

To ensure the DEX has sufficient liquidity from the start, we'll seed initial liquidity for each trading pair.

### Liquidity Amounts

| Trading Pair | Base Amount | Quote Amount | Initial Price |
|--------------|-------------|--------------|--------------|
| ckBTC-ICP    | 10 ckBTC    | 30,000 ICP   | 3,000 ICP/ckBTC |
| ckETH-ICP    | 100 ckETH   | 20,000 ICP   | 200 ICP/ckETH |
| ckSOL-ICP    | 1,000 ckSOL | 10,000 ICP   | 10 ICP/ckSOL |
| ckUSDC-ICP   | 10,000 ckUSDC | 10,000 ICP | 1 ICP/ckUSDC |
| ckBTC-ckUSDC | 10 ckBTC    | 300,000 ckUSDC | 30,000 ckUSDC/ckBTC |
| ckETH-ckUSDC | 100 ckETH   | 200,000 ckUSDC | 2,000 ckUSDC/ckETH |
| ckSOL-ckUSDC | 1,000 ckSOL | 10,000 ckUSDC | 10 ckUSDC/ckSOL |
| ckBTC-ckETH  | 10 ckBTC    | 150 ckETH    | 15 ckETH/ckBTC |

### Implementation Steps

1. Create a liquidity provider account:

```bash
# Create a new identity for the liquidity provider
dfx identity new liquidity-provider
dfx identity use liquidity-provider
LP_PRINCIPAL=$(dfx identity get-principal)

# Switch back to default identity
dfx identity use default
```

2. Mint tokens for the liquidity provider:

```bash
# Mint tokens for the liquidity provider
dfx canister call ckBTC mint "(principal \"$LP_PRINCIPAL\", 100_000_000)" # 100 ckBTC (with 6 decimals)
dfx canister call ckETH mint "(principal \"$LP_PRINCIPAL\", 1_000_000_000_000_000_000_000)" # 1,000 ckETH (with 18 decimals)
dfx canister call ckSOL mint "(principal \"$LP_PRINCIPAL\", 10_000_000_000_000)" # 10,000 ckSOL (with 9 decimals)
dfx canister call ckUSDC mint "(principal \"$LP_PRINCIPAL\", 1_000_000_000_000)" # 1,000,000 ckUSDC (with 6 decimals)
```

3. Create a script to place initial orders:

```bash
#!/bin/bash

# Seed initial liquidity for the DEX
echo "Seeding initial liquidity for DEX..."

# Switch to liquidity provider identity
dfx identity use liquidity-provider

# Function to place buy and sell orders around a price point
seed_liquidity() {
  local pair=$1
  local base_token=$2
  local quote_token=$3
  local mid_price=$4
  local base_amount=$5
  local quote_amount=$6
  
  # Calculate price levels (5% steps)
  local buy_price_1=$(echo "$mid_price * 0.95" | bc -l)
  local buy_price_2=$(echo "$mid_price * 0.90" | bc -l)
  local buy_price_3=$(echo "$mid_price * 0.85" | bc -l)
  local sell_price_1=$(echo "$mid_price * 1.05" | bc -l)
  local sell_price_2=$(echo "$mid_price * 1.10" | bc -l)
  local sell_price_3=$(echo "$mid_price * 1.15" | bc -l)
  
  # Calculate amounts for each level (40%, 30%, 30%)
  local buy_amount_1=$(echo "$base_amount * 0.4" | bc -l)
  local buy_amount_2=$(echo "$base_amount * 0.3" | bc -l)
  local buy_amount_3=$(echo "$base_amount * 0.3" | bc -l)
  local sell_amount_1=$(echo "$base_amount * 0.4" | bc -l)
  local sell_amount_2=$(echo "$base_amount * 0.3" | bc -l)
  local sell_amount_3=$(echo "$base_amount * 0.3" | bc -l)
  
  # Place buy orders
  echo "Placing buy orders for $pair..."
  dfx canister call dex placeOrder "(\"$pair\", variant {buy}, $buy_price_1, $buy_amount_1)"
  dfx canister call dex placeOrder "(\"$pair\", variant {buy}, $buy_price_2, $buy_amount_2)"
  dfx canister call dex placeOrder "(\"$pair\", variant {buy}, $buy_price_3, $buy_amount_3)"
  
  # Place sell orders
  echo "Placing sell orders for $pair..."
  dfx canister call dex placeOrder "(\"$pair\", variant {sell}, $sell_price_1, $sell_amount_1)"
  dfx canister call dex placeOrder "(\"$pair\", variant {sell}, $sell_price_2, $sell_amount_2)"
  dfx canister call dex placeOrder "(\"$pair\", variant {sell}, $sell_price_3, $sell_amount_3)"
}

# Seed liquidity for each pair
seed_liquidity "ckBTC-ICP" "ckBTC" "ICP" 3000 10 30000
seed_liquidity "ckETH-ICP" "ckETH" "ICP" 200 100 20000
seed_liquidity "ckSOL-ICP" "ckSOL" "ICP" 10 1000 10000
seed_liquidity "ckUSDC-ICP" "ckUSDC" "ICP" 1 10000 10000
seed_liquidity "ckBTC-ckUSDC" "ckBTC" "ckUSDC" 30000 10 300000
seed_liquidity "ckETH-ckUSDC" "ckETH" "ckUSDC" 2000 100 200000
seed_liquidity "ckSOL-ckUSDC" "ckSOL" "ckUSDC" 10 1000 10000
seed_liquidity "ckBTC-ckETH" "ckBTC" "ckETH" 15 10 150

# Switch back to default identity
dfx identity use default

echo "Initial liquidity seeded successfully!"
```

## 3. Implementing Liquidity Provider Incentives

To encourage users to provide liquidity to the DEX, we'll implement incentives for liquidity providers.

### Liquidity Mining Program

1. Update the DEX canister to track liquidity providers:

```motoko
// Add to dex/main.mo

// Liquidity provider rewards
private stable var liquidityProviders : [(Principal, [(TokenPair, Float)])] = [];
private stable var rewardRate : Float = 0.01; // 1% daily rewards

private func initLiquidityProviders() : HashMap.HashMap<Principal, HashMap.HashMap<TokenPair, Float>> {
  let map = HashMap.HashMap<Principal, HashMap.HashMap<TokenPair, Float>>(10, Principal.equal, Principal.hash);
  for ((principal, pairs) in liquidityProviders.vals()) {
    let pairMap = HashMap.HashMap<TokenPair, Float>(10, Text.equal, Text.hash);
    for ((pair, amount) in pairs.vals()) {
      pairMap.put(pair, amount);
    };
    map.put(principal, pairMap);
  };
  map
}

private let liquidityProvidersMap = initLiquidityProviders();

// Add liquidity to a trading pair
public shared(msg) func addLiquidity(pair : TokenPair, baseAmount : Float, quoteAmount : Float) : async () {
  let caller = msg.caller;
  
  // Verify the pair exists
  switch (orderBooksMap.get(pair)) {
    case (null) {
      throw Error.reject("Trading pair does not exist");
    };
    case (_) {};
  };
  
  // Get the tokens in the pair
  let tokens = Text.split(pair, #text "-");
  let baseToken = Iter.toArray(tokens)[0];
  let quoteToken = Iter.toArray(tokens)[1];
  
  // Transfer tokens from the user to the DEX
  let baseTransferred = await transferTokens(baseToken, caller, Principal.fromActor(this), baseAmount);
  let quoteTransferred = await transferTokens(quoteToken, caller, Principal.fromActor(this), quoteAmount);
  
  if (not baseTransferred or not quoteTransferred) {
    throw Error.reject("Failed to transfer tokens");
  };
  
  // Update liquidity provider records
  let providerPairs = switch (liquidityProvidersMap.get(caller)) {
    case (null) {
      let newMap = HashMap.HashMap<TokenPair, Float>(10, Text.equal, Text.hash);
      liquidityProvidersMap.put(caller, newMap);
      newMap
    };
    case (?map) { map };
  };
  
  let currentAmount = switch (providerPairs.get(pair)) {
    case (null) { 0 };
    case (?amount) { amount };
  };
  
  providerPairs.put(pair, currentAmount + baseAmount);
}

// Calculate and distribute rewards
public shared(msg) func distributeRewards() : async () {
  if (msg.caller != owner_) {
    throw Error.reject("Unauthorized: only the owner can distribute rewards");
  };
  
  for ((provider, pairs) in liquidityProvidersMap.entries()) {
    for ((pair, amount) in pairs.entries()) {
      let reward = amount * rewardRate;
      
      // Get the quote token from the pair
      let tokens = Text.split(pair, #text "-");
      let quoteToken = Iter.toArray(tokens)[1];
      
      // Mint reward tokens to the provider
      let _ = await mintRewardTokens(quoteToken, provider, reward);
    }
  }
}
```

2. Create a script to distribute rewards:

```bash
#!/bin/bash

# Distribute rewards to liquidity providers
echo "Distributing rewards to liquidity providers..."

# Schedule daily reward distribution
echo "0 0 * * * dfx canister call dex distributeRewards" | crontab -

echo "Reward distribution scheduled!"
```

## 4. Adding Support for More Token Pairs

To add support for additional token pairs in the future, we'll create a streamlined process:

1. Create a new token canister for the new token
2. Add the token to the ISO Dapp for deposits
3. Add new trading pairs to the DEX
4. Seed initial liquidity

### Example: Adding a new token XYZ

```bash
# 1. Create the token canister
cp src/canisters/tokens/ckBTC.mo src/canisters/tokens/ckXYZ.mo

# Update dfx.json to include the new canister
# Add to the "canisters" section:
# "ckXYZ": {
#   "main": "src/canisters/tokens/ckXYZ.mo",
#   "type": "motoko"
# }

# 2. Deploy the new token canister
dfx deploy ckXYZ

# 3. Set the ISO Dapp as the minter
ISO_DAPP_ID=$(dfx canister id iso_dapp)
dfx canister call ckXYZ setMinter "(principal \"$ISO_DAPP_ID\")"

# 4. Add trading pairs to the DEX
dfx canister call dex addTradingPair '("ckXYZ", "ICP")'
dfx canister call dex addTradingPair '("ckXYZ", "ckUSDC")'
dfx canister call dex addTradingPair '("ckXYZ", "ckBTC")'

# 5. Seed initial liquidity
# Mint tokens to the liquidity provider
dfx canister call ckXYZ mint "(principal \"$LP_PRINCIPAL\", 10_000_000_000)" # 10,000 ckXYZ

# Place orders
dfx identity use liquidity-provider
dfx canister call dex placeOrder "(\"ckXYZ-ICP\", variant {buy}, 0.95, 1000)"
dfx canister call dex placeOrder "(\"ckXYZ-ICP\", variant {sell}, 1.05, 1000)"
dfx identity use default
```

## 5. Monitoring and Adjusting Liquidity

To ensure the DEX maintains sufficient liquidity, we'll implement monitoring and automatic adjustments:

1. Add monitoring to the DEX canister:

```motoko
// Add to dex/main.mo

// Monitor liquidity levels
public query func getLiquidityMetrics() : async {
  pair : TokenPair;
  buyDepth : Float;
  sellDepth : Float;
  spreadPercentage : Float;
  lastTradeTime : ?Int;
}[] {
  let metrics = Buffer.Buffer<{
    pair : TokenPair;
    buyDepth : Float;
    sellDepth : Float;
    spreadPercentage : Float;
    lastTradeTime : ?Int;
  }>(0);
  
  for ((pair, orderBook) in orderBooksMap.entries()) {
    let buyDepth = calculateBuyDepth(pair);
    let sellDepth = calculateSellDepth(pair);
    let spread = calculateSpread(pair);
    let lastPrice = orderBook.lastPrice;
    
    let spreadPercentage = switch (lastPrice) {
      case (null) { 0 };
      case (?price) {
        let bestBid = getBestBid(pair);
        let bestAsk = getBestAsk(pair);
        
        switch (bestBid, bestAsk) {
          case (?bid, ?ask) {
            (ask - bid) / ((ask + bid) / 2)
          };
          case (_, _) { 0 };
        }
      };
    };
    
    metrics.add({
      pair = pair;
      buyDepth = buyDepth;
      sellDepth = sellDepth;
      spreadPercentage = spreadPercentage;
      lastTradeTime = getLastTradeTime(pair);
    });
  };
  
  Buffer.toArray(metrics)
}

// Alert if liquidity is too low
public shared(msg) func checkLiquidityAlerts() : async () {
  if (msg.caller != owner_) {
    throw Error.reject("Unauthorized: only the owner can check liquidity alerts");
  };
  
  let metrics = await getLiquidityMetrics();
  
  for (metric in metrics.vals()) {
    if (metric.buyDepth < 1000 or metric.sellDepth < 1000) {
      // Send alert (in production, this would integrate with an alerting system)
      Debug.print("ALERT: Low liquidity for pair " # metric.pair);
    };
    
    if (metric.spreadPercentage > 0.05) {
      Debug.print("ALERT: High spread for pair " # metric.pair);
    };
  };
}
```

2. Create a script to monitor liquidity:

```bash
#!/bin/bash

# Monitor liquidity levels
echo "Monitoring liquidity levels..."

# Schedule hourly liquidity checks
echo "0 * * * * dfx canister call dex checkLiquidityAlerts" | crontab -

echo "Liquidity monitoring scheduled!"
```

## 6. Implementation Timeline

1. Week 1: Add new trading pairs to the DEX
2. Week 2: Implement liquidity provider incentives
3. Week 3: Seed initial liquidity
4. Week 4: Set up monitoring and adjustments
5. Week 5: Launch additional token pairs

## 7. Risk Management

- Implement circuit breakers for extreme volatility
- Set up monitoring for unusual trading patterns
- Establish a reserve fund for emergency liquidity
- Regularly audit the DEX for security vulnerabilities
