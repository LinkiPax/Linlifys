// // const express = require('express');
// // const router = express.Router();
// // const Post = require('../model/Postmodel');
// // const mongoose = require('mongoose');
// // const Notification = require('../model/notificationschema');
// // const User = require('../model/usermodel');
// // const { io } = require('../server'); // Importing io from server.js
// // // Get all posts with pagination
// // router.get('/', async (req, res) => {
// //   try {
// //     const { page = 1, limit = 10 } = req.query; // Default to page 1 and limit 10
// //     const skip = (page - 1) * limit;

// //     const posts = await Post.find()
// //       .populate('createdBy', 'name profilePicture')
// //       .sort({ createdAt: -1 }) // Most recent first
// //       .skip(skip) // Skip posts based on page
// //       .limit(Number(limit)); // Limit the number of posts per page

// //     res.json(posts);
// //   } catch (error) {
// //     console.error('Error fetching posts:', error); // Log the error for debugging
// //     res.status(500).json({ error: 'Failed to fetch posts', details: error.message });
// //   }
// // });

// // // Get posts by user ID
// // router.get('/user/:userId', async (req, res) => {
// //   try {
// //     const { userId } = req.params;
// //     const posts = await Post.find({ createdBy: userId })
// //       .populate('createdBy', 'name profilePicture')
// //       .sort({ createdAt: -1 }); // Most recent first

// //     res.json(posts);
// //   } catch (error) {
// //     console.error('Error fetching posts by user ID:', error); // Log the error for debugging
// //     res.status(500).json({ error: 'Failed to fetch posts by user ID', details: error.message });
// //   }
// // });
// // // Create a new post
// // router.post('/', async (req, res) => {
// //   try {
// //     const { content, imageUrl, createdBy } = req.body;
    
// //     // Validate input
// //     if (!content || !createdBy) {
// //       return res.status(400).json({ error: 'Content and CreatedBy are required' });
// //     }
    
// //     if (imageUrl && !/^https?:\/\/.+$/.test(imageUrl)) {
// //       return res.status(400).json({ error: 'Invalid image URL' });
// //     }
    
// //     if (!mongoose.Types.ObjectId.isValid(createdBy)) {
// //       return res.status(400).json({ error: 'Invalid user ID' });
// //     }
    
// //     const newPost = new Post({ content, imageUrl, createdBy });
// //     const savedPost = await newPost.save();
    
// //     // Create a notification for the new post
// //     const newNotification = new Notification({
// //       userId: createdBy, 
// //       notification: 'A new post has been created!',
// //       date: new Date(),
// //     });
    
// //     await newNotification.save(); 
    
// //     // Emit a new notification to all connected clients
// //     io.emit('new_notification', newNotification);
    
// //     res.status(201).json(savedPost);
// //   } catch (error) {
// //     console.error('Error creating post:', error);
// //     res.status(500).json({ error: 'Failed to create post', details: error.message });
// //   }
// // });
// // router.post("/like/:postId", async (req, res) => {
// //   try {
// //     const { postId } = req.params;
// //     const { userId } = req.body;
    
// //     console.log("Received like request for post:", postId, "by user:", userId);
    
// //     if (!mongoose.Types.ObjectId.isValid(postId)) {
// //       return res.status(400).json({ message: "Invalid post ID" });
// //     }

// //     if (!mongoose.Types.ObjectId.isValid(userId)) {
// //       return res.status(400).json({ message: "Invalid user ID" });
// //     }
    
// //     const post = await Post.findById(postId);
// //     if (!post) {
// //       return res.status(404).json({ message: "Post not found" });
// //     }
    
// //     post.likes = post.likes || [];
    
// //     const isLiked = post.likes.includes(userId.toString());
    
// //     if (isLiked) {
// //       post.likes = post.likes.filter((id) => id !== userId.toString());
// //     } else {
// //       post.likes.push(userId.toString());
// //     }

// //     await post.save();
    
// //     res.json({ likes: post.likes.length, liked: !isLiked });
// //   } catch (error) {
// //     console.error("Error in like API:", error);
// //     res.status(500).json({ message: "Server Error" });
// //   }
// // });

// // module.exports = router;

// // Create a new post
// // router.post('/', async (req, res) => {
// //   try {
// //     const { content, imageUrl, createdBy } = req.body;

