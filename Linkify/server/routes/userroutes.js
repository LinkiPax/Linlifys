// const { Router } = require('express');
// const { body, validationResult } = require('express-validator');
// const bcrypt = require('bcryptjs');
// const crypto = require('crypto');
// const cookieParser = require('cookie-parser');
// const nodemailer = require('nodemailer');
// const mongoose = require('mongoose');
// const jwt = require('jsonwebtoken');
// const User = require('../model/usermodel'); // Adjust the path as per your project structure
// const { checkForAuthenticationCookie } = require('../middleware/middleware'); // Adjust path as needed
// const { uploadProfilePic } = require('../cloudinary');
// require('dotenv').config();
// const router = Router();
// const checkForAuthenticationHeader=require('../middleware/Authentication');     
// const Connection = require('../model/connectionmodel');

// // Utility function to set cookies
// const setCookie = (res, token) => {
//     const isProduction = process.env.NODE_ENV === 'production';
    
//     const cookieOptions = {
//         httpOnly: false, // true in production
//         secure: false, // true in production
//         sameSite: 'none', // 'none' for cross-site
//         maxAge: 3600 * 1000, // 1 hour
//         path: '/',
//     };
//     res.cookie('auth_token',token, cookieOptions);
// };

// // POST: Signin (Login)
// router.post('/Signin', async (req, res) => {
//     const { email, password } = req.body;
//     console.log('Email:', email);
//     console.log('Password:', password);
//     if (!email || !password) {
//         return res.status(400).json({ message: 'Please provide email and password' });
//     }

//     try {
//         const user = await User.findOne({ email });
//         console.log('User:', user);
//         if (!user) {
//             return res.status(401).json({ message: 'Invalid email or password' });
//         }

//         console.log("Email provided:", email);
//         console.log("User found in DB:", user);
//         console.log("Plain Password provided:", password);
//         console.log("Stored Hashed Password:", user.password);
//         const isMatch = await bcrypt.compare(password, user.password);
//         console.log("Result of bcrypt.compare():", isMatch);
//         const hashedPassword = await bcrypt.hash(password, 10);
// console.log('Password before hashing:', password);
// console.log('Password after hashing:', hashedPassword);


//         if (!isMatch) {
//             return res.status(401).json({ message: 'Invalid email or password' });   
//         }

//         const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
//             expiresIn: '1h',
//         });
//         console.log('Token Signin:', token);
                
//         setCookie(res, token);
//         return res.json({ message: 'Signin successful', user,token });  
//     } catch (error) {
//         console.error('Signin error:', error);
//         return res.status(500).json({ message: 'Server error. Please try again later.' });
//     }
// });

// // GET: Signout (Logout)
// router.get('/Signout', (req, res) => {
//     res.clearCookie('auth_token').json({ message: 'Signout successful' });
// });

// // GET: All users
// router.get('/', async (req, res) => {
//     try {
//         const users = await User.find();
//         res.json(users);
//     } catch (error) { 
//         res.status(500).json({ error: 'Failed to fetch users', details: error.message });
//     }
// });
// // GET: User by ID
// router.get('/:id', async (req, res) => {
//     try {
//         const user = await User.findById(req.params.id);
//         if (!user) {
//             return res.status(404).json({ error: 'User not found' });
//         }
//         res.json(user);
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to fetch user', details: error.message });
//     }
// });
// // POST: Signup(Register)
// router.post('/Signup', [
//     body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
//     body('email').isEmail().withMessage('Invalid email format'),
//     body('password')
//         .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
//         .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
//         .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
//         .matches(/\d/).withMessage('Password must contain at least one number')
//         .matches(/[^A-Za-z\d]/).withMessage('Password must contain at least one special character'),
// ], async (req, res) => {
//     const { username, email, password } = req.body;
//     const errors = validationResult(req);

//     if (!errors.isEmpty()) {
//         return res.status(400).json({ errors: errors.array() });
//     }

//     try {
//         const existingUser = await User.findOne({ email });
//         if (existingUser) {
//             return res.status(400).json({ message: 'User already exists' });
//         }

//         // const hashedPassword = await bcrypt.hash(password, 10);

