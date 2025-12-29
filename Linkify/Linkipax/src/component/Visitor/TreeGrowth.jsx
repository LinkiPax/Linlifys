import { useGLTF } from "@react-three/drei";
import { useEffect } from "react";
import * as THREE from "three";

const TREES = [
  {
    name: "Tree_EZTree1Bush006",
    x: -10.5,
    y: -0.4,
    z: 0,
    scale: 0.002
  },
  {
    name: "Tree_EZTree1Medium002",
    x: -34.1,
    y: -0.1,
    z: -1.6,
    scale: 0.002
  },
  {
    name: "Tree_EZTree0Medium011",
    x: -24.5,
    y: -0.1,
    z: -0.9,
    scale: 0.002
  },
  {
    name: "Tree_EZTree0Medium010",
    x: -12.2,
    y: 0,
    z: 0.4,
    scale: 0.002
  },
  {
    name: "Tree_EZTree1Large001",
    x: 2,
    y: 0,
    z: 0.4,
    scale: 0.002
  },
  {
    name: "Tree_EZTree0Large",
    x: 16.6,
    y: 0,
    z: -0.1,
    scale: 0.002
  },
  {
    name: "Tree_EZTree1Large009",
    x: 37.9,
    y: 0,
    z: -0.1,
    scale: 0.002
  }
];

export default function TreeGrowth({ debug }) {
  const { scene } = useGLTF("/realistic_trees_collection.glb");

  useEffect(() => {
    if (!scene) return;

    const root = scene.getObjectByName("RootNode");
    if (!root) return;

    // Hide all trees
    TREES.forEach(t => {
      const obj = root.getObjectByName(t.name);
      if (obj) obj.visible = false;
    });

    const cfg = TREES[debug.index];
    const tree = root.getObjectByName(cfg.name);
    if (!tree) return;

    tree.visible = true;

    const box = new THREE.Box3().setFromObject(tree);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // 🔥 PERFECT GROUND SNAP (UNIFIED)
    tree.position.set(
      -center.x * cfg.scale + cfg.x,
      -center.y * cfg.scale + (size.y * cfg.scale) / 2 + cfg.y,
      -center.z * cfg.scale + cfg.z
    );

    tree.scale.setScalar(cfg.scale);

    // 🔍 LOGS (KEEP FOR SAFETY)
    console.log("🌳 TREE DEBUG");
    console.log("Index:", debug.index);
    console.log("Name:", cfg.name);
    console.log("Size:", size);
    console.log("World Y:", tree.getWorldPosition(new THREE.Vector3()).y);

  }, [scene, debug]);

  return <primitive object={scene} />;
}
