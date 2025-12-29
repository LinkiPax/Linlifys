import { useEffect, useState } from "react";
import TreeScene from "./TreeScene";
import { registerVisit } from "./visitor";

/**
 * ❌ DO NOT TOUCH COORDINATES
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
  const [index, setIndex] = useState(0);
  const [offsets] = useState(INITIAL_OFFSETS);

  useEffect(() => {
    async function track() {
      try {
        const { totalVisitors } = await registerVisit();

        /**
         * 🌱 Map visitors → tree index
         * 1–10    → 0
         * 11–20   → 1
         * 21–30   → 2
         * ...
         */
        const growthIndex = Math.min(
          Math.floor((totalVisitors - 1) / 10),
          6
        );

        setIndex(growthIndex);
      } catch (err) {
        console.error("Visitor tracking failed", err);
      }
    }

    track();
  }, []);

  return (
    <div style={page}>
      <TreeScene debug={{ index, offsets }} />
    </div>
  );
}

const page = {
  width: "100%",
  height: "100%",
  position: "relative"
};