// //     // Validate input
// //     if (!content || !createdBy) {
// //       return res.status(400).json({ error: 'Content and CreatedBy are required' });
// //     }

// //     // Validate imageUrl if provided
// //     if (imageUrl && !/^https?:\/\/.+$/.test(imageUrl)) {
// //       return res.status(400).json({ error: 'Invalid image URL' });
// //     }

// //     // Validate that createdBy is a valid ObjectId
// //     if (!mongoose.Types.ObjectId.isValid(createdBy)) {
// //       return res.status(400).json({ error: 'Invalid user ID' });
// //     }

// //     const newPost = new Post({ content, imageUrl, createdBy });
// //     const savedPost = await newPost.save();

// //     res.status(201).json(savedPost);
// //   } catch (error) {
// //     console.error('Error creating post:', error); // Log the error for debugging
// //     res.status(500).json({ error: 'Failed to create post', details: error.message });
// //   }
// // });
// const express = require('express');
// const mongoose = require('mongoose');
// const router = express.Router();
// const Post = require('../model/Postmodel');
// const Notification = require('../model/notificationschema');
// const { io } = require('../server');

// // Get all posts with optional filters and pagination
// router.get('/', async (req, res) => {
//   try {
//     const page = Math.max(1, parseInt(req.query.page)) || 1;
//     const limit = Math.max(1, parseInt(req.query.limit)) || 10;
//     const skip = (page - 1) * limit;
//     const { category, tag } = req.query;
//     const isPublic = req.query.isPublic === undefined ? true : req.query.isPublic === 'true';

//     const filter = {
//       ...(category && { category }),
//       ...(tag && { tags: { $in: [tag] } }),
//       isPublic
//     };

//     const posts = await Post.find(filter)
//       .populate('createdBy', 'name profilePicture')
//       .populate('comments.createdBy', 'name profilePicture')
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit);

//     res.json(posts);
//   } catch (error) {
//     console.error('Error fetching posts:', error);
//     res.status(500).json({ error: 'Failed to fetch posts', details: error.message });
//   }
// });


// // Get posts by a specific user
// router.get('/user/:userId', async (req, res) => {
//   try {
//     const { userId } = req.params;
//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return res.status(400).json({ error: 'Invalid user ID' });
//     }

//     const posts = await Post.find({ createdBy: userId })
//       .populate('createdBy', 'name profilePicture')
//       .populate('comments.createdBy', 'name profilePicture')
//       .sort({ createdAt: -1 });

//     res.json(posts);
//   } catch (error) {
//     console.error('Error fetching posts by user:', error);
//     res.status(500).json({ error: 'Failed to fetch user posts', details: error.message });
//   }
// });

// // Create a new post
// router.post('/', async (req, res) => {
//   try {
//     const {
//       title,
//       content,
//       imageUrl,
//       createdBy,
//       tags,
//       category,
//       isPublic,
//       postType,
//       metadata,
//     } = req.body;

//     if (!content || !createdBy) {
//       return res.status(400).json({ error: 'Content and CreatedBy are required' });
//     }

//     if (!mongoose.Types.ObjectId.isValid(createdBy)) {
//       return res.status(400).json({ error: 'Invalid user ID' });
//     }

//     const newPost = new Post({
//       title,
//       content,
//       imageUrl,
//       createdBy,
//       tags,
//       category,
//       isPublic,
//       postType,
//       metadata,
//     });

//     const savedPost = await newPost.save();

//     const notification = new Notification({
//       userId: createdBy,
//       notification: 'A new post has been created!',
//       date: new Date(),
//     });

//     await notification.save();
//     io?.emit('new_notification', notification);

//     res.status(201).json(savedPost);
//   } catch (error) {
//     console.error('Error creating post:', error);
//     res.status(500).json({ error: 'Failed to create post', details: error.message });
//   }
// });

// // Update a post
// router.put('/:postId', async (req, res) => {
//   try {
//     const { postId } = req.params;
//     const updateFields = req.body;

//     if (!mongoose.Types.ObjectId.isValid(postId)) {
//       return res.status(400).json({ error: 'Invalid post ID' });
//     }

//     const updatedPost = await Post.findByIdAndUpdate(postId, updateFields, {
//       new: true,
//       runValidators: true,
//     }).populate('createdBy', 'name profilePicture');

//     if (!updatedPost) return res.status(404).json({ error: 'Post not found' });

