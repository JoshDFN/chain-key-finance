export const idlFactory = ({ IDL }) => {
  const BitcoinAddress = IDL.Text;
  const BitcoinNetwork = IDL.Variant({
    'mainnet': IDL.Null,
    'testnet': IDL.Null,
  });
  const Satoshi = IDL.Nat64;
  const MillisatoshiPerByte = IDL.Nat64;
  const BitcoinTransactionInput = IDL.Record({
    'address': IDL.Opt(BitcoinAddress),
    'value': Satoshi,
  });
  const BitcoinTransactionOutput = IDL.Record({
    'address': BitcoinAddress,
    'value': Satoshi,
  });
  const BitcoinTransaction = IDL.Record({
    'hash': IDL.Text,
    'inputs': IDL.Vec(BitcoinTransactionInput),
    'outputs': IDL.Vec(BitcoinTransactionOutput),
    'confirmations': IDL.Nat32,
    'block_height': IDL.Opt(IDL.Nat32),
  });
  const OutPoint = IDL.Record({
    'txid': IDL.Vec(IDL.Nat8),
    'vout': IDL.Nat32,
  });
  const Utxo = IDL.Record({
    'outpoint': OutPoint,
    'value': Satoshi,
    'height': IDL.Nat32,
  });
  const GetUtxosResponse = IDL.Record({
    'utxos': IDL.Vec(Utxo),
    'total_count': IDL.Nat64,
  });
  const SendTransactionRequest = IDL.Record({
    'transaction': IDL.Vec(IDL.Nat8),
    'network': BitcoinNetwork,
  });
  
  return IDL.Service({
    'get_p2pkh_address': IDL.Func([], [BitcoinAddress], []),
    'get_user_address': IDL.Func([IDL.Principal], [BitcoinAddress], []),
    'get_balance': IDL.Func([BitcoinAddress], [Satoshi], ['query']),
    'get_utxos': IDL.Func([BitcoinAddress], [GetUtxosResponse], ['query']),
    'get_transaction': IDL.Func([IDL.Text], [BitcoinTransaction], ['query']),
    'send_transaction': IDL.Func([SendTransactionRequest], [IDL.Text], []),
    'get_fee_percentiles': IDL.Func([], [IDL.Vec(MillisatoshiPerByte)], ['query']),
    'get_network': IDL.Func([], [BitcoinNetwork], ['query']),
  });
};
