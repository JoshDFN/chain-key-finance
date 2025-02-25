import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Dex {
  'cancelOrder' : ActorMethod<[OrderId], Result>,
  'fillOrder' : ActorMethod<[OrderId], Result>,
  'getAllOrders' : ActorMethod<[], Array<Order>>,
  'getMinimumSpread' : ActorMethod<[], bigint>,
  'getOrder' : ActorMethod<[OrderId], [] | [Order]>,
  'getUserOrders' : ActorMethod<[Principal], Array<Order>>,
  'getVolatility' : ActorMethod<[], bigint>,
  'placeOrder' : ActorMethod<
    [TokenPair, boolean, bigint, bigint, bigint],
    Result_1
  >,
  'updateVolatility' : ActorMethod<[bigint], Result>,
}
export interface Order {
  'id' : OrderId,
  'owner' : Principal,
  'pair' : TokenPair,
  'timestamp' : bigint,
  'isBuy' : boolean,
  'spread' : bigint,
  'price' : bigint,
  'amount' : bigint,
}
export type OrderId = bigint;
export type Result = { 'ok' : null } |
  { 'err' : string };
export type Result_1 = { 'ok' : OrderId } |
  { 'err' : string };
export interface TokenPair { 'base' : string, 'quote' : string }
export interface _SERVICE extends Dex {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