//     res.status(200).json(updatedPost);
//   } catch (error) {
//     console.error('Error updating post:', error);
//     res.status(500).json({ error: 'Failed to update post', details: error.message });
//   }
// });

// // Delete a post
// router.delete('/:postId', async (req, res) => {
//   try {
//     const { postId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(postId)) {
//       return res.status(400).json({ error: 'Invalid post ID' });
//     }

//     const deletedPost = await Post.findByIdAndDelete(postId);
//     if (!deletedPost) return res.status(404).json({ error: 'Post not found' });

//     res.status(200).json({ message: 'Post deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting post:', error);
//     res.status(500).json({ error: 'Failed to delete post', details: error.message });
//   }
// });

// // Like or unlike a post
// router.post('/like/:postId', async (req, res) => {
//   try {
//     const { postId } = req.params;
//     const { userId } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(userId)) {
//       return res.status(400).json({ message: 'Invalid post or user ID' });
//     }

//     const post = await Post.findById(postId);
//     if (!post) return res.status(404).json({ message: 'Post not found' });

//     const userIdStr = userId.toString();
//     const isLiked = post.likes.includes(userIdStr);

//     post.likes = isLiked
//       ? post.likes.filter(id => id.toString() !== userIdStr)
//       : [...post.likes, userIdStr];

//     await post.save();
//     res.json({ likes: post.likes.length, liked: !isLiked });
//   } catch (error) {
//     console.error('Error liking post:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Add a comment to a post
// router.post('/:postId/comment', async (req, res) => {
//   try {
//     const { postId } = req.params;
//     const { content, createdBy } = req.body;

//     if (!content || !createdBy) {
//       return res.status(400).json({ error: 'Content and CreatedBy are required' });
//     }

//     const post = await Post.findById(postId);
//     if (!post) return res.status(404).json({ error: 'Post not found' });

//     const newComment = { content, createdBy };
//     post.comments.push(newComment);
//     await post.save();

//     const populatedPost = await Post.findById(postId).populate('comments.createdBy', 'name profilePicture');
//     const addedComment = populatedPost.comments.find(
//       comment => comment.content === content && comment.createdBy._id.toString() === createdBy
//     );

//     const notification = new Notification({
//       userId: post.createdBy,
//       notification: 'A new comment has been added to your post!',
//       date: new Date(),
//     });

//     await notification.save();
//     io?.emit('new_notification', notification);

//     res.status(201).json(addedComment);
//   } catch (error) {
//     console.error('Error adding comment:', error);
//     res.status(500).json({ error: 'Failed to add comment', details: error.message });
//   }
// });

// // Update a comment
// router.put('/:postId/comment/:commentId', async (req, res) => {
//   try {
//     const { postId, commentId } = req.params;
//     const { content } = req.body;

//     if (!content) return res.status(400).json({ error: 'Content is required' });

//     const post = await Post.findById(postId).populate('comments.createdBy', 'name profilePicture');
//     if (!post) return res.status(404).json({ error: 'Post not found' });

//     const comment = post.comments.id(commentId);
//     if (!comment) return res.status(404).json({ error: 'Comment not found' });

//     comment.content = content;
//     await post.save();

//     res.status(200).json(comment);
//   } catch (error) {
//     console.error('Error updating comment:', error);
//     res.status(500).json({ error: 'Failed to update comment', details: error.message });
//   }
// });


// // DELETE comment by commentId from a post by postId
// // Delete comment from post
// router.delete('/:postId/comment/:commentId', async (req, res) => {
//   try {
//     const { postId, commentId } = req.params;

//     const post = await Post.findById(postId);
//     if (!post) {
//       return res.status(404).json({ message: 'Post not found' });
//     }

//     // Find the index of the comment to remove
//     const commentIndex = post.comments.findIndex(
//       comment => comment._id.toString() === commentId
//     );

//     if (commentIndex === -1) {
//       return res.status(404).json({ message: 'Comment not found' });
//     }

//     // Remove the comment from the array
//     post.comments.splice(commentIndex, 1);

//     // Save the updated post
//     await post.save();

//     res.status(200).json({ message: 'Comment deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting comment:', error);
//     res.status(500).json({ message: 'Failed to delete comment', error: error.message });
//   }
// });

