import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import HashMap "mo:base/HashMap";
import Hash "mo:base/Hash";
import Int "mo:base/Int";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Time "mo:base/Time";

shared(msg) actor class Token(
    _name: Text,
    _symbol: Text,
    _decimals: Nat8,
    _totalSupply: Nat,
    _owner: Principal
) {
    // Types
    public type TxRecord = {
        from: Principal;
        to: Principal;
        amount: Nat;
        timestamp: Int;
    };

    // State
    private stable var name_ : Text = _name;
    private stable var symbol_ : Text = _symbol;
    private stable var decimals_ : Nat8 = _decimals;
    private stable var totalSupply_ : Nat = _totalSupply;
    private stable var owner_ : Principal = _owner;
    private stable var balances : [(Principal, Nat)] = [];
    private stable var allowances : [(Principal, [(Principal, Nat)])] = [];
    private stable var transactions : [TxRecord] = [];

    private var balanceMap = HashMap.HashMap<Principal, Nat>(1, Principal.equal, Principal.hash);
    private var allowanceMap = HashMap.HashMap<Principal, HashMap.HashMap<Principal, Nat>>(1, Principal.equal, Principal.hash);
    private var txBuffer = Buffer.Buffer<TxRecord>(0);

    // Initialize state from stable storage
    private func initMaps() {
        for ((owner, balance) in balances.vals()) {
            balanceMap.put(owner, balance);
        };
        for ((owner, ownerAllowances) in allowances.vals()) {
            let innerMap = HashMap.HashMap<Principal, Nat>(1, Principal.equal, Principal.hash);
            for ((spender, amount) in ownerAllowances.vals()) {
                innerMap.put(spender, amount);
            };
            allowanceMap.put(owner, innerMap);
        };
        for (tx in transactions.vals()) {
            txBuffer.add(tx);
        };
    };

    system func preupgrade() {
        balances := Iter.toArray(balanceMap.entries());
        let allowanceEntries = Iter.toArray(allowanceMap.entries());
        allowances := Array.map<(Principal, HashMap.HashMap<Principal, Nat>), (Principal, [(Principal, Nat)])>(
            allowanceEntries,
            func (entry: (Principal, HashMap.HashMap<Principal, Nat>)) : (Principal, [(Principal, Nat)]) {
                (entry.0, Iter.toArray(entry.1.entries()))
            }
        );
        transactions := Buffer.toArray(txBuffer);
    };

    system func postupgrade() {
        initMaps();
    };

    // Token info
    public query func name() : async Text { name_ };
    public query func symbol() : async Text { symbol_ };
    public query func decimals() : async Nat8 { decimals_ };
    public query func totalSupply() : async Nat { totalSupply_ };
    public query func owner() : async Principal { owner_ };

    // Balances and allowances
    public query func balanceOf(who: Principal) : async Nat {
        Option.get(balanceMap.get(who), 0)
    };

    public query func allowance(owner: Principal, spender: Principal) : async Nat {
        switch (allowanceMap.get(owner)) {
            case (?ownerAllowances) {
                Option.get(ownerAllowances.get(spender), 0)
            };
            case null { 0 };
        }
    };

    // Transfer and approve
    public shared(msg) func transfer(to: Principal, value: Nat) : async Result.Result<(), Text> {
        let from = msg.caller;
        switch (balanceMap.get(from)) {
            case (?fromBalance) {
                if (fromBalance < value) {
                    return #err("Insufficient balance");
                };
                let toBalance = Option.get(balanceMap.get(to), 0);
                balanceMap.put(from, fromBalance - value);
                balanceMap.put(to, toBalance + value);
                
                // Record transaction
                txBuffer.add({
                    from;
                    to;
                    amount = value;
                    timestamp = Time.now();
                });
                #ok()
            };
            case null {
                #err("No balance for sender")
            };
        }
    };

    public shared(msg) func approve(spender: Principal, value: Nat) : async Result.Result<(), Text> {
        let owner = msg.caller;
        switch (allowanceMap.get(owner)) {
            case (?ownerAllowances) {
                ownerAllowances.put(spender, value);
            };
            case null {
                let newAllowances = HashMap.HashMap<Principal, Nat>(1, Principal.equal, Principal.hash);
                newAllowances.put(spender, value);
                allowanceMap.put(owner, newAllowances);
            };
        };
        #ok()
    };

    public shared(msg) func transferFrom(from: Principal, to: Principal, value: Nat) : async Result.Result<(), Text> {
        let spender = msg.caller;
        switch (allowanceMap.get(from)) {
            case (?ownerAllowances) {
                switch (ownerAllowances.get(spender)) {
                    case (?allowance) {
                        if (allowance < value) {
                            return #err("Insufficient allowance");
                        };
                        switch (balanceMap.get(from)) {
                            case (?fromBalance) {
                                if (fromBalance < value) {
                                    return #err("Insufficient balance");
                                };
                                let toBalance = Option.get(balanceMap.get(to), 0);
                                balanceMap.put(from, fromBalance - value);
                                balanceMap.put(to, toBalance + value);
                                ownerAllowances.put(spender, allowance - value);
                                
                                // Record transaction
                                txBuffer.add({
                                    from;
                                    to;
                                    amount = value;
                                    timestamp = Time.now();
                                });
                                #ok()
                            };
                            case null {
                                #err("No balance for sender")
                            };
                        }
                    };
                    case null {
                        #err("No allowance for spender")
                    };
                }
            };
            case null {
                #err("No allowances for owner")
            };
        }
    };

    // Admin functions
    public shared(msg) func mint(to: Principal, value: Nat) : async Result.Result<(), Text> {
        if (msg.caller != owner_) {
            return #err("Only owner can mint");
        };
        let toBalance = Option.get(balanceMap.get(to), 0);
        balanceMap.put(to, toBalance + value);
        totalSupply_ += value;
        #ok()
    };

    public shared(msg) func burn(from: Principal, value: Nat) : async Result.Result<(), Text> {
        if (msg.caller != owner_) {
            return #err("Only owner can burn");
        };
        switch (balanceMap.get(from)) {
            case (?fromBalance) {
                if (fromBalance < value) {
                    return #err("Insufficient balance");
                };
                balanceMap.put(from, fromBalance - value);
                totalSupply_ -= value;
                #ok()
            };
            case null {
                #err("No balance for address")
            };
        }
    };

    // Transaction history
    public query func getTransactions() : async [TxRecord] {
        Buffer.toArray(txBuffer)
    };
}
