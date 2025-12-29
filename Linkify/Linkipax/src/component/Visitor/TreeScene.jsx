import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import TreeGrowth from "./TreeGrowth";

export default function TreeScene() {
  return (
    <Canvas camera={{ position: [0, 2, 6], fov: 45 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={1} />

      <TreeGrowth />

      <OrbitControls enableZoom={false} />
      <Environment preset="forest" />
    </Canvas>
  );
}
