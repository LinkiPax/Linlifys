// TreeComponent.jsx (original with minimal changes)
import React, { useEffect, useState, Suspense } from "react";
import getDeviceId from "./getDeviceId";
import getTreeStage from "./getTreeStage";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
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
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <Suspense fallback={null}>
            <Tree3D stage={treeStage} />
          </Suspense>
          <Environment preset="sunset" />
        </Canvas>
      </div>

      <div className="tree-stats">
        <p>🌲 Trees grown: <strong>{totalVisitors}</strong></p>
        <p>🌿 Stage: <strong>{treeStage.replace("-", " ")}</strong></p>
      </div>
    </div>
  );
};

export default TreeComponent;