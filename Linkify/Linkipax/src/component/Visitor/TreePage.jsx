import { useState } from "react";
import TreeScene from "./TreeScene";

/**
 * ✅ UNIVERSAL WORLD COORDINATES (ONE SOURCE OF TRUTH)
 */
const INITIAL_OFFSETS = [
  { x: -3598,   y: -37.5, z: -37.5, scale: 0.17 },
  { x: -2893.5, y: 138.5, z: -4,    scale: 0.17 },
  { x: -2082.5, y: 87,    z: -4,    scale: 0.17 },
  { x: -1045.5, y: -42.5, z: -4,    scale: 0.17 },
  { x: 186.5,   y: -10.5, z: -4,    scale: 0.17 },
  { x: 1419,    y: -10.5, z: -4,    scale: 0.17 },
  { x: 3232,    y: -10.5, z: -4,    scale: 0.17 }
];

export default function TreePage() {
  // 👉 choose which tree you want to show (0–6)
  const [index] = useState(0);
  const [offsets] = useState(INITIAL_OFFSETS);

  return (
    <div style={page}>
      {/* 🎥 ONLY 3D TREE */}
      <TreeScene debug={{ index, offsets }} />
    </div>
  );
}

const page = {
  width: "100%",
  height: "100%",
  position: "relative"
};
