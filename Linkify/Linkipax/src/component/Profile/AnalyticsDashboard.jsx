import React, { useEffect, useState } from "react";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
} from "chart.js";
import "./AnalyticsDashboard.css";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

const API_BASE_URL = "http://localhost:5000/post-impression";

const AnalyticsDashboard = ({ profileId }) => {
  // State declarations
  const [posts, setPosts] = useState([]);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [analyticsData, setAnalyticsData] = useState({
    timeSeries: [],
    totals: {
      impressions: 0,
      engagement: 0,
      uniqueUsers: 0,
    },
    interactions: {},
    devices: [],
    referrers: [],
    os: [],
    browsers: [],
    countries: [],
    cities: [],
  });
  const [loading, setLoading] = useState({
    posts: true,
    analytics: false,
    demographics: false,
    geography: false,
    impression: false,
  });
  const [timeRange, setTimeRange] = useState("7d");
  const [groupBy, setGroupBy] = useState("day");
  const [activeTab, setActiveTab] = useState("overview");
  const [metric, setMetric] = useState("impressions");
  const [topPosts, setTopPosts] = useState([]);
  const [userEngagement, setUserEngagement] = useState(null);
  const [impressionData, setImpressionData] = useState({
    postId: "",
    userId: "",
    interactionType: "view",
    duration: 0,
    deviceType: "desktop",
    referrer: "direct",
  });

  // Data fetching functions
  const fetchUserPosts = async () => {
    try {
      setLoading((prev) => ({ ...prev, posts: true }));
      const response = await axios.get(
        `http://localhost:5000/api/posts/user/${profileId}`
      );
      setPosts(response.data);
      if (response.data.length > 0) {
        setSelectedPostId(response.data[0]._id);
        setImpressionData((prev) => ({
          ...prev,
          postId: response.data[0]._id,
          userId: profileId,
        }));
      }
    } catch (error) {
      console.error("Error fetching user posts:", error);
    } finally {
      setLoading((prev) => ({ ...prev, posts: false }));
    }
  };

  const fetchAnalyticsData = async () => {
    if (!selectedPostId) return;

    try {
      setLoading((prev) => ({ ...prev, analytics: true }));
      const response = await axios.get(
        `${API_BASE_URL}/analytics/posts/${selectedPostId}`,
        {
          params: {
            timeRange,
            groupBy,
            include: "all",
          },
        }
      );
      setAnalyticsData(response.data.data);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setLoading((prev) => ({ ...prev, analytics: false }));
    }
  };

  const fetchDemographicsData = async () => {
    if (!selectedPostId) return;

    try {
      setLoading((prev) => ({ ...prev, demographics: true }));
      const response = await axios.get(
        `${API_BASE_URL}/analytics/posts/${selectedPostId}/demographics`,
        {
          params: { timeRange },
        }
      );
      setAnalyticsData((prev) => ({
        ...prev,
        devices: response.data.data.devices,
        referrers: response.data.data.referrers,
        os: response.data.data.os,
        browsers: response.data.data.browsers,
      }));
    } catch (error) {
      console.error("Error fetching demographics data:", error);
    } finally {
      setLoading((prev) => ({ ...prev, demographics: false }));
    }
  };

  const fetchGeographyData = async () => {
    if (!selectedPostId) return;

    try {
      setLoading((prev) => ({ ...prev, geography: true }));
      const response = await axios.get(
        `${API_BASE_URL}/analytics/posts/${selectedPostId}/geography`,
        {
          params: { timeRange, limit: 10 },
        }
      );
      setAnalyticsData((prev) => ({
        ...prev,
        countries: response.data.data.countries,
        cities: response.data.data.cities,
      }));
    } catch (error) {
      console.error("Error fetching geography data:", error);
    } finally {
      setLoading((prev) => ({ ...prev, geography: false }));
    }
  };

  const recordImpression = async () => {
    if (!impressionData.postId || !impressionData.userId) return;

    try {
      setLoading((prev) => ({ ...prev, impression: true }));
      const response = await axios.post(`${API_BASE_URL}/impressions`, {
        ...impressionData,
        sessionId: Math.random().toString(36).substring(7),
        os: navigator.platform,
        browser: navigator.userAgent,
      });
      console.log("Impression recorded:", response.data);
      fetchAnalyticsData();
    } catch (error) {
      console.error("Error recording impression:", error);
    } finally {
      setLoading((prev) => ({ ...prev, impression: false }));
    }
  };

  const fetchTopPosts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/analytics/posts/top`, {
        params: {
          timeRange,
          userId: profileId,
          limit: 5,
        },
      });
      setTopPosts(response.data.data);
    } catch (error) {
      console.error("Error fetching top posts:", error);
    }
  };

  const fetchUserEngagement = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/analytics/users/${profileId}/engagement`,
        {
          params: { timeRange },
        }
      );
      setUserEngagement(response.data.data);
    } catch (error) {
      console.error("Error fetching user engagement:", error);
    }
  };

  // Effects
  useEffect(() => {
    fetchUserPosts();
    fetchTopPosts();
    fetchUserEngagement();
  }, [profileId, timeRange]);

  useEffect(() => {
    if (selectedPostId) {
      fetchAnalyticsData();
      fetchDemographicsData();
      fetchGeographyData();
      setImpressionData((prev) => ({ ...prev, postId: selectedPostId }));
    }
  }, [selectedPostId, timeRange, groupBy]);

  // Chart configuration
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    interaction: {
      mode: "nearest",
      axis: "x",
      intersect: false,
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
    elements: {
      line: {
        tension: 0.4,
        borderWidth: 2,
      },
      point: {
        radius: 3,
        hoverRadius: 6,
        backgroundColor: "white",
        borderWidth: 2,
      },
    },
    maintainAspectRatio: false,
  };

  // Render helper functions
  const renderChart = (data, color, label, type = "line") => {
    const ChartComponent = type === "line" ? Line : Bar;
    return (
      <ChartComponent
        data={{
          labels: data.labels,
          datasets: [
            {
              label,
              data: data.values,
              borderColor: color,
              backgroundColor: type === "line" ? `${color}20` : color,
              fill: type === "line",
              pointBackgroundColor: "white",
              pointBorderColor: color,
            },
          ],
        }}
        options={chartOptions}
      />
    );
  };

  const renderPieChart = (data, label) => {
    return (
      <Doughnut
        data={{
          labels: data.map((item) => item._id),
          datasets: [
            {
              data: data.map((item) => item.count),
              backgroundColor: [
                "rgba(52, 152, 219, 0.7)",
                "rgba(155, 89, 182, 0.7)",
                "rgba(46, 204, 113, 0.7)",
                "rgba(241, 196, 15, 0.7)",
                "rgba(231, 76, 60, 0.7)",
              ],
              borderColor: [
                "rgba(52, 152, 219, 1)",
                "rgba(155, 89, 182, 1)",
                "rgba(46, 204, 113, 1)",
                "rgba(241, 196, 15, 1)",
                "rgba(231, 76, 60, 1)",
              ],
              borderWidth: 1,
            },
          ],
        }}
        options={{
          plugins: {
            legend: {
              position: "right",
            },
            title: {
              display: true,
              text: label,
            },
          },
          maintainAspectRatio: false,
        }}
      />
    );
  };

  const renderMetricSelector = () => (
    <div className="metric-selector">
      <label>Metric: </label>
      <select value={metric} onChange={(e) => setMetric(e.target.value)}>
        <option value="impressions">Impressions</option>
        <option value="engagements">Engagements</option>
        <option value="uniqueUsers">Unique Users</option>
      </select>
    </div>
  );

  // Component rendering functions
  const renderTimeSeriesData = () => {
    const data = {
      labels: analyticsData.timeSeries.map((item) => item.date),
      values: analyticsData.timeSeries.map((item) => item[metric]),
    };

    const metricLabels = {
      impressions: "Impressions",
      engagements: "Engagement Score",
      uniqueUsers: "Unique Users",
    };

    return (
      <div className="chart-container full-width">
        <div className="chart-header">
          <h3>{metricLabels[metric]} Over Time</h3>
          <div className="chart-controls">
            {renderMetricSelector()}
            <div className="group-by-selector">
              <label>Group by: </label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
              >
                <option value="hour">Hour</option>
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
            </div>
          </div>
        </div>
        {loading.analytics ? (
          <div className="chart-skeleton">
            <div className="loading-animation"></div>
          </div>
        ) : data.labels.length > 0 ? (
          renderChart(data, "rgba(52, 152, 219, 1)", metricLabels[metric])
        ) : (
          <div className="no-data">No data available</div>
        )}
      </div>
    );
  };

  const renderDemographics = () => (
    <div className="demographics-grid">
      <div className="chart-container">
        <h3>Device Distribution</h3>
        {loading.demographics ? (
          <div className="chart-skeleton">
            <div className="loading-animation"></div>
          </div>
        ) : analyticsData.devices.length > 0 ? (
          renderPieChart(analyticsData.devices, "Devices")
        ) : (
          <div className="no-data">No device data available</div>
        )}
      </div>

      <div className="chart-container">
        <h3>Traffic Sources</h3>
        {loading.demographics ? (
          <div className="chart-skeleton">
            <div className="loading-animation"></div>
          </div>
        ) : analyticsData.referrers.length > 0 ? (
          renderPieChart(analyticsData.referrers, "Referrers")
        ) : (
          <div className="no-data">No referrer data available</div>
        )}
      </div>

      <div className="chart-container">
        <h3>Operating Systems</h3>
        {loading.demographics ? (
          <div className="chart-skeleton">
            <div className="loading-animation"></div>
          </div>
        ) : analyticsData.os.length > 0 ? (
          renderPieChart(analyticsData.os, "Operating Systems")
        ) : (
          <div className="no-data">No OS data available</div>
        )}
      </div>

      <div className="chart-container">
        <h3>Browser Usage</h3>
        {loading.demographics ? (
          <div className="chart-skeleton">
            <div className="loading-animation"></div>
          </div>
        ) : analyticsData.browsers.length > 0 ? (
          renderPieChart(analyticsData.browsers, "Browsers")
        ) : (
          <div className="no-data">No browser data available</div>
        )}
      </div>
    </div>
  );

  const renderGeoData = () => (
    <div className="geo-grid">
      <div className="chart-container">
        <h3>Top Countries</h3>
        {loading.geography ? (
          <div className="chart-skeleton">
            <div className="loading-animation"></div>
          </div>
        ) : analyticsData.countries.length > 0 ? (
          <Bar
            data={{
              labels: analyticsData.countries.map((item) => item._id),
              datasets: [
                {
                  label: "Impressions",
                  data: analyticsData.countries.map((item) => item.count),
                  backgroundColor: "rgba(52, 152, 219, 0.7)",
                },
              ],
            }}
            options={{
              indexAxis: "y",
              plugins: {
                legend: {
                  display: false,
                },
              },
              maintainAspectRatio: false,
            }}
          />
        ) : (
          <div className="no-data">No country data available</div>
        )}
      </div>

      <div className="chart-container">
        <h3>Top Cities</h3>
        {loading.geography ? (
          <div className="chart-skeleton">
            <div className="loading-animation"></div>
          </div>
        ) : analyticsData.cities.length > 0 ? (
          <Bar
            data={{
              labels: analyticsData.cities.map(
                (item) => `${item._id.city}, ${item._id.country}`
              ),
              datasets: [
                {
                  label: "Impressions",
                  data: analyticsData.cities.map((item) => item.count),
                  backgroundColor: "rgba(46, 204, 113, 0.7)",
                },
              ],
            }}
            options={{
              indexAxis: "y",
              plugins: {
                legend: {
                  display: false,
                },
              },
              maintainAspectRatio: false,
            }}
          />
        ) : (
          <div className="no-data">No city data available</div>
        )}
      </div>
    </div>
  );

  const renderInteractions = () => {
    const data = {
      labels: Object.keys(analyticsData.interactions),
      values: Object.values(analyticsData.interactions),
    };

    return (
      <div className="chart-container full-width">
        <div className="chart-header">
          <h3>Interaction Types</h3>
        </div>
        {loading.analytics ? (
          <div className="chart-skeleton">
            <div className="loading-animation"></div>
          </div>
        ) : data.labels.length > 0 ? (
          renderChart(data, "rgba(155, 89, 182, 1)", "Interactions", "bar")
        ) : (
          <div className="no-data">No interaction data available</div>
        )}
      </div>
    );
  };

  const renderStatsOverview = () => (
    <div className="stats-overview">
      <div className="stat-card primary">
        <h3>Total Impressions</h3>
        <p className="stat-value">{analyticsData.totals.impressions}</p>
        <p className="stat-description">Views of this post</p>
      </div>
      <div className="stat-card success">
        <h3>Unique Users</h3>
        <p className="stat-value">{analyticsData.totals.uniqueUsers}</p>
        <p className="stat-description">Distinct viewers</p>
      </div>
      <div className="stat-card warning">
        <h3>Engagement Score</h3>
        <p className="stat-value">
          {analyticsData.totals.engagement.toFixed(0)}
        </p>
        <p className="stat-description">Total engagement</p>
      </div>
      <div className="stat-card danger">
        <h3>Engagement Rate</h3>
        <p className="stat-value">
          {analyticsData.totals.impressions > 0
            ? (
                (analyticsData.totals.engagement /
                  analyticsData.totals.impressions) *
                100
              ).toFixed(1)
            : 0}
          %
        </p>
        <p className="stat-description">Engagement per view</p>
      </div>
    </div>
  );

  const renderTopPosts = () => (
    <div className="top-posts-container">
      <h3>Your Top Performing Posts</h3>
      {topPosts.length > 0 ? (
        <div className="top-posts-list">
          {topPosts.map((post) => (
            <div key={post._id || post.postId} className="top-post-item">
              <div className="post-content">
                {post.postDetails?.content?.substring(0, 50) || "Post"}
                {post.postDetails?.content?.length > 50 && "..."}
              </div>
              <div className="post-stats">
                <span>Impressions: {post.impressions}</span>
                <span>Engagement: {post.engagements}</span>
                <span>Unique Users: {post.uniqueUsers}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-data">No top posts data available</div>
      )}
    </div>
  );

  const renderUserEngagement = () => (
    <div className="user-engagement-container">
      <h3>Your Engagement Overview</h3>
      {userEngagement ? (
        <div className="engagement-stats">
          <div className="engagement-stat">
            <h4>Total Interactions</h4>
            <p>{userEngagement.stats.totalInteractions}</p>
          </div>
          <div className="engagement-stat">
            <h4>Average Engagement</h4>
            <p>{userEngagement.stats.avgEngagement.toFixed(1)}</p>
          </div>
          <div className="engagement-chart">
            <h4>Activity Trend</h4>
            <Line
              data={{
                labels: userEngagement.activityTrend.map((item) => item.date),
                datasets: [
                  {
                    label: "Daily Activity",
                    data: userEngagement.activityTrend.map(
                      (item) => item.count
                    ),
                    borderColor: "rgba(52, 152, 219, 1)",
                    backgroundColor: "rgba(52, 152, 219, 0.2)",
                    fill: true,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          </div>
          <div className="interaction-types">
            <h4>Interaction Types</h4>
            <ul>
              {userEngagement.stats.interactionTypes.map((type) => (
                <li key={type._id}>
                  {type._id}: {type.count}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="no-data">No user engagement data available</div>
      )}
    </div>
  );

  const renderImpressionTracker = () => (
    <div className="impression-tracker">
      <h3>Record New Impression</h3>
      <div className="impression-form">
        <div className="form-group">
          <label>Interaction Type:</label>
          <select
            value={impressionData.interactionType}
            onChange={(e) =>
              setImpressionData({
                ...impressionData,
                interactionType: e.target.value,
              })
            }
          >
            <option value="view">View</option>
            <option value="like">Like</option>
            <option value="comment">Comment</option>
            <option value="share">Share</option>
          </select>
        </div>
        <div className="form-group">
          <label>Duration (ms):</label>
          <input
            type="number"
            value={impressionData.duration}
            onChange={(e) =>
              setImpressionData({
                ...impressionData,
                duration: parseInt(e.target.value),
              })
            }
          />
        </div>
        <div className="form-group">
          <label>Device Type:</label>
          <select
            value={impressionData.deviceType}
            onChange={(e) =>
              setImpressionData({
                ...impressionData,
                deviceType: e.target.value,
              })
            }
          >
            <option value="desktop">Desktop</option>
            <option value="mobile">Mobile</option>
            <option value="tablet">Tablet</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="form-group">
          <label>Referrer:</label>
          <select
            value={impressionData.referrer}
            onChange={(e) =>
              setImpressionData({ ...impressionData, referrer: e.target.value })
            }
          >
            <option value="direct">Direct</option>
            <option value="search">Search</option>
            <option value="social">Social</option>
            <option value="email">Email</option>
            <option value="other">Other</option>
          </select>
        </div>
        <button
          onClick={recordImpression}
          disabled={loading.impression}
          className="record-button"
        >
          {loading.impression ? "Recording..." : "Record Impression"}
        </button>
      </div>
    </div>
  );

  // Main render
  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <h2>Post Analytics</h2>
        <div className="controls">
          <div className="post-selector">
            <select
              value={selectedPostId || ""}
              onChange={(e) => setSelectedPostId(e.target.value)}
              disabled={loading.posts}
            >
              {loading.posts ? (
                <option>Loading posts...</option>
              ) : posts.length > 0 ? (
                posts.map((post) => (
                  <option key={post._id} value={post._id}>
                    {post.content
                      ? `${post.content.substring(0, 30)}${
                          post.content.length > 30 ? "..." : ""
                        }`
                      : "Post"}
                  </option>
                ))
              ) : (
                <option>No posts available</option>
              )}
            </select>
          </div>

          <div className="tabs">
            <button
              className={activeTab === "overview" ? "active" : ""}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            <button
              className={activeTab === "trends" ? "active" : ""}
              onClick={() => setActiveTab("trends")}
            >
              Trends
            </button>
            <button
              className={activeTab === "demographics" ? "active" : ""}
              onClick={() => setActiveTab("demographics")}
            >
              Demographics
            </button>
            <button
              className={activeTab === "geo" ? "active" : ""}
              onClick={() => setActiveTab("geo")}
            >
              Geography
            </button>
            <button
              className={activeTab === "interactions" ? "active" : ""}
              onClick={() => setActiveTab("interactions")}
            >
              Interactions
            </button>
            <button
              className={activeTab === "top-posts" ? "active" : ""}
              onClick={() => setActiveTab("top-posts")}
            >
              Top Posts
            </button>
            <button
              className={activeTab === "user-engagement" ? "active" : ""}
              onClick={() => setActiveTab("user-engagement")}
            >
              Your Engagement
            </button>
            <button
              className={activeTab === "track-impression" ? "active" : ""}
              onClick={() => setActiveTab("track-impression")}
            >
              Track Impression
            </button>
          </div>
          <div className="time-range">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="range-selector"
            >
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>
      </div>

      {!selectedPostId && !loading.posts && (
        <div className="no-posts-message">No posts available for analytics</div>
      )}

      {selectedPostId && (
        <>
          {activeTab === "overview" && (
            <>
              {renderStatsOverview()}
              {renderTimeSeriesData()}
              {renderInteractions()}
            </>
          )}

          {activeTab === "trends" && renderTimeSeriesData()}

          {activeTab === "demographics" && renderDemographics()}

          {activeTab === "geo" && renderGeoData()}

          {activeTab === "interactions" && renderInteractions()}

          {activeTab === "top-posts" && renderTopPosts()}

          {activeTab === "user-engagement" && renderUserEngagement()}

          {activeTab === "track-impression" && renderImpressionTracker()}
        </>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
