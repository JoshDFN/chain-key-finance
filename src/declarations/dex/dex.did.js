export const idlFactory = ({ IDL }) => {
  const OrderId = IDL.Nat;
  const TokenPair = IDL.Text;
  const OrderType = IDL.Variant({ 'buy' : IDL.Null, 'sell' : IDL.Null });
  const OrderStatus = IDL.Variant({
    'open' : IDL.Null,
    'filled' : IDL.Null,
    'cancelled' : IDL.Null,
  });
  const Order = IDL.Record({
    'id' : OrderId,
    'owner' : IDL.Principal,
    'pair' : TokenPair,
    'orderType' : OrderType,
    'price' : IDL.Float64,
    'amount' : IDL.Float64,
    'filled' : IDL.Float64,
    'status' : OrderStatus,
    'timestamp' : IDL.Int,
  });
  return IDL.Service({
    'cancelOrder' : IDL.Func([OrderId], [IDL.Bool], []),
    'getOrder' : IDL.Func([OrderId], [IDL.Opt(Order)], ['query']),
    'getOrderBook' : IDL.Func(
        [TokenPair],
        [
          IDL.Record({
            'buyOrders' : IDL.Vec(Order),
            'sellOrders' : IDL.Vec(Order),
            'spread' : IDL.Float64,
            'lastPrice' : IDL.Opt(IDL.Float64),
            'volatility' : IDL.Float64,
          }),
        ],
        ['query'],
      ),
    'getSupportedPairs' : IDL.Func([], [IDL.Vec(TokenPair)], ['query']),
    'getUserOrders' : IDL.Func([IDL.Principal], [IDL.Vec(Order)], ['query']),
    'getVolatility' : IDL.Func([TokenPair], [IDL.Float64], ['query']),
    'initialize' : IDL.Func([], [], []),
    'placeOrder' : IDL.Func(
        [TokenPair, OrderType, IDL.Float64, IDL.Float64],
        [OrderId],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
