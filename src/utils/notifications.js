/**
 * Notifications utility for Chain Key Finance
 * 
 * This module provides functions for displaying real-time notifications
 * for deposit status changes and other important events.
 */

// Check if the browser supports notifications
const notificationsSupported = 'Notification' in window;

/**
 * Request notification permissions from the user
 * @returns {Promise<boolean>} Whether permission was granted
 */
export const requestNotificationPermission = async () => {
  if (!notificationsSupported) return false;
  
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Show a notification to the user
 * @param {string} title - The notification title
 * @param {Object} options - Notification options
 * @param {string} options.body - The notification body text
 * @param {string} options.icon - URL to an icon to display
 * @param {Function} options.onClick - Function to call when notification is clicked
 * @returns {Notification|null} The notification object or null if not supported/permitted
 */
export const showNotification = (title, options = {}) => {
  if (!notificationsSupported) return null;
  if (Notification.permission !== 'granted') return null;
  
  try {
    const notification = new Notification(title, {
      body: options.body || '',
      icon: options.icon || '/logo.png',
    });
    
    if (options.onClick && typeof options.onClick === 'function') {
      notification.onclick = options.onClick;
    }
    
    return notification;
  } catch (error) {
    console.error('Error showing notification:', error);
    return null;
  }
};

/**
 * Show a deposit status notification
 * @param {string} status - The deposit status (detecting, confirming, ready)
 * @param {string} asset - The asset being deposited (BTC, ETH, USDC-ETH)
 * @param {number} confirmations - Current confirmations (for confirming status)
 * @param {number} required - Required confirmations (for confirming status)
 * @param {number} amount - The deposit amount
 */
export const showDepositStatusNotification = (status, asset, confirmations = 0, required = 0, amount = 0) => {
  let title = '';
  let body = '';
  
  // Format amount based on asset
  const formatAmount = (amount, asset) => {
    if (asset === 'BTC') {
      return (amount / 100000000).toFixed(8) + ' BTC';
    } else if (asset === 'ETH') {
      return (amount / 1000000000000000000).toFixed(6) + ' ETH';
    } else if (asset === 'USDC-ETH') {
      return (amount / 1000000).toFixed(2) + ' USDC';
    }
    return amount.toString();
  };
  
  switch (status) {
    case 'detecting':
      title = 'Deposit Detected';
      body = `Your ${asset} deposit has been detected and is waiting for confirmations.`;
      break;
    case 'confirming':
      title = 'Deposit Confirming';
      body = `Your ${asset} deposit has ${confirmations} of ${required} confirmations.`;
      break;
    case 'ready':
      title = 'Deposit Confirmed!';
      body = `Your deposit of ${formatAmount(amount, asset)} has been confirmed and tokens have been minted.`;
      break;
    default:
      return null;
  }
  
  return showNotification(title, { body });
};

/**
 * Show a transaction history notification
 * @param {string} type - The transaction type (deposit, withdrawal, trade)
 * @param {string} asset - The asset involved
 * @param {number} amount - The transaction amount
 */
export const showTransactionHistoryNotification = (type, asset, amount) => {
  const title = 'Transaction Added to History';
  const body = `Your ${type} of ${amount} ${asset} has been added to your transaction history.`;
  
  return showNotification(title, { body });
};

/**
 * Show a portfolio update notification
 * @param {string} asset - The asset that changed
 * @param {number} oldBalance - The previous balance
 * @param {number} newBalance - The new balance
 */
export const showPortfolioUpdateNotification = (asset, oldBalance, newBalance) => {
  const title = 'Portfolio Updated';
  const body = `Your ${asset} balance has changed from ${oldBalance} to ${newBalance}.`;
  
  return showNotification(title, { body });
};

// Initialize notifications when the module is imported
requestNotificationPermission();
