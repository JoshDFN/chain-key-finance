import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useWallet } from './WalletContext';
import { createActor as createDexActor } from '../declarations/dex';
import { createActor as createCkBTCActor } from '../declarations/ckBTC';
import { createActor as createCkETHActor } from '../declarations/ckETH';
import { createActor as createCkUSDCActor } from '../declarations/ckUSDC';
import { CANISTER_IDS } from '../config/canisterIds';

const DexContext = createContext({
  pairs: [],
  selectedPair: null,
  orderBook: null,
  userOrders: [],
  userBalances: {},
  volatility: 0,
  spread: 0,
  loading: false,
  error: null,
  selectPair: () => {},
  fetchOrderBook: () => {},
  fetchUserOrders: () => {},
  fetchUserBalances: () => {},
  placeOrder: () => {},
  cancelOrder: () => {},
});

export function DexProvider({ children }) {
  const { isConnected, agent, principal } = useWallet();
  const [dexActor, setDexActor] = useState(null);
  const [tokenActors, setTokenActors] = useState({});
  const [pairs, setPairs] = useState([]);
  const [selectedPair, setSelectedPair] = useState(null);
  const [orderBook, setOrderBook] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [userBalances, setUserBalances] = useState({});
  const [volatility, setVolatility] = useState(0);
  const [spread, setSpread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize the actors when the wallet is connected
  useEffect(() => {
    if (isConnected && agent) {
      try {
        // Create DEX actor
        const dexActor = createDexActor(CANISTER_IDS.dex, { agent });
        setDexActor(dexActor);
        console.log("DEX actor created successfully with canister ID:", CANISTER_IDS.dex);
        
        // Create token actors
        const ckBTCActor = createCkBTCActor(CANISTER_IDS.ckBTC, { agent });
        const ckETHActor = createCkETHActor(CANISTER_IDS.ckETH, { agent });
        const ckUSDCActor = createCkUSDCActor(CANISTER_IDS.ckUSDC, { agent });
        
        setTokenActors({
          ckBTC: ckBTCActor,
          ckETH: ckETHActor,
          ckUSDC: ckUSDCActor,
          ICP: null // ICP balance is handled differently
        });
        
        console.log("Token actors created successfully");
      } catch (err) {
        console.error('Failed to create actors:', err);
      }
    } else {
      setDexActor(null);
      setTokenActors({});
    }
  }, [isConnected, agent]);

  // Fetch supported pairs when the DEX actor is initialized
  useEffect(() => {
    if (dexActor) {
      fetchSupportedPairs();
    }
  }, [dexActor]);

  // Fetch order book when the selected pair changes
  useEffect(() => {
    if (dexActor && selectedPair) {
      fetchOrderBook(selectedPair);
    }
  }, [dexActor, selectedPair]);

  // Fetch user data when the principal changes
  useEffect(() => {
    if (dexActor && principal) {
      fetchUserOrders();
      fetchUserBalances();
    }
  }, [dexActor, principal, tokenActors]);

  const fetchSupportedPairs = useCallback(async () => {
    if (!dexActor) return;

    try {
      setLoading(true);
      setError(null);

      const supportedPairs = await dexActor.getSupportedPairs();
      setPairs(supportedPairs);

      if (supportedPairs.length > 0 && !selectedPair) {
        setSelectedPair(supportedPairs[0]);
      }
    } catch (err) {
      console.error('Failed to fetch supported pairs:', err);
      setError('Failed to fetch supported pairs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [dexActor, selectedPair]);

  const selectPair = useCallback((pair) => {
    setSelectedPair(pair);
  }, []);

  const fetchOrderBook = useCallback(async (pair) => {
    if (!dexActor) return;

    try {
      setLoading(true);
      setError(null);

      const orderBookData = await dexActor.getOrderBook(pair);
      setOrderBook(orderBookData);
      setVolatility(orderBookData.volatility);
      setSpread(orderBookData.spread);
    } catch (err) {
      console.error('Failed to fetch order book:', err);
      setError('Failed to fetch order book. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [dexActor]);

  // Fetch user balances
  const fetchUserBalances = useCallback(async () => {
    if (!principal || Object.keys(tokenActors).length === 0) return;

    try {
      setLoading(true);
      setError(null);

      const balances = {};
      
      // Fetch ckBTC balance
      if (tokenActors.ckBTC) {
        try {
          const ckBTCBalance = await tokenActors.ckBTC.balanceOf(principal);
          balances.ckBTC = Number(ckBTCBalance);
        } catch (err) {
          console.error('Failed to fetch ckBTC balance:', err);
        }
      }
      
      // Fetch ckETH balance
      if (tokenActors.ckETH) {
        try {
          const ckETHBalance = await tokenActors.ckETH.balanceOf(principal);
          balances.ckETH = Number(ckETHBalance);
        } catch (err) {
          console.error('Failed to fetch ckETH balance:', err);
        }
      }
      
      // Fetch ckUSDC balance
      if (tokenActors.ckUSDC) {
        try {
          const ckUSDCBalance = await tokenActors.ckUSDC.balanceOf(principal);
          balances.ckUSDC = Number(ckUSDCBalance);
        } catch (err) {
          console.error('Failed to fetch ckUSDC balance:', err);
        }
      }
      
      // For ICP, we would need to use the ledger canister
      // This is a placeholder for now
      balances.ICP = 1000;
      
      setUserBalances(balances);
    } catch (err) {
      console.error('Failed to fetch user balances:', err);
      setError('Failed to fetch user balances. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [principal, tokenActors]);

  // Fetch user orders
  const fetchUserOrders = useCallback(async () => {
    if (!dexActor || !principal) return;

    try {
      setLoading(true);
      setError(null);

      const orders = await dexActor.getUserOrders(principal);
      setUserOrders(orders);
    } catch (err) {
      console.error('Failed to fetch user orders:', err);
      setError('Failed to fetch user orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [dexActor, principal]);

  const placeOrder = useCallback(async (pair, orderType, price, amount) => {
    if (!dexActor) return;

    try {
      setLoading(true);
      setError(null);

      // Convert string orderType to variant format
      const orderTypeVariant = orderType === 'buy' ? { buy: null } : { sell: null };
      
      console.log("Placing order with params:", {
        pair,
        orderType: orderTypeVariant,
        price,
        amount
      });

      const orderId = await dexActor.placeOrder(pair, orderTypeVariant, price, amount);
      
      // Refresh order book and user orders
      await fetchOrderBook(pair);
      await fetchUserOrders();

      return orderId;
    } catch (err) {
      console.error('Failed to place order:', err);
      setError('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [dexActor, fetchOrderBook, fetchUserOrders]);

  const cancelOrder = useCallback(async (orderId) => {
    if (!dexActor) return;

    try {
      setLoading(true);
      setError(null);

      const success = await dexActor.cancelOrder(orderId);
      
      if (success) {
        // Refresh order book and user orders
        if (selectedPair) {
          await fetchOrderBook(selectedPair);
        }
        await fetchUserOrders();
      }

      return success;
    } catch (err) {
      console.error('Failed to cancel order:', err);
      setError('Failed to cancel order. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [dexActor, selectedPair, fetchOrderBook, fetchUserOrders]);

  const value = {
    pairs,
    selectedPair,
    orderBook,
    userOrders,
    userBalances,
    volatility,
    spread,
    loading,
    error,
    selectPair,
    fetchOrderBook,
    fetchUserOrders,
    fetchUserBalances,
    placeOrder,
    cancelOrder,
  };

  return (
    <DexContext.Provider value={value}>
      {children}
    </DexContext.Provider>
  );
}

export function useDex() {
  const context = useContext(DexContext);
  if (!context) {
    throw new Error('useDex must be used within a DexProvider');
  }
  return context;
}
