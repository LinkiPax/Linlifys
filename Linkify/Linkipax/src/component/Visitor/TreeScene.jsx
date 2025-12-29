import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Grid } from "@react-three/drei";
import TreeGrowth from "./TreeGrowth";

export default function TreeScene({ debug }) {
  return (
    <Canvas
  camera={{
    position: [0, 4, 10],
    fov: 30,
    near: 0.1,
    far: 100
  }}
>
  <ambientLight intensity={0.7} />
  <directionalLight position={[5, 10, 5]} intensity={1.2} />

  <Grid args={[20, 20]} />
  <TreeGrowth debug={debug} />

  <OrbitControls
    target={[0, 1.2, 0]}
    enablePan={false}
  />

  <Environment preset="forest" />
</Canvas>

  );
}
