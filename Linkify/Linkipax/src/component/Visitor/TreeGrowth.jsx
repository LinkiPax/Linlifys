import { useGLTF } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import axios from "axios";

/** 🔧 FINAL PER-TREE OFFSETS */
const TREE_OFFSETS = {
  0: { x: 0, y: -0.4, z: 0, scale: 0.002 },
  1: { x: -34.1, y: -0.1, z: -1.6, scale: 0.002 },
  2: { x: -24.5, y: -0.1, z: -0.9, scale: 0.002 },
  3: { x: -12.2, y: 0, z: -0.4, scale: 0.002 },
  4: { x: 2, y: 0, z: -0.4, scale: 0.002 },
  5: { x: 16.6, y: 0, z: -0.1, scale: 0.002 },
  6: { x: 37.9, y: 0, z: -0.1, scale: 0.002 }
};

export default function TreeGrowth({ stage, offset }) {
  const { scene } = useGLTF("/realistic_trees_collection.glb");
  const pivotRef = useRef();

  const treeNames = [
    "Tree_EZTree1Bush006",
    "Tree_EZTree1Medium002",
    "Tree_EZTree0Medium011",
    "Tree_EZTree0Medium010",
    "Tree_EZTree1Large001",
    "Tree_EZTree0Large",
    "Tree_EZTree1Large009"
  ];

  /** 🌳 Tree switching */
  useEffect(() => {
    if (!scene) return;

    const root = scene.getObjectByName("RootNode");
    if (!root) return;

    // Hide all
    treeNames.forEach(name => {
      const t = root.getObjectByName(name);
      if (t) t.visible = false;
    });

    const active = root.getObjectByName(treeNames[stage]);
    if (!active) return;

    active.visible = true;

    // Reset
    active.position.set(0, 0, 0);
    active.rotation.set(0, 0, 0);
    active.scale.set(1, 1, 1);

    // Center geometry
    const box = new THREE.Box3().setFromObject(active);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    active.position.sub(center);
    active.position.y += size.y / 2;

    console.log("🌳 Tree:", treeNames[stage], size);
  }, [scene, stage]);

  /** 🔧 Apply offset */
  useEffect(() => {
    if (!pivotRef.current) return;
    pivotRef.current.position.set(offset.x, offset.y, offset.z);
    pivotRef.current.scale.setScalar(offset.scale);
  }, [offset]);

  return (
    <group ref={pivotRef}>
      <primitive object={scene} />
    </group>
  );
}
