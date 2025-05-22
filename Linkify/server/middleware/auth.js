module.exports = (req, res, next) => {
  // Get user ID from header
  const userId = req.headers['x-user-id'];
  
  if (!userId) {
    return res.status(401).json({ 
      success: false,
      message: 'User ID required in X-User-ID header' 
    });
  }

  // Basic validation - check if it looks like a MongoDB ID
  if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID format'
    });
  }

  // Attach to request
  req.user = { id: userId };
  next();
};