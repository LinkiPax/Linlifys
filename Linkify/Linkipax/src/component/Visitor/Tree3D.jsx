// Tree3D.jsx - Fixed to properly group branches and leaves
import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Tree models with their expected parts
const TREE_CONFIGS = [
  { 
    name: "Tree_EZTree1Bush006",
    parts: ["branches006", "leaves006"],
    scale: 0.3,
    visitors: 5
  },
  { 
    name: "Tree_EZTree0Medium010",
    parts: ["branches010", "leaves010"],
    scale: 0.4,
    visitors: 10
  },
  { 
    name: "Tree_EZTree0Medium011",
    parts: ["branches011", "leaves011"],
    scale: 0.5,
    visitors: 15
  },
  { 
    name: "Tree_EZTree0Large",
    parts: ["branches", "leaves"],
    scale: 0.6,
    visitors: 25
  },
  { 
    name: "Tree_EZTree1Medium002",
    parts: ["branches002", "leaves002"],
    scale: 0.7,
    visitors: 35
  },
  { 
    name: "Tree_EZTree1Large001",
    parts: ["branches001", "leaves001"],
    scale: 0.8,
    visitors: 45
  },
  { 
    name: "Tree_EZTree1Large009",
    parts: ["branches009", "leaves009"],
    scale: 1.0,
    visitors: 50
  }
];

export default function Tree3D({ visitorCount = 0 }) {
  const gltf = useLoader(GLTFLoader, "/realistic_trees_collection.glb");
  const [treeGroup, setTreeGroup] = useState(new THREE.Group());
  const modelRef = useRef();
  const targetScale = useRef(0.4);
  
  // Find the appropriate tree stage
  const findTreeStage = (count) => {
    for (let i = TREE_CONFIGS.length - 1; i >= 0; i--) {
      if (count >= TREE_CONFIGS[i].visitors) {
        return i;
      }
    }
    return 0;
  };

  useEffect(() => {
    const stageIndex = findTreeStage(visitorCount);
    const treeConfig = TREE_CONFIGS[stageIndex];
    targetScale.current = treeConfig.scale;
    
    console.log(`Tree Stage ${stageIndex}: ${treeConfig.name} for ${visitorCount} visitors`);
    
    // Create a new group for our tree
    const newTreeGroup = new THREE.Group();
    newTreeGroup.name = `ActiveTree_${treeConfig.name}`;
    
    // Collect all parts of this tree
    let foundParts = 0;
    
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        // Check if this mesh belongs to our selected tree
        const isBranch = treeConfig.parts.some(part => 
          child.name.includes(treeConfig.name) && 
          child.name.toLowerCase().includes(part.toLowerCase())
        );
        
        const isLeaves = treeConfig.parts.some(part => 
          child.name.includes(treeConfig.name) && 
          child.name.toLowerCase().includes(part.toLowerCase())
        );
        
        if (isBranch || isLeaves) {
          console.log(`Adding tree part: ${child.name}`);
          
          // Clone the mesh
          const meshClone = child.clone();
          
          // Apply material with proper colors
          meshClone.material = meshClone.material.clone();
          
          // Different colors for branches and leaves
          if (child.name.toLowerCase().includes("branch") || 
              child.material.name?.toLowerCase().includes("branch")) {
            // Brown for branches
            meshClone.material.color = new THREE.Color("#8B4513"); // SaddleBrown
            meshClone.material.roughness = 0.8;
          } else {
            // Green for leaves - color based on tree size
            const greenShades = ["#90EE90", "#32CD32", "#228B22", "#006400", "#004d00", "#003300", "#002200"];
            meshClone.material.color = new THREE.Color(greenShades[stageIndex]);
            meshClone.material.transparent = true;
            meshClone.material.opacity = 0.9;
          }
          
          newTreeGroup.add(meshClone);
          foundParts++;
        }
      }
    });
    
    console.log(`Assembled tree with ${foundParts} parts`);
    
    if (foundParts === 0) {
      console.warn("No tree parts found! Showing all trees as fallback");
      // Fallback: show the entire scene
      const sceneClone = gltf.scene.clone();
      setTreeGroup(sceneClone);
    } else {
      setTreeGroup(newTreeGroup);
    }
    
    // Cleanup
    return () => {
      newTreeGroup.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.dispose();
        }
      });
    };
  }, [gltf, visitorCount]);

  useFrame((state) => {
    if (modelRef.current) {
      // Animate scale to target
      modelRef.current.scale.lerp(
        new THREE.Vector3(
          targetScale.current,
          targetScale.current,
          targetScale.current
        ),
        0.05
      );
      
      // Gentle rotation
      modelRef.current.rotation.y += 0.001;
      
      // Subtle floating animation
      const time = state.clock.elapsedTime;
      modelRef.current.position.y = Math.sin(time * 0.8) * 0.02;
      
      // Make leaves sway slightly
      modelRef.current.traverse((child) => {
        if (child.isMesh && child.name.toLowerCase().includes("leaf")) {
          child.rotation.z = Math.sin(time * 2 + child.position.x) * 0.02;
        }
      });
    }
  });

  return <primitive ref={modelRef} object={treeGroup} />;
}