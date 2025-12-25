// Tree3D.jsx - Fixed to work with visitorCount only
import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// All available trees in order of size/smallest to largest
const TREE_MODELS = [
  "Tree_EZTree1Bush006",      // 0: Tiny Bush
  "Tree_EZTree0Medium010",    // 1: Small Tree
  "Tree_EZTree0Medium011",    // 2: Medium Tree
  "Tree_EZTree0Large",        // 3: Large Tree
  "Tree_EZTree1Medium002",    // 4: Larger Tree
  "Tree_EZTree1Large001",     // 5: Very Large Tree
  "Tree_EZTree1Large009"      // 6: Giant Tree
];

// Scale for each tree
const TREE_SCALES = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1.0];

// Get tree index based on visitor count
const getTreeIndex = (visitorCount) => {
  if (visitorCount < 5) return 0;
  if (visitorCount < 10) return 1;
  if (visitorCount < 15) return 2;
  if (visitorCount < 25) return 3;
  if (visitorCount < 35) return 4;
  if (visitorCount < 45) return 5;
  return 6;
};

export default function Tree3D({ visitorCount = 0 }) {
  const gltf = useLoader(GLTFLoader, "/realistic_trees_collection.glb");
  const [treeGroup, setTreeGroup] = useState(null);
  const modelRef = useRef();
  const currentTreeIndex = useRef(-1);
  
  useEffect(() => {
    const treeIndex = getTreeIndex(visitorCount);
    
    // Don't rebuild if same tree index
    if (treeIndex === currentTreeIndex.current && treeGroup) return;
    
    currentTreeIndex.current = treeIndex;
    const treeName = TREE_MODELS[treeIndex];
    const treeScale = TREE_SCALES[treeIndex];
    
    console.log(`Switching to tree: ${treeName} (Index: ${treeIndex}, Scale: ${treeScale})`);
    
    // Create a new group for our tree
    const newTreeGroup = new THREE.Group();
    newTreeGroup.name = `Tree_${treeName}_${visitorCount}`;
    
    // Find all parts belonging to this tree
    const treeParts = [];
    
    // Method 1: Look for exact name match
    gltf.scene.traverse((child) => {
      if (child.name.includes(treeName)) {
        treeParts.push(child);
      }
    });
    
    // Method 2: If no exact match, try pattern matching
    if (treeParts.length === 0) {
      const baseName = treeName.replace(/[0-9]/g, '');
      gltf.scene.traverse((child) => {
        if (child.name.includes(baseName)) {
          treeParts.push(child);
        }
      });
    }
    
    console.log(`Found ${treeParts.length} parts for tree ${treeName}`);
    
    // Clone and add all parts
    treeParts.forEach((part) => {
      const clone = part.clone();
      
      // Set up materials for branches and leaves
      if (clone.isMesh) {
        clone.material = clone.material.clone();
        
        // Check if it's leaves or branches
        const isLeaves = 
          clone.name.toLowerCase().includes("leaf") ||
          clone.material.name?.toLowerCase().includes("leaf") ||
          clone.name.toLowerCase().includes("leave");
        
        if (isLeaves) {
          // Green for leaves - darker for larger trees
          const greenIntensity = 0.3 + (treeIndex * 0.1);
          clone.material.color = new THREE.Color(0, greenIntensity, 0);
          clone.material.transparent = true;
          clone.material.opacity = 0.9;
        } else {
          // Brown for branches
          const brownIntensity = 0.3 + (treeIndex * 0.05);
          clone.material.color = new THREE.Color(brownIntensity, brownIntensity * 0.5, 0);
          clone.material.roughness = 0.9;
        }
      }
      
      newTreeGroup.add(clone);
    });
    
    // Set initial scale for animation
    newTreeGroup.scale.setScalar(0.1);
    setTreeGroup(newTreeGroup);
    
    // Animate to target scale
    setTimeout(() => {
      if (modelRef.current) {
        modelRef.current.scale.setScalar(treeScale);
      }
    }, 100);
    
  }, [gltf, visitorCount]);

  useFrame((state) => {
    if (modelRef.current) {
      // Smooth scale animation
      const targetScale = TREE_SCALES[currentTreeIndex.current];
      modelRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.05
      );
      
      // Gentle rotation
      modelRef.current.rotation.y += 0.001;
      
      // Subtle floating animation
      const time = state.clock.elapsedTime;
      modelRef.current.position.y = Math.sin(time * 0.5) * 0.02;
    }
  });

  // Loading state
  if (!treeGroup) {
    return (
      <mesh>
        <coneGeometry args={[0.3, 1, 8]} />
        <meshStandardMaterial color="#4CAF50" transparent opacity={0.5} />
      </mesh>
    );
  }

  return <primitive ref={modelRef} object={treeGroup} />;
}