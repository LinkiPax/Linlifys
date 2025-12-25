import { Canvas } from "@react-three/fiber";
import TreeDebug from "./TreeDebug";

export default function TestPage() {
  return (
    <Canvas camera={{ position: [0, 2, 5] }}>
      <ambientLight intensity={1} />
      <TreeDebug />
    </Canvas>
  );
}
