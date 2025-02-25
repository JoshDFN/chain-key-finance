import React, { useState, useEffect } from 'react';
import { useIsoDapp } from '../contexts/IsoDappContext';

/**
 * Portfolio component displays the user's current holdings
 * with asset distribution and value information.
 */
function Portfolio() {
  const { userContribution, availableAssets } = useIsoDapp();
  const [totalValue, setTotalValue] = useState(0);
  const [holdings, setHoldings] = useState([]);
  
  // Format amount based on asset
  const formatAmount = (amount, asset) => {
    if (!amount) return '0';
    
    const assetInfo = availableAssets.find(a => a.id === asset);
    if (!assetInfo) return amount.toString();
    
    const decimals = Math.pow(10, assetInfo.decimals);
    return (amount / decimals).toFixed(assetInfo.decimals === 8 ? 8 : assetInfo.decimals === 18 ? 6 : 2);
  };
  
  // Calculate USD value based on asset
  const calculateUsdValue = (amount, asset) => {
    if (!amount) return 0;
    
    if (asset === 'BTC') {
      return amount * 68500 / 100000000; // Assuming 1 BTC = $68,500
    } else if (asset === 'ETH') {
      return amount * 3200 / 1000000000000000000; // Assuming 1 ETH = $3,200
    } else if (asset === 'USDC-ETH') {
      return amount / 1000000; // 1 USDC = $1
    }
    return 0;
  };
  
  // Calculate percentage of total portfolio
  const calculatePercentage = (value) => {
    if (!totalValue || !value) return 0;
    return (value / totalValue) * 100;
  };
  
  // Update holdings when userContribution changes
  useEffect(() => {
    if (!userContribution || !userContribution.deposits) {
      setHoldings([]);
      setTotalValue(0);
      return;
    }
    
    let total = 0;
    const newHoldings = userContribution.deposits.map(([asset, amount]) => {
      const usdValue = calculateUsdValue(amount, asset);
      total += usdValue;
      
      return {
        asset,
        amount,
        usdValue,
      };
    });
    
    setTotalValue(total);
    setHoldings(newHoldings);
  }, [userContribution]);
  
  // Get asset color
  const getAssetColor = (asset) => {
    const assetInfo = availableAssets.find(a => a.id === asset);
    return assetInfo ? assetInfo.color : '#ccc';
  };
  
  // Get asset icon
  const getAssetIcon = (asset) => {
    const assetInfo = availableAssets.find(a => a.id === asset);
    return assetInfo ? assetInfo.icon : '';
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold mb-4">Portfolio</h2>
      
      {holdings.length > 0 ? (
        <>
          <div className="mb-6">
            <h3 className="text-sm text-gray-500 mb-1">Total Value</h3>
            <p className="text-2xl font-semibold">${totalValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
          </div>
          
          <div className="mb-6">
            <h3 className="text-sm text-gray-500 mb-2">Asset Distribution</h3>
            <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex">
              {holdings.map((holding, index) => (
                <div
                  key={holding.asset}
                  className="h-full"
                  style={{
                    width: `${calculatePercentage(holding.usdValue)}%`,
                    backgroundColor: getAssetColor(holding.asset),
                  }}
                  title={`${holding.asset}: ${calculatePercentage(holding.usdValue).toFixed(1)}%`}
                ></div>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 mt-2">
              {holdings.map((holding) => (
                <div key={holding.asset} className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-1"
                    style={{ backgroundColor: getAssetColor(holding.asset) }}
                  ></div>
                  <span className="text-xs text-gray-600">
                    {holding.asset}: {calculatePercentage(holding.usdValue).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm text-gray-500 mb-2">Holdings</h3>
            <div className="space-y-3">
              {holdings.map((holding) => (
                <div key={holding.asset} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center mr-3"
                      style={{
                        background: `${getAssetColor(holding.asset)}20`,
                        border: `1px solid ${getAssetColor(holding.asset)}`,
                      }}
                    >
                      {getAssetIcon(holding.asset)}
                    </div>
                    <div>
                      <p className="font-medium">{holding.asset}</p>
                      <p className="text-sm text-gray-500">
                        {formatAmount(holding.amount, holding.asset)} {holding.asset}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${holding.usdValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                    <p className="text-sm text-gray-500">{calculatePercentage(holding.usdValue).toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No assets in your portfolio yet.
        </div>
      )}
    </div>
  );
}

export default Portfolio;
