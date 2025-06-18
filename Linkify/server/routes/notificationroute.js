const webpush = require('web-push');
const webPushService = require('../service/webPushService');
const express = require('express');
const Notification = require('../model/notificationschema');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { getIO }  = require('../socket/socketnadle');
const logger = require('../utils/logger');
const User = require('../model/usermodel'); // Adjust the path as needed

const validate = validations => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    const errors = validationResult(req);
    if (errors.isEmpty()) return next();
    res.status(400).json({ errors: errors.array() });
  };
};

// // Create notification
// router.post(
//   '/',
//   async (req, res) => {
//     try {
//       const notification = new Notification({
//         ...req.body,
//         createdBy: req.body.userId
//       });

//       await notification.save();
      
//       // Emit socket notification
//       socket.io.to(`user_${req.body.userId}`).emit('new_notification', notification);
      
//       // Send web push notification if subscription exists
//       const user = await User.findById(req.body.userId).select('pushSubscription');
//       if (user?.pushSubscription) {
//         const pushPayload = {
//           title: notification.title,
//           body: notification.message,
//           icon: '/icons/icon-192x192.png',
//           data: {
//             url: notification.actionUrl || '/notifications',
//             notificationId: notification._id.toString()
//           }
//         };

//         const pushResult = await webPushService.sendWebPushNotification(
//           user.pushSubscription,
//           pushPayload
//         );

//         if (pushResult === 'expired') {
//           // Remove expired subscription
//           await User.findByIdAndUpdate(req.body.userId, {
//             $unset: { pushSubscription: 1 }
//           });
//         }
//       }

//       res.status(201).json(notification);
//     } catch (err) {
//       logger.error('Notification creation failed', { error: err });
//       res.status(500).json({ error: 'Failed to create notification' });
//     }
//   }
// );
router.post('/', async (req, res) => {
  try {
    const { userId, title = 'New Notification', message = 'You have a new notification', type, actionUrl } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const notification = new Notification({
      userId,
      title: title || 'New Notification', // Fallback to default
      message: message || 'You have a new notification', // Fallback to default
      type: type || 'system',
      status: 'unread',
      actionUrl,
      createdBy: userId
    });

    await notification.save();
    
    // Emit real-time notification via socket.io
    getIO().to(`user_${userId}`).emit('new_notification', notification);
    
    // Send web push notification if user has subscription
    const user = await User.findById(userId).select('pushSubscription');
    if (user?.pushSubscription) {
      const pushPayload = {
        title: notification.title,
        body: notification.message,
        icon: '/icons/notification-icon.png',
        data: {
          url: notification.actionUrl || '/notifications',
          notificationId: notification._id.toString()
        }
      };

      try {
        await webPushService.sendWebPushNotification(
          user.pushSubscription,
          pushPayload
        );
      } catch (error) {
        console.error('Web push failed:', error);
        // Remove invalid subscription
        if (error.statusCode === 410) {
          await User.findByIdAndUpdate(userId, {
            $unset: { pushSubscription: 1 }
          });
        }
      }
    }

    res.status(201).json(notification);
  } catch (error) {
    console.error('Notification creation failed:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});
// Get notifications with filters
router.get(
  '/',
  validate([
    check('status').optional().isIn(['read', 'unread', 'archived']),
    check('type').optional().isIn(['system', 'message', 'alert', 'success', 'warning', 'info', 'friend_request', 'post', 'comment', 'like']),
    check('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    check('page').optional().isInt({ min: 1 }).toInt(),
    check('sort').optional().isIn(['newest', 'oldest', 'priority']),
    check('search').optional().trim().isLength({ max: 100 }),
    check('createdAt').optional()
  ]),
  async (req, res) => {
    try {
      const { userId, status, type, limit = 10, page = 1, sort = 'newest', search, createdAt } = req.query;
      
      if (!userId) {
        return res.status(400).json({ error: 'userId parameter is required' });
      }

      const skip = (page - 1) * limit;
      
      let sortOption;
      switch (sort) {
        case 'oldest': sortOption = { createdAt: 1 }; break;
        case 'priority': sortOption = { priority: -1, createdAt: -1 }; break;
        default: sortOption = { createdAt: -1 };
      }
      
      const query = { userId };
      if (status) query.status = status;
      if (type) query.type = type;
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { message: { $regex: search, $options: 'i' } }
        ];
      }
      if (createdAt) {
        try {
          const dateFilter = JSON.parse(createdAt);
          query.createdAt = {
            $gte: new Date(dateFilter.$gte),
            $lte: new Date(dateFilter.$lte)
          };
        } catch (err) {
          return res.status(400).json({ error: 'Invalid date filter format' });
        }
      }
      
      const notifications = await Notification.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limit);
      
      const total = await Notification.countDocuments(query);
      
      res.json({
        notifications,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit
        }
      });
    } catch (err) {
      logger.error('Failed to fetch notifications', { error: err });
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  }
);

// Get notification counts
router.get(
  '/count',
  async (req, res) => {
    try {
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ error: 'userId parameter is required' });
      }

      const counts = await Promise.all([
        Notification.countDocuments({ userId, status: 'unread' }),
        Notification.countDocuments({ userId })
      ]);
      
      res.json({
        unread: counts[0],
        total: counts[1]
      });
    } catch (err) {
      logger.error('Failed to get notification counts', { error: err });
      res.status(500).json({ error: 'Failed to get counts' });
    }
  }
);

