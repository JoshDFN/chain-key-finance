# Blockchain Integration for Teleport

This document outlines the steps to implement real blockchain integration for deposit verification in the Teleport application.

## 1. Bitcoin Integration

### Setup Bitcoin Node
```bash
# Install Bitcoin Core
sudo apt-get update
sudo apt-get install bitcoin-qt

# Configure Bitcoin Core for testnet (for initial testing)
mkdir -p ~/.bitcoin
cat > ~/.bitcoin/bitcoin.conf << EOF
testnet=1
server=1
rpcuser=bitcoinuser
rpcpassword=bitcoinpassword
rpcallowip=127.0.0.1
EOF

# Start Bitcoin Core
bitcoind -daemon
```

### Implement Bitcoin Address Generation in ISO Dapp
Update the ISO Dapp canister to generate Bitcoin addresses using BIP32/BIP44 HD wallet derivation:

```motoko
// Add to iso_dapp/main.mo

// Bitcoin address generation using deterministic key derivation
private func generateBitcoinAddress(user : Principal) : async Text {
  // In production, this would use a secure HD wallet implementation
  // For now, we'll use a deterministic algorithm based on the principal
  let seed = await generateSeedFromPrincipal(user);
  let keyPair = await deriveKeyPair(seed, 0); // First address in derivation path
  let address = await publicKeyToAddress(keyPair.publicKey);
  
  // Store the mapping between user, address and private key (securely)
  storeAddressMapping(user, "BTC", address, keyPair);
  
  return address;
}

// Monitor Bitcoin blockchain for deposits
private func monitorBitcoinDeposits() : async () {
  // Connect to Bitcoin node
  let node = BitcoinNode.connect({
    host = "127.0.0.1";
    port = 8332;
    user = "bitcoinuser";
    password = "bitcoinpassword";
  });
  
  // Get all addresses we're monitoring
  let addresses = getAllBitcoinAddresses();
  
  // Check for new transactions
  for (address in addresses.vals()) {
    let transactions = await node.getAddressTransactions(address);
    for (tx in transactions.vals()) {
      if (isNewTransaction(tx) and hasEnoughConfirmations(tx, 6)) {
        // Process the deposit
        let user = getUserByAddress(address);
        let amount = getTransactionAmount(tx);
        await processDeposit(user, "BTC", amount);
      }
    }
  }
}
```

## 2. Ethereum Integration

### Setup Ethereum Node
```bash
# Install Geth
sudo add-apt-repository -y ppa:ethereum/ethereum
sudo apt-get update
sudo apt-get install ethereum

# Start Geth on testnet (Sepolia)
geth --sepolia --http --http.api eth,net,web3,personal
```

### Implement Ethereum Address Generation in ISO Dapp
```motoko
// Add to iso_dapp/main.mo

// Ethereum address generation
private func generateEthereumAddress(user : Principal) : async Text {
  // Similar to Bitcoin, use deterministic derivation
  let seed = await generateSeedFromPrincipal(user);
  let keyPair = await deriveEthereumKeyPair(seed, 0);
  let address = await ethPublicKeyToAddress(keyPair.publicKey);
  
  // Store the mapping
  storeAddressMapping(user, "ETH", address, keyPair);
  
  return address;
}

// Monitor Ethereum blockchain for deposits
private func monitorEthereumDeposits() : async () {
  // Connect to Ethereum node
  let node = EthereumNode.connect({
    url = "http://127.0.0.1:8545";
  });
  
  // Get all addresses we're monitoring
  let addresses = getAllEthereumAddresses();
  
  // Check for new transactions
  for (address in addresses.vals()) {
    let transactions = await node.getAddressTransactions(address);
    for (tx in transactions.vals()) {
      if (isNewTransaction(tx) and hasEnoughConfirmations(tx, 12)) {
        // Process the deposit
        let user = getUserByAddress(address);
        let amount = getTransactionAmount(tx);
        await processDeposit(user, "ETH", amount);
      }
    }
  }
}
```

## 3. Solana Integration

### Setup Solana Node
```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.10.0/install)"

# Configure for testnet
solana config set --url https://api.testnet.solana.com
```

