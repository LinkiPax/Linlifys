// import { useEffect, useState } from "react";
// import TreeScene from "./TreeScene";
// import { registerVisit } from "./visitor";

// /**
//  * ❌ DO NOT TOUCH COORDINATES
//  */
// const INITIAL_OFFSETS = [
//   { x: -3598,   y: -37.5, z: -37.5, scale: 0.17 },
//   { x: -2893.5, y: 138.5, z: -4,    scale: 0.17 },
//   { x: -2082.5, y: 87,    z: -4,    scale: 0.17 },
//   { x: -1045.5, y: -42.5, z: -4,    scale: 0.17 },
//   { x: 186.5,   y: -10.5, z: -4,    scale: 0.17 },
//   { x: 1419,    y: -10.5, z: -4,    scale: 0.17 },
//   { x: 3232,    y: -10.5, z: -4,    scale: 0.17 }
// ];

// export default function TreePage() {
//   const [index, setIndex] = useState(0);
//   const [offsets] = useState(INITIAL_OFFSETS);

//   useEffect(() => {
//     async function track() {
//       try {
//         const { totalVisitors } = await registerVisit();

//         /**
//          * 🌱 Map visitors → tree index
//          * 1–10    → 0
//          * 11–20   → 1
//          * 21–30   → 2
//          * ...
//          */
//         const growthIndex = Math.min(
//           Math.floor((totalVisitors - 1) / 10),
//           6
//         );

//         setIndex(growthIndex);
//       } catch (err) {
//         console.error("Visitor tracking failed", err);
//       }
//     }

//     track();
//   }, []);

//   return (
//     <div style={page}>
//       <TreeScene debug={{ index, offsets }} />
//     </div>
//   );
// }

// const page = {
//   width: "100%",
//   height: "100%",
//   position: "relative"
// };
import { useEffect, useState } from "react";
import TreeScene from "./TreeScene";
import { registerVisit } from "./visitor";

const INITIAL_OFFSETS = [
  { x: -3598,   y: -37.5, z: -37.5, scale: 0.17 },
  { x: -2893.5, y: 138.5, z: -60,    scale: 0.17 },
  { x: -2082.5, y: 87,    z: -12,    scale: 0.17 },
  { x: -1045.5, y: -42.5, z: -12,    scale: 0.17 },
  { x: 186.5,   y: -10.5, z: -12,    scale: 0.17 },
  { x: 1419,    y: -10.5, z: -12,    scale: 0.17 },
  { x: 3232,    y: -10.5, z: -12,    scale: 0.17 }
];

export default function TreePage() {
  const [index, setIndex] = useState(0);
  const [offsets] = useState(INITIAL_OFFSETS);
  const [visitorCount, setVisitorCount] = useState(0);

  useEffect(() => {
  async function track() {
    const { totalVisitors } = await registerVisit();

    const growthIndex = Math.min(
      Math.floor((totalVisitors - 1) / 10),
      6
    );

    setIndex(growthIndex);

    // ⏱️ Stopwatch-style counter
    let current = 0;
    const interval = setInterval(() => {
      current++;
      setVisitorCount(current);

      if (current >= totalVisitors) {
        clearInterval(interval);
      }
    }, 40); // speed (ms)
  }

  track();
}, []);
  return (
    <div style={page}>
      {/* 🌳 3D Canvas */}
      <div className="tree-wrapper">
        <TreeScene debug={{ index, offsets }} />
      </div>
    </div>
  );
}

const page = {
  width: "100%",
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column"
};

const canvasWrapper = {
  width: "100%",
  height: "80vh" // 🔥 increase this (80–90vh recommended)
};

const counter = {
  marginTop: "10px",
  padding: "14px",
  fontSize: "22px",
  fontWeight: "700",
  textAlign: "center",
  letterSpacing: "1px",
  color: "#b6ffcc",
  background: "radial-gradient(circle at top, #062f1a, #020d07)",
  borderRadius: "12px",
  textShadow: `
    0 0 5px #6bff9e,
    0 0 10px #6bff9e,
    0 0 20px #4cff8a,
    0 0 40px #2aff6d
  `,
  boxShadow: `
    inset 0 0 20px rgba(80, 255, 150, 0.2),
    0 0 25px rgba(80, 255, 150, 0.4)
  `,
  animation: "pulseGlow 2s infinite ease-in-out"
};

