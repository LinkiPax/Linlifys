// TreeComponent.jsx - Fixed version
import React, { useEffect, useState, Suspense } from "react";
import getDeviceId from "./getDeviceId";
import getTreeStage from "./getTreeStage";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import Tree3D from "./Tree3D";
import "./Treecomponent.css";

const TreeComponent = () => {
  const [welcome, setWelcome] = useState(false);
  const [treeStage, setTreeStage] = useState("seed");
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
        setTreeStage(getTreeStage(data.totalVisitors));
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

  return (
    <div className="tree-container">
      {welcome && (
        <div className="welcome-badge">
          👋 Welcome back! Your tree remembers you 🌳
        </div>
      )}

      <div className="tree-visual">
        <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
          <Suspense fallback={null}>
            {/* Only pass visitorCount since Tree3D will calculate stage internally */}
            <Tree3D visitorCount={totalVisitors} />
          </Suspense>
          <OrbitControls 
            enableZoom={true}
            enablePan={true}
            minDistance={3}
            maxDistance={10}
            autoRotate={true}
            autoRotateSpeed={0.5}
          />
          <Environment preset="forest" />
        </Canvas>
      </div>

      <div className="tree-stats">
        <p>🌲 Visitors: <strong>{totalVisitors}</strong></p>
        <p>🌿 Stage: <strong>{treeStage.replace("-", " ")}</strong></p>
        <p>🌳 Tree Size: <strong>
          {totalVisitors < 5 ? "Tiny Bush" :
           totalVisitors < 15 ? "Small Tree" :
           totalVisitors < 25 ? "Medium Tree" :
           totalVisitors < 35 ? "Large Tree" :
           "Giant Tree"}
        </strong></p>
      </div>
    </div>
  );
};

export default TreeComponent;