//         const user = await User.create({
//             username,
//             email,
//             password,
//         });
//         await user.save(); 
//         return res.status(201).json({
//             message: 'User created successfully',
//             user
//         });
//     } catch (error) {
//         console.error('Signup error:', error);
//         return res.status(500).json({ message: 'Server error. Please try again later.' });
//     }
// });

// router.post('/upload-profile-pic/:userId', uploadProfilePic.single('profilePicture'), async (req, res) => {
//     try {
//       const { userId } = req.params;
//   console.log(userId)
//       if (!req.file || !userId) {
//         return res.status(400).json({ message: 'User ID and file are required' });
//       }
  
//       const user = await User.findByIdAndUpdate(
//         userId,
//         { profilePicture: req.file.path },
//         { new: true }
//       );
  
//       if (!user) {
//         return res.status(404).json({ message: 'User not found' });
//       }
  
//       res.status(200).json({
//         message: 'Profile picture uploaded successfully',
//         profilePicture: user.profilePicture,
//       });
//     } catch (error) {
//       console.error('Profile picture upload error:', error);
//       res.status(500).json({ message: 'Error uploading profile picture' });
//     }
//   });
// // POST: Update personal details (including profile picture URL from Cloudinary)
// router.post('/update-details/:userId', async (req, res) => {
//     const { name, bio, jobTitle, company, profilePicture } = req.body;
//     const { userId } = req.params;

//     if (!name || !bio || !jobTitle || !company) {
//         return res.status(400).json({ message: 'All personal details are required' });
//     }

//     try {
//         const updateData = {
//             name,
//             bio,
//             jobTitle,
//             company,
//         };

//         if (profilePicture) {
//             updateData.profilePicture = profilePicture;
//         }

//         const user = await User.findByIdAndUpdate(
//             userId,
//             updateData,
//             { new: true }
//         );

//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         return res.status(200).json({
//             message: 'Personal details updated successfully',
//             user
//         });
//     } catch (error) {
//         console.error('Update details error:', error);
//         return res.status(500).json({ message: 'Server error. Please try again later.' });
//     }
// });

// // POST: Forgot Password
// router.post('/forgot-password', async (req, res) => {
//     const { email } = req.body;

//     if (!email) {
//         return res.status(400).json({ message: 'Email is required' });
//     }

//     try {
//         const user = await User.findOne({ email });
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         const resetToken = crypto.randomBytes(32).toString('hex');
//         const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

//         user.resetPasswordToken = hashedToken;
//         user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
//         await user.save();

//         const transporter = nodemailer.createTransport({
//             service: 'gmail',
//             auth: {
//                 user: process.env.EMAIL_USERNAME,
//                 pass: process.env.EMAIL_PASSWORD,
//             },
//         });

//         const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
//         const mailOptions = {
//             to: user.email,
//             from: process.env.EMAIL_USERNAME,
//             subject: 'Password Reset Request',
//             text: `You requested a password reset. Click here: ${resetURL}`,
//         };

//         await transporter.sendMail(mailOptions);
//         return res.status(200).json({ message: 'Password reset email sent' });
//     } catch (error) {
//         console.error('Forgot password error:', error);
//         return res.status(500).json({ message: 'Server error. Please try again later.' });
//     }
// });

// // POST: Reset Password
// router.post('/reset-password/:token', async (req, res) => {
//     const { token } = req.params;
//     const { password } = req.body;

//     if (!password) {
//         return res.status(400).json({ message: 'Password is required' });
//     }

//     try {
//         const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
//         const user = await User.findOne({
//             resetPasswordToken: hashedToken,
//             resetPasswordExpires: { $gt: Date.now() },
//         });

//         if (!user) {
//             return res.status(400).json({ message: 'Invalid or expired token' });
//         }

//         user.password = await bcrypt.hash(password, 10);
//         user.resetPasswordToken = undefined;
//         user.resetPasswordExpires = undefined;
//         await user.save();

//         return res.status(200).json({ message: 'Password reset successful' });
//     } catch (error) {
//         console.error('Reset password error:', error);
//         return res.status(500).json({ message: 'Server error. Please try again later.' });
//     }
// });

// // GET: Authenticated User (Profile) 
// router.use(cookieParser());
// router.get('/me/:id', checkForAuthenticationHeader(), async (req, res) => {
//     let userId = req.params.id;
  
