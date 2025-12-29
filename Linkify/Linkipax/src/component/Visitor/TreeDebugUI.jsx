import { useState } from "react";

export default function TreeDebugUI() {
  const [x, setX] = useState(0);
  const [y, setY] = useState(-0.4);
  const [z, setZ] = useState(0);
  const [scale, setScale] = useState(0.002);

  return (
    <div style={uiStyle}>
      <h3>🌳 Tree Adjust</h3>

      <Control label="X" value={x} set={setX} step={0.1} />
      <Control label="Y" value={y} set={setY} step={0.1} />
      <Control label="Z" value={z} set={setZ} step={0.1} />
      <Control label="Scale" value={scale} set={setScale} step={0.0005} />
    </div>
  );
}

function Control({ label, value, set, step }) {
  return (
    <div>
      {label}
      <button onClick={() => set(v => v - step)}>-</button>
      {value.toFixed(4)}
      <button onClick={() => set(v => v + step)}>+</button>
    </div>
  );
}

const uiStyle = {
  position: "absolute",
  top: 10,
  left: 10,
  background: "rgba(0,0,0,0.7)",
  color: "#fff",
  padding: 12,
  borderRadius: 6,
  zIndex: 10
};
