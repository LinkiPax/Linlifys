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
                message: 'Access denied. No token provided.',
                code: 'NO_TOKEN'
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
            
            // Validate user ID
            if (!decoded.userId) {
                return res.status(400).json({
                    error: 'Invalid user ID',
                    message: 'User ID not found in token'
                });
            }

            const user = await User.findById(decoded.userId).select('-password');
            
            if (!user) {
                return res.status(401).json({ 
                    message: 'Invalid token. User not found.',
                    code: 'USER_NOT_FOUND'
                });
            }

            req.user = user;
            next();
        } catch (jwtError) {
            console.error('JWT verification error:', jwtError);
            
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    message: 'Token expired.',
                    code: 'TOKEN_EXPIRED'
                });
            }
            
            if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({ 
                    message: 'Invalid token.',
                    code: 'INVALID_TOKEN'
                });
            }
            
            return res.status(401).json({ 
                message: 'Token verification failed.',
                code: 'TOKEN_VERIFICATION_FAILED'
            });
        }
    } catch (error) {
        console.error('Authentication middleware error:', error);
        return res.status(500).json({ 
            message: 'Internal server error during authentication.',
            code: 'AUTH_ERROR'
        });
    }
};
module.exports = checkForAuthenticationHeader;