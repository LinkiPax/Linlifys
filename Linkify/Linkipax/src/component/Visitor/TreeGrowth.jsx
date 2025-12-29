import { useGLTF } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import axios from "axios";

/** 🔧 FINAL PER-TREE OFFSETS (YOU TUNED THESE) */
const TREE_OFFSETS = {
  0: { x: 0, y: -0.4, z: 0, scale: 0.002 },
  1: { x: -34.1, y: -0.1, z: -1.6, scale: 0.002 },
  2: { x: -24.5, y: -0.1, z: -0.9, scale: 0.002 },
  3: { x: -12.2, y: 0, z: -0.4, scale: 0.002 },
  4: { x: 2, y: 0, z: -0.4, scale: 0.002 },
  5: { x: 16.6, y: 0, z: -0.1, scale: 0.002 },
  6: { x: 37.9, y: 0, z: -0.1, scale: 0.002 }
};

export default function TreeGrowth() {
  const { scene } = useGLTF("/realistic_trees_collection.glb");

  const pivotRef = useRef(); // 🔥 THIS is what buttons control
  const [stage, setStage] = useState(0);
  const [offset, setOffset] = useState(TREE_OFFSETS[0]);

  const treeNames = [
    "Tree_EZTree1Bush006",
    "Tree_EZTree1Medium002",
    "Tree_EZTree0Medium011",
    "Tree_EZTree0Medium010",
    "Tree_EZTree1Large001",
    "Tree_EZTree0Large",
    "Tree_EZTree1Large009"
  ];

  /** 🌐 Visitor count → stage */
  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/visitor/visit`)
      .then(res => {
        const count = res.data.count || 0;
        const s = Math.min(Math.floor(count / 100), treeNames.length - 1);
        setStage(s);
        setOffset(TREE_OFFSETS[s]);
      })
      .catch(console.error);
  }, []);

  /** 🌳 Tree switching + centering */
  useEffect(() => {
    if (!scene) return;

    const root = scene.getObjectByName("RootNode");
    if (!root) return;

    console.log("🌲 Available trees:", root.children.map(c => c.name));

    // Hide all trees
    treeNames.forEach(n => {
      const t = root.getObjectByName(n);
      if (t) t.visible = false;
    });

    const active = root.getObjectByName(treeNames[stage]);
    if (!active) return;

    active.visible = true;

    // 🔥 Reset transforms
    active.position.set(0, 0, 0);
    active.rotation.set(0, 0, 0);
    active.scale.set(1, 1, 1);

    // 🔥 Center geometry
    const box = new THREE.Box3().setFromObject(active);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    active.position.sub(center);
    active.position.y += size.y / 2;

    console.log("🌳 TREE DEBUG");
    console.log("Index:", stage);
    console.log("Name:", treeNames[stage]);
    console.log("Size:", size);
    console.log("Center:", center);

  }, [stage, scene]);

  /** 🔧 Apply live offset (BUTTON CONTROLLED) */
  useEffect(() => {
    if (!pivotRef.current) return;

    pivotRef.current.position.set(offset.x, offset.y, offset.z);
    pivotRef.current.scale.setScalar(offset.scale);

    console.log("🌍 FINAL tree world position:", pivotRef.current.position);
  }, [offset]);

  /** ➕➖ Helper */
  const adjust = (key, delta) => {
    setOffset(prev => ({
      ...prev,
      [key]: Number((prev[key] + delta).toFixed(4))
    }));
  };

  return (
    <>
      {/* 🌳 TREE */}
      <group ref={pivotRef}>
        <primitive object={scene} />
      </group>

      {/* 🧪 DEBUG UI */}
      <div style={uiStyle}>
        <h3>🌳 Tree Debug</h3>

        <div>
          <button onClick={() => setStage(s => Math.max(0, s - 1))}>⏮</button>
          <b style={{ margin: "0 10px" }}>Tree {stage}</b>
          <button onClick={() => setStage(s => Math.min(treeNames.length - 1, s + 1))}>⏭</button>
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

        <div style={{ fontSize: 12, opacity: 0.8 }}>
          Name: {treeNames[stage]}
        </div>
      </div>
    </>
  );
}

/** 🎨 UI STYLE */
const uiStyle = {
  position: "absolute",
  top: 10,
  left: 10,
  background: "rgba(0,0,0,0.65)",
  color: "#fff",
  padding: 12,
  fontSize: 13,
  borderRadius: 6
};
