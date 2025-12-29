import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import TreeGrowth from "./TreeGrowth";

export default function TreeScene() {
  return (
    <Canvas
      camera={{
        position: [0, 3, 8], // 🔥 farther back
        fov: 35,
        near: 0.1,
        far: 100,
      }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={1} />

      <TreeGrowth />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        maxPolarAngle={Math.PI / 2.2}
      />
      <Environment preset="forest" />
    </Canvas>
  );
}
