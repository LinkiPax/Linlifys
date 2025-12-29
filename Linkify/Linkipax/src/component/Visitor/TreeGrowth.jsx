import { useGLTF } from "@react-three/drei";
import { useEffect, useState } from "react";
import axios from "axios";

export default function TreeGrowth() {
  const { scene } = useGLTF("/realistic_trees_collection.glb");

  const [stage, setStage] = useState(0);

  // 🔹 Tree root names in correct order
  const treeNames = [
    "Tree EZTree1.Bush006",
    "Tree EZTree1.Medium002",
    "Tree EZTree0.Medium011",
    "Tree EZTree0.Medium010",
    "Tree EZTree1.Large001",
    "Tree EZTree0.Large",
    "Tree EZTree1.Large009"
  ];

  // Fetch visitor count
  useEffect(() => {
    async function fetchVisitors() {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/visitor/visit`);
      const count = res.data.count;

      // example mapping
      const newStage = Math.min(
        Math.floor(count / 100),
        treeNames.length - 1
      );

      setStage(newStage);
    }

    fetchVisitors();
  }, []);

  // Toggle visibility
  useEffect(() => {
    treeNames.forEach((name, index) => {
      const tree = scene.getObjectByName(name);
      if (tree) tree.visible = index === stage;
    });
  }, [stage, scene]);

  return <primitive object={scene} scale={1.2} />;
}