// // Get all comments for a post
// router.get('/get/:postId/comments', async (req, res) => {
//   try {
//     const { postId } = req.params;
//     const post = await Post.findById(postId).populate('comments.createdBy', 'name profilePicture');
//     if (!post) return res.status(404).json({ error: 'Post not found' });

//     res.status(200).json(post.comments);
//   } catch (error) {
//     console.error('Error fetching comments:', error);
//     res.status(500).json({ error: 'Failed to fetch comments', details: error.message });
//   }
// });

// module.exports = router;
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Post = require('../model/Postmodel');
const Notification = require('../model/notificationschema');
const { io } = require('../server');
const API_KEY = process.env.TENOR_API_KEY 
const axios = require('axios');
// Get all posts with optional filters and pagination
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page)) || 1;
    const limit = Math.max(1, parseInt(req.query.limit)) || 10;
    const skip = (page - 1) * limit;
    const { category, tag } = req.query;
    const isPublic = req.query.isPublic === undefined ? true : req.query.isPublic === 'true';

    const filter = {
      ...(category && { category }),
      ...(tag && { tags: { $in: [tag] } }),
      isPublic
    };

    const posts = await Post.find(filter)
      .populate('createdBy', 'name profilePicture')
      .populate('comments.createdBy', 'name profilePicture')
      .populate('repostedFrom', 'content createdBy imageUrl videoUrl')
      .populate('repostedBy.user', 'name profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts', details: error.message });
  }
});

// Get posts by a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const posts = await Post.find({ createdBy: userId })
      .populate('createdBy', 'name profilePicture')
      .populate('comments.createdBy', 'name profilePicture')
      .populate('repostedFrom', 'content createdBy imageUrl videoUrl')
      .populate('repostedBy.user', 'name profilePicture')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts by user:', error);
    res.status(500).json({ error: 'Failed to fetch user posts', details: error.message });
  }
});

// Create a new post
router.post('/', async (req, res) => {
  try {
    const {
      title,
      content,
      imageUrl,
      videoUrl,
      createdBy,
      tags,
      category,
      isPublic,
      postType,
      metadata,
      poll
    } = req.body;

    if (!content || !createdBy) {
      return res.status(400).json({ error: 'Content and CreatedBy are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(createdBy)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const newPost = new Post({
      title,
      content,
      imageUrl,
      videoUrl,
      createdBy,
      tags,
      category,
      isPublic,
      postType,
      metadata,
      poll
    });

    const savedPost = await newPost.save();

    const notification = new Notification({
      userId: createdBy,
      notification: 'A new post has been created!',
      date: new Date(),
    });

    await notification.save();
    io?.emit('new_notification', notification);

    res.status(201).json(savedPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post', details: error.message });
  }
});

// Update a post
router.put('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const updateFields = req.body;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const updatedPost = await Post.findByIdAndUpdate(postId, updateFields, {
      new: true,
      runValidators: true,
    })
      .populate('createdBy', 'name profilePicture')
      .populate('repostedFrom', 'content createdBy imageUrl videoUrl');

    if (!updatedPost) return res.status(404).json({ error: 'Post not found' });

    res.status(200).json(updatedPost);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Failed to update post', details: error.message });
  }
});

// Delete a post
router.delete('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const deletedPost = await Post.findByIdAndDelete(postId);
    if (!deletedPost) return res.status(404).json({ error: 'Post not found' });

    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post', details: error.message });
  }
});

// Like or unlike a post
router.post('/like/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid post or user ID' });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const userIdStr = userId.toString();
    const isLiked = post.likes.includes(userIdStr);

    post.likes = isLiked
      ? post.likes.filter(id => id.toString() !== userIdStr)
      : [...post.likes, userIdStr];

    await post.save();
    
    // Create notification if liked (and not by the post owner)
    if (!isLiked && post.createdBy.toString() !== userId) {
      const notification = new Notification({
        userId: post.createdBy,
        notification: 'Your post was liked!',
        date: new Date(),
      });
      await notification.save();
      io?.emit('new_notification', notification);
    }

    res.json({ 
      likes: post.likes.length, 
      liked: !isLiked,
      likesList: post.likes 
    });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bookmark a post
