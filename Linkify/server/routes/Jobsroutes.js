const { Router } = require('express');
const User = require('../model/Jobsmodel'); 
const mongoose = require('mongoose');
const router = Router();
router.post('/JobsPost', async (req, res) => { 
    const { title, description, company, location, salary, experience, skills, email, phone, website, jobType } = req.body;

    const user = new User({
      Title: title,
      Description: description,
      Company: company,
      Location: location,
      Salary: salary,
      Experience: experience,
      Skills: skills,
      Email: email,
      Phone: phone,
      Website: website,
      Type: jobType
    });

    try {
      await user.save();
      res.status(201).json({ message: 'Job posted successfully' });
    } catch (error) {
      console.error('Error posting job:', error);
      res.status(500).json({ message: 'Server error. Please try again later.' });
    }
})

router.get('/getPost', async (req, res) => {
  try {
    const jobs = await User.find();
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});
router.get('/getPost/:id', async (req, res) => {
  try {
    const job = await User.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});
module.exports = router;