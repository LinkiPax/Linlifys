import { useGLTF } from "@react-three/drei";
import { useEffect } from "react";

const NAMES = [
  "Tree_EZTree1Bush006",
  "Tree_EZTree1Medium002",
  "Tree_EZTree0Medium011",
  "Tree_EZTree0Medium010",
  "Tree_EZTree1Large001",
  "Tree_EZTree0Large",
  "Tree_EZTree1Large009"
];

export default function TreeGrowth({ debug }) {
  const { scene } = useGLTF("/realistic_trees_collection.glb");

  useEffect(() => {
    if (!scene) return;

    // ✅ CRITICAL: USE ROOT NODE
    const root = scene.getObjectByName("RootNode");

    if (!root) {
      console.error("❌ RootNode NOT FOUND");
      return;
    }

    // 🔍 DEBUG ONCE
    console.log(
      "AVAILABLE OBJECTS:",
      root.children.map(o => o.name)
    );

    // Hide all trees
    root.children.forEach(obj => {
      obj.visible = false;
    });

    const name = NAMES[debug.index];
    const tree = root.getObjectByName(name);

    if (!tree) {
      console.error("❌ TREE NOT FOUND:", name);
      return;
    }

    const cfg = debug.offsets[debug.index];

    tree.visible = true;
    tree.position.set(cfg.x, cfg.y, cfg.z);
    tree.scale.setScalar(cfg.scale);

    tree.updateMatrixWorld(true);

    console.log("🌳 TREE SHOWN:", name, cfg);
  }, [scene, debug.index, debug.offsets]);

  return <primitive object={scene} />;
}

useGLTF.preload("/realistic_trees_collection.glb");
