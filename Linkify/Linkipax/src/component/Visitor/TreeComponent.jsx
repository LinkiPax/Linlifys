// TreeComponent.jsx - Updated with better lighting
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
          camera={{ position: [3, 2, 3], fov: 50 }}
          shadows
        >
          {/* Better lighting setup */}
          <ambientLight intensity={0.6} />
          <directionalLight 
            position={[5, 5, 5]} 
            intensity={1} 
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={50}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
          />
          <pointLight position={[-5, 5, -5]} intensity={0.5} color="#FFE082" />
          
          {/* Fog for depth */}
          <fog attach="fog" args={['#87CEEB', 5, 15]} />
          
          <Suspense fallback={
            <Html center>
              <div className="tree-loading-3d">Loading tree...</div>
            </Html>
          }>
            <Tree3D visitorCount={totalVisitors} />
          </Suspense>
          
          <OrbitControls 
            enableZoom={true}
            enablePan={true}
            minDistance={2}
            maxDistance={15}
            autoRotate={true}
            autoRotateSpeed={0.5}
            enableDamping
            dampingFactor={0.05}
          />
          
          <Environment preset="park" />
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