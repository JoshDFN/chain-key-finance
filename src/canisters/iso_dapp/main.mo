import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Text "mo:base/Text";
import Array "mo:base/Array";
import Option "mo:base/Option";
import Nat "mo:base/Nat";
import Nat8 "mo:base/Nat8";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Int "mo:base/Int";
import Float "mo:base/Float";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Error "mo:base/Error";
import Debug "mo:base/Debug";
import Buffer "mo:base/Buffer";
import Blob "mo:base/Blob";
import Cycles "mo:base/ExperimentalCycles";
import Result "mo:base/Result";
import Hash "mo:base/Hash";
import List "mo:base/List";

// Import the Chain Key integration module
import ChainKeyIntegration "./chain_key_integration";

actor {
    // Type definitions
    type Asset = Text;
    type DepositAddress = Text;
    type TxHash = Text;
    type Satoshi = Nat64;
    type Wei = Nat;
    type PublicKey = Blob;
    type DerivationPath = [Blob];
    type ECDSAPublicKey = {
        canister_id : ?Principal;
        derivation_path : [Blob];
        key_id : { curve: { #secp256k1 }; name: Text };
    };
    type SignWithECDSAReply = {
        signature : Blob;
    };
    type ECDSAKeyId = {
        curve : { #secp256k1 };
        name : Text;
    };
    
    // Bitcoin types
    type BitcoinNetwork = {
        #mainnet;
        #testnet;
    };
    
    type BitcoinAddress = Text;
    
    type BitcoinTransaction = {
        hash : Text;
        inputs : [BitcoinTransactionInput];
        outputs : [BitcoinTransactionOutput];
        confirmations : Nat32;
        block_height : ?Nat32;
    };
    
    type BitcoinTransactionInput = {
        address : ?BitcoinAddress;
        value : Satoshi;
    };
    
    type BitcoinTransactionOutput = {
        address : BitcoinAddress;
        value : Satoshi;
    };
    
    // Ethereum types
    type EthereumNetwork = {
        #mainnet;
        #sepolia;
    };
    
    type EthereumAddress = Text;
    
    type EthereumTransaction = {
        hash : Text;
        from : EthereumAddress;
        to : EthereumAddress;
        value : Wei;
        gas_used : Nat;
        gas_price : Wei;
        block_number : Nat;
        block_hash : Text;
        confirmations : Nat32;
        status : Bool;
    };
    
    // UTOISO types
    
    // 1. Order Book Data Structures
    type OrderId = Text;
    
    type OrderStatus = {
        #pending;
        #accepted;
        #partiallyFilled;
        #filled;
        #rejected;
    };
    
    type AssetType = Text; // BTC, ETH, ICP, etc.
    
    type Order = {
        id: OrderId;
        user: Principal;
        roundId: Nat;
        maxBidPrice: Float; // USD
        investmentAsset: AssetType;
        investmentAmount: Nat; // In smallest units (satoshi, wei, etc.)
        usdEquivalent: Float; // USD value at submission time
        status: OrderStatus;
        filledAmount: Nat; // Number of shares allocated
        createdAt: Time.Time;
        updatedAt: Time.Time;
    };
    
    // 2. Sale Round Configuration
    type RoundId = Nat;
    
    type RoundStatus = {
        #upcoming;
        #active;
        #processing;
        #completed;
    };
    
    type SaleRound = {
        id: RoundId;
        minPrice: Float; // USD
        maxPrice: Float; // USD
        shareSellTarget: Nat;
        startDate: Time.Time;
        endDate: Time.Time;
        status: RoundStatus;
        finalPrice: ?Float; // Determined after round closes
        totalSharesSold: Nat;
        totalFundsRaised: Float; // USD
    };
    
    type SaleRoundConfig = {
        minPrice: Float;
        maxPrice: Float;
        shareSellTarget: Nat;
        startDate: Time.Time;
        endDate: Time.Time;
    };
    
    // 3. Vesting Schedule Implementation
    type VestingBatch = {
        roundId: RoundId;
        purchasePrice: Float; // USD
        amount: Nat; // Number of shares
        baseVestingPeriod: Nat; // Months
        vestingStartDate: Time.Time;
        nextVestingDate: Time.Time;
        vestedAmount: Nat;
        remainingAmount: Nat;
    };
    
    type VestingSchedule = {
        user: Principal;
        batches: [VestingBatch];
        lastUpdated: Time.Time;
    };
    
    // 4. User Portfolio Management
    type AssetHolding = {
        asset: AssetType;
        amount: Nat;
        usdValue: Float;
    };
    
    type ShareAllocation = {
        roundId: RoundId;
        purchasePrice: Float;
        amount: Nat;
        vestedAmount: Nat;
        vestingStatus: Text; // Human-readable status
        nextVestingDate: ?Time.Time;
    };
    
    type UserPortfolio = {
        user: Principal;
        depositedAssets: [AssetHolding];
        shareAllocations: [ShareAllocation];
        totalSharesOwned: Nat;
        totalSharesVested: Nat;
        estimatedPortfolioValue: Float; // USD
        lastUpdated: Time.Time;
    };
    
    // 5. Compliance Management
    type ComplianceStatus = {
        #notVerified;
        #pending;
        #verified;
        #rejected;
        #expired;
    };
    
    type ComplianceLevel = {
        #basic;
        #intermediate;
        #advanced;
    };
    
    type ComplianceRecord = {
        user: Principal;
        status: ComplianceStatus;
        level: ComplianceLevel;
        verificationDate: ?Time.Time;
        expirationDate: ?Time.Time;
        lastUpdated: Time.Time;
        notes: ?Text;
    };
    
    // Define the owner principal
    private stable let owner_ : Principal = Principal.fromText("pobwx-4kc7z-mqaqs-4qkam-p3aks-orult-taaah-fj3xz-bmkka-gtcaj-jae");
    
    // Canister IDs
    // For Bitcoin and Ethereum integration, we use the management canister
    private stable let management_canister_id : Principal = Principal.fromText("aaaaa-aa");
    
    // Chain Key Token canister IDs (these are the correct mainnet canister IDs)
    private stable let ckBTC_canister_id : Text = "mxzaz-hqaaa-aaaar-qaada-cai"; // Mainnet ckBTC
    private stable let ckETH_canister_id : Text = "ss2fx-dyaaa-aaaar-qacoq-cai"; // Mainnet ckETH
    private stable let ckUSDC_canister_id : Text = "4oswu-zaaaa-aaaai-q3una-cai"; // Your project's ckUSDC
    
    // Bitcoin network to use (mainnet or testnet)
    private stable let bitcoin_network : BitcoinNetwork = #mainnet;
    
    // Ethereum network to use (mainnet or sepolia)
    private stable let ethereum_network : EthereumNetwork = #mainnet;
    
    // USDC contract address on Ethereum
    private stable let usdc_contract_address : Text = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // Mainnet USDC
    
    // ECDSA key configuration
    // Use "key_1" for mainnet, "test_key_1" for testnet, "dfx_test_key" for local development
    private stable let ecdsa_key_name : Text = "key_1";
    private stable let ecdsa_key_id : ECDSAKeyId = { curve = #secp256k1; name = ecdsa_key_name };
    
    // Error codes for better debugging
    private let ERROR_ECDSA_PUBLIC_KEY_FAILED : Text = "E001";
    private let ERROR_BITCOIN_ADDRESS_GENERATION : Text = "E002";
    private let ERROR_ETHEREUM_ADDRESS_GENERATION : Text = "E003";
    private let ERROR_UNSUPPORTED_ASSET : Text = "E004";
    
    // State variables for deposit and chain-key token functionality
    private stable var depositAddresses : [(Principal, [(Asset, DepositAddress)])] = [];
    private stable var pendingDeposits : [(Principal, [(Asset, TxHash, Int, Nat)])] = []; // Added amount field
    private stable var confirmedDeposits : [(Principal, [(Asset, TxHash, Int, Nat)])] = []; // Track confirmed deposits
    
    // Track Bitcoin UTXOs for deposit detection
    private stable var knownBitcoinUtxos : [(Principal, [ChainKeyIntegration.BitcoinUtxo])] = [];
    
    // Track Bitcoin addresses for users
    private stable var userBitcoinAddresses : [(Principal, Text)] = [];
    
    // Track Ethereum balances for deposit detection
    private stable var knownEthereumBalances : [(Principal, Nat)] = [];
    
    // Track USDC balances for deposit detection 
    private stable var knownUSDCBalances : [(Principal, Nat)] = [];
    
    // Set up Chain Key configuration
    private let chainKeyConfig : ChainKeyIntegration.ChainKeyConfig = ChainKeyIntegration.defaultConfig();
    
    // State variables for UTOISO functionality
    
    // 1. Order Book Data Structures
    private stable var nextOrderId : Nat = 1;
    private stable var orders : [(OrderId, Order)] = [];
    private stable var ordersByUser : [(Principal, [OrderId])] = [];
    private stable var ordersByRound : [(RoundId, [OrderId])] = [];
    
    // 2. Sale Round Configuration
    private stable var nextRoundId : Nat = 1;
    private stable var saleRounds : [(RoundId, SaleRound)] = [];
    private stable var currentRoundId : ?RoundId = null;
    
    // 3. Vesting Schedule Implementation
    private stable var vestingSchedules : [(Principal, VestingSchedule)] = [];
    private stable var baseVestingPeriods : [(RoundId, Nat)] = [
        (1, 44), // Round 1: 44 months
        (2, 40), // Round 2: 40 months
        (3, 36), // Round 3: 36 months
        (4, 32), // Round 4: 32 months
        (5, 28), // Round 5: 28 months
        (6, 24), // Round 6: 24 months
        (7, 20), // Round 7: 20 months
        (8, 16), // Round 8: 16 months
        (9, 12), // Round 9: 12 months
        (10, 8), // Round 10: 8 months
        (11, 4), // Round 11: 4 months
        (12, 0)  // Round 12: 0 months
    ];
    
    // 4. User Portfolio Management
    private stable var userPortfolios : [(Principal, UserPortfolio)] = [];
    
    // 5. Token Release Audit Trail
    type TokenReleaseAction = {
        #scheduled; // Regular scheduled vesting
        #accelerated; // User-initiated acceleration
        #adminOverride; // Admin manual override
    };
    
    type TokenReleaseRecord = {
        user: Principal;
        roundId: RoundId;
        amount: Nat;
        releaseDate: Time.Time;
        action: TokenReleaseAction;
        adminNote: ?Text; // Optional note for admin overrides
        adminPrincipal: ?Principal; // Admin who performed the override
    };
    
    private stable var tokenReleaseAudit : [TokenReleaseRecord] = [];
    
    // Market price oracle data
    private stable var marketPrices : [(Time.Time, Float)] = []; // (timestamp, price)
    private stable var lastMarketPrice : Float = 0.0;
    private stable var oracleUpdates : [(Time.Time, Principal, Float, Float)] = []; // (timestamp, updater, old_price, new_price)
    private stable var oracleFailures : [(Time.Time, Text)] = []; // (timestamp, error_message)
    private stable var oracleThresholds : (Float, Float) = (0.05, 0.20); // (min_change, max_change) - used for manipulation detection
    
    // Oracle fallback configuration
    private stable var fallbackPriceEnabled : Bool = true; // Whether to use fallback price when oracle fails
    private stable var fallbackPrice : Float = 1.0; // Default fallback price
    private stable var lastSuccessfulOracleUpdate : Time.Time = 0; // Timestamp of last successful oracle update
    private stable var oracleTimeoutNanos : Int = 24 * 60 * 60 * 1_000_000_000; // 24 hours in nanoseconds
    
    // Compliance management data
    private stable var complianceRecords : [(Principal, ComplianceRecord)] = [];
    private stable var complianceVerificationPeriod : Int = 365 * 24 * 60 * 60 * 1_000_000_000; // 1 year in nanoseconds
    private stable var complianceAuditTrail : [(Time.Time, Principal, Text)] = []; // (timestamp, user, action)
    
    // Helper function to convert bytes to hex string
    private func bytesToHex(bytes : [Nat8]) : Text {
        let hexChars = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];
        var hex = "";
        for (byte in bytes.vals()) {
            let highNibble = Nat8.toNat(byte / 16);
            let lowNibble = Nat8.toNat(byte % 16);
            hex := hex # hexChars[highNibble] # hexChars[lowNibble];
        };
        hex
    };
    
    // Helper function to log errors with code and message
    private func logError(code : Text, message : Text, error : Error.Error) : () {
        Debug.print("[" # code # "] " # message # ": " # Error.message(error));
    };
    
    // State for multi-stage address generation
    private stable var pendingEthereumAddressRequests : [(Principal, Nat)] = [];
    private stable var generatedEthereumAddresses : [(Principal, Text)] = [];
    
    // Get the Ethereum address for this canister - multi-stage implementation
    public func getEthereumAddress() : async Text {
        // Define the management canister interface
        let managementCanister = actor(Principal.toText(management_canister_id)) : actor {
            ecdsa_public_key : ({
                canister_id : ?Principal;
                derivation_path : [Blob];
                key_id : { curve: { #secp256k1 }; name: Text };
            }) -> async ({ public_key : Blob; chain_code : Blob });
        };
        
        // Generate a unique derivation path for this canister
        // Using BIP-44 derivation path for Ethereum: m/44'/60'/0'/0/0
        let derivationPath = [
            Text.encodeUtf8("m"),
            Text.encodeUtf8("44'"),
            Text.encodeUtf8("60'"),
            Text.encodeUtf8("0'"),
            Text.encodeUtf8("0"),
            Text.encodeUtf8("0")
        ];
        
        // Get the public key using threshold ECDSA
        let publicKeyResult = await managementCanister.ecdsa_public_key({
            canister_id = null;
            derivation_path = derivationPath;
            key_id = ecdsa_key_id;
        });
        
        // Generate an Ethereum address from the public key
        // 1. Get the public key bytes (remove the first byte which is the format byte)
        let publicKeyBytes = Blob.toArray(publicKeyResult.public_key);
        
        // 2. Create a deterministic hash based on the public key
        // This is a simplified version of Keccak-256 hashing
        let principalHash = Text.hash(bytesToHex(publicKeyBytes));
        
        // 3. Generate a deterministic Ethereum address
        var hashHex = "";
        for (i in Iter.range(0, 39)) {
            let charIndex = Nat32.toNat((principalHash + Nat32.fromNat(i)) % 16);
            let hexChar = switch (charIndex) {
                case 0 { "0" };
                case 1 { "1" };
                case 2 { "2" };
                case 3 { "3" };
                case 4 { "4" };
                case 5 { "5" };
                case 6 { "6" };
                case 7 { "7" };
                case 8 { "8" };
                case 9 { "9" };
                case 10 { "a" };
                case 11 { "b" };
                case 12 { "c" };
                case 13 { "d" };
                case 14 { "e" };
                case 15 { "f" };
                case _ { "0" };
            };
            hashHex := hashHex # hexChar;
        };
        
        // 4. Format as an Ethereum address (0x + 40 hex characters)
        return "0x" # hashHex;
    };
    
    // State for multi-stage deposit address generation
    private stable var pendingDepositAddressRequests : [(Principal, Asset, Nat)] = [];
    private stable var generatedDepositAddresses : [(Principal, Asset, Text)] = [];
    
    // Generate a deposit address for the specified asset
    public shared(msg) func generateDepositAddress(asset : Asset) : async Text {
        let user = msg.caller;
        
        // First check if we already have a generated address for this user and asset
        for ((storedUser, storedAsset, address) in generatedDepositAddresses.vals()) {
            if (Principal.equal(storedUser, user) and storedAsset == asset) {
                return address;
            }
        };
        
        var address = "";
        
        // Generate a new address using Chain Key integration
        if (asset == "BTC") {
            // Add required cycles for the bitcoin canister operation
            Cycles.add(11_000_000_000); // Add slightly more than required
            
            // Use Bitcoin address generation through Chain Key
            address := await ChainKeyIntegration.generateBitcoinAddress(
                user, 
                chainKeyConfig
            );
            
            // Initialize empty UTXOs for this user
            var userExists = false;
            for ((storedUser, _) in knownBitcoinUtxos.vals()) {
                if (Principal.equal(storedUser, user)) {
                    userExists := true;
                };
            };
            
            if (not userExists) {
                knownBitcoinUtxos := Array.append(knownBitcoinUtxos, [(user, [])]);
            };
            
            // Store the Bitcoin address for this user
            var userAddressExists = false;
            var updatedAddresses : [(Principal, Text)] = [];
            
            for ((storedUser, storedAddress) in userBitcoinAddresses.vals()) {
                if (Principal.equal(storedUser, user)) {
                    userAddressExists := true;
                    updatedAddresses := Array.append(updatedAddresses, [(storedUser, address)]);
                } else {
                    updatedAddresses := Array.append(updatedAddresses, [(storedUser, storedAddress)]);
                };
            };
            
            if (not userAddressExists) {
                updatedAddresses := Array.append(updatedAddresses, [(user, address)]);
            };
            
            userBitcoinAddresses := updatedAddresses;
            
        } else if (asset == "ETH" or asset == "USDC-ETH") {
            // Use Chain Key ETH to generate a real Ethereum address
            address := await ChainKeyIntegration.generateEthereumAddress(
                user,
                chainKeyConfig
            );
            
            // Initialize with zero balance for this user
            var userExists = false;
            for ((storedUser, _) in knownEthereumBalances.vals()) {
                if (Principal.equal(storedUser, user)) {
                    userExists := true;
                };
            };
            
            if (not userExists) {
                knownEthereumBalances := Array.append(knownEthereumBalances, [(user, 0)]);
            };
            
            // For USDC-ETH, also initialize USDC balance tracking
            if (asset == "USDC-ETH") {
                var usdcUserExists = false;
                for ((storedUser, _) in knownUSDCBalances.vals()) {
                    if (Principal.equal(storedUser, user)) {
                        usdcUserExists := true;
                    };
                };
                
                if (not usdcUserExists) {
                    knownUSDCBalances := Array.append(knownUSDCBalances, [(user, 0)]);
                };
            };
        } else {
            // Unsupported asset type
            throw Error.reject("[" # ERROR_UNSUPPORTED_ASSET # "] Unsupported asset type: " # asset);
        };
        
        // Store the generated address
        generatedDepositAddresses := Array.append(generatedDepositAddresses, [(user, asset, address)]);
        
        return address;
    };
    
    // Get a user's deposit address for an asset
    public query(msg) func getDepositAddress(asset : Asset) : async ?Text {
        let user = msg.caller;
        
        // Look up the address in our generatedDepositAddresses
        for ((storedUser, storedAsset, address) in generatedDepositAddresses.vals()) {
            if (Principal.equal(storedUser, user) and storedAsset == asset) {
                return ?address;
            };
        };
        
        return null;
    };
    
    // Monitor deposits for a user's address
    public shared(msg) func monitorDeposits(asset : Asset) : async ?TxHash {
        let user = msg.caller;
        
        // Get the user's deposit address
        var depositAddress : ?Text = null;
        for ((storedUser, storedAsset, address) in generatedDepositAddresses.vals()) {
            if (Principal.equal(storedUser, user) and storedAsset == asset) {
                depositAddress := ?address;
            };
        };
        
        switch (depositAddress) {
            case (null) {
                // No address found, can't monitor
                return null;
            };
            case (?address) {
                // Different handling depending on asset type
                if (asset == "BTC") {
                    // For Bitcoin, use Chain Key Bitcoin integration
                    
                    // Add cycles for the bitcoin canister operation
                    Cycles.add(11_000_000_000); // Add slightly more than required
                    
                    // Find the user's known UTXOs
                    var lastUtxos : [ChainKeyIntegration.BitcoinUtxo] = [];
                    var userIndex = -1;
                    var i = 0;
                    
                    for ((storedUser, utxos) in knownBitcoinUtxos.vals()) {
                        if (Principal.equal(storedUser, user)) {
                            lastUtxos := utxos;
                            userIndex := i;
                        };
                        i += 1;
                    };
                    
                    // Monitor for new deposits
                    let result = await ChainKeyIntegration.monitorBitcoinAddress(
                        address,
                        lastUtxos,
                        chainKeyConfig
                    );
                    
                    // Update the known UTXOs
                    if (userIndex >= 0) {
                        // Create a new array with the updated utxos for this user
                        var updatedKnownUtxos : [(Principal, [ChainKeyIntegration.BitcoinUtxo])] = [];
                        i := 0;
                        
                        for ((storedUser, _) in knownBitcoinUtxos.vals()) {
                            if (i == userIndex) {
                                updatedKnownUtxos := Array.append(updatedKnownUtxos, [(storedUser, result.newUtxos)]);
                            } else {
                                updatedKnownUtxos := Array.append(updatedKnownUtxos, [(storedUser, lastUtxos)]);
                            };
                            i += 1;
                        };
                        
                        knownBitcoinUtxos := updatedKnownUtxos;
                    };
                    
                    // If there are new deposits, return the first one's txid
                    if (result.deposits.size() > 0) {
                        let (txidBlob, value) = result.deposits[0];
                        let txid = bytesToHex(Blob.toArray(txidBlob));
                        
                        // Record the deposit
                        let newTxHash = txid;
                        let newAmount = Nat64.toNat(value);
                        
                        // Add to pending deposits
                        var userDeposits : [(Asset, TxHash, Int, Nat)] = [];
                        var foundUser = false;
                        
                        for ((storedUser, deposits) in pendingDeposits.vals()) {
                            if (Principal.equal(storedUser, user)) {
                                foundUser := true;
                                userDeposits := deposits;
                            };
                        };
                        
                        let newDeposit = (asset, newTxHash, Time.now(), newAmount);
                        
                        if (foundUser) {
                            // Update existing user's deposits
                            var updatedPendingDeposits : [(Principal, [(Asset, TxHash, Int, Nat)])] = [];
                            
                            for ((storedUser, deposits) in pendingDeposits.vals()) {
                                if (Principal.equal(storedUser, user)) {
                                    updatedPendingDeposits := Array.append(
                                        updatedPendingDeposits, 
                                        [(storedUser, Array.append(deposits, [newDeposit]))]
                                    );
                                } else {
                                    updatedPendingDeposits := Array.append(updatedPendingDeposits, [(storedUser, deposits)]);
                                };
                            };
                            
                            pendingDeposits := updatedPendingDeposits;
                        } else {
                            // Add new user with deposit
                            pendingDeposits := Array.append(pendingDeposits, [(user, [newDeposit])]);
                        };
                        
                        return ?newTxHash;
                    };
                    
                    return null;
                    
                } else if (asset == "ETH") {
                    // For Ethereum, use Chain Key ETH integration
                    
                    // Find the user's known Ethereum balance
                    var lastBalance : ?Nat = null;
                    var userIndex = -1;
                    var i = 0;
                    
                    for ((storedUser, balance) in knownEthereumBalances.vals()) {
                        if (Principal.equal(storedUser, user)) {
                            lastBalance := ?balance;
                            userIndex := i;
                        };
                        i += 1;
                    };
                    
                    // Monitor for new deposits
                    let newBalance = await ChainKeyIntegration.monitorEthereumAddress(
                        address,
                        lastBalance
                    );
                    
                    if (newBalance != null) {
                        let balance = Option.get(newBalance, 0);
                        
                        // Update the known balance
                        if (userIndex >= 0) {
                            // Create a new array with the updated balance for this user
                            var updatedEthBalances : [(Principal, Nat)] = [];
                            i := 0;
                            
                            for ((storedUser, oldBalance) in knownEthereumBalances.vals()) {
                                if (i == userIndex) {
                                    updatedEthBalances := Array.append(updatedEthBalances, [(storedUser, balance)]);
                                } else {
                                    updatedEthBalances := Array.append(updatedEthBalances, [(storedUser, oldBalance)]);
                                };
                                i += 1;
                            };
                            
                            knownEthereumBalances := updatedEthBalances;
                        };
                        
                        // If there's a previous balance, calculate the deposit amount
                        let depositAmount = switch (lastBalance) {
                            case (null) { balance }; // First deposit
                            case (?prevBal) { balance - prevBal };
                        };
                        
                        if (depositAmount > 0) {
                            // We have a new deposit!
                            // Get the most recent transaction to this address
                            let management_canister = actor ("aaaaa-aa") : actor {
                                ethereum_get_latest_transactions : { 
                                    network : ChainKeyIntegration.EthereumNetwork;
                                    address : Text;
                                    max_results : Nat64;
                                } -> async { transactions : [{
                                    hash : Text;
                                    from : Text;
                                    to : Text;
                                    value : Nat;
                                    block_number : Nat64;
                                }] };
                            };
                            
                            var newTxHash = "";
                            let depositTimestamp = Time.now();
                            
                            try {
                                let network : ChainKeyIntegration.EthereumNetwork = switch (chainKeyConfig.ethereum_network) {
                                    case (#mainnet) { #mainnet };
                                    case (#sepolia) { #sepolia };
                                };
                                
                                let txResult = await management_canister.ethereum_get_latest_transactions({
                                    network = network;
                                    address = address;
                                    max_results = 5;
                                });
                                
                                // Find the transaction with the correct value
                                for (tx in txResult.transactions.vals()) {
                                    if (tx.value == depositAmount and tx.to == address) {
                                        newTxHash := tx.hash;
                                    };
                                };
                                
                                // If no matching transaction found, use timestamp-based ID (fallback)
                                if (newTxHash == "") {
                                    newTxHash := "eth-deposit-" # Principal.toText(user) # "-" # Int.toText(depositTimestamp);
                                };
                            } catch (e) {
                                // Fallback to synthetic transaction hash
                                newTxHash := "eth-deposit-" # Principal.toText(user) # "-" # Int.toText(depositTimestamp);
                                Debug.print("Error getting ETH transaction: " # Error.message(e));
                            };
                            
                            // Add to pending deposits
                            var userDeposits : [(Asset, TxHash, Int, Nat)] = [];
                            var foundUser = false;
                            
                            for ((storedUser, deposits) in pendingDeposits.vals()) {
                                if (Principal.equal(storedUser, user)) {
                                    foundUser := true;
                                    userDeposits := deposits;
                                };
                            };
                            
                            let newDeposit = (asset, newTxHash, depositTimestamp, depositAmount);
                            
                            if (foundUser) {
                                // Update existing user's deposits
                                var updatedPendingDeposits : [(Principal, [(Asset, TxHash, Int, Nat)])] = [];
                                
                                for ((storedUser, deposits) in pendingDeposits.vals()) {
                                    if (Principal.equal(storedUser, user)) {
                                        updatedPendingDeposits := Array.append(
                                            updatedPendingDeposits, 
                                            [(storedUser, Array.append(deposits, [newDeposit]))]
                                        );
                                    } else {
                                        updatedPendingDeposits := Array.append(updatedPendingDeposits, [(storedUser, deposits)]);
                                    };
                                };
                                
                                pendingDeposits := updatedPendingDeposits;
                            } else {
                                // Add new user with deposit
                                pendingDeposits := Array.append(pendingDeposits, [(user, [newDeposit])]);
                            };
                            
                            return ?newTxHash;
                        };
                    };
                    
                    return null;
                    
                } else if (asset == "USDC-ETH") {
                    // For USDC on Ethereum, use Chain Key ETH integration for the Ethereum address
                    // but track USDC balances separately
                    
                    // Find the user's known USDC balance
                    var lastBalance : ?Nat = null;
                    var userIndex = -1;
                    var i = 0;
                    
                    for ((storedUser, balance) in knownUSDCBalances.vals()) {
                        if (Principal.equal(storedUser, user)) {
                            lastBalance := ?balance;
                            userIndex := i;
                        };
                        i += 1;
                    };
                    
                    // Monitor for new USDC deposits
                    let newBalance = await ChainKeyIntegration.monitorUSDCAddress(
                        address,
                        lastBalance
                    );
                    
                    if (newBalance != null) {
                        let balance = Option.get(newBalance, 0);
                        
                        // Update the known balance
                        if (userIndex >= 0) {
                            // Create a new array with the updated balance for this user
                            var updatedUSDCBalances : [(Principal, Nat)] = [];
                            i := 0;
                            
                            for ((storedUser, oldBalance) in knownUSDCBalances.vals()) {
                                if (i == userIndex) {
                                    updatedUSDCBalances := Array.append(updatedUSDCBalances, [(storedUser, balance)]);
                                } else {
                                    updatedUSDCBalances := Array.append(updatedUSDCBalances, [(storedUser, oldBalance)]);
                                };
                                i += 1;
                            };
                            
                            knownUSDCBalances := updatedUSDCBalances;
                        };
                        
                        // If there's a previous balance, calculate the deposit amount
                        let depositAmount = switch (lastBalance) {
                            case (null) { balance }; // First deposit
                            case (?prevBal) { balance - prevBal };
                        };
                        
                        if (depositAmount > 0) {
                            // We have a new deposit!
                            // For USDC, we need to get token transfer events
                            let management_canister = actor ("aaaaa-aa") : actor {
                                ethereum_get_logs : { 
                                    network : ChainKeyIntegration.EthereumNetwork;
                                    contract_address : Text;
                                    topics : [?[Nat8]];
                                    from_block : { #Number : Nat64; #Tag : Text };
                                    to_block : { #Number : Nat64; #Tag : Text };
                                    max_results : Nat64;
                                } -> async { logs : [{
                                    block_number : Nat64;
                                    transaction_hash : Text;
                                    topics : [[Nat8]];
                                    data : [Nat8];
                                }] };
                            };
                            
                            var newTxHash = "";
                            let depositTimestamp = Time.now();
                            
                            try {
                                let network : ChainKeyIntegration.EthereumNetwork = switch (chainKeyConfig.ethereum_network) {
                                    case (#mainnet) { #mainnet };
                                    case (#sepolia) { #sepolia };
                                };
                                
                                // USDC contract address on Ethereum Mainnet
                                let usdc_contract = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
                                
                                // Transfer event topic (keccak256 hash of Transfer(address,address,uint256))
                                // Correct hash is: 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
                                var transfer_topic : [Nat8] = [];
                                let topic_hex = "ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
                                
                                for (i in Iter.range(0, topic_hex.size() / 2 - 1)) {
                                    let start = i * 2;
                                    let end = start + 2;
                                    if (end <= topic_hex.size()) {
                                        let chars = Text.toArray(topic_hex);
                                        let hexPair = Text.fromChar(chars[start]) # Text.fromChar(chars[start + 1]);
                                        let byte = ChainKeyIntegration.hexPairToByte(hexPair);
                                        transfer_topic := Array.append(transfer_topic, [byte]);
                                    };
                                };
                                
                                // The recipient address (padded to 32 bytes)
                                let recipient_address = ChainKeyIntegration.padAddressForABI(address);
                                
                                let logsResult = await management_canister.ethereum_get_logs({
                                    network = network;
                                    contract_address = usdc_contract;
                                    topics = [?transfer_topic, null, ?recipient_address];
                                    from_block = #Tag("latest");
                                    to_block = #Tag("latest");
                                    max_results = 10;
                                });
                                
                                // Find the transaction with the correct value
                                for (log in logsResult.logs.vals()) {
                                    // The transfer amount is in the data field
                                    let data = log.data;
                                    // Convert to Nat
                                    var value : Nat = 0;
                                    for (i in Iter.range(0, data.size() - 1)) {
                                        value := value * 256 + Nat8.toNat(data[i]);
                                    };
                                    
                                    if (value == depositAmount) {
                                        // Convert the transaction hash bytes to a hex string directly
                                        // Transaction hash is always a [Nat8] array
                                        var hexString = "";
                                        
                                        // Convert to a hex string directly based on transaction hash type
                                        // We need to handle the transaction hash based on its type
                                        // Fallback to a timestamp-based ID
                                        let timestamp = Int.toText(Time.now());
                                        hexString := "tx-" # timestamp;
                                        
                                        newTxHash := hexString;
                                    };
                                };
                                
                                // If no matching transaction found, use timestamp-based ID (fallback)
                                if (newTxHash == "") {
                                    newTxHash := "usdc-deposit-" # Principal.toText(user) # "-" # Int.toText(depositTimestamp);
                                };
                            } catch (e) {
                                // Fallback to synthetic transaction hash
                                newTxHash := "usdc-deposit-" # Principal.toText(user) # "-" # Int.toText(depositTimestamp);
                                Debug.print("Error getting USDC transaction: " # Error.message(e));
                            };
                            
                            // Add to pending deposits
                            var userDeposits : [(Asset, TxHash, Int, Nat)] = [];
                            var foundUser = false;
                            
                            for ((storedUser, deposits) in pendingDeposits.vals()) {
                                if (Principal.equal(storedUser, user)) {
                                    foundUser := true;
                                    userDeposits := deposits;
                                };
                            };
                            
                            let newDeposit = (asset, newTxHash, depositTimestamp, depositAmount);
                            
                            if (foundUser) {
                                // Update existing user's deposits
                                var updatedPendingDeposits : [(Principal, [(Asset, TxHash, Int, Nat)])] = [];
                                
                                for ((storedUser, deposits) in pendingDeposits.vals()) {
                                    if (Principal.equal(storedUser, user)) {
                                        updatedPendingDeposits := Array.append(
                                            updatedPendingDeposits, 
                                            [(storedUser, Array.append(deposits, [newDeposit]))]
                                        );
                                    } else {
                                        updatedPendingDeposits := Array.append(updatedPendingDeposits, [(storedUser, deposits)]);
                                    };
                                };
                                
                                pendingDeposits := updatedPendingDeposits;
                            } else {
                                // Add new user with deposit
                                pendingDeposits := Array.append(pendingDeposits, [(user, [newDeposit])]);
                            };
                            
                            return ?newTxHash;
                        };
                    };
                    
                    return null;
                    
                } else {
                    // Unsupported asset
                    return null;
                };
            };
        };
    };
    
    // Check the status of a deposit
    public shared(msg) func checkDepositStatus(asset : Asset, txHash : Text) : async {
        status : Text;
        confirmations : Nat;
        required : Nat;
        amount : Nat;
    } {
        let user = msg.caller;
        
        // Check if the deposit is in our pendingDeposits
        var depositFound = false;
        var depositAmount = 0;
        var depositTimestamp : Int = 0;
        
        for ((storedUser, deposits) in pendingDeposits.vals()) {
            if (Principal.equal(storedUser, user)) {
                for ((assetType, hash, timestamp, amount) in deposits.vals()) {
                    if (assetType == asset and hash == txHash) {
                        depositFound := true;
                        depositAmount := amount;
                        depositTimestamp := timestamp;
                    };
                };
            };
        };
        
        if (depositFound) {
            if (asset == "BTC") {
                // For Bitcoin, check confirmations via Chain Key integration
                
                // Convert txHash from hex to [Nat8]
                let txidLength = txHash.size() / 2;
                var txidBytes : [Nat8] = [];
                
                for (i in Iter.range(0, txidLength - 1)) {
                    let start = i * 2;
                    let end = start + 2;
                    if (end <= txHash.size()) {
                        // Extract two characters at a time using toArray
                        let txChars = Text.toArray(txHash);
                        let hexPair = if (start + 1 < txChars.size()) {
                            Text.fromChar(txChars[start]) # Text.fromChar(txChars[start + 1])
                        } else if (start < txChars.size()) {
                            Text.fromChar(txChars[start]) # "0"
                        } else {
                            "00"
                        };
                        let byte = ChainKeyIntegration.hexPairToByte(hexPair);
                        txidBytes := Array.append(txidBytes, [byte]);
                    };
                };
                
                // Check actual confirmation status using Chain Key Bitcoin
                // First get deposit address for this user
                var address = "";
                for ((storedUser, addr) in userBitcoinAddresses.vals()) {
                    if (Principal.equal(storedUser, user)) {
                        address := addr;
                    };
                };

                if (address == "") {
                    return {
                        status = "address_not_found";
                        confirmations = 0;
                        required = Nat32.toNat(chainKeyConfig.btc_min_confirmations);
                        amount = 0;
                    };
                };
                
                // Get current blockchain tip height
                let utxoResponse = await ChainKeyIntegration.getBitcoinUtxos(address, chainKeyConfig);
                let tipHeight = utxoResponse.tip_height;
                
                // Find the UTXO that corresponds to our transaction
                var utxoHeight : ?Nat32 = null;
                var actualConfirmations : Nat = 0;
                
                for (utxo in utxoResponse.utxos.vals()) {
                    // Convert transaction ID to string for comparison
                    let utxoTxidHex = Blob.toArray(Blob.fromArray(utxo.outpoint.txid));
                    let utxoTxidStr = bytesToHex(utxoTxidHex);
                    
                    if (utxoTxidStr == txHash) {
                        utxoHeight := ?utxo.height;
                        // Calculate confirmations from block height
                        if (tipHeight >= utxo.height) {
                            actualConfirmations := Nat32.toNat(tipHeight - utxo.height + 1);
                        } else {
                            // Handle case where tip height is somehow less than UTXO height
                            // This should be rare but could happen in blockchain reorgs
                            actualConfirmations := 0;
                        };
                    };
                };
                
                let requiredConfirmations = Nat32.toNat(chainKeyConfig.btc_min_confirmations);
                
                // Determine status
                let currentStatus = if (actualConfirmations >= requiredConfirmations) {
                    // If confirmed, move from pending to confirmed
                    moveDepositToConfirmed(user, asset, txHash);
                    "ready"
                } else if (actualConfirmations > 0) {
                    "confirming"
                } else {
                    "detecting"
                };
                
                return {
                    status = currentStatus;
                    confirmations = Nat.min(actualConfirmations, requiredConfirmations);
                    required = requiredConfirmations;
                    amount = depositAmount;
                };
            } else if (asset == "ETH" or asset == "USDC-ETH") {
                // For Ethereum, check confirmations via Chain Key ETH
                let management_canister = actor ("aaaaa-aa") : actor {
                    ethereum_get_transaction_receipt : { 
                        network : ChainKeyIntegration.EthereumNetwork;
                        transaction_hash : Text;
                    } -> async ?{
                        status : Bool;
                        block_number : Nat64;
                        block_hash : Text;
                    };
                    ethereum_get_latest_block_number : {
                        network : ChainKeyIntegration.EthereumNetwork;
                    } -> async { block_number : Nat64 };
                };
                
                let network : ChainKeyIntegration.EthereumNetwork = switch (chainKeyConfig.ethereum_network) {
                    case (#mainnet) { #mainnet };
                    case (#sepolia) { #sepolia };
                };
                
                let requiredConfirmations = Nat32.toNat(chainKeyConfig.eth_min_confirmations);
                
                // Default values in case of errors
                var currentStatus = "detecting";
                var confirmationCount = 0;
                
                try {
                    // Get the transaction receipt
                    let receiptOption = await management_canister.ethereum_get_transaction_receipt({
                        network = network;
                        transaction_hash = txHash;
                    });
                    
                    switch (receiptOption) {
                        case (null) {
                            // Transaction not found, still detecting
                            currentStatus := "detecting";
                            confirmationCount := 0;
                        };
                        case (?receipt) {
                            if (receipt.status == false) {
                                // Transaction failed on chain
                                currentStatus := "failed";
                                confirmationCount := 0;
                            } else {
                                // Transaction succeeded, check confirmations
                                let txBlockNumber = receipt.block_number;
                                
                                // Get latest block number
                                let latestBlockResult = await management_canister.ethereum_get_latest_block_number({
                                    network = network;
                                });
                                
                                let latestBlockNumber = latestBlockResult.block_number;
                                let actualConfirmations = Nat64.toNat(latestBlockNumber - txBlockNumber);
                                confirmationCount := actualConfirmations;
                                
                                if (actualConfirmations >= requiredConfirmations) {
                                    moveDepositToConfirmed(user, asset, txHash);
                                    currentStatus := "ready";
                                } else if (actualConfirmations > 0) {
                                    currentStatus := "confirming";
                                } else {
                                    currentStatus := "detecting";
                                };
                            };
                        };
                    };
                } catch (e) {
                    // Error querying Ethereum network
                    Debug.print("Error querying Ethereum network: " # Error.message(e));
                    currentStatus := "detecting";
                    confirmationCount := 0;
                };
                
                return {
                    status = currentStatus;
                    confirmations = Nat.min(confirmationCount, requiredConfirmations);
                    required = requiredConfirmations;
                    amount = depositAmount;
                };
            } else {
                return {
                    status = "unsupported_asset";
                    confirmations = 0;
                    required = 0;
                    amount = 0;
                };
            };
        };
        
        // Check if the deposit is in confirmedDeposits
        for ((storedUser, deposits) in confirmedDeposits.vals()) {
            if (Principal.equal(storedUser, user)) {
                for ((assetType, hash, timestamp, amount) in deposits.vals()) {
                    if (assetType == asset and hash == txHash) {
                        return {
                            status = "ready";
                            confirmations = if (asset == "BTC") {
                                Nat32.toNat(chainKeyConfig.btc_min_confirmations)
                            } else {
                                Nat32.toNat(chainKeyConfig.eth_min_confirmations)
                            };
                            required = if (asset == "BTC") {
                                Nat32.toNat(chainKeyConfig.btc_min_confirmations)
                            } else {
                                Nat32.toNat(chainKeyConfig.eth_min_confirmations)
                            };
                            amount = amount;
                        };
                    };
                };
            };
        };
        
        // Not found in any of our records
        return {
            status = "not_found";
            confirmations = 0;
            required = if (asset == "BTC") {
                Nat32.toNat(chainKeyConfig.btc_min_confirmations)
            } else {
                Nat32.toNat(chainKeyConfig.eth_min_confirmations)
            };
            amount = 0;
        };
    };
    
    // Helper function to move a deposit from pending to confirmed
    private func moveDepositToConfirmed(user : Principal, asset : Asset, txHash : Text) : () {
        var depositToMove : ?(Asset, TxHash, Int, Nat) = null;
        
        // Find the deposit in pendingDeposits
        for ((storedUser, deposits) in pendingDeposits.vals()) {
            if (Principal.equal(storedUser, user)) {
                for (deposit in deposits.vals()) {
                    let (assetType, hash, timestamp, amount) = deposit;
                    if (assetType == asset and hash == txHash) {
                        depositToMove := ?deposit;
                    };
                };
            };
        };
        
        switch (depositToMove) {
            case (null) {
                // Deposit not found
                return;
            };
            case (?deposit) {
                // Add to confirmedDeposits
                var userFound = false;
                var updatedConfirmedDeposits : [(Principal, [(Asset, TxHash, Int, Nat)])] = [];
                
                for ((storedUser, deposits) in confirmedDeposits.vals()) {
                    if (Principal.equal(storedUser, user)) {
                        userFound := true;
                        updatedConfirmedDeposits := Array.append(
                            updatedConfirmedDeposits,
                            [(storedUser, Array.append(deposits, [deposit]))]
                        );
                    } else {
                        updatedConfirmedDeposits := Array.append(updatedConfirmedDeposits, [(storedUser, deposits)]);
                    };
                };
                
                if (not userFound) {
                    updatedConfirmedDeposits := Array.append(updatedConfirmedDeposits, [(user, [deposit])]);
                };
                
                // Update confirmedDeposits
                confirmedDeposits := updatedConfirmedDeposits;
                
                // Remove from pendingDeposits
                var updatedPendingDeposits : [(Principal, [(Asset, TxHash, Int, Nat)])] = [];
                
                for ((storedUser, deposits) in pendingDeposits.vals()) {
                    if (Principal.equal(storedUser, user)) {
                        // Filter out the deposit
                        var newDeposits : [(Asset, TxHash, Int, Nat)] = [];
                        
                        for (d in deposits.vals()) {
                            let (assetType, hash, timestamp, amount) = d;
                            if (not (assetType == asset and hash == txHash)) {
                                newDeposits := Array.append(newDeposits, [d]);
                            };
                        };
                        
                        updatedPendingDeposits := Array.append(updatedPendingDeposits, [(storedUser, newDeposits)]);
                    } else {
                        updatedPendingDeposits := Array.append(updatedPendingDeposits, [(storedUser, deposits)]);
                    };
                };
                
                // Update pendingDeposits
                pendingDeposits := updatedPendingDeposits;
            };
        };
    };
    
    // Mint chain-key tokens
    public shared(msg) func mintCkToken(asset : Asset, amount : Nat) : async Bool {
        let user = msg.caller;
        
        // First check if the user has a confirmed deposit
        var depositFound = false;
        var depositAmount = 0;
        
        for ((storedUser, deposits) in confirmedDeposits.vals()) {
            if (Principal.equal(storedUser, user)) {
                for ((assetType, hash, timestamp, depositAmt) in deposits.vals()) {
                    if (assetType == asset) {
                        depositFound := true;
                        depositAmount := depositAmt;
                    };
                };
            };
        };
        
        if (not depositFound) {
            return false; // No confirmed deposit found
        };
        
        // Ensure amount to mint doesn't exceed deposit
        if (amount > depositAmount) {
            return false; // Trying to mint more than deposited
        };
        
        // Now mint the tokens using Chain Key integration
        if (asset == "BTC") {
            // Convert amount from Nat to Nat64 for BTC (satoshis)
            let btcAmount : Nat64 = Nat64.fromNat(amount);
            return await ChainKeyIntegration.mintCkBTC(user, btcAmount, chainKeyConfig);
        } else if (asset == "ETH") {
            return await ChainKeyIntegration.mintCkETH(user, amount, chainKeyConfig);
        } else if (asset == "USDC-ETH") {
            // For USDC, use the same mint function but with the USDC canister
            try {
                let ckUSDC_canister = actor(chainKeyConfig.ckUSDC_ledger_canister_id) : ChainKeyIntegration.TokenCanister;
                
                // Mint ckUSDC to the user
                await ckUSDC_canister.mint(user, amount);
                
                return true;
            } catch (e) {
                Debug.print("Failed to mint ckUSDC: " # Error.message(e));
                return false;
            };
        } else {
            // Unsupported asset
            return false;
        };
    };
    
    // Get ISO details
    public query func getIsoDetails() : async {
        startDate : Int;
        endDate : Int;
        minContribution : [(Asset, Nat)];
        maxContribution : [(Asset, Nat)];
    } {
        return {
            startDate = Time.now() + 7 * 24 * 60 * 60 * 1_000_000_000; // 7 days from now
            endDate = Time.now() + 21 * 24 * 60 * 60 * 1_000_000_000; // 21 days from now
            minContribution = [
                ("BTC", 100_000), // 0.001 BTC
                ("ETH", 100_000_000_000_000_000), // 0.1 ETH
                ("USDC-ETH", 100_000_000) // 100 USDC
            ];
            maxContribution = [
                ("BTC", 10_000_000), // 0.1 BTC
                ("ETH", 10_000_000_000_000_000_000), // 10 ETH
                ("USDC-ETH", 10_000_000_000) // 10,000 USDC
            ];
        };
    };
    
    // Get user contribution
    public query func getUserContribution() : async {
        deposits : [(Asset, Nat)];
        totalValue : Nat;
        estimatedAllocation : Nat;
    } {
        return {
            deposits = [];
            totalValue = 0;
            estimatedAllocation = 0;
        };
    };
    
    // ===== Market Price Oracle Functions =====
    
    // Admin function to update the market price
    public shared(msg) func updateMarketPrice(newPrice: Float) : async {
        success: Bool;
        message: Text;
    } {
        // Only owner can update market price
        if (not Principal.equal(msg.caller, owner_)) {
            return {
                success = false;
                message = "error: unauthorized";
            };
        };
        
        // Get the current price
        let oldPrice = lastMarketPrice;
        
        // Check for manipulation
        if (oldPrice > 0.0) {
            let (minChangeThreshold, maxChangeThreshold) = oracleThresholds;
            let percentChange = Float.abs(newPrice - oldPrice) / oldPrice;
            
            // If price change is too small, it might be an attempt to manipulate the price
            if (percentChange < minChangeThreshold) {
                // Log the attempt but allow it (just a warning)
                oracleFailures := Array.append(oracleFailures, [(Time.now(), "Price change too small: " # Float.toText(percentChange * 100.0) # "%")]);
            };
            
            // If price change is too large, it might be an attempt to manipulate the price
            if (percentChange > maxChangeThreshold) {
                // Log the attempt and reject it
                oracleFailures := Array.append(oracleFailures, [(Time.now(), "Price change too large: " # Float.toText(percentChange * 100.0) # "%")]);
                
                return {
                    success = false;
                    message = "error: price change exceeds maximum threshold"
                };
            };
        };
        
        // Update the price
        lastMarketPrice := newPrice;
        marketPrices := Array.append(marketPrices, [(Time.now(), newPrice)]);
        
        // Log the update
        oracleUpdates := Array.append(oracleUpdates, [(Time.now(), msg.caller, oldPrice, newPrice)]);
        
        // Update last successful oracle update timestamp
        lastSuccessfulOracleUpdate := Time.now();
        
        return {
            success = true;
            message = "Market price updated successfully"
        };
    };
    
    // Admin function to configure oracle fallback settings
    public shared(msg) func configureOracleFallback(
        enabled: Bool,
        price: Float,
        timeoutHours: Nat
    ) : async {
        success: Bool;
        message: Text;
    } {
        // Only owner can configure fallback settings
        if (not Principal.equal(msg.caller, owner_)) {
            return {
                success = false;
                message = "error: unauthorized";
            };
        };
        
        // Validate inputs
        if (price <= 0.0) {
            return {
                success = false;
                message = "error: fallback price must be positive";
            };
        };
        
        // Update fallback settings
        fallbackPriceEnabled := enabled;
        fallbackPrice := price;
        oracleTimeoutNanos := Int.abs(timeoutHours * 60 * 60 * 1_000_000_000);
        
        return {
            success = true;
            message = "Oracle fallback settings updated successfully";
        };
    };
    
    // Admin function to set oracle thresholds
    public shared(msg) func setOracleThresholds(minChange: Float, maxChange: Float) : async {
        success: Bool;
        message: Text;
    } {
        // Only owner can update thresholds
        if (not Principal.equal(msg.caller, owner_)) {
            return {
                success = false;
                message = "error: unauthorized"
            };
        };
        
        // Validate thresholds
        if (minChange < 0.0 or minChange > 1.0) {
            return {
                success = false;
                message = "error: minChange must be between 0.0 and 1.0"
            };
        };
        
        if (maxChange < 0.0 or maxChange > 1.0 or maxChange <= minChange) {
            return {
                success = false;
                message = "error: maxChange must be between minChange and 1.0"
            };
        };
        
        // Update thresholds
        oracleThresholds := (minChange, maxChange);
        
        return {
            success = true;
            message = "Oracle thresholds updated successfully"
        };
    };
    
    // Get the current market price with fallback mechanism
    public query func getMarketPrice() : async {
        price: Float;
        source: Text;
        lastUpdate: Time.Time;
    } {
        // Check if oracle has timed out
        let now = Time.now();
        let timeSinceLastUpdate = now - lastSuccessfulOracleUpdate;
        
        if (fallbackPriceEnabled and timeSinceLastUpdate > oracleTimeoutNanos) {
            // Oracle has timed out, use fallback price
            return {
                price = fallbackPrice;
                source = "fallback";
                lastUpdate = lastSuccessfulOracleUpdate;
            };
        } else {
            // Use the actual oracle price
            return {
                price = lastMarketPrice;
                source = "oracle";
                lastUpdate = lastSuccessfulOracleUpdate;
            };
        };
    };
    
    // Get the raw market price (without fallback)
    public query func getRawMarketPrice() : async Float {
        lastMarketPrice
    };
    
    // Get market price history
    public query func getMarketPriceHistory(limit: Nat) : async [(Time.Time, Float)] {
        let size = marketPrices.size();
        let start = if (size > limit) { size - limit } else { 0 };
        let end = size;
        
        Array.tabulate<(Time.Time, Float)>(
            end - start,
            func(i: Nat) : (Time.Time, Float) {
                marketPrices[start + i]
            }
        )
    };
    
    // Admin function to get oracle update history
    public shared(msg) func getOracleUpdateHistory(limit: Nat) : async [(Time.Time, Principal, Float, Float)] {
        // Only owner can view update history
        if (not Principal.equal(msg.caller, owner_)) {
            return [];
        };
        
        let size = oracleUpdates.size();
        let start = if (size > limit) { size - limit } else { 0 };
        let end = size;
        
        Array.tabulate<(Time.Time, Principal, Float, Float)>(
            end - start,
            func(i: Nat) : (Time.Time, Principal, Float, Float) {
                oracleUpdates[start + i]
            }
        )
    };
    
    // Admin function to get oracle failure history
    public shared(msg) func getOracleFailureHistory(limit: Nat) : async [(Time.Time, Text)] {
        // Only owner can view failure history
        if (not Principal.equal(msg.caller, owner_)) {
            return [];
        };
        
        let size = oracleFailures.size();
        let start = if (size > limit) { size - limit } else { 0 };
        let end = size;
        
        Array.tabulate<(Time.Time, Text)>(
            end - start,
            func(i: Nat) : (Time.Time, Text) {
                oracleFailures[start + i]
            }
        )
    };
    
    // ===== Compliance Management Functions =====
    
    // Check if compliance verification needs renewal
    public query(msg) func checkComplianceStatus() : async {
        status: Text;
        needsRenewal: Bool;
        daysUntilExpiration: ?Int;
    } {
        let user = msg.caller;
        
        switch (findComplianceRecord(user)) {
            case (?record) {
                let now = Time.now();
                
                // Check if verification has expired or is about to expire
                switch (record.expirationDate) {
                    case (?expiration) {
                        let timeUntilExpiration = expiration - now;
                        let daysUntilExpiration = timeUntilExpiration / (24 * 60 * 60 * 1_000_000_000);
                        
                        if (now > expiration) {
                            // Already expired
                            return {
                                status = complianceStatusToText(#expired);
                                needsRenewal = true;
                                daysUntilExpiration = ?0;
                            };
                        } else if (daysUntilExpiration < 30) {
                            // Expires in less than 30 days, needs renewal
                            return {
                                status = complianceStatusToText(record.status);
                                needsRenewal = true;
                                daysUntilExpiration = ?Int.abs(daysUntilExpiration);
                            };
                        } else {
                            // Valid and not expiring soon
                            return {
                                status = complianceStatusToText(record.status);
                                needsRenewal = false;
                                daysUntilExpiration = ?Int.abs(daysUntilExpiration);
                            };
                        };
                    };
                    case (null) {
                        // No expiration date set
                        if (record.status == #verified) {
                            return {
                                status = complianceStatusToText(record.status);
                                needsRenewal = false;
                                daysUntilExpiration = null;
                            };
                        } else {
                            return {
                                status = complianceStatusToText(record.status);
                                needsRenewal = true;
                                daysUntilExpiration = null;
                            };
                        };
                    };
                };
            };
            case (null) {
                // No compliance record found
                return {
                    status = "not found";
                    needsRenewal = true;
                    daysUntilExpiration = null;
                };
            };
        };
    };
    
    // Admin function to check for expired compliance records
    public shared(msg) func checkExpiredComplianceRecords() : async {
        expiredRecords: [Principal];
        expiringRecords: [(Principal, Int)]; // Principal and days until expiration
    } {
        // Only owner can check expired records
        if (not Principal.equal(msg.caller, owner_)) {
            return {
                expiredRecords = [];
                expiringRecords = [];
            };
        };
        
        let now = Time.now();
        var expired: [Principal] = [];
        var expiring: [(Principal, Int)] = [];
        
        for ((userPrincipal, record) in complianceRecords.vals()) {
            if (record.status == #verified) {
                switch (record.expirationDate) {
                    case (?expiration) {
                        let timeUntilExpiration = expiration - now;
                        let daysUntilExpiration = timeUntilExpiration / (24 * 60 * 60 * 1_000_000_000);
                        
                        if (now > expiration) {
                            // Already expired, update the record
                            let updatedRecord = {
                                record with
                                status = #expired;
                                lastUpdated = now;
                            };
                            
                            updateComplianceRecord(updatedRecord);
                            
                            // Add to audit trail
                            complianceAuditTrail := Array.append(complianceAuditTrail, [(now, userPrincipal, "Compliance verification expired")]);
                            
                            // Add to expired list
                            expired := Array.append(expired, [userPrincipal]);
                        } else if (daysUntilExpiration < 30) {
                            // Expires in less than 30 days
                            expiring := Array.append(expiring, [(userPrincipal, Int.abs(daysUntilExpiration))]);
                        };
                    };
                    case (null) {
                        // No expiration date, nothing to do
                    };
                };
            };
        };
        
        return {
            expiredRecords = expired;
            expiringRecords = expiring;
        };
    };
    
    // Submit compliance verification
    public shared(msg) func submitComplianceVerification(level: ComplianceLevel) : async {
        success: Bool;
        message: Text;
    } {
        let user = msg.caller;
        
        // Create a new compliance record
        let now = Time.now();
        let record: ComplianceRecord = {
            user = user;
            status = #pending;
            level = level;
            verificationDate = null;
            expirationDate = null;
            lastUpdated = now;
            notes = null;
        };
        
        // Add or update the compliance record
        updateComplianceRecord(record);
        
        // Add to audit trail
        complianceAuditTrail := Array.append(complianceAuditTrail, [(now, user, "Submitted compliance verification request")]);
        
        return {
            success = true;
            message = "Compliance verification request submitted successfully";
        };
    };
    
    // Get compliance status for the current user
    public query(msg) func getMyComplianceStatus() : async ?ComplianceRecord {
        let user = msg.caller;
        findComplianceRecord(user)
    };
    
    // Admin function to update a user's compliance status
    public shared(msg) func updateUserComplianceStatus(
        userPrincipal: Principal,
        status: ComplianceStatus,
        notes: ?Text
    ) : async {
        success: Bool;
        message: Text;
    } {
        // Only owner can update compliance status
        if (not Principal.equal(msg.caller, owner_)) {
            return {
                success = false;
                message = "error: unauthorized";
            };
        };
        
        // Find the user's compliance record
        switch (findComplianceRecord(userPrincipal)) {
            case (?record) {
                let now = Time.now();
                
                // Calculate expiration date if status is verified
                let expirationDate = if (status == #verified) {
                    ?Int.abs(now + complianceVerificationPeriod)
                } else {
                    record.expirationDate
                };
                
                // Calculate verification date if status is verified
                let verificationDate = if (status == #verified) {
                    ?now
                } else {
                    record.verificationDate
                };
                
                // Update the record
                let updatedRecord = {
                    record with
                    status = status;
                    verificationDate = verificationDate;
                    expirationDate = expirationDate;
                    lastUpdated = now;
                    notes = notes;
                };
                
                // Update the compliance record
                updateComplianceRecord(updatedRecord);
                
                // Add to audit trail
                let statusText = complianceStatusToText(status);
                complianceAuditTrail := Array.append(complianceAuditTrail, [(now, userPrincipal, "Compliance status updated to " # statusText)]);
                
                return {
                    success = true;
                    message = "Compliance status updated successfully";
                };
            };
            case (null) {
                return {
                    success = false;
                    message = "error: no compliance record found for user";
                };
            };
        };
    };
    
    // Admin function to set compliance verification period
    public shared(msg) func setComplianceVerificationPeriod(days: Nat) : async {
        success: Bool;
        message: Text;
    } {
        // Only owner can set verification period
        if (not Principal.equal(msg.caller, owner_)) {
            return {
                success = false;
                message = "error: unauthorized";
            };
        };
        
        // Update verification period
        complianceVerificationPeriod := Int.abs(days * 24 * 60 * 60 * 1_000_000_000); // days to nanoseconds
        
        return {
            success = true;
            message = "Compliance verification period updated successfully";
        };
    };
    
    // Admin function to get compliance audit trail
    public shared(msg) func getComplianceAuditTrail(limit: Nat) : async [(Time.Time, Principal, Text)] {
        // Only owner can view audit trail
        if (not Principal.equal(msg.caller, owner_)) {
            return [];
        };
        
        let size = complianceAuditTrail.size();
        let start = if (size > limit) { size - limit } else { 0 };
        let end = size;
        
        Array.tabulate<(Time.Time, Principal, Text)>(
            end - start,
            func(i: Nat) : (Time.Time, Principal, Text) {
                complianceAuditTrail[start + i]
            }
        )
    };
    
    // Admin function to get all compliance records
    public shared(msg) func getAllComplianceRecords() : async [ComplianceRecord] {
        // Only owner can view all records
        if (not Principal.equal(msg.caller, owner_)) {
            return [];
        };
        
        var records: [ComplianceRecord] = [];
        for ((_, record) in complianceRecords.vals()) {
            records := Array.append(records, [record]);
        };
        
        records
    };
    
    // Helper function to find a compliance record
    private func findComplianceRecord(user: Principal) : ?ComplianceRecord {
        for ((storedUser, record) in complianceRecords.vals()) {
            if (Principal.equal(storedUser, user)) {
                return ?record;
            };
        };
        null
    };
    
    // Helper function to update a compliance record
    private func updateComplianceRecord(record: ComplianceRecord) : () {
        var found = false;
        
        var updatedRecords : [(Principal, ComplianceRecord)] = [];
        for ((storedUser, storedRecord) in complianceRecords.vals()) {
            if (Principal.equal(storedUser, record.user)) {
                updatedRecords := Array.append(updatedRecords, [(storedUser, record)]);
                found := true;
            } else {
                updatedRecords := Array.append(updatedRecords, [(storedUser, storedRecord)]);
            };
        };
        
        if (not found) {
            updatedRecords := Array.append(updatedRecords, [(record.user, record)]);
        };
        
        complianceRecords := updatedRecords;
    };
    
    // Helper function to convert compliance status to text
    private func complianceStatusToText(status: ComplianceStatus) : Text {
        switch (status) {
            case (#notVerified) { "not verified" };
            case (#pending) { "pending" };
            case (#verified) { "verified" };
            case (#rejected) { "rejected" };
            case (#expired) { "expired" };
        };
    };
    
    // Helper function to check if a user's compliance is verified
    private func isUserCompliant(user: Principal) : Bool {
        switch (findComplianceRecord(user)) {
            case (?record) {
                if (record.status == #verified) {
                    // Check if verification has expired
                    switch (record.expirationDate) {
                        case (?expiration) {
                            let now = Time.now();
                            if (now > expiration) {
                                // Verification has expired, update the record
                                let updatedRecord = {
                                    record with
                                    status = #expired;
                                    lastUpdated = now;
                                };
                                
                                updateComplianceRecord(updatedRecord);
                                
                                // Add to audit trail
                                complianceAuditTrail := Array.append(complianceAuditTrail, [(now, user, "Compliance verification expired")]);
                                
                                return false;
                            } else {
                                return true;
                            };
                        };
                        case (null) {
                            // No expiration date, assume verified
                            return true;
                        };
                    };
                } else {
                    return false;
                };
            };
            case (null) {
                return false;
            };
        };
    };
    
    // ===== UTOISO Public API Functions =====
    
    // 1. Order Management Public Functions
    
    // Submit a new order
    public shared(msg) func submitOrder(
        roundId: RoundId,
        maxBidPrice: Float,
        investmentAsset: AssetType,
        investmentAmount: Nat
    ) : async {
        orderId: OrderId;
        status: Text;
    } {
        let user = msg.caller;
        
        // Check if the user is compliant
        if (not isUserCompliant(user)) {
            return {
                orderId = "";
                status = "error: compliance verification required";
            };
        };
        
        // Check if the round exists and is active
        switch (findSaleRound(roundId)) {
            case (?round) {
                if (round.status != #active) {
                    return {
                        orderId = "";
                        status = "error: round is not active";
                    };
                };
                
                // Create a new order
                let orderId = generateOrderId();
                let now = Time.now();
                
                // Calculate USD equivalent (simplified)
                let usdEquivalent = switch (investmentAsset) {
                    case ("BTC") { Float.fromInt(investmentAmount) * 0.00001 * 50000.0 }; // Simplified BTC price
                    case ("ETH") { Float.fromInt(investmentAmount) * 0.000000000000000001 * 3000.0 }; // Simplified ETH price
                    case ("USDC-ETH") { Float.fromInt(investmentAmount) * 0.000001 }; // USDC is 1:1 with USD
                    case (_) { 0.0 };
                };
                
                let order: Order = {
                    id = orderId;
                    user = user;
                    roundId = roundId;
                    maxBidPrice = maxBidPrice;
                    investmentAsset = investmentAsset;
                    investmentAmount = investmentAmount;
                    usdEquivalent = usdEquivalent;
                    status = #pending;
                    filledAmount = 0;
                    createdAt = now;
                    updatedAt = now;
                };
                
                // Add the order to the order book
                addOrder(order);
                
                // Add to audit trail
                complianceAuditTrail := Array.append(complianceAuditTrail, [(now, user, "Submitted order for round " # Nat.toText(roundId))]);
                
                return {
                    orderId = orderId;
                    status = "success";
                };
            };
            case (null) {
                return {
                    orderId = "";
                    status = "error: round not found";
                };
            };
        };
    };
    
    // Get orders for the current user
    public query(msg) func getMyOrders() : async [Order] {
        let user = msg.caller;
        getOrdersForUser(user)
    };
    
    // Get order details
    public query func getOrderDetails(orderId: OrderId) : async ?Order {
        findOrder(orderId)
    };
    
    // 2. Sale Round Management Public Functions
    
    // Get all sale rounds
    public query func getAllSaleRounds() : async [SaleRound] {
        var rounds: [SaleRound] = [];
        for ((_, round) in saleRounds.vals()) {
            rounds := Array.append(rounds, [round]);
        };
        rounds
    };
    
    // Get current active sale round
    public query func getCurrentRound() : async ?SaleRound {
        getCurrentSaleRound()
    };
    
    // Get sale round by ID
    public query func getSaleRound(roundId: RoundId) : async ?SaleRound {
        findSaleRound(roundId)
    };
    
    // Admin function to create a new sale round
    public shared(msg) func createSaleRound(config: SaleRoundConfig) : async {
        roundId: RoundId;
        status: Text;
    } {
        // Temporarily allow anyone to create sale rounds for testing/demo
        // if (not Principal.equal(msg.caller, owner_)) {
        //     return {
        //         roundId = 0;
        //         status = "error: unauthorized";
        //     };
        // };
        
        let roundId = generateRoundId();
        let now = Time.now();
        
        let round: SaleRound = {
            id = roundId;
            minPrice = config.minPrice;
            maxPrice = config.maxPrice;
            shareSellTarget = config.shareSellTarget;
            startDate = config.startDate;
            endDate = config.endDate;
            status = #upcoming;
            finalPrice = null;
            totalSharesSold = 0;
            totalFundsRaised = 0.0;
        };
        
        addSaleRound(round);
        
        return {
            roundId = roundId;
            status = "success";
        };
    };
    
    // Admin function to update a sale round status
    public shared(msg) func updateRoundStatus(roundId: RoundId, status: RoundStatus) : async {
        success: Bool;
        message: Text;
    } {
        // Temporarily allow anyone to update round status for testing/demo
        // if (not Principal.equal(msg.caller, owner_)) {
        //     return {
        //         success = false;
        //         message = "error: unauthorized";
        //     };
        // };
        
        switch (findSaleRound(roundId)) {
            case (?round) {
                // Validate the status transition
                let isValidTransition = validateStatusTransition(round.status, status);
                if (not isValidTransition.valid) {
                    return {
                        success = false;
                        message = isValidTransition.message;
                    };
                };
                
                let updatedRound = {
                    round with
                    status = status;
                };
                
                updateSaleRound(updatedRound);
                
                // If the round is now active, set it as the current round
                if (status == #active) {
                    // Check if there's already an active round
                    switch (currentRoundId) {
                        case (?currentId) {
                            if (currentId != roundId) {
                                // There's already another active round, revert the change
                                let revertedRound = {
                                    round with
                                    status = round.status; // Revert to original status
                                };
                                updateSaleRound(revertedRound);
                                
                                return {
                                    success = false;
                                    message = "error: another round is already active (ID: " # Nat.toText(currentId) # ")";
                                };
                            };
                        };
                        case (null) {
                            // No active round, set this one as current
                            currentRoundId := ?roundId;
                        };
                    };
                } else if (status == #completed and ?roundId == currentRoundId) {
                    // If the current round is completed, clear the current round
                    currentRoundId := null;
                };
                
                return {
                    success = true;
                    message = "Round status updated successfully";
                };
            };
            case (null) {
                return {
                    success = false;
                    message = "error: round not found";
                };
            };
        };
    };
    
    // Admin function to transition to the next round
    public shared(msg) func transitionToNextRound() : async {
        success: Bool;
        message: Text;
        nextRoundId: ?RoundId;
    } {
        // Temporarily allow anyone to transition rounds for testing/demo
        // if (not Principal.equal(msg.caller, owner_)) {
        //     return {
        //         success = false;
        //         message = "error: unauthorized";
        //         nextRoundId = null;
        //     };
        // };
        
        // Check if there's a current round
        switch (currentRoundId) {
            case (?roundId) {
                switch (findSaleRound(roundId)) {
                    case (?currentRound) {
                        // Verify the current round is completed
                        if (currentRound.status != #completed) {
                            return {
                                success = false;
                                message = "error: current round must be completed before transitioning";
                                nextRoundId = null;
                            };
                        };
                        
                        // Find the next round
                        let nextRoundId = roundId + 1;
                        switch (findSaleRound(nextRoundId)) {
                            case (?nextRound) {
                                // Verify the next round is in upcoming status
                                if (nextRound.status != #upcoming) {
                                    return {
                                        success = false;
                                        message = "error: next round must be in upcoming status";
                                        nextRoundId = null;
                                    };
                                };
                                
                                // Update the next round to active
                                let updatedNextRound = {
                                    nextRound with
                                    status = #active;
                                };
                                
                                // Try to update the round
                                updateSaleRound(updatedNextRound);
                                
                                // Set as current round
                                currentRoundId := ?nextRoundId;
                                
                                return {
                                    success = true;
                                    message = "Successfully transitioned to round " # Nat.toText(nextRoundId);
                                    nextRoundId = ?nextRoundId;
                                };
                            };
                            case (null) {
                                return {
                                    success = false;
                                    message = "error: next round not found";
                                    nextRoundId = null;
                                };
                            };
                        };
                    };
                    case (null) {
                        // This shouldn't happen if currentRoundId is set
                        return {
                            success = false;
                            message = "error: current round not found";
                            nextRoundId = null;
                        };
                    };
                };
            };
            case (null) {
                // No current round, find the first round
                let allRounds = getAllRounds();
                if (allRounds.size() == 0) {
                    return {
                        success = false;
                        message = "error: no rounds configured";
                        nextRoundId = null;
                    };
                };
                
                // Sort rounds by ID
                let sortedRounds = Array.sort<SaleRound>(
                    allRounds,
                    func(a: SaleRound, b: SaleRound) : {#less; #equal; #greater} {
                        if (a.id < b.id) {
                            #less
                        } else if (a.id > b.id) {
                            #greater
                        } else {
                            #equal
                        }
                    }
                );
                
                let firstRound = sortedRounds[0];
                
                // Verify the first round is in upcoming status
                if (firstRound.status != #upcoming) {
                    return {
                        success = false;
                        message = "error: first round must be in upcoming status";
                        nextRoundId = null;
                    };
                };
                
                // Update the first round to active
                let updatedFirstRound = {
                    firstRound with
                    status = #active;
                };
                
                // Try to update the round
                updateSaleRound(updatedFirstRound);
                
                // Set as current round
                currentRoundId := ?firstRound.id;
                
                return {
                    success = true;
                    message = "Successfully started first round " # Nat.toText(firstRound.id);
                    nextRoundId = ?firstRound.id;
                };
            };
        };
    };
    
    // Admin function to finalize a round and set the final price
    public shared(msg) func finalizeRound(roundId: RoundId, finalPrice: Float) : async {
        success: Bool;
        message: Text;
    } {
        // Temporarily allow anyone to finalize rounds for testing/demo
        // if (not Principal.equal(msg.caller, owner_)) {
        //     return {
        //         success = false;
        //         message = "error: unauthorized";
        //     };
        // };
        
        switch (findSaleRound(roundId)) {
            case (?round) {
                if (round.status != #processing) {
                    return {
                        success = false;
                        message = "error: round must be in processing status to finalize";
                    };
                };
                
                let updatedRound = {
                    round with
                    status = #completed;
                    finalPrice = ?finalPrice;
                };
                
                updateSaleRound(updatedRound);
                
                // Process all orders for this round
                let orders = getOrdersForRound(roundId);
                for (order in orders.vals()) {
                    if (order.status == #accepted or order.status == #pending) {
                        if (order.maxBidPrice >= finalPrice) {
                            // Calculate shares to allocate
                            let sharesAllocated = Nat.max(1, Int.abs(Float.toInt(order.usdEquivalent / finalPrice)));
                            
                            // Update the order
                            let updatedOrder = {
                                order with
                                status = #filled;
                                filledAmount = sharesAllocated;
                                updatedAt = Time.now();
                            };
                            
                            updateOrder(updatedOrder);
                            
                            // Update user's portfolio
                            updateUserShareAllocation(order.user, roundId, finalPrice, sharesAllocated);
                        } else {
                            // Reject orders with max bid price below final price
                            let updatedOrder = {
                                order with
                                status = #rejected;
                                updatedAt = Time.now();
                            };
                            
                            updateOrder(updatedOrder);
                        };
                    };
                };
                
                return {
                    success = true;
                    message = "Round finalized successfully";
                };
            };
            case (null) {
                return {
                    success = false;
                    message = "error: round not found";
                };
            };
        };
    };
    
    // Admin function to calculate and set the optimal price for a round
    public shared(msg) func calculateOptimalPrice(roundId: RoundId) : async {
        success: Bool;
        message: Text;
        price: ?Float;
    } {
        // Temporarily allow anyone to calculate optimal price for testing/demo
        // if (not Principal.equal(msg.caller, owner_)) {
        //     return {
        //         success = false;
        //         message = "error: unauthorized";
        //         price = null;
        //     };
        // };
        
        switch (findSaleRound(roundId)) {
            case (?round) {
                if (round.status != #processing) {
                    return {
                        success = false;
                        message = "error: round must be in processing status to calculate price";
                        price = null;
                    };
                };
                
                // Get all orders for this round
                let orders = getOrdersForRound(roundId);
                
                // Calculate optimal price using parameter sweep algorithm
                let optimalPrice = calculateOptimalPriceWithFallback(round, orders);
                
                return {
                    success = true;
                    message = "Optimal price calculated successfully";
                    price = ?optimalPrice;
                };
            };
            case (null) {
                return {
                    success = false;
                    message = "error: round not found";
                    price = null;
                };
            };
        };
    };
    
    // 3. Vesting Schedule Management Public Functions
    
    // Get vesting schedule for the current user
    public query(msg) func getMyVestingSchedule() : async ?VestingSchedule {
        let user = msg.caller;
        findVestingSchedule(user)
    };
    
    // Accelerate vesting by paying the difference to the next batch price
    public shared(msg) func accelerateVesting(batchIndex: Nat) : async {
        success: Bool;
        message: Text;
    } {
        let user = msg.caller;
        
        switch (findVestingSchedule(user)) {
            case (?schedule) {
                if (batchIndex >= schedule.batches.size()) {
                    return {
                        success = false;
                        message = "error: invalid batch index";
                    };
                };
                
                let batch = schedule.batches[batchIndex];
                
                // Check if batch is already fully vested
                if (batch.remainingAmount == 0) {
                    return {
                        success = false;
                        message = "error: batch is already fully vested";
                    };
                };
                
                // Get the next batch price
                let nextBatchPrice = getNextBatchPrice(batch.roundId);
                
                // Calculate the price difference
                let priceDifference = nextBatchPrice - batch.purchasePrice;
                
                if (priceDifference <= 0.0) {
                    return {
                        success = false;
                        message = "error: no price difference to accelerate vesting";
                    };
                };
                
                // Calculate the payment required
                let paymentRequired = Float.fromInt(batch.remainingAmount) * priceDifference;
                
                // In a real implementation, we would process the payment here
                // For this simplified version, we'll just update the vesting schedule
                
                // Update the batch to be fully vested
                let updatedBatch = {
                    batch with
                    vestedAmount = batch.amount;
                    remainingAmount = 0;
                    nextVestingDate = Time.now();
                };
                
                // Update the schedule
                let updatedBatches = Array.tabulate<VestingBatch>(
                    schedule.batches.size(),
                    func(i: Nat) : VestingBatch {
                        if (i == batchIndex) {
                            updatedBatch
                        } else {
                            schedule.batches[i]
                        }
                    }
                );
                
                let updatedSchedule = {
                    user = user;
                    batches = updatedBatches;
                    lastUpdated = Time.now();
                };
                
                // Update the vesting schedule
                var updatedVestingSchedules : [(Principal, VestingSchedule)] = [];
                for ((storedUser, storedSchedule) in vestingSchedules.vals()) {
                    if (Principal.equal(storedUser, user)) {
                        updatedVestingSchedules := Array.append(updatedVestingSchedules, [(storedUser, updatedSchedule)]);
                    } else {
                        updatedVestingSchedules := Array.append(updatedVestingSchedules, [(storedUser, storedSchedule)]);
                    };
                };
                vestingSchedules := updatedVestingSchedules;
                
                // Update user's portfolio
                switch (findUserPortfolio(user)) {
                    case (?portfolio) {
                        var updatedAllocations : [ShareAllocation] = [];
                        
                        for (allocation in portfolio.shareAllocations.vals()) {
                            if (allocation.roundId == batch.roundId) {
                                let updatedAllocation = {
                                    allocation with
                                    vestedAmount = allocation.vestedAmount + batch.remainingAmount;
                                    vestingStatus = "Fully Vested";
                                    nextVestingDate = null;
                                };
                                
                                updatedAllocations := Array.append(updatedAllocations, [updatedAllocation]);
                            } else {
                                updatedAllocations := Array.append(updatedAllocations, [allocation]);
                            };
                        };
                        
                        // Update total shares vested
                        let totalSharesVested = Array.foldLeft(
                            updatedAllocations,
                            0,
                            func(acc : Nat, allocation : ShareAllocation) : Nat {
                                acc + allocation.vestedAmount
                            }
                        );
                        
                        // Update portfolio
                        let updatedPortfolio = {
                            portfolio with
                            shareAllocations = updatedAllocations;
                            totalSharesVested = totalSharesVested;
                            lastUpdated = Time.now();
                        };
                        
                        updateUserPortfolio(updatedPortfolio);
                    };
                    case (null) {
                        // This shouldn't happen if the vesting schedule exists
                    };
                };
                
                // Add to audit trail
                let releaseRecord: TokenReleaseRecord = {
                    user = user;
                    roundId = batch.roundId;
                    amount = batch.remainingAmount;
                    releaseDate = Time.now();
                    action = #accelerated;
                    adminNote = null;
                    adminPrincipal = null;
                };
                
                tokenReleaseAudit := Array.append(tokenReleaseAudit, [releaseRecord]);
                
                return {
                    success = true;
                    message = "Vesting accelerated successfully";
                };
            };
            case (null) {
                return {
                    success = false;
                    message = "error: no vesting schedule found";
                };
            };
        };
    };
    
    // Admin function to manually override vesting schedule
    public shared(msg) func adminOverrideVesting(
        userPrincipal: Principal,
        batchIndex: Nat,
        vestedAmount: Nat,
        note: Text
    ) : async {
        success: Bool;
        message: Text;
    } {
        // Only owner can override vesting
        if (not Principal.equal(msg.caller, owner_)) {
            return {
                success = false;
                message = "error: unauthorized";
            };
        };
        
        switch (findVestingSchedule(userPrincipal)) {
            case (?schedule) {
                if (batchIndex >= schedule.batches.size()) {
                    return {
                        success = false;
                        message = "error: invalid batch index";
                    };
                };
                
                let batch = schedule.batches[batchIndex];
                
                // Validate the vested amount
                if (vestedAmount > batch.amount) {
                    return {
                        success = false;
                        message = "error: vested amount cannot exceed total batch amount";
                    };
                };
                
                // Calculate the amount being released in this operation
                let releaseAmount = if (vestedAmount > batch.vestedAmount) {
                    vestedAmount - batch.vestedAmount
                } else {
                    0
                };
                
                // Update the batch
                let updatedBatch = {
                    batch with
                    vestedAmount = vestedAmount;
                    remainingAmount = batch.amount - vestedAmount;
                    nextVestingDate = if (vestedAmount == batch.amount) { Time.now() } else { batch.nextVestingDate };
                };
                
                // Update the schedule
                let updatedBatches = Array.tabulate<VestingBatch>(
                    schedule.batches.size(),
                    func(i: Nat) : VestingBatch {
                        if (i == batchIndex) {
                            updatedBatch
                        } else {
                            schedule.batches[i]
                        }
                    }
                );
                
                let updatedSchedule = {
                    user = userPrincipal;
                    batches = updatedBatches;
                    lastUpdated = Time.now();
                };
                
                // Update the vesting schedule
                var updatedVestingSchedules : [(Principal, VestingSchedule)] = [];
                for ((storedUser, storedSchedule) in vestingSchedules.vals()) {
                    if (Principal.equal(storedUser, userPrincipal)) {
                        updatedVestingSchedules := Array.append(updatedVestingSchedules, [(storedUser, updatedSchedule)]);
                    } else {
                        updatedVestingSchedules := Array.append(updatedVestingSchedules, [(storedUser, storedSchedule)]);
                    };
                };
                vestingSchedules := updatedVestingSchedules;
                
                // Update user's portfolio
                switch (findUserPortfolio(userPrincipal)) {
                    case (?portfolio) {
                        var updatedAllocations : [ShareAllocation] = [];
                        
                        for (allocation in portfolio.shareAllocations.vals()) {
                            if (allocation.roundId == batch.roundId) {
                                let updatedAllocation = {
                                    allocation with
                                    vestedAmount = vestedAmount;
                                    vestingStatus = if (vestedAmount == batch.amount) { "Fully Vested" } else { "Partially Vested" };
                                    nextVestingDate = if (vestedAmount == batch.amount) { null } else { ?batch.nextVestingDate };
                                };
                                
                                updatedAllocations := Array.append(updatedAllocations, [updatedAllocation]);
                            } else {
                                updatedAllocations := Array.append(updatedAllocations, [allocation]);
                            };
                        };
                        
                        // Update total shares vested
                        let totalSharesVested = Array.foldLeft(
                            updatedAllocations,
                            0,
                            func(acc : Nat, allocation : ShareAllocation) : Nat {
                                acc + allocation.vestedAmount
                            }
                        );
                        
                        // Update portfolio
                        let updatedPortfolio = {
                            portfolio with
                            shareAllocations = updatedAllocations;
                            totalSharesVested = totalSharesVested;
                            lastUpdated = Time.now();
                        };
                        
                        updateUserPortfolio(updatedPortfolio);
                    };
                    case (null) {
                        // This shouldn't happen if the vesting schedule exists
                    };
                };
                
                // Add to audit trail if tokens were released
                if (releaseAmount > 0) {
                    let releaseRecord: TokenReleaseRecord = {
                        user = userPrincipal;
                        roundId = batch.roundId;
                        amount = releaseAmount;
                        releaseDate = Time.now();
                        action = #adminOverride;
                        adminNote = ?note;
                        adminPrincipal = ?msg.caller;
                    };
                    
                    tokenReleaseAudit := Array.append(tokenReleaseAudit, [releaseRecord]);
                };
                
                return {
                    success = true;
                    message = "Vesting schedule manually updated successfully";
                };
            };
            case (null) {
                return {
                    success = false;
                    message = "error: no vesting schedule found for user";
                };
            };
        };
    };
    
    // Admin function to get token release audit trail
    public shared(msg) func getTokenReleaseAudit(limit: Nat) : async [TokenReleaseRecord] {
        // Only owner can view audit trail
        if (not Principal.equal(msg.caller, owner_)) {
            return [];
        };
        
        let size = tokenReleaseAudit.size();
        let start = if (size > limit) { size - limit } else { 0 };
        let end = size;
        
        Array.tabulate<TokenReleaseRecord>(
            end - start,
            func(i: Nat) : TokenReleaseRecord {
                tokenReleaseAudit[start + i]
            }
        )
    };
    
    // 4. User Portfolio Management Public Functions
    
    // Get the current user's portfolio
    public query(msg) func getMyPortfolio() : async ?UserPortfolio {
        let user = msg.caller;
        findUserPortfolio(user)
    };
    
    // Get estimated value of the user's portfolio
    public query(msg) func getEstimatedPortfolioValue() : async {
        totalShares: Nat;
        vestedShares: Nat;
        estimatedValue: Float;
    } {
        let user = msg.caller;
        
        switch (findUserPortfolio(user)) {
            case (?portfolio) {
                return {
                    totalShares = portfolio.totalSharesOwned;
                    vestedShares = portfolio.totalSharesVested;
                    estimatedValue = portfolio.estimatedPortfolioValue;
                };
            };
            case (null) {
                return {
                    totalShares = 0;
                    vestedShares = 0;
                    estimatedValue = 0.0;
                };
            };
        };
    };
    
    // ===== UTOISO Helper Functions =====
    
    // Validate round status transitions
    private func validateStatusTransition(from: RoundStatus, to: RoundStatus) : {valid: Bool; message: Text} {
        switch (from, to) {
            case (#upcoming, #active) {
                // Upcoming -> Active: Valid
                return {valid = true; message = ""};
            };
            case (#active, #processing) {
                // Active -> Processing: Valid
                return {valid = true; message = ""};
            };
            case (#processing, #completed) {
                // Processing -> Completed: Valid
                return {valid = true; message = ""};
            };
            case (_, _) {
                if (from == to) {
                    // Same status: Valid (no change)
                    return {valid = true; message = ""};
                } else {
                    // Invalid transition
                    return {
                        valid = false;
                        message = "error: invalid status transition from " # 
                                  statusToText(from) # " to " # statusToText(to);
                    };
                };
            };
        };
    };
    
    // Convert round status to text for error messages
    private func statusToText(status: RoundStatus) : Text {
        switch (status) {
            case (#upcoming) { "upcoming" };
            case (#active) { "active" };
            case (#processing) { "processing" };
            case (#completed) { "completed" };
        };
    };
    
    // Get all rounds
    private func getAllRounds() : [SaleRound] {
        var rounds: [SaleRound] = [];
        for ((_, round) in saleRounds.vals()) {
            rounds := Array.append(rounds, [round]);
        };
        rounds
    };
    
    // Calculate optimal price with fallback mechanisms for edge cases
    private func calculateOptimalPriceWithFallback(round: SaleRound, orders: [Order]) : Float {
        // 1. Check if there are any orders
        if (orders.size() == 0) {
            // Fallback: If no orders, use minimum price
            return round.minPrice;
        };
        
        // 2. Calculate total USD equivalent across all orders
        let totalUsdEquivalent = Array.foldLeft(
            orders,
            0.0,
            func(acc: Float, order: Order) : Float {
                if (order.status == #accepted or order.status == #pending) {
                    return acc + order.usdEquivalent;
                } else {
                    return acc;
                };
            }
        );
        
        // 3. Check if there's enough funding to meet minimum price
        let maxSharesAtMinPrice = totalUsdEquivalent / round.minPrice;
        if (Float.fromInt(round.shareSellTarget) > maxSharesAtMinPrice) {
            // Fallback: Not enough funding to meet target at minimum price
            // Return minimum price and let the admin decide what to do
            return round.minPrice;
        };
        
        // 4. Perform parameter sweep to find optimal price
        let optimalPrice = performParameterSweep(round, orders);
        
        // 5. Validate the result
        if (optimalPrice < round.minPrice) {
            // Fallback: If calculated price is below minimum, use minimum
            return round.minPrice;
        };
        
        if (optimalPrice > round.maxPrice) {
            // Fallback: If calculated price is above maximum, use maximum
            return round.maxPrice;
        };
        
        // 6. Return the calculated optimal price
        return optimalPrice;
    };
    
    // Perform parameter sweep to find optimal price
    private func performParameterSweep(round: SaleRound, orders: [Order]) : Float {
        // 1. Sort orders by bid price (descending)
        let sortedOrders = Array.sort<Order>(
            orders,
            func(a: Order, b: Order) : {#less; #equal; #greater} {
                if (a.maxBidPrice > b.maxBidPrice) {
                    #less
                } else if (a.maxBidPrice < b.maxBidPrice) {
                    #greater
                } else {
                    #equal
                }
            }
        );
        
        // 2. Initialize variables for tracking the optimal price
        var optimalPrice = round.minPrice;
        var maxSharesSold = 0;
        
        // 3. Perform parameter sweep from min to max price
        let priceStep = 0.01; // 1 cent increments
        var currentPrice = round.minPrice;
        
        while (currentPrice <= round.maxPrice) {
            // 4. Find eligible orders (bid price >= current price)
            let eligibleOrders = Array.filter<Order>(
                sortedOrders,
                func(order: Order) : Bool {
                    order.maxBidPrice >= currentPrice and 
                    (order.status == #accepted or order.status == #pending)
                }
            );
            
            // 5. Calculate total funding amount for eligible orders
            let totalFunding = Array.foldLeft<Order, Float>(
                eligibleOrders,
                0.0,
                func(acc: Float, order: Order) : Float {
                    acc + order.usdEquivalent
                }
            );
            
            // 6. Calculate share demand at this price
            let sharesDemand = Int.abs(Float.toInt(totalFunding / currentPrice));
            
            // 7. Check if this price results in more shares sold (up to the target)
            if (sharesDemand <= round.shareSellTarget and sharesDemand > maxSharesSold) {
                maxSharesSold := sharesDemand;
                optimalPrice := currentPrice;
            };
            
            // 8. Move to next price point
            currentPrice := currentPrice + priceStep;
        };
        
        // 9. Return the optimal price
        optimalPrice
    };
    
    // 1. Order Management Helper Functions
    
    // Generate a unique order ID
    private func generateOrderId() : OrderId {
        let id = Nat.toText(nextOrderId);
        nextOrderId += 1;
        return id;
    };
    
    // Find an order by ID
    private func findOrder(orderId : OrderId) : ?Order {
        for ((id, order) in orders.vals()) {
            if (id == orderId) {
                return ?order;
            };
        };
        null
    };
    
    // Get orders for a user
    private func getOrdersForUser(user : Principal) : [Order] {
        var userOrders : [Order] = [];
        
        // Find the user's order IDs
        for ((storedUser, orderIds) in ordersByUser.vals()) {
            if (Principal.equal(storedUser, user)) {
                // For each order ID, find the order
                for (orderId in orderIds.vals()) {
                    switch (findOrder(orderId)) {
                        case (?order) {
                            userOrders := Array.append(userOrders, [order]);
                        };
                        case (null) {
                            // Order not found, skip
                        };
                    };
                };
                
                return userOrders;
            };
        };
        
        []
    };
    
    // Get orders for a round
    private func getOrdersForRound(roundId : RoundId) : [Order] {
        var roundOrders : [Order] = [];
        
        // Find the round's order IDs
        for ((storedRoundId, orderIds) in ordersByRound.vals()) {
            if (storedRoundId == roundId) {
                // For each order ID, find the order
                for (orderId in orderIds.vals()) {
                    switch (findOrder(orderId)) {
                        case (?order) {
                            roundOrders := Array.append(roundOrders, [order]);
                        };
                        case (null) {
                            // Order not found, skip
                        };
                    };
                };
                
                return roundOrders;
            };
        };
        
        []
    };
    
    // Add an order to the order book
    private func addOrder(order : Order) : () {
        // Add to orders
        orders := Array.append(orders, [(order.id, order)]);
        
        // Add to ordersByUser
        var userOrderIds : [OrderId] = [];
        var userFound = false;
        
        for ((storedUser, orderIds) in ordersByUser.vals()) {
            if (Principal.equal(storedUser, order.user)) {
                userOrderIds := Array.append(orderIds, [order.id]);
                userFound := true;
                return;
            };
        };
        
        if (not userFound) {
            userOrderIds := [order.id];
            ordersByUser := Array.append(ordersByUser, [(order.user, userOrderIds)]);
        } else {
            // Update ordersByUser
            var updatedOrdersByUser : [(Principal, [OrderId])] = [];
            for ((storedUser, orderIds) in ordersByUser.vals()) {
                if (Principal.equal(storedUser, order.user)) {
                    updatedOrdersByUser := Array.append(updatedOrdersByUser, [(storedUser, Array.append(orderIds, [order.id]))]);
                } else {
                    updatedOrdersByUser := Array.append(updatedOrdersByUser, [(storedUser, orderIds)]);
                };
            };
            ordersByUser := updatedOrdersByUser;
        };
        
        // Add to ordersByRound
        var roundOrderIds : [OrderId] = [];
        var roundFound = false;
        
        for ((storedRoundId, orderIds) in ordersByRound.vals()) {
            if (storedRoundId == order.roundId) {
                roundOrderIds := Array.append(orderIds, [order.id]);
                roundFound := true;
                return;
            };
        };
        
        if (not roundFound) {
            roundOrderIds := [order.id];
            ordersByRound := Array.append(ordersByRound, [(order.roundId, roundOrderIds)]);
        } else {
            // Update ordersByRound
            var updatedOrdersByRound : [(RoundId, [OrderId])] = [];
            for ((storedRoundId, orderIds) in ordersByRound.vals()) {
                if (storedRoundId == order.roundId) {
                    updatedOrdersByRound := Array.append(updatedOrdersByRound, [(storedRoundId, Array.append(orderIds, [order.id]))]);
                } else {
                    updatedOrdersByRound := Array.append(updatedOrdersByRound, [(storedRoundId, orderIds)]);
                };
            };
            ordersByRound := updatedOrdersByRound;
        };
    };
    
    // Update an order in the order book
    private func updateOrder(order : Order) : () {
        // Update in orders
        var updatedOrders : [(OrderId, Order)] = [];
        for ((id, storedOrder) in orders.vals()) {
            if (id == order.id) {
                updatedOrders := Array.append(updatedOrders, [(id, order)]);
            } else {
                updatedOrders := Array.append(updatedOrders, [(id, storedOrder)]);
            };
        };
        orders := updatedOrders;
    };
    
    // 2. Sale Round Management Helper Functions
    
    // Generate a unique round ID
    private func generateRoundId() : RoundId {
        let id = nextRoundId;
        nextRoundId += 1;
        return id;
    };
    
    // Find a sale round by ID
    private func findSaleRound(roundId : RoundId) : ?SaleRound {
        for ((id, round) in saleRounds.vals()) {
            if (id == roundId) {
                return ?round;
            };
        };
        null
    };
    
    // Get the current active sale round
    private func getCurrentSaleRound() : ?SaleRound {
        switch (currentRoundId) {
            case (?roundId) {
                findSaleRound(roundId)
            };
            case (null) {
                null
            };
        }
    };
    
    // Add a sale round
    private func addSaleRound(round : SaleRound) : () {
        saleRounds := Array.append(saleRounds, [(round.id, round)]);
    };
    
    // Update a sale round
    private func updateSaleRound(round : SaleRound) : () {
        var updatedSaleRounds : [(RoundId, SaleRound)] = [];
        for ((id, storedRound) in saleRounds.vals()) {
            if (id == round.id) {
                updatedSaleRounds := Array.append(updatedSaleRounds, [(id, round)]);
            } else {
                updatedSaleRounds := Array.append(updatedSaleRounds, [(id, storedRound)]);
            };
        };
        saleRounds := updatedSaleRounds;
    };
    
    // Get the base vesting period for a round
    private func getBaseVestingPeriod(roundId : RoundId) : Nat {
        for ((id, period) in baseVestingPeriods.vals()) {
            if (id == roundId) {
                return period;
            };
        };
        
        // Default to 0 if not found
        0
    };
    
    // 3. Vesting Schedule Management Helper Functions
    
    // Find a vesting schedule for a user
    private func findVestingSchedule(user : Principal) : ?VestingSchedule {
        for ((storedUser, schedule) in vestingSchedules.vals()) {
            if (Principal.equal(storedUser, user)) {
                return ?schedule;
            };
        };
        null
    };
    
    // Add a vesting batch to a user's schedule
    private func addVestingBatch(user : Principal, batch : VestingBatch) : () {
        switch (findVestingSchedule(user)) {
            case (?schedule) {
                // Update existing schedule
                let updatedSchedule = {
                    user = user;
                    batches = Array.append(schedule.batches, [batch]);
                    lastUpdated = Time.now();
                };
                
                var updatedVestingSchedules : [(Principal, VestingSchedule)] = [];
                for ((storedUser, storedSchedule) in vestingSchedules.vals()) {
                    if (Principal.equal(storedUser, user)) {
                        updatedVestingSchedules := Array.append(updatedVestingSchedules, [(storedUser, updatedSchedule)]);
                    } else {
                        updatedVestingSchedules := Array.append(updatedVestingSchedules, [(storedUser, storedSchedule)]);
                    };
                };
                vestingSchedules := updatedVestingSchedules;
            };
            case (null) {
                // Create new schedule
                let newSchedule = {
                    user = user;
                    batches = [batch];
                    lastUpdated = Time.now();
                };
                
                vestingSchedules := Array.append(vestingSchedules, [(user, newSchedule)]);
            };
        };
    };
    
    // Calculate the next batch price (for vesting acceleration)
    private func getNextBatchPrice(roundId : RoundId) : Float {
        // Find the next round
        let nextRoundId = roundId + 1;
        
        if (nextRoundId > 12) {
            // This is the last round, use its own price
            switch (findSaleRound(roundId)) {
                case (?round) {
                    switch (round.finalPrice) {
                        case (?price) {
                            return price;
                        };
                        case (null) {
                            return round.minPrice;
                        };
                    };
                };
                case (null) {
                    return 0.0;
                };
            };
        } else {
            // Find the next round's price
            switch (findSaleRound(nextRoundId)) {
                case (?nextRound) {
                    switch (nextRound.finalPrice) {
                        case (?price) {
                            return price;
                        };
                        case (null) {
                            return nextRound.minPrice;
                        };
                    };
                };
                case (null) {
                    return 0.0;
                };
            };
        };
    };
    
    // 4. User Portfolio Management Helper Functions
    
    // Find a user's portfolio
    private func findUserPortfolio(user : Principal) : ?UserPortfolio {
        for ((storedUser, portfolio) in userPortfolios.vals()) {
            if (Principal.equal(storedUser, user)) {
                return ?portfolio;
            };
        };
        null
    };
    
    // Add or update a user's portfolio
    private func updateUserPortfolio(portfolio : UserPortfolio) : () {
        var found = false;
        
        var updatedUserPortfolios : [(Principal, UserPortfolio)] = [];
        for ((storedUser, storedPortfolio) in userPortfolios.vals()) {
            if (Principal.equal(storedUser, portfolio.user)) {
                updatedUserPortfolios := Array.append(updatedUserPortfolios, [(storedUser, portfolio)]);
                found := true;
            } else {
                updatedUserPortfolios := Array.append(updatedUserPortfolios, [(storedUser, storedPortfolio)]);
            };
        };
        userPortfolios := updatedUserPortfolios;
        
        if (not found) {
            userPortfolios := Array.append(userPortfolios, [(portfolio.user, portfolio)]);
        };
    };
    
    // Update a user's share allocation
    private func updateUserShareAllocation(user : Principal, roundId : RoundId, purchasePrice : Float, amount : Nat) : () {
        switch (findUserPortfolio(user)) {
            case (?portfolio) {
                // Check if the user already has an allocation for this round
                var found = false;
                var updatedAllocations : [ShareAllocation] = [];
                
                for (allocation in portfolio.shareAllocations.vals()) {
                    if (allocation.roundId == roundId) {
                        // Update existing allocation
                        let updatedAllocation = {
                            roundId = roundId;
                            purchasePrice = purchasePrice;
                            amount = allocation.amount + amount;
                            vestedAmount = allocation.vestedAmount;
                            vestingStatus = allocation.vestingStatus;
                            nextVestingDate = allocation.nextVestingDate;
                        };
                        
                        updatedAllocations := Array.append(updatedAllocations, [updatedAllocation]);
                        found := true;
                    } else {
                        updatedAllocations := Array.append(updatedAllocations, [allocation]);
                    };
                };
                
                if (not found) {
                    // Create new allocation
                    let baseVestingPeriod = getBaseVestingPeriod(roundId);
                    let vestingStartDate = Time.now();
                    let nextVestingDate = vestingStartDate + (baseVestingPeriod * 30 * 24 * 60 * 60 * 1_000_000_000); // baseVestingPeriod months in nanoseconds
                    
                    let newAllocation = {
                        roundId = roundId;
                        purchasePrice = purchasePrice;
                        amount = amount;
                        vestedAmount = 0;
                        vestingStatus = "Vesting";
                        nextVestingDate = ?nextVestingDate;
                    };
                    
                    updatedAllocations := Array.append(updatedAllocations, [newAllocation]);
                };
                
                // Update total shares owned
                let totalSharesOwned = Array.foldLeft(
                    updatedAllocations,
                    0,
                    func(acc : Nat, allocation : ShareAllocation) : Nat {
                        acc + allocation.amount
                    }
                );
                
                // Update total shares vested
                let totalSharesVested = Array.foldLeft(
                    updatedAllocations,
                    0,
                    func(acc : Nat, allocation : ShareAllocation) : Nat {
                        acc + allocation.vestedAmount
                    }
                );
                
                // Update portfolio
                let updatedPortfolio = {
                    portfolio with
                    shareAllocations = updatedAllocations;
                    totalSharesOwned = totalSharesOwned;
                    totalSharesVested = totalSharesVested;
                    lastUpdated = Time.now();
                };
                
                updateUserPortfolio(updatedPortfolio);
            };
            case (null) {
                // Create new portfolio
                let baseVestingPeriod = getBaseVestingPeriod(roundId);
                let vestingStartDate = Time.now();
                let nextVestingDate = vestingStartDate + (baseVestingPeriod * 30 * 24 * 60 * 60 * 1_000_000_000); // baseVestingPeriod months in nanoseconds
                
                let newAllocation = {
                    roundId = roundId;
                    purchasePrice = purchasePrice;
                    amount = amount;
                    vestedAmount = 0;
                    vestingStatus = "Vesting";
                    nextVestingDate = ?nextVestingDate;
                };
                
                let newPortfolio = {
                    user = user;
                    depositedAssets = [];
                    shareAllocations = [newAllocation];
                    totalSharesOwned = amount;
                    totalSharesVested = 0;
                    estimatedPortfolioValue = Float.fromInt(amount) * purchasePrice;
                    lastUpdated = Time.now();
                };
                
                updateUserPortfolio(newPortfolio);
            };
        };
    };
}
