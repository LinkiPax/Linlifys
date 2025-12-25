// TreeComponent.jsx - Updated
import React, { useEffect, useState, Suspense } from "react";
import getDeviceId from "./getDeviceId";
import getTreeStage from "./getTreeStage";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls, Html } from "@react-three/drei";
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
        <Canvas 
          camera={{ position: [5, 3, 5], fov: 60 }}
          shadows
          style={{ background: '#87CEEB' }}
        >
          {/* Lighting setup */}
          <ambientLight intensity={0.7} />
          <directionalLight 
            position={[10, 10, 5]} 
            intensity={1.2} 
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-far={50}
            shadow-camera-left={-20}
            shadow-camera-right={20}
            shadow-camera-top={20}
            shadow-camera-bottom={-20}
          />
          <directionalLight 
            position={[-5, 5, -5]} 
            intensity={0.5} 
            color="#FFE082"
          />
          
          <Suspense fallback={
            <Html center>
              <div className="tree-loading-3d">🌿 Growing tree...</div>
            </Html>
          }>
            <Tree3D visitorCount={totalVisitors} />
          </Suspense>
          
          <OrbitControls 
            enableZoom={true}
            enablePan={true}
            minDistance={3}
            maxDistance={20}
            autoRotate={true}
            autoRotateSpeed={0.3}
            enableDamping
            dampingFactor={0.05}
            maxPolarAngle={Math.PI / 2}
          />
          
          <Environment preset="sunset" />
          
          {/* Grid helper for debugging */}
          {/* <gridHelper args={[10, 10]} /> */}
          {/* <axesHelper args={[5]} /> */}
        </Canvas>
      </div>

      <div className="tree-stats">
        <div className="stat-item">
          <span className="stat-icon">🌲</span>
          <span className="stat-label">Visitors:</span>
          <span className="stat-value">{totalVisitors}</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">🌿</span>
          <span className="stat-label">Stage:</span>
          <span className="stat-value">{treeStage.replace("-", " ")}</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">🌳</span>
          <span className="stat-label">Tree Size:</span>
          <span className="stat-value">
            {totalVisitors < 5 ? "Tiny Bush" :
             totalVisitors < 15 ? "Small Tree" :
             totalVisitors < 25 ? "Medium Tree" :
             totalVisitors < 35 ? "Large Tree" :
             "Giant Tree"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TreeComponent;