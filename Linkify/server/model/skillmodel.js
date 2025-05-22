const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true
  },
  skills: { 
    type: [String], 
    required: true,
    validate: {
      validator: function(skills) {
        return skills.length > 0;
      },
      message: 'At least one skill is required'
    }
  },
  skillLevels: {
    type: Object,
    default: {},
    validate: {
      validator: function(levels) {
        // Validate each level is between 1 and 5
        return Object.values(levels).every(level => 
          Number.isInteger(level) && level >= 1 && level <= 5
        );
      },
      message: 'Each skill level must be an integer between 1 and 5'
    }
  }
}, {
  timestamps: true
});

// Pre-save hook to normalize skills and ensure skillLevels has entries for all skills
skillSchema.pre('save', function(next) {
  // Normalize skills
  this.skills = [...new Set(this.skills.map(skill => skill.trim().toLowerCase()))];
  
  // Ensure all skills have a valid level (default to 1)
  const skillLevels = this.skillLevels || {};
  for (const skill of this.skills) {
    if (!(skill in skillLevels) || 
        !Number.isInteger(skillLevels[skill]) || 
        skillLevels[skill] < 1 || 
        skillLevels[skill] > 5) {
      skillLevels[skill] = 1;
    }
  }
  
  // Remove levels for skills that no longer exist
  for (const skill in skillLevels) {
    if (!this.skills.includes(skill)) {
      delete skillLevels[skill];
    }
  }
  
  this.skillLevels = skillLevels;
  next();
});

skillSchema.index({ userId: 1 });
skillSchema.index({ skills: 1 });

module.exports = mongoose.model('Skill', skillSchema);