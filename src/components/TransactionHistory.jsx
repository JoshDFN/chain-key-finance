import React, { useState } from 'react';
import { useIsoDapp } from '../contexts/IsoDappContext';

/**
 * TransactionHistory component displays a list of user transactions
 * with filtering and sorting options.
 */
function TransactionHistory() {
  const { transactionHistory, selectedAsset } = useIsoDapp();
  const [filter, setFilter] = useState('all'); // 'all', 'deposit', 'mint'
  const [sortBy, setSortBy] = useState('date'); // 'date', 'amount'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  // Format amount based on asset
  const formatAmount = (amount, asset) => {
    if (!amount) return '0';
    
    if (asset === 'BTC') {
      return (amount / 100000000).toFixed(8) + ' BTC';
    } else if (asset === 'ETH') {
      return (amount / 1000000000000000000).toFixed(6) + ' ETH';
    } else if (asset === 'USDC-ETH') {
      return (amount / 1000000).toFixed(2) + ' USDC';
    }
    return amount.toString();
  };
  
  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'detecting':
        return 'bg-blue-100 text-blue-800';
      case 'confirming':
        return 'bg-purple-100 text-purple-800';
      case 'ready':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Filter transactions
  const filteredTransactions = transactionHistory.filter(tx => {
    if (filter === 'all') return true;
    return tx.type === filter;
  });
  
  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    } else if (sortBy === 'amount') {
      return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
    }
    return 0;
  });
  
  // Handle sort change
  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          className={`px-3 py-1 rounded-full text-sm ${filter === 'all' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`px-3 py-1 rounded-full text-sm ${filter === 'deposit' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => setFilter('deposit')}
        >
          Deposits
        </button>
        <button
          className={`px-3 py-1 rounded-full text-sm ${filter === 'mint' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => setFilter('mint')}
        >
          Mints
        </button>
      </div>
      
      {/* Transaction list */}
      {sortedTransactions.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-2 text-left text-sm font-medium text-gray-500">Type</th>
                <th className="py-2 text-left text-sm font-medium text-gray-500">Asset</th>
                <th 
                  className="py-2 text-left text-sm font-medium text-gray-500 cursor-pointer"
                  onClick={() => handleSortChange('amount')}
                >
                  Amount
                  {sortBy === 'amount' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="py-2 text-left text-sm font-medium text-gray-500 cursor-pointer"
                  onClick={() => handleSortChange('date')}
                >
                  Date
                  {sortBy === 'date' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th className="py-2 text-left text-sm font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.map((tx) => (
                <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 text-sm capitalize">{tx.type}</td>
                  <td className="py-3 text-sm">{tx.asset}</td>
                  <td className="py-3 text-sm">
                    {formatAmount(tx.amount, tx.asset)}
                  </td>
                  <td className="py-3 text-sm text-gray-500">
                    {formatDate(tx.timestamp)}
                  </td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeClass(tx.status)}`}>
                      {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No transactions found.
        </div>
      )}
    </div>
  );
}

export default TransactionHistory;
