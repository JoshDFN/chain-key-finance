// crypto-polyfill.js
import crypto from 'crypto';

// Only apply polyfill in Node.js environment
if (typeof window === 'undefined' && !global.crypto) {
  global.crypto = {
    getRandomValues: function(buffer) {
      return crypto.randomFillSync(buffer);
    }
  };
}
