import { useState } from "react";
import TreeScene from "./TreeScene";

const INITIAL_OFFSETS = Array(7).fill({
  x: -3576,
  y: 15.5,
  z: -37.5,
  scale: 0.17
});

const STEP = {
  x: 0.5,
  y: 0.5,
  z: 0.5,
  scale: 0.005
};

export default function TreePage() {
  const [index, setIndex] = useState(0);
  const [offsets, setOffsets] = useState(INITIAL_OFFSETS);

  const update = (key, delta) => {
    console.log("CLICK:", key);

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
    <div style={page}>
      {/* 🎥 CANVAS */}
      <TreeScene debug={{ index, offsets }} />

      {/* 🌳 UI OVERLAY */}
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
