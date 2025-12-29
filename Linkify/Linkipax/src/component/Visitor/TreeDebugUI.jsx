export default function TreeDebugUI({ debug, setDebug }) {
  return (
    <div style={ui}>
      <h3>🌳 Tree Debug</h3>

      <button
        onClick={() =>
          setDebug(d => ({ index: Math.max(0, d.index - 1) }))
        }
      >
        ⏮
      </button>

      <span style={{ margin: "0 10px" }}>
        Tree {debug.index}
      </span>

      <button
        onClick={() =>
          setDebug(d => ({ index: Math.min(6, d.index + 1) }))
        }
      >
        ⏭
      </button>
    </div>
  );
}

const ui = {
  position: "absolute",
  top: 10,
  left: 10,
  background: "rgba(0,0,0,0.75)",
  color: "#fff",
  padding: "12px",
  borderRadius: "8px",
  zIndex: 1000,
  fontFamily: "monospace"
};
