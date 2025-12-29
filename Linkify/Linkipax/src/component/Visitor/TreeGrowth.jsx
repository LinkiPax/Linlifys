import { useGLTF } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import axios from "axios";

export default function TreeGrowth() {
  const { scene } = useGLTF("/realistic_trees_collection.glb");
  const groupRef = useRef();
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

  // 🔹 Fetch visitor count
  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/visitor/visit`)
      .then(res => {
        const count = res.data.count || 0;
        const newStage = Math.min(Math.floor(count / 100), treeNames.length - 1);
        console.log("Visitor count:", count, "→ stage:", newStage);
        setStage(newStage);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!scene) {
      console.warn("❌ Scene not loaded yet");
      return;
    }

    console.log("✅ Scene loaded:", scene);

    const rootNode = scene.getObjectByName("RootNode");
    if (!rootNode) {
      console.error("❌ RootNode NOT FOUND");
      return;
    }

    console.log("✅ RootNode found:", rootNode);
    console.log(
      "🌲 Available trees:",
      rootNode.children.map(c => c.name)
    );

    // Hide only tree siblings
    treeNames.forEach(name => {
      const t = rootNode.getObjectByName(name);
      if (t) t.visible = false;
    });

    const activeTree = rootNode.getObjectByName(treeNames[stage]);
    if (!activeTree) {
      console.error("❌ Active tree NOT FOUND:", treeNames[stage]);
      return;
    }

    activeTree.visible = true;

    console.log("🌳 Showing tree:", activeTree.name);
    console.log("Local position (before):", activeTree.position);
    console.log("Local rotation:", activeTree.rotation);
    console.log("Local scale:", activeTree.scale);

    // Bounding box
    const box = new THREE.Box3().setFromObject(activeTree);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    console.log("📦 Tree bounding box:", box);
    console.log("📐 Tree size:", size);
    console.log("🎯 Tree center:", center);

    // Center tree
    activeTree.position.sub(center);
    activeTree.position.y += size.y / 2;

    // WORLD POSITION CHECK
    const worldPos = new THREE.Vector3();
    activeTree.getWorldPosition(worldPos);
    console.log("🌍 Tree WORLD position:", worldPos);

    // Bounding box corners (important!)
    console.log("📦 BB min:", box.min);
    console.log("📦 BB max:", box.max);

  }, [stage, scene]);

  return (
    <group ref={groupRef} scale={0.1}>
      <primitive object={scene} />
    </group>
  );
}
