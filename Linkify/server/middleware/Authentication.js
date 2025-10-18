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
        // Check for token in headers
        const authHeader = req.headers['authorization'];
        const tokenFromHeader = authHeader && authHeader.startsWith('Bearer ') 
            ? authHeader.slice(7) 
            : null;

        // Check for token in cookies
        const tokenFromCookie = req.cookies?.auth_token;

        // Use token from header first, then from cookie
        const token = tokenFromHeader || tokenFromCookie;

        if (!token) {
            return res.status(401).json({ 
                message: 'Access denied. No token provided.' 
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
            const user = await User.findById(decoded.userId).select('-password');
            
            if (!user) {
                return res.status(401).json({ 
                    message: 'Invalid token. User not found.' 
                });
            }

            req.user = user;
            next();
        } catch (jwtError) {
            console.error('JWT verification error:', jwtError);
            return res.status(401).json({ 
                message: 'Invalid or expired token.' 
            });
        }
    } catch (error) {
        console.error('Authentication middleware error:', error);
        return res.status(500).json({ 
            message: 'Internal server error during authentication.' 
        });
    }
};

module.exports = checkForAuthenticationHeader;