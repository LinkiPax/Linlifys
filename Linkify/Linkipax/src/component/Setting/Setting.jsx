import React, { useEffect, useState } from "react";
import {
  FiMoon,
  FiSun,
  FiUser,
  FiBell,
  FiLock,
  FiGlobe,
  FiDownload,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiMail,
  FiSmartphone,
} from "react-icons/fi";
import "./Setting.css";
const SettingsPage = () => {
  // Time tracking
  const [timeSpent, setTimeSpent] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [startTime, setStartTime] = useState(Date.now());

  // Appearance
  const [theme, setTheme] = useState("system");
  const [fontSize, setFontSize] = useState("medium");
  const [density, setDensity] = useState("comfortable");

  // Privacy
  const [profileVisibility, setProfileVisibility] = useState("public");
  const [twoFA, setTwoFA] = useState(false);
  const [activityStatus, setActivityStatus] = useState(true);

  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [newsletter, setNewsletter] = useState(false);

  // Account
  const [language, setLanguage] = useState("english");
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Time tracking logic
  useEffect(() => {
    const handleFocus = () => {
      setIsActive(true);
      setStartTime(Date.now());
    };

    const handleBlur = () => {
      setIsActive(false);
      const sessionTime = Math.floor((Date.now() - startTime) / 1000);
      setTimeSpent((prev) => prev + sessionTime);
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, [startTime]);

  // Format time for display
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  // Handle theme change
  useEffect(() => {
    document.body.className = "";
    if (theme === "dark") {
      document.body.classList.add("dark-theme");
    } else if (theme === "light") {
      document.body.classList.add("light-theme");
    }
  }, [theme]);

  // Handle font size change
  useEffect(() => {
    document.documentElement.style.fontSize =
      fontSize === "small" ? "14px" : fontSize === "medium" ? "16px" : "18px";
  }, [fontSize]);

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Settings</h1>
        <p className="settings-subtitle">Manage your account preferences</p>
      </div>

      <div className="settings-grid">
        {/* Account Overview */}
        <div className="settings-card">
          <div className="settings-card-header">
            <FiUser className="settings-icon" />
            <h2>Account Overview</h2>
          </div>
          <div className="settings-card-body">
            <div className="settings-stat">
              <span>Active since</span>
              <strong>May 2023</strong>
            </div>
            <div className="settings-stat">
              <span>Current session</span>
              <strong>{formatTime(timeSpent)}</strong>
            </div>
            <div className="settings-stat">
              <span>Account type</span>
              <strong>Premium</strong>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="settings-card">
          <div className="settings-card-header">
            <FiSun className="settings-icon" />
            <h2>Appearance</h2>
          </div>
          <div className="settings-card-body">
            <div className="settings-option">
              <label>Theme</label>
              <div className="theme-options">
                <button
                  className={`theme-option ${
                    theme === "light" ? "active" : ""
                  }`}
                  onClick={() => setTheme("light")}
                >
                  <FiSun /> Light
                </button>
                <button
                  className={`theme-option ${theme === "dark" ? "active" : ""}`}
                  onClick={() => setTheme("dark")}
                >
                  <FiMoon /> Dark
                </button>
                <button
                  className={`theme-option ${
                    theme === "system" ? "active" : ""
                  }`}
                  onClick={() => setTheme("system")}
                >
                  System
                </button>
              </div>
            </div>

            <div className="settings-option">
              <label>Font Size</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="fontSize"
                    checked={fontSize === "small"}
                    onChange={() => setFontSize("small")}
                  />
                  Small
                </label>
                <label>
                  <input
                    type="radio"
                    name="fontSize"
                    checked={fontSize === "medium"}
                    onChange={() => setFontSize("medium")}
                  />
                  Medium
                </label>
                <label>
                  <input
                    type="radio"
                    name="fontSize"
                    checked={fontSize === "large"}
                    onChange={() => setFontSize("large")}
                  />
                  Large
                </label>
              </div>
            </div>

            <div className="settings-option">
              <label>Density</label>
              <select
                value={density}
                onChange={(e) => setDensity(e.target.value)}
              >
                <option value="compact">Compact</option>
                <option value="comfortable">Comfortable</option>
                <option value="spacious">Spacious</option>
              </select>
            </div>
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="settings-card">
          <div className="settings-card-header">
            <FiLock className="settings-icon" />
            <h2>Privacy & Security</h2>
          </div>
          <div className="settings-card-body">
            <div className="settings-toggle">
              <div>
                <label>Profile Visibility</label>
                <p className="settings-description">Who can see your profile</p>
              </div>
              <select
                value={profileVisibility}
                onChange={(e) => setProfileVisibility(e.target.value)}
              >
                <option value="public">Public</option>
                <option value="connections">Connections Only</option>
                <option value="private">Private</option>
              </select>
            </div>

            <div className="settings-toggle">
              <div>
                <label>Two-Factor Authentication</label>
                <p className="settings-description">
                  Add an extra layer of security
                </p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={twoFA}
                  onChange={() => setTwoFA(!twoFA)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="settings-toggle">
              <div>
                <label>Show Activity Status</label>
                <p className="settings-description">
                  Let others see when you're active
                </p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={activityStatus}
                  onChange={() => setActivityStatus(!activityStatus)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <button className="settings-link">View privacy policy</button>
          </div>
        </div>

        {/* Notifications */}
        <div className="settings-card">
          <div className="settings-card-header">
            <FiBell className="settings-icon" />
            <h2>Notifications</h2>
          </div>
          <div className="settings-card-body">
            <div className="settings-toggle">
              <div>
                <label>
                  <FiMail /> Email Notifications
                </label>
                <p className="settings-description">
                  Receive updates via email
                </p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={() => setEmailNotifications(!emailNotifications)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="settings-toggle">
              <div>
                <label>
                  <FiSmartphone /> Push Notifications
                </label>
                <p className="settings-description">
                  Get alerts on your device
                </p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={pushNotifications}
                  onChange={() => setPushNotifications(!pushNotifications)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="settings-toggle">
              <div>
                <label>Newsletter</label>
                <p className="settings-description">
                  Receive our weekly newsletter
                </p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={newsletter}
                  onChange={() => setNewsletter(!newsletter)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Language & Region */}
        <div className="settings-card">
          <div className="settings-card-header">
            <FiGlobe className="settings-icon" />
            <h2>Language & Region</h2>
          </div>
          <div className="settings-card-body">
            <div className="settings-option">
              <label>Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="english">English</option>
                <option value="hindi">Hindi</option>
                <option value="spanish">Spanish</option>
                <option value="french">French</option>
                <option value="german">German</option>
              </select>
            </div>

            <div className="settings-option">
              <label>Time Zone</label>
              <select>
                <option>(GMT-08:00) Pacific Time</option>
                <option>(GMT-05:00) Eastern Time</option>
                <option>(GMT+00:00) London</option>
                <option>(GMT+05:30) India</option>
              </select>
            </div>

            <div className="settings-option">
              <label>Date Format</label>
              <select>
                <option>MM/DD/YYYY</option>
                <option>DD/MM/YYYY</option>
                <option>YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="settings-card">
          <div className="settings-card-header">
            <FiDownload className="settings-icon" />
            <h2>Data Management</h2>
          </div>
          <div className="settings-card-body">
            <button className="settings-button">
              <FiDownload /> Download Your Data
            </button>
            <p className="settings-description">
              Get a copy of all your Linkify data
            </p>

            <button className="settings-button">Export Connections</button>
            <p className="settings-description">
              Download your network information
            </p>
          </div>
        </div>

        {/* Account Actions */}
        <div className="settings-card danger-zone">
          <div className="settings-card-header">
            <FiTrash2 className="settings-icon" />
            <h2>Account Actions</h2>
          </div>
          <div className="settings-card-body">
            <button className="settings-button danger">
              Deactivate Account
            </button>
            <p className="settings-description">
              Temporarily disable your account
            </p>

            {deleteConfirm ? (
              <div className="delete-confirmation">
                <p>
                  Are you sure you want to delete your account? This cannot be
                  undone.
                </p>
                <div className="confirmation-buttons">
                  <button
                    className="settings-button danger"
                    onClick={() => console.log("Account deleted")}
                  >
                    Confirm Delete
                  </button>
                  <button
                    className="settings-button"
                    onClick={() => setDeleteConfirm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="settings-button danger"
                onClick={() => setDeleteConfirm(true)}
              >
                Delete Account Permanently
              </button>
            )}
            <p className="settings-description">
              This will permanently remove all your data
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
