const JWT = require("jsonwebtoken");

const secret = process.env.JWT_SECRET || "mysecretkey";  // You can set JWT_SECRET in your .env file for better security

// Function to create a token for the user
function createTokenuser(user) {
    const payload = {
        _id: user._id,
        email: user.email,
        username: user.username, // Removed duplicate 'email' field
    };

    const token = JWT.sign(payload, secret, { expiresIn: process.env.JWT_EXPIRATION || '1h' });  // Can make expiration time configurable
    return token;
}   

// Function to validate the token
function validateToken(token) {
    if (!token) {
      throw new Error('Token is missing');
    }
  
    try {
      const payload = JWT.verify(token, secret);
      return payload;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      }
      throw new Error('Invalid or expired token');
    }
  }
  

module.exports = { createTokenuser, validateToken };
