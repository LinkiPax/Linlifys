// const path = require('path');
// const mongoose = require('mongoose');
// const express = require('express');
// const router = express.Router();
// const Message = require('../model/messagemodel');
// const { storage, uploadProfilePic, uploadImage, deleteImage, deleteFromCloudinary, } = require('../cloudinary');
// const multer = require('multer');
// const fs = require('fs');
// const { promisify } = require('util');
// const writeFileAsync = promisify(fs.writeFile);
// const unlinkAsync = promisify(fs.unlink);
// const cloudinary= require('cloudinary').v2;
// const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
// const { getIO,users } = require('../socket/socketnadle');
// const ALLOWED_MIME_TYPES = [
//   'application/pdf',
//   'application/msword',
//   'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//   'application/vnd.ms-excel',
//   'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//   'application/vnd.ms-powerpoint',
//   'application/vnd.openxmlformats-officedocument.presentationml.presentation',
//   'text/plain'
// ];
// // Configure multer for file uploads
// const upload = multer({ storage: storage });
// const uploadSingle = upload.single('file');

// // Helper function to handle file uploads
// const handleFileUpload = (req, res) => {
//   return new Promise((resolve, reject) => {
//     uploadSingle(req, res, (err) => {
//       if (err) {
//         reject(err);
//       } else {
//         resolve(req.file);
//       }
//     });
//   });
// };

// // Configure audio storage
// const audioStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const dir = 'uploads/audio/';
//     if (!fs.existsSync(dir)) {
//       fs.mkdirSync(dir, { recursive: true });
//     }
//     cb(null, dir);
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     const ext = path.extname(file.originalname).toLowerCase();
//     cb(null, 'audio_' + uniqueSuffix + ext);
//   }
// });

// const uploadAudio = multer({
//   storage: audioStorage,
//   limits: {
//     fileSize: 10 * 1024 * 1024 // 10MB limit
//   },
//   fileFilter: (req, file, cb) => {
//     const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'];
//     if (allowedTypes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only audio files are allowed (MP3, WAV, OGG, WEBM)'), false);
//     }
//   }
// });
// // GET messages between two users, excluding deleted messages for current user
// router.get('/api/messages', async (req, res) => {
//   const { userId, targetUserId } = req.query;
//   console.log(`Fetching messages between userId: ${userId} and targetUserId: ${targetUserId}`);

//   try {
//     const messages = await Message.find({
//       $or: [
//         { sender: userId, receiver: targetUserId },
//         { sender: targetUserId, receiver: userId },
//       ],
//       deletedFor: { $ne: userId }, // exclude messages deleted for current user
//     }).sort({ createdAt: 1 });

//     console.log(`Fetched ${messages.length} messages`);
//     res.json(messages);
//   } catch (error) {
//     console.error("Error fetching messages:", error);
//     res.status(500).json({ message: "Error fetching messages" });
//   }
// });

// // POST new text message
// router.post('/api/messages', async (req, res) => {
//   const { senderId, receiverId, content } = req.body;

//   if (!content) {
//     return res.status(400).json({ message: "Message content is required." });
//   }

//   try {
//     const newMessage = new Message({
//       sender: senderId,
//       receiver: receiverId,
//       messageType: 'text',
//       content
//     });

//     await newMessage.save();
//     res.status(201).json(newMessage);
//   } catch (error) {
//     console.error("Error saving message:", error);
//     res.status(500).json({ message: "Error saving message" });
//   }
// });

// // POST send image - now with file upload
// // In your backend route
// // Add this at the top of your route file
// const uploadCache = new Set();

// router.post('/api/messages/images', upload.single('image'), async (req, res) => {
//   try {
//     const { senderId, receiverId, caption } = req.body;
    
//     if (!req.file) {
//       return res.status(400).json({ message: "Image file is required." });
//     }

//     const fileFingerprint = `${senderId}-${receiverId}-${req.file.size}-${req.file.originalname}`;
//     if (uploadCache.has(fileFingerprint)) {
//       return res.status(400).json({ message: "Duplicate upload detected" });
//     }
//     uploadCache.add(fileFingerprint);

//     const newMessage = new Message({
//       sender: senderId,
//       receiver: receiverId,
//       messageType: 'image',
//       image: {
//         url: req.file.path,
//         publicId: req.file.filename,
//         caption: caption || '',
//         width: req.file.width || 0,
//         height: req.file.height || 0,
//         size: req.file.size || 0,
//         format: req.file.format || path.extname(req.file.originalname).substring(1).toLowerCase()
//       },
//       content: caption || 'Shared an image'
//     });

//     const savedMessage = await newMessage.save();
//     uploadCache.delete(fileFingerprint);

//     // Emit the new message to receiver in real-time
//     const io = getIO();
//     const receiverSocketId = users[receiverId];
//     if (receiverSocketId) {
//       io.to(receiverSocketId).emit('new_message', savedMessage);
//     }

