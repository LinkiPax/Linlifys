export default function TreeDebugUI({
  stage,
  setStage,
  offset,
  setOffset,
  maxStage,
  treeName
}) {
  const adjust = (key, delta) => {
    setOffset(prev => ({
      ...prev,
      [key]: Number((prev[key] + delta).toFixed(4))
    }));
  };

  return (
    <div style={uiStyle}>
      <h3>🌳 Tree Debug</h3>

      <div style={{ marginBottom: 8 }}>
        <button onClick={() => setStage(s => Math.max(0, s - 1))}>⏮</button>
        <b style={{ margin: "0 10px" }}>Tree {stage}</b>
        <button onClick={() => setStage(s => Math.min(maxStage, s + 1))}>⏭</button>
      </div>

      {["x", "y", "z"].map(k => (
        <div key={k}>
          {k.toUpperCase()}
          <button onClick={() => adjust(k, -0.1)}>-</button>
          {offset[k]}
          <button onClick={() => adjust(k, 0.1)}>+</button>
        </div>
      ))}

      <div>
        Scale
        <button onClick={() => adjust("scale", -0.0005)}>-</button>
        {offset.scale}
        <button onClick={() => adjust("scale", 0.0005)}>+</button>
      </div>

      <div style={{ fontSize: 11, opacity: 0.8 }}>
        {treeName}
      </div>
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
  fontSize: 13,
  borderRadius: 6,
  zIndex: 10
};
