const Hackathon = require('../model/Hackathonmodel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getAllHackathons = catchAsync(async (req, res) => {
    const features = new APIFeatures(Hackathon.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    
    const hackathons = await features.query;
  
    res.status(200).json({
      status: 'success',
      results: hackathons.length,
      data: {
        hackathons
      }
    });
  });
  
  exports.getHackathon = catchAsync(async (req, res) => {
    const hackathon = await Hackathon.findById(req.params.id);
  
    if (!hackathon) {
      return res.status(404).json({
        status: 'fail',
        message: 'No hackathon found with that ID'
      });
    }
  
    res.status(200).json({
      status: 'success',
      data: {
        hackathon
      }
    });
  });
  
  exports.createHackathon = catchAsync(async (req, res) => {
    const hackathon = await Hackathon.create(req.body);
  
    res.status(201).json({
      status: 'success',
      data: {
        hackathon
      }
    });
  });
  
  exports.updateHackathon = catchAsync(async (req, res) => {
    const hackathon = await Hackathon.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
  
    if (!hackathon) {
      return res.status(404).json({
        status: 'fail',
        message: 'No hackathon found with that ID'
      });
    }
  
    res.status(200).json({
      status: 'success',
      data: {
        hackathon
      }
    });
  });
  
  exports.deleteHackathon = catchAsync(async (req, res) => {
    const hackathon = await Hackathon.findByIdAndDelete(req.params.id);
  
    if (!hackathon) {
      return res.status(404).json({
        status: 'fail',
        message: 'No hackathon found with that ID'
      });
    }
  
    res.status(204).json({
      status: 'success',
      data: null
    });
  });
  
  exports.registerForHackathon = catchAsync(async (req, res) => {
    const hackathon = await Hackathon.findById(req.params.id);
  
    if (!hackathon) {
      return res.status(404).json({
        status: 'fail',
        message: 'No hackathon found with that ID'
      });
    }
  
    // Simplified registration without user auth
    hackathon.participants.push({
      name: req.body.name || 'Anonymous',
      email: req.body.email || null,
      status: 'registered'
    });
  
    await hackathon.save();
  
    res.status(200).json({
      status: 'success',
      data: {
        hackathon
      }
    });
  });
  
  exports.getUpcomingHackathons = catchAsync(async (req, res) => {
    const hackathons = await Hackathon.find({ 
      status: 'published',
      startDate: { $gt: new Date() }
    }).sort({ startDate: 1 });
  
    res.status(200).json({
      status: 'success',
      results: hackathons.length,
      data: {
        hackathons
      }
    });
  });
  
  exports.getHackathonsByOrganizer = catchAsync(async (req, res) => {
    const hackathons = await Hackathon.find({ organizer: req.params.organizerId });
  
    res.status(200).json({
      status: 'success',
      results: hackathons.length,
      data: {
        hackathons
      }
    });
  });