//     res.status(201).json(savedMessage);
//   } catch (error) {
//     console.error("Error sending image:", error);
//     if (req.file?.filename) {
//       await cloudinary.uploader.destroy(req.file.filename);
//     }
//     res.status(500).json({ message: "Error sending image" });
//   }
// })
// // POST send video - now with file upload
// router.post('/api/messages/videos', upload.single('video'), async (req, res) => {
//   try {
//     const { senderId, receiverId, caption } = req.body;
    
//     if (!req.file) {
//       return res.status(400).json({ message: "Video file is required." });
//     }
//            // Add unique upload ID to prevent duplicates
//    const uploadId = `${senderId}-${req.file.filename}`;
//    if (req.app.locals.uploadCache?.has(uploadId)) {
//      return res.status(400).json({ message: "Duplicate upload detected" });
//    }
   
//    req.app.locals.uploadCache = req.app.locals.uploadCache || new Set();
//    req.app.locals.uploadCache.add(uploadId);
//     // Get thumbnail from eager transformations
//     const thumbnail = req.file.eager && req.file.eager[0]
//       ? req.file.eager[0].secure_url
//       : '';

//     const newMessage = new Message({
//       sender: senderId,
//       receiver: receiverId,
//       messageType: 'video',
//       video: {
//         url: req.file.path,
//         publicId: req.file.filename,
//         thumbnail: thumbnail,
//         duration: req.file.duration || 0,
//         caption: caption || '',
//         width: req.file.width || 0,
//         height: req.file.height || 0,
//         size: req.file.size || 0,
//         format: req.file.format || 'mp4'
//       },
//       content: caption || 'Shared a video'
//     });

//     const savedMessage=await newMessage.save();
//     req.app.locals.uploadCache.delete(uploadId);
//     const io = getIO();
//     const recipientSocketId = users[receiverId];
//     if (recipientSocketId) {
//       io.to(recipientSocketId).emit('new_message', savedMessage);
//     } else {
//       console.log(`User ${receiverId} is offline → video will be delivered later.`);
//     }
//     res.status(201).json(newMessage);
//   } catch (error) {
//     console.error("Error sending video:", error);
//     if (req.file?.filename) {
//       await cloudinary.uploader.destroy(req.file.filename, { resource_type: 'video' });
//     }
//     res.status(500).json({ message: "Error sending video" });
//   }
// });

// // POST audio message with improved handling
// router.post('/api/messages/audio', uploadAudio.single('audio'), async (req, res) => {
//   try {
//     const { senderId, receiverId, duration } = req.body;
    
//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         message: "Audio file is required."
//       });
//     }

//     // Calculate duration if not provided
//     let audioDuration = parseInt(duration) || 0;
//     if (!duration && req.file.path) {
//       // You could use a library like node-audio-duration here for more accuracy
//       audioDuration = Math.ceil(req.file.size / (16000 * 2)); // Rough estimation
//     }

//     const newMessage = new Message({
//       sender: senderId,
//       receiver: receiverId,
//       messageType: 'audio',
//       audio: {
//         url: `/audio/${req.file.filename}`,
//         duration: audioDuration,
//         size: req.file.size,
//         format: path.extname(req.file.originalname).substring(1) || 'mp3'
//       },
//       content: 'Voice message'
//     });

//     const savedMessage = await newMessage.save();
//     const io = getIO();
//     const recipientSocketId = users[receiverId];
//     if (recipientSocketId) {
//       io.to(recipientSocketId).emit('new_message', savedMessage);
//     } else {
//       console.log(`User ${receiverId} is offline → audio will be delivered later.`);
//     }
//     res.status(201).json({
//       success: true,
//       message: savedMessage
//     });
//   } catch (error) {
//     console.error("Error saving audio:", error);
//     if (req.file?.path) {
//       await unlinkAsync(req.file.path).catch(console.error);
//     }
//     res.status(500).json({
//       success: false,
//       message: "Error saving audio message",
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// });
// // POST react to message (add emoji)
// // routes/messageroute.js
// router.post('/api/messages/:messageId/react', async (req, res) => {
//   const { messageId } = req.params;
//   const { userId, emoji } = req.body;

//   if (!mongoose.Types.ObjectId.isValid(messageId)) {
//     return res.status(400).json({ message: 'Invalid message ID format' });
//   }
//   if (!emoji) {
//     return res.status(400).json({ message: 'Emoji is required.' });
//   }

//   try {
//     const message = await Message.findById(messageId);
//     if (!message) {
//       return res.status(404).json({ message: 'Message not found' });
//     }

//     // Update reactions
//     message.reactions = message.reactions || [];
//     message.reactions = message.reactions.filter(
//       (r) => r.userId.toString() !== userId
//     );
//     message.reactions.push({ userId, emoji, createdAt: new Date() });

//     const updatedMessage = await message.save();

//     // ─── Emit “message_updated” to both participants ─────────────────────
//     const io = getIO();
//     const receiverId = updatedMessage.receiver.toString();
//     const recipientSocketId = users[receiverId];
//     if (recipientSocketId) {
//       io.to(recipientSocketId).emit('message_updated', updatedMessage);
//     }
//     const reactorSocketId = users[userId];
//     if (reactorSocketId && reactorSocketId !== recipientSocketId) {
//       io.to(reactorSocketId).emit('message_updated', updatedMessage);
//     }
//     // ──────────────────────────────────────────────────────────────────────