// Mark notification as read
router.patch(
  '/:id/read',
  validate([
    check('id').isMongoId().withMessage('Invalid notification ID')
  ]),
  async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, userId },
        { status: 'read', readAt: new Date() },
        { new: true }
      );
      
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      
      res.json(notification);
    } catch (err) {
      logger.error('Failed to mark notification as read', { 
        error: err,
        notificationId: req.params.id 
      });
      res.status(500).json({ error: 'Failed to mark as read' });
    }
  }
);

// Mark all notifications as read
router.patch(
  '/read-all',
  async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      await Notification.updateMany(
        { userId, status: 'unread' },
        { status: 'read', readAt: new Date() }
      );
      
      res.json({ message: 'All notifications marked as read' });
    } catch (err) {
      logger.error('Failed to mark all as read', { error: err });
      res.status(500).json({ error: 'Failed to mark all as read' });
    }
  }
);

// Archive notification
router.patch(
  '/:id/archive',
  validate([
    check('id').isMongoId().withMessage('Invalid notification ID')
  ]),
  async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, userId },
        { status: 'archived' },
        { new: true }
      );
      
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      
      res.json(notification);
    } catch (err) {
      logger.error('Failed to archive notification', { 
        error: err,
        notificationId: req.params.id 
      });
      res.status(500).json({ error: 'Failed to archive' });
    }
  }
);

// Delete notification
router.delete(
  '/:id',
  validate([
    check('id').isMongoId().withMessage('Invalid notification ID')
  ]),
  async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      const notification = await Notification.findOneAndDelete({
        _id: req.params.id,
        userId
      });
      
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      
      res.json({ message: 'Notification deleted' });
    } catch (err) {
      logger.error('Failed to delete notification', { 
        error: err,
        notificationId: req.params.id 
      });
      res.status(500).json({ error: 'Failed to delete' });
    }
  }
);

// Clear all notifications
router.delete(
  '/',
  async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      await Notification.deleteMany({ userId });
      res.json({ message: 'All notifications cleared' });
    } catch (err) {
      logger.error('Failed to clear notifications', { error: err });
      res.status(500).json({ error: 'Failed to clear notifications' });
    }
  }
);

// Subscribe to push notifications
router.post(
  '/subscribe',
  validate([
    check('userId').isMongoId().withMessage('Invalid user ID'),
    check('subscription').isObject().withMessage('Invalid push subscription')
  ]),
  async (req, res) => {
    try {
      const { userId, subscription } = req.body;

      // Store subscription in database (you might want a separate UserPushSubscription model)
      await User.findByIdAndUpdate(userId, {
        pushSubscription: subscription
      });

      // Send test notification
      if (webPushService.isWebPushEnabled) {
        await webPushService.sendWebPushNotification(subscription, {
          title: 'Subscription successful',
          body: 'You will now receive push notifications',
          icon: '/icons/icon-192x192.png'
        });
      }

      res.status(200).json({ success: true });
    } catch (err) {
      logger.error('Push subscription failed', { error: err });
      res.status(500).json({ error: 'Failed to subscribe to push notifications' });
    }
  }
);

// Unsubscribe from push notifications
router.post(
  '/unsubscribe',
  validate([
    check('userId').isMongoId().withMessage('Invalid user ID')
  ]),
  async (req, res) => {
    try {
      const { userId } = req.body;

      await User.findByIdAndUpdate(userId, {
        $unset: { pushSubscription: 1 }
      });

      res.status(200).json({ success: true });
    } catch (err) {
      logger.error('Push unsubscribe failed', { error: err });
      res.status(500).json({ error: 'Failed to unsubscribe from push notifications' });
    }
  }
);
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: webPushService.publicKey });
});
// Add this near your other push notification routes
router.post(
  '/push-subscriptions',
  validate([
    check('userId').isMongoId().withMessage('Invalid user ID'),
    check('subscription').isObject().withMessage('Invalid push subscription')
  ]),
  async (req, res) => {
    try {
      const { userId, subscription } = req.body;

      // Validate the subscription object structure
      if (!subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
        return res.status(400).json({ error: 'Invalid subscription format' });
      }

      // Update user with new subscription
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { 
          pushSubscription: subscription,
          pushEnabled: true 
        },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Optionally send a welcome notification
      try {
        await webPushService.sendWebPushNotification(subscription, {
          title: 'Subscription successful',
          body: 'You will now receive push notifications from our app',
          icon: '/icons/notification-icon.png'
        });
      } catch (error) {
        console.error('Welcome push notification failed:', error);
        // Don't fail the request if the welcome notification fails
      }

      res.status(200).json({ 
        success: true,
        message: 'Push subscription saved successfully'
      });
    } catch (err) {
      logger.error('Push subscription failed', { 
        error: err,
        userId: req.body.userId 
      });
      res.status(500).json({ 
        error: 'Failed to save push subscription',
        details: err.message 
      });
    }
  }
);

module.exports = router;