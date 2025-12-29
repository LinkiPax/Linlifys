import { useGLTF } from "@react-three/drei";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function TreeGrowth({
  stage,
  debugTransform,
  onTreeInfo
}) {
  const { scene } = useGLTF("/realistic_trees_collection.glb");
  const pivotRef = useRef();

  const treeNames = [
    "Tree_EZTree1Bush006",
    "Tree_EZTree1Medium002",
    "Tree_EZTree0Medium011",
    "Tree_EZTree0Medium010",
    "Tree_EZTree1Large001",
    "Tree_EZTree0Large",
    "Tree_EZTree1Large009"
  ];

  useEffect(() => {
    if (!scene || !pivotRef.current) return;

    const rootNode = scene.getObjectByName("RootNode");
    if (!rootNode) return;

    // Reset pivot every time (VERY IMPORTANT)
    pivotRef.current.position.set(0, 0, 0);
    pivotRef.current.scale.set(1, 1, 1);
    pivotRef.current.clear();

    // Hide all trees
    treeNames.forEach(name => {
      const t = rootNode.getObjectByName(name);
      if (t) t.visible = false;
    });

    const treeName = treeNames[stage];
    const tree = rootNode.getObjectByName(treeName);
    if (!tree) return;

    tree.visible = true;
    pivotRef.current.add(tree);

    // Reset tree transforms
    tree.position.set(0, 0, 0);
    tree.rotation.set(0, 0, 0);
    tree.scale.set(1, 1, 1);

    // 🔥 LOCAL NORMALIZATION (PER TREE)
    const box = new THREE.Box3().setFromObject(tree);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // Center X/Z
    tree.position.x -= center.x;
    tree.position.z -= center.z;

    // Ground Y (ABSOLUTE FIX)
    tree.position.y -= box.min.y;

    // 🔥 GLOBAL DEBUG OFFSET (SAME FOR ALL TREES)
    pivotRef.current.position.set(
      debugTransform.x,
      debugTransform.y,
      debugTransform.z
    );
    pivotRef.current.scale.setScalar(debugTransform.scale);

    // Debug logs
    const worldPos = new THREE.Vector3();
    tree.getWorldPosition(worldPos);

    console.group("🌳 TREE DEBUG");
    console.log("Index:", stage);
    console.log("Name:", treeName);
    console.log("Size:", size);
    console.log("Center:", center);
    console.log("World Position:", worldPos);
    console.groupEnd();

    onTreeInfo?.({
      index: stage,
      name: treeName,
      size,
      center,
      worldPos
    });

  }, [stage, scene, debugTransform, onTreeInfo]);

  return <group ref={pivotRef} />;
}