//     if (userId === "me") {
//       userId = req.user.userId; // Use the userId from the token
//     }
  
//     try {
//       const user = await User.findById(userId).select('-password');
//       if (!user) {
//         return res.status(404).json({ message: 'User not found' });
//       }
//       res.json(user);
//     } catch (error) {
//       res.status(500).json({ message: 'Error fetching user' });
//     }
//   });
//  // POST: Update personal details after signup
// router.post('/update-details/:userId', async (req, res) => {
//     const { name, profilePicture, bio, jobTitle, company } = req.body;
//     const { userId } = req.params;
  
//     if (!name || !profilePicture || !bio || !jobTitle || !company) {
//       return res.status(400).json({ message: 'All personal details are required' });
//     }
  
//     try {
//       // Find user by ID and update their personal details
//       const user = await User.findByIdAndUpdate(userId, {
//         name,
//         profilePicture,
//         bio,
//         jobTitle,
//         company,
//       }, { new: true });
  
//       if (!user) {
//         return res.status(404).json({ message: 'User not found' });
//       }
  
//       return res.status(200).json({ message: 'Personal details updated successfully', user });
//     } catch (error) {
//       console.error('Update details error:', error);
//       return res.status(500).json({ message: 'Server error. Please try again later.' });
//     }
//   });
//   // Get user by ID
// router.get('/:userId', async (req, res) => {
//   try {
//     const user = await User.findById(req.params.userId)
//       .select('username profilePicture bio connections isOnline lastSeen');
    
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }
    
//     res.json(user);
//   } catch (err) {
//     console.error('Error fetching user:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// // Get user connections
// router.get('/connections/:userId', async (req, res) => {
//   try {
//     const user = await User.findById(req.params.userId)
//       .populate('connections', 'username profilePicture isOnline lastSeen');
    
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }
    
//     res.json(user.connections);
//   } catch (err) {
//     console.error('Error fetching connections:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// // Get suggested connections
// router.get('/suggested/:userId', async (req, res) => {
//   try {
//     const user = await User.findById(req.params.userId);
    
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }
    
//     // Get users who are not already connected
//     const suggestedUsers = await User.find({
//       _id: { $nin: [...user.connections, user._id] },
//       $or: [
//         { 'profile.industry': user.profile?.industry },
//         { 'profile.skills': { $in: user.profile?.skills || [] } }
//       ]
//     })
//     .select('username profilePicture bio')
//     .limit(10);
    
//     res.json(suggestedUsers);
//   } catch (err) {
//     console.error('Error fetching suggested connections:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// // Add connection
// router.patch('/add-connection/:userId', async (req, res) => {
//   try {
//     const { connectionId } = req.body;
    
//     await User.findByIdAndUpdate(req.params.userId, {
//       $addToSet: { connections: connectionId }
//     });
    
//     res.json({ success: true });
//   } catch (err) {
//     console.error('Error adding connection:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// // Remove connection
// router.patch('/remove-connection/:userId', async (req, res) => {
//   try {
//     const { connectionId } = req.body;
    
//     await User.findByIdAndUpdate(req.params.userId, {
//       $pull: { connections: connectionId }
//     });
    
//     res.json({ success: true });
//   } catch (err) {
//     console.error('Error removing connection:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// // Update online status
// router.patch('/update-status/:userId', async (req, res) => {
//   try {
//     const { isOnline } = req.body;
    
//     const update = { isOnline };
//     if (!isOnline) {
//       update.lastSeen = new Date();
//     }
    
//     await User.findByIdAndUpdate(req.params.userId, update);
    
//     res.json({ success: true });
//   } catch (err) {
//     console.error('Error updating status:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// });
// module.exports = router;
const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../model/usermodel');
const { checkForAuthenticationCookie } = require('../middleware/middleware');
const { uploadProfilePic } = require('../cloudinary');
require('dotenv').config();
const router = Router();

// Import the corrected authentication middleware
const checkForAuthenticationHeader = require('../middleware/Authentication');

// Initialize Passport
router.use(passport.initialize());

