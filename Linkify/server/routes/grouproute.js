const express = require("express");
const router = express.Router();
const Group = require('../model/groupmodel');
const User = require('../model/usermodel');
const Message = require('../model/messagemodel');

// Create new group
router.post('/', async (req, res) => {
  try {
    const { name, creator, members } = req.body;
    
    if (!name || !creator || !members || members.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Ensure creator is included in members
    if (!members.includes(creator)) {
      members.push(creator);
    }
    
    const newGroup = new Group({
      name,
      creator,
      members
    });
    
    await newGroup.save();
    
    // Populate members and creator for response
    const populatedGroup = await Group.findById(newGroup._id)
      .populate('members', 'username profilePicture')
      .populate('creator', 'username profilePicture');
    
    res.status(201).json(populatedGroup);
  } catch (err) {
    console.error('Error creating group:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get groups for user
router.get('/user/:userId', async (req, res) => {
  try {
    const groups = await Group.find({
      members: req.params.userId
    })
    .populate({
      path: 'lastMessage',
      populate: {
        path: 'sender',
        select: 'username'
      }
    })
    .populate('members', 'username profilePicture');
    
    res.json(groups);
  } catch (err) {
    console.error('Error fetching groups:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get group details
router.get('/:groupId', async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate('members', 'username profilePicture')
      .populate('creator', 'username profilePicture');
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    res.json(group);
  } catch (err) {
    console.error('Error fetching group:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add members to group
router.patch('/add-members/:groupId', async (req, res) => {
  try {
    const { members } = req.body;
    
    if (!members || members.length === 0) {
      return res.status(400).json({ error: 'No members provided' });
    }
    
    const group = await Group.findByIdAndUpdate(
      req.params.groupId,
      { $addToSet: { members: { $each: members } } },
      { new: true }
    ).populate('members', 'username profilePicture');
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    res.json(group);
  } catch (err) {
    console.error('Error adding members:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove member from group
router.patch('/remove-member/:groupId', async (req, res) => {
  try {
    const { memberId } = req.body;
    
    const group = await Group.findByIdAndUpdate(
      req.params.groupId,
      { $pull: { members: memberId } },
      { new: true }
    ).populate('members', 'username profilePicture');
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    res.json(group);
  } catch (err) {
    console.error('Error removing member:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update group info
router.patch('/:groupId', async (req, res) => {
  try {
    const { name, image } = req.body;
    
    const group = await Group.findByIdAndUpdate(
      req.params.groupId,
      { name, image },
      { new: true }
    ).populate('members', 'username profilePicture');
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    res.json(group);
  } catch (err) {
    console.error('Error updating group:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete group
router.delete('/:groupId', async (req, res) => {
  try {
    const group = await Group.findByIdAndDelete(req.params.groupId);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Optionally delete all group messages
    await Message.deleteMany({ group: req.params.groupId });
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting group:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;