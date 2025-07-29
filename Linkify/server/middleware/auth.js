// Update your simpleAuth middleware to be more descriptive
module.exports = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  
  if (!userId) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication required. Please include X-User-ID header' 
    });
  }

  if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID format'
    });
  }

  req.user = { id: userId };
  next();
};