// Passport Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.SERVER_URL}/user/google/callback`
}, async (accessToken, refreshToken, profile, done) => {
    try {
        console.log('Google Profile:', profile);
        
        // Find or create user
        let user = await User.findOne({ 
            $or: [
                { email: profile.emails[0].value },
                { googleId: profile.id }
            ] 
        });

        if (user) {
            // Update Google ID if not present
            if (!user.googleId) {
                user.googleId = profile.id;
                await user.save();
            }
            return done(null, user);
        }

        // Create new user
        user = await User.create({
            googleId: profile.id,
            username: profile.emails[0].value.split('@')[0] + '_' + profile.id.substring(0, 4),
            email: profile.emails[0].value,
            name: profile.displayName,
            profilePicture: profile.photos[0].value,
            isVerified: true,
            authMethod: 'google'
        });

        return done(null, user);
    } catch (error) {
        console.error('Google OAuth error:', error);
        return done(error, null);
    }
}));

// Serialize user
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// Utility function to set cookies
const setCookie = (res, token) => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    const cookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 7 * 24 * 3600 * 1000, // 7 days
        path: '/',
    };
    res.cookie('auth_token', token, cookieOptions);
};

// Generate JWT Token
const generateToken = (user) => {
    return jwt.sign({ 
        userId: user._id,
        email: user.email,
        username: user.username
    }, process.env.JWT_SECRET_KEY, { expiresIn: '7d' });
};

// Google OAuth Routes
router.get('/google',
    passport.authenticate('google', { 
        scope: ['profile', 'email'],
        session: false 
    })
);

router.get('/google/callback',
    passport.authenticate('google', { 
        failureRedirect: `${process.env.CLIENT_URL}/login?error=auth_failed`,
        session: false 
    }),
    async (req, res) => {
        try {
            console.log('Google authentication successful, user:', req.user);
            
            // Update user's online status
            await User.findByIdAndUpdate(req.user._id, {
                isOnline: true,
                lastSeen: new Date()
            });

            const token = generateToken(req.user);
            setCookie(res, token);
            
            const userData = {
                id: req.user._id,
                username: req.user.username,
                email: req.user.email,
                name: req.user.name,
                profilePicture: req.user.profilePicture,
                isVerified: req.user.isVerified,
                profileCompleted: req.user.profileCompleted
            };

            const clientURL = process.env.CLIENT_URL;
            const userDataString = encodeURIComponent(JSON.stringify(userData));

            // Determine where to redirect based on profile completion
            let redirectUrl;
            
            // Check if this is a new Google user (profile not completed)
            const isNewUser = !req.user.profileCompleted || 
                            !req.user.name || 
                            !req.user.jobTitle || 
                            !req.user.company;
                
            if (isNewUser) {
                redirectUrl = `${clientURL}/personal-details/${req.user._id}?token=${token}&user=${userDataString}&auth=success&newUser=true`;
            } else {
                redirectUrl = `${clientURL}/feed?token=${token}&user=${userDataString}&auth=success`;
            }
            
            console.log(`Redirecting to: ${redirectUrl}`);
            res.redirect(redirectUrl);
            
        } catch (error) {
            console.error('Google callback error:', error);
            const clientURL = process.env.CLIENT_URL;
            res.redirect(`${clientURL}/login?error=auth_failed&message=${encodeURIComponent(error.message)}`);
        }
    }
);

