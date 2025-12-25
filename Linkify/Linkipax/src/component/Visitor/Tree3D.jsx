// Tree3D.jsx - Updated with correct tree names
import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Tree configurations with EXACT names from your Blender file
const TREE_CONFIGS = [
  { 
    name: "Tree EZTree1.Bush006",
    displayName: "Tiny Bush",
    scale: 0.8,
    color: "#90EE90"
  },
  { 
    name: "Tree EZTree0.Medium010",
    displayName: "Small Tree",
    scale: 1.0,
    color: "#32CD32"
  },
  { 
    name: "Tree EZTree0.Medium011", 
    displayName: "Medium Tree",
    scale: 1.2,
    color: "#228B22"
  },
  { 
    name: "Tree EZTree0.Large",
    displayName: "Large Tree", 
    scale: 1.5,
    color: "#006400"
  },
  { 
    name: "Tree EZTree1.Medium002",
    displayName: "Larger Tree",
    scale: 1.8,
    color: "#004d00"
  },
  { 
    name: "Tree EZTree1.Large001",
    displayName: "Very Large Tree",
    scale: 2.0,
    color: "#003300"
  },
  { 
    name: "Tree EZTree1.Large009",
    displayName: "Giant Tree",
    scale: 2.5,
    color: "#002200"
  }
];

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
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    console.log("=== LOADING TREE ===");
    setIsLoading(true);
    
    const treeIndex = getTreeIndex(visitorCount);
    const treeConfig = TREE_CONFIGS[treeIndex];
    
    console.log(`Visitor count: ${visitorCount}`);
    console.log(`Selected tree: ${treeConfig.name} (Index: ${treeIndex})`);
    
    // First, let's log all tree objects to debug
    console.log("Available tree objects in GLTF:");
    const allTrees = [];
    gltf.scene.traverse((child) => {
      if (child.name.includes("Tree")) {
        allTrees.push({
          name: child.name,
          type: child.type,
          isMesh: child.isMesh,
          parent: child.parent?.name || 'none',
          children: child.children?.length || 0
        });
      }
    });
    console.table(allTrees);
    
    // Find the exact tree group
    let targetTree = null;
    gltf.scene.traverse((child) => {
      if (child.name === treeConfig.name) {
        targetTree = child;
        console.log(`Found exact tree group: ${child.name}`);
      }
    });
    
    // If not found, try to find with slight variations
    if (!targetTree) {
      console.log("Exact name not found, searching for similar...");
      gltf.scene.traverse((child) => {
        if (child.name.includes(treeConfig.name.replace(/\./g, '')) || 
            child.name.includes(treeConfig.name.replace(/ /g, '_'))) {
          targetTree = child;
          console.log(`Found similar tree: ${child.name}`);
        }
      });
    }
    
    if (targetTree) {
      console.log(`Processing tree: ${targetTree.name}`);
      console.log(`Tree type: ${targetTree.type}, Children: ${targetTree.children.length}`);
      
      // Clone the entire tree group
      const clonedTree = targetTree.clone();
      clonedTree.name = `ActiveTree_${treeConfig.name}`;
      
      // Process all meshes in the tree
      let meshCount = 0;
      clonedTree.traverse((child) => {
        if (child.isMesh) {
          meshCount++;
          console.log(`  Mesh ${meshCount}: ${child.name}`);
          
          // Ensure we have a material
          if (!child.material) {
            console.warn(`  No material found for ${child.name}, creating default`);
            child.material = new THREE.MeshStandardMaterial({ color: "#4CAF50" });
          } else {
            // Clone the material to avoid conflicts
            child.material = child.material.clone();
          }
          
          // Apply appropriate colors
          if (child.name.includes("leaves") || 
              child.name.includes("leaf") ||
              child.material.name?.toLowerCase().includes("leaf")) {
            // Leaves - use tree color
            child.material.color = new THREE.Color(treeConfig.color);
            child.material.transparent = true;
            child.material.opacity = 0.9;
            child.material.side = THREE.DoubleSide;
            child.material.roughness = 0.7;
          } else {
            // Branches/trunk
            child.material.color = new THREE.Color("#8B4513");
            child.material.roughness = 0.9;
            child.material.metalness = 0.2;
          }
          
          // Enable shadows
          child.castShadow = true;
          child.receiveShadow = true;
          child.visible = true;
        }
      });
      
      console.log(`Total meshes in tree: ${meshCount}`);
      
      // Set up the tree group
      const newTreeGroup = new THREE.Group();
      newTreeGroup.name = `TreeContainer_${treeConfig.name}`;
      newTreeGroup.add(clonedTree);
      
      // Apply scale
      newTreeGroup.scale.setScalar(treeConfig.scale);
      
      // Position at center
      newTreeGroup.position.set(0, 0, 0);
      
      // Add some initial rotation
      newTreeGroup.rotation.y = Math.PI / 4;
      
      setTreeGroup(newTreeGroup);
      
    } else {
      console.error(`Tree ${treeConfig.name} not found! Creating fallback...`);
      // Create fallback tree
      const newTreeGroup = new THREE.Group();
      createFallbackTree(newTreeGroup, treeIndex);
      setTreeGroup(newTreeGroup);
    }
    
    setIsLoading(false);
    
    // Cleanup
    return () => {
      if (treeGroup) {
        treeGroup.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.dispose();
          }
        });
      }
    };
    
  }, [gltf, visitorCount]);
  
  // Fallback tree creation
  const createFallbackTree = (group, treeIndex) => {
    const config = TREE_CONFIGS[treeIndex];
    const size = config.scale;
    
    console.log(`Creating fallback tree with scale ${size}`);
    
    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.1, 0.15, 1, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ 
      color: "#8B4513",
      roughness: 0.9
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.scale.setScalar(size);
    trunk.castShadow = true;
    group.add(trunk);
    
    // Leaves - sphere for bush, cone for trees
    let leavesGeometry;
    if (treeIndex === 0) {
      leavesGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    } else {
      leavesGeometry = new THREE.ConeGeometry(0.6, 1.2, 8);
    }
    
    const leavesMaterial = new THREE.MeshStandardMaterial({ 
      color: config.color,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });
    
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.y = 0.8;
    leaves.scale.setScalar(size);
    leaves.castShadow = true;
    group.add(leaves);
  };
  
  useFrame((state) => {
    if (modelRef.current && !isLoading) {
      const time = state.clock.elapsedTime;
      
      // Gentle rotation
      modelRef.current.rotation.y += 0.001;
      
      // Subtle floating animation
      modelRef.current.position.y = Math.sin(time * 0.5) * 0.02;
      
      // Make leaves sway
      modelRef.current.traverse((child) => {
        if (child.isMesh && child.name && child.name.includes("leaves")) {
          child.rotation.z = Math.sin(time * 2 + child.position.x) * 0.01;
        }
      });
    }
  });
  
  // Show loading indicator
  if (isLoading || !treeGroup) {
    return (
      <group>
        <mesh position={[0, 1, 0]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshBasicMaterial 
            color="#4CAF50" 
            transparent 
            opacity={0.5}
            wireframe
          />
        </mesh>
        <pointLight position={[0, 2, 0]} intensity={0.5} color="#4CAF50" />
      </group>
    );
  }
  
  return (
    <group>
      <primitive ref={modelRef} object={treeGroup} />
      
      {/* Ground plane */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.5, 0]} 
        receiveShadow
      >
        <circleGeometry args={[3, 32]} />
        <meshStandardMaterial 
          color="#8BC34A" 
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
}