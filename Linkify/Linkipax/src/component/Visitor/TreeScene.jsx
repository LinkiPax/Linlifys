import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Grid } from "@react-three/drei";
import TreeGrowth from "./TreeGrowth";

export default function TreeScene() {
  return (
    <Canvas
      camera={{
        position: [0, 2.5, 6],
        fov: 32,
        near: 0.1,
        far: 50
      }}
      style={{ background: "#eaf7ff" }}
    >
      {/* 🌍 LIGHTING */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} />

      {/* 🧭 AXES HELPER (X=RED, Y=GREEN, Z=BLUE) */}
      <axesHelper args={[5]} />

      {/* 📐 GRID HELPER (ground reference) */}
      <Grid
        args={[20, 20]}
        cellSize={1}
        cellThickness={1}
        sectionSize={5}
        sectionThickness={1.5}
        fadeDistance={30}
      />

      {/* 🌳 TREE */}
      <TreeGrowth />

      {/* 🎥 CAMERA CONTROL */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        maxPolarAngle={Math.PI / 2.2}
        target={[0, 1, 0]} // 🔥 IMPORTANT
      />

      <Environment preset="forest" />
    </Canvas>
  );
}
