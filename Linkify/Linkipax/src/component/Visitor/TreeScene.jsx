import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Grid } from "@react-three/drei";
import TreeGrowth from "./TreeGrowth";

export default function TreeScene() {
  return (
    <Canvas
      camera={{
        position: [0, 6, 18],
        fov: 40,
        near: 0.1,
        far: 300
      }}
      style={{ background: "#eaf7ff" }}
    >
      {/* 💡 LIGHT */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} />

      {/* 📐 DEBUG HELPERS */}
      <axesHelper args={[5]} />
      <Grid args={[40, 40]} />

      {/* 🌳 TREE */}
      <TreeGrowth />

      {/* 🎥 CAMERA */}
      <OrbitControls target={[0, 3, 0]} maxPolarAngle={Math.PI / 2.2} />

      <Environment preset="forest" />
    </Canvas>
  );
}
