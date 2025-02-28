export const idlFactory = ({ IDL }) => {
  const Asset = IDL.Text;
  const DepositAddress = IDL.Text;
  const TxHash = IDL.Text;
  
  // Define RoundStatus variant
  const RoundStatus = IDL.Variant({
    'upcoming': IDL.Null,
    'active': IDL.Null,
    'processing': IDL.Null,
    'completed': IDL.Null,
  });
  
  // Define SaleRoundConfig record
  const SaleRoundConfig = IDL.Record({
    'minPrice': IDL.Float64,
    'maxPrice': IDL.Float64,
    'shareSellTarget': IDL.Nat,
    'startDate': IDL.Int,
    'endDate': IDL.Int,
  });
  
  // Define SaleRound record
  const SaleRound = IDL.Record({
    'id': IDL.Nat,
    'minPrice': IDL.Float64,
    'maxPrice': IDL.Float64,
    'shareSellTarget': IDL.Nat,
    'startDate': IDL.Int,
    'endDate': IDL.Int,
    'status': RoundStatus,
    'finalPrice': IDL.Opt(IDL.Float64),
    'totalSharesSold': IDL.Nat,
    'totalFundsRaised': IDL.Float64,
  });
  
  return IDL.Service({
    'getEthereumAddress': IDL.Func([], [IDL.Text], []),
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
    // Round Management Functions
    'createSaleRound': IDL.Func(
      [SaleRoundConfig],
      [
        IDL.Record({
          'roundId': IDL.Nat,
          'status': IDL.Text,
        }),
      ],
      [],
    ),
    'updateRoundStatus': IDL.Func(
      [IDL.Nat, RoundStatus],
      [
        IDL.Record({
          'success': IDL.Bool,
          'message': IDL.Text,
        }),
      ],
      [],
    ),
    'transitionToNextRound': IDL.Func(
      [],
      [
        IDL.Record({
          'success': IDL.Bool,
          'message': IDL.Text,
          'nextRoundId': IDL.Opt(IDL.Nat),
        }),
      ],
      [],
    ),
    'calculateOptimalPrice': IDL.Func(
      [IDL.Nat],
      [
        IDL.Record({
          'success': IDL.Bool,
          'message': IDL.Text,
          'price': IDL.Opt(IDL.Float64),
        }),
      ],
      [],
    ),
    'finalizeRound': IDL.Func(
      [IDL.Nat, IDL.Float64],
      [
        IDL.Record({
          'success': IDL.Bool,
          'message': IDL.Text,
        }),
      ],
      [],
    ),
    // Round Query Functions
    'getCurrentRound': IDL.Func(
      [],
      [IDL.Opt(SaleRound)],
      ['query'],
    ),
    'getSaleRound': IDL.Func(
      [IDL.Nat],
      [IDL.Opt(SaleRound)],
      ['query'],
    ),
    'getAllSaleRounds': IDL.Func(
      [],
      [IDL.Vec(SaleRound)],
      ['query'],
    ),
  });
};

export const init = ({ IDL }) => { return []; };
