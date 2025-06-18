const webpush = require('web-push');
const logger = require('../utils/logger');
 require('dotenv').config();
// Initialize web-push with VAPID keys
const initializeWebPush = () => {
  const vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY
  };

  if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
    logger.warn('VAPID keys not set. Web push notifications will be disabled.');
    return false;
  }

  webpush.setVapidDetails(
    'mailto:preritnag4@gmail.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );

  return true;
};

const isWebPushEnabled = initializeWebPush();

const sendWebPushNotification = async (subscription, payload) => {
  if (!isWebPushEnabled) {
    logger.warn('Web push not enabled - skipping notification');
    return { success: false, reason: 'web_push_disabled' };
  }

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { success: true };
  } catch (err) {
    logger.error('Failed to send web push notification', { 
      error: err.message,
      statusCode: err.statusCode,
      endpoint: subscription?.endpoint 
    });

    // Handle specific error cases
    if (err.statusCode === 410) { // Gone
      return { success: false, reason: 'expired' };
    } else if (err.statusCode === 404 || err.statusCode === 400) { // Not found
      return { success: false, reason: 'invalid' };
    } else if (err.statusCode === 429) { // Too many requests
      return { success: false, reason: 'rate_limited' };
    }

    return { success: false, reason: 'unknown_error' };
  }
};

module.exports = {
  sendWebPushNotification,
    isWebPushEnabled,
    publicKey: process.env.VAPID_PUBLIC_KEY
};