const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../model/usermodel'); // Adjust the path as per your project structure
const { checkForAuthenticationCookie } = require('../middleware/middleware'); // Adjust path as needed
const { uploadProfilePic } = require('../cloudinary');
require('dotenv').config();
const router = Router();
const checkForAuthenticationHeader=require('../middleware/Authentication');     
const Connection = require('../model/connectionmodel');

// Utility function to set cookies
const setCookie = (res, token) => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    const cookieOptions = {
        httpOnly: true,
        secure: true, // true in production
        sameSite: 'None', // 'none' for cross-site
        maxAge: 3600 * 1000, // 1 hour
        path: '/',
    };
    res.cookie('auth_token', token, cookieOptions);
};

// POST: Signin (Login)
router.post('/Signin', async (req, res) => {
    const { email, password } = req.body;
    console.log('Email:', email);
    console.log('Password:', password);
    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password' });
    }

    try {
        const user = await User.findOne({ email });
        console.log('User:', user);
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        console.log("Email provided:", email);
        console.log("User found in DB:", user);
        console.log("Plain Password provided:", password);
        console.log("Stored Hashed Password:", user.password);
        const isMatch = await bcrypt.compare(password, user.password);
        console.log("Result of bcrypt.compare():", isMatch);
        const hashedPassword = await bcrypt.hash(password, 10);
console.log('Password before hashing:', password);
console.log('Password after hashing:', hashedPassword);


        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });   
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
            expiresIn: '1h',
        });
        console.log('Token Signin:', token);
                
        setCookie(res, token);
        return res.json({ message: 'Signin successful', user,token });  
    } catch (error) {
        console.error('Signin error:', error);
        return res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});

// GET: Signout (Logout)
router.get('/Signout', (req, res) => {
    res.clearCookie('auth_token').json({ message: 'Signout successful' });
});

// GET: All users
router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) { 
        res.status(500).json({ error: 'Failed to fetch users', details: error.message });
    }
});
// GET: User by ID
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user', details: error.message });
    }
});
// POST: Signup(Register)
router.post('/Signup', [
    body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('email').isEmail().withMessage('Invalid email format'),
    body('password')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
        .matches(/\d/).withMessage('Password must contain at least one number')
        .matches(/[^A-Za-z\d]/).withMessage('Password must contain at least one special character'),
], async (req, res) => {
    const { username, email, password } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            username,
            email,
            password,
        });
        await user.save(); 
        return res.status(201).json({
            message: 'User created successfully',
            user
        });
    } catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});

router.post('/upload-profile-pic/:userId', uploadProfilePic.single('profilePicture'), async (req, res) => {
    try {
      const { userId } = req.params;
  console.log(userId)
      if (!req.file || !userId) {
        return res.status(400).json({ message: 'User ID and file are required' });
      }
  
      const user = await User.findByIdAndUpdate(
        userId,
        { profilePicture: req.file.path },
        { new: true }
      );
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.status(200).json({
        message: 'Profile picture uploaded successfully',
        profilePicture: user.profilePicture,
      });
    } catch (error) {
      console.error('Profile picture upload error:', error);
      res.status(500).json({ message: 'Error uploading profile picture' });
    }
  });
// POST: Update personal details (including profile picture URL from Cloudinary)
router.post('/update-details/:userId', async (req, res) => {
    const { name, bio, jobTitle, company, profilePicture } = req.body;
    const { userId } = req.params;

    if (!name || !bio || !jobTitle || !company) {
        return res.status(400).json({ message: 'All personal details are required' });
    }

    try {
        const updateData = {
            name,
            bio,
            jobTitle,
            company,
        };

        if (profilePicture) {
            updateData.profilePicture = profilePicture;
        }

        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({
            message: 'Personal details updated successfully',
            user
        });
    } catch (error) {
        console.error('Update details error:', error);
        return res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});

// POST: Forgot Password
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
        const mailOptions = {
            to: user.email,
            from: process.env.EMAIL_USERNAME,
            subject: 'Password Reset Request',
            text: `You requested a password reset. Click here: ${resetURL}`,
        };

        await transporter.sendMail(mailOptions);
        return res.status(200).json({ message: 'Password reset email sent' });
    } catch (error) {
        console.error('Forgot password error:', error);
        return res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});

// POST: Reset Password
router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ message: 'Password is required' });
    }

    try {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        user.password = await bcrypt.hash(password, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        return res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});

// GET: Authenticated User (Profile) 
router.use(cookieParser());
router.get('/me/:id', checkForAuthenticationHeader(), async (req, res) => {
    let userId = req.params.id;
  
    if (userId === "me") {
      userId = req.user.userId; // Use the userId from the token
    }
  
    try {
      const user = await User.findById(userId).select('-password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching user' });
    }
  });
 // POST: Update personal details after signup
router.post('/update-details/:userId', async (req, res) => {
    const { name, profilePicture, bio, jobTitle, company } = req.body;
    const { userId } = req.params;
  
    if (!name || !profilePicture || !bio || !jobTitle || !company) {
      return res.status(400).json({ message: 'All personal details are required' });
    }
  
    try {
      // Find user by ID and update their personal details
      const user = await User.findByIdAndUpdate(userId, {
        name,
        profilePicture,
        bio,
        jobTitle,
        company,
      }, { new: true });
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      return res.status(200).json({ message: 'Personal details updated successfully', user });
    } catch (error) {
      console.error('Update details error:', error);
      return res.status(500).json({ message: 'Server error. Please try again later.' });
    }
  });
  // Get user by ID
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('username profilePicture bio connections isOnline lastSeen');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user connections
router.get('/connections/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('connections', 'username profilePicture isOnline lastSeen');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user.connections);
  } catch (err) {
    console.error('Error fetching connections:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get suggested connections
router.get('/suggested/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get users who are not already connected
    const suggestedUsers = await User.find({
      _id: { $nin: [...user.connections, user._id] },
      $or: [
        { 'profile.industry': user.profile?.industry },
        { 'profile.skills': { $in: user.profile?.skills || [] } }
      ]
    })
    .select('username profilePicture bio')
    .limit(10);
    
    res.json(suggestedUsers);
  } catch (err) {
    console.error('Error fetching suggested connections:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add connection
router.patch('/add-connection/:userId', async (req, res) => {
  try {
    const { connectionId } = req.body;
    
    await User.findByIdAndUpdate(req.params.userId, {
      $addToSet: { connections: connectionId }
    });
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error adding connection:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove connection
router.patch('/remove-connection/:userId', async (req, res) => {
  try {
    const { connectionId } = req.body;
    
    await User.findByIdAndUpdate(req.params.userId, {
      $pull: { connections: connectionId }
    });
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error removing connection:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update online status
router.patch('/update-status/:userId', async (req, res) => {
  try {
    const { isOnline } = req.body;
    
    const update = { isOnline };
    if (!isOnline) {
      update.lastSeen = new Date();
    }
    
    await User.findByIdAndUpdate(req.params.userId, update);
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
module.exports = router;
