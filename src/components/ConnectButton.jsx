import React from 'react';
import { useWallet } from '../contexts/WalletContext';

function ConnectButton() {
  const { isConnected, loading, connect, disconnect, principal } = useWallet();

  const handleClick = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  };

  const formatPrincipal = (principal) => {
    if (!principal) return '';
    const str = principal.toString();
    return str.length > 10 ? `${str.slice(0, 5)}...${str.slice(-5)}` : str;
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
        isConnected
          ? 'bg-green-600 text-white hover:bg-green-700'
          : 'bg-black text-white hover:bg-gray-900'
      }`}
    >
      {loading ? (
        <div className="flex gap-2">
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse delay-100"></div>
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse delay-200"></div>
        </div>
      ) : isConnected ? (
        <div className="flex items-center">
          <span className="mr-1">ID:</span>
          <span>{formatPrincipal(principal)}</span>
        </div>
      ) : (
        'Connect Wallet'
      )}
    </button>
  );
}

export default ConnectButton;
