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

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    likes: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },

    comments: [
      {
        content: { type: String, required: true, trim: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    tags: { type: [String], default: [] },
    category: { type: String, trim: true },
    isPublic: { type: Boolean, default: true },
    postType: {
      type: String,
      enum: ['text', 'image', 'video', 'poll', 'link'],
      default: 'text',
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

module.exports = mongoose.model('Post', postSchema);
