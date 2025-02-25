import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Option "mo:base/Option";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Float "mo:base/Float";
import Time "mo:base/Time";
import Debug "mo:base/Debug";
import Error "mo:base/Error";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Text "mo:base/Text";
import Buffer "mo:base/Buffer";

actor {
    // Type definitions
    type OrderId = Nat;
    type TokenPair = Text; // e.g., "ckBTC-ICP"
    type OrderType = {
        #buy;
        #sell;
    };
    type OrderStatus = {
        #open;
        #filled;
        #cancelled;
    };
    type Order = {
        id : OrderId;
        owner : Principal;
        pair : TokenPair;
        orderType : OrderType;
        price : Float;
        amount : Float;
        filled : Float;
        status : OrderStatus;
        timestamp : Int;
    };
    type OrderBook = {
        pair : TokenPair;
        buyOrders : [OrderId];
        sellOrders : [OrderId];
        lastPrice : ?Float;
        volatility : Float;
    };

    // State variables
    private stable var nextOrderId : OrderId = 1;
    private stable var orders : [(OrderId, Order)] = [];
    private stable var orderBooks : [(TokenPair, OrderBook)] = [];
    private stable var volatilityHistory : [(TokenPair, [(Int, Float)])] = [];
    private stable var owner_ : Principal = Principal.fromText("pobwx-4kc7z-mqaqs-4qkam-p3aks-orult-taaah-fj3xz-bmkka-gtcaj-jae");

    // Initialize the orders HashMap from stable storage
    private func initOrders() : HashMap.HashMap<OrderId, Order> {
        let map = HashMap.HashMap<OrderId, Order>(10, Nat.equal, Int.hash);
        for ((id, order) in orders.vals()) {
            map.put(id, order);
        };
        map
    };

    // Initialize the orderBooks HashMap from stable storage
    private func initOrderBooks() : HashMap.HashMap<TokenPair, OrderBook> {
        let map = HashMap.HashMap<TokenPair, OrderBook>(10, Text.equal, Text.hash);
        for ((pair, book) in orderBooks.vals()) {
            map.put(pair, book);
        };
        map
    };

    // Initialize the volatilityHistory HashMap from stable storage
    private func initVolatilityHistory() : HashMap.HashMap<TokenPair, [(Int, Float)]> {
        let map = HashMap.HashMap<TokenPair, [(Int, Float)]>(10, Text.equal, Text.hash);
        for ((pair, history) in volatilityHistory.vals()) {
            map.put(pair, history);
        };
        map
    };

    private let ordersMap = initOrders();
    private let orderBooksMap = initOrderBooks();
    private let volatilityHistoryMap = initVolatilityHistory();

    // Initialize the DEX with supported token pairs
    public shared(msg) func initialize() : async () {
        if (msg.caller != owner_) {
            throw Error.reject("Unauthorized: only the owner can initialize the DEX");
        };

        // Initialize order books for supported pairs if they don't exist
        let pairs = ["ckBTC-ICP", "ckETH-ICP", "ckSOL-ICP", "ckUSDC-ICP"];
        
        for (pair in pairs.vals()) {
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
        };
    };

    // Calculate the current spread based on volatility
    private func calculateSpread(pair : TokenPair) : Float {
        let orderBook = Option.get(orderBooksMap.get(pair), {
            pair = pair;
            buyOrders = [];
            sellOrders = [];
            lastPrice = null;
            volatility = 0.02;
        });
        
        // Adjust spread based on volatility
        if (orderBook.volatility < 0.01) {
            return 0.01; // 1% spread in low volatility
        } else {
            return 0.04; // 4% spread in high volatility
        };
    };

    // Update volatility based on price changes
    private func updateVolatility(pair : TokenPair, newPrice : Float) : () {
        let orderBook = Option.get(orderBooksMap.get(pair), {
            pair = pair;
            buyOrders = [];
            sellOrders = [];
            lastPrice = null;
            volatility = 0.02;
        });
        
        switch (orderBook.lastPrice) {
            case (?lastPrice) {
                // Calculate price change percentage
                let priceChange = Float.abs((newPrice - lastPrice) / lastPrice);
                
                // Get volatility history
                let history = Option.get(volatilityHistoryMap.get(pair), []);
                
                // Add new data point
                let now = Time.now();
                let newHistory = Array.append(history, [(now, priceChange)]);
                
                // Keep only last 24 hours of data
                let oneDayAgo = now - 24 * 3600 * 1000000000;
                let recentHistory = Array.filter(newHistory, func((timestamp, _) : (Int, Float)) : Bool {
                    timestamp >= oneDayAgo
                });
                
                volatilityHistoryMap.put(pair, recentHistory);
                
                // Calculate new volatility (simple average of recent price changes)
                var totalChange : Float = 0;
                for ((_, change) in recentHistory.vals()) {
                    totalChange += change;
                };
                
                let newVolatility = if (recentHistory.size() > 0) {
                    totalChange / Float.fromInt(recentHistory.size())
                } else {
                    0.02 // Default volatility
                };
                
                // Update order book with new volatility and price
                orderBooksMap.put(pair, {
                    pair = orderBook.pair;
                    buyOrders = orderBook.buyOrders;
                    sellOrders = orderBook.sellOrders;
                    lastPrice = ?newPrice;
                    volatility = newVolatility;
                });
            };
            case (null) {
                // First price, just update the order book
                orderBooksMap.put(pair, {
                    pair = orderBook.pair;
                    buyOrders = orderBook.buyOrders;
                    sellOrders = orderBook.sellOrders;
                    lastPrice = ?newPrice;
                    volatility = orderBook.volatility;
                });
            };
        };
    };

    // Place a new order
    public shared(msg) func placeOrder(pair : TokenPair, orderType : OrderType, price : Float, amount : Float) : async OrderId {
        let caller = msg.caller;
        
        // Validate inputs
        if (price <= 0 or amount <= 0) {
            throw Error.reject("Invalid price or amount");
        };
        
        // Get the order book
        let orderBook = Option.get(orderBooksMap.get(pair), {
            pair = pair;
            buyOrders = [];
            sellOrders = [];
            lastPrice = null;
            volatility = 0.02;
        });
        
        // Create the new order
        let orderId = nextOrderId;
        nextOrderId += 1;
        
        let newOrder : Order = {
            id = orderId;
            owner = caller;
            pair = pair;
            orderType = orderType;
            price = price;
            amount = amount;
            filled = 0;
            status = #open;
            timestamp = Time.now();
        };
        
        // Add the order to the map
        ordersMap.put(orderId, newOrder);
        
        // Update the order book
        let updatedBuyOrders = switch (orderType) {
            case (#buy) { Array.append(orderBook.buyOrders, [orderId]) };
            case (#sell) { orderBook.buyOrders };
        };
        
        let updatedSellOrders = switch (orderType) {
            case (#buy) { orderBook.sellOrders };
            case (#sell) { Array.append(orderBook.sellOrders, [orderId]) };
        };
        
        orderBooksMap.put(pair, {
            pair = orderBook.pair;
            buyOrders = updatedBuyOrders;
            sellOrders = updatedSellOrders;
            lastPrice = orderBook.lastPrice;
            volatility = orderBook.volatility;
        });
        
        return orderId;
    };

    // Cancel an order
    public shared(msg) func cancelOrder(orderId : OrderId) : async Bool {
        let caller = msg.caller;
        
        switch (ordersMap.get(orderId)) {
            case (?order) {
                if (order.owner != caller) {
                    throw Error.reject("Unauthorized: only the order owner can cancel it");
                };
                
                if (order.status != #open) {
                    return false;
                };
                
                // Update the order
                let updatedOrder = {
                    id = order.id;
                    owner = order.owner;
                    pair = order.pair;
                    orderType = order.orderType;
                    price = order.price;
                    amount = order.amount;
                    filled = order.filled;
                    status = #cancelled;
                    timestamp = order.timestamp;
                };
                
                ordersMap.put(orderId, updatedOrder);
                
                // Update the order book
                let orderBook = Option.get(orderBooksMap.get(order.pair), {
                    pair = order.pair;
                    buyOrders = [];
                    sellOrders = [];
                    lastPrice = null;
                    volatility = 0.02;
                });
                
                let updatedBuyOrders = Array.filter(orderBook.buyOrders, func(id : OrderId) : Bool {
                    id != orderId
                });
                
                let updatedSellOrders = Array.filter(orderBook.sellOrders, func(id : OrderId) : Bool {
                    id != orderId
                });
                
                orderBooksMap.put(order.pair, {
                    pair = orderBook.pair;
                    buyOrders = updatedBuyOrders;
                    sellOrders = updatedSellOrders;
                    lastPrice = orderBook.lastPrice;
                    volatility = orderBook.volatility;
                });
                
                return true;
            };
            case (null) {
                return false;
            };
        };
    };

    // Get order details
    public query func getOrder(orderId : OrderId) : async ?Order {
        ordersMap.get(orderId)
    };

    // Get user's orders
    public query func getUserOrders(user : Principal) : async [Order] {
        let userOrders = Buffer.Buffer<Order>(0);
        
        for ((_, order) in ordersMap.entries()) {
            if (order.owner == user) {
                userOrders.add(order);
            };
        };
        
        Buffer.toArray(userOrders)
    };

    // Get order book for a pair
    public query func getOrderBook(pair : TokenPair) : async {
        buyOrders : [Order];
        sellOrders : [Order];
        spread : Float;
        lastPrice : ?Float;
        volatility : Float;
    } {
        let orderBook = Option.get(orderBooksMap.get(pair), {
            pair = pair;
            buyOrders = [];
            sellOrders = [];
            lastPrice = null;
            volatility = 0.02;
        });
        
        let buyOrders = Buffer.Buffer<Order>(0);
        for (id in orderBook.buyOrders.vals()) {
            switch (ordersMap.get(id)) {
                case (?order) {
                    if (order.status == #open) {
                        buyOrders.add(order);
                    };
                };
                case (null) {};
            };
        };
        
        let sellOrders = Buffer.Buffer<Order>(0);
        for (id in orderBook.sellOrders.vals()) {
            switch (ordersMap.get(id)) {
                case (?order) {
                    if (order.status == #open) {
                        sellOrders.add(order);
                    };
                };
                case (null) {};
            };
        };
        
        {
            buyOrders = Buffer.toArray(buyOrders);
            sellOrders = Buffer.toArray(sellOrders);
            spread = calculateSpread(pair);
            lastPrice = orderBook.lastPrice;
            volatility = orderBook.volatility;
        }
    };

    // Get all supported pairs
    public query func getSupportedPairs() : async [TokenPair] {
        let pairs = Buffer.Buffer<TokenPair>(0);
        
        for ((pair, _) in orderBooksMap.entries()) {
            pairs.add(pair);
        };
        
        Buffer.toArray(pairs)
    };

    // Get current volatility for a pair
    public query func getVolatility(pair : TokenPair) : async Float {
        let orderBook = Option.get(orderBooksMap.get(pair), {
            pair = pair;
            buyOrders = [];
            sellOrders = [];
            lastPrice = null;
            volatility = 0.02;
        });
        
        orderBook.volatility
    };

    // System functions
    system func preupgrade() {
        orders := Iter.toArray(ordersMap.entries());
        orderBooks := Iter.toArray(orderBooksMap.entries());
        volatilityHistory := Iter.toArray(volatilityHistoryMap.entries());
    };

    system func postupgrade() {
        orders := [];
        orderBooks := [];
        volatilityHistory := [];
    };
}
