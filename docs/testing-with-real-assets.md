# Testing Teleport with Real Assets

This document provides guidance on how to test the Teleport application with real Bitcoin and Ethereum assets. It covers the setup process, testing procedures, and important considerations.

## Prerequisites

Before testing with real assets, ensure you have:

1. Access to the deployed Teleport application
2. A small amount of BTC, ETH, or USDC for testing
3. A wallet that can send these assets (e.g., Coinbase, Kraken, MetaMask)
4. Internet Identity or other authentication method for the Internet Computer

## Important Considerations

### Mainnet vs. Testnet

The Teleport application is currently configured to use:
- Bitcoin Mainnet
- Ethereum Mainnet

This means any transactions will involve real assets with real value. For initial testing, we recommend using minimal amounts (e.g., 0.001 BTC, 0.01 ETH, or 10 USDC).

### Security Status

While the application has been deployed to mainnet, some security features are still being implemented:

- Cryptographic implementations are simplified in some areas
- Error handling may not be comprehensive
- Key management is not yet using HSM or similar technology

**Therefore, do not use large amounts of funds for testing until a full security audit has been completed.**

## Testing Process

### 1. Testing Bitcoin Deposits

1. **Log in to Teleport**
   - Navigate to the Teleport frontend at `https://zonwa-fiaaa-aaaai-q3uqq-cai.ic0.app/`
   - Authenticate using Internet Identity

2. **Generate a Bitcoin Deposit Address**
   - Go to the ISO Dapp section
   - Select "Bitcoin" as the asset
   - The system will generate a Bitcoin address for you
   - This address will start with "bc1q" (SegWit address)

3. **Send a Small Amount of Bitcoin**
   - From your exchange or wallet, send a small amount of BTC (e.g., 0.001 BTC) to the generated address
   - Note: Some exchanges may have minimum withdrawal amounts (typically around 0.0001 BTC)

4. **Monitor the Deposit**
   - In the Teleport application, click "Check for Deposits"
   - The system will monitor the Bitcoin blockchain for your transaction
   - Once detected, it will show as "detecting" initially
   - After 1 confirmation, it will change to "confirming"
   - After 6 confirmations (approximately 60 minutes), it will show as "ready"

5. **Verify Token Minting**
   - Once the deposit is confirmed, the system should mint an equivalent amount of ckBTC
   - Check your portfolio to see the newly minted ckBTC

### 2. Testing Ethereum Deposits

1. **Generate an Ethereum Deposit Address**
   - In the ISO Dapp section, select "Ethereum" as the asset
   - The system will generate an Ethereum address for you
   - This address will start with "0x"

2. **Send a Small Amount of Ethereum**
   - From your exchange or wallet, send a small amount of ETH (e.g., 0.01 ETH) to the generated address
   - Note: Consider gas fees when sending small amounts

3. **Monitor the Deposit**
   - Click "Check for Deposits" to monitor the Ethereum blockchain
   - The system will detect your transaction and show its status
   - After 12 confirmations (approximately 3 minutes), it will show as "ready"

4. **Verify Token Minting**
   - Once confirmed, the system should mint an equivalent amount of ckETH
   - Check your portfolio for the newly minted ckETH

### 3. Testing USDC Deposits

1. **Generate an Ethereum Deposit Address for USDC**
   - Select "USDC (Ethereum)" as the asset
   - The system will generate an Ethereum address for you

2. **Send USDC**
   - From your exchange or wallet, send a small amount of USDC (e.g., 10 USDC) to the generated address
   - Ensure you're sending USDC on the Ethereum network (ERC-20 token)

3. **Monitor and Verify**
   - Follow the same monitoring process as for Ethereum
   - After confirmation, check your portfolio for the newly minted ckUSDC

## Troubleshooting

### Common Issues

1. **Deposit Not Detected**
   - Ensure you sent to the correct address
   - Some exchanges may batch withdrawals, causing delays
   - Try clicking "Check for Deposits" again after 10-15 minutes

2. **Transaction Stuck in "Detecting" Status**
   - Bitcoin transactions may take longer during network congestion
   - Ethereum transactions might be pending due to low gas fees
   - Check the transaction status on a blockchain explorer:
     - For Bitcoin: [Blockchain.com](https://www.blockchain.com/explorer)
     - For Ethereum: [Etherscan](https://etherscan.io/)

3. **Incorrect Amount Minted**
   - The conversion rates are simplified in the current implementation
   - Note any discrepancies for future improvements

### Reporting Issues

If you encounter any issues during testing, please document:
1. The asset type (BTC, ETH, USDC)
2. The transaction hash
3. The expected behavior
4. The actual behavior
5. Any error messages displayed

Report these details to the development team for investigation.

## Next Steps After Testing

After successful testing with real assets:

1. **Document Your Findings**
   - Note any issues or unexpected behavior
   - Measure confirmation times and compare to expectations

2. **Test Trading Functionality**
   - Once you have ckBTC, ckETH, or ckUSDC, test trading on the DEX
   - Place limit orders and market orders
   - Test the volatility-adjusted spread mechanism

3. **Provide Feedback**
   - Share your experience with the development team
   - Suggest improvements for the user interface or functionality

## Conclusion

Testing with real assets is a critical step in validating the Teleport platform's functionality. By following this guide, you can safely test the deposit and minting processes while helping to identify any issues before full production launch.

Remember to use minimal amounts for testing until the platform has undergone a complete security audit and all cryptographic implementations have been finalized.
