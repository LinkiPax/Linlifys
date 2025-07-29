const { connections } = require("mongoose");
const UserDetails = require("../model/adddatamodel");
const User = require("../model/userModel"); // Assuming this is your User model from API 1
const multer = require("multer");
const cloudinary=require('cloudinary').v2;
require('dotenv').config();
const { unlinkAsync } = require('../cloudinary');
// Multer Setup for File Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Add user details
const addUserDetails = async (req, res) => {
  const { userId, socialLinks, interests, location, occupation, achievements, hobbies } = req.body;
  
  try {
    let backgroundImage = {
      public_id: "default_background",
      secure_url: "https://via.placeholder.com/1200x400"
    };
    
    if (req.file) {
      try {
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "background_images"
        });
        
        // Update backgroundImage object with Cloudinary response
        backgroundImage = {
          public_id: result.public_id,
          secure_url: result.secure_url
        };
        
        // Delete the local file after successful upload
        await unlinkAsync(req.file.path);
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        // Delete the local file if upload failed
        if (req.file.path) await unlinkAsync(req.file.path);
        throw uploadError;
      }
    }

    const userDetails = new UserDetails({
      userId,
      backgroundImage, 
      socialLinks: socialLinks ? JSON.parse(socialLinks) : {},
      interests: interests ? JSON.parse(interests) : [],
      location,
      occupation,
      achievements: achievements ? JSON.parse(achievements) : [],
      hobbies: hobbies ? JSON.parse(hobbies) : [],
    });

    const savedDetails = await userDetails.save();
    res.status(201).json(savedDetails);
  } catch (error) {
    console.error("Error adding user details:", error);
    res.status(500).json({ 
      success: false,
      message: "Error adding user details",
      error: error.message 
    });
  }
};

// Fetch user details
const getUserDetails = async (req, res) => {
  const { userId } = req.params;

  try {
    const userDetails = await UserDetails.findOne({ userId });

    if (!userDetails) {
      return res.status(404).json({ message: "User details not found" });
    }

    res.status(200).json(userDetails);
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Error fetching user details", error });
  }
};

// Get merged user data
const getMergedUserData = async (req, res) => {
  const { userId } = req.params;

  try {
    // Fetch data from API 1 (`users` collection)
    const userData = await User.findById(userId);

    if (!userData) {
      return res.status(404).json({ message: "User not found in API 1" });
    }

    // Fetch data from API 2 (`userDetails` collection)
    const userDetailsData = await UserDetails.findOne({ userId });

    // Merge data
    const mergedData = {
      userId: userData._id,
      name: userData.name,
      email: userData.email,
      connections: userData.connections,
      bio: userDetailsData?.bio || userData.bio || "No bio available",
      company: userDetailsData?.company || userData.company || "No company specified",
      jobTitle: userDetailsData?.jobTitle || userData.jobTitle || "No job title specified",
      profilePicture:
        userDetailsData?.profilePicture || userData.profilePicture || "https://via.placeholder.com/150",
      backgroundImage: userDetailsData?.backgroundImage || "https://via.placeholder.com/1200x400",
      socialLinks: userDetailsData?.socialLinks || [],
      interests: userDetailsData?.interests || [],
      location: userDetailsData?.location || "No location specified",
      occupation: userDetailsData?.occupation || "No occupation specified",
      achievements: userDetailsData?.achievements || [],
      hobbies: userDetailsData?.hobbies || [],
    };

    // Send merged data
    return res.status(200).json(mergedData);
  } catch (error) {
    console.error("Error fetching merged user data:", error);
    res.status(500).json({ message: "Error fetching user data", error });
  }
};

module.exports = { upload,addUserDetails, getUserDetails, getMergedUserData };