// POST: Signin (Login) - Support both email and username login
router.post('/signin', [
    body('email').notEmpty().withMessage('Email or username is required'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    
    try {
        const user = await User.findOne({ 
            $or: [{ email }, { username: email }] 
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid email/username or password' });
        }

        // Check if user signed up with Google
        if (user.authMethod === 'google') {
            return res.status(401).json({ 
                message: 'This account uses Google authentication. Please sign in with Google.' 
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email/username or password' });
        }

        // Update online status
        user.isOnline = true;
        user.lastSeen = new Date();
        await user.save();

        const token = generateToken(user);
        setCookie(res, token);
        
        // Return user data
        const userResponse = {
            id: user._id,
            username: user.username,
            email: user.email,
            name: user.name,
            profilePicture: user.profilePicture,
            isVerified: user.isVerified,
            profileCompleted: user.profileCompleted
        };
        
        return res.json({ 
            message: 'Signin successful', 
            user: userResponse, 
            token 
        });  
    } catch (error) {
        console.error('Signin error:', error);
        return res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});

// GET: Signout (Logout)
router.get('/signout', checkForAuthenticationHeader, async (req, res) => {
    try {
        // Update user's online status
        await User.findByIdAndUpdate(req.user.userId, {
            isOnline: false,
            lastSeen: new Date()
        });
        
        res.clearCookie('auth_token').json({ message: 'Signout successful' });
    } catch (error) {
        console.error('Signout error:', error);
        res.clearCookie('auth_token').json({ message: 'Signout successful' });
    }
});

// GET: All users
router.get('/', async (req, res) => {
    try {
        const users = await User.find().select('-password -resetPasswordToken -resetPasswordExpires');
        res.json(users);
    } catch (error) { 
        res.status(500).json({ error: 'Failed to fetch users', details: error.message });
    }
});

// GET: User by ID
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password -resetPasswordToken -resetPasswordExpires -googleId');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        if (error instanceof mongoose.Error.CastError) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }
        res.status(500).json({ error: 'Failed to fetch user', details: error.message });
    }
});

// POST: Signup (Register)
router.post('/signup', [
    body('username')
        .isLength({ min: 3 }).withMessage('Username must be at least 3 characters')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
    body('email').isEmail().withMessage('Invalid email format'),
    body('password')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
        .matches(/\d/).withMessage('Password must contain at least one number')
        .matches(/[^A-Za-z\d]/).withMessage('Password must contain at least one special character'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    try {
        // Check if user exists with email or username
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }]
        });
        
        if (existingUser) {
            return res.status(400).json({ 
                message: existingUser.email === email ? 
                    'User already exists with this email' : 
                    'Username already taken'
            });
        }

        const user = await User.create({
            username,
            email,
            password,
            authMethod: 'email'
        });

        const token = generateToken(user);
        setCookie(res, token);

        // Return user data without sensitive information
        const userResponse = {
            id: user._id,
            username: user.username,
            email: user.email,
            name: user.name,
            profilePicture: user.profilePicture,
            isVerified: user.isVerified,
            profileCompleted: user.profileCompleted
        };

        return res.status(201).json({
            message: 'User created successfully',
            user: userResponse,
            token
        });
    } catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});

// POST: Upload profile picture
router.post('/upload-profile-pic/:userId', checkForAuthenticationHeader, uploadProfilePic.single('profilePicture'), async (req, res) => {
    try {
        const { userId } = req.params;

        // Check if user is authorized to update this profile
        if (req.user.userId !== userId) {
            return res.status(403).json({ message: 'Unauthorized to update this profile' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Profile picture file is required' });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { profilePicture: req.file.path },
            { new: true }
        ).select('-password -resetPasswordToken -resetPasswordExpires -googleId');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'Profile picture uploaded successfully',
            profilePicture: user.profilePicture,
            user
        });
    } catch (error) {
        console.error('Profile picture upload error:', error);
        res.status(500).json({ message: 'Error uploading profile picture' });
    }
});