router.post('/bookmark/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid post or user ID' });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const isBookmarked = post.bookmarks.includes(userId);

    if (isBookmarked) {
      // Remove bookmark
      post.bookmarks = post.bookmarks.filter(id => id.toString() !== userId);
    } else {
      // Add bookmark
      post.bookmarks.push(userId);
    }

    await post.save();
    res.json({ bookmarked: !isBookmarked });
  } catch (error) {
    console.error('Error bookmarking post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's bookmarked posts
router.get('/bookmarks/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const posts = await Post.find({ bookmarks: userId })
      .populate('createdBy', 'name profilePicture')
      .populate('comments.createdBy', 'name profilePicture')
      .populate('repostedFrom', 'content createdBy imageUrl videoUrl')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    console.error('Error fetching bookmarked posts:', error);
    res.status(500).json({ error: 'Failed to fetch bookmarked posts', details: error.message });
  }
});

// Repost a post
router.post('/repost/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid post or user ID' });
    }

    const originalPost = await Post.findById(postId);
    if (!originalPost) return res.status(404).json({ message: 'Post not found' });

    // Check if user already reposted
    const alreadyReposted = originalPost.repostedBy.some(repost => 
      repost.user.toString() === userId
    );

    if (alreadyReposted) {
      return res.status(400).json({ message: 'You have already reposted this post' });
    }

    // Create a new post that's a repost
    const repost = new Post({
      content: originalPost.content,
      imageUrl: originalPost.imageUrl,
      videoUrl: originalPost.videoUrl,
      createdBy: userId,
      repostedFrom: postId,
      repostComment: comment,
      isPublic: true,
      postType: 'repost'
    });

    await repost.save();

    // Update original post repost stats
    originalPost.reposts += 1;
    originalPost.repostedBy.push({
      user: userId,
      comment: comment,
      createdAt: new Date()
    });

    await originalPost.save();

    // Create notification for the original post owner
    if (originalPost.createdBy.toString() !== userId) {
      const notification = new Notification({
        userId: originalPost.createdBy,
        notification: 'Your post was reposted!',
        date: new Date(),
      });

      await notification.save();
      io?.emit('new_notification', notification);
    }

    res.json({ 
      reposts: originalPost.reposts, 
      repostedByUser: true,
      repostId: repost._id 
    });
  } catch (error) {
    console.error('Error reposting:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get reposts for a post
router.get('/:postId/reposts', async (req, res) => {
  try {
    const { postId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const post = await Post.findById(postId)
      .populate('repostedBy.user', 'name profilePicture');
    
    if (!post) return res.status(404).json({ error: 'Post not found' });

    res.json(post.repostedBy);
  } catch (error) {
    console.error('Error fetching reposts:', error);
    res.status(500).json({ error: 'Failed to fetch reposts', details: error.message });
  }
});

// Vote on a poll
router.post('/poll/:postId/vote', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId, optionId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid post or user ID' });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (!post.poll) return res.status(400).json({ message: 'This post does not have a poll' });

    // Check if user already voted
    const alreadyVoted = post.poll.options.some(option => 
      option.votes.includes(userId)
    );

    if (alreadyVoted) {
      return res.status(400).json({ message: 'You have already voted on this poll' });
    }

    // Find the option and add the vote
    const option = post.poll.options.id(optionId);
    if (!option) return res.status(404).json({ message: 'Poll option not found' });

    option.votes.push(userId);
    post.poll.totalVotes += 1;

    await post.save();

    res.json({ poll: post.poll, voted: true });
  } catch (error) {
    console.error('Error voting on poll:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a comment to a post (with GIF support)
router.post('/:postId/comment', async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, createdBy, gifUrl } = req.body;

    // Validate input
    if (!createdBy) {
      return res.status(400).json({ error: 'CreatedBy is required' });
    }

    // Check if we have either text content or a GIF
    if ((!content || content.trim().length === 0) && !gifUrl) {
      return res.status(400).json({ error: 'Either comment content or GIF is required' });
    }

    // Validate content length if provided
    if (content && content.length > 1000) {
      return res.status(400).json({ error: 'Comment is too long (max 1000 characters)' });
    }

    // Validate GIF URL if provided
    if (gifUrl && !isValidUrl(gifUrl)) {
      return res.status(400).json({ error: 'Invalid GIF URL' });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Format the comment content - if we have both text and GIF, combine them
    let commentContent = content || '';
    if (gifUrl) {
      commentContent = commentContent ? `${commentContent} ![GIF](${gifUrl})` : `![GIF](${gifUrl})`;
    }

    const newComment = { 
      content: commentContent, 
      createdBy,
      hasGif: !!gifUrl
    };
    
    post.comments.push(newComment);
    await post.save();

    const populatedPost = await Post.findById(postId)
      .populate('comments.createdBy', 'name profilePicture')
      .populate('createdBy', 'name profilePicture');
    
    const addedComment = populatedPost.comments.find(
      comment => comment.content === commentContent && comment.createdBy._id.toString() === createdBy
    );

    // Create notification for the post owner (if not the commenter)
    if (post.createdBy.toString() !== createdBy) {
      const notification = new Notification({
        userId: post.createdBy,
        notification: 'A new comment has been added to your post!',
        date: new Date(),
      });

      await notification.save();
      io?.emit('new_notification', notification);
    }

    res.status(201).json(addedComment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment', details: error.message });
  }
});

// Get all comments for a post (with GIF detection)
router.get('/get/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId).populate('comments.createdBy', 'name profilePicture');
    
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Process comments to extract GIF information
    const processedComments = post.comments.map(comment => {
      const commentObj = comment.toObject ? comment.toObject() : comment;
      
      // Check if comment contains a GIF
      const gifMatch = commentObj.content.match(/!\[GIF\]\((.*?)\)/);
      
      return {
        ...commentObj,
        hasGif: !!gifMatch,
        gifUrl: gifMatch ? gifMatch[1] : null,
        textContent: gifMatch ? commentObj.content.replace(/!\[GIF\]\(.*?\)/, '').trim() : commentObj.content
      };
    });

    res.status(200).json(processedComments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments', details: error.message });
  }
});

// Helper function to validate URLs
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}
// Update a comment
router.put('/:postId/comment/:commentId', async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { content } = req.body;

    if (!content) return res.status(400).json({ error: 'Content is required' });

    const post = await Post.findById(postId).populate('comments.createdBy', 'name profilePicture');
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    comment.content = content;
    await post.save();

    res.status(200).json(comment);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ error: 'Failed to update comment', details: error.message });
  }
});

