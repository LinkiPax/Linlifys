import { useGLTF } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import axios from "axios";

export default function TreeGrowth({ debugTransform }) {
  const { scene } = useGLTF("/realistic_trees_collection.glb");
  const pivotRef = useRef();
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

  // Visitor count
  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/visitor/visit`)
      .then(res => {
        const count = res.data.count || 0;
        setStage(Math.min(Math.floor(count / 100), treeNames.length - 1));
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!scene || !pivotRef.current) return;

    const rootNode = scene.getObjectByName("RootNode");
    if (!rootNode) return;

    treeNames.forEach(name => {
      const t = rootNode.getObjectByName(name);
      if (t) t.visible = false;
    });

    const tree = rootNode.getObjectByName(treeNames[stage]);
    if (!tree) return;

    tree.visible = true;

    pivotRef.current.clear();
    pivotRef.current.add(tree);

    tree.position.set(0, 0, 0);
    tree.rotation.set(0, 0, 0);
    tree.scale.set(1, 1, 1);

    const box = new THREE.Box3().setFromObject(tree);
    const center = box.getCenter(new THREE.Vector3());

    // Center X/Z and ground Y
    tree.position.x -= center.x;
    tree.position.z -= center.z;
    tree.position.y -= box.min.y;
  }, [stage, scene]);

  // 🔥 APPLY DEBUG TRANSFORM LIVE
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
