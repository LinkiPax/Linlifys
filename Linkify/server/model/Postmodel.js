// const mongoose = require('mongoose');

// const postSchema = new mongoose.Schema( 
//   {
//     content: { type: String, required: true, trim: true },
//     imageUrl: { 
//       type: String, 
//       validate: { 
//         validator: (url) => /^https?:\/\/.+$/.test(url), 
//         message: 'Invalid URL' 
//       } 
//     },
//     createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
//     likes: { type: [String], default: [] },
//     createdAt: { type: Date, default: Date.now },
//   },
//   { 
//     timestamps: true, // Adds `createdAt` and `updatedAt`
//     indexes: [{ createdAt: 1 }] // Index `createdAt` for fast querying by date
//   }
// );

// module.exports = mongoose.model('Post', postSchema);
// const mongoose = require('mongoose');

// const postSchema = new mongoose.Schema(
//   {
//     title: { type: String, trim: true }, // Optional, helpful for analytics
//     content: { type: String, required: true, trim: true },

//     imageUrl: {
//       type: String,
//       validate: {
//         validator: function (v) {
//           if (!v || v.trim() === '') return true;
//           return /^https?:\/\/.+$/.test(v);
//         },
//         message: 'Invalid URL',
//       },
//       default: null,
//     },

//     createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

//     likes: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },

//     comments: [
//       {
//         content: { type: String, required: true, trim: true },
//         createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//         createdAt: { type: Date, default: Date.now },
//       },
//     ],

//     tags: { type: [String], default: [] },
//     category: { type: String, trim: true },
//     isPublic: { type: Boolean, default: true },
//     postType: {
//       type: String,
//       enum: ['text', 'image', 'video', 'poll', 'link'],
//       default: 'text',
//     },

//     metadata: {
//       wordCount: { type: Number },
//       hasMedia: { type: Boolean },
//       linkPreview: {
//         title: String,
//         description: String,
//         image: String,
//         url: String,
//       },
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// // Indexes for performance
// postSchema.index({ createdAt: -1 });
// postSchema.index({ tags: 1 });
// postSchema.index({ category: 1 });
// postSchema.index({ postType: 1 });
// postSchema.index({ isPublic: 1 });

// module.exports = mongoose.model('Post', postSchema);
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true }, // Optional, helpful for analytics
    content: { type: String, required: true, trim: true },

    imageUrl: {
      type: String,
      validate: {
        validator: function (v) {
          if (!v || v.trim() === '') return true;
          return /^https?:\/\/.+$/.test(v);
        },
        message: 'Invalid URL',
      },
      default: null,
    },
    
    videoUrl: {
      type: String,
      validate: {
        validator: function (v) {
          if (!v || v.trim() === '') return true;
          return /^https?:\/\/.+$/.test(v);
        },
        message: 'Invalid URL',
      },
      default: null,
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    likes: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
    
    bookmarks: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
    
    reposts: { type: Number, default: 0 },
    
    repostedBy: [{ 
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      comment: String,
      createdAt: { type: Date, default: Date.now }
    }],
    
    repostedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    
    repostComment: { type: String, trim: true },

    comments: [
  {
    content: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
    hasGif: { type: Boolean, default: false }, // Add this field
  },
],

    tags: { type: [String], default: [] },
    category: { type: String, trim: true },
    isPublic: { type: Boolean, default: true },
    postType: {
      type: String,
      enum: ['text', 'image', 'video', 'poll', 'link', 'repost'],
      default: 'text',
    },
    
    poll: {
      question: { type: String, trim: true },
      options: [{
        text: { type: String, required: true, trim: true },
        votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
      }],
      totalVotes: { type: Number, default: 0 },
      endTime: { type: Date }
    },

    metadata: {
      wordCount: { type: Number },
      hasMedia: { type: Boolean },
      linkPreview: {
        title: String,
        description: String,
        image: String,
        url: String,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
postSchema.index({ createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ category: 1 });
postSchema.index({ postType: 1 });
postSchema.index({ isPublic: 1 });
postSchema.index({ bookmarks: 1 });
postSchema.index({ repostedFrom: 1 });
postSchema.index({ 'poll.endTime': 1 });

// Virtual for checking if a post is a repost
postSchema.virtual('isRepost').get(function() {
  return this.repostedFrom !== undefined;
});

// Method to check if a user has bookmarked this post
postSchema.methods.hasBookmarked = function(userId) {
  return this.bookmarks.includes(userId);
};

// Method to check if a user has reposted this post
postSchema.methods.hasReposted = function(userId) {
  return this.repostedBy.some(repost => repost.user.toString() === userId.toString());
};

// Method to check if a user has voted in a poll
postSchema.methods.hasVoted = function(userId) {
  if (!this.poll || !this.poll.options) return false;
  return this.poll.options.some(option => 
    option.votes.some(vote => vote.toString() === userId.toString())
  );
};

module.exports = mongoose.model('Post', postSchema);