// DELETE comment by commentId from a post by postId
router.delete('/:postId/comment/:commentId', async (req, res) => {
  try {
    const { postId, commentId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Find the index of the comment to remove
    const commentIndex = post.comments.findIndex(
      comment => comment._id.toString() === commentId
    );

    if (commentIndex === -1) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Remove the comment from the array
    post.comments.splice(commentIndex, 1);

    // Save the updated post
    await post.save();

    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Failed to delete comment', error: error.message });
  }
});

// Get all comments for a post
// router.get('/get/:postId/comments', async (req, res) => {
//   try {
//     const { postId } = req.params;
//     const post = await Post.findById(postId).populate('comments.createdBy', 'name profilePicture');
//     if (!post) return res.status(404).json({ error: 'Post not found' });

//     res.status(200).json(post.comments);
//   } catch (error) {
//     console.error('Error fetching comments:', error);
//     res.status(500).json({ error: 'Failed to fetch comments', details: error.message });
//   }
// });
// Search GIFs (using Tenor API as example)
router.get('/gifs/search', async (req, res) => {
  try {
    const { query, limit = 20 } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${API_KEY}&limit=${limit}`;
    const response = await axios.get(url);

    const gifs = response.data.results.map(gif => ({
      id: gif.id,
      url: gif.media_formats.gif?.url,
      preview: gif.media_formats.tinygif?.url,
      title: gif.content_description || gif.title || 'GIF'
    }));

    res.json(gifs);
  } catch (error) {
    console.error('Error searching GIFs:', error.message);
    res.status(500).json({ error: 'Failed to search GIFs', details: error.message });
  }
});

// Get trending GIFs
router.get('/gifs/trending', async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const url = `https://tenor.googleapis.com/v2/trending?key=${API_KEY}&limit=${limit}`;
    const response = await axios.get(url);

    const gifs = response.data.results.map(gif => ({
      id: gif.id,
      url: gif.media_formats.gif?.url,
      preview: gif.media_formats.tinygif?.url,
      title: gif.content_description || gif.title || 'GIF'
    }));

    res.json(gifs);
  } catch (error) {
    console.error('Error fetching trending GIFs:', error.message);
    res.status(500).json({ error: 'Failed to fetch trending GIFs', details: error.message });
  }
});
module.exports = router;