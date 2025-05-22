const { connection } = require("mongoose");
const Experience = require("../model/experiencemodel");

// Get merged user data
const getMergedUserData = async (req, res) => {
  const { userId } = req.params;

  try {
    const userData = await User.findById(userId);
    const userDetailsData = await UserDetails.findOne({ userId });
    const experiences = await Experience.find({ userId });

    const mergedData = {
      userId: userData._id,
      name: userData.name,
      email: userData.email,
      bio: userDetailsData?.bio || "No bio available",
      connections: userData.connections,
      company: userDetailsData?.company || "No company specified",
      jobTitle: userDetailsData?.jobTitle || "No job title specified",
      profilePicture: userDetailsData?.profilePicture || "https://via.placeholder.com/150",
      backgroundImage: userDetailsData?.backgroundImage || "https://via.placeholder.com/1200x400",
      socialLinks: userDetailsData?.socialLinks || {},
      interests: userDetailsData?.interests || [],
      location: userDetailsData?.location || "No location specified",
      occupation: userDetailsData?.occupation || "No occupation specified",
      achievements: userDetailsData?.achievements || [],
      hobbies: userDetailsData?.hobbies || [],
      experiences: experiences || [],
    };

    res.status(200).json(mergedData);
  } catch (error) {
    console.error("Error fetching merged user data:", error);
    res.status(500).json({ message: "Error fetching user data", error });
  }
};

module.exports = { getMergedUserData };