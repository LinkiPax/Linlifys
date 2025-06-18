const mongoose = require('mongoose');
const validator = require('validator');

const hackathonSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
    minlength: [5, 'Name must be at least 5 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  },
  organizer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  coOrganizers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  description: { 
    type: String, 
    required: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [200, 'Short description cannot exceed 200 characters']
  },
  startDate: { 
    type: Date, 
    required: true,
    validate: {
      validator: function(value) {
        return value > Date.now();
      },
      message: 'Start date must be in the future'
    }
  },
  endDate: { 
    type: Date, 
    required: true,
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  registrationDeadline: {
    type: Date,
    validate: {
      validator: function(value) {
        return value < this.startDate;
      },
      message: 'Registration must close before hackathon starts'
    }
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  location: {
    type: {
      type: String,
      enum: ['online', 'in-person', 'hybrid'],
      default: 'online'
    },
    address: String,
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },
  website: {
    type: String,
    validate: [validator.isURL, 'Please provide a valid URL']
  },
  tags: {
    type: [String],
    validate: {
      validator: function(tags) {
        return tags.length <= 10;
      },
      message: 'Cannot have more than 10 tags'
    }
  },
  tracks: [{
    name: String,
    description: String
  }],
  prizePool: {
    type: Number,
    min: 0
  },
  prizes: [{
    name: String,
    description: String,
    value: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    winners: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    }]
  }],
  maxParticipants: {
    type: Number,
    min: 1
  },
  maxTeamSize: {
    type: Number,
    min: 1,
    max: 10,
    default: 4
  },
  minTeamSize: {
    type: Number,
    min: 1,
    default: 1
  },
  participationType: {
    type: String,
    enum: ['individual', 'team', 'both'],
    default: 'both'
  },
  eligibility: {
    minAge: {
      type: Number,
      min: 13
    },
    maxAge: Number,
    countries: [String],
    studentOnly: Boolean,
    newCodersOnly: Boolean
  },
  requirements: {
    githubRepo: Boolean,
    demoVideo: Boolean,
    presentation: Boolean,
    liveDemo: Boolean
  },
  judgingCriteria: [{
    name: String,
    description: String,
    weight: {
      type: Number,
      min: 0,
      max: 100
    }
  }],
  resources: [{
    name: String,
    url: String,
    type: {
      type: String,
      enum: ['documentation', 'api', 'dataset', 'tutorial', 'other']
    }
  }],
  schedule: [{
    title: String,
    description: String,
    startTime: Date,
    endTime: Date,
    type: {
      type: String,
      enum: ['workshop', 'keynote', 'networking', 'submission', 'other']
    },
    speakers: [{
      name: String,
      affiliation: String,
      photo: String
    }]
  }],
  sponsors: [{
    name: String,
    tier: {
      type: String,
      enum: ['platinum', 'gold', 'silver', 'bronze']
    },
    logo: String,
    website: String
  }],
  media: {
    coverImage: String,
    thumbnail: String,
    gallery: [String]
  },
  socialLinks: {
    twitter: String,
    linkedin: String,
    instagram: String,
    discord: String,
    slack: String
  },
  teams: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Team' 
  }],
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['registered', 'checked-in', 'submitted', 'winner'],
      default: 'registered'
    }
  }],
  verified: { 
    type: Boolean, 
    default: false 
  },
  featured: {
    type: Boolean,
    default: false
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'invite-only'],
    default: 'public'
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'],
    default: 'draft'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date,
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for duration in days
hackathonSchema.virtual('durationInDays').get(function() {
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
});

// Indexes for better performance
hackathonSchema.index({ name: 'text', description: 'text', tags: 'text' });
hackathonSchema.index({ startDate: 1 });
hackathonSchema.index({ endDate: 1 });
hackathonSchema.index({ status: 1 });

// Pre-save hook to generate slug
hackathonSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }
  next();
});

// Query helper for active hackathons
hackathonSchema.query.active = function() {
  return this.where({ 
    status: { $in: ['published', 'ongoing'] },
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() }
  });
};

// Static method to get upcoming hackathons
hackathonSchema.statics.upcoming = function() {
  return this.find({ 
    status: 'published',
    startDate: { $gt: new Date() }
  }).sort({ startDate: 1 });
};

// Instance method to check if registration is open
hackathonSchema.methods.isRegistrationOpen = function() {
  return this.status === 'published' && 
         (!this.registrationDeadline || new Date() < this.registrationDeadline) &&
         new Date() < this.startDate;
};

module.exports = mongoose.model('Hackathon', hackathonSchema);