const Experience = require("../model/experiencemodel");

// Add Experience
const addExperience = async (req, res) => {
  const { userId } = req.params;
  const { company, jobTitle, startDate, endDate, description } = req.body;

  try {
    const newExperience = new Experience({
      userId,
      company,
      jobTitle,
      startDate,
      endDate,
      description,
    });

    const savedExperience = await newExperience.save();
    res.status(201).json(savedExperience);
  } catch (error) {
    console.error("Error adding experience:", error);
    res.status(500).json({ message: "Error adding experience", error });
  }
};

// Get Experiences
const getExperiences = async (req, res) => {
  const { userId } = req.params;

  try {
    const experiences = await Experience.find({ userId });
    res.status(200).json(experiences);
  } catch (error) {
    console.error("Error fetching experiences:", error);
    res.status(500).json({ message: "Error fetching experiences", error });
  }
};

// Update Experience
const updateExperience = async (req, res) => {
  const { userId, experienceId } = req.params;
  const updatedExperience = req.body;

  try {
    const experience = await Experience.findOneAndUpdate(
      { _id: experienceId, userId },
      updatedExperience,
      { new: true }
    );

    if (!experience) {
      return res.status(404).json({ message: "Experience not found" });
    }

    res.status(200).json({ message: "Experience updated successfully", experience });
  } catch (error) {
    console.error("Error updating experience:", error);
    res.status(500).json({ message: "Error updating experience", error });
  }
};

// Delete Experience
const deleteExperience = async (req, res) => {
  const { userId, experienceId } = req.params;

  try {
    const experience = await Experience.findOneAndDelete({ _id: experienceId, userId });

    if (!experience) {
      return res.status(404).json({ message: "Experience not found" });
    }

    res.status(200).json({ message: "Experience deleted successfully" });
  } catch (error) {
    console.error("Error deleting experience:", error);
    res.status(500).json({ message: "Error deleting experience", error });
  }
};

module.exports = {
  addExperience,
  getExperiences,
  updateExperience,
  deleteExperience,
};
