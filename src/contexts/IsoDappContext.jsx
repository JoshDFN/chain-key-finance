import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useWallet } from './WalletContext';
import { Actor } from '@dfinity/agent';
import { idlFactory } from '../declarations/iso_dapp/iso_dapp.did.js';
import { createIsoDappActor } from '../declarations/iso_dapp';
import { CANISTER_IDS } from '../config/canisterIds';
import { showDepositStatusNotification, showTransactionHistoryNotification, showPortfolioUpdateNotification } from '../utils/notifications';

const IsoDappContext = createContext({
  depositAddress: null,
  depositAmount: 0,
  depositStatus: null, // null, 'pending', 'detecting', 'confirming', 'ready', 'failed'
  confirmations: 0,
  requiredConfirmations: 0,
  selectedAsset: null,
  availableAssets: [],
  isoDetails: null,
  userContribution: null,
  transactionHistory: [],
  generateDepositAddress: () => {},
  monitorDeposits: () => {},
  checkDepositStatus: () => {},
  mintCkTokens: () => {},
  selectAsset: () => {},
  resetDeposit: () => {},
  getIsoDetails: () => {},
  getUserContribution: () => {},
});

// Available assets
const AVAILABLE_ASSETS = [
  { id: 'BTC', name: 'Bitcoin', symbol: 'BTC', icon: '₿', color: '#F7931A', decimals: 8 },
  { id: 'ETH', name: 'Ethereum', symbol: 'ETH', icon: 'Ξ', color: '#627EEA', decimals: 18 },
  { id: 'USDC-ETH', name: 'USDC (Ethereum)', symbol: 'USDC', icon: '$', color: '#2775CA', decimals: 6 }
];

