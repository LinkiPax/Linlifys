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

  /* ============================
     TREE SETUP (STAGE CHANGE)
     ============================ */
  useEffect(() => {
    if (!scene || !pivotRef.current) return;

    const rootNode = scene.getObjectByName("RootNode");
    if (!rootNode) return;

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

    // Reset tree transform ONLY
    tree.position.set(0, 0, 0);
    tree.rotation.set(0, 0, 0);
    tree.scale.set(1, 1, 1);

    // Normalize tree
    const box = new THREE.Box3().setFromObject(tree);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    tree.position.x -= center.x;
    tree.position.z -= center.z;
    tree.position.y -= box.min.y;

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

  }, [stage, scene, onTreeInfo]);

  /* ============================
     DEBUG CONTROLS (BUTTONS)
     ============================ */
  useEffect(() => {
    if (!pivotRef.current) return;

    pivotRef.current.position.set(
      debugTransform.x,
      debugTransform.y,
      debugTransform.z
    );

    pivotRef.current.scale.setScalar(debugTransform.scale);

  }, [debugTransform]);

  return <group ref={pivotRef} />;
}
