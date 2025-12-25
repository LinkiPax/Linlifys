import { Canvas } from "@react-three/fiber";
import TreeModel from "./TreeModel";

export default function Tree3D({ stage }) {
  return (
    <Canvas camera={{ position: [0, 2, 5] }}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 5, 5]} />
      <TreeModel stage={stage} />
    </Canvas>
  );
}
