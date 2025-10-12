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

function checkForAuthenticationHeader() {
  return (req, res, next) => {
    // Check for token in multiple places
    let token = req.headers['authorization'];
    
    if (token && token.startsWith('Bearer ')) {
      token = token.slice(7, token.length);
    } else if (req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      
      // Ensure the decoded payload has the expected structure
      if (!decoded || !decoded.userId) {
        return res.status(401).json({ message: 'Unauthorized: Invalid token structure' });
      }

      req.user = decoded; // Attach the user data to the request object
      return next(); // Proceed to the next middleware or route handler
    } catch (error) {
      console.error('Token verification failed:', error);
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Unauthorized: Token expired' });
      }
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
      }
      
      return res.status(401).json({ message: 'Unauthorized: Token verification failed' });
    }
  };
}

module.exports = checkForAuthenticationHeader;