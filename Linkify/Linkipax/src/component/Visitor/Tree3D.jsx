// Tree3D.jsx - Fixed based on your Blender structure
import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Tree configurations in order of size
const TREE_CONFIGS = [
  { 
    name: "Tree EZTree1.Bush006",
    displayName: "Tiny Bush",
    scale: 0.4
  },
  { 
    name: "Tree EZTree0.Medium010",
    displayName: "Small Tree",
    scale: 0.5
  },
  { 
    name: "Tree EZTree0.Medium011", 
    displayName: "Medium Tree",
    scale: 0.6
  },
  { 
    name: "Tree EZTree0.Large",
    displayName: "Large Tree", 
    scale: 0.7
  },
  { 
    name: "Tree EZTree1.Medium002",
    displayName: "Larger Tree",
    scale: 0.8
  },
  { 
    name: "Tree EZTree1.Large001",
    displayName: "Very Large Tree",
    scale: 0.9
  },
  { 
    name: "Tree EZTree1.Large009",
    displayName: "Giant Tree",
    scale: 1.0
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
  
  useEffect(() => {
    console.log("=== GLTF LOADED ===");
    console.log("Scene structure:");
    
    // Log the full hierarchy to debug
    gltf.scene.traverse((child) => {
      if (child.name.includes("Tree")) {
        console.log(`Found: ${child.name} (${child.type})`);
      }
    });
    
    const treeIndex = getTreeIndex(visitorCount);
    const treeConfig = TREE_CONFIGS[treeIndex];
    
    console.log(`Selecting tree: ${treeConfig.name} for ${visitorCount} visitors`);
    
    // Find the tree group (parent object)
    let treeParent = null;
    gltf.scene.traverse((child) => {
      if (child.name === treeConfig.name && !child.isMesh) {
        treeParent = child;
        console.log(`Found tree parent: ${child.name}`);
      }
    });
    
    if (!treeParent) {
      console.warn(`Could not find tree group: ${treeConfig.name}`);
      console.log("Available tree groups:");
      gltf.scene.traverse((child) => {
        if (child.name.includes("Tree") && !child.isMesh) {
          console.log(`  - ${child.name}`);
        }
      });
      
      // Try alternative naming
      const altName = treeConfig.name.replace(/\./g, '_');
      gltf.scene.traverse((child) => {
        if (child.name === altName && !child.isMesh) {
          treeParent = child;
          console.log(`Found tree with alternative name: ${child.name}`);
        }
      });
    }
    
    // Create a new group for our tree
    const newTreeGroup = new THREE.Group();
    newTreeGroup.name = `ActiveTree_${treeConfig.name.replace(/\./g, '_')}`;
    
    if (treeParent) {
      console.log(`Cloning tree: ${treeParent.name}`);
      
      // Clone the entire tree hierarchy
      const clonedTree = treeParent.clone();
      
      // Make sure all meshes are visible and have proper materials
      clonedTree.traverse((child) => {
        if (child.isMesh) {
          console.log(`  Processing mesh: ${child.name}`);
          
          // Clone material to avoid conflicts
          if (child.material) {
            child.material = child.material.clone();
            
            // Apply appropriate colors based on mesh type
            if (child.name.includes("leaves") || 
                child.material.name?.toLowerCase().includes("leaf")) {
              // Leaves material
              child.material.color = new THREE.Color("#4CAF50");
              child.material.transparent = true;
              child.material.opacity = 0.9;
              child.material.side = THREE.DoubleSide;
              child.material.roughness = 0.8;
              
              // Add subtle emissive for leaves
              child.material.emissive = new THREE.Color("#4CAF50");
              child.material.emissiveIntensity = 0.05;
            } else {
              // Branches/trunk material
              child.material.color = new THREE.Color("#8B4513");
              child.material.roughness = 0.9;
              child.material.metalness = 0.1;
            }
          }
          
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Add the cloned tree to our group
      newTreeGroup.add(clonedTree);
      
      // Hide all other trees in the original scene (optional)
      gltf.scene.traverse((child) => {
        if (child.name.includes("Tree") && child !== treeParent) {
          child.visible = false;
        }
      });
      
    } else {
      console.log("Creating fallback tree geometry");
      // Create a simple procedural tree as fallback
      createFallbackTree(newTreeGroup, treeIndex);
    }
    
    // Apply scale
    newTreeGroup.scale.setScalar(treeConfig.scale);
    
    // Center the tree
    newTreeGroup.position.set(0, 0, 0);
    
    // Rotate for better view
    newTreeGroup.rotation.y = Math.PI / 4;
    
    setTreeGroup(newTreeGroup);
    
    console.log(`Tree created successfully`);
    
    // Cleanup
    return () => {
      if (newTreeGroup) {
        newTreeGroup.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.dispose();
          }
        });
      }
    };
    
  }, [gltf, visitorCount]);
  
  // Helper function to create fallback tree
  const createFallbackTree = (group, treeIndex) => {
    const sizes = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1.0];
    const size = sizes[treeIndex];
    
    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.1 * size, 0.15 * size, 1 * size, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ 
      color: "#8B4513",
      roughness: 0.9
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.castShadow = true;
    group.add(trunk);
    
    // Leaves - different shapes based on tree size
    let leavesGeometry;
    if (treeIndex === 0) {
      // Bush - sphere
      leavesGeometry = new THREE.SphereGeometry(0.5 * size, 16, 16);
    } else if (treeIndex < 3) {
      // Small/Medium trees - cone
      leavesGeometry = new THREE.ConeGeometry(0.7 * size, 1.5 * size, 8);
    } else {
      // Large trees - multiple cones
      leavesGeometry = new THREE.ConeGeometry(0.9 * size, 2 * size, 12);
    }
    
    const leavesMaterial = new THREE.MeshStandardMaterial({ 
      color: "#4CAF50",
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.y = 0.7 * size;
    leaves.castShadow = true;
    group.add(leaves);
  };
  
  useFrame((state) => {
    if (modelRef.current) {
      const time = state.clock.elapsedTime;
      
      // Gentle rotation
      modelRef.current.rotation.y += 0.001;
      
      // Subtle floating animation
      modelRef.current.position.y = Math.sin(time * 0.5) * 0.01;
      
      // Make leaves sway
      modelRef.current.traverse((child) => {
        if (child.isMesh && child.name && 
            (child.name.includes("leaves") || child.name.includes("leaf"))) {
          child.rotation.z = Math.sin(time * 2 + child.position.x) * 0.01;
        }
      });
    }
  });
  
  // Loading state
  if (!treeGroup) {
    return (
      <group>
        <mesh position={[0, 0.5, 0]}>
          <circleGeometry args={[0.5, 32]} />
          <meshBasicMaterial color="#4CAF50" transparent opacity={0.3} />
        </mesh>
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
        <circleGeometry args={[2, 32]} />
        <meshStandardMaterial 
          color="#8BC34A" 
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
}