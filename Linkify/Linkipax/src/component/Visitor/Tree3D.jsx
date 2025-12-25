import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const STAGE_SCALE = {
  seed: 0.4,
  sapling: 0.6,
  "young-tree": 0.8,
  "full-tree": 1,
};

export default function Tree3D({ stage }) {
  const gltf = useLoader(GLTFLoader, "/realistic_trees_collection.glb");
  
  const modelRef = useRef();
  const targetScale = useRef(STAGE_SCALE[stage]);

  useEffect(() => {
    console.log("=== GLTF LOADED ===");
    console.log("Full GLTF object:", gltf);
    console.log("Scene:", gltf.scene);
    console.log("Scene children:", gltf.scene.children.length);
    
    // Detailed mesh logging
    let meshCount = 0;
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        meshCount++;
        console.log(`\nMesh ${meshCount}:`);
        console.log(`  Name: ${child.name || 'unnamed'}`);
        console.log(`  Type: ${child.type}`);
        console.log(`  Parent: ${child.parent?.name || 'root'}`);
        console.log(`  Position:`, child.position);
        console.log(`  Scale:`, child.scale);
        console.log(`  Visible: ${child.visible}`);
        console.log(`  Vertices: ${child.geometry?.attributes?.position?.count || 0}`);
        console.log(`  Material: ${child.material?.name || 'default'}`);
        
        // Try to set a unique color for each mesh for debugging
        child.material = child.material.clone();
        const hue = (meshCount * 60) % 360;
        child.material.color = new THREE.Color(`hsl(${hue}, 70%, 50%)`);
        child.material.wireframe = true; // Add wireframe for debugging
      }
    });
    
    console.log(`\nTotal meshes found: ${meshCount}`);
    
    targetScale.current = STAGE_SCALE[stage] || 1;
    
    // Cleanup function
    return () => {
      console.log("Tree3D unmounting");
    };
  }, [gltf, stage]);

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
    }
  });

  return <primitive ref={modelRef} object={gltf.scene} />;
}