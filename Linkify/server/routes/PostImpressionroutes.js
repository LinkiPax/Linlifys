const express = require('express');
const mongoose = require('mongoose');
const PostImpression = require('../model/PostImpression');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Rate limiting configuration
const analyticsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: 'Too many analytics requests, please try again later'
});

const impressionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 500, // 500 requests per hour per IP
  message: 'Too many impression requests from this IP, please try again later'
});

// Middleware to validate ObjectId
const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.postId)) {
    return res.status(400).json({ message: 'Invalid post ID format' });
  }
  next();
};

const userAgentParser = require('user-agent-parser'); // or use 'express-useragent'

router.post('/impressions', impressionLimiter, async (req, res) => {
  try {
    // Extract and sanitize input
    const {
      postId,
      userId,
      sessionId,
      interactionType = 'view',
      duration = 0,
      deviceType = 'other',
      referrer = 'direct',
      screenResolution,
      campaignId,
      utmSource,
      utmMedium,
      utmCampaign,
      isOrganic = true
    } = req.body;

    if (!postId || !userId) {
      return res.status(400).json({ message: 'postId and userId are required' });
    }

    // Parse user agent
    const userAgent = req.headers['user-agent'] || '';
    const parsedUA = userAgentParser(userAgent); // or req.useragent if using express-useragent
    
    // Normalize OS and browser names
    const os = normalizeOS(parsedUA.os || 'unknown');
    const browser = normalizeBrowser(parsedUA.browser || 'unknown');

    const impressionData = {
      postId,
      userId,
      sessionId,
      interactionType,
      duration,
      deviceType,
      referrer,
      os,
      browser,
      ipAddress: req.ip,
      userAgent, // Store raw user agent for reference
      screenResolution: screenResolution || getScreenResolution(req),
      isOrganic
    };

    // Add optional marketing fields
    if (campaignId) impressionData.campaignId = campaignId;
    if (utmSource) impressionData.utmSource = utmSource;
    if (utmMedium) impressionData.utmMedium = utmMedium;
    if (utmCampaign) impressionData.utmCampaign = utmCampaign;

    const impression = await PostImpression.create(impressionData);
    
    res.status(201).json({
      success: true,
      data: impression,
      message: 'Impression recorded successfully'
    });
  } catch (error) {
    console.error('Error recording impression:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to record impression',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Helper functions to normalize values
function normalizeOS(os) {
  const osMap = {
    'Windows': 'windows',
    'Win32': 'windows',
    'Mac OS': 'macos',
    'Linux': 'linux',
    'Android': 'android',
    'iOS': 'ios'
  };
  return osMap[os] || 'other';
}

function normalizeBrowser(browser) {
  const browserMap = {
    'Chrome': 'chrome',
    'Firefox': 'firefox',
    'Safari': 'safari',
    'Edge': 'edge',
    'IE': 'ie',
    'Opera': 'opera'
  };
  return browserMap[browser] || 'other';
}

function getScreenResolution(req) {
  // If available from client-side
  return req.body.screenResolution || 
         (req.headers['x-screen-resolution'] ? req.headers['x-screen-resolution'].split('x').join('x') : null);
}

// Comprehensive analytics endpoint with all options
router.get('/analytics/posts/:postId', validateObjectId, analyticsLimiter, async (req, res) => {
  try {
    const { postId } = req.params;
    const { 
      timeRange = '7d',
      groupBy = 'day',
      include = 'all' 
    } = req.query;

    // Parse include parameter to determine what data to fetch
    const includeDemographics = include === 'all' || include.includes('demographics');
    const includeGeo = include === 'all' || include.includes('geo');
    const includeDuration = include === 'all' || include.includes('duration');
    const includeInteractions = include === 'all' || include.includes('interactions');

    const options = {
      timeRange,
      groupBy,
      includeDemographics,
      includeGeo,
      includeDuration,
      includeInteractions
    };

    const analytics = await PostImpression.getPostAnalytics(postId, options);
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching post analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
});

// Time series data endpoint with flexible grouping
router.get('/analytics/posts/:postId/time-series', validateObjectId, analyticsLimiter, async (req, res) => {
  try {
    const { postId } = req.params;
    const { 
      timeRange = '7d',
      groupBy = 'day',
      metric = 'impressions' // can be impressions, engagements, uniqueUsers
    } = req.query;

    const dateFilter = PostImpression.getDateFilter(timeRange);
    const dateFormat = PostImpression.getDateFormat(groupBy);

    const pipeline = [
      { $match: { 
        postId: new mongoose.Types.ObjectId(postId),
        timestamp: { $gte: dateFilter }
      }},
      { $group: {
        _id: { $dateToString: { format: dateFormat, date: '$timestamp' } },
        impressions: { $sum: 1 },
        engagements: { $sum: '$engagementScore' },
        uniqueUsers: { $addToSet: '$userId' }
      }},
      { $project: {
        date: '$_id',
        impressions: 1,
        engagements: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        _id: 0
      }},
      { $sort: { date: 1 } }
    ];

    const data = await PostImpression.aggregate(pipeline);
    
    // Select the requested metric
    const responseData = data.map(item => ({
      date: item.date,
      value: item[metric]
    }));

    res.json({
      success: true,
      data: responseData,
      metric
    });
  } catch (error) {
    console.error('Error fetching time series data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch time series data',
      error: error.message
    });
  }
});

// Demographic analytics endpoint
router.get('/analytics/posts/:postId/demographics', validateObjectId, analyticsLimiter, async (req, res) => {
  try {
    const { postId } = req.params;
    const { timeRange = '7d' } = req.query;
    const dateFilter = PostImpression.getDateFilter(timeRange);

    const [devices, referrers, os, browsers] = await Promise.all([
      PostImpression.aggregate([
        { $match: { 
          postId: new mongoose.Types.ObjectId(postId),
          timestamp: { $gte: dateFilter }
        }},
        { $group: { 
          _id: '$deviceType', 
          count: { $sum: 1 },
          avgEngagement: { $avg: '$engagementScore' }
        }}
      ]),
      PostImpression.aggregate([
        { $match: { 
          postId: new mongoose.Types.ObjectId(postId),
          timestamp: { $gte: dateFilter }
        }},
        { $group: { 
          _id: '$referrer', 
          count: { $sum: 1 }
        }}
      ]),
      PostImpression.aggregate([
        { $match: { 
          postId: new mongoose.Types.ObjectId(postId),
          timestamp: { $gte: dateFilter }
        }},
        { $group: { 
          _id: '$os', 
          count: { $sum: 1 }
        }}
      ]),
      PostImpression.aggregate([
        { $match: { 
          postId: new mongoose.Types.ObjectId(postId),
          timestamp: { $gte: dateFilter }
        }},
        { $group: { 
          _id: '$browser', 
          count: { $sum: 1 }
        }}
      ])
    ]);

    res.json({
      success: true,
      data: {
        devices,
        referrers,
        os,
        browsers
      }
    });
  } catch (error) {
    console.error('Error fetching demographic data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch demographic data',
      error: error.message
    });
  }
});

// Geographic analytics endpoint
router.get('/analytics/posts/:postId/geography', validateObjectId, analyticsLimiter, async (req, res) => {
  try {
    const { postId } = req.params;
    const { timeRange = '7d', limit = 10 } = req.query;
    const dateFilter = PostImpression.getDateFilter(timeRange);

    const [countries, cities] = await Promise.all([
      PostImpression.aggregate([
        { $match: { 
          postId: new mongoose.Types.ObjectId(postId),
          timestamp: { $gte: dateFilter },
          country: { $exists: true }
        }},
        { $group: { 
          _id: '$country', 
          count: { $sum: 1 },
          avgEngagement: { $avg: '$engagementScore' }
        }},
        { $sort: { count: -1 } },
        { $limit: parseInt(limit) }
      ]),
      PostImpression.aggregate([
        { $match: { 
          postId: new mongoose.Types.ObjectId(postId),
          timestamp: { $gte: dateFilter },
          city: { $exists: true }
        }},
        { $group: { 
          _id: { country: '$country', city: '$city' }, 
          count: { $sum: 1 }
        }},
        { $sort: { count: -1 } },
        { $limit: parseInt(limit) }
      ])
    ]);

    res.json({
      success: true,
      data: {
        countries,
        cities: cities.map(c => ({
          country: c._id.country,
          city: c._id.city,
          count: c.count
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching geographic data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch geographic data',
      error: error.message
    });
  }
});

// Top posts analytics
router.get('/analytics/posts/top', analyticsLimiter, async (req, res) => {
  try {
    const { 
      timeRange = '7d',
      limit = 10,
      sortBy = 'engagements', // engagements, impressions, uniqueUsers, engagementRate
      userId = null 
    } = req.query;

    const dateFilter = PostImpression.getDateFilter(timeRange);
    const matchStage = { timestamp: { $gte: dateFilter } };
    
    if (userId) {
      matchStage.userId = new mongoose.Types.ObjectId(userId);
    }

    const pipeline = [
      { $match: matchStage },
      { $group: { 
        _id: '$postId',
        impressions: { $sum: 1 },
        engagements: { $sum: '$engagementScore' },
        uniqueUsers: { $addToSet: '$userId' },
        lastInteraction: { $max: '$timestamp' }
      }},
      { $project: {
        postId: '$_id',
        impressions: 1,
        engagements: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        engagementRate: {
          $cond: [
            { $eq: ['$impressions', 0] },
            0,
            { $multiply: [{ $divide: ['$engagements', '$impressions'] }, 100] }
          ]
        },
        lastInteraction: 1
      }},
      { $sort: { [sortBy]: -1 } },
      { $limit: parseInt(limit) }
    ];

    // Add post details lookup if not filtering by user
    if (!userId) {
      pipeline.push(
        { $lookup: {
          from: 'posts',
          localField: 'postId',
          foreignField: '_id',
          as: 'postDetails'
        }},
        { $unwind: '$postDetails' },
        { $project: {
          'postDetails.title': 1,
          'postDetails.author': 1,
          impressions: 1,
          engagements: 1,
          uniqueUsers: 1,
          engagementRate: 1,
          lastInteraction: 1
        }}
      );
    }

    const topPosts = await PostImpression.aggregate(pipeline);

    res.json({
      success: true,
      data: topPosts,
      sortBy,
      timeRange
    });
  } catch (error) {
    console.error('Error fetching top posts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top posts',
      error: error.message
    });
  }
});

// User engagement analytics
router.get('/analytics/users/:userId/engagement', analyticsLimiter, async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeRange = '7d' } = req.query;
    const dateFilter = PostImpression.getDateFilter(timeRange);

    const [engagementStats, topPosts, activityTrend] = await Promise.all([
      PostImpression.aggregate([
        { $match: { 
          userId: new mongoose.Types.ObjectId(userId),
          timestamp: { $gte: dateFilter }
        }},
        { $facet: {
          totalInteractions: [{ $count: 'count' }],
          interactionTypes: [
            { $group: { _id: '$interactionType', count: { $sum: 1 } } }
          ],
          avgEngagement: [
            { $group: { _id: null, avg: { $avg: '$engagementScore' } } }
          ]
        }}
      ]),
      PostImpression.aggregate([
        { $match: { 
          userId: new mongoose.Types.ObjectId(userId),
          timestamp: { $gte: dateFilter }
        }},
        { $group: { 
          _id: '$postId',
          engagements: { $sum: '$engagementScore' },
          lastInteraction: { $max: '$timestamp' }
        }},
        { $sort: { engagements: -1 } },
        { $limit: 5 },
        { $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: '_id',
          as: 'postDetails'
        }},
        { $unwind: '$postDetails' },
        { $project: {
          postId: '$_id',
          title: '$postDetails.title',
          engagements: 1,
          lastInteraction: 1
        }}
      ]),
      PostImpression.aggregate([
        { $match: { 
          userId: new mongoose.Types.ObjectId(userId),
          timestamp: { $gte: dateFilter }
        }},
        { $group: { 
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          count: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalInteractions: engagementStats[0].totalInteractions[0]?.count || 0,
          interactionTypes: engagementStats[0].interactionTypes,
          avgEngagement: engagementStats[0].avgEngagement[0]?.avg || 0
        },
        topPosts,
        activityTrend: activityTrend.map(item => ({
          date: item._id,
          count: item.count
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching user engagement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user engagement data',
      error: error.message
    });
  }
});

module.exports = router;