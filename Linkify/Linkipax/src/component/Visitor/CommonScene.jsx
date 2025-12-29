import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Grid } from "@react-three/drei";
import OriginHelper from "./OriginHelper";

export default function CommonScene({ children }) {
  return (
    <Canvas
      style={{ width: "100%", height: "100%" }}
      camera={{ position: [0, 5, 15], fov: 35 }}
    >
      {/* Lights */}
      <ambientLight intensity={1} />
      <directionalLight position={[10, 10, 10]} />

      {/* Helpers */}
      <OriginHelper size={5} />
      <Grid args={[50, 50]} />

      {/* Scene Content */}
      {children}

      {/* Controls */}
      <OrbitControls />
      <Environment preset="forest" />
    </Canvas>
  );
}
