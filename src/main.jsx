import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/index.css';

// Polyfill for global object
window.global = window;
window.process = window.process || {};
window.process.env = window.process.env || {};

// Initialize environment variables
window.env = {
  DFX_NETWORK: process.env.DFX_NETWORK || 'local',
  INTERNET_IDENTITY_CANISTER_ID: process.env.INTERNET_IDENTITY_CANISTER_ID,
  ISO_DAPP_CANISTER_ID: 'be2us-64aaa-aaaaa-qaabq-cai',
  DEX_CANISTER_ID: 'bw4dl-smaaa-aaaaa-qaacq-cai',
  CKBTC_CANISTER_ID: 'bkyz2-fmaaa-aaaaa-qaaaq-cai',
  CKETH_CANISTER_ID: 'bd3sg-teaaa-aaaaa-qaaba-cai',
  CKSOL_CANISTER_ID: 'be2us-64aaa-aaaaa-qaabq-cai',
  CKUSDC_CANISTER_ID: 'br5f7-7uaaa-aaaaa-qaaca-cai'
};

// Make environment variables available to Vite
Object.keys(window.env).forEach(key => {
  process.env[key] = window.env[key];
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
