import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Time "mo:base/Time";
import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Option "mo:base/Option";
import Error "mo:base/Error";
import Cycles "mo:base/ExperimentalCycles";
import Debug "mo:base/Debug";
import Iter "mo:base/Iter";
import Nat8 "mo:base/Nat8";

module {
    // Types for Bitcoin integration
    public type BitcoinNetwork = {
        #mainnet;
        #testnet;
    };
    
    public type GetUtxosResponse = {
        utxos : [BitcoinUtxo];
        tip_block_hash : [Nat8];
        tip_height : Nat32;
        next_page : ?[Nat8];
    };
    
    public type BitcoinUtxo = {
        outpoint : {
            txid : [Nat8];
            vout : Nat32;
        };
        value : Nat64;
        height : Nat32;
    };
    
    public type BitcoinTransactionStatus = {
        confirmations : Nat;
        value : Nat64;
        status : Text;
    };
    
    // Types for Chain Key token integration
    public type TokenCanister = actor {
        mint : (to: Principal, amount: Nat) -> async ();
        balanceOf : (owner: Principal) -> async Nat;
        transfer : (to: Principal, amount: Nat) -> async Bool;
    };
    
    // Ethereum types
    public type EthereumNetwork = {
        #mainnet;
        #sepolia;
    };
    
    // Configuration for Chain Key services
    public type ChainKeyConfig = {
        bitcoin_network : BitcoinNetwork;
        ethereum_network : EthereumNetwork;
        ckBTC_ledger_canister_id : Text;
        ckETH_ledger_canister_id : Text;
        ckUSDC_ledger_canister_id : Text;
        btc_min_confirmations : Nat32;
        eth_min_confirmations : Nat32;
    };
    
    // Default configuration for mainnet
    public func defaultConfig() : ChainKeyConfig {
        {
            bitcoin_network = #mainnet;
            ethereum_network = #mainnet;
            ckBTC_ledger_canister_id = "mxzaz-hqaaa-aaaar-qaada-cai";  // Mainnet ckBTC
            ckETH_ledger_canister_id = "ss2fx-dyaaa-aaaar-qacoq-cai";  // Mainnet ckETH
            ckUSDC_ledger_canister_id = "4oswu-zaaaa-aaaai-q3una-cai"; // Project ckUSDC
            btc_min_confirmations = 6;
            eth_min_confirmations = 12;
        }
    };
    
    // Function to generate a Bitcoin address using the management canister
    public func generateBitcoinAddress(user : Principal, config : ChainKeyConfig) : async Text {
        let management_canister = actor ("aaaaa-aa") : actor {
            bitcoin_get_address : { 
                network : BitcoinNetwork; 
                address_index : Nat32;
                key_name : Text;
            } -> async Text;
        };
        
        // Generate a unique address index for the user
        let addressIndex : Nat32 = Text.hash(Principal.toText(user)) % 10000;
        
        // Get an address from the Bitcoin integration
        // Use a standard key name that the management canister recognizes
        let address = await management_canister.bitcoin_get_address({
            network = config.bitcoin_network;
            address_index = addressIndex;
            key_name = switch (config.bitcoin_network) {
                case (#mainnet) { "ic-btc-mainnet" }; // Production key for real Bitcoin mainnet
                case (#testnet) { "ic-btc-testnet" }; // Production key for Bitcoin testnet
            }
        });
        
        address
    };
    
    // Function to check BTC UTXOs for a given address
    public func getBitcoinUtxos(address : Text, config : ChainKeyConfig) : async GetUtxosResponse {
        let management_canister = actor ("aaaaa-aa") : actor {
            bitcoin_get_utxos : { 
                network : BitcoinNetwork; 
                address : Text; 
                filter : ?{
                    #min_confirmations : Nat32;
                    #page : { 
                        limit : Nat32; 
                        offset : [Nat8]; 
                    };
                }
            } -> async GetUtxosResponse;
        };
        
        // Get UTXOs with the minimum confirmation requirement
        let utxos = await management_canister.bitcoin_get_utxos({
            network = config.bitcoin_network;
            address = address;
            filter = ?#min_confirmations(config.btc_min_confirmations);
        });
        
        utxos
    };
    
    // Function to mint ckBTC tokens after BTC deposit confirmation
    public func mintCkBTC(user : Principal, amount : Nat64, config : ChainKeyConfig) : async Bool {
        try {
            let ckBTC_canister = actor(config.ckBTC_ledger_canister_id) : TokenCanister;
            
            // Convert satoshis to ckBTC amount (same decimal precision)
            let ckBTCAmount = Nat64.toNat(amount);
            
            // Mint ckBTC to the user
            await ckBTC_canister.mint(user, ckBTCAmount);
            
            true
        } catch (e) {
            Debug.print("Failed to mint ckBTC: " # Error.message(e));
            false
        }
    };
    
    // Type definitions for Chain Key ETH already defined above

    // Functions for Ethereum address generation using Chain Key ETH
    public func generateEthereumAddress(user : Principal, config : ChainKeyConfig) : async Text {
        let management_canister = actor ("aaaaa-aa") : actor {
            ethereum_get_address : { 
                network : EthereumNetwork;
                address_index : Nat32;
            } -> async Text;
        };
        
        // Generate a unique address index for the user
        let addressIndex : Nat32 = Text.hash(Principal.toText(user)) % 10000;
        
        // Get an Ethereum address using the ethereum_get_address method
        let network : EthereumNetwork = config.ethereum_network;
        
        let address = await management_canister.ethereum_get_address({
            network = network;
            address_index = addressIndex;
        });
        
        address
    };

    // Function to check Ethereum balances at an address
    public func getEthereumBalance(address : Text) : async ?Nat {
        let management_canister = actor ("aaaaa-aa") : actor {
            ethereum_get_balance : { 
                network : EthereumNetwork;
                address : Text;
            } -> async { balance : Nat };
        };
        
        try {
            let network : EthereumNetwork = #mainnet; // Use #sepolia for testnet
            let result = await management_canister.ethereum_get_balance({
                network = network;
                address = address;
            });
            
            ?result.balance
        } catch (e) {
            Debug.print("Failed to get ETH balance: " # Error.message(e));
            null
        }
    };

    // Function to mint ckETH tokens
    public func mintCkETH(user : Principal, amount : Nat, config : ChainKeyConfig) : async Bool {
        try {
            let ckETH_canister = actor(config.ckETH_ledger_canister_id) : TokenCanister;
            
            // Mint ckETH to the user
            await ckETH_canister.mint(user, amount);
            
            true
        } catch (e) {
            Debug.print("Failed to mint ckETH: " # Error.message(e));
            false
        }
    };

    // Function to monitor an Ethereum address for deposits
    public func monitorEthereumAddress(address : Text, lastBalance : ?Nat) : async ?Nat {
        let currentBalance = await getEthereumBalance(address);
        
        switch (lastBalance, currentBalance) {
            case (null, ?balance) {
                // First time checking, just return the balance
                ?balance
            };
            case (?lastBal, ?currentBal) {
                if (currentBal > lastBal) {
                    // New deposit detected!
                    ?currentBal
                } else {
                    // No new deposit
                    null
                }
            };
            case (_, _) {
                // Error retrieving balance
                null
            }
        };
    };
    
    // Functions for USDC support via Ethereum
    
    // Check for USDC deposits (using Ethereum's ERC-20 interface)
    public func getUSDCBalance(address : Text) : async ?Nat {
        let management_canister = actor ("aaaaa-aa") : actor {
            ethereum_call_read : { 
                network : EthereumNetwork;
                contract_address : Text;
                method_name : Text;
                args : [Blob];
                abi : Text;
            } -> async { result : Blob };
        };
        
        try {
            // USDC contract address on Ethereum Mainnet
            let usdc_contract = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
            
            // ABI for balanceOf function
            let abi = "{\"constant\":true,\"inputs\":[{\"name\":\"_owner\",\"type\":\"address\"}],\"name\":\"balanceOf\",\"outputs\":[{\"name\":\"balance\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"}";
            
            // Encode the function call arguments for the balanceOf function
            // The address needs to be properly encoded according to Ethereum ABI
            // This is a simplified version - in production you'd use a proper ABI encoder
            let padded_address = padAddressForABI(address);
            
            let network : EthereumNetwork = #mainnet; // Use #sepolia for testnet
            
            // Call the balanceOf method on the USDC contract
            let result = await management_canister.ethereum_call_read({
                network = network;
                contract_address = usdc_contract;
                method_name = "balanceOf";
                args = [Blob.fromArray(padded_address)];
                abi = abi;
            });
            
            // Decode the result from the Ethereum call
            // The result is a uint256 value in big-endian format
            let balance_bytes = Blob.toArray(result.result);
            
            // Convert byte array to Nat
            var balance : Nat = 0;
            for (i in Iter.range(0, balance_bytes.size() - 1)) {
                balance := balance * 256 + Nat8.toNat(balance_bytes[i]);
            };
            
            ?balance
        } catch (e) {
            Debug.print("Failed to get USDC balance: " # Error.message(e));
            null
        }
    };
    
    // Helper function to pad an Ethereum address for ABI encoding
    public func padAddressForABI(address : Text) : [Nat8] {
        // Remove '0x' prefix if present
        let cleanAddress = if (Text.startsWith(address, #text "0x")) {
            let addrSize = address.size();
            if (addrSize > 2) {
                // Get chars after '0x'
                let chars = Text.toArray(address);
                var result = "";
                var i = 2;
                while (i < chars.size()) {
                    result := result # Text.fromChar(chars[i]);
                    i += 1;
                };
                result
            } else {
                address
            }
        } else {
            address
        };
        
        // Convert hex string to bytes
        var bytes : [Nat8] = [];
        let addrSize = cleanAddress.size();
        let chars = Text.toArray(cleanAddress);
        for (i in Iter.range(0, addrSize / 2 - 1)) {
            let start = i * 2;
            let end = start + 2;
            if (end <= chars.size()) {
                // Get a 2-character substring
                let byteStr = Text.fromChar(chars[start]) # Text.fromChar(chars[start + 1]);
                let byte : Nat8 = hexPairToByte(byteStr);
                bytes := Array.append(bytes, [byte]);
            };
        };
        
        // Pad to 32 bytes (ABI encoding requires 32-byte word)
        let padding = Array.tabulate<Nat8>(32 - bytes.size(), func(_ : Nat) : Nat8 { 0 });
        Array.append(padding, bytes)
    };
    
    // Helper function to convert a hex pair to a byte
    public func hexPairToByte(hex : Text) : Nat8 {
        var value : Nat8 = 0;
        
        // Process first character (high nibble)
        if (hex.size() > 0) {
            let chars = Text.toArray(hex);
            if (chars.size() > 0) {
                let c1 = chars[0];
                let h = charToNibble(c1);
                value := value + (h * 16);
            };
            
            // Process second character (low nibble)
            if (chars.size() > 1) {
                let c2 = chars[1];
                let l = charToNibble(c2);
                value := value + l;
            };
        };
        
        value
    };
    
    // Helper function to convert a hex character to a 4-bit value
    private func charToNibble(c : Char) : Nat8 {
        switch (c) {
            case '0' { 0 };
            case '1' { 1 };
            case '2' { 2 };
            case '3' { 3 };
            case '4' { 4 };
            case '5' { 5 };
            case '6' { 6 };
            case '7' { 7 };
            case '8' { 8 };
            case '9' { 9 };
            case 'a' { 10 };
            case 'b' { 11 };
            case 'c' { 12 };
            case 'd' { 13 };
            case 'e' { 14 };
            case 'f' { 15 };
            case 'A' { 10 };
            case 'B' { 11 };
            case 'C' { 12 };
            case 'D' { 13 };
            case 'E' { 14 };
            case 'F' { 15 };
            case _ { 0 };
        };
    };
    
    // Utility function to convert text to byte array
    public func textToBytes(text : Text) : [Nat8] {
        let bytes = Blob.toArray(Text.encodeUtf8(text));
        bytes
    };
    
    // Monitor USDC balance changes
    public func monitorUSDCAddress(address : Text, lastBalance : ?Nat) : async ?Nat {
        let currentBalance = await getUSDCBalance(address);
        
        switch (lastBalance, currentBalance) {
            case (null, ?balance) {
                // First time checking, just return the balance
                ?balance
            };
            case (?lastBal, ?currentBal) {
                if (currentBal > lastBal) {
                    // New deposit detected!
                    ?currentBal
                } else {
                    // No new deposit
                    null
                }
            };
            case (_, _) {
                // Error retrieving balance
                null
            }
        };
    };
    
    // Function to monitor a Bitcoin address for deposits
    public func monitorBitcoinAddress(
        address : Text, 
        lastUtxos : [BitcoinUtxo],
        config : ChainKeyConfig
    ) : async {
        newUtxos : [BitcoinUtxo];
        deposits : [(Blob, Nat64)]; // [(txid, value)]
    } {
        let currentUtxos = await getBitcoinUtxos(address, config);
        
        // If no previous UTXOs, just return the current ones with no deposits
        if (lastUtxos.size() == 0) {
            {
                newUtxos = currentUtxos.utxos;
                deposits = [];
            }
        } else {
            // Find new UTXOs by comparing with last known UTXOs
            var newDeposits : [(Blob, Nat64)] = [];
        
        for (utxo in currentUtxos.utxos.vals()) {
            var isNew = true;
            
            for (lastUtxo in lastUtxos.vals()) {
                if (utxo.outpoint.vout == lastUtxo.outpoint.vout and 
                    Array.equal(utxo.outpoint.txid, lastUtxo.outpoint.txid, Nat8.equal)) {
                    isNew := false;
                };
            };
            
            if (isNew) {
                newDeposits := Array.append(newDeposits, [(Blob.fromArray(utxo.outpoint.txid), utxo.value)]);
            };
        };
        
            {
                newUtxos = currentUtxos.utxos;
                deposits = newDeposits;
            }
        }
    };
}