//     return res.json(updatedMessage);
//   } catch (error) {
//     console.error('Error reacting to message:', error);
//     return res.status(500).json({ message: 'Error reacting to message' });
//   }
// });

// // POST live location
// router.post('/api/messages/documents', upload.single('document'), async (req, res) => {
//   let cloudinaryResult;
//   let localFilePath = req.file?.path; // Store the local path separately

//   try {
//     const { senderId, receiverId } = req.body;
    
//     if (!req.file) {
//       return res.status(400).json({ message: "Document file is required." });
//     }

//     // Validate file type
//     const allowedTypes = [
//       'application/pdf',
//       'application/msword',
//       'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//       'application/vnd.ms-excel',
//       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//       'text/plain'
//     ];
    
//     if (!allowedTypes.includes(req.file.mimetype)) {
//       // Only delete local file if it exists
//       if (localFilePath && fs.existsSync(localFilePath)) {
//         fs.unlinkSync(localFilePath);
//       }
//       return res.status(400).json({ message: "Unsupported file type." });
//     }

//     // Upload to Cloudinary
//     cloudinaryResult = await cloudinary.uploader.upload(localFilePath, {
//       resource_type: "auto",
//       folder: "documents",
//       use_filename: true,
//       unique_filename: true,
//       access_mode: "public"
//     });

//     // Create message
//     const newMessage = new Message({
//       sender: senderId,
//       receiver: receiverId,
//       messageType: 'document',
//       document: {
//         url: cloudinaryResult.secure_url,
//         publicId: cloudinaryResult.public_id,
//         name: path.parse(req.file.originalname).name,
//         originalName: req.file.originalname,
//         size: cloudinaryResult.bytes,
//         type: req.file.mimetype,
//         extension: path.extname(req.file.originalname).substring(1),

//       },
//       content: `Shared document: ${req.file.originalname}`
//     });

//     const savedMessage = await newMessage.save();
//     const io = getIO();
//     const recipientSocketId = users[receiverId];
//     if (recipientSocketId) {
//       io.to(recipientSocketId).emit('new_message', savedMessage);
//     } else {
//       console.log(`User ${receiverId} is offline → document will be delivered later.`);
//     }
//     // Clean up - delete the temporary file if it exists
//     if (localFilePath && fs.existsSync(localFilePath)) {
//       fs.unlinkSync(localFilePath);
//     }
    
//     res.status(201).json(newMessage);
//   } catch (error) {
//     console.error("Error sharing document:", error);
    
//     // Clean up in reverse order
//     try {
//       // 1. Delete from Cloudinary if upload was successful
//       if (cloudinaryResult?.public_id) {
//         await cloudinary.uploader.destroy(cloudinaryResult.public_id).catch(e => console.error("Cloudinary cleanup error:", e));
//       }
      
//       // 2. Delete local temp file if it exists
//       if (localFilePath && fs.existsSync(localFilePath)) {
//         fs.unlinkSync(localFilePath);
//       }
//     } catch (cleanupError) {
//       console.error("Cleanup error:", cleanupError);
//     }
    
//     res.status(500).json({
//       message: "Error sharing document",
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// });
// // POST create event - with optional image upload
// router.post('/api/messages/events', upload.single('image'), async (req, res) => {
//   try {
//     const { senderId, receiverId, title, description, date, location } = req.body;

//     if (!title || !date) {
//       return res.status(400).json({ message: "Title and date are required." });
//     }

//     let eventImage = {};
//     if (req.file) {
//       const result = await uploadImage(req.file.path);
//       eventImage = {
//         url: result.secure_url,
//         publicId: result.public_id,
//         width: result.width,
//         height: result.height
//       };
//     }

//     const newMessage = new Message({
//       sender: senderId,
//       receiver: receiverId,
//       messageType: 'event',
//       event: {
//         title,
//         description: description || '',
//         date: new Date(date),
//         location: location || '',
//         organizer: senderId,
//         attendees: [],
//         image: eventImage.url ? eventImage : null
//       },
//       content: `Event: ${title} on ${new Date(date).toLocaleString()}`
//     });

//     await newMessage.save();
//     res.status(201).json(newMessage);
//   } catch (error) {
//     console.error("Error creating event:", error);
    
//     // Clean up uploaded file if message creation fails
//     if (req.file && req.file.publicId) {
//       await deleteFromCloudinary(req.file.publicId).catch(console.error);
//     }
    
//     res.status(500).json({ message: "Error creating event" });
//   }
// });

// // POST RSVP to event
// router.post('/api/messages/events/:messageId/rsvp', async (req, res) => {
//   const { messageId } = req.params;
//   const { userId, status } = req.body;

//   if (!mongoose.Types.ObjectId.isValid(messageId)) {
//     return res.status(400).json({ message: "Invalid message ID format" });
//   }

//   const validStatuses = ['going', 'not_going', 'maybe'];
//   if (!validStatuses.includes(status)) {
//     return res.status(400).json({ message: "Invalid RSVP status" });
//   }

//   try {
//     const message = await Message.findById(messageId);
    
