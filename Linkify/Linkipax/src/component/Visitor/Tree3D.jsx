// Tree3D.jsx - Fixed with better loading state and visibility
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

// Scale for each tree (adjust these values as needed)
const TREE_SCALES = [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];

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
  const [isLoading, setIsLoading] = useState(true);
  const modelRef = useRef();
  const currentTreeIndex = useRef(-1);
  
  useEffect(() => {
    console.log("GLTF loaded, creating tree...");
    setIsLoading(true);
    
    const treeIndex = getTreeIndex(visitorCount);
    currentTreeIndex.current = treeIndex;
    const treeName = TREE_MODELS[treeIndex];
    const treeScale = TREE_SCALES[treeIndex];
    
    console.log(`Creating tree: ${treeName} (Index: ${treeIndex}, Scale: ${treeScale})`);
    
    // Create a new group for our tree
    const newTreeGroup = new THREE.Group();
    newTreeGroup.name = `Tree_${treeName}`;
    
    // Find all parts belonging to this tree
    let foundParts = 0;
    
    // Method 1: Look for exact name match
    gltf.scene.traverse((child) => {
      if (child.name && child.name.includes(treeName)) {
        console.log(`Found exact match: ${child.name} (${child.type})`);
        foundParts++;
        const clone = child.clone();
        
        // Ensure it's visible
        clone.visible = true;
        
        // Set up materials
        if (clone.isMesh) {
          clone.material = clone.material.clone();
          clone.material.needsUpdate = true;
          
          // Check if it's leaves or branches
          const isLeaves = 
            clone.name.toLowerCase().includes("leaf") ||
            clone.material.name?.toLowerCase().includes("leaf") ||
            clone.name.toLowerCase().includes("leave");
          
          if (isLeaves) {
            // Green for leaves
            clone.material.color = new THREE.Color("#4CAF50");
            clone.material.transparent = true;
            clone.material.opacity = 1;
            clone.material.side = THREE.DoubleSide; // Important for leaves!
          } else {
            // Brown for branches/trunk
            clone.material.color = new THREE.Color("#8B4513");
            clone.material.roughness = 0.8;
          }
          
          // Ensure materials are properly set up
          clone.material.depthWrite = true;
          clone.material.depthTest = true;
        }
        
        newTreeGroup.add(clone);
      }
    });
    
    // Method 2: If no exact matches, try to find by pattern
    if (foundParts === 0) {
      console.log("No exact matches, trying pattern matching...");
      
      // Extract the base name (remove numbers)
      const baseName = treeName.replace(/\d+/g, '');
      console.log(`Looking for patterns with: ${baseName}`);
      
      gltf.scene.traverse((child) => {
        if (child.name && child.name.includes(baseName)) {
          console.log(`Found pattern match: ${child.name}`);
          foundParts++;
          const clone = child.clone();
          clone.visible = true;
          
          if (clone.isMesh) {
            clone.material = clone.material.clone();
            clone.material.color = new THREE.Color("#4CAF50");
          }
          
          newTreeGroup.add(clone);
        }
      });
    }
    
    if (foundParts === 0) {
      console.warn("No tree parts found! Showing fallback geometry");
      // Create a simple tree as fallback
      const trunkGeometry = new THREE.CylinderGeometry(0.1, 0.15, 0.5, 8);
      const trunkMaterial = new THREE.MeshStandardMaterial({ color: "#8B4513" });
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      
      const leavesGeometry = new THREE.ConeGeometry(0.4, 1, 8);
      const leavesMaterial = new THREE.MeshStandardMaterial({ 
        color: "#4CAF50",
        transparent: true,
        opacity: 0.9
      });
      const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
      leaves.position.y = 0.5;
      
      newTreeGroup.add(trunk);
      newTreeGroup.add(leaves);
      foundParts = 2;
    }
    
    console.log(`Created tree with ${foundParts} parts`);
    
    // Position and scale the tree
    newTreeGroup.position.set(0, 0, 0);
    newTreeGroup.scale.setScalar(treeScale);
    
    // Add some rotation to make it more visible from all angles
    newTreeGroup.rotation.y = Math.PI / 4;
    
    setTreeGroup(newTreeGroup);
    setIsLoading(false);
    
    // Cleanup function
    return () => {
      console.log("Cleaning up tree...");
      if (newTreeGroup) {
        newTreeGroup.traverse((child) => {
          if (child.isMesh) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => mat.dispose());
              } else {
                child.material.dispose();
              }
            }
          }
        });
      }
    };
  }, [gltf, visitorCount]);

  useFrame((state) => {
    if (modelRef.current && !isLoading) {
      const time = state.clock.elapsedTime;
      
      // Gentle rotation animation
      modelRef.current.rotation.y += 0.001;
      
      // Subtle bobbing motion
      modelRef.current.position.y = Math.sin(time * 0.5) * 0.02;
      
      // Make leaves sway slightly
      modelRef.current.traverse((child) => {
        if (child.isMesh && child.name && child.name.toLowerCase().includes("leaf")) {
          child.rotation.z = Math.sin(time * 2 + child.position.x * 10) * 0.02;
        }
      });
    }
  });

  // Show loading indicator instead of green box
  if (isLoading) {
    return (
      <group>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.3, 0.3, 0.3]} />
          <meshStandardMaterial 
            color="#4CAF50" 
            transparent 
            opacity={0.5}
            wireframe={true}
          />
        </mesh>
        <pointLight position={[0, 2, 0]} intensity={0.5} color="#4CAF50" />
      </group>
    );
  }

  if (!treeGroup) {
    return null;
  }

  return (
    <group>
      <primitive ref={modelRef} object={treeGroup} />
      {/* Add some ground for context */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <circleGeometry args={[3, 32]} />
        <meshStandardMaterial color="#8BC34A" />
      </mesh>
    </group>
  );
}