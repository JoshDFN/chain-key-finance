export const idlFactory = ({ IDL }) => {
  const Result = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const CkUSDC = IDL.Service({
    'allowance' : IDL.Func(
        [IDL.Principal, IDL.Principal],
        [IDL.Nat],
        ['query'],
      ),
    'approve' : IDL.Func([IDL.Principal, IDL.Nat], [Result], []),
    'balanceOf' : IDL.Func([IDL.Principal], [IDL.Nat], ['query']),
    'blacklist' : IDL.Func([IDL.Principal], [Result], []),
    'burn' : IDL.Func([IDL.Principal, IDL.Nat], [Result], []),
    'decimals' : IDL.Func([], [IDL.Nat8], ['query']),
    'mint' : IDL.Func([IDL.Principal, IDL.Nat], [Result], []),
    'name' : IDL.Func([], [IDL.Text], ['query']),
    'owner' : IDL.Func([], [IDL.Principal], ['query']),
    'pause' : IDL.Func([], [Result], []),
    'symbol' : IDL.Func([], [IDL.Text], ['query']),
    'totalSupply' : IDL.Func([], [IDL.Nat], ['query']),
    'transfer' : IDL.Func([IDL.Principal, IDL.Nat], [Result], []),
    'transferFrom' : IDL.Func(
        [IDL.Principal, IDL.Principal, IDL.Nat],
        [Result],
        [],
      ),
    'unblacklist' : IDL.Func([IDL.Principal], [Result], []),
    'unpause' : IDL.Func([], [Result], []),
  });
  return CkUSDC;
};
export const init = ({ IDL }) => { return []; };
