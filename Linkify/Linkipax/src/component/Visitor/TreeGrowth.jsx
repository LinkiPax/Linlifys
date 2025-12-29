import { useGLTF } from "@react-three/drei";
import { useEffect, useState } from "react";
import * as THREE from "three";
import axios from "axios";

export default function TreeGrowth() {
  const { scene } = useGLTF("/realistic_trees_collection.glb");
  const [stage, setStage] = useState(0);

  const treeNames = [
    "Tree EZTree1.Bush006",
    "Tree EZTree1.Medium002",
    "Tree EZTree0.Medium011",
    "Tree EZTree0.Medium010",
    "Tree EZTree1.Large001",
    "Tree EZTree0.Large",
    "Tree EZTree1.Large009"
  ];

  // ✅ CENTER THE SCENE
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    scene.position.sub(center); // 🔥 magic line
const size = box.getSize(new THREE.Vector3());
console.log(size);

  }, [scene]);

  // Visitor logic
  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/visitor/visit`).then(res => {
      const count = res.data.count;
      setStage(Math.min(Math.floor(count / 100), treeNames.length - 1));
    });
  }, []);

  // Toggle tree visibility
  useEffect(() => {
    treeNames.forEach((name, i) => {
      const tree = scene.getObjectByName(name);
      if (tree) tree.visible = i === stage;
    });
  }, [stage, scene]);

  return <primitive object={scene} scale={0.05} />
}