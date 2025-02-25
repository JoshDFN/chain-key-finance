import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory } from './dex.did.js';
import { CANISTER_IDS, NETWORK } from '../../config/canisterIds';

export const createActor = (canisterId, options = {}) => {
  const agent = options.agent || new HttpAgent({ 
    host: NETWORK === 'ic' ? 'https://ic0.app' : 'http://localhost:8000',
    ...options.agentOptions 
  });

  if (options.agent && options.agentOptions) {
    console.warn(
      "Detected both agent and agentOptions passed to createActor. Ignoring agentOptions and using the provided agent."
    );
  }

  // Fetch root key for certificate validation during development
  if (NETWORK !== "ic") {
    agent.fetchRootKey().catch((err) => {
      console.warn(
        "Unable to fetch root key. Check to ensure that your local replica is running"
      );
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

// For backwards compatibility with dfx-generated code
export const dex = createActor(CANISTER_IDS.dex);
export const createDexActor = createActor;
