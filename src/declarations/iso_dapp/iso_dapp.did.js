export const idlFactory = ({ IDL }) => {
  const Asset = IDL.Text;
  const DepositAddress = IDL.Text;
  const TxHash = IDL.Text;
  
  return IDL.Service({
    'generateDepositAddress': IDL.Func([Asset], [IDL.Text], []),
    'getDepositAddress': IDL.Func([Asset], [IDL.Opt(IDL.Text)], ['query']),
    'monitorDeposits': IDL.Func([Asset], [IDL.Opt(TxHash)], []),
    'checkDepositStatus': IDL.Func(
      [Asset, TxHash],
      [
        IDL.Record({
          'status': IDL.Text,
          'confirmations': IDL.Nat,
          'required': IDL.Nat,
          'amount': IDL.Nat,
        }),
      ],
      [],
    ),
    'mintCkToken': IDL.Func([Asset, IDL.Nat], [IDL.Bool], []),
    'getIsoDetails': IDL.Func(
      [],
      [
        IDL.Record({
          'startDate': IDL.Int,
          'endDate': IDL.Int,
          'minContribution': IDL.Vec(IDL.Tuple(Asset, IDL.Nat)),
          'maxContribution': IDL.Vec(IDL.Tuple(Asset, IDL.Nat)),
        }),
      ],
      ['query'],
    ),
    'getUserContribution': IDL.Func(
      [],
      [
        IDL.Record({
          'deposits': IDL.Vec(IDL.Tuple(Asset, IDL.Nat)),
          'totalValue': IDL.Nat,
          'estimatedAllocation': IDL.Nat,
        }),
      ],
      ['query'],
    ),
    'simulateDeposit': IDL.Func([Asset], [IDL.Text], []),
  });
};

export const init = ({ IDL }) => { return []; };
