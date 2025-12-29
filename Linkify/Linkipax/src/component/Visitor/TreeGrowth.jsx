import { useGLTF } from "@react-three/drei";
import { useEffect } from "react";
import * as THREE from "three";

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

    const root = scene.getObjectByName("RootNode");
    if (!root) return;

    NAMES.forEach(n => {
      const t = root.getObjectByName(n);
      if (t) t.visible = false;
    });

    const name = NAMES[debug.index];
    const cfg = debug.offsets[debug.index];
    const tree = root.getObjectByName(name);
    if (!tree) return;

    tree.visible = true;

    const box = new THREE.Box3().setFromObject(tree);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    tree.scale.setScalar(cfg.scale);

    tree.position.set(
      -center.x * cfg.scale + cfg.x,
      -center.y * cfg.scale + (size.y * cfg.scale) / 2 + cfg.y,
      -center.z * cfg.scale + cfg.z
    );

    console.log("🌳 TREE DEBUG", name, cfg);

  }, [scene, debug]);

  return <primitive object={scene} />;
}
