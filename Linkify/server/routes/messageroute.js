const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const Message = require('../model/messagemodel');

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

// POST new message (text or audio)
router.post('/api/messages', async (req, res) => {
  const { senderId, receiverId, content, audioURL } = req.body;

  if (!content && (!audioURL || audioURL.trim() === '')) {
    return res.status(400).json({ message: "Message must include text or audio." });
  }

  try {
    const isAudioMessage = audioURL && audioURL.trim() !== "";

    const newMessage = new Message({
      sender: senderId,
      receiver: receiverId,
      content,
      audioURL,
      isAudioMessage,
    });

    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error saving message:", error);
    res.status(500).json({ message: "Error saving message" });
  }
});


router.post('/api/messages/live-location', async (req, res) => {
  try {
    const { senderId, receiverId, location, content } = req.body;
    // Create the message document directly
    const messageData = new Message({
      senderId: senderId,
      receiverId: receiverId,
      messageType: 'location',
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        duration: location.duration,
        live: location.live,
        expiresAt: new Date(location.expiresAt)
      },
      content: content || 'Shared live location'
    })
  
    // Use create() instead of new Message()
    // const savedMessage = await Message.create(messageData);
    await messageData.save();
    res.status(201).json(messageData);
  } catch (error) {
    console.error("Error saving location message:", error);
    res.status(500).json({
      message: "Failed to save location",
      error: error.message
    });
  }
});

// POST share document
router.post('/api/messages/documents', async (req, res) => {
  const { senderId, receiverId, document } = req.body;

  if (!document || !document.url || !document.name) {
    return res.status(400).json({ message: "Document URL and name are required." });
  }

  try {
    const newMessage = new Message({
      sender: senderId,
      receiver: receiverId,
      messageType: 'document',
      document: {
        url: document.url,
        name: document.name,
        size: document.size || 0,
        type: document.type || 'application/octet-stream',
        thumbnail: document.thumbnail || ''
      },
      content: `Shared document: ${document.name}`
    });

    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error sharing document:", error);
    res.status(500).json({ message: "Error sharing document" });
  }
});

// POST create poll
router.post('/api/messages/polls', async (req, res) => {
  const { senderId, receiverId, question, options, isMultiSelect, duration } = req.body;

  if (!question || !options || options.length < 2) {
    return res.status(400).json({ message: "Question and at least 2 options are required." });
  }

  try {
    const newMessage = new Message({
      sender: senderId,
      receiver: receiverId,
      messageType: 'poll',
      poll: {
        question,
        options: options.map(option => ({
          text: option.text,
          voters: []
        })),
        isMultiSelect: isMultiSelect || false,
        totalVotes: 0,
        expiresAt: duration ? new Date(Date.now() + duration * 60000) : null
      },
      content: `Poll: ${question}`
    });

    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error creating poll:", error);
    res.status(500).json({ message: "Error creating poll" });
  }
});

// POST vote in poll
router.post('/api/messages/polls/:pollId/vote', async (req, res) => {
  const { pollId } = req.params;
  const { userId, optionIndices } = req.body;

  if (!mongoose.Types.ObjectId.isValid(pollId)) {
    return res.status(400).json({ message: "Invalid poll ID format" });
  }

  if (!Array.isArray(optionIndices)) {
    return res.status(400).json({ message: "Option indices must be an array" });
  }

  try {
    const message = await Message.findById(pollId);
    
    if (!message || message.messageType !== 'poll') {
      return res.status(404).json({ message: "Poll not found" });
    }

    // Check if poll is expired
    if (message.poll.expiresAt && message.poll.expiresAt < new Date()) {
      return res.status(400).json({ message: "This poll has expired" });
    }

    // Check if user already voted (unless multi-select allows revoting)
    const hasVoted = message.poll.options.some(option => 
      option.voters.includes(userId)
    );
    
    if (hasVoted && !message.poll.isMultiSelect) {
      return res.status(400).json({ message: "You have already voted in this poll" });
    }

    // Process votes
    optionIndices.forEach(index => {
      if (index >= 0 && index < message.poll.options.length) {
        if (!message.poll.options[index].voters.includes(userId)) {
          message.poll.options[index].voters.push(userId);
        }
      }
    });

    // Update total votes count
    message.poll.totalVotes = message.poll.options.reduce(
      (total, option) => total + option.voters.length, 0
    );

    await message.save();
    res.json(message);
  } catch (error) {
    console.error("Error voting in poll:", error);
    res.status(500).json({ message: "Error voting in poll" });
  }
});

