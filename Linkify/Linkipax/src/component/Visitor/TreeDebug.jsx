import { useGLTF } from "@react-three/drei";
import { useEffect } from "react";

export default function TreeDebug() {
  const gltf = useGLTF("/realistic_trees_collection.glb");

  useEffect(() => {
    console.log("=== GLTF Hierarchy Debug ===");
    
    const logHierarchy = (node, depth = 0) => {
      const indent = "  ".repeat(depth);
      console.log(`${indent}${node.name || 'Unnamed'} (${node.type})`);
      
      if (node.isMesh) {
        console.log(`${indent}  Position:`, node.position);
        console.log(`${indent}  Scale:`, node.scale);
        console.log(`${indent}  Visible:`, node.visible);
      }
      
      node.children.forEach(child => logHierarchy(child, depth + 1));
    };
    
    logHierarchy(gltf.scene);
    
    // Count tree-related objects
    let treeCount = 0;
    gltf.scene.traverse((child) => {
      if (child.name.includes("Tree")) {
        treeCount++;
      }
    });
    console.log(`Total tree-related objects: ${treeCount}`);
  }, [gltf]);

  return <primitive object={gltf.scene} />;
}

useGLTF.preload("/treeweb.glb");