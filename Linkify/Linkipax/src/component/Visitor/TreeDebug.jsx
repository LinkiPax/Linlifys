import { useGLTF } from "@react-three/drei";
import { useEffect } from "react";

export default function TreeDebug() {
  const gltf = useGLTF("/treeweb.glb");

  useEffect(() => {
    console.log("GLTF loaded:", gltf);
    console.log("Scene:", gltf.scene);
    console.log("Children:", gltf.scene.children);
  }, [gltf]);

  return <primitive object={gltf.scene} />;
}

useGLTF.preload("/treeweb.glb");
