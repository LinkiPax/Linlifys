const webpush = require('web-push');
const logger = require('../utils/logger');
const User = require('../model/usermodel');
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

const normalizePayload = (payload = {}) => ({
  title: payload.title || 'Linkipax',
  body: payload.body || payload.message || 'You have a new notification',
  icon: payload.icon || '/Logo.png',
  badge: payload.badge || '/favicon.ico',
  tag: payload.tag,
  url: payload.url || payload.data?.url || '/notifications',
  requireInteraction: Boolean(payload.requireInteraction),
  data: {
    ...(payload.data || {}),
    url: payload.url || payload.data?.url || '/notifications'
  }
});

const sendWebPushNotification = async (subscription, payload) => {
  if (!isWebPushEnabled) {
    logger.warn('Web push not enabled - skipping notification');
    return { success: false, reason: 'web_push_disabled' };
  }

  if (!subscription?.endpoint) {
    return { success: false, reason: 'invalid' };
  }

  try {
    await webpush.sendNotification(subscription, JSON.stringify(normalizePayload(payload)), {
      TTL: 60 * 60 * 24,
      urgency: payload.urgency || 'high'
    });
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

const sendWebPushToUser = async (userId, payload) => {
  const user = await User.findById(userId).select('pushSubscription pushEnabled');

  if (!user?.pushEnabled || !user?.pushSubscription) {
    return { success: false, reason: 'not_subscribed' };
  }

  const result = await sendWebPushNotification(user.pushSubscription, payload);

  if (!result.success && ['expired', 'invalid'].includes(result.reason)) {
    await User.findByIdAndUpdate(userId, {
      $unset: { pushSubscription: 1 },
      $set: { pushEnabled: false }
    });
  }

  return result;
};

module.exports = {
  sendWebPushNotification,
  sendWebPushToUser,
  isWebPushEnabled,
  publicKey: process.env.VAPID_PUBLIC_KEY
};
