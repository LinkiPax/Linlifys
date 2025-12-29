// Tree3D.jsx - Simplified version that works with your exact tree structure
import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Your tree structure in order from smallest to largest
const TREE_CONFIGS = [
  { 
    // Tree 1 - Smallest (Bush)
    name: "Tree EZTree1.Bush006",
    displayName: "Tiny Bush",
    scale: 0.8,
    color: "#90EE90"
  },
  { 
    // Tree 2
    name: "Tree EZTree1.Medium002",
    displayName: "Small Tree",
    scale: 1.0,
    color: "#32CD32"
  },
  { 
    // Tree 3
    name: "Tree EZTree0.Medium011", 
    displayName: "Medium Tree",
    scale: 1.2,
    color: "#228B22"
  },
  { 
    // Tree 4
    name: "Tree EZTree0.Medium010",
    displayName: "Large Tree", 
    scale: 1.5,
    color: "#006400"
  },
  { 
    // Tree 5
    name: "Tree EZTree1.Large001",
    displayName: "Very Large Tree",
    scale: 1.8,
    color: "#004d00"
  },
  { 
    // Tree 6
    name: "Tree EZTree0.Large",
    displayName: "Giant Tree",
    scale: 2.0,
    color: "#003300"
  },
  { 
    // Tree 7 - Largest
    name: "Tree EZTree1.Large009",
    displayName: "Mega Tree",
    scale: 2.5,
    color: "#002200"
  }
];

// Get tree index based on visitor count
const getTreeIndex = (visitorCount) => {
  if (visitorCount < 5) return 0;      // Tree 1
  if (visitorCount < 10) return 1;     // Tree 2
  if (visitorCount < 15) return 2;     // Tree 3
  if (visitorCount < 25) return 3;     // Tree 4
  if (visitorCount < 35) return 4;     // Tree 5
  if (visitorCount < 45) return 5;     // Tree 6
  return 6;                            // Tree 7
};

export default function Tree3D({ visitorCount = 0 }) {
  const gltf = useLoader(GLTFLoader, "/realistic_trees_collection.glb");
  const ref = useRef();

  useEffect(() => {
    const index = getTreeIndex(visitorCount);
    const targetName = TREE_CONFIGS[index].name;

    // 1️⃣ Hide EVERYTHING
    gltf.scene.traverse((obj) => {
      if (obj.isMesh || obj.isGroup) {
        obj.visible = false;
      }
    });

    // 2️⃣ Show ONLY selected tree
    gltf.scene.traverse((obj) => {
      if (obj.name === targetName) {
        obj.visible = true;

        obj.traverse((child) => {
          if (child.isMesh) {
            child.visible = true;
            child.material = child.material.clone();

            if (child.name.toLowerCase().includes("leaves")) {
              child.material.color.set(TREE_CONFIGS[index].color);
            } else {
              child.material.color.set("#8B4513");
            }
          }
        });
      }
    });

    // 3️⃣ Scale only active tree
    gltf.scene.scale.setScalar(TREE_CONFIGS[index].scale);

  }, [visitorCount, gltf]);

  useFrame(() => {
    if (ref.current) ref.current.rotation.y += 0.002;
  });

  return <primitive ref={ref} object={gltf.scene} />;
}
