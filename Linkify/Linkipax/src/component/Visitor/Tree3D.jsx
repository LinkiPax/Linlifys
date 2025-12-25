// Tree3D.jsx - Updated to select different trees based on visitor count
import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Map visitor count to specific tree models from your collection
const TREE_SELECTION = {
  seed: "Tree_EZTree1Bush006", // Small bush for seed stage
  sapling: "Tree_EZTree0Medium010", // Medium tree 1
  "young-tree": "Tree_EZTree0Medium011", // Medium tree 2
  "full-tree": "Tree_EZTree0Large", // Large tree for full growth
};

// Alternative: More detailed mapping with exact visitor thresholds
const getTreeModelByVisitorCount = (count) => {
  if (count < 5) return "Tree_EZTree1Bush006";
  if (count < 10) return "Tree_EZTree0Medium010";
  if (count < 15) return "Tree_EZTree0Medium011";
  if (count < 25) return "Tree_EZTree0Large";
  if (count < 35) return "Tree_EZTree1Medium002";
  if (count < 45) return "Tree_EZTree1Large001";
  return "Tree_EZTree1Large009"; // Largest tree for highest counts
};

const STAGE_SCALE = {
  seed: 0.4,
  sapling: 0.6,
  "young-tree": 0.8,
  "full-tree": 1,
};

export default function Tree3D({ stage, visitorCount = 0 }) {
  const gltf = useLoader(GLTFLoader, "/realistic_trees_collection.glb");
  const [selectedTree, setSelectedTree] = useState(null);
  const modelRef = useRef();
  const targetScale = useRef(STAGE_SCALE[stage] || 1);

  useEffect(() => {
    console.log("=== GLTF LOADED ===");
    console.log("Full GLTF object:", gltf);
    
    // Get the specific tree model based on visitor count
    const treeModelName = getTreeModelByVisitorCount(visitorCount);
    console.log(`Selecting tree model: ${treeModelName} for ${visitorCount} visitors`);
    
    // Find the tree in the scene
    gltf.scene.traverse((child) => {
      if (child.name === treeModelName || child.parent?.name === treeModelName) {
        console.log(`Found tree component: ${child.name}`);
      }
    });
    
    // Clone the entire scene and extract the specific tree
    const sceneClone = gltf.scene.clone();
    let foundTree = null;
    
    // Method 1: Look for the tree by name (direct match)
    sceneClone.traverse((child) => {
      if (child.name.includes(treeModelName)) {
        foundTree = child;
        // Highlight the selected tree for debugging
        if (child.isMesh) {
          child.material = child.material.clone();
          child.material.color = new THREE.Color("#4CAF50"); // Green color
        }
      } else if (child.isMesh) {
        // Hide other trees
        child.visible = false;
      }
    });
    
    // Method 2: If direct match fails, look for parent object
    if (!foundTree) {
      sceneClone.children.forEach((child) => {
        if (child.name === treeModelName) {
          foundTree = child;
          // Show all children of this tree
          child.traverse((mesh) => {
            if (mesh.isMesh) {
              mesh.visible = true;
              mesh.material = mesh.material.clone();
              mesh.material.color = new THREE.Color("#4CAF50");
            }
          });
        } else {
          // Hide other trees
          child.visible = false;
        }
      });
    }
    
    if (foundTree) {
      setSelectedTree(foundTree);
      console.log(`Successfully selected tree: ${foundTree.name}`);
    } else {
      // Fallback: Show the first tree
      const firstTree = sceneClone.children[0];
      if (firstTree) {
        firstTree.visible = true;
        setSelectedTree(firstTree);
        console.log("Using fallback: first tree");
      }
    }
    
    targetScale.current = STAGE_SCALE[stage] || 1;
    
    // Cleanup
    return () => {
      if (selectedTree) {
        selectedTree.traverse((child) => {
          if (child.material && child.material.dispose) {
            child.material.dispose();
          }
        });
      }
    };
  }, [gltf, stage, visitorCount]);

  useFrame(() => {
    if (modelRef.current) {
      modelRef.current.scale.lerp(
        new THREE.Vector3(
          targetScale.current,
          targetScale.current,
          targetScale.current
        ),
        0.05
      );
      
      // Add gentle rotation for visual interest
      modelRef.current.rotation.y += 0.002;
    }
  });

  // If no tree selected yet, show nothing
  if (!selectedTree) return null;

  return <primitive ref={modelRef} object={selectedTree} />;
}

// Optimized version that pre-calculates tree selection
export function Tree3DOptimized({ visitorCount }) {
  const gltf = useLoader(GLTFLoader, "/realistic_trees_collection.glb");
  const modelRef = useRef();
  
  // Pre-calculate which tree to show based on visitor count
  const treeIndex = Math.min(Math.floor(visitorCount / 10), 6);
  const treeNames = [
    "Tree_EZTree1Bush006",
    "Tree_EZTree0Medium010", 
    "Tree_EZTree0Medium011",
    "Tree_EZTree0Large",
    "Tree_EZTree1Medium002",
    "Tree_EZTree1Large001",
    "Tree_EZTree1Large009"
  ];
  
  const selectedTreeName = treeNames[treeIndex];
  const scale = 0.4 + (treeIndex * 0.1); // Scale increases with tree size

  useEffect(() => {
    // Hide all trees except the selected one
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        child.visible = child.parent?.name === selectedTreeName || 
                       child.name.includes(selectedTreeName);
        
        if (child.visible) {
          // Apply a growth animation
          child.scale.set(0.1, 0.1, 0.1);
          new TWEEN.Tween(child.scale)
            .to({ x: scale, y: scale, z: scale }, 1000)
            .easing(TWEEN.Easing.Elastic.Out)
            .start();
        }
      }
    });
  }, [gltf, selectedTreeName, scale]);

  useFrame(() => {
    if (modelRef.current) {
      modelRef.current.rotation.y += 0.001;
    }
  });

  return <primitive ref={modelRef} object={gltf.scene} />;
}