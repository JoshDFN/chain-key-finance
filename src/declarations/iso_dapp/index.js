import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from './iso_dapp.did.js';
import { NETWORK } from '../../config/canisterIds';

export const createIsoDappActor = (canisterId, options = {}) => {
  const agent = options.agent || new HttpAgent({ 
    host: NETWORK === 'ic' ? 'https://ic0.app' : 'http://localhost:8000',
    ...options.agentOptions 
  });
  
  if (options.agent && options.agentOptions) {
    console.warn(
      'Detected both agent and agentOptions passed to createActor. Ignoring agentOptions and using the provided agent.'
    );
  }
  
  // Fetch root key for certificate validation during development
  if (NETWORK !== 'ic') {
    agent.fetchRootKey().catch(err => {
      console.warn('Unable to fetch root key. Check to ensure that your local replica is running');
      console.error(err);
    });
  }

  // Creates an actor with using the candid interface and the HttpAgent
  return Actor.createActor(idlFactory, {
    agent,
    canisterId,
    ...options.actorOptions,
  });
};
