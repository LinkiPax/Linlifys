import React, { useEffect, useState } from "react";

const SettingsPage = () => {
  const [timeSpent, setTimeSpent] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [startTime, setStartTime] = useState(Date.now());
  const [theme, setTheme] = useState('System');
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [twoFA, setTwoFA] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(false);

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
    if (theme === "Dark") {
      document.body.classList.add("dark-mode");
      document.body.classList.remove("light-mode");
    } else if (theme === "Light") {
      document.body.classList.add("light-mode");
      document.body.classList.remove("dark-mode");
    } else {
      document.body.classList.remove("dark-mode", "light-mode");
    }
  }, [theme]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Settings</h1>

      {/* Time Monitoring */}
      <div className="bg-white shadow-md rounded-xl p-4 mb-6">
        <h2 className="text-xl font-semibold mb-2">⏱️ Time Monitoring</h2>
        <p>You've spent <strong>{formatTime(timeSpent)}</strong> on Linkify in this session.</p>
      </div>

      {/* Theme Selection */}
      <div className="bg-white shadow-md rounded-xl p-4 mb-6">
        <h2 className="text-xl font-semibold mb-2">🎨 Theme</h2>
        <select
          className="border rounded-md p-2"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
        >
          <option>Light</option>
          <option>Dark</option>
          <option>System</option>
        </select>
      </div>

      {/* Privacy Settings */}
      <div className="bg-white shadow-md rounded-xl p-4 mb-6">
        <h2 className="text-xl font-semibold mb-2">🔐 Privacy</h2>
        <label className="block mb-2">
          <input
            type="checkbox"
            className="mr-2"
            checked={profileVisibility}
            onChange={() => setProfileVisibility(!profileVisibility)}
          />
          Hide profile from search
        </label>
        <label className="block mb-2">
          <input
            type="checkbox"
            className="mr-2"
            checked={twoFA}
            onChange={() => setTwoFA(!twoFA)}
          />
          Enable 2FA login
        </label>
      </div>

      {/* Notifications */}
      <div className="bg-white shadow-md rounded-xl p-4 mb-6">
        <h2 className="text-xl font-semibold mb-2">🔔 Notifications</h2>
        <label className="block mb-2">
          <input
            type="checkbox"
            className="mr-2"
            checked={emailNotifications}
            onChange={() => setEmailNotifications(!emailNotifications)}
          />
          Email alerts for messages
        </label>
        <label className="block mb-2">
          <input
            type="checkbox"
            className="mr-2"
            checked={pushNotifications}
            onChange={() => setPushNotifications(!pushNotifications)}
          />
          Push notifications for job offers
        </label>
      </div>

      {/* Account Management */}
      <div className="bg-white shadow-md rounded-xl p-4 mb-6">
        <h2 className="text-xl font-semibold mb-2">🔑 Account Management</h2>
        <button className="text-red-500">Delete Account</button>
      </div>

      {/* Language Settings */}
      <div className="bg-white shadow-md rounded-xl p-4 mb-6">
        <h2 className="text-xl font-semibold mb-2">🌍 Language Settings</h2>
        <select className="border rounded-md p-2">
          <option>English</option>
          <option>Hindi</option>
          <option>Spanish</option>
        </select>
      </div>

      {/* Data Download */}
      <div className="bg-white shadow-md rounded-xl p-4 mb-6">
        <h2 className="text-xl font-semibold mb-2">📊 Data Download</h2>
        <button className="text-blue-500">Download Your Data</button>
      </div>
    </div>
  );
};

export default SettingsPage;
