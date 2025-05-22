const jwt = require("jsonwebtoken");
const { validateToken } = require("../service/authentication1");  // Assuming validateToken is a function
const DEFAULT_COOKIE_NAME = "auth_token";
require("dotenv").config();

function checkForAuthenticationCookie(cookieName = DEFAULT_COOKIE_NAME, options = { strict: false }) {
  return (req, res, next) => {
    // Ensure cookie-parser is used
    if (!req.cookies) {
      console.error("Cookies not found. Ensure 'cookie-parser' middleware is applied.");
      return res.status(500).json({ message: "Server error: Cookies not parsed" });
    }

    const token = req.cookies[cookieName];
    console.log("Received token middleware:", token);
    
    // If no token is found and strict mode is enabled, return Unauthorized
    if (!token) {
      if (options.strict) {
        console.warn("No token provided. Strict mode enabled.");
        return res.status(401).json({ message: "Unauthorized: No token provided" });
      }
      // Continue without authentication if not in strict mode
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      console.log("Decoded Token:", decoded);

      // Use validateToken if available, otherwise use the decoded token
      const userPayload = validateToken && typeof validateToken === 'function' 
        ? validateToken(token) 
        : decoded;

      if (!userPayload) {
        throw new Error("Invalid token payload");
      }

      req.user = userPayload;  // Attach user data to the request object
      console.log(`Authenticated user: ${userPayload.userId}`);

      return next();  // Proceed to the next middleware or route handler
    } catch (error) {
      console.error("Token validation error:", error.message);

      // Handle different types of token errors
      if (error.name === "TokenExpiredError") {
        console.warn("Authentication token has expired");
        if (options.strict) {
          return res.status(401).json({ message: "Unauthorized: Token expired" });
        }

        // You can add logic to refresh the token if expired (if using refresh tokens)
        return next(); // Continue to allow non-strict token expired behavior
      }
      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
      }

      // General error for invalid token cases
      if (options.strict) {
        return res.status(401).json({ message: "Unauthorized: Token validation failed" });
      }
      
      return next(); // If not in strict mode, continue the request flow
    }
  };
}

module.exports = { checkForAuthenticationCookie };
