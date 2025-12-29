import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
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
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} />

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
