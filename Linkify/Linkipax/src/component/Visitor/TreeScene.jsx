import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Grid } from "@react-three/drei";
import TreeGrowth from "./TreeGrowth";

export default function TreeScene({ debug }) {
  return (
    <Canvas
      style={{ width: "100%", height: "100%" }}
      camera={{ position: [0, 5, 15], fov: 35 }}
    >
      <ambientLight intensity={1} />
      <directionalLight position={[10, 10, 10]} />

      <Grid args={[50, 50]} />

      <TreeGrowth debug={debug} />

      <OrbitControls />
      <Environment preset="forest" />
    </Canvas>
  );
}
