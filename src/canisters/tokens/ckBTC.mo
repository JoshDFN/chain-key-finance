import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Option "mo:base/Option";
import Nat "mo:base/Nat";
import Debug "mo:base/Debug";
import Error "mo:base/Error";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";

actor {
    // Type definitions
    type Account = {
        owner : Principal;
        subaccount : ?[Nat8];
    };

    type TransferArgs = {
        from_subaccount : ?[Nat8];
        to : Account;
        amount : Nat;
        fee : ?Nat;
        memo : ?[Nat8];
        created_at_time : ?Nat64;
    };

    type TransferResult = {
        #Ok : Nat;
        #Err : TransferError;
    };

    type TransferError = {
        #BadFee : { expected_fee : Nat };
        #BadBurn : { min_burn_amount : Nat };
        #InsufficientFunds : { balance : Nat };
        #TooOld;
        #CreatedInFuture : { ledger_time : Nat64 };
        #TemporarilyUnavailable;
        #Duplicate : { duplicate_of : Nat };
        #GenericError : { error_code : Nat; message : Text };
    };

    // State variables
    private stable var balances : [(Principal, Nat)] = [];
    private stable var minter : ?Principal = null;
    private stable var totalSupply : Nat = 0;
    private stable var name_ : Text = "Chain-Key Bitcoin";
    private stable var symbol_ : Text = "ckBTC";
    private stable var decimals_ : Nat8 = 8;
    private stable var fee_ : Nat = 10; // 10 satoshis

    // Initialize the balances HashMap from stable storage
    private func initBalances() : HashMap.HashMap<Principal, Nat> {
        let map = HashMap.HashMap<Principal, Nat>(10, Principal.equal, Principal.hash);
        for ((p, b) in balances.vals()) {
            map.put(p, b);
        };
        map
    };

    private let balancesMap = initBalances();

    // Set the minter principal
    public shared(msg) func setMinter(newMinter : Principal) : async () {
        if (Option.isNull(minter)) {
            // First time setup
            minter := ?newMinter;
        } else if (Option.get(minter, Principal.fromText("2vxsx-fae")) == msg.caller) {
            // Only the current minter can change the minter
            minter := ?newMinter;
        } else {
            throw Error.reject("Unauthorized: only the current minter can change the minter");
        };
    };

    // Mint new tokens
    public shared(msg) func mint(to : Principal, amount : Nat) : async () {
        if (Option.get(minter, Principal.fromText("2vxsx-fae")) != msg.caller) {
            throw Error.reject("Unauthorized: only the minter can mint tokens");
        };

        let currentBalance = Option.get(balancesMap.get(to), 0);
        balancesMap.put(to, currentBalance + amount);
        totalSupply += amount;
    };

    // Burn tokens
    public shared(msg) func burn(amount : Nat) : async () {
        let caller = msg.caller;
        let currentBalance = Option.get(balancesMap.get(caller), 0);
        
        if (currentBalance < amount) {
            throw Error.reject("Insufficient balance for burn");
        };
        
        balancesMap.put(caller, currentBalance - amount);
        totalSupply -= amount;
    };

    // Transfer tokens
    public shared(msg) func transfer(to : Principal, amount : Nat) : async Bool {
        let from = msg.caller;
        let fromBalance = Option.get(balancesMap.get(from), 0);
        
        if (fromBalance < amount) {
            return false;
        };
        
        let toBalance = Option.get(balancesMap.get(to), 0);
        
        balancesMap.put(from, fromBalance - amount);
        balancesMap.put(to, toBalance + amount);
        
        return true;
    };

    // ICRC-1 compatible transfer
    public shared(msg) func icrc1_transfer(args : TransferArgs) : async TransferResult {
        let from = msg.caller;
        let fromBalance = Option.get(balancesMap.get(from), 0);
        let to = args.to.owner;
        
        // Check if the caller has enough balance
        if (fromBalance < args.amount) {
            return #Err(#InsufficientFunds { balance = fromBalance });
        };
        
        // Check fee
        if (Option.get(args.fee, fee_) < fee_) {
            return #Err(#BadFee { expected_fee = fee_ });
        };
        
        let toBalance = Option.get(balancesMap.get(to), 0);
        
        // Update balances
        balancesMap.put(from, fromBalance - args.amount);
        balancesMap.put(to, toBalance + args.amount);
        
        return #Ok(0); // Return transaction index (simplified)
    };

    // Get balance
    public query func balanceOf(who : Principal) : async Nat {
        Option.get(balancesMap.get(who), 0)
    };

    // Get total supply
    public query func getTotalSupply() : async Nat {
        totalSupply
    };

    // Get token metadata
    public query func name() : async Text {
        name_
    };

    public query func symbol() : async Text {
        symbol_
    };

    public query func decimals() : async Nat8 {
        decimals_
    };

    // System functions
    system func preupgrade() {
        balances := Iter.toArray(balancesMap.entries());
    };

    system func postupgrade() {
        balances := [];
    };
}
