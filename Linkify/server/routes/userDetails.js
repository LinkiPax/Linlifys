const express = require("express");
const {upload, addUserDetails, getUserDetails, getMergedUserData } = require("../controller/userDetailController");

const router = express.Router();

// Add user details
router.post("/user-details",upload.single("backgroundImage"), addUserDetails);

// Fetch user details
router.get("/user-details/:userId", getUserDetails);

// Fetch merged user data (API 2)
router.get("/merged-user-details/:userId", getMergedUserData);

module.exports = router;
