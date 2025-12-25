import { useGLTF } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const STAGE_SCALE = {
  seed: 0.4,
  sapling: 0.6,
  "young-tree": 0.8,
  "full-tree": 1,
};

// Parent mesh names from your GLB file
const TREE_PARENT_NAMES = [
  "Tree EZTree0.Large_branches_0",
  "Tree EZTree0.Large_leaves_0",
  "Tree EZTree0.Medium010_leaves.010_0",
  "Tree EZTree1.Bush006_branches.006_0",
  "Tree EZTree1.Bush006_leaves.006_0"
];

export default function TreeModel({ stage }) {
  const { scene } = useGLTF("/treeweb.glb");
  const targetScale = useRef(0.4);
  const treeParentsRef = useRef([]);

  useEffect(() => {
    // Find all parent tree objects in the scene
    treeParentsRef.current = [];
    
    scene.traverse((child) => {
      if (TREE_PARENT_NAMES.includes(child.name)) {
        treeParentsRef.current.push(child);
        console.log(`Found tree parent: ${child.name} with ${child.children.length} children`);
      }
    });
    
    console.log(`Found ${treeParentsRef.current.length} tree parent objects`);
    targetScale.current = STAGE_SCALE[stage] || 1;
  }, [stage, scene]);

  useFrame(() => {
    const targetVector = new THREE.Vector3(
      targetScale.current,
      targetScale.current,
      targetScale.current
    );
    
    // Scale each parent object (which will scale its children too)
    treeParentsRef.current.forEach((parent) => {
      if (parent) {
        parent.scale.lerp(targetVector, 0.05);
      }
    });
  });

  return <primitive object={scene} />;
}

useGLTF.preload("/treeweb.glb");