//     if (!message || message.messageType !== 'event') {
//       return res.status(404).json({ message: "Event not found" });
//     }

//     // Initialize attendees array if it doesn't exist
//     if (!message.event.attendees) {
//       message.event.attendees = [];
//     }

//     // Remove existing RSVP if exists
//     message.event.attendees = message.event.attendees.filter(
//       attendee => attendee.userId.toString() !== userId
//     );

//     // Add new RSVP
//     if (status !== 'not_going') {
//       message.event.attendees.push({
//         userId,
//         status
//       });
//     }

//     await message.save();
//     res.json(message);
//   } catch (error) {
//     console.error("Error updating RSVP:", error);
//     res.status(500).json({ message: "Error updating RSVP" });
//   }
// });

// // PATCH mark multiple messages as read
// // routes/messageroute.js
// router.patch('/api/messages/mark-as-read', async (req, res) => {
//   const { messageIds, readerId } = req.body;
//   // readerId is the user who performed the “read” action

//   try {
//     const result = await Message.updateMany(
//       { _id: { $in: messageIds } },
//       { $set: { isRead: true } }
//     );

//     // If you want to emit which messages got marked read:
//     const updatedIds = messageIds; // (they’re all marked read)
//     const io = getIO();

//     // Tell the original senders for each message (if they’re online) that their message was read.
//     // You can query the messages to find out each senderId, or just broadcast to everyone:
//     // For simplicity, broadcast to everyone in the chat room or directly to the “sender”:
//     const messages = await Message.find({ _id: { $in: updatedIds } });
//     for (const msg of messages) {
//       const senderSocketId = users[msg.sender.toString()];
//       if (senderSocketId) {
//         io.to(senderSocketId).emit('messages_read', {
//           messageId: msg._id,
//           readerId,
//         });
//       }
//     }

//     return res.json({ success: true, updatedCount: result.modifiedCount });
//   } catch (error) {
//     console.error('Error marking messages as read:', error);
//     return res.status(500).json({ message: 'Error marking messages as read' });
//   }
// });

// // PATCH soft-delete a message (with cleanup for media messages)
// // routes/messageroute.js
// router.patch('/api/messages/:messageId', async (req, res) => {
//   const { messageId } = req.params;
//   const { userId } = req.body; // the one who performed delete

//   if (!mongoose.Types.ObjectId.isValid(messageId)) {
//     return res.status(400).json({ message: 'Invalid message ID format' });
//   }

//   try {
//     const message = await Message.findById(messageId);
//     if (!message) {
//       return res.status(404).json({ message: 'Message not found' });
//     }

//     message.deletedFor = message.deletedFor || [];
//     if (!message.deletedFor.includes(userId)) {
//       message.deletedFor.push(userId);

//       // If both participants have deleted, clean up Cloudinary, etc.
//       if (message.deletedFor.length === 2) {
//         // delete media based on messageType …
//         // example: if image, deleteImage(message.image.publicId);
//       }
//       await message.save();
//     }

//     // ─── Emit a “message_deleted” event ───────────────────────────────────
//     const io = getIO();
//     const otherParticipant =
//       message.sender.toString() === userId ? message.receiver.toString() : message.sender.toString();
//     const otherSocketId = users[otherParticipant];
//     if (otherSocketId) {
//       io.to(otherSocketId).emit('message_deleted', { messageId, by: userId });
//     }
//     const requesterSocketId = users[userId];
//     if (requesterSocketId && requesterSocketId !== otherSocketId) {
//       io.to(requesterSocketId).emit('message_deleted', { messageId, by: userId });
//     }
//     // ───────────────────────────────────────────────────────────────────────

//     return res.json({ success: true, message: 'Message deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting message:', error);
//     return res.status(500).json({ message: 'Error deleting message' });
//   }
// });

// // GET search messages within conversation
// router.get('/api/messages/search', async (req, res) => {
//   const { userId, targetUserId, searchTerm } = req.query;

//   try {
//     const messages = await Message.find({
//       $or: [
//         { sender: userId, receiver: targetUserId },
//         { sender: targetUserId, receiver: userId },
//       ],
//       content: { $regex: searchTerm, $options: 'i' },
//       deletedFor: { $ne: userId },
//     }).sort({ createdAt: -1 });

//     res.json(messages);
//   } catch (error) {
//     console.error("Error searching messages:", error);
//     res.status(500).json({ message: "Error searching messages" });
//   }
// });

// // GET unread message count
// router.get('/api/messages/unread-count', async (req, res) => {
//   const { userId } = req.query;

//   try {
//     const count = await Message.countDocuments({
//       receiver: userId,
//       isRead: false,
//       deletedFor: { $ne: userId }
//     });

//     res.json({ count });
//   } catch (error) {
//     console.error("Error getting unread message count:", error);
//     res.status(500).json({ message: "Error getting unread message count" });
//   }
// });
// // routes/messageroute.js
// router.post('/api/messages/live-location', async (req, res) => {
//   try {
//     const { senderId, receiverId, latitude, longitude, duration, live, expiresAt, content } = req.body;

//     // Validate fields as you wish…

