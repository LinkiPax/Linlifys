import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import TreeGrowth from "./TreeGrowth";

export default function TreeScene({ debug }) {
  return (
    <Canvas
      style={{
        width: "100vw",
        height: "100vh",
        pointerEvents: "none" // 🔥 THIS FIXES BUTTONS
      }}
      camera={{ position: [0, 5, 15], fov: 35 }}
    >
      <ambientLight intensity={1} />
      <directionalLight position={[10, 10, 10]} />

      <TreeGrowth debug={debug} />

      {/* Controls disabled for debug */}
      <OrbitControls enableZoom={false} enableRotate={false} />
    </Canvas>
  );
}
