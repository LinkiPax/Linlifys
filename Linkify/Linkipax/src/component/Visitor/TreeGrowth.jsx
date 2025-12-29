import { useGLTF } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import axios from "axios";

export default function TreeGrowth() {
  const { scene } = useGLTF("/realistic_trees_collection.glb");
  const groupRef = useRef();
  const [stage, setStage] = useState(0);

  // ✅ CORRECT tree names (FROM YOUR LOG)
  const treeNames = [
    "Tree_EZTree1Bush006",
    "Tree_EZTree1Medium002",
    "Tree_EZTree0Medium011",
    "Tree_EZTree0Medium010",
    "Tree_EZTree1Large001",
    "Tree_EZTree0Large",
    "Tree_EZTree1Large009"
  ];

  // 🔹 Fetch visitor count
  useEffect(() => {
    async function fetchVisitors() {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/visitor/visit`
        );
        const count = res.data.count || 0;

        const newStage = Math.min(
          Math.floor(count / 100),
          treeNames.length - 1
        );

        setStage(newStage);
      } catch (err) {
        console.error("Visitor API error", err);
      }
    }

    fetchVisitors();
  }, []);

  // 🔥 SHOW ONE TREE + CENTER IT
  useEffect(() => {
    if (!scene || !groupRef.current) return;

    // 1️⃣ Hide everything
    scene.traverse(obj => {
      obj.visible = false;
    });

    // 2️⃣ Find RootNode
    const rootNode = scene.getObjectByName("RootNode");
    if (!rootNode) {
      console.error("RootNode not found");
      return;
    }

    // 3️⃣ Get active tree
    const activeTree = rootNode.getObjectByName(treeNames[stage]);
    if (!activeTree) {
      console.error("Tree not found:", treeNames[stage]);
      return;
    }

    // 4️⃣ Show tree
    activeTree.visible = true;

    // 5️⃣ Reset transforms
    activeTree.position.set(0, 0, 0);
    activeTree.rotation.set(0, 0, 0);
    activeTree.scale.set(1, 1, 1);

    // 6️⃣ Center ONLY this tree
    const box = new THREE.Box3().setFromObject(activeTree);
    const center = box.getCenter(new THREE.Vector3());
    activeTree.position.sub(center);

    // 7️⃣ Reset group
    groupRef.current.position.set(0, 0, 0);

    // 🧪 Optional debug
    console.log("Showing:", treeNames[stage]);
    console.log("Tree size:", box.getSize(new THREE.Vector3()));
  }, [stage, scene]);

  return (
    <group ref={groupRef} scale={0.3}>
      <primitive object={scene} />
    </group>
  );
}
