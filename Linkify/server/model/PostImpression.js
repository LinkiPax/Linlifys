const mongoose = require('mongoose');
const { Types } = mongoose;
const { ObjectId } = Types;

const postImpressionSchema = new mongoose.Schema({
  postId: { type: ObjectId, ref: 'Post', required: true, index: true },
  userId: { type: ObjectId, ref: 'User', required: true, index: true },
  sessionId: { type: String, index: true },

  interactionType: {
    type: String,
    enum: ['view', 'like', 'share', 'comment', 'save', 'click', 'hover', 'scroll'],
    default: 'view'
  },
  duration: { type: Number, default: 0 },
  interactionCount: { type: Number, default: 1 },
  isOrganic: { type: Boolean, default: true },

  deviceType: {
    type: String,
    enum: ['mobile', 'desktop', 'tablet', 'other'],
    default: 'other'
  },
  os: {
    type: String,
    enum: ['ios', 'android', 'windows', 'macos', 'linux', 'other'],
    default: 'other'
  },
  browser: {
    type: String,
    enum: ['chrome', 'safari', 'firefox', 'edge', 'opera', 'other'],
    default: 'other'
  },
  screenResolution: {
    width: Number,
    height: Number
  },

  referrer: {
    type: String,
    enum: ['direct', 'search', 'social', 'email', 'internal', 'external', 'other'],
    default: 'direct'
  },
  referrerUrl: String,
  campaignId: String,
  utmSource: String,
  utmMedium: String,
  utmCampaign: String,

  ipAddress: String,
  country: String,
  region: String,
  city: String,

  timestamp: { type: Date, default: Date.now, index: true },
  lastInteractionAt: { type: Date }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

postImpressionSchema.index({ postId: 1, userId: 1 });
postImpressionSchema.index({ postId: 1, timestamp: 1 });
postImpressionSchema.index({ userId: 1, timestamp: 1 });
postImpressionSchema.index({ postId: 1, interactionType: 1 });
postImpressionSchema.index({ postId: 1, deviceType: 1 });
postImpressionSchema.index({ postId: 1, country: 1 });

postImpressionSchema.virtual('engagementScore').get(function () {
  const weights = {
    view: 1, hover: 2, scroll: 3,
    click: 5, like: 8, comment: 10,
    save: 12, share: 15
  };
  const base = weights[this.interactionType] || 1;
  const bonus = Math.min(Math.floor(this.duration / 1000), 10);
  return base + bonus;
});

// === Static Methods ===
postImpressionSchema.statics.getPostAnalytics = async function (postId, options = {}) {
  const { timeRange = '7d', groupBy = 'day', includeDemographics = false, includeGeo = false } = options;
  const dateFilter = this.getDateFilter(timeRange);
  const dateFormat = this.getDateFormat(groupBy);

  const matchStage = {
    postId: new ObjectId(postId),
    timestamp: { $gte: dateFilter }
  };

  const groupStage = {
    _id: { $dateToString: { format: dateFormat, date: '$timestamp' } },
    impressions: { $sum: 1 },
    engagements: { $sum: '$engagementScore' },
    uniqueUsers: { $addToSet: '$userId' },
    interactionsByType: { $push: { type: '$interactionType', count: 1 } }
  };

  const projectStage = {
    date: '$_id',
    impressions: 1,
    engagements: 1,
    uniqueUsers: { $size: '$uniqueUsers' },
    interactionsByType: 1,
    _id: 0
  };

  if (includeDemographics) {
    groupStage.devices = { $addToSet: '$deviceType' };
    groupStage.referrers = { $addToSet: '$referrer' };
    projectStage.deviceBreakdown = '$devices';
    projectStage.referrerBreakdown = '$referrers';
  }

  if (includeGeo) {
    groupStage.countries = { $addToSet: '$country' };
    projectStage.geoDistribution = '$countries';
  }

  const aggregationPipeline = [
    { $match: matchStage },
    { $group: groupStage },
    { $project: projectStage },
    { $sort: { date: 1 } }
  ];

  const [timeSeries, totalCounts, interactionBreakdown, deviceData, referrerData, geoData] = await Promise.all([
    this.aggregate(aggregationPipeline),
    this.getTotalCounts(postId, dateFilter),
    this.getInteractionBreakdown(postId, dateFilter),
    includeDemographics ? this.getDeviceBreakdown(postId, dateFilter) : Promise.resolve(null),
    includeDemographics ? this.getReferrerBreakdown(postId, dateFilter) : Promise.resolve(null),
    includeGeo ? this.getGeoBreakdown(postId, dateFilter) : Promise.resolve(null)
  ]);

  return {
    timeSeries,
    totals: totalCounts,
    interactions: interactionBreakdown,
    ...(includeDemographics && { devices: deviceData, referrers: referrerData }),
    ...(includeGeo && { geo: geoData })
  };
};

postImpressionSchema.statics.getTotalCounts = async function (postId, dateFilter) {
  const result = await this.aggregate([
    { $match: { postId: new ObjectId(postId), timestamp: { $gte: dateFilter } } },
    {
      $facet: {
        totalImpressions: [{ $count: 'count' }],
        totalEngagement: [{ $group: { _id: null, sum: { $sum: '$engagementScore' } } }],
        uniqueUsers: [{ $group: { _id: '$userId' } }, { $count: 'count' }]
      }
    }
  ]);

  return {
    impressions: result[0].totalImpressions[0]?.count || 0,
    engagement: result[0].totalEngagement[0]?.sum || 0,
    uniqueUsers: result[0].uniqueUsers[0]?.count || 0
  };
};

postImpressionSchema.statics.getInteractionBreakdown = async function (postId, dateFilter) {
  const result = await this.aggregate([
    { $match: { postId: new ObjectId(postId), timestamp: { $gte: dateFilter } } },
    { $group: { _id: '$interactionType', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  return result.reduce((acc, curr) => {
    acc[curr._id] = curr.count;
    return acc;
  }, {});
};

postImpressionSchema.statics.getDeviceBreakdown = async function (postId, dateFilter) {
  return this.aggregate([
    { $match: { postId: new ObjectId(postId), timestamp: { $gte: dateFilter } } },
    { $group: { _id: '$deviceType', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
};

postImpressionSchema.statics.getReferrerBreakdown = async function (postId, dateFilter) {
  return this.aggregate([
    { $match: { postId: new ObjectId(postId), timestamp: { $gte: dateFilter } } },
    { $group: { _id: '$referrer', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
};

postImpressionSchema.statics.getGeoBreakdown = async function (postId, dateFilter) {
  return this.aggregate([
    {
      $match: {
        postId: new ObjectId(postId),
        timestamp: { $gte: dateFilter },
        country: { $exists: true }
      }
    },
    { $group: { _id: '$country', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);
};

postImpressionSchema.statics.getEngagementRate = async function (postId, dateFilter) {
  const [views, engagements] = await Promise.all([
    this.countDocuments({
      postId: new ObjectId(postId),
      timestamp: { $gte: dateFilter },
      interactionType: 'view'
    }),
    this.countDocuments({
      postId: new ObjectId(postId),
      timestamp: { $gte: dateFilter },
      interactionType: { $in: ['like', 'comment', 'share', 'save'] }
    })
  ]);

  return views > 0 ? (engagements / views) * 100 : 0;
};

postImpressionSchema.statics.getTopPosts = async function (userId, options = {}) {
  const { limit = 5, timeRange = '30d' } = options;
  const dateFilter = this.getDateFilter(timeRange);

  return this.aggregate([
    { $match: { userId: new ObjectId(userId), timestamp: { $gte: dateFilter } } },
    {
      $group: {
        _id: '$postId',
        impressions: { $sum: 1 },
        engagements: { $sum: '$engagementScore' },
        lastInteraction: { $max: '$timestamp' }
      }
    },
    { $sort: { engagements: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'posts',
        localField: '_id',
        foreignField: '_id',
        as: 'postDetails'
      }
    },
    { $unwind: '$postDetails' },
    {
      $project: {
        postId: '$_id',
        title: '$postDetails.title',
        impressions: 1,
        engagements: 1,
        engagementRate: {
          $cond: [
            { $eq: ['$impressions', 0] },
            0,
            { $multiply: [{ $divide: ['$engagements', '$impressions'] }, 100] }
          ]
        },
        lastInteraction: 1
      }
    }
  ]);
};

// === Utility Methods ===
postImpressionSchema.statics.getDateFilter = function (timeRange) {
  const now = new Date();
  switch (timeRange) {
    case '1h': return new Date(now.setHours(now.getHours() - 1));
    case '24h': return new Date(now.setDate(now.getDate() - 1));
    case '7d': return new Date(now.setDate(now.getDate() - 7));
    case '30d': return new Date(now.setDate(now.getDate() - 30));
    case '90d': return new Date(now.setDate(now.getDate() - 90));
    case 'all': return new Date(0);
    default: return new Date(now.setDate(now.getDate() - 7));
  }
};

postImpressionSchema.statics.getDateFormat = function (groupBy) {
  switch (groupBy) {
    case 'hour': return '%Y-%m-%d %H:00';
    case 'day': return '%Y-%m-%d';
    case 'week': return '%Y-%U';
    case 'month': return '%Y-%m';
    default: return '%Y-%m-%d';
  }
};

module.exports = mongoose.model('PostImpression', postImpressionSchema);
