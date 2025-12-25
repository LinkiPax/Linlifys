// Tree3D.jsx - Fixed version that displays complete trees
import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Map visitor count to tree models
const getTreeModelByVisitorCount = (count) => {
  if (count < 5) return "Tree_EZTree1Bush006";
  if (count < 10) return "Tree_EZTree0Medium010";
  if (count < 15) return "Tree_EZTree0Medium011";
  if (count < 25) return "Tree_EZTree0Large";
  if (count < 35) return "Tree_EZTree1Medium002";
  if (count < 45) return "Tree_EZTree1Large001";
  return "Tree_EZTree1Large009";
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
  const animationProgress = useRef(0);

  useEffect(() => {
    console.log("=== GLTF LOADED ===");
    
    // Get the specific tree model based on visitor count
    const treeModelName = getTreeModelByVisitorCount(visitorCount);
    console.log(`Selecting tree model: ${treeModelName} for ${visitorCount} visitors`);
    
    // Create a new group to hold our selected tree
    const treeGroup = new THREE.Group();
    treeGroup.name = `SelectedTree_${treeModelName}`;
    
    // Find and collect all parts of the selected tree
    const treeParts = [];
    
    gltf.scene.traverse((child) => {
      // Look for objects that belong to our selected tree
      if (child.name.includes(treeModelName)) {
        console.log(`Found tree part: ${child.name} (${child.type})`);
        treeParts.push(child);
      }
    });
    
    console.log(`Found ${treeParts.length} parts for tree ${treeModelName}`);
    
    // Clone and add all parts to our group
    treeParts.forEach((part) => {
      const clone = part.clone();
      
      // If it's a mesh, set up the material
      if (clone.isMesh) {
        clone.material = clone.material.clone();
        
        // Apply stage-based color tint
        const colorMap = {
          seed: "#90EE90", // Light green
          sapling: "#32CD32", // Lime green
          "young-tree": "#228B22", // Forest green
          "full-tree": "#006400" // Dark green
        };
        
        clone.material.color = new THREE.Color(colorMap[stage] || "#4CAF50");
        clone.material.transparent = true;
        clone.material.opacity = 0;
        
        // Add subtle emissive glow
        clone.material.emissive = new THREE.Color(colorMap[stage] || "#4CAF50");
        clone.material.emissiveIntensity = 0.1;
      }
      
      treeGroup.add(clone);
    });
    
    if (treeParts.length > 0) {
      setSelectedTree(treeGroup);
      console.log(`Successfully created tree group with ${treeParts.length} parts`);
      
      // Reset animation progress for new tree
      animationProgress.current = 0;
    } else {
      console.warn(`No parts found for tree: ${treeModelName}`);
      // Fallback: show the first tree in the collection
      if (gltf.scene.children.length > 0) {
        const fallbackTree = gltf.scene.children[0].clone();
        setSelectedTree(fallbackTree);
        console.log("Using fallback tree");
      }
    }
    
    targetScale.current = STAGE_SCALE[stage] || 1;
    
    return () => {
      // Clean up materials
      if (treeGroup) {
        treeGroup.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.dispose();
          }
        });
      }
    };
  }, [gltf, stage, visitorCount]);

  useFrame((state, delta) => {
    if (modelRef.current) {
      // Smooth scale animation
      modelRef.current.scale.lerp(
        new THREE.Vector3(
          targetScale.current,
          targetScale.current,
          targetScale.current
        ),
        0.1
      );
      
      // Gentle rotation animation
      modelRef.current.rotation.y += 0.001;
      
      // Fade in animation for new trees
      if (animationProgress.current < 1) {
        animationProgress.current += delta * 2; // 2 seconds to fully appear
        animationProgress.current = Math.min(animationProgress.current, 1);
        
        modelRef.current.traverse((child) => {
          if (child.isMesh && child.material) {
            // Fade in
            child.material.opacity = THREE.MathUtils.lerp(
              0, 
              1, 
              animationProgress.current
            );
            
            // Scale up during fade in
            const scale = 0.5 + (animationProgress.current * 0.5);
            child.scale.setScalar(scale);
          }
        });
      }
      
      // Subtle floating animation
      const time = state.clock.elapsedTime;
      modelRef.current.position.y = Math.sin(time * 0.5) * 0.05;
    }
  });

  // If no tree selected yet, show a placeholder
  if (!selectedTree) {
    return (
      <mesh>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshBasicMaterial color="#4CAF50" transparent opacity={0.5} />
      </mesh>
    );
  }

  return <primitive ref={modelRef} object={selectedTree} />;
}

// Alternative simpler version that shows all trees but scales them
export function SimpleTree3D({ visitorCount }) {
  const gltf = useLoader(GLTFLoader, "/realistic_trees_collection.glb");
  const modelRef = useRef();
  
  useEffect(() => {
    // Show all trees but scale them based on visitor count
    const scale = 0.3 + (visitorCount * 0.01);
    
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        child.scale.setScalar(scale);
        
        // Color based on visitor count
        const hue = (visitorCount * 10) % 360;
        child.material = child.material.clone();
        child.material.color = new THREE.Color(`hsl(${hue}, 70%, 50%)`);
      }
    });
  }, [gltf, visitorCount]);
  
  useFrame(() => {
    if (modelRef.current) {
      modelRef.current.rotation.y += 0.001;
    }
  });
  
  return <primitive ref={modelRef} object={gltf.scene} />;
}