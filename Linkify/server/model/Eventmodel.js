const mongoose = require('mongoose');
const { Schema } = mongoose;

const eventSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true },
  image: {
    public_id: String,
    url: String
  },
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, required: true },
  isTrending: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for expiration
eventSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to get trending events
eventSchema.statics.getTrendingEvents = async function() {
  return this.aggregate([
    {
      $lookup: {
        from: 'votes',
        localField: '_id',
        foreignField: 'event',
        as: 'votes'
      }
    },
    {
      $addFields: {
        upvotes: {
          $size: {
            $filter: {
              input: '$votes',
              as: 'vote',
              cond: { $eq: ['$$vote.type', 'up'] }
            }
          }
        },
        downvotes: {
          $size: {
            $filter: {
              input: '$votes',
              as: 'vote',
              cond: { $eq: ['$$vote.type', 'down'] }
            }
          }
        }
      }
    },
    {
      $addFields: {
        score: { $subtract: ['$upvotes', '$downvotes'] }
      }
    },
    { $sort: { score: -1, createdAt: -1 } },
    { $limit: 5 }
  ]);
};

module.exports = mongoose.model('Event', eventSchema);