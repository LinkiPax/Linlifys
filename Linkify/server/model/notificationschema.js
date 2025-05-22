const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    notification: { 
        type: String, 
        required: true,
        minlength: 1, // Ensure notification is not empty
        trim: true // Trim whitespace
    },
    type: { 
        type: String, 
        enum: ['info', 'warning', 'alert', 'reminder'], // Example types
        default: 'info' 
    },
    status: { 
        type: String, 
        required: true, 
        enum: ['unread', 'read'], 
        default: 'unread' 
    },
    date: { 
        type: Date, 
        required: true,
        default: Date.now // Default to current date
    },
    expiryDate: { 
        type: Date, 
        required: false // Optional expiry date
    },
    priority: { 
        type: String, 
        enum: ['low', 'medium', 'high'], 
        default: 'medium' 
    },
    metadata: { 
        type: mongoose.Schema.Types.Mixed, 
        required: false // Optional metadata
    }
}, { 
    timestamps: true 
});

// Indexes for better query performance
notificationSchema.index({ userId: 1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ date: -1 }); // Index for sorting by date

// Virtual for checking if the notification is expired
notificationSchema.virtual('isExpired').get(function() {
    return this.expiryDate && this.expiryDate < new Date();
});

// Method to mark notification as read
notificationSchema.methods.markAsRead = function() {
    this.status = 'read';
    return this.save();
};

// Method to mark notification as unread
notificationSchema.methods.markAsUnread = function() {
    this.status = 'unread';
    return this.save();
};

module.exports = mongoose.model('Notification', notificationSchema);