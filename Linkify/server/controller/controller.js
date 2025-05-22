const User = require('../model/suggestmodel');

// Get user suggestions
const getUserSuggestions = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Fetch the current user's data
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Assume `connections` is an array of user IDs in the currentUser document
    const connectedUsers = currentUser.connections || [];

    // Fetch suggestions (exclude current user and connected users)
    const suggestions = await User.find({
      _id: { $nin: [userId, ...connectedUsers] }, // Exclude current user and connected users
    }).select('name bio company jobTitle profilePicture'); // Return only necessary fields

    res.status(200).json(suggestions);
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getUserSuggestions };
