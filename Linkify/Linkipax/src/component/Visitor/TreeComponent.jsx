// TreeComponent.jsx - Simplified
import React, { useEffect, useState, Suspense } from "react";
import getDeviceId from "./getDeviceId";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Tree3D from "./Tree3D";
import "./Treecomponent.css";

const TreeComponent = () => {
  const [welcome, setWelcome] = useState(false);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // Calculate which tree to show (1-7)
  const getTreeNumber = (visitors) => {
    if (visitors < 5) return 1;
    if (visitors < 10) return 2;
    if (visitors < 15) return 3;
    if (visitors < 25) return 4;
    if (visitors < 35) return 5;
    if (visitors < 45) return 6;
    return 7;
  };

  useEffect(() => {
    let mounted = true;

    async function visit() {
      try {
        const deviceId = await getDeviceId();
        if (!deviceId) return;

        const res = await fetch(`${import.meta.env.VITE_API_URL}/visitor/visit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId }),
        });

        if (!res.ok) throw new Error("API failed");

        const data = await res.json();
        if (!mounted) return;

        setWelcome(!data.isNew);
        setTotalVisitors(data.totalVisitors);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    visit();
    return () => (mounted = false);
  }, []);

  if (loading) return <div className="tree-loading">🌱 Growing your tree...</div>;
  if (error) return <div className="tree-error">⚠️ Unable to grow tree</div>;

  const treeNumber = getTreeNumber(totalVisitors);
  const treeNames = [
    "Tiny Bush",
    "Small Tree", 
    "Medium Tree",
    "Large Tree",
    "Very Large Tree",
    "Giant Tree",
    "Mega Tree"
  ];

  return (
    <div className="tree-container">
      {welcome && (
        <div className="welcome-badge">
          👋 Welcome back! Your tree remembers you 🌳
        </div>
      )}

      <div className="tree-visual">
        <Canvas 
          camera={{ position: [4, 3, 4], fov: 60 }}
          style={{ background: '#87CEEB' }}
        >
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 10, 5]} intensity={1} />
          
          <Suspense fallback={null}>
            <Tree3D visitorCount={totalVisitors} />
          </Suspense>
          
          <OrbitControls 
            enableZoom={true}
            enablePan={true}
            minDistance={2}
            maxDistance={15}
            autoRotate={true}
            autoRotateSpeed={0.3}
          />
        </Canvas>
      </div>

      <div className="tree-stats">
        <div className="stat-item">
          <span className="stat-icon">👥</span>
          <span className="stat-label">Total Visitors:</span>
          <span className="stat-value">{totalVisitors}</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">🌳</span>
          <span className="stat-label">Tree Number:</span>
          <span className="stat-value">#{treeNumber}/7</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">📏</span>
          <span className="stat-label">Tree Size:</span>
          <span className="stat-value">{treeNames[treeNumber - 1]}</span>
        </div>
      </div>
      
      <div className="tree-progress">
        <div className="progress-label">Tree Growth Progress:</div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(treeNumber / 7) * 100}%` }}
          >
            Tree {treeNumber}/7
          </div>
        </div>
        <div className="progress-text">
          Next tree at: {
            treeNumber < 7 ? 
            `${[5, 10, 15, 25, 35, 45, Infinity][treeNumber - 1]} visitors` : 
            "Maximum size reached!"
          }
        </div>
      </div>
    </div>
  );
};

export default TreeComponent;