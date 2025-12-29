import { useState } from "react";
import TreeScene from "./TreeScene";

/**
 * ✅ UNIVERSAL WORLD COORDINATES (ONE SOURCE OF TRUTH)
 * Each tree has its OWN object (no shared reference)
 */
const INITIAL_OFFSETS = [
  { x: -3598,   y: 36,   z: -37.5, scale: 0.17 }, // Tree 0
  { x: -2893.5, y: 138.5, z: -4,   scale: 0.17 }, // Tree 1
  { x: -2283.5, y: 15,   z: -4,   scale: 0.17 }, // Tree 2
  { x: -1893.5, y: 138.5, z: -4,   scale: 0.17 }, // Tree 3
  { x: -1293.5, y: 138.5, z: -4,   scale: 0.17 }, // Tree 4
  { x: -1193.5, y: 138.5, z: -4,   scale: 0.17 }, // Tree 5
  { x: -1093.5, y: 138.5, z: -4,   scale: 0.17 }  // Tree 6
];

const STEP = {
  x: 0.5,
  y: 0.5,
  z: 0.5,
  scale: 0.005
};

export default function TreePage() {
  const [index, setIndex] = useState(0);
  const [offsets, setOffsets] = useState(INITIAL_OFFSETS);

  /**
   * ✅ SAFE UPDATE
   * - No shared reference
   * - No negative scale
   */
  const update = (key, delta) => {
    setOffsets(prev => {
      const copy = prev.map(o => ({ ...o }));

      let nextValue = +(copy[index][key] + delta).toFixed(4);

      // ❌ block invalid scale
      if (key === "scale") {
        nextValue = Math.max(0.001, nextValue);
      }

      copy[index][key] = nextValue;
      return copy;
    });
  };

  return (
    <div style={page}>
      {/* 🎥 3D CANVAS */}
      <TreeScene debug={{ index, offsets }} />

      {/* 🌳 DEBUG UI */}
      <div style={ui}>
        <h3>🌳 Tree Debug</h3>

        <button onClick={() => setIndex(i => Math.max(0, i - 1))}>⏮</button>
        <span style={{ margin: "0 8px" }}>Tree {index}</span>
        <button onClick={() => setIndex(i => Math.min(6, i + 1))}>⏭</button>

        {["x", "y", "z", "scale"].map(k => (
          <div key={k}>
            {k.toUpperCase()} :
            <button onClick={() => update(k, -STEP[k])}>-</button>
            <span style={{ margin: "0 6px" }}>
              {offsets[index][k]}
            </span>
            <button onClick={() => update(k, STEP[k])}>+</button>
          </div>
        ))}
      </div>
    </div>
  );
}

const page = {
  width: "100vw",
  height: "100vh",
  position: "relative"
};

const ui = {
  position: "absolute",
  top: 10,
  left: 10,
  background: "rgba(0,0,0,0.85)",
  color: "#fff",
  padding: 12,
  borderRadius: 8,
  fontFamily: "monospace",
  zIndex: 10
};
