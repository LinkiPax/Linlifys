import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, Grid } from "@react-three/drei";
import TreeGrowth from "./TreeGrowth";
import { useEffect } from "react";

function CameraDebugger() {
  const { camera } = useThree();

  useEffect(() => {
    console.log("🎥 Camera position:", camera.position);
    console.log("🎥 Camera rotation:", camera.rotation);
  }, [camera]);

  return null;
}

export default function TreeScene() {
  return (
    <Canvas
      camera={{
        position: [0, 6, 18],
        fov: 40,
        near: 0.1,
        far: 200
      }}
    >
      <CameraDebugger />

      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} />

      <axesHelper args={[10]} />
      <Grid
        args={[20, 20]}
        cellSize={1}
        cellThickness={1}
        sectionSize={5}
        sectionThickness={1.5}
        fadeDistance={30}
      />

      <TreeGrowth />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        target={[0, 3, 0]}
        maxPolarAngle={Math.PI / 2.2}
      />

      <Environment preset="forest" />
    </Canvas>
  );
}
