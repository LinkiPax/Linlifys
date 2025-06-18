const mongoose = require('mongoose');
const { Schema } = mongoose;

const notificationSchema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    index: true 
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
    default: 'New Notification' // Add default value
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters'],
    default: 'You have a new notification' // Add default value
  },
  type: {
    type: String,
    enum: ['system', 'message', 'alert', 'success', 'warning', 'info', 'friend_request', 'post', 'comment', 'like'],
    default: 'info'
  },
  status: {
    type: String,
    enum: ['unread', 'read', 'archived'],
    default: 'unread',
    index: true
  },
  priority: {
    type: Number,
    enum: [1, 2, 3], // 1=High, 2=Medium, 3=Low
    default: 2
  },
  actionUrl: {
    type: String,
    trim: true
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  relatedEntity: {
    type: Schema.Types.ObjectId,
    refPath: 'relatedEntityModel'
  },
  relatedEntityModel: {
    type: String,
    enum: ['Post', 'Comment', 'Message', 'User']
  },
  readAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Default expiry in 30 days
  },
  metadata: {
    type: Schema.Types.Mixed
  },
  pushSubscription: {
    type: Object,
    required: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
},
);

// Indexes
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ userId: 1, status: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtuals
notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Methods
notificationSchema.methods.markAsRead = function() {
  this.status = 'read';
  this.readAt = new Date();
  return this.save();
};

notificationSchema.methods.markAsUnread = function() {
  this.status = 'unread';
  this.readAt = undefined;
  return this.save();
};

notificationSchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

// Statics
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ userId, status: 'unread' });
};

notificationSchema.statics.getForUser = function(userId, options = {}) {
  const { limit = 20, skip = 0, status, type, sort = '-createdAt' } = options;
  
  const query = { userId };
  if (status) query.status = status;
  if (type) query.type = type;
  
  return this.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('sender', 'name avatar')
    .populate('relatedEntity');
};

module.exports = mongoose.model('Notification', notificationSchema);