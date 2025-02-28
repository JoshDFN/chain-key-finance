import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useIsoDapp } from '../contexts/IsoDappContext';
import LoadingSpinner from '../components/LoadingSpinner';
import TransactionHistory from '../components/TransactionHistory';
import Portfolio from '../components/Portfolio';

function IsoDapp() {
  const { isConnected } = useWallet();
  const { 
    depositAddress,
    depositAmount,
    depositStatus, 
    confirmations, 
    requiredConfirmations,
    selectedAsset,
    availableAssets,
    isoDetails,
    userContribution,
    loading, 
    error,
    generateDepositAddress,
    monitorDeposits,
    checkDepositStatus,
    setDepositStatus,
    setConfirmations,
    setRequiredConfirmations,
    setDepositAmount
  } = useIsoDapp();
  
  const [step, setStep] = useState(1);
  const [monitoringInterval, setMonitoringInterval] = useState(null);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);

  // Effect to move to step 2 when deposit address is generated
  useEffect(() => {
    if (depositAddress) {
      setStep(2);
    }
  }, [depositAddress]);

  // Effect to move to step 3 when deposit is ready
  useEffect(() => {
    if (depositStatus === 'ready') {
      // Wait a moment to show the success state before moving to step 3
      const timer = setTimeout(() => {
        setStep(3);
        // Show portfolio when deposit is ready
        setShowPortfolio(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [depositStatus]);

  // Format date from nanoseconds
  const formatDate = (nanoseconds) => {
    if (!nanoseconds) return '';
    const date = new Date(Number(nanoseconds) / 1_000_000);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    }) + ' UTC';
  };

  // Calculate days until ISO starts
  const calculateDaysUntil = (nanoseconds) => {
    if (!nanoseconds) return '';
    const now = Date.now();
    const startDate = Number(nanoseconds) / 1_000_000;
    const diffDays = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `${diffDays}d` : 'now';
  };

  // Format amount based on asset decimals
  const formatAmount = (amount, assetId) => {
    if (amount === undefined || amount === null) return '0';
    
    const asset = availableAssets.find(a => a.id === assetId);
    if (!asset) return amount.toString();
    
    // Convert to appropriate decimal places
    const divisor = Math.pow(10, asset.decimals);
    return (amount / divisor).toFixed(asset.decimals === 8 ? 8 : asset.decimals === 18 ? 6 : 2);
  };

  const handleAssetSelect = async (asset) => {
    try {
      // Generate a deposit address for the selected asset
      const address = await generateDepositAddress(asset.id);
      
      console.log("Asset selected:", asset.id, "Address:", address, "Step:", 2);
      
      // If we have a real address, set up monitoring
      if (address && typeof monitorDeposits === 'function') {
        // Clear any existing interval
        if (monitoringInterval) {
          clearInterval(monitoringInterval);
        }
        
        // Set up a new monitoring interval
        const interval = setInterval(async () => {
          try {
            await monitorDeposits(asset.id);
          } catch (err) {
            console.error("Error monitoring deposits:", err);
          }
        }, 10000); // Check every 10 seconds
        
        setMonitoringInterval(interval);
      }
    } catch (err) {
      console.error("Error in handleAssetSelect:", err);
    }
  };

  // Clean up monitoring interval on unmount
  useEffect(() => {
    return () => {
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
      }
    };
  }, [monitoringInterval]);

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-yellow-700">
            Please connect your wallet to start depositing assets and minting chain-key tokens.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Steps Progress */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-500'}`}>
              1
            </div>
            <div className={`flex-1 h-0.5 ${step > 1 ? 'bg-black' : 'bg-gray-200'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-500'}`}>
              2
            </div>
            <div className={`flex-1 h-0.5 ${step > 2 ? 'bg-black' : 'bg-gray-200'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 3 ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-500'}`}>
              3
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Select Asset</span>
            <span>Deposit</span>
            <span>Participate in ISO</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Content Card */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {step === 1 && (
                <>
                  <h2 className="text-xl font-semibold mb-4">Select your deposit asset</h2>
                  <p className="text-gray-500 mb-6">Choose which cryptocurrency you would like to use for Teleport.</p>
                  
                  {availableAssets.map((asset) => (
                    <button
                      key={asset.id}
                      className="w-full flex items-center justify-between p-4 mb-3 border border-gray-200 rounded-lg hover:border-gray-500 transition-colors"
                      onClick={() => handleAssetSelect(asset)}
                      disabled={loading}
                    >
                      <div className="flex items-center">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center mr-3"
                          style={{ 
                            background: `${asset.color}20`, 
                            border: `1px solid ${asset.color}` 
                          }}
                        >
                          {asset.icon}
                        </div>
                        <div>
                          <p className="font-medium">{asset.name}</p>
                          <p className="text-sm text-gray-500">{asset.symbol}</p>
                        </div>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                  ))}
                  
                </>
              )}

              {step === 2 && (
                <>
                  <div className="flex items-center mb-6">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center mr-3"
                      style={{ 
                        background: `${selectedAsset?.color}20`, 
                        border: `1px solid ${selectedAsset?.color}` 
                      }}
                    >
                      {selectedAsset?.icon}
                    </div>
                    <h2 className="text-xl font-semibold">Deposit {selectedAsset?.name}</h2>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4 mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-500">Deposit address</span>
                      <button 
                        className="text-blue-700 text-sm flex items-center"
                        onClick={() => navigator.clipboard.writeText(depositAddress)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        Copy
                      </button>
                    </div>
                    <div className="font-mono text-sm bg-white border border-gray-200 rounded p-2 break-all">
                      {depositAddress}
                    </div>
                  </div>
                  
                  <div className="flex items-start p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-700 mr-3 mt-0.5">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <div>
                      <h3 className="text-sm font-medium text-blue-700 mb-1">Important</h3>
                      <p className="text-sm text-blue-700">
                        Only send {selectedAsset?.name} to this address. Sending any other asset will result in permanent loss.
                      </p>
                    </div>
                  </div>
                  
                  {depositStatus && (
                    <div className="border border-gray-200 rounded-lg p-4 mb-6">
                      <h3 className="font-medium mb-2">Transaction Status</h3>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 mr-2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                          <span className="text-sm text-gray-500">{new Date().toLocaleTimeString()}</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          depositStatus === 'detecting' ? 'bg-yellow-100 text-yellow-700' :
                          depositStatus === 'confirming' ? 'bg-blue-100 text-blue-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {depositStatus.charAt(0).toUpperCase() + depositStatus.slice(1)}
                        </span>
                      </div>
                      
                      {depositStatus === 'confirming' && (
                        <div className="mt-4">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>{confirmations} of {requiredConfirmations} confirmations</span>
                            <span>{Math.round((confirmations / requiredConfirmations) * 100)}%</span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-black transition-all duration-500" 
                              style={{ width: `${(confirmations / requiredConfirmations) * 100}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            {selectedAsset?.name} transactions typically require {requiredConfirmations} confirmations
                          </p>
                        </div>
                      )}
                      
                      {depositStatus === 'ready' && (
                        <div className="mt-4 text-center">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-700">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </div>
                          <h4 className="font-medium mb-1">Deposit Confirmed!</h4>
                          <p className="text-sm text-gray-500 mb-3">Your funds are now ready for Teleport.</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {depositStatus === 'detecting' && (
                    <div className="flex justify-center mt-4">
                      <div className="flex gap-2">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-100"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-200"></div>
                      </div>
                    </div>
                  )}
                  
                  {!depositStatus && (
                    <div>
                      <button
                        onClick={async () => {
                          try {
                            // Try to use the real monitorDeposits function
                            if (selectedAsset?.id) {
                              try {
                                // First, make sure we have a deposit address
                                if (!depositAddress) {
                                  // Generate a deposit address if we don't have one
                                  await generateDepositAddress(selectedAsset.id);
                                }
                                
                                // Now monitor for deposits
                                const txHashResult = await monitorDeposits(selectedAsset.id);
                                if (txHashResult) {
                                  console.log("Deposit detected with txHash:", txHashResult);
                                  
                                  // Check deposit status
                                  try {
                                    // txHashResult should already be a string from the monitorDeposits function
                                    const status = await checkDepositStatus(selectedAsset.id, txHashResult);
                                    console.log("Deposit status:", status);
                                    
                                    // Update UI based on status
                                    if (status) {
                                      // Update the state using the context functions
                                      setDepositStatus(status.status);
                                      setConfirmations(status.confirmations);
                                      setRequiredConfirmations(status.required);
                                      setDepositAmount(status.amount);
                                    }
                                  } catch (statusErr) {
                                    console.error("Failed to check deposit status:", statusErr);
                                  }
                                } else {
                                  // No deposit detected, set status to detecting
                                  setDepositStatus('detecting');
                                }
                              } catch (monitorErr) {
                                console.error("Error monitoring deposits:", monitorErr);
                                
                                // If we get a "No deposit address found" error, try to generate one
                                if (monitorErr.message && monitorErr.message.includes("No deposit address found")) {
                                  try {
                                    await generateDepositAddress(selectedAsset.id);
                                    setDepositStatus('pending');
                                  } catch (addrErr) {
                                    console.error("Error generating deposit address:", addrErr);
                                  }
                                }
                              }
                            }
                          } catch (err) {
                            console.error("Error in check deposits button handler:", err);
                          }
                        }}
                        className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 flex items-center justify-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        Check for Deposits
                      </button>
                    </div>
                  )}
                  
                  {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                      {error}
                    </div>
                  )}
                </>
              )}
              
              {step === 3 && (
                <>
                  <div className="flex items-start p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-700 mr-3 mt-0.5">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <div>
                      <h3 className="text-sm font-medium text-blue-700 mb-1">
                        ISO starts in {isoDetails ? calculateDaysUntil(isoDetails.startDate) : '...'}
                      </h3>
                      <p className="text-sm text-blue-700">
                        The Teleport Initial Service Offering will begin on {isoDetails ? formatDate(isoDetails.startDate) : '...'} and run for 14 days.
                      </p>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4 mb-6">
                    <h3 className="font-medium mb-3">ISO Token Allocation</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Minimum Contribution</p>
                        <p className="font-medium">
                          {isoDetails ? isoDetails.minContribution.map(([asset, amount]) => (
                            `${formatAmount(amount, asset)} ${asset}`
                          )).join(' / ') : '...'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Maximum Contribution</p>
                        <p className="font-medium">
                          {isoDetails ? isoDetails.maxContribution.map(([asset, amount]) => (
                            `${formatAmount(amount, asset)} ${asset}`
                          )).join(' / ') : '...'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Token Distribution</p>
                        <p className="font-medium">Proportional to contribution amount</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Vesting Schedule</p>
                        <p className="font-medium">25% at TGE, 75% vested over 12 months</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4 mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">Your Contribution</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Ready</span>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-1">Deposited</p>
                      {userContribution && userContribution.deposits.length > 0 ? (
                        userContribution.deposits.map(([asset, amount], index) => (
                          <div key={asset}>
                            <p className="text-2xl font-semibold">{formatAmount(amount, asset)} {asset}</p>
                            {index === 0 && <p className="text-sm text-gray-500">≈ ${(userContribution.totalValue).toLocaleString()}</p>}
                          </div>
                        ))
                      ) : (
                        <>
                          <p className="text-2xl font-semibold">{formatAmount(depositAmount, selectedAsset?.id)} {selectedAsset?.symbol}</p>
                          <p className="text-sm text-gray-500">≈ ${depositAmount ? (depositAmount * (selectedAsset?.id === 'BTC' ? 68500 / 100000000 : selectedAsset?.id === 'ETH' ? 3200 / 1000000000000000000 : 1 / 1000000)).toLocaleString() : '0'}</p>
                        </>
                      )}
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Estimated CKF Allocation</p>
                      <p className="text-2xl font-semibold">{userContribution ? userContribution.estimatedAllocation.toLocaleString() : '0'} CKF</p>
                    </div>
                  </div>
                  
                </>
              )}
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="md:col-span-1 space-y-6">
            {/* Portfolio Widget */}
            {(showPortfolio || step === 3) && (
              <Portfolio />
            )}
            
            {/* Transaction History Toggle */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Transaction History</h2>
                <button 
                  onClick={() => setShowTransactionHistory(!showTransactionHistory)}
                  className="text-sm text-blue-700"
                >
                  {showTransactionHistory ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="text-gray-500 text-sm">
                View your deposit and minting history for Teleport.
              </p>
            </div>
          </div>
        </div>
        
        {/* Transaction History (Full Width) */}
        {showTransactionHistory && (
          <div className="mt-6">
            <TransactionHistory />
          </div>
        )}
      </div>
      
      <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
          <p className="text-gray-500">© 2025 Teleport. All rights reserved.</p>
          <div>
            <a href="#" className="text-gray-500 hover:text-gray-900 text-sm">Terms</a> |
            <a href="#" className="text-gray-500 hover:text-gray-900 text-sm"> Privacy</a> |
            <a href="#" className="text-gray-500 hover:text-gray-900 text-sm"> Documentation 
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block ml-1 align-middle">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default IsoDapp;