export function IsoDappProvider({ children }) {
  const { isConnected, agent, principal } = useWallet();
  const [depositAddress, setDepositAddress] = useState(null);
  const [depositAmount, setDepositAmount] = useState(0);
  const [depositStatus, setDepositStatus] = useState(null);
  const [confirmations, setConfirmations] = useState(0);
  const [requiredConfirmations, setRequiredConfirmations] = useState(0);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isoDappActor, setIsoDappActor] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [isoDetails, setIsoDetails] = useState(null);
  const [userContribution, setUserContribution] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transactionHistory, setTransactionHistory] = useState([]);
  
  // Load transaction history from local storage on mount
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('transactionHistory');
      if (storedHistory) {
        setTransactionHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error('Failed to load transaction history from local storage:', e);
    }
  }, []);
  
  // Save transaction history to local storage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('transactionHistory', JSON.stringify(transactionHistory));
    } catch (e) {
      console.error('Failed to save transaction history to local storage:', e);
    }
  }, [transactionHistory]);
  
  // Add a transaction to the history
  const addTransactionToHistory = useCallback((type, asset, amount, txHash, status = 'pending') => {
    const transaction = {
      id: Date.now().toString(),
      type,
      asset,
      amount,
      txHash,
      status,
      timestamp: new Date().toISOString(),
    };
    
    setTransactionHistory(prev => [transaction, ...prev]);
    
    // Show notification
    showTransactionHistoryNotification(type, asset, amount);
    
    return transaction.id;
  }, []);
  
  // Update a transaction in the history
  const updateTransactionInHistory = useCallback((id, updates) => {
    setTransactionHistory(prev => 
      prev.map(tx => tx.id === id ? { ...tx, ...updates } : tx)
    );
  }, []);
  
  // Listen for deposit status change events (for simulation)
  useEffect(() => {
    const handleDepositStatusChange = (event) => {
      const { status, confirmations, required, amount } = event.detail;
      
      setDepositStatus(status);
      setConfirmations(confirmations || 0);
      setRequiredConfirmations(required || 0);
      
      if (amount) {
        setDepositAmount(amount);
      }
      
      // Show notification for status change
      if (selectedAsset && status) {
        showDepositStatusNotification(
          status, 
          selectedAsset.id, 
          confirmations || 0, 
          required || 0, 
          amount || 0
        );
      }
    };
    
    window.addEventListener('deposit-status-change', handleDepositStatusChange);
    
    return () => {
      window.removeEventListener('deposit-status-change', handleDepositStatusChange);
    };
  }, [selectedAsset]);

  // Initialize the ISO Dapp actor when the agent is available
  useEffect(() => {
    if (agent && isConnected) {
      try {
        // Create the ISO Dapp actor with the correct canister ID from config
        const actor = createIsoDappActor(CANISTER_IDS.iso_dapp, {
          agent,
        });
        
        // Add debugging to check what methods are available on the actor
        console.log("ISO Dapp actor methods:", Object.keys(actor));
        
        setIsoDappActor(actor);
        console.log("ISO Dapp actor created successfully with canister ID:", CANISTER_IDS.iso_dapp);
        
        // Force clear all browser storage to start fresh
        try {
          // Clear all localStorage items
          localStorage.clear();
          
          // Also try sessionStorage
          if (sessionStorage) {
            sessionStorage.clear();
          }
          
          // Force reload the page to ensure all cached data is cleared
          if (typeof window !== 'undefined') {
            // Don't reload in development to avoid infinite loops
            if (window.location.hostname !== 'localhost') {
              alert("Clearing cached data. Page will reload to ensure clean state.");
              window.location.reload(true);
            }
          }
          
          console.log("Cleared ALL browser storage and forced page reload");
        } catch (e) {
          console.error('Failed to clear browser storage:', e);
        }
        
        // Get ISO details
        getIsoDetails();
      } catch (err) {
        console.error('Failed to create ISO Dapp actor:', err);
      }
    } else {
      setIsoDappActor(null);
    }
  }, [agent, isConnected]);

  // Generate a deposit address for the selected asset
  const generateDepositAddress = useCallback(async (assetId) => {
    if (!isoDappActor) return;

    try {
      setLoading(true);
      setError(null);
      setDepositStatus('pending');
      
      // Find the asset in the available assets
      const asset = AVAILABLE_ASSETS.find(a => a.id === assetId);
      if (asset) {
        setSelectedAsset(asset);
      }
      
      console.log(`Calling generateDepositAddress on canister for asset ${assetId}...`);
      
      // Always clear any cached address for this asset first
      try {
        const addresses = JSON.parse(localStorage.getItem('depositAddresses') || '{}');
        if (addresses[assetId]) {
          console.log(`Found cached address for ${assetId}, clearing it: ${addresses[assetId]}`);
          delete addresses[assetId];
          localStorage.setItem('depositAddresses', JSON.stringify(addresses));
        }
      } catch (e) {
        console.error('Failed to clear cached address:', e);
      }
      
      // Call the canister to generate a deposit address
      const address = await isoDappActor.generateDepositAddress(assetId);
      console.log(`Generated new ${assetId} address from canister: ${address}`);
      
      // Store the address in state
      setDepositAddress(address);
      setDepositStatus(null);
      
      // Store the address in local storage for persistence
      try {
        const addresses = JSON.parse(localStorage.getItem('depositAddresses') || '{}');
        addresses[assetId] = address;
        localStorage.setItem('depositAddresses', JSON.stringify(addresses));
        console.log(`Stored new ${assetId} address in localStorage: ${address}`);
      } catch (e) {
        console.error('Failed to store address in local storage:', e);
      }
      
      return address;
    } catch (err) {
      console.error('Failed to generate deposit address:', err);
      setError('Failed to generate deposit address. Please try again.');
      setDepositStatus('failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, [isoDappActor]);

  // Monitor deposits for the selected asset
  const monitorDeposits = useCallback(async (assetId) => {
    if (!isoDappActor) return;

    try {
      setLoading(true);
      setError(null);
      setDepositStatus('detecting');
      
      // Find the asset in the available assets
      const asset = AVAILABLE_ASSETS.find(a => a.id === assetId);
      if (asset) {
        setSelectedAsset(asset);
      }
      
      const hash = await isoDappActor.monitorDeposits(assetId);
      
      if (hash) {
        console.log("Deposit detected with txHash:", hash);
        
        // Make sure hash is a string, not an array
        const hashStr = typeof hash === 'string' ? hash : (Array.isArray(hash) ? hash[0] : hash.toString());
        console.log("Using hashStr:", hashStr);
        
        setTxHash(hashStr);
        
        // Add to transaction history
        addTransactionToHistory('deposit', assetId, 0, hashStr, 'detecting');
        
        // Show notification
        showDepositStatusNotification('detecting', assetId);
        
        // Check deposit status
        const status = await checkDepositStatus(assetId, hashStr);
        return hashStr;
      } else {
        setDepositStatus('detecting');
        return false;
      }
    } catch (err) {
      console.error('Failed to monitor deposits:', err);
      setError('Failed to monitor deposits. Please try again.');
      setDepositStatus('failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, [isoDappActor, addTransactionToHistory]);

  // Check deposit status
  const checkDepositStatus = useCallback(async (assetId, hash) => {
    if (!isoDappActor || !hash) return;

    try {
      setLoading(true);
      setError(null);
      
      const result = await isoDappActor.checkDepositStatus(assetId, hash);
      
      // Update state
      setDepositStatus(result.status);
      setConfirmations(result.confirmations);
      setRequiredConfirmations(result.required);
      setDepositAmount(result.amount);
      
      // Update transaction history
      const existingTx = transactionHistory.find(tx => tx.txHash === hash);
      if (existingTx) {
        updateTransactionInHistory(existingTx.id, {
          status: result.status,
          amount: result.amount,
        });
      }
      
      // Show notification for status change
      showDepositStatusNotification(
        result.status, 
        assetId, 
        result.confirmations, 
        result.required, 
        result.amount
      );
      
      // If deposit is ready, get user contribution
      if (result.status === 'ready') {
        await getUserContribution();
        
        // Update portfolio notification
        const asset = AVAILABLE_ASSETS.find(a => a.id === assetId);
        if (asset) {
          const oldBalance = 0; // In a real app, you'd track the previous balance
          const newBalance = result.amount / Math.pow(10, asset.decimals);
          showPortfolioUpdateNotification(assetId, oldBalance, newBalance);
        }
      }
      
      return result;
    } catch (err) {
      console.error('Failed to check deposit status:', err);
      setError('Failed to check deposit status. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [isoDappActor, transactionHistory, updateTransactionInHistory]);

  // Mint chain-key tokens
  const mintCkTokens = useCallback(async (amount) => {
    if (!isoDappActor || !selectedAsset) return;

    try {
      setLoading(true);
      setError(null);
      setDepositStatus('pending');
      
      const success = await isoDappActor.mintCkToken(selectedAsset.id, amount);
      
      if (success) {
        setDepositAmount(0);
        setDepositStatus(null);
        
        // Add to transaction history
        addTransactionToHistory('mint', selectedAsset.id, amount, null, 'completed');
        
        return true;
      } else {
        setError('Failed to mint tokens. Please try again.');
        return false;
      }
    } catch (err) {
      console.error('Failed to mint ck-tokens:', err);
      setError('Failed to mint ck-tokens. Please try again.');
      setDepositStatus('failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, [isoDappActor, selectedAsset, addTransactionToHistory]);

  // Get ISO details
  const getIsoDetails = useCallback(async () => {
    if (!isoDappActor) return;

    try {
      setLoading(true);
      setError(null);
      
      const details = await isoDappActor.getIsoDetails();
      setIsoDetails(details);
      
      return details;
    } catch (err) {
      console.error('Failed to get ISO details:', err);
      setError('Failed to get ISO details. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [isoDappActor]);

  // Get user contribution
  const getUserContribution = useCallback(async () => {
    if (!isoDappActor) return;

    try {
      setLoading(true);
      setError(null);
      
      const contribution = await isoDappActor.getUserContribution();
      setUserContribution(contribution);
      
      return contribution;
    } catch (err) {
      console.error('Failed to get user contribution:', err);
      setError('Failed to get user contribution. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [isoDappActor]);

  // Select an asset
  const selectAsset = useCallback((asset) => {
    setSelectedAsset(asset);
    setDepositAddress(null);
    setDepositAmount(0);
    setDepositStatus(null);
    setConfirmations(0);
    setRequiredConfirmations(0);
    setTxHash(null);
  }, []);

  // Reset the deposit state
  const resetDeposit = useCallback(() => {
    setDepositAddress(null);
    setDepositAmount(0);
    setDepositStatus(null);
    setConfirmations(0);
    setRequiredConfirmations(0);
    setTxHash(null);
  }, []);

  // Poll for deposit status updates
  useEffect(() => {
    if (!isoDappActor || !txHash || !selectedAsset || depositStatus === 'ready') return;
    
    const interval = setInterval(async () => {
      await checkDepositStatus(selectedAsset.id, txHash);
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, [isoDappActor, txHash, selectedAsset, depositStatus, checkDepositStatus]);

  const value = {
    depositAddress,
    depositAmount,
    depositStatus,
    confirmations,
    requiredConfirmations,
    selectedAsset,
    availableAssets: AVAILABLE_ASSETS,
    isoDetails,
    userContribution,
    transactionHistory,
    loading,
    error,
    isoDappActor, // Add isoDappActor to the context value
    generateDepositAddress,
    monitorDeposits,
    checkDepositStatus,
    mintCkTokens,
    selectAsset,
    resetDeposit,
    getIsoDetails,
    getUserContribution,
    addTransactionToHistory,
    updateTransactionInHistory,
    // Expose state update functions
    setDepositStatus,
    setConfirmations,
    setRequiredConfirmations,
    setDepositAmount,
    setDepositAddress,
    setTxHash,
  };

  return (
    <IsoDappContext.Provider value={value}>
      {children}
    </IsoDappContext.Provider>
  );
}

export function useIsoDapp() {
  const context = useContext(IsoDappContext);
  if (!context) {
    throw new Error('useIsoDapp must be used within an IsoDappProvider');
  }
  return context;
}
