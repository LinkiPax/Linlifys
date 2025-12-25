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
  const modelRef = useRef();
  const currentTreeIndex = useRef(-1);
  
  useEffect(() => {
    console.log("GLTF loaded successfully!");
    console.log(`Total children in scene: ${gltf}`);
    const treeIndex = getTreeIndex(visitorCount);
    const treeConfig = TREE_CONFIGS[treeIndex];
    
    console.log(`Showing tree ${treeIndex + 1}: ${treeConfig.name} for ${visitorCount} visitors`);
    
    // Don't re-process if same tree
    if (treeIndex === currentTreeIndex.current) return;
    currentTreeIndex.current = treeIndex;
    
    // First, hide ALL tree groups
    gltf.scene.traverse((child) => {
      if (child.name && child.name.startsWith("Tree EZTree")) {
        child.visible = false;
      }
    });
    
    // Find and show ONLY the selected tree
    let foundTree = null;
    gltf.scene.traverse((child) => {
      if (child.name === treeConfig.name) {
        foundTree = child;
        child.visible = true;
        console.log(`Found and showing tree: ${child.name}`);
        
        // Make all children visible
        child.traverse((mesh) => {
          if (mesh.isMesh) {
            mesh.visible = true;
            
            // Apply tree-specific colors
            if (mesh.material) {
              mesh.material = mesh.material.clone();
              
              if (mesh.name.includes("leaves") || 
                  mesh.material.name?.toLowerCase().includes("leaf")) {
                // Leaves - use the tree's color
                mesh.material.color = new THREE.Color(treeConfig.color);
                mesh.material.transparent = true;
                mesh.material.opacity = 0.9;
              } else {
                // Branches - brown
                mesh.material.color = new THREE.Color("#8B4513");
              }
              
              mesh.material.needsUpdate = true;
            }
          }
        });
      }
    });
    
    if (!foundTree) {
      console.error(`Tree ${treeConfig.name} not found! Available trees:`);
      gltf.scene.traverse((child) => {
        if (child.name && child.name.startsWith("Tree EZTree")) {
          console.log(`  - ${child.name}`);
        }
      });
    }
    
    // Apply scale to the entire scene
    gltf.scene.scale.setScalar(treeConfig.scale);
    
  }, [gltf, visitorCount]);
  
  useFrame((state) => {
    if (modelRef.current) {
      // Gentle rotation
      modelRef.current.rotation.y += 0.001;
      
      // Subtle bobbing animation
      const time = state.clock.elapsedTime;
      modelRef.current.position.y = Math.sin(time * 0.5) * 0.01;
    }
  });
  
  return <primitive ref={modelRef} object={gltf.scene} />;
}