// POST create event
router.post('/api/messages/events', async (req, res) => {
  const { senderId, receiverId, title, description, date, location, attendees } = req.body;

  if (!title || !date) {
    return res.status(400).json({ message: "Title and date are required." });
  }

  try {
    const newMessage = new Message({
      sender: senderId,
      receiver: receiverId,
      messageType: 'event',
      event: {
        title,
        description: description || '',
        date: new Date(date),
        location: location || '',
        attendees: attendees || [],
        organizer: senderId
      },
      content: `Event: ${title} on ${new Date(date).toLocaleString()}`
    });

    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ message: "Error creating event" });
  }
});

// POST RSVP to event
router.post('/api/messages/events/:eventId/rsvp', async (req, res) => {
  const { eventId } = req.params;
  const { userId, status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    return res.status(400).json({ message: "Invalid event ID format" });
  }

  const validStatuses = ['going', 'not_going', 'maybe'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid RSVP status" });
  }

  try {
    const message = await Message.findById(eventId);
    
    if (!message || message.messageType !== 'event') {
      return res.status(404).json({ message: "Event not found" });
    }

    // Remove existing RSVP if exists
    message.event.attendees = message.event.attendees.filter(
      attendee => attendee.userId.toString() !== userId
    );

    // Add new RSVP
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

// PATCH mark multiple messages as read
router.patch('/api/messages/mark-as-read', async (req, res) => {
  const { messageIds } = req.body;

  try {
    const result = await Message.updateMany(
      { _id: { $in: messageIds } },
      { $set: { isRead: true } }
    );

    res.json({ success: true, updatedCount: result.modifiedCount });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ message: "Error marking messages as read" });
  }
});

// PATCH soft-delete a message
router.patch('/api/messages/:messageId', async (req, res) => {
  const { messageId } = req.params;
  const { userId } = req.body;

  // Check if the ID is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(messageId)) {
    return res.status(400).json({ message: "Invalid message ID format" });
  }

  try {
    const message = await Message.findById(messageId);
    console.log(message);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (!message.deletedFor.includes(userId)) {
      message.deletedFor.push(userId);
      await message.save();
    }

    res.json({ success: true, message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ message: "Error deleting message" });
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
    });

    res.json({ count });
  } catch (error) {
    console.error("Error getting unread message count:", error);
    res.status(500).json({ message: "Error getting unread message count" });
  }
});

// POST typing status (placeholder)
router.post('/api/messages/typing-status', async (req, res) => {
  const { userId, targetUserId, isTyping } = req.body;

  try {
    res.json({
      success: true,
      data: { userId, targetUserId, isTyping }
    });
  } catch (error) {
    console.error("Error updating typing status:", error);
    res.status(500).json({ message: "Error updating typing status" });
  }
});
router.get('/api/debug-test', async (req, res) => {
  const testData = {
    sender: '507f1f77bcf86cd799439011', // Valid mock ObjectId string
    receiver: '507f191e810c19729de860ea',
    messageType: 'location',
    location: {
      latitude: 26.8467,
      longitude: 80.9462,
      duration: 15,
      live: true,
      expiresAt: new Date()
    }
  };
 
  try {
    const testMessage = await Message.create(testData);
    res.json({ success: true, testMessage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;