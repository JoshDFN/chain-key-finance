# Chain Key Integration Guide for Teleport

This document provides guidance on how to implement full Chain Key integration for Bitcoin and Ethereum on the Internet Computer for the Teleport platform.

## Overview

Chain Key technology enables the Internet Computer to integrate with other blockchains like Bitcoin and Ethereum. This allows canisters to:

1. Generate addresses for receiving assets
2. Monitor deposits to these addresses
3. Check transaction confirmations
4. Send transactions to these blockchains

## Bitcoin Integration

### Bitcoin API Reference

The Bitcoin integration is provided through the management canister (`aaaaa-aa`). The following APIs are available:

#### 1. Get Bitcoin Balance

```motoko
public func bitcoin_get_balance(network: BitcoinNetwork, address: Text) : async Satoshi {
    let managementCanister = actor("aaaaa-aa") : actor {
        bitcoin_get_balance : (BitcoinNetwork, Text) -> async Satoshi;
    };
    
    await managementCanister.bitcoin_get_balance(network, address)
}
```

#### 2. Get Bitcoin UTXOs

```motoko
public func bitcoin_get_utxos(network: BitcoinNetwork, address: Text) : async {
    utxos: [UTXO];
    tip_block_hash: BlockHash;
    tip_height: Nat32;
    next_page: ?Page;
} {
    let managementCanister = actor("aaaaa-aa") : actor {
        bitcoin_get_utxos : (BitcoinNetwork, GetUtxosRequest) -> async GetUtxosResponse;
    };
    
    let request = {
        address = address;
        filter = null;
        min_confirmations = null;
    };
    
    await managementCanister.bitcoin_get_utxos(network, request)
}
```

#### 3. Get Bitcoin Transaction

```motoko
public func bitcoin_get_transaction(network: BitcoinNetwork, txHash: Text) : async BitcoinTransaction {
    let managementCanister = actor("aaaaa-aa") : actor {
        bitcoin_get_transaction : (BitcoinNetwork, Text) -> async BitcoinTransaction;
    };
    
    await managementCanister.bitcoin_get_transaction(network, txHash)
}
```

#### 4. Send Bitcoin Transaction

```motoko
public func bitcoin_send_transaction(network: BitcoinNetwork, transaction: [Nat8]) : async Text {
    let managementCanister = actor("aaaaa-aa") : actor {
        bitcoin_send_transaction : (BitcoinNetwork, [Nat8]) -> async Text;
    };
    
    await managementCanister.bitcoin_send_transaction(network, transaction)
}
```

### Bitcoin Address Generation

To generate a Bitcoin address for a user, you need to:

1. Create a key pair for the user
2. Derive a Bitcoin address from the public key
3. Store the key pair securely

Here's an example of how to generate a P2PKH address:

```motoko
public func generateBitcoinAddress(user: Principal) : async Text {
    // Generate a key pair for the user
    let keyPair = await generateKeyPair(user);
    
    // Derive a Bitcoin address from the public key
    let address = await deriveP2PKHAddress(keyPair.publicKey);
    
    // Store the key pair securely
    await storeKeyPair(user, keyPair);
    
    address
}
```

### Monitoring Bitcoin Deposits

To monitor Bitcoin deposits, you need to:

1. Periodically check the UTXOs for the user's address
2. Compare with previously known UTXOs to identify new deposits
3. Verify transaction confirmations

Here's an example:

```motoko
public func monitorBitcoinDeposits(user: Principal) : async ?TxHash {
    // Get the user's Bitcoin address
    let address = await getUserBitcoinAddress(user);
    
    // Get the UTXOs for this address
    let utxoResponse = await bitcoin_get_utxos(#testnet, address);
    
    // Compare with previously known UTXOs to identify new deposits
    let newUtxos = await findNewUtxos(user, utxoResponse.utxos);
    
    if (newUtxos.size() > 0) {
        // Get the transaction hash for the first new UTXO
        let txHash = newUtxos[0].outpoint.txid;
        
        // Store the new UTXOs
        await storeUtxos(user, utxoResponse.utxos);
        
        return ?txHash;
    };
    
    null
}
```

## Ethereum Integration