//     const newMessage = new Message({
//       sender: senderId,
//       receiver: receiverId,
//       messageType: 'location',
//       location: {
//         latitude,
//         longitude,
//         live: !!live,
//         duration: duration || 0,
//         expiresAt: expiresAt ? new Date(expiresAt) : null,
//       },
//       content: content || 'Shared live location',
//     });

//     const savedMessage = await newMessage.save();

//     // ─── Emit in real time ────────────────────────────────────────────────
//     const io = getIO();
//     const recipientSocketId = users[receiverId];
//     if (recipientSocketId) {
//       io.to(recipientSocketId).emit('new_message', savedMessage);
//     } else {
//       console.log(`User ${receiverId} is offline → location will be delivered later.`);
//     }
//     // ───────────────────────────────────────────────────────────────────────

//     return res.status(201).json(savedMessage);
//   } catch (error) {
//     console.error('Error sharing location:', error);
//     return res.status(500).json({ message: 'Error sharing location' });
//   }
// });
// // routes/messageroute.js
// router.post('/api/messages/contacts', async (req, res) => {
//   // Assuming you’re using a generic “create message” endpoint for contacts/polls/etc.
//   try {
//     const { senderId, receiverId, messageType, contacts, poll, event, ...rest } = req.body;
//     // Build your newMessage object depending on messageType…
//     // Here’s a quick example for contacts:
//     if (messageType === 'contact') {
//       const newMessage = new Message({
//         sender: senderId,
//         receiver: receiverId,
//         messageType: 'contact',
//         contacts: contacts || [],
//         content: `Shared ${contacts.length} contact(s)`,
//       });
//       const savedMessage = await newMessage.save();

//       // ─── Emit in real time ────────────────────────────────────────────────
//       const io = getIO();
//       const recipientSocketId = users[receiverId];
//       if (recipientSocketId) {
//         io.to(recipientSocketId).emit('new_message', savedMessage);
//       } else {
//         console.log(`User ${receiverId} is offline → contact message will be delivered later.`);
//       }
//       // ───────────────────────────────────────────────────────────────────────

//       return res.status(201).json(savedMessage);
//     }

//     // If messageType is something else (text, location, poll, event…), handle similarly.
//     // …
//   } catch (error) {
//     console.error('Error creating message:', error);
//     return res.status(500).json({ message: 'Error creating message' });
//   }
// });
// // routes/messageroute.js
// router.post('/api/messages/polls', async (req, res) => {
//   try {
//     const { senderId, receiverId, question, options, isMultiSelect, duration } = req.body;
//     // Option‐array layering, etc.
//     const newMessage = new Message({
//       sender: senderId,
//       receiver: receiverId,
//       messageType: 'poll',
//       poll: {
//         question,
//         options: options.map((opt) => ({ text: opt.text, votes: [] })),
//         isMultiSelect: !!isMultiSelect,
//         duration: duration || 0,
//         createdAt: new Date(),
//       },
//       content: `Poll: ${question}`,
//     });

//     const savedMessage = await newMessage.save();

//     // ─── Emit in real time ────────────────────────────────────────────────
//     const io = getIO();
//     const recipientSocketId = users[receiverId];
//     if (recipientSocketId) {
//       io.to(recipientSocketId).emit('new_message', savedMessage);
//     } else {
//       console.log(`User ${receiverId} is offline → poll will be delivered later.`);
//     }
//     // ───────────────────────────────────────────────────────────────────────

//     return res.status(201).json(savedMessage);
//   } catch (error) {
//     console.error('Error creating poll:', error);
//     return res.status(500).json({ message: 'Error creating poll' });
//   }
// });

// module.exports = router;

const path = require('path');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const Message = require('../model/messagemodel');
const { storage, uploadProfilePic, uploadImage, deleteImage, deleteFromCloudinary, } = require('../cloudinary');
const multer = require('multer');
const fs = require('fs');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);
const cloudinary= require('cloudinary').v2;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const { getIO,users } = require('../socket/socketnadle');
const ALLOWED_MIME_TYPES = [ 
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain'
];

// Configure multer for file uploads
const upload = multer({ storage: storage });
const uploadSingle = upload.single('file');

// Helper function to handle file uploads
const handleFileUpload = (req, res) => {
  return new Promise((resolve, reject) => {
    uploadSingle(req, res, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(req.file);
      }
    });
  });
};

// Configure audio storage
const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/audio/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'audio_' + uniqueSuffix + ext);
  }
});

const uploadAudio = multer({ 
  storage: audioStorage,
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed (MP3, WAV, OGG, WEBM)'), false);
    }
  }
});

const uploadCache = new Set();

// ==============================================
// MESSAGE CRUD OPERATIONS
// ==============================================

// GET messages between two users, excluding deleted messages for current user
router.get('/api/messages', async (req, res) => {
  const { userId, targetUserId } = req.query;
  console.log(`Fetching messages between userId: ${userId} and targetUserId: ${targetUserId}`);

  try {
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: targetUserId },
        { sender: targetUserId, receiver: userId },
      ],
      deletedFor: { $ne: userId }, // exclude messages deleted for current user
    }).sort({ createdAt: 1 });

    console.log(`Fetched ${messages.length} messages`);
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Error fetching messages" });
  }
});

