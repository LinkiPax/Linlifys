const express = require('express');
const Notification = require('../model/notificationschema'); // Import the Notification model
const router = express.Router();
const checkForAuthenticationHeader = require('../middleware/Authentication');
const { body, param, validationResult } = require('express-validator'); // For request validation
const cookieParser = require('cookie-parser');
const logger = require('../utils/logger'); // Custom logger (optional)

router.use(cookieParser());

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// 1. Create a new notification for a user and their connections
router.post(
  '/create',
  checkForAuthenticationHeader(),
  [
    body('userId').isMongoId().withMessage('Invalid user ID'),
    body('notificationText').isString().trim().notEmpty().withMessage('Notification text is required'),
    body('connections').isArray().withMessage('Connections must be an array'),
    body('connections.*').isMongoId().withMessage('Invalid connection ID'),
  ],
  handleValidationErrors,
  async (req, res) => {
    const { userId, notificationText, connections } = req.body;

    try {
      // Create a notification for the user who made the post
      const newNotification = new Notification({
        userId,
        notification: notificationText,
        status: 'unread',
        date: new Date(),
      });

      // Save the notification for the user making the post
      await newNotification.save();

      // Create notifications for each connection (follower) of the user
      const connectionNotifications = connections.map((connectionId) => ({
        userId: connectionId,
        notification: `User ${userId} has made a new post!`,
        status: 'unread',
        date: new Date(),
      }));

      // Use bulk insert for better performance
      await Notification.insertMany(connectionNotifications);

      logger.info('Notifications created successfully for the user and their connections.');
      res.status(201).json({ message: 'Notifications created successfully.' });
    } catch (error) {
      logger.error('Failed to create notification:', error);
      res.status(500).json({ error: 'Failed to create notification.' });
    }
  }
);

// 2. Mark a notification as read
router.patch(
  '/mark-as-read/:notificationId',
  checkForAuthenticationHeader(),
  [param('notificationId').isMongoId().withMessage('Invalid notification ID')],
  handleValidationErrors,
  async (req, res) => {
    const { notificationId } = req.params;

    try {
      const notification = await Notification.findById(notificationId);
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found.' });
      }

      // Update the notification status to 'read'
      await Notification.findByIdAndUpdate(notificationId, { status: 'read' });
      res.status(200).json({ message: 'Notification marked as read.' });
    } catch (error) {
      logger.error('Failed to mark notification as read:', error);
      res.status(500).json({ error: 'Failed to mark notification as read.' });
    }
  }
);

// 3. Mark multiple notifications as read
router.patch(
  '/mark-as-read',
  checkForAuthenticationHeader(),
  [body('notificationIds').isArray().withMessage('Notification IDs must be an array')],
  handleValidationErrors,
  async (req, res) => {
    const { notificationIds } = req.body;

    try {
      await Notification.updateMany(
        { _id: { $in: notificationIds } },
        { $set: { status: 'read' } }
      );
      res.status(200).json({ message: 'Notifications marked as read.' });
    } catch (error) {
      logger.error('Failed to mark notifications as read:', error);
      res.status(500).json({ error: 'Failed to mark notifications as read.' });
    }
  }
);

// 4. Get all notifications for a user (with pagination)
router.get(
  '/all',
  checkForAuthenticationHeader(),
  async (req, res) => {
    const { page = 1, limit = 10 } = req.query; // Pagination parameters
    const userId = req.user.userId;

    try {
      const notifications = await Notification.find({ userId })
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      res.status(200).json({ notifications });
    } catch (error) {
      logger.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Error fetching notifications' });
    }
  }
);

// 5. Get filtered notifications (read/unread)
router.get(
  '/:filter',
  checkForAuthenticationHeader(),
  [param('filter').isIn(['read', 'unread']).withMessage('Invalid filter')],
  handleValidationErrors,
  async (req, res) => {
    const { filter } = req.params;
    const userId = req.user.userId;

    try {
      let query = { userId };
      if (filter === 'read' || filter === 'unread') {
        query.status = filter;
      }

      const notifications = await Notification.find(query).sort({ date: -1 });
      res.status(200).json({ notifications });
    } catch (error) {
      logger.error('Error fetching filtered notifications:', error);
      res.status(500).json({ message: 'Error fetching notifications' });
    }
  }
);
// 6. Clear all notifications for a user
router.delete(
  '/clear-all',
  checkForAuthenticationHeader(),
  async (req, res) => {
    const userId = req.user.userId; // Get the authenticated user's ID

    try {
      // Delete all notifications for the user
      await Notification.deleteMany({ userId });
      res.status(200).json({ message: 'All notifications cleared successfully.' });
    } catch (error) {
      logger.error('Failed to clear notifications:', error);
      res.status(500).json({ error: 'Failed to clear notifications.' });
    }
  }
);
module.exports = router;