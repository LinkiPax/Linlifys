import { useState } from "react";
import TreeScene from "./TreeScene";

const INITIAL_OFFSETS = [
  { x: -10.5, y: -0.4, z: -0.9, scale: 0.002 },
  { x: -34.1, y: -0.1, z: -1.6, scale: 0.002 },
  { x: -24.5, y: -0.1, z: -0.9, scale: 0.002 },
  { x: -12.2, y: 0, z: 0.4, scale: 0.002 },
  { x: 2, y: 0, z: 0.4, scale: 0.002 },
  { x: 16.6, y: 0, z: -0.1, scale: 0.002 },
  { x: 37.9, y: 0, z: -0.1, scale: 0.002 }
];

export default function TreePage() {
  const [index, setIndex] = useState(0);
  const [offsets, setOffsets] = useState(INITIAL_OFFSETS);

  const update = (key, delta) => {
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
      {/* 🌳 DEBUG UI (HTML) */}
      <div style={ui}>
        <h3>🌳 Tree Debug</h3>

        <button onClick={() => setIndex(i => Math.max(0, i - 1))}>⏮</button>
        <span style={{ margin: "0 8px" }}>Tree {index}</span>
        <button onClick={() => setIndex(i => Math.min(6, i + 1))}>⏭</button>

        {["x", "y", "z", "scale"].map(k => (
          <div key={k}>
            {k.toUpperCase()} :
            <button onClick={() => update(k, -0.1)}>-</button>
            <span>{offsets[index][k]}</span>
            <button onClick={() => update(k, 0.1)}>+</button>
          </div>
        ))}
      </div>

      {/* 🎥 3D SCENE */}
      <TreeScene debug={{ index, offsets }} />
    </>
  );
}

const ui = {
  position: "absolute",
  top: 10,
  left: 10,
  background: "rgba(0,0,0,0.75)",
  color: "#fff",
  padding: 12,
  borderRadius: 8,
  fontFamily: "monospace",
  zIndex: 1000
};