// POST new text message
router.post('/api/messages', async (req, res) => {
  const { senderId, receiverId, content } = req.body;

  if (!content) {
    return res.status(400).json({ message: "Message content is required." });
  }

  try {
    const newMessage = new Message({
      sender: senderId,
      receiver: receiverId,
      messageType: 'text',
      content
    });

    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error saving message:", error);
    res.status(500).json({ message: "Error saving message" });
  }
});

// PATCH mark multiple messages as read
router.patch('/api/messages/mark-as-read', async (req, res) => {
  const { messageIds, readerId } = req.body;

  try {
    const result = await Message.updateMany(
      { _id: { $in: messageIds } },
      { $set: { isRead: true } }
    );

    const updatedIds = messageIds;
    const io = getIO();
    const messages = await Message.find({ _id: { $in: updatedIds } });
    for (const msg of messages) {
      const senderSocketId = users[msg.sender.toString()];
      if (senderSocketId) {
        io.to(senderSocketId).emit('messages_read', {
          messageId: msg._id,
          readerId,
        });
      }
    }

    return res.json({ success: true, updatedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return res.status(500).json({ message: 'Error marking messages as read' });
  }
});

// PATCH soft-delete a message (with cleanup for media messages)
router.patch('/api/messages/:messageId', async (req, res) => {
  const { messageId } = req.params;
  const { userId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(messageId)) {
    return res.status(400).json({ message: 'Invalid message ID format' });
  }

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    message.deletedFor = message.deletedFor || [];
    if (!message.deletedFor.includes(userId)) {
      message.deletedFor.push(userId);

      if (message.deletedFor.length === 2) {
        // delete media based on messageType ...
      }
      await message.save();
    }

    const io = getIO();
    const otherParticipant = 
      message.sender.toString() === userId ? message.receiver.toString() : message.sender.toString();
    const otherSocketId = users[otherParticipant];
    if (otherSocketId) {
      io.to(otherSocketId).emit('message_deleted', { messageId, by: userId });
    }
    const requesterSocketId = users[userId];
    if (requesterSocketId && requesterSocketId !== otherSocketId) {
      io.to(requesterSocketId).emit('message_deleted', { messageId, by: userId });
    }

    return res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    return res.status(500).json({ message: 'Error deleting message' });
  }
});

// ==============================================
// MEDIA MESSAGES (IMAGES, VIDEOS, AUDIO, DOCUMENTS)
// ==============================================

// POST send image
router.post('/api/messages/images', upload.single('image'), async (req, res) => {
  try {
    const { senderId, receiverId, caption } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required." });
    }

    const fileFingerprint = `${senderId}-${receiverId}-${req.file.size}-${req.file.originalname}`;
    if (uploadCache.has(fileFingerprint)) {
      return res.status(400).json({ message: "Duplicate upload detected" });
    }
    uploadCache.add(fileFingerprint);

    const newMessage = new Message({
      sender: senderId,
      receiver: receiverId,
      messageType: 'image',
      image: {
        url: req.file.path,
        publicId: req.file.filename,
        caption: caption || '',
        width: req.file.width || 0,
        height: req.file.height || 0,
        size: req.file.size || 0,
        format: req.file.format || path.extname(req.file.originalname).substring(1).toLowerCase()
      },
      content: caption || 'Shared an image'
    });

    const savedMessage = await newMessage.save();
    uploadCache.delete(fileFingerprint);

    const io = getIO();
    const receiverSocketId = users[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('new_message', savedMessage);
    }

    res.status(201).json(savedMessage);
  } catch (error) {
    console.error("Error sending image:", error);
    if (req.file?.filename) {
      await cloudinary.uploader.destroy(req.file.filename);
    }
    res.status(500).json({ message: "Error sending image" });
  }
});

// POST send video
router.post('/api/messages/videos', upload.single('video'), async (req, res) => {
  try {
    const { senderId, receiverId, caption } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: "Video file is required." });
    }
           
   const uploadId = `${senderId}-${req.file.filename}`;
   if (req.app.locals.uploadCache?.has(uploadId)) {
     return res.status(400).json({ message: "Duplicate upload detected" });
   }
   
   req.app.locals.uploadCache = req.app.locals.uploadCache || new Set();
   req.app.locals.uploadCache.add(uploadId);

    const thumbnail = req.file.eager && req.file.eager[0] 
      ? req.file.eager[0].secure_url 
      : '';

    const newMessage = new Message({
      sender: senderId,
      receiver: receiverId,
      messageType: 'video',
      video: {
        url: req.file.path,
        publicId: req.file.filename,
        thumbnail: thumbnail,
        duration: req.file.duration || 0,
        caption: caption || '',
        width: req.file.width || 0,
        height: req.file.height || 0,
        size: req.file.size || 0,
        format: req.file.format || 'mp4'
      },
      content: caption || 'Shared a video'
    });

    const savedMessage=await newMessage.save();
    req.app.locals.uploadCache.delete(uploadId);
    const io = getIO();
    const recipientSocketId = users[receiverId];
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('new_message', savedMessage);
    } else {
      console.log(`User ${receiverId} is offline → video will be delivered later.`);
    }
    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error sending video:", error);
    if (req.file?.filename) {
      await cloudinary.uploader.destroy(req.file.filename, { resource_type: 'video' });
    }
    res.status(500).json({ message: "Error sending video" });
  } 
});

