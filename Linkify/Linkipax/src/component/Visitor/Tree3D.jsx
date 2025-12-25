// Tree3D.jsx
import { useLoader } from "@react-three/fiber";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
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
  const gltf = useLoader(GLTFLoader, "/treeweb.glb", (loader) => {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
    loader.setDRACOLoader(dracoLoader);
  });

  const modelRef = useRef();
  const targetScale = useRef(STAGE_SCALE[stage]);

  useEffect(() => {
    console.log("GLTF loaded:", gltf);
    console.log("Scene children:", gltf.scene.children);
    
    // Log all meshes
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        console.log(`Mesh: ${child.name}`, {
          material: child.material?.name,
          vertices: child.geometry?.attributes?.position?.count
        });
      }
    });
    
    targetScale.current = STAGE_SCALE[stage] || 1;
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