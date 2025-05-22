const Education = require("../model/educationModel");
const colleges = require("../data/colleges.json");
const skills = require("../data/skills.json");
const cloudinary = require("cloudinary").v2;
const fs = require('fs');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);
require('dotenv').config();

// Configure Cloudinary with backend environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Helper function to sanitize filename
const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 100);
};

// Search Colleges
const searchColleges = async (req, res) => {
  const { query } = req.query;

  try {
    if (!query || query.length < 3) {
      return res.status(200).json([]);
    }

    const searchTerm = query.toLowerCase();
    const results = colleges
      .filter(college => {
        const collegeName = college.college ? college.college.toLowerCase() : '';
        const universityName = college.university ? college.university.toLowerCase() : '';
        return (
          collegeName.includes(searchTerm) ||
          universityName.includes(searchTerm) ||
          `${collegeName} (${universityName})`.includes(searchTerm)
        );
      })
      .slice(0, 5);

    res.status(200).json(results);
  } catch (error) {
    console.error("Error searching colleges:", error);
    res.status(500).json({ message: "Error searching colleges", error });
  }
};

// Search Skills
const searchSkills = async (req, res) => {
  const { query } = req.query;

  try {
    if (!query || query.length < 2) {
      return res.status(200).json([]);
    }

    const searchTerm = query.toLowerCase();
    const results = skills
      .filter(skill => skill.toLowerCase().includes(searchTerm))
      .slice(0, 5);

    res.status(200).json(results);
  } catch (error) {
    console.error("Error searching skills:", error);
    res.status(500).json({ message: "Error searching skills", error });
  }
};

// Upload Logo to Cloudinary
const uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'education_logos',
      upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
      public_id: `logo_${Date.now()}_${sanitizeFilename(req.file.originalname)}`,
      overwrite: false,
      resource_type: 'auto',
      transformation: [
        { width: 200, height: 200, crop: 'limit', quality: 'auto' }
      ]
    });

    // Delete the temporary file
    await unlinkAsync(req.file.path);

    res.status(200).json({
      url: result.secure_url,
      public_id: result.public_id,
      message: "Logo uploaded successfully"
    });
  } catch (error) {
    console.error("Error uploading logo:", error);

    if (req.file) {
      await unlinkAsync(req.file.path).catch(unlinkError => {
        console.error("Error deleting temporary file:", unlinkError);
      });
    }

    res.status(500).json({ message: "Error uploading logo", error });
  }
};

// Add Education
const addEducation = async (req, res) => {
  const { userId } = req.params;
  const { collegeName, degree, fieldOfStudy, startDate, endDate, gpa, description, skills, logo } = req.body;

  try {
    if (!collegeName || !degree || !startDate) {
      return res.status(400).json({
        message: "College name, degree, and start date are required"
      });
    }

    const newEducation = new Education({
      userId,
      collegeName,
      degree,
      fieldOfStudy,
      startDate,
      endDate,
      gpa,
      description,
      skills: skills || [],
      logo: logo || null
    });

    const savedEducation = await newEducation.save();
    res.status(201).json(savedEducation);
  } catch (error) {
    console.error("Error adding education:", error);

    if (req.body.logo && req.body.logo.public_id) {
      await cloudinary.uploader.destroy(req.body.logo.public_id)
        .catch(deleteError => {
          console.error("Error deleting orphaned logo:", deleteError);
        });
    }

    res.status(500).json({ message: "Error adding education", error });
  }
};

// Get Education
const getEducation = async (req, res) => {
  const { userId } = req.params;

  try {
    const education = await Education.find({ userId }).sort({ startDate: -1 });
    res.status(200).json(education);
  } catch (error) {
    console.error("Error fetching education:", error);
    res.status(500).json({ message: "Error fetching education", error });
  }
};

// Update Education
const updateEducation = async (req, res) => {
  const { id } = req.params;
  const { collegeName, degree, fieldOfStudy, startDate, endDate, gpa, description, skills, logo } = req.body;

  try {
    if (!collegeName || !degree || !startDate) {
      return res.status(400).json({
        message: "College name, degree, and start date are required"
      });
    }

    // Get the existing education record to check for logo changes
    const existingEducation = await Education.findById(id);
    if (!existingEducation) {
      return res.status(404).json({ message: "Education record not found" });
    }

    // If logo was changed and there was a previous logo, delete the old one from Cloudinary
    if (logo && existingEducation.logo && existingEducation.logo.public_id !== logo.public_id) {
      await cloudinary.uploader.destroy(existingEducation.logo.public_id)
        .catch(deleteError => {
          console.error("Error deleting old logo:", deleteError);
        });
    }

    const updatedEducation = await Education.findByIdAndUpdate(
      id,
      {
        collegeName,
        degree,
        fieldOfStudy,
        startDate,
        endDate,
        gpa,
        description,
        skills: skills || [],
        logo: logo || null
      },
      { new: true, runValidators: true }
    );

    if (!updatedEducation) {
      return res.status(404).json({ message: "Education record not found" });
    }

    res.status(200).json(updatedEducation);
  } catch (error) {
    console.error("Error updating education:", error);
    res.status(500).json({ message: "Error updating education", error });
  }
};

// Delete Education
const deleteEducation = async (req, res) => {
  const { id } = req.params;

  try {
    // Get the education record to delete its logo from Cloudinary
    const educationToDelete = await Education.findById(id);
    if (!educationToDelete) {
      return res.status(404).json({ message: "Education record not found" });
    }

    // Delete the logo from Cloudinary if it exists
    if (educationToDelete.logo && educationToDelete.logo.public_id) {
      await cloudinary.uploader.destroy(educationToDelete.logo.public_id)
        .catch(deleteError => {
          console.error("Error deleting logo:", deleteError);
        });
    }

    // Delete the education record
    const deletedEducation = await Education.findByIdAndDelete(id);
    if (!deletedEducation) {
      return res.status(404).json({ message: "Education record not found" });
    }

    res.status(200).json({ 
      message: "Education record deleted successfully",
      deletedEducation
    });
  } catch (error) {
    console.error("Error deleting education:", error);
    res.status(500).json({ message: "Error deleting education", error });
  }
};

module.exports = {
  addEducation,
  getEducation,
  updateEducation,
  deleteEducation,
  searchColleges,
  searchSkills,
  uploadLogo
};