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

    const root = scene;

    root.children.forEach(o => (o.visible = false));

    const tree = root.getObjectByName(NAMES[debug.index]);
    if (!tree) return;

    tree.visible = true;

    const cfg = debug.offsets[debug.index];

    tree.position.set(cfg.x, cfg.y, cfg.z);
    tree.scale.setScalar(cfg.scale);

    tree.updateMatrixWorld(true);

    console.log("TREE UPDATED", cfg);
  }, [scene, debug.index, debug.offsets]);

  return <primitive object={scene} />;
}
