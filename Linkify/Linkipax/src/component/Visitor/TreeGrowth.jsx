import { useGLTF } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import axios from "axios";

export default function TreeGrowth() {
  const { scene } = useGLTF("/realistic_trees_collection.glb");
  const groupRef = useRef();
  const [stage, setStage] = useState(0);

  // ✅ Correct names (from your log)
  const treeNames = [
    "Tree_EZTree1Bush006",
    "Tree_EZTree1Medium002",
    "Tree_EZTree0Medium011",
    "Tree_EZTree0Medium010",
    "Tree_EZTree1Large001",
    "Tree_EZTree0Large",
    "Tree_EZTree1Large009"
  ];

  // Fetch visitor count
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
    if (!scene || !groupRef.current) return;

    // 1️⃣ Find RootNode
    const rootNode = scene.getObjectByName("RootNode");
    if (!rootNode) {
      console.error("RootNode not found");
      return;
    }

    // 2️⃣ Hide ONLY tree siblings (NOT parents)
    treeNames.forEach(name => {
      const t = rootNode.getObjectByName(name);
      if (t) t.visible = false;
    });

    // 3️⃣ Get active tree
    const activeTree = rootNode.getObjectByName(treeNames[stage]);
    if (!activeTree) {
      console.error("Tree not found:", treeNames[stage]);
      return;
    }

    // 4️⃣ Show it
    activeTree.visible = true;

    // 5️⃣ FIX ROTATION (very important)
    activeTree.rotation.set(-Math.PI / 2, 0, 0); // stand upright

    // 6️⃣ Center ONLY this tree
    const box = new THREE.Box3().setFromObject(activeTree);
    const center = box.getCenter(new THREE.Vector3());
    activeTree.position.sub(center);

    // 7️⃣ Reset group
    groupRef.current.position.set(0, 0, 0);

    console.log("Showing tree:", treeNames[stage]);
    console.log("Tree size:", box.getSize(new THREE.Vector3()));
  }, [stage, scene]);

  return (
    <group ref={groupRef}>
      {/* ⚠️ DO NOT SCALE AGAIN */}
      <primitive object={scene} />
    </group>
  );
}
