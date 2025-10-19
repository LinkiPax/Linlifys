// const jwt = require('jsonwebtoken');

// function checkForAuthenticationHeader() {
//   return (req, res, next) => {
//     const token = req.headers['authorization']?.split(' ')[1]; // Extract token from "Bearer <token>"
    
//     if (!token) {
//       return res.status(401).json({ message: 'Unauthorized: No token provided' });
//     }

//     try {
//       const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY); // Decode and verify the token
      
//       // Ensure the decoded payload has the expected structure, e.g., { userId, ... }
//       if (!decoded || !decoded.userId) {
//         return res.status(401).json({ message: 'Unauthorized: Invalid token structure' });
//       }

//       req.user = decoded; // Attach the user data to the request object
//       return next(); // Proceed to the next middleware or route handler
//     } catch (error) {
//       console.error('Token verification failed:', error); // Optional: Log the error
//       return res.status(401).json({ message: 'Unauthorized: Invalid token' });
//     }
//   };
// }

// module.exports = checkForAuthenticationHeader;
const jwt = require('jsonwebtoken');
const User = require('../model/usermodel');

const checkForAuthenticationHeader = async (req, res, next) => {
  try {
    // 1️⃣ Extract token from Authorization header
    const authHeader = req.headers['authorization'];
    const tokenFromHeader =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : null;

    // 2️⃣ Extract token from cookies (works for frontend withCredentials)
    const tokenFromCookie = req.cookies?.auth_token;

    // 3️⃣ Prefer header token (API calls), fallback to cookie (browser sessions)
    const token = tokenFromHeader || tokenFromCookie;

    if (!token) {
      return res.status(401).json({
        message: 'Access denied. No token provided.',
        code: 'NO_TOKEN',
      });
    }

    // 4️⃣ Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch (err) {
      console.error('JWT verification error:', err);

      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          message: 'Token expired.',
          code: 'TOKEN_EXPIRED',
        });
      }

      return res.status(401).json({
        message: 'Invalid token.',
        code: 'INVALID_TOKEN',
      });
    }

    // 5️⃣ Validate decoded payload
    if (!decoded.userId) {
      return res.status(400).json({
        error: 'Invalid token payload.',
        message: 'User ID missing in token.',
      });
    }

    // 6️⃣ Verify user exists in DB
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({
        message: 'User not found.',
        code: 'USER_NOT_FOUND',
      });
    }

    // 7️⃣ Attach user to request
    req.user = user;

    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
      message: 'Internal server error during authentication.',
      code: 'AUTH_ERROR',
    });
  }
};

module.exports = checkForAuthenticationHeader;
