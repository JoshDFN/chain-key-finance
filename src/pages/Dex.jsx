import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useDex } from '../contexts/DexContext';

function Dex() {
  const { isConnected } = useWallet();
  const { pairs = [], orders = [], userBalances = {}, orderBook = null, volatility = 0.02, loading, error, placeOrder, fillOrder, fetchUserBalances } = useDex();
  const [selectedPair, setSelectedPair] = useState('ckBTC-ICP');
  const [orderType, setOrderType] = useState('buy');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [orderTab, setOrderTab] = useState('market');

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!price || !amount) return;
    
    await placeOrder(selectedPair, orderType, parseFloat(price), parseFloat(amount));
    
    // Reset form
    setPrice('');
    setAmount('');
  };

  const calculateSpread = () => {
    // Calculate spread based on volatility
    return volatility < 0.01 ? 0.01 : 0.04; // 1% or 4%
  };

  const formatNumber = (num, decimals = 2) => {
    return parseFloat(num).toFixed(decimals);
  };

  // Parse pair data
  const parsePairData = (pairId) => {
    if (!pairId) return { base: '', quote: '' };
    const parts = pairId.split('-');
    return {
      id: pairId,
      base: parts[0],
      quote: parts[1],
      price: getPairPrice(pairId),
      change24h: getPairChange(pairId)
    };
  };
  
  // Get pair price (from order book or estimate)
  const getPairPrice = (pairId) => {
    if (orderBook && selectedPair === pairId) {
      return orderBook.lastPrice || estimatePairPrice(pairId);
    }
    return estimatePairPrice(pairId);
  };
  
  // Estimate pair price based on token values
  const estimatePairPrice = (pairId) => {
    const parts = pairId.split('-');
    const base = parts[0];
    const quote = parts[1];
    
    // Estimated prices in USD
    const prices = {
      'ckBTC': 68500,
      'ckETH': 3200,
      'ckUSDC': 1,
      'ICP': 22
    };
    
    return prices[base] / prices[quote];
  };
  
  // Get 24h change (random for now, would be from API in production)
  const getPairChange = (pairId) => {
    // Use a deterministic "random" based on the pair ID
    const hash = pairId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return (hash % 10) / 2 - 2.5; // Range from -2.5 to 2.5
  };

  const getActivePair = () => {
    // Use the actual pair if available
    if (selectedPair) {
      return parsePairData(selectedPair);
    }
    
    // Default to first pair
    if (pairs.length > 0) {
      return parsePairData(pairs[0]);
    }
    
    // Fallback
    return parsePairData('ckBTC-ICP');
  };

  const getPairOrders = () => {
    // Use the actual orders
    return orders.filter(order => order.pair === selectedPair);
  };

  const getBaseBalance = () => {
    const pair = getActivePair();
    // Use the actual balance if available
    return userBalances[pair?.base] || 0;
  };

  const getQuoteBalance = () => {
    const pair = getActivePair();
    // Use the actual balance if available
    return userBalances[pair?.quote] || 0;
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-yellow-700">
            Please connect your wallet to start trading on the Chain Fusion DEX.
          </p>
        </div>
      </div>
    );
  }

  const activePair = getActivePair();
  const pairOrders = getPairOrders();
  const baseBalance = getBaseBalance();
  const quoteBalance = getQuoteBalance();
  const spread = calculateSpread();

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Market Overview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Market Overview</h2>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">Volatility:</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    volatility < 0.01 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {(volatility * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pair</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">24h Change</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Spread</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {/* Display pairs */}
                    {pairs.length > 0 ? pairs.map((pairId) => {
                      const pair = parsePairData(pairId);
                      return (
                      <tr 
                        key={pairId} 
                        className={`hover:bg-gray-50 cursor-pointer ${pairId === selectedPair ? 'bg-gray-50' : ''}`}
                        onClick={() => setSelectedPair(pairId)}
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="font-medium">{pair.base}/{pair.quote}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right font-medium">
                          {formatNumber(pair.price)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <span className={`${pair.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {pair.change24h >= 0 ? '+' : ''}{formatNumber(pair.change24h)}%
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          {(spread * 100).toFixed(1)}%
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <button 
                            className="text-blue-600 hover:text-blue-800 font-medium"
                            onClick={() => setSelectedPair(pairId)}
                          >
                            Trade
                          </button>
                        </td>
                      </tr>
                    );
                    }) : (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                          Loading trading pairs...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Order Book */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Order Book</h2>
              
              {pairOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {pairOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              order.type === 'buy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {order.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right font-medium">
                            {formatNumber(order.price)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right">
                            {formatNumber(order.amount)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right">
                            {formatNumber(order.total)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right">
                            <button 
                              className="text-blue-600 hover:text-blue-800 font-medium"
                              onClick={() => fillOrder(order.id)}
                              disabled={loading}
                            >
                              {loading ? 'Processing...' : 'Fill'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No orders for this pair yet. Be the first to place an order!
                </div>
              )}
            </div>
          </div>
          
          {/* Trading Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{activePair?.base}/{activePair?.quote}</h2>
                <div className="text-lg font-bold">{formatNumber(activePair?.price)}</div>
              </div>
              
              <div className="flex border-b border-gray-200 mb-4">
                <button 
                  className={`py-2 px-4 font-medium ${orderTab === 'market' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                  onClick={() => setOrderTab('market')}
                >
                  Market
                </button>
                <button 
                  className={`py-2 px-4 font-medium ${orderTab === 'limit' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                  onClick={() => setOrderTab('limit')}
                >
                  Limit
                </button>
              </div>
              
              <div className="flex mb-4">
                <button 
                  className={`flex-1 py-2 rounded-l-lg font-medium ${orderType === 'buy' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'}`}
                  onClick={() => setOrderType('buy')}
                >
                  Buy
                </button>
                <button 
                  className={`flex-1 py-2 rounded-r-lg font-medium ${orderType === 'sell' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-500'}`}
                  onClick={() => setOrderType('sell')}
                >
                  Sell
                </button>
              </div>
              
              <form onSubmit={handlePlaceOrder}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price ({activePair?.quote})
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                      min="0"
                      step="0.01"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                      {activePair?.quote}
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount ({activePair?.base})
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      min="0"
                      step="0.001"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                      {activePair?.base}
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total ({activePair?.quote})
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                      placeholder="0.00"
                      value={price && amount ? (parseFloat(price) * parseFloat(amount)).toFixed(2) : ''}
                      readOnly
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                      {activePair?.quote}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between text-sm text-gray-500 mb-4">
                  <span>Spread:</span>
                  <span>{(spread * 100).toFixed(1)}%</span>
                </div>
                
                <div className="flex justify-between text-sm text-gray-500 mb-4">
                  <span>Available:</span>
                  <span>
                    {orderType === 'buy' 
                      ? `${formatNumber(quoteBalance)} ${activePair?.quote}`
                      : `${formatNumber(baseBalance)} ${activePair?.base}`
                    }
                  </span>
                </div>
                
                <button
                  type="submit"
                  className={`w-full py-3 rounded-lg font-medium ${
                    orderType === 'buy' 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : `${orderType === 'buy' ? 'Buy' : 'Sell'} ${activePair?.base}`}
                </button>
              </form>
              
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Your Balances</h2>
              
              <div className="space-y-3">
                {Object.entries(userBalances).map(([token, balance]) => (
                  <div key={token} className="flex justify-between items-center">
                    <span className="font-medium">{token}</span>
                    <span>{formatNumber(balance, token.includes('BTC') ? 8 : token.includes('ETH') ? 6 : 2)}</span>
                  </div>
                ))}
              </div>
              
              {/* Balances section */}
              <div className="mt-6">
                <button 
                  onClick={fetchUserBalances}
                  className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg mb-4 flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                  Refresh Balances
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dex;
