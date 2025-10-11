// const JWT = require("jsonwebtoken");

// const secret = process.env.JWT_SECRET || "mysecretkey";  // You can set JWT_SECRET in your .env file for better security

// // Function to create a token for the user
// function createTokenuser(user) {
//     const payload = {
//         _id: user._id,
//         email: user.email,
//         username: user.username, // Removed duplicate 'email' field
//     };

//     const token = JWT.sign(payload, secret, { expiresIn: process.env.JWT_EXPIRATION || '1h' });  // Can make expiration time configurable
//     return token;
// }   

// // Function to validate the token
// function validateToken(token) {
//     if (!token) {
//       throw new Error('Token is missing');
//     }
  
//     try {
//       const payload = JWT.verify(token, secret);
//       return payload;
//     } catch (error) {
//       if (error.name === 'TokenExpiredError') {
//         throw new Error('Token has expired');
//       } else if (error.name === 'JsonWebTokenError') {
//         throw new Error('Invalid token');
//       }
//       throw new Error('Invalid or expired token');
//     }
//   }
  

// module.exports = { createTokenuser, validateToken };
const JWT = require("jsonwebtoken");

const secret = process.env.JWT_SECRET_KEY || "mysecretkey";  // Changed to match your auth route

// Function to create a token for the user
function createTokenuser(user) {
    const payload = {
        userId: user._id,  // Changed from _id to userId to match your auth route
        email: user.email,
        username: user.username,
        name: user.name,
        profilePicture: user.profilePicture,
        isVerified: user.isVerified,
        profileCompleted: user.profileCompleted
    };

    const token = JWT.sign(payload, secret, { expiresIn: process.env.JWT_EXPIRATION || '7d' });  // Changed to 7d to match your auth route
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

// Middleware to verify token (for use in routes)
function verifyToken(req, res, next) {
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                  req.cookies?.auth_token ||
                  req.query?.token;
    
    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = validateToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: error.message });
    }
}

// Generate token specifically for Google OAuth (with extended expiry)
function generateGoogleAuthToken(user) {
    const payload = {
        userId: user._id,
        email: user.email,
        username: user.username,
        name: user.name,
        profilePicture: user.profilePicture,
        isVerified: true, // Google users are always verified
        authMethod: 'google' // Identify authentication method
    };

    return JWT.sign(payload, secret, { expiresIn: '30d' }); // Longer expiry for OAuth
}

// Generate token for regular login
function generateRegularToken(user) {
    const payload = {
        userId: user._id,
        email: user.email,
        username: user.username,
        name: user.name,
        profilePicture: user.profilePicture,
        isVerified: user.isVerified,
        authMethod: 'regular'
    };

    return JWT.sign(payload, secret, { expiresIn: process.env.JWT_EXPIRATION || '7d' });
}

// Check if token is about to expire (for refresh logic)
function isTokenExpiringSoon(token) {
    try {
        const decoded = JWT.decode(token);
        if (!decoded || !decoded.exp) return false;
        
        const currentTime = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = decoded.exp - currentTime;
        
        // Consider token expiring if less than 15 minutes left
        return timeUntilExpiry < 900;
    } catch (error) {
        return false;
    }
}

// Refresh token function
function refreshToken(oldToken) {
    try {
        const decoded = validateToken(oldToken);
        delete decoded.iat;
        delete decoded.exp;
        
        return JWT.sign(decoded, secret, { expiresIn: process.env.JWT_EXPIRATION || '7d' });
    } catch (error) {
        throw new Error('Cannot refresh invalid token');
    }
}

module.exports = { 
    createTokenuser, 
    validateToken, 
    verifyToken,
    generateGoogleAuthToken,
    generateRegularToken,
    isTokenExpiringSoon,
    refreshToken
};