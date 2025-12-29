import { useGLTF } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import axios from "axios";

export default function TreeGrowth() {
  const { scene } = useGLTF("/realistic_trees_collection.glb");
  const groupRef = useRef();

  const [stage, setStage] = useState(0);

  // 🔹 EXACT tree root names (order matters)
  const treeNames = [
    "Tree EZTree1.Bush006",
    "Tree EZTree1.Medium002",
    "Tree EZTree0.Medium011",
    "Tree EZTree0.Medium010",
    "Tree EZTree1.Large001",
    "Tree EZTree0.Large",
    "Tree EZTree1.Large009"
  ];

  // 🔹 Fetch visitor count
  useEffect(() => {
    async function fetchVisitors() {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/visitor/visit`); // your backend
        const count = res.data.count || 0;

        // map visits → stage
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

  // 🔥 CORE FIX: show ONLY ONE TREE & CENTER IT
  useEffect(() => {
    if (!scene || !groupRef.current) return;

    // Hide EVERYTHING
    scene.traverse(obj => {
      obj.visible = false;
    });

    const activeTree = scene.getObjectByName(treeNames[stage]);
    if (!activeTree) return;

    activeTree.visible = true;

    // Reset transforms (important)
    activeTree.position.set(0, 0, 0);
    activeTree.rotation.set(0, 0, 0);
    activeTree.scale.set(1, 1, 1);

    // 🔥 Center ONLY the active tree
    const box = new THREE.Box3().setFromObject(activeTree);
    const center = box.getCenter(new THREE.Vector3());

    activeTree.position.sub(center);

    // Reset group
    groupRef.current.position.set(0, 0, 0);
  }, [stage, scene]);

  return (
    <group ref={groupRef} scale={0.3}>
      <primitive object={scene} />
    </group>
  );
}
