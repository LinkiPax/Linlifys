import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Grid } from "@react-three/drei";
import { useEffect, useState } from "react";
import axios from "axios";
import TreeGrowth from "./TreeGrowth";
import TreeDebugUI from "./TreeDebugUI";

const TREE_OFFSETS = {
  0: { x: 0, y: -0.4, z: 0, scale: 0.002 },
  1: { x: -34.1, y: -0.1, z: -1.6, scale: 0.002 },
  2: { x: -24.5, y: -0.1, z: -0.9, scale: 0.002 },
  3: { x: -12.2, y: 0, z: -0.4, scale: 0.002 },
  4: { x: 2, y: 0, z: -0.4, scale: 0.002 },
  5: { x: 16.6, y: 0, z: -0.1, scale: 0.002 },
  6: { x: 37.9, y: 0, z: -0.1, scale: 0.002 }
};

const TREE_NAMES = [
  "Tree_EZTree1Bush006",
  "Tree_EZTree1Medium002",
  "Tree_EZTree0Medium011",
  "Tree_EZTree0Medium010",
  "Tree_EZTree1Large001",
  "Tree_EZTree0Large",
  "Tree_EZTree1Large009"
];

export default function TreeScene() {
  const [stage, setStage] = useState(0);
  const [offset, setOffset] = useState(TREE_OFFSETS[0]);

  /** 🌐 Visitor-based growth */
  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/visitor/visit`)
      .then(res => {
        const count = res.data.count || 0;
        const s = Math.min(Math.floor(count / 100), TREE_NAMES.length - 1);
        setStage(s);
        setOffset(TREE_OFFSETS[s]);
      })
      .catch(console.error);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      
      {/* ✅ HTML UI */}
      <TreeDebugUI
        stage={stage}
        setStage={setStage}
        offset={offset}
        setOffset={setOffset}
        maxStage={TREE_NAMES.length - 1}
        treeName={TREE_NAMES[stage]}
      />

      {/* 🎮 THREE CANVAS */}
      <Canvas
        camera={{ position: [0, 6, 18], fov: 40 }}
        style={{ background: "#eaf7ff" }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 5]} intensity={1.2} />

        <axesHelper args={[5]} />
        <Grid args={[40, 40]} />

        <TreeGrowth stage={stage} offset={offset} />

        <OrbitControls target={[0, 3, 0]} maxPolarAngle={Math.PI / 2.2} />
        <Environment preset="forest" />
      </Canvas>
    </div>
  );
}
