import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface CkUSDC {
  'allowance' : ActorMethod<[Principal, Principal], bigint>,
  'approve' : ActorMethod<[Principal, bigint], Result>,
  'balanceOf' : ActorMethod<[Principal], bigint>,
  'blacklist' : ActorMethod<[Principal], Result>,
  'burn' : ActorMethod<[Principal, bigint], Result>,
  'decimals' : ActorMethod<[], number>,
  'mint' : ActorMethod<[Principal, bigint], Result>,
  'name' : ActorMethod<[], string>,
  'owner' : ActorMethod<[], Principal>,
  'pause' : ActorMethod<[], Result>,
  'symbol' : ActorMethod<[], string>,
  'totalSupply' : ActorMethod<[], bigint>,
  'transfer' : ActorMethod<[Principal, bigint], Result>,
  'transferFrom' : ActorMethod<[Principal, Principal, bigint], Result>,
  'unblacklist' : ActorMethod<[Principal], Result>,
  'unpause' : ActorMethod<[], Result>,
}
export type Result = { 'ok' : null } |
  { 'err' : string };
export interface _SERVICE extends CkUSDC {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