### Implement Solana Address Generation in ISO Dapp
```motoko
// Add to iso_dapp/main.mo

// Solana address generation
private func generateSolanaAddress(user : Principal) : async Text {
  // Generate a new keypair for the user
  let seed = await generateSeedFromPrincipal(user);
  let keyPair = await deriveSolanaKeyPair(seed, 0);
  let address = keyPair.publicKey;
  
  // Store the mapping
  storeAddressMapping(user, "SOL", address, keyPair);
  
  return address;
}

// Monitor Solana blockchain for deposits
private func monitorSolanaDeposits() : async () {
  // Connect to Solana node
  let node = SolanaNode.connect({
    url = "https://api.testnet.solana.com";
  });
  
  // Get all addresses we're monitoring
  let addresses = getAllSolanaAddresses();
  
  // Check for new transactions
  for (address in addresses.vals()) {
    let transactions = await node.getSignaturesForAddress(address);
    for (signature in transactions.vals()) {
      let tx = await node.getTransaction(signature);
      if (isNewTransaction(tx) and tx.confirmations >= 32) {
        // Process the deposit
        let user = getUserByAddress(address);
        let amount = getTransactionAmount(tx);
        await processDeposit(user, "SOL", amount);
      }
    }
  }
}
```

## 4. USDC Integration

USDC exists on multiple blockchains, so we'll need to handle it differently depending on the chain.

### Ethereum USDC
```motoko
// Add to iso_dapp/main.mo

// USDC contract address on Ethereum
let usdcContractEthereum = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

// Monitor USDC deposits on Ethereum
private func monitorUsdcEthereumDeposits() : async () {
  // Connect to Ethereum node
  let node = EthereumNode.connect({
    url = "http://127.0.0.1:8545";
  });
  
  // Get all addresses we're monitoring
  let addresses = getAllEthereumAddresses();
  
  // Check for new token transfers
  for (address in addresses.vals()) {
    let transfers = await node.getERC20Transfers(usdcContractEthereum, address);
    for (transfer in transfers.vals()) {
      if (isNewTransfer(transfer) and hasEnoughConfirmations(transfer.transaction, 12)) {
        // Process the deposit
        let user = getUserByAddress(address);
        let amount = transfer.amount;
        await processDeposit(user, "USDC-ETH", amount);
      }
    }
  }
}
```

### Solana USDC
```motoko
// Add to iso_dapp/main.mo

// USDC token mint on Solana
let usdcMintSolana = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

// Monitor USDC deposits on Solana
private func monitorUsdcSolanaDeposits() : async () {
  // Connect to Solana node
  let node = SolanaNode.connect({
    url = "https://api.testnet.solana.com";
  });
  
  // Get all addresses we're monitoring
  let addresses = getAllSolanaAddresses();
  
  // Check for new token transfers
  for (address in addresses.vals()) {
    // Get the associated token account for this address and the USDC mint
    let tokenAccount = await node.getAssociatedTokenAccount(address, usdcMintSolana);
    
    // Get token transfer history
    let transfers = await node.getTokenTransferHistory(tokenAccount);
    for (transfer in transfers.vals()) {
      if (isNewTransfer(transfer) and transfer.confirmations >= 32) {
        // Process the deposit
        let user = getUserByAddress(address);
        let amount = transfer.amount;
        await processDeposit(user, "USDC-SOL", amount);
      }
    }
  }
}
```

## 5. Secure Key Management

For production, we need to implement secure key management:

1. Use a Hardware Security Module (HSM) for storing private keys
2. Implement multi-signature wallets for added security
3. Set up cold storage for large amounts
4. Implement key rotation policies

```motoko
// Example of HSM integration (conceptual)
private func securelyStoreKey(keyPair : KeyPair) : async () {
  // In production, this would interface with an HSM
  // For now, we'll encrypt the key with a strong encryption algorithm
  let encryptedKey = await encryptWithAES256(
    keyPair.privateKey,
    getEncryptionKey()
  );
  
  // Store the encrypted key
  storeEncryptedKey(keyPair.publicKey, encryptedKey);
}

private func securelyRetrieveKey(publicKey : Text) : async Text {
  // Retrieve and decrypt the private key
  let encryptedKey = getEncryptedKey(publicKey);
  let privateKey = await decryptWithAES256(
    encryptedKey,
    getEncryptionKey()
  );
  
  return privateKey;
}
```

## 6. Implementation Plan

1. Start with testnet integration for all blockchains
2. Implement address generation and monitoring for each blockchain
3. Set up secure key management
4. Test deposit flows thoroughly
5. Migrate to mainnet with proper security controls

## 7. Security Considerations

- Never expose private keys in logs or error messages
- Implement rate limiting for address generation
- Set up monitoring for unusual activity
- Regularly audit the security of the implementation
- Implement proper error handling for blockchain node failures
