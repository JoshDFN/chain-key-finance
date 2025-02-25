import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { HttpAgent } from '@dfinity/agent';

const WalletContext = createContext({
  isConnected: false,
  loading: false,
  error: null,
  principal: null,
  agent: null,
  connect: () => {},
  disconnect: () => {}
});

// Configure host based on environment
const host = process.env.DFX_NETWORK === 'ic' 
  ? 'https://ic0.app' 
  : `http://localhost:8000`;

// Internet Identity canister ID
const II_CANISTER_ID = process.env.INTERNET_IDENTITY_CANISTER_ID;

export function WalletProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [principal, setPrincipal] = useState(null);
  const [agent, setAgent] = useState(null);
  const [authClient, setAuthClient] = useState(null);

  // Initialize auth client
  useEffect(() => {
    AuthClient.create().then(client => {
      setAuthClient(client);
      
      // Check if user is already authenticated
      if (client.isAuthenticated()) {
        handleAuthenticated(client);
      }
    }).catch(err => {
      console.error('Failed to create auth client:', err);
      setError('Failed to initialize authentication. Please try again.');
    });
  }, []);

  const handleAuthenticated = async (client) => {
    try {
      const identity = client.getIdentity();
      const principal = identity.getPrincipal();
      
      // Create an agent for interacting with the IC
      const newAgent = new HttpAgent({ identity, host });
      
      // Fetch the root key for local development
      if (process.env.DFX_NETWORK !== 'ic') {
        await newAgent.fetchRootKey();
      }
      
      setPrincipal(principal);
      setAgent(newAgent);
      setIsConnected(true);
      setError(null);
    } catch (err) {
      console.error('Error handling authentication:', err);
      setError('Authentication error. Please try again.');
      setIsConnected(false);
    }
  };

  const connect = useCallback(async () => {
    if (!authClient) return;

    try {
      setLoading(true);
      setError(null);

      // Authenticate with Internet Identity
      await authClient.login({
        identityProvider: process.env.DFX_NETWORK === 'ic'
          ? 'https://identity.ic0.app'
          : `http://${II_CANISTER_ID}.localhost:8000`,
        onSuccess: () => handleAuthenticated(authClient),
        onError: (err) => {
          console.error('Login error:', err);
          setError('Failed to connect wallet. Please try again.');
          setLoading(false);
        }
      });
    } catch (err) {
      console.error('Failed to connect wallet:', err);
      setError('Failed to connect wallet. Please try again.');
      setIsConnected(false);
      setLoading(false);
    }
  }, [authClient]);

  const disconnect = useCallback(async () => {
    if (!authClient) return;

    try {
      setLoading(true);
      setError(null);
      
      await authClient.logout();
      
      setPrincipal(null);
      setAgent(null);
      setIsConnected(false);
    } catch (err) {
      console.error('Failed to disconnect wallet:', err);
      setError('Failed to disconnect wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [authClient]);

  const value = {
    isConnected,
    loading,
    error,
    principal,
    agent,
    connect,
    disconnect
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