// POST: Update personal details
router.post('/update-details/:userId', checkForAuthenticationHeader, [
    body('name').notEmpty().withMessage('Name is required'),
    body('bio').notEmpty().withMessage('Bio is required'),
    body('jobTitle').notEmpty().withMessage('Job title is required'),
    body('company').notEmpty().withMessage('Company is required'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, bio, jobTitle, company, profilePicture, industry, skills, location, website } = req.body;
    const { userId } = req.params;

    // Check if user is authorized to update this profile
    if (req.user.userId !== userId) {
        return res.status(403).json({ message: 'Unauthorized to update this profile' });
    }

    try {
        const updateData = {
            name,
            bio,
            jobTitle,
            company,
            profileCompleted: true,
            industry,
            skills: Array.isArray(skills) ? skills : skills?.split(',').map(skill => skill.trim()).filter(skill => skill) || [],
            location,
            website
        };

        if (profilePicture) {
            updateData.profilePicture = profilePicture;
        }

        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password -resetPasswordToken -resetPasswordExpires -googleId');

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
router.post('/forgot-password', [
    body('email').isEmail().withMessage('Please provide a valid email')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            // Don't reveal whether email exists or not for security
            return res.status(200).json({ 
                message: 'If an account with that email exists, a password reset link has been sent.' 
            });
        }

        // Check if user can reset password (Google users without password cannot)
        if (user.authMethod === 'google') {
            return res.status(400).json({ 
                message: 'This account uses Google authentication and does not have a password set.' 
            });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        // Configure email transporter
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
            subject: 'Password Reset Request - Linkipax',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Password Reset Request</h2>
                    <p>You requested a password reset for your account. Click the button below to reset your password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetURL}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
                    </div>
                    <p>This link will expire in 1 hour.</p>
                    <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply to this email.</p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        return res.status(200).json({ 
            message: 'If an account with that email exists, a password reset link has been sent.' 
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        return res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});

// POST: Reset Password
router.post('/reset-password/:token', [
    body('password')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
        .matches(/\d/).withMessage('Password must contain at least one number')
        .matches(/[^A-Za-z\d]/).withMessage('Password must contain at least one special character'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { token } = req.params;
    const { password } = req.body;

    try {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Update password
        user.password = password;
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
router.get('/me/:id', checkForAuthenticationHeader, async (req, res) => {
    let userId = req.params.id;

    if (userId === "me") {
        userId = req.user.userId;
    }

    try {
        const user = await User.findById(userId)
            .select('-password -resetPasswordToken -resetPasswordExpires -googleId');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        if (error instanceof mongoose.Error.CastError) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        res.status(500).json({ message: 'Error fetching user' });
    }
});

// Get user connections
router.get('/connections/:userId', checkForAuthenticationHeader, async (req, res) => {
    try {
        const { userId } = req.params;

        // Check if user is authorized
        if (req.user.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const user = await User.findById(userId)
            .populate('connections', 'username name profilePicture isOnline lastSeen jobTitle company')
            .select('connections');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user.connections);
    } catch (err) {
        console.error('Error fetching connections:', err);
        if (err instanceof mongoose.Error.CastError) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

// Get suggested connections
router.get('/suggested/:userId', checkForAuthenticationHeader, async (req, res) => {
    try {
        const { userId } = req.params;

        // Check if user is authorized
        if (req.user.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get users who are not already connected or blocked
        const suggestedUsers = await User.find({
            _id: { 
                $nin: [
                    ...user.connections, 
                    ...(user.blockedUsers || []), 
                    user._id
                ] 
            }
        })
        .select('username name profilePicture bio jobTitle company industry skills isOnline')
        .limit(10);

        res.json(suggestedUsers);
    } catch (err) {
        console.error('Error fetching suggested connections:', err);
        if (err instanceof mongoose.Error.CastError) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

// Add connection
router.patch('/add-connection/:userId', checkForAuthenticationHeader, async (req, res) => {
    try {
        const { connectionId } = req.body;
        const { userId } = req.params;

        // Check if user is authorized
        if (req.user.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        if (!connectionId) {
            return res.status(400).json({ error: 'Connection ID is required' });
        }

        // Add to both users' connections
        await User.findByIdAndUpdate(userId, {
            $addToSet: { connections: connectionId }
        });

        await User.findByIdAndUpdate(connectionId, {
            $addToSet: { connections: userId }
        });

        res.json({ success: true, message: 'Connection added successfully' });
    } catch (err) {
        console.error('Error adding connection:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Remove connection
router.patch('/remove-connection/:userId', checkForAuthenticationHeader, async (req, res) => {
    try {
        const { connectionId } = req.body;
        const { userId } = req.params;

        // Check if user is authorized
        if (req.user.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        if (!connectionId) {
            return res.status(400).json({ error: 'Connection ID is required' });
        }

        // Remove from both users' connections
        await User.findByIdAndUpdate(userId, {
            $pull: { connections: connectionId }
        });

        await User.findByIdAndUpdate(connectionId, {
            $pull: { connections: userId }
        });

        res.json({ success: true, message: 'Connection removed successfully' });
    } catch (err) {
        console.error('Error removing connection:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update online status
router.patch('/update-status/:userId', checkForAuthenticationHeader, async (req, res) => {
    try {
        const { isOnline } = req.body;
        const { userId } = req.params;

        // Check if user is authorized
        if (req.user.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const update = { isOnline };
        if (!isOnline) {
            update.lastSeen = new Date();
        }

        await User.findByIdAndUpdate(userId, update);

        res.json({ success: true, message: 'Status updated successfully' });
    } catch (err) {
        console.error('Error updating status:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;