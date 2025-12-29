import { useGLTF } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import axios from "axios";

export default function TreeGrowth() {
  const { scene } = useGLTF("/realistic_trees_collection.glb");

  const pivotRef = useRef(); // 🔥 NEW
  const [stage, setStage] = useState(0);

  const treeNames = [
    "Tree_EZTree1Bush006",
    "Tree_EZTree1Medium002",
    "Tree_EZTree0Medium011",
    "Tree_EZTree0Medium010",
    "Tree_EZTree1Large001",
    "Tree_EZTree0Large",
    "Tree_EZTree1Large009"
  ];

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/visitor/visit`)
      .then(res => {
        const count = res.data.count || 0;
        setStage(Math.min(Math.floor(count / 100), treeNames.length - 1));
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!scene || !pivotRef.current) return;

    const rootNode = scene.getObjectByName("RootNode");
    if (!rootNode) return;

    // Hide all trees
    treeNames.forEach(name => {
      const t = rootNode.getObjectByName(name);
      if (t) t.visible = false;
    });

    const tree = rootNode.getObjectByName(treeNames[stage]);
    if (!tree) return;

    tree.visible = true;

    // 🔥 DETACH TREE FROM GLB AND MOVE INTO PIVOT
    pivotRef.current.clear();
    pivotRef.current.add(tree);

    // Reset tree transform
    tree.position.set(0, 0, 0);
    tree.rotation.set(0, 0, 0);
    tree.scale.set(1, 1, 1);

    // Compute bounding box AFTER re-parenting
    const box = new THREE.Box3().setFromObject(tree);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    console.log("📐 Tree size:", size);
    console.log("🎯 Tree center:", center);

    // Center mesh inside pivot
    tree.position.sub(center);
    tree.position.y += size.y / 2;

    // Debug world position
    const worldPos = new THREE.Vector3();
    tree.getWorldPosition(worldPos);
    console.log("🌍 FINAL tree world position:", worldPos);

  }, [stage, scene]);

  return (
    <group ref={pivotRef} scale={0.1} />
  );
}
