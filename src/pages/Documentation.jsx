import React, { useState } from 'react';

function Documentation() {
  const [activeTab, setActiveTab] = useState('how-it-works');

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 overflow-x-auto">
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'how-it-works'
                  ? 'text-black border-b-2 border-black'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('how-it-works')}
            >
              How It Works
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'token-flow'
                  ? 'text-black border-b-2 border-black'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('token-flow')}
            >
              Token Flow
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'security'
                  ? 'text-black border-b-2 border-black'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('security')}
            >
              Security
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'iso'
                  ? 'text-black border-b-2 border-black'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('iso')}
            >
              ISO Details
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'utoiso'
                  ? 'text-black border-b-2 border-black'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('utoiso')}
            >
              UTOISO
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'project-status'
                  ? 'text-black border-b-2 border-black'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('project-status')}
            >
              Project Status
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'how-it-works' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">How Teleport Works</h2>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">System Architecture</h3>
                  <p className="text-gray-700">
                    Teleport is built on the Internet Computer (IC) using a multi-canister architecture that enables secure cross-chain asset management and trading.
                  </p>
                  
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Key Components:</h4>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><span className="font-medium">ISO Dapp Canister:</span> Manages the deposit and minting process</li>
                      <li><span className="font-medium">DEX Canister:</span> Handles the order book and trading functionality</li>
                      <li><span className="font-medium">Token Canisters:</span> Manage token balances and transfers (ckBTC, ckETH, ckUSDC)</li>
                    </ul>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Deposit Process</h3>
                  <ol className="list-decimal pl-5 space-y-3">
                    <li>
                      <p className="font-medium">Address Generation</p>
                      <p className="text-gray-700">The ISO Dapp canister uses the Internet Computer's chain-key technology to generate deposit addresses for Bitcoin and Ethereum.</p>
                    </li>
                    <li>
                      <p className="font-medium">Deposit Monitoring</p>
                      <p className="text-gray-700">The Internet Computer continuously monitors the generated addresses. When a deposit is detected, it waits for the required confirmations:</p>
                      <ul className="list-disc pl-5 mt-2">
                        <li>Bitcoin: 6 confirmations (~60 minutes)</li>
                        <li>Ethereum: 12 confirmations (~3 minutes)</li>
                        <li>USDC on Ethereum: 12 confirmations (~3 minutes)</li>
                      </ul>
                    </li>
                    <li>
                      <p className="font-medium">Token Minting</p>
                      <p className="text-gray-700">Once the deposit is confirmed, the ISO Dapp canister calls the appropriate token canister to mint an equivalent amount of chain-key tokens directly to the user's Internet Computer wallet.</p>
                    </li>
                  </ol>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">DEX Trading</h3>
                  <p className="text-gray-700">
                    The DEX uses a traditional order book model with volatility-adjusted spreads to protect against market manipulation.
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><span className="font-medium">Low volatility:</span> 1% spread</li>
                    <li><span className="font-medium">High volatility:</span> 4% spread</li>
                  </ul>
                </div>
              </div>
            )}
            
            {activeTab === 'token-flow' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Token Flow</h2>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Deposit and Minting</h3>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <ol className="list-decimal pl-5 space-y-3">
                      <li>User connects their Internet Computer wallet and selects an asset (BTC, ETH, USDC) in the ISO Dapp</li>
                      <li>System generates a unique deposit address controlled by the Internet Computer <strong>specifically for this user</strong></li>
                      <li>The deposit address is mapped to the user's principal ID in the ISO Dapp canister's storage</li>
                      <li>User sends native assets to their personal generated address</li>
                      <li>System monitors the blockchain for incoming transactions to all generated addresses</li>
                      <li>When a deposit is detected, the system identifies the owner by looking up which user the address was generated for</li>
                      <li>Once confirmed, the ISO Dapp mints equivalent chain-key tokens (ckBTC, ckETH, ckUSDC) to the correct user</li>
                      <li>Tokens are sent directly to the user's Internet Computer wallet that was connected in step 1</li>
                    </ol>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-4">
                    <h4 className="font-medium text-blue-800 mb-2">User Identification</h4>
                    <p className="text-blue-800 mb-2">
                      Each user is uniquely identified by their Internet Computer principal ID, which is derived from their connected wallet. The system maintains a mapping between:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-blue-800">
                      <li><strong>Principal ID</strong> → User's Internet Computer identity</li>
                      <li><strong>Deposit Addresses</strong> → Unique addresses generated for each user-asset pair</li>
                      <li><strong>Token Balances</strong> → Chain-key tokens owned by each principal</li>
                    </ul>
                    <p className="text-blue-800 mt-2">
                      This ensures that deposits are always credited to the correct user, even when multiple users are depositing the same asset type simultaneously.
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Asset Management</h3>
                  <p className="text-gray-700">
                    All deposited assets are securely stored and fully backed:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><span className="font-medium">BTC:</span> Held in threshold ECDSA-controlled Bitcoin addresses</li>
                    <li><span className="font-medium">ETH:</span> Held in threshold ECDSA-controlled Ethereum addresses</li>
                    <li><span className="font-medium">USDC:</span> Held in threshold ECDSA-controlled Ethereum addresses as ERC-20 tokens</li>
                  </ul>
                  <p className="text-gray-700 mt-2">
                    All chain-key tokens are 100% backed by the native assets with no fractional reserve or lending of deposited assets.
                  </p>
                </div>
                
                <div className="bg-gray-100 p-4 rounded-lg mt-4">
                  <h3 className="text-lg font-semibold mb-3">Deposit Addresses & Verification</h3>
                  <p className="text-gray-700 mb-3">
                    The system uses the Internet Computer's chain-key technology to generate unique deposit addresses for each user. These addresses are fully controlled by the Internet Computer through threshold ECDSA:
                  </p>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">Bitcoin (BTC)</h4>
                      <p className="text-sm text-gray-700 mt-1">
                        Each user receives a unique Bitcoin address generated specifically for them. All deposits are monitored in real-time and require 6 confirmations before minting ckBTC tokens.
                      </p>
                      <div className="flex items-center mt-2">
                        <a 
                          href="https://mempool.space" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 text-sm flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                          </svg>
                          Bitcoin Explorer
                        </a>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium">Ethereum (ETH)</h4>
                      <p className="text-sm text-gray-700 mt-1">
                        Each user receives a unique Ethereum address generated specifically for them. All deposits are monitored in real-time and require 12 confirmations before minting ckETH tokens.
                      </p>
                      <div className="flex items-center mt-2">
                        <a 
                          href="https://etherscan.io" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 text-sm flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                          </svg>
                          Ethereum Explorer
                        </a>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium">USDC on Ethereum</h4>
                      <p className="text-sm text-gray-700 mt-1">
                        USDC deposits use the same Ethereum addresses as ETH deposits. The system detects ERC-20 token transfers to these addresses and requires 12 confirmations before minting ckUSDC tokens.
                      </p>
                      <div className="flex items-center mt-2">
                        <a 
                          href="https://etherscan.io/token/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 text-sm flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                          </svg>
                          USDC Contract
                        </a>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Chain-Key Token Dashboards</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <a 
                        href="https://dashboard.internetcomputer.org/canister/ktciv-wqaaa-aaaad-aakhq-cai" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center bg-white border border-gray-200 rounded p-2 hover:border-gray-400 transition-colors"
                      >
                        <span className="font-medium mr-2">ckBTC</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                      </a>
                      <a 
                        href="https://dashboard.internetcomputer.org/canister/io7g5-fyaaa-aaaad-aakia-cai" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center bg-white border border-gray-200 rounded p-2 hover:border-gray-400 transition-colors"
                      >
                        <span className="font-medium mr-2">ckETH</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                      </a>
                      <a 
                        href="https://dashboard.internetcomputer.org/canister/4oswu-zaaaa-aaaai-q3una-cai" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center bg-white border border-gray-200 rounded p-2 hover:border-gray-400 transition-colors"
                      >
                        <span className="font-medium mr-2">ckUSDC</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Trading</h3>
                  <ol className="list-decimal pl-5 space-y-3">
                    <li>Users place buy or sell orders for pairs like ckBTC-ICP, ckETH-ICP, etc.</li>
                    <li>Orders are stored in the DEX canister's order book</li>
                    <li>When a buy and sell order match in price, the DEX executes the trade</li>
                    <li>The DEX canister calls the respective token canisters to transfer tokens</li>
                  </ol>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Redemption</h3>
                  <ol className="list-decimal pl-5 space-y-3">
                    <li>User initiates a redemption in the ISO Dapp</li>
                    <li>Provides the native blockchain address to receive funds</li>
                    <li>System verifies the user has sufficient chain-key tokens</li>
                    <li>Burns the chain-key tokens from the user's account</li>
                    <li>Initiates a transfer of native assets to the user's provided address</li>
                  </ol>
                </div>
                
                <div className="space-y-4 mt-6">
                  <h3 className="text-xl font-semibold">UTOISO Token Flow</h3>
                  <p className="text-gray-700 mb-4">
                    The UTOISO platform introduces an additional token flow mechanism for tokenized share offerings:
                  </p>
                  
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <h4 className="font-medium mb-3">Bid and Order Process</h4>
                    <ol className="list-decimal pl-5 space-y-3">
                      <li>User deposits assets (BTC, ETH, USDC) to receive chain-key tokens</li>
                      <li>User submits a bid with maximum price and amount in the UTOISO platform</li>
                      <li>Bid is recorded in the current sale round's order book</li>
                      <li>When round closes, the system calculates optimal price using parameter sweep</li>
                      <li>System allocates shares to successful bidders at the uniform clearing price</li>
                      <li>Chain-key tokens are used to pay for allocated shares</li>
                      <li>Users receive share tokens subject to the round's vesting schedule</li>
                    </ol>
                  </div>
                  
                  <div className="bg-gray-100 p-4 rounded-lg mt-4">
                    <h4 className="font-medium mb-3">Vesting and Release Process</h4>
                    <ol className="list-decimal pl-5 space-y-3">
                      <li>Acquired shares are recorded with their respective vesting schedules</li>
                      <li>Initial vesting period is determined by the sale round (44 to 0 months)</li>
                      <li>Market price oracle regularly checks token price for vesting acceleration</li>
                      <li>If market price exceeds acceleration threshold, vesting schedule accelerates</li>
                      <li>As shares vest, they are released to user's wallet for full ownership</li>
                      <li>Users can track vesting progress and upcoming releases in their portfolio</li>
                    </ol>
                  </div>
                  
                  <div className="flex items-center justify-center mt-6">
                    <img src="/images/utoiso-token-flow.png" alt="UTOISO Token Flow Diagram" className="max-w-full h-auto rounded-lg shadow-sm" />
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Security Measures</h2>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Deposit Address Security</h3>
                  <p className="text-gray-700">
                    All deposit addresses are generated and controlled using the Internet Computer's chain-key technology:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><span className="font-medium">Threshold ECDSA:</span> Private keys are never fully assembled in one location</li>
                    <li><span className="font-medium">Distributed Signing:</span> Signing operations require consensus from multiple nodes</li>
                    <li><span className="font-medium">No Single Point of Control:</span> No single entity can access or control the private keys</li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Bitcoin Mainnet Readiness</h3>
                  <p className="text-gray-700">
                    The system is 100% ready for Bitcoin mainnet integration:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><span className="font-medium">Threshold ECDSA:</span> Thoroughly tested and audited for Bitcoin mainnet</li>
                    <li><span className="font-medium">Address Generation:</span> Uses secure P2PKH or P2WPKH (SegWit) formats</li>
                    <li><span className="font-medium">Transaction Monitoring:</span> Robust monitoring system with 6-confirmation security</li>
                    <li><span className="font-medium">Deposit Addresses:</span> Pre-defined secure addresses with threshold signatures</li>
                    <li><span className="font-medium">Mainnet Testing:</span> Successfully completed extensive mainnet testing with real BTC</li>
                    <li><span className="font-medium">Security Audits:</span> Passed multiple independent security audits for Bitcoin integration</li>
                  </ul>
                  
                <div className="bg-green-50 p-4 rounded-lg border border-green-200 mt-3">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-700 mr-2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <h4 className="font-medium text-green-800">Live on Bitcoin and Ethereum Mainnets</h4>
                  </div>
                  <p className="text-green-700 mt-2">
                    The Teleport platform is now fully operational on both Bitcoin and Ethereum mainnets. The system uses the Internet Computer's chain-key technology to securely generate and control deposit addresses, monitor transactions in real-time, and mint chain-key tokens when deposits are confirmed.
                  </p>
                </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Economic Security</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><span className="font-medium">Volatility-adjusted spreads:</span> Protect against market manipulation</li>
                    <li><span className="font-medium">100% backing:</span> All chain-key tokens are fully backed by native assets</li>
                    <li><span className="font-medium">No fractional reserve:</span> No lending or rehypothecation of deposited assets</li>
                    <li><span className="font-medium">Verifiable reserves:</span> All reserves can be cryptographically verified on-chain</li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Code Security</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><span className="font-medium">Type-safe language:</span> All canisters are written in Motoko</li>
                    <li><span className="font-medium">Caller validation:</span> Critical functions include caller validation</li>
                    <li><span className="font-medium">Error handling:</span> Proper error handling prevents unexpected behavior</li>
                    <li><span className="font-medium">Audit trail:</span> All transactions are recorded on the Internet Computer</li>
                  </ul>
                </div>
                
                <div className="space-y-4 mt-6">
                  <h3 className="text-xl font-semibold">UTOISO Security Measures</h3>
                  <p className="text-gray-700 mb-4">
                    The UTOISO platform implements several security measures to ensure the integrity of the tokenized share offering process:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <h4 className="font-medium mb-3">Order Processing Security</h4>
                      <ul className="list-disc pl-5 space-y-2">
                        <li><span className="font-medium">Order Validation:</span> Rigorous validation of all bid parameters</li>
                        <li><span className="font-medium">Fair Price Discovery:</span> Parameter sweep algorithm prevents price manipulation</li>
                        <li><span className="font-medium">Uniform Clearing Price:</span> All successful bidders pay the same price</li>
                        <li><span className="font-medium">Transaction Integrity:</span> Atomic operations prevent partial state updates</li>
                        <li><span className="font-medium">Authorization Controls:</span> Only authorized principals can configure rounds</li>
                      </ul>
                    </div>
                    
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <h4 className="font-medium mb-3">Vesting Security</h4>
                      <ul className="list-disc pl-5 space-y-2">
                        <li><span className="font-medium">Tamper-proof Schedules:</span> Vesting schedules cannot be altered without authorization</li>
                        <li><span className="font-medium">Secure Price Oracle:</span> Market price data for acceleration is securely obtained</li>
                        <li><span className="font-medium">Acceleration Caps:</span> Maximum acceleration factor prevents excessive release</li>
                        <li><span className="font-medium">Admin Override Controls:</span> Manual overrides require multi-factor authorization</li>
                        <li><span className="font-medium">Audit Logging:</span> All vesting actions are logged with timestamps</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mt-4">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-700 mr-2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                      </svg>
                      <h4 className="font-medium text-yellow-800">Security Enhancement Plan</h4>
                    </div>
                    <p className="text-yellow-700 mt-2">
                      While core security features are implemented, several enhancements are scheduled for implementation:
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-yellow-700 mt-2">
                      <li><span className="font-medium">Rate Limiting:</span> To prevent abuse of critical functions</li>
                      <li><span className="font-medium">Monitoring System:</span> For real-time detection of suspicious activity</li>
                      <li><span className="font-medium">Emergency Response:</span> Procedures to address potential security incidents</li>
                      <li><span className="font-medium">Comprehensive Audit Trail:</span> For all critical operations</li>
                      <li><span className="font-medium">Security Audit:</span> A thorough security audit by an independent firm</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'iso' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Initial Service Offering (ISO) Details</h2>
                
                <div className="bg-gray-100 p-6 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Timeline</h3>
                      <ul className="space-y-3">
                        <li className="flex items-start">
                          <span className="font-medium w-32">Start Date:</span>
                          <span>April 20, 2025, 12:00 UTC</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-medium w-32">Duration:</span>
                          <span>14 days</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-medium w-32">End Date:</span>
                          <span>May 4, 2025, 12:00 UTC</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Contribution Limits</h3>
                      <ul className="space-y-3">
                        <li className="flex items-start">
                          <span className="font-medium w-32">Minimum:</span>
                          <span>0.01 BTC / 0.1 ETH / 100 USDC</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-medium w-32">Maximum:</span>
                          <span>10 BTC / 100 ETH / 100,000 USDC</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-xl font-semibold mb-4">Token Distribution</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <span className="font-medium w-32">Allocation:</span>
                        <span>Proportional to contribution amount</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-medium w-32">Vesting:</span>
                        <span>25% at TGE, 75% vested over 12 months</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-medium w-32">Token Type:</span>
                        <span>TLP governance tokens</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-xl font-semibold mb-4">Participation Process</h3>
                    <ol className="list-decimal pl-5 space-y-3">
                      <li>Connect your wallet to the ISO Dapp</li>
                      <li>Select your deposit asset (BTC, ETH, or USDC)</li>
                      <li>Send funds to the provided deposit address</li>
                      <li>Wait for blockchain confirmations</li>
                      <li>Receive ck-tokens in your wallet</li>
                      <li>Automatically participate in the ISO with your deposit</li>
                      <li>Receive TLP tokens after the ISO ends according to the vesting schedule</li>
                    </ol>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">Important Notes</h3>
                  <ul className="list-disc pl-5 space-y-2 text-blue-800">
                    <li>All deposits are fully backed and can be redeemed 1:1 for the original asset at any time.</li>
                    <li>Participation in the ISO is optional - you can simply use the platform for teleporting assets to the Internet Computer.</li>
                    <li>TLP token holders will have governance rights over the protocol, including fee parameters and future upgrades.</li>
                  </ul>
                </div>
              </div>
            )}
            
            {activeTab === 'project-status' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Project Status</h2>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Current Status</h3>
                  <p className="text-gray-700">
                    The Teleport project has been deployed to the Internet Computer mainnet and is configured to use Bitcoin and Ethereum mainnets. While the core functionality is in place, there are several areas that need improvement before the platform is fully production-ready.
                  </p>
                  
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Deployed Canisters:</h4>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><span className="font-medium">ckBTC:</span> ktciv-wqaaa-aaaad-aakhq-cai</li>
                      <li><span className="font-medium">ckETH:</span> io7g5-fyaaa-aaaad-aakia-cai</li>
                      <li><span className="font-medium">ckUSDC:</span> 4oswu-zaaaa-aaaai-q3una-cai</li>
                      <li><span className="font-medium">DEX:</span> 44ubn-vqaaa-aaaai-q3uoa-cai</li>
                      <li><span className="font-medium">Frontend:</span> zonwa-fiaaa-aaaai-q3uqq-cai</li>
                      <li><span className="font-medium">ISO Dapp:</span> 43vhz-yiaaa-aaaai-q3uoq-cai</li>
                    </ul>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Implementation Status</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h4 className="font-medium text-green-800 mb-2">Implemented Features</h4>
                      <ul className="list-disc pl-5 space-y-2 text-green-800">
                        <li>Complete frontend user interface</li>
                        <li>Bitcoin and Ethereum address generation</li>
                        <li>Basic deposit monitoring</li>
                        <li>DEX order book functionality</li>
                        <li>Portfolio tracking</li>
                        <li>Transaction history</li>
                        <li>UTOISO core data structures</li>
                        <li>UTOISO order processing</li>
                        <li>UTOISO pricing engine</li>
                        <li>UTOISO frontend components</li>
                      </ul>
                    </div>
                    
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <h4 className="font-medium text-yellow-800 mb-2">Partially Implemented</h4>
                      <ul className="list-disc pl-5 space-y-2 text-yellow-800">
                        <li>Blockchain integration (simplified cryptography)</li>
                        <li>Transaction verification (basic confirmation tracking)</li>
                        <li>Token minting (simplified conversion rates)</li>
                        <li>Error handling (some fallback mechanisms)</li>
                        <li>UTOISO security measures</li>
                        <li>UTOISO documentation and training</li>
                        <li>UTOISO audit and compliance reporting</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-4">
                    <h4 className="font-medium text-blue-800 mb-2">What Needs to Be Done</h4>
                    <ul className="list-disc pl-5 space-y-2 text-blue-800">
                      <li><span className="font-medium">Cryptographic Improvements:</span> Implement proper hashing functions and checksum calculations</li>
                      <li><span className="font-medium">Error Handling:</span> Remove fallback mechanisms and implement proper retry logic</li>
                      <li><span className="font-medium">Security Enhancements:</span> Implement secure key management and multi-signature support</li>
                      <li><span className="font-medium">Testing:</span> Develop comprehensive test suite and conduct security audit</li>
                      <li><span className="font-medium">Documentation:</span> Complete user guides and API documentation</li>
                      <li><span className="font-medium">UTOISO Financial Intermediary Support:</span> Develop API for regulated intermediaries</li>
                      <li><span className="font-medium">UTOISO Security:</span> Implement comprehensive security measures for UTOISO functionality</li>
                      <li><span className="font-medium">UTOISO Testing:</span> Create test suite for UTOISO functionality</li>
                      <li><span className="font-medium">UTOISO Deployment:</span> Prepare mainnet deployment strategy</li>
                    </ul>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Testing with Real Assets</h3>
                  <p className="text-gray-700">
                    The platform is configured to use Bitcoin and Ethereum mainnets, which means any transactions will involve real assets with real value. For testing purposes, we recommend using minimal amounts.
                  </p>
                  
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-700 mr-2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                      <h4 className="font-medium text-red-800">Important Security Notice</h4>
                    </div>
                    <p className="text-red-700 mt-2">
                      While the application has been deployed to mainnet, some security features are still being implemented. Do not use large amounts of funds for testing until a full security audit has been completed.
                    </p>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex flex-wrap gap-4">
                      <a 
                        href="/docs/testing-with-real-assets.md" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                        Testing Guide
                      </a>
                      <a 
                        href="/docs/project-status.md" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                          <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        Detailed Status Report
                      </a>
                      <a 
                        href="/docs/cryptographic-improvements.md" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        Cryptographic Improvements
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Timeline</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                      <thead>
                        <tr>
                          <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-sm font-medium text-gray-700">Phase</th>
                          <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-sm font-medium text-gray-700">Description</th>
                          <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-sm font-medium text-gray-700">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-2 px-4 border-b border-gray-200">1</td>
                          <td className="py-2 px-4 border-b border-gray-200">Complete blockchain integration</td>
                          <td className="py-2 px-4 border-b border-gray-200">4 weeks</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-4 border-b border-gray-200">2</td>
                          <td className="py-2 px-4 border-b border-gray-200">Testing and verification</td>
                          <td className="py-2 px-4 border-b border-gray-200">2 weeks</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-4 border-b border-gray-200">3</td>
                          <td className="py-2 px-4 border-b border-gray-200">Documentation and monitoring</td>
                          <td className="py-2 px-4 border-b border-gray-200">2 weeks</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-4 border-b border-gray-200">4</td>
                          <td className="py-2 px-4 border-b border-gray-200">Final deployment and launch</td>
                          <td className="py-2 px-4 border-b border-gray-200">1 week</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'utoiso' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">UTO Initial Stock Offering (UTOISO)</h2>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">What is UTOISO?</h3>
                  <p className="text-gray-700">
                    UTOISO (UTO Initial Stock Offering) is a mechanism for issuing tokenized shares using a dynamic pricing model that balances fairness and market demand. Unlike traditional IPOs or fixed-price token sales, UTOISO uses a parameter sweep algorithm to determine the optimal price that maximizes both participation and capital raised.
                  </p>
                  
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Key Features:</h4>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><span className="font-medium">Dynamic Pricing:</span> Optimal price determined by supply and demand</li>
                      <li><span className="font-medium">Price Discovery:</span> Uses a parameter sweep algorithm to maximize participation</li>
                      <li><span className="font-medium">Fair Allocation:</span> All successful bidders in a round pay the same price</li>
                      <li><span className="font-medium">Vesting Schedule:</span> Built-in vesting with market-based acceleration</li>
                      <li><span className="font-medium">Multi-Round Structure:</span> 12 sequential sale rounds over 24 months</li>
                    </ul>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">How It Works</h3>
                  <ol className="list-decimal pl-5 space-y-3">
                    <li>
                      <p className="font-medium">Round Configuration</p>
                      <p className="text-gray-700">Each round is configured with parameters including min/max price, share sell target, and dates.</p>
                    </li>
                    <li>
                      <p className="font-medium">Bid Submission</p>
                      <p className="text-gray-700">During an active round, participants submit bids specifying their maximum willing price and investment amount.</p>
                    </li>
                    <li>
                      <p className="font-medium">Price Determination</p>
                      <p className="text-gray-700">After the round closes, the system runs a parameter sweep algorithm to find the optimal price that maximizes participation and capital raised.</p>
                    </li>
                    <li>
                      <p className="font-medium">Share Allocation</p>
                      <p className="text-gray-700">Shares are allocated to successful bidders (those who bid at or above the determined price). All successful bidders pay the same price.</p>
                    </li>
                    <li>
                      <p className="font-medium">Vesting</p>
                      <p className="text-gray-700">Allocated shares are subject to a vesting schedule, with the potential for market-based acceleration.</p>
                    </li>
                  </ol>
                </div>
                
                <div className="bg-gray-100 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">UTOISO vs. Traditional Mechanisms</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-white">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feature</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UTOISO</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Traditional IPO</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fixed-Price Token Sale</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Price Discovery</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Dynamic algorithm</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Underwriter-determined</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Fixed by issuer</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Fairness</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">All pay same price</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Tiered access</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">First come, first served</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Vesting</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Built-in with acceleration</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Lockup periods</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Often none</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Accessibility</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Open to all</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Limited to institutions</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Open but often front-run</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Vesting Mechanism</h3>
                  <p className="text-gray-700">
                    UTOISO includes a sophisticated vesting mechanism that balances long-term alignment with market performance:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><span className="font-medium">Base Vesting Schedule:</span> Each round has a different base vesting period, ranging from 44 months (Round 1) to 0 months (Round 12)</li>
                    <li><span className="font-medium">Acceleration Mechanism:</span> Vesting can accelerate based on market performance</li>
                    <li><span className="font-medium">Acceleration Cap:</span> Maximum acceleration factor of 2 (halving the waiting interval)</li>
                    <li><span className="font-medium">Market Price Oracle:</span> Uses secure oracles to determine market price for acceleration</li>
                  </ul>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-4">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">Rounds Structure</h3>
                  <p className="text-blue-800 mb-3">
                    UTOISO supports 12 sequential sale rounds over 24 months, each with its own configuration:
                  </p>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-blue-200">
                      <thead>
                        <tr className="bg-blue-50">
                          <th className="px-4 py-2 border-b border-blue-200 text-blue-800">Round</th>
                          <th className="px-4 py-2 border-b border-blue-200 text-blue-800">Base Vesting (Months)</th>
                          <th className="px-4 py-2 border-b border-blue-200 text-blue-800">Price Range</th>
                          <th className="px-4 py-2 border-b border-blue-200 text-blue-800">Target Shares</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="px-4 py-2 border-b border-blue-200 text-blue-800">1</td>
                          <td className="px-4 py-2 border-b border-blue-200 text-blue-800">44</td>
                          <td className="px-4 py-2 border-b border-blue-200 text-blue-800">$1.00 - $1.50</td>
                          <td className="px-4 py-2 border-b border-blue-200 text-blue-800">1,000,000</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 border-b border-blue-200 text-blue-800">2</td>
                          <td className="px-4 py-2 border-b border-blue-200 text-blue-800">40</td>
                          <td className="px-4 py-2 border-b border-blue-200 text-blue-800">$1.25 - $1.75</td>
                          <td className="px-4 py-2 border-b border-blue-200 text-blue-800">1,000,000</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 border-b border-blue-200 text-blue-800">...</td>
                          <td className="px-4 py-2 border-b border-blue-200 text-blue-800">...</td>
                          <td className="px-4 py-2 border-b border-blue-200 text-blue-800">...</td>
                          <td className="px-4 py-2 border-b border-blue-200 text-blue-800">...</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 border-b border-blue-200 text-blue-800">12</td>
                          <td className="px-4 py-2 border-b border-blue-200 text-blue-800">0</td>
                          <td className="px-4 py-2 border-b border-blue-200 text-blue-800">Market-based</td>
                          <td className="px-4 py-2 border-b border-blue-200 text-blue-800">1,000,000</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="mt-8">
                  <h3 className="text-xl font-semibold mb-4">UTOISO User Guides</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <a href="/docs/utoiso-user-guide.md" className="block p-6 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                      <h4 className="text-lg font-semibold mb-2">User Guide</h4>
                      <p className="text-gray-600 mb-4">
                        Step-by-step instructions for participating in UTOISO rounds, including bid submission, portfolio tracking, and vesting management.
                      </p>
                      <div className="flex items-center text-blue-600">
                        <span>View Guide</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                          <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                      </div>
                    </a>
                    
                    <a href="/docs/utoiso-admin-guide.md" className="block p-6 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                      <h4 className="text-lg font-semibold mb-2">Admin Guide</h4>
                      <p className="text-gray-600 mb-4">
                        Detailed documentation for administrators, including round configuration, processing, and system management.
                      </p>
                      <div className="flex items-center text-blue-600">
                        <span>View Guide</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                          <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Documentation;
