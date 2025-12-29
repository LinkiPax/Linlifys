import { useState } from "react";
import TreeScene from "./TreeScene";

const INITIAL_OFFSETS = [
  { x: 0, y: 0, z: 0, scale: 0.01 },
  { x: 0, y: 0, z: 0, scale: 0.01 },
  { x: 0, y: 0, z: 0, scale: 0.01 },
  { x: 0, y: 0, z: 0, scale: 0.01 },
  { x: 0, y: 0, z: 0, scale: 0.01 },
  { x: 0, y: 0, z: 0, scale: 0.01 },
  { x: 0, y: 0, z: 0, scale: 0.01 }
];

// BIG STEPS (NO CONFUSION)
const STEP = {
  x: 1,
  y: 1,
  z: 1,
  scale: 0.005
};

export default function TreePage() {
  const [index, setIndex] = useState(0);
  const [offsets, setOffsets] = useState(INITIAL_OFFSETS);

  const update = (key, delta) => {
    console.log("BUTTON CLICK:", key, delta); // 🔥 PROOF

    setOffsets(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [key]: +(copy[index][key] + delta).toFixed(4)
      };
      return copy;
    });
  };

  return (
    <>
      {/* 🔥 UI MUST ALLOW CLICKS */}
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

      <TreeScene debug={{ index, offsets }} />
    </>
  );
}

const ui = {
  position: "absolute",
  top: 10,
  left: 10,
  background: "rgba(0,0,0,0.85)",
  color: "#fff",
  padding: 12,
  borderRadius: 8,
  fontFamily: "monospace",
  zIndex: 9999,
  pointerEvents: "auto" // 🔥 REQUIRED
};