// POST audio message
router.post('/api/messages/audio', uploadAudio.single('audio'), async (req, res) => {
  try {
    const { senderId, receiverId, duration } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: "Audio file is required." 
      });
    }

    let audioDuration = parseInt(duration) || 0;
    if (!duration && req.file.path) {
      audioDuration = Math.ceil(req.file.size / (16000 * 2));
    }

    const newMessage = new Message({
      sender: senderId,
      receiver: receiverId,
      messageType: 'audio',
      audio: {
        url: `/audio/${req.file.filename}`,
        duration: audioDuration,
        size: req.file.size,
        format: path.extname(req.file.originalname).substring(1) || 'mp3'
      },
      content: 'Voice message'
    });

    const savedMessage = await newMessage.save();
    const io = getIO();
    const recipientSocketId = users[receiverId];
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('new_message', savedMessage);
    } else {
      console.log(`User ${receiverId} is offline → audio will be delivered later.`);
    }
    res.status(201).json({
      success: true,
      message: savedMessage
    });
  } catch (error) {
    console.error("Error saving audio:", error);
    if (req.file?.path) {
      await unlinkAsync(req.file.path).catch(console.error);
    }
    res.status(500).json({ 
      success: false,
      message: "Error saving audio message",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST send document
router.post('/api/messages/documents', upload.single('document'), async (req, res) => {
  let cloudinaryResult;
  let localFilePath = req.file?.path;

  try {
    const { senderId, receiverId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: "Document file is required." });
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];
    
    if (!allowedTypes.includes(req.file.mimetype)) {
      if (localFilePath && fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
      return res.status(400).json({ message: "Unsupported file type." });
    }

    cloudinaryResult = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: "documents",
      use_filename: true,
      unique_filename: true,
      access_mode: "public" 
    });

    const newMessage = new Message({
      sender: senderId,
      receiver: receiverId,
      messageType: 'document',
      document: {
        url: cloudinaryResult.secure_url,
        publicId: cloudinaryResult.public_id,
        name: path.parse(req.file.originalname).name,
        originalName: req.file.originalname,
        size: cloudinaryResult.bytes,
        type: req.file.mimetype,
        extension: path.extname(req.file.originalname).substring(1),
      },
      content: `Shared document: ${req.file.originalname}`
    });

    const savedMessage = await newMessage.save();
    const io = getIO();
    const recipientSocketId = users[receiverId];
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('new_message', savedMessage);
    } else {
      console.log(`User ${receiverId} is offline → document will be delivered later.`);
    }
    
    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    
    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error sharing document:", error);
    
    try {
      if (cloudinaryResult?.public_id) {
        await cloudinary.uploader.destroy(cloudinaryResult.public_id).catch(e => console.error("Cloudinary cleanup error:", e));
      }
      
      if (localFilePath && fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
    } catch (cleanupError) {
      console.error("Cleanup error:", cleanupError);
    }
    
    res.status(500).json({ 
      message: "Error sharing document",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}); 

// ==============================================
// SPECIAL MESSAGE TYPES (LOCATION, EVENTS, POLLS, CONTACTS)
// ==============================================

// POST live location
router.post('/api/messages/live-location', async (req, res) => {
  try {
    const { senderId, receiverId, latitude, longitude, duration, live, expiresAt, content } = req.body;

    const newMessage = new Message({
      sender: senderId,
      receiver: receiverId,
      messageType: 'location',
      location: {
        latitude,
        longitude,
        live: !!live,
        duration: duration || 0,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      content: content || 'Shared live location',
    });

    const savedMessage = await newMessage.save();

    const io = getIO();
    const recipientSocketId = users[receiverId];
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('new_message', savedMessage);
    } else {
      console.log(`User ${receiverId} is offline → location will be delivered later.`);
    }

    return res.status(201).json(savedMessage);
  } catch (error) {
    console.error('Error sharing location:', error);
    return res.status(500).json({ message: 'Error sharing location' });
  }
});

// POST create event
router.post('/api/messages/events', upload.single('image'), async (req, res) => {
  try {
    const { senderId, receiverId, title, description, date, location } = req.body;

    if (!title || !date) {
      return res.status(400).json({ message: "Title and date are required." });
    }

    let eventImage = {};
    if (req.file) {
      const result = await uploadImage(req.file.path);
      eventImage = {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height
      };
    }

    const newMessage = new Message({
      sender: senderId,
      receiver: receiverId,
      messageType: 'event',
      event: {
        title,
        description: description || '',
        date: new Date(date),
        location: location || '',
        organizer: senderId,
        attendees: [],
        image: eventImage.url ? eventImage : null
      },
      content: `Event: ${title} on ${new Date(date).toLocaleString()}`
    });

    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error creating event:", error);
    
    if (req.file && req.file.publicId) {
      await deleteFromCloudinary(req.file.publicId).catch(console.error);
    }
    
    res.status(500).json({ message: "Error creating event" });
  }
});

// POST RSVP to event
router.post('/api/messages/events/:messageId/rsvp', async (req, res) => {
  const { messageId } = req.params;
  const { userId, status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(messageId)) {
    return res.status(400).json({ message: "Invalid message ID format" });
  }

  const validStatuses = ['going', 'not_going', 'maybe'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid RSVP status" });
  }

  try {
    const message = await Message.findById(messageId);
    
    if (!message || message.messageType !== 'event') {
      return res.status(404).json({ message: "Event not found" });
    }

    if (!message.event.attendees) {
      message.event.attendees = [];
    }

    message.event.attendees = message.event.attendees.filter(
      attendee => attendee.userId.toString() !== userId
    );

    if (status !== 'not_going') {
      message.event.attendees.push({
        userId,
        status
      });
    }

    await message.save();
    res.json(message);
  } catch (error) {
    console.error("Error updating RSVP:", error);
    res.status(500).json({ message: "Error updating RSVP" });
  }
});

// POST create poll
router.post('/api/messages/polls', async (req, res) => {
  try {
    const { senderId, receiverId, question, options, isMultiSelect, duration } = req.body;
    
    const newMessage = new Message({
      sender: senderId,
      receiver: receiverId,
      messageType: 'poll',
      poll: {
        question,
        options: options.map((opt) => ({ text: opt.text, votes: [] })),
        isMultiSelect: !!isMultiSelect,
        duration: duration || 0,
        createdAt: new Date(),
      },
      content: `Poll: ${question}`,
    });

    const savedMessage = await newMessage.save();

    const io = getIO();
    const recipientSocketId = users[receiverId];
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('new_message', savedMessage);
    } else {
      console.log(`User ${receiverId} is offline → poll will be delivered later.`);
    }

    return res.status(201).json(savedMessage);
  } catch (error) {
    console.error('Error creating poll:', error);
    return res.status(500).json({ message: 'Error creating poll' });
  }
});

// POST share contacts
router.post('/api/messages/contacts', async (req, res) => {
  try {
    const { senderId, receiverId, messageType, contacts, poll, event, ...rest } = req.body;
    
    if (messageType === 'contact') {
      const newMessage = new Message({
        sender: senderId,
        receiver: receiverId,
        messageType: 'contact',
        contacts: contacts || [],
        content: `Shared ${contacts.length} contact(s)`,
      });
      const savedMessage = await newMessage.save();

      const io = getIO();
      const recipientSocketId = users[receiverId];
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('new_message', savedMessage);
      } else {
        console.log(`User ${receiverId} is offline → contact message will be delivered later.`);
      }

      return res.status(201).json(savedMessage);
    }

    return res.status(400).json({ message: 'Invalid message type' });
  } catch (error) {
    console.error('Error creating message:', error);
    return res.status(500).json({ message: 'Error creating message' });
  }
});

// ==============================================
// MESSAGE INTERACTIONS (REACTIONS, SEARCH)
// ==============================================

// POST react to message (add emoji)
router.post('/api/messages/:messageId/react', async (req, res) => {
  const { messageId } = req.params;
  const { userId, emoji } = req.body;

  if (!mongoose.Types.ObjectId.isValid(messageId)) {
    return res.status(400).json({ message: 'Invalid message ID format' });
  }
  if (!emoji) {
    return res.status(400).json({ message: 'Emoji is required.' });
  }

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    message.reactions = message.reactions || [];
    message.reactions = message.reactions.filter(
      (r) => r.userId.toString() !== userId
    );
    message.reactions.push({ userId, emoji, createdAt: new Date() });

    const updatedMessage = await message.save();

    const io = getIO();
    const receiverId = updatedMessage.receiver.toString();
    const recipientSocketId = users[receiverId];
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('message_updated', updatedMessage);
    }
    const reactorSocketId = users[userId];
    if (reactorSocketId && reactorSocketId !== recipientSocketId) {
      io.to(reactorSocketId).emit('message_updated', updatedMessage);
    }

    return res.json(updatedMessage);
  } catch (error) {
    console.error('Error reacting to message:', error);
    return res.status(500).json({ message: 'Error reacting to message' });
  }
});

// GET search messages within conversation
router.get('/api/messages/search', async (req, res) => {
  const { userId, targetUserId, searchTerm } = req.query;

  try {
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: targetUserId },
        { sender: targetUserId, receiver: userId },
      ],
      content: { $regex: searchTerm, $options: 'i' },
      deletedFor: { $ne: userId },
    }).sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    console.error("Error searching messages:", error);
    res.status(500).json({ message: "Error searching messages" });
  }
});

// GET unread message count
router.get('/api/messages/unread-count', async (req, res) => {
  const { userId } = req.query;

  try {
    const count = await Message.countDocuments({
      receiver: userId,
      isRead: false,
      deletedFor: { $ne: userId }
    });

    res.json({ count });
  } catch (error) {
    console.error("Error getting unread message count:", error);
    res.status(500).json({ message: "Error getting unread message count" });
  }
});

module.exports = router;