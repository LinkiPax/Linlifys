import React, { useEffect, useState } from "react";
import getDeviceId from "./getDeviceId";
import getTreeStage from "./getTreeStage";
import "./Treecomponent.css";
const TreeComponent = () => {
  const [welcome, setWelcome] = useState(false);
  const [treeStage, setTreeStage] = useState("");
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function visit() {
      try {
        const deviceId = await getDeviceId();

        const res = await fetch("/visitor/visit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId }),
        });

        if (!res.ok) throw new Error("API failed");

        const data = await res.json();

        if (!mounted) return;

        setWelcome(!data.isNew);
        setTotalVisitors(data.totalVisitors);
        setTreeStage(getTreeStage(data.totalVisitors));
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    visit();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <div className="tree-loading">🌱 Growing your tree...</div>;
  }

  if (error) {
    return <div className="tree-error">⚠️ Unable to grow tree</div>;
  }

  return (
    <div className="tree-container">
      {welcome && (
        <div className="welcome-badge">
          👋 Welcome back! Your tree remembers you 🌳
        </div>
      )}

      <div className="tree-visual">
        <img
          src={`/trees/${treeStage}.png`}
          alt="Tree Growth"
          className="tree-image"
        />
      </div>

      <div className="tree-stats">
        <p>🌲 Trees grown: <strong>{totalVisitors}</strong></p>
        <p>🌿 Stage: <strong>{treeStage.replace("-", " ")}</strong></p>
      </div>
    </div>
  );
};

export default TreeComponent;
