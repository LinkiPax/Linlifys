// import { Canvas } from "@react-three/fiber";
// import { OrbitControls, Environment, Grid } from "@react-three/drei";
// import OriginHelper from "./OriginHelper";

// export default function CommonScene({ children }) {
//   return (
//     <Canvas
//       style={{ width: "100%", height: "100%" }}
//       camera={{ position: [0, 5, 15], fov: 35 }}
//     >
//       {/* Lights */}
//       <ambientLight intensity={1} />
//       <directionalLight position={[10, 10, 10]} />

//       {/* ✅ ORIGIN (MUST BE BEFORE CONTENT) */}
//       <OriginHelper size={10} />

//       {/* Grid */}
//       <Grid args={[50, 50]} />

//       {/* Scene Content */}
//       {children}

//       <OrbitControls />
//       <Environment preset="forest" />
//     </Canvas>
//   );
// }
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";

export default function CommonScene({ children }) {
  return (
    <Canvas
      style={{ width: "100%", height: "100%" }}
      camera={{ position: [0, 5, 15], fov: 35 }}
    >
      {/* Lights */}
      <ambientLight intensity={1} />
      <directionalLight position={[10, 10, 10]} />

      {/* Scene Content */}
      {children}

      <OrbitControls />
      <Environment preset="forest" />
    </Canvas>
  );
}