### Ethereum API Reference

The Ethereum integration is also provided through the management canister (`aaaaa-aa`). The following APIs are available:

#### 1. Get Ethereum Balance

```motoko
public func ethereum_get_balance(network: EthereumNetwork, address: Text) : async Wei {
    let managementCanister = actor("aaaaa-aa") : actor {
        ethereum_get_balance : (EthereumNetwork, Text) -> async Wei;
    };
    
    await managementCanister.ethereum_get_balance(network, address)
}
```

#### 2. Call Ethereum Contract

```motoko
public func ethereum_call(network: EthereumNetwork, call: EthereumCall) : async [Nat8] {
    let managementCanister = actor("aaaaa-aa") : actor {
        ethereum_call : (EthereumNetwork, EthereumCall) -> async [Nat8];
    };
    
    await managementCanister.ethereum_call(network, call)
}
```

#### 3. Get Ethereum Transaction

```motoko
public func ethereum_get_transaction(network: EthereumNetwork, txHash: Text) : async EthereumTransaction {
    let managementCanister = actor("aaaaa-aa") : actor {
        ethereum_get_transaction : (EthereumNetwork, Text) -> async EthereumTransaction;
    };
    
    await managementCanister.ethereum_get_transaction(network, txHash)
}
```

#### 4. Send Ethereum Transaction

```motoko
public func ethereum_send_transaction(network: EthereumNetwork, transaction: EthereumTransaction) : async Text {
    let managementCanister = actor("aaaaa-aa") : actor {
        ethereum_send_transaction : (EthereumNetwork, EthereumTransaction) -> async Text;
    };
    
    await managementCanister.ethereum_send_transaction(network, transaction)
}
```

### Ethereum Address Generation

To generate an Ethereum address for a user, you need to:

1. Create a key pair for the user
2. Derive an Ethereum address from the public key
3. Store the key pair securely

Here's an example:

```motoko
public func generateEthereumAddress(user: Principal) : async Text {
    // Generate a key pair for the user
    let keyPair = await generateKeyPair(user);
    
    // Derive an Ethereum address from the public key
    let address = await deriveEthereumAddress(keyPair.publicKey);
    
    // Store the key pair securely
    await storeKeyPair(user, keyPair);
    
    address
}
```

### Monitoring Ethereum Deposits

To monitor Ethereum deposits, you need to:

1. Periodically check the balance for the user's address
2. Compare with previously known balance to identify new deposits
3. Verify transaction confirmations

Here's an example:

```motoko
public func monitorEthereumDeposits(user: Principal) : async ?TxHash {
    // Get the user's Ethereum address
    let address = await getUserEthereumAddress(user);
    
    // Get the balance for this address
    let balance = await ethereum_get_balance(#sepolia, address);
    
    // Get the previously known balance
    let previousBalance = await getUserPreviousBalance(user);
    
    if (balance > previousBalance) {
        // A deposit has been made
        // In a real implementation, you would get the transaction hash from the blockchain
        let txHash = "eth-" # address # "-" # Int.toText(Time.now());
        
        // Store the new balance
        await storeUserBalance(user, balance);
        
        return ?txHash;
    };
    
    null
}
```

## Security Considerations

When implementing Chain Key integration, consider the following security measures:

1. **Key Management**: Securely store private keys and never expose them
2. **Transaction Verification**: Always verify transaction confirmations before considering a deposit as final
3. **Error Handling**: Implement proper error handling for all blockchain operations
4. **Rate Limiting**: Implement rate limiting to prevent abuse of your canister
5. **Access Control**: Implement proper access control to prevent unauthorized access to sensitive functions

## Resources

- [Internet Computer Bitcoin Integration Documentation](https://internetcomputer.org/docs/current/developer-docs/integrations/bitcoin/bitcoin-how-it-works)
- [Internet Computer Ethereum Integration Documentation](https://internetcomputer.org/docs/current/developer-docs/integrations/ethereum/ethereum-how-it-works)
- [Bitcoin Integration Examples](https://github.com/dfinity/examples/tree/master/motoko/bitcoin)
- [Ethereum Integration Examples](https://github.com/dfinity/examples/tree/master/motoko/ethereum)
