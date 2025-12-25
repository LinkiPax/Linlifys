// ModelTester.jsx
import { useState, useRef, useEffect } from "react";
import { Canvas, useLoader, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, useGLTF } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import * as THREE from "three";

const STAGE_SCALE = {
  seed: 0.4,
  sapling: 0.6,
  "young-tree": 0.8,
  "full-tree": 1,
};

// Component A: useLoader approach
function TreeWithLoader({ stage }) {
  const gltf = useLoader(GLTFLoader, "/realistic_trees_collection.glb");
  const modelRef = useRef();
  const targetScale = useRef(STAGE_SCALE[stage]);

  useEffect(() => {
    console.log("useLoader - GLTF loaded:", gltf);
    console.log("Scene children:", gltf.scene.children);
    
    // Debug: Show mesh names
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        console.log(`Mesh: ${child.name}`);
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

// Component B: useGLTF approach
function TreeWithUseGLTF({ stage }) {
  const { scene } = useGLTF("/realistic_trees_collection.glb");
  const modelRef = useRef();
  const targetScale = useRef(STAGE_SCALE[stage]);

  useEffect(() => {
    console.log("useGLTF - Scene loaded:", scene);
    
    if (scene) {
      console.log("Scene children:", scene.children.length);
      scene.traverse((child) => {
        if (child.isMesh) {
          console.log(`Mesh: ${child.name}`);
        }
      });
    }
    
    targetScale.current = STAGE_SCALE[stage] || 1;
  }, [scene, stage]);

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

  return scene ? <primitive ref={modelRef} object={scene} /> : null;
}

export default function ModelTester() {
  const [method, setMethod] = useState("useGLTF");
  const [stage, setStage] = useState("full-tree");

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <div style={{
        position: "absolute",
        top: 10,
        left: 10,
        zIndex: 100,
        background: "rgba(255, 255, 255, 0.9)",
        padding: 15,
        borderRadius: 8,
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
      }}>
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: "block", marginBottom: 5, fontWeight: "bold" }}>
            Loading Method:
          </label>
          <select 
            value={method} 
            onChange={(e) => setMethod(e.target.value)}
            style={{ padding: "5px 10px", borderRadius: 4, width: "100%" }}
          >
            <option value="useGLTF">useGLTF (drei)</option>
            <option value="useLoader">useLoader (three.js)</option>
          </select>
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 5, fontWeight: "bold" }}>
            Tree Stage:
          </label>
          <select 
            value={stage} 
            onChange={(e) => setStage(e.target.value)}
            style={{ padding: "5px 10px", borderRadius: 4, width: "100%" }}
          >
            <option value="seed">🌱 Seed (0.4x)</option>
            <option value="sapling">🌿 Sapling (0.6x)</option>
            <option value="young-tree">🌳 Young Tree (0.8x)</option>
            <option value="full-tree">🌲 Full Tree (1x)</option>
          </select>
        </div>
        <div style={{ marginTop: 10, fontSize: "12px", color: "#666" }}>
          Check browser console for detailed mesh information
        </div>
      </div>
      
      <Canvas camera={{ position: [0, 3, 6], fov: 50 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 5]} intensity={1} />
        
        {method === "useGLTF" ? (
          <TreeWithUseGLTF stage={stage} />
        ) : (
          <TreeWithLoader stage={stage} />
        )}
        
        <OrbitControls enableZoom={true} enablePan={true} enableRotate={true} />
        <gridHelper args={[10, 10]} />
        <axesHelper args={[3]} />
      </Canvas>
    </div>
  );
}