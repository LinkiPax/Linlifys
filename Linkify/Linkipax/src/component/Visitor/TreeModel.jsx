import { useGLTF } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const STAGE_SCALE = {
  seed: 0.4,
  sapling: 0.6,
  "young-tree": 0.8,
  "full-tree": 1,
};

export default function TreeModel({ stage }) {
  const { scene } = useGLTF("/treeweb.glb");
  const targetScale = useRef(0.4);

  useEffect(() => {
    targetScale.current = STAGE_SCALE[stage] || 1;
  }, [stage]);

  useFrame(() => {
    scene.scale.lerp(
      new THREE.Vector3(
        targetScale.current,
        targetScale.current,
        targetScale.current
      ),
      0.05
    );
  });

  return <primitive object={scene} />;
}
