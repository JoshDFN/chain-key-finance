export const idlFactory = ({ IDL }) => {
  const EthereumNetwork = IDL.Variant({
    'mainnet': IDL.Null,
    'sepolia': IDL.Null,
  });
  const EthereumAddress = IDL.Text;
  const Wei = IDL.Nat;
  const EthereumTransaction = IDL.Record({
    'hash': IDL.Text,
    'from': EthereumAddress,
    'to': EthereumAddress,
    'value': Wei,
    'gas_used': IDL.Nat,
    'gas_price': Wei,
    'block_number': IDL.Nat,
    'block_hash': IDL.Text,
    'confirmations': IDL.Nat32,
    'status': IDL.Bool,
  });
  const ERC20Token = IDL.Record({
    'address': EthereumAddress,
    'name': IDL.Text,
    'symbol': IDL.Text,
    'decimals': IDL.Nat8,
  });
  const ERC20Balance = IDL.Record({
    'token': ERC20Token,
    'balance': Wei,
  });
  const SendTransactionRequest = IDL.Record({
    'to': EthereumAddress,
    'value': Wei,
    'data': IDL.Opt(IDL.Vec(IDL.Nat8)),
    'gas_limit': IDL.Nat,
  });
  const CallRequest = IDL.Record({
    'to': EthereumAddress,
    'data': IDL.Vec(IDL.Nat8),
  });
  
  return IDL.Service({
    'get_address': IDL.Func([], [EthereumAddress], []),
    'get_user_address': IDL.Func([IDL.Principal], [EthereumAddress], []),
    'get_balance': IDL.Func([EthereumAddress], [Wei], ['query']),
    'get_erc20_balance': IDL.Func([EthereumAddress, EthereumAddress], [Wei], ['query']),
    'get_transaction': IDL.Func([IDL.Text], [EthereumTransaction], ['query']),
    'send_transaction': IDL.Func([SendTransactionRequest], [IDL.Text], []),
    'call': IDL.Func([CallRequest], [IDL.Vec(IDL.Nat8)], ['query']),
    'get_gas_price': IDL.Func([], [Wei], ['query']),
    'get_network': IDL.Func([], [EthereumNetwork], ['query']),
    'get_block_number': IDL.Func([], [IDL.Nat], ['query']),
  });
};
