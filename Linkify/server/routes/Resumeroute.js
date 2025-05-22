const express = require('express');
const multer = require('multer');
const path = require('path');
const { exec } = require('child_process');
const Resume = require('../model/resumemodel'); // Adjust the path as needed

const router = express.Router();

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/')); // Ensure this folder exists
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
}); 

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and Word documents are allowed.')); 
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});

// Resume upload and analysis route
router.post('/', upload.single('resume'), async (req, res) => {
  const { jobDescription, userId } = req.body;

  // Validate request data
  if (!jobDescription || !userId) {
    return res.status(400).json({ message: 'Job description and user ID are required.' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'Resume file is required.' });
  }

  const { filename, path: filePath } = req.file;

  try {
    // Execute Pthon script to analyze the resume
    exec(`python analyze_resume.py "${filePath}" "${jobDescription}"`, async (error, stdout, stderr) => {
      if (error) {
        console.error(`Execution error: ${error}`);
        return res.status(500).json({ message: 'Error analyzing resume', error });
      }

      if (stderr) {
        console.error(`stderr: ${stderr}`);
        return res.status(500).json({ message: 'Error analyzing resume', error: stderr });
      }
        console.log('stdout:', stdout);
        console.log('stderr:', stderr);
      try {
        // Parse the analysis result
        const analysisResult = JSON.parse(stdout);

        // Save the resume and analysis result in MongoDB
        const newResume = new Resume({
          userId,
          fileName: filename,
          filePath,
          jobDescription,
          analysisResult,
        });

        await newResume.save();

        res.status(200).json({
          message: 'Resume uploaded and analyzed successfully!',
          analysisResult,
        });
      } catch (parseError) {
        console.error('Error parsing analysis result:', parseError);
        res.status(500).json({ message: 'Error parsing analysis result', error: parseError.message });
      }
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ message: 'An unexpected error occurred', error: err.message });
  }
});

// Handle errors globally for file uploads
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    res.status(400).json({ message: `File upload error: ${err.message}` });
  } else if (err) {
    // Other errors
    res.status(500).json({ message: `Server error: ${err.message}` });
  } else {
    next();
  }
});

module.exports = router;
