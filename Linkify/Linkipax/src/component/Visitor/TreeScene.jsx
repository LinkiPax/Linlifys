import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Grid } from "@react-three/drei";
import TreeGrowth from "./TreeGrowth";
import { useState } from "react";

export default function TreeScene() {
  const [stage, setStage] = useState(0);

  const [debugTransform, setDebugTransform] = useState({
    x: 0.1,
    y: -0.4,
    z: 0,
    scale: 0.002
  });

  const [treeInfo, setTreeInfo] = useState(null);

  const update = (key, delta) => {
    setDebugTransform(prev => ({
      ...prev,
      [key]: +(prev[key] + delta).toFixed(3)
    }));
  };

  return (
    <>
      {/* 🧩 DEBUG PANEL */}
      <div style={panelStyle}>
        <h4>🌳 Tree Debug</h4>

        {/* TREE SWITCH */}
        <div style={rowStyle}>
          <button onClick={() => setStage(s => Math.max(s - 1, 0))}>⏮</button>
          <span>Tree {stage}</span>
          <button onClick={() => setStage(s => Math.min(s + 1, 6))}>⏭</button>
        </div>

        <hr />

        {/* POSITION CONTROLS */}
        {["x", "y", "z"].map(axis => (
          <div key={axis} style={rowStyle}>
            <span>{axis.toUpperCase()}</span>
            <button onClick={() => update(axis, -0.1)}>-</button>
            <span>{debugTransform[axis]}</span>
            <button onClick={() => update(axis, 0.1)}>+</button>
          </div>
        ))}

        {/* SCALE */}
        <div style={rowStyle}>
          <span>Scale</span>
          <button onClick={() => update("scale", -0.001)}>-</button>
          <span>{debugTransform.scale}</span>
          <button onClick={() => update("scale", 0.001)}>+</button>
        </div>

        {/* TREE INFO */}
        {treeInfo && (
          <>
            <hr />
            <div style={{ fontSize: 11 }}>
              <div><b>Name:</b> {treeInfo.name}</div>
              <div><b>Size:</b> {treeInfo.size.x.toFixed(1)}, {treeInfo.size.y.toFixed(1)}, {treeInfo.size.z.toFixed(1)}</div>
              <div><b>World Y:</b> {treeInfo.worldPos.y.toFixed(3)}</div>
            </div>
          </>
        )}
      </div>

      {/* 🌍 3D SCENE */}
      <Canvas
        camera={{
          position: [0, 6, 18],
          fov: 40,
          near: 0.1,
          far: 500
        }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 5]} intensity={1.2} />

        <axesHelper args={[10]} />
        <Grid args={[50, 50]} />

        <TreeGrowth
          stage={stage}
          debugTransform={debugTransform}
          onTreeInfo={setTreeInfo}
        />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          target={[0, 3, 0]}
          maxPolarAngle={Math.PI / 2.2}
        />

        <Environment preset="forest" />
      </Canvas>
    </>
  );
}

/* 🎨 STYLES */
const panelStyle = {
  position: "fixed",
  top: 20,
  right: 20,
  background: "#111",
  color: "#fff",
  padding: "12px",
  borderRadius: "8px",
  fontSize: "13px",
  zIndex: 1000,
  width: 220
};

const rowStyle = {
  display: "flex",
  gap: "6px",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "6px"
};
