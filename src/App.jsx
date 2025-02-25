import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { WalletProvider } from './contexts/WalletContext';
import { DexProvider } from './contexts/DexContext';
import { IsoDappProvider } from './contexts/IsoDappContext';
import IsoDapp from './pages/IsoDapp';
import Dex from './pages/Dex';
import Documentation from './pages/Documentation';
import ConnectButton from './components/ConnectButton';
import PasswordProtection from './components/PasswordProtection';

function App() {
  return (
    <PasswordProtection>
      <WalletProvider>
        <IsoDappProvider>
          <DexProvider>
            <div className="min-h-screen flex flex-col">
              {/* Header */}
              <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="container mx-auto px-6 py-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 bg-black rounded-lg"></div>
                      <h1 className="text-xl font-semibold">
                        Teleport
                      </h1>
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center gap-4">
                      <NavLink
                        to="/"
                        className={({ isActive }) =>
                          `flex items-center gap-1 text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'}`
                        }
                        end
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="7" height="7"></rect>
                          <rect x="14" y="3" width="7" height="7"></rect>
                          <rect x="14" y="14" width="7" height="7"></rect>
                          <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                        ISO Dapp
                      </NavLink>
                      <NavLink
                        to="/dex"
                        className={({ isActive }) =>
                          `flex items-center gap-1 text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'}`
                        }
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                          <polyline points="17 6 23 6 23 12"></polyline>
                        </svg>
                        Chain Fusion DEX
                      </NavLink>
                      <NavLink
                        to="/docs"
                        className={({ isActive }) =>
                          `flex items-center gap-1 text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'}`
                        }
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                        </svg>
                        Documentation
                      </NavLink>
                      <ConnectButton />
                    </div>
                  </div>
                </div>
              </header>

              {/* Development Environment Banner */}
              <div className="bg-yellow-50 border-b border-yellow-200">
                <div className="container mx-auto px-6 py-2">
                  <p className="text-yellow-800 text-sm text-center">
                    <strong>Development Environment</strong> - This application is currently under development. Do not deposit real funds.
                  </p>
                </div>
              </div>

              {/* Main Content */}
              <Routes>
                <Route path="/" element={<IsoDapp />} />
                <Route path="/dex" element={<Dex />} />
                <Route path="/docs" element={<Documentation />} />
              </Routes>
            </div>
          </DexProvider>
        </IsoDappProvider>
      </WalletProvider>
    </PasswordProtection>
  );
}

export default App;
