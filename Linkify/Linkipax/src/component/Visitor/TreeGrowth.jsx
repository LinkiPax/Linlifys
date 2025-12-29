import { useGLTF } from "@react-three/drei";
import { useEffect } from "react";
import * as THREE from "three";

export default function TreeGrowth() {
  const { scene } = useGLTF("/realistic_trees_collection.glb");

  useEffect(() => {
    console.log("========= GLB ROOT SCENE =========");
    console.log(scene);

    let index = 0;

    scene.traverse(obj => {
      index++;

      console.log(`\n🔹 OBJECT #${index}`);
      console.log("Name:", obj.name || "(no-name)");
      console.log("Type:", obj.type);
      console.log("UUID:", obj.uuid);

      // Transform info
      console.log("Local Position:", obj.position.clone());
      console.log("Local Rotation:", obj.rotation.clone());
      console.log("Local Scale:", obj.scale.clone());

      // World position
      const worldPos = new THREE.Vector3();
      obj.getWorldPosition(worldPos);
      console.log("World Position:", worldPos);

      // Geometry
      if (obj.geometry) {
        console.log("Geometry:", obj.geometry.type);
        console.log(
          "Vertex Count:",
          obj.geometry.attributes?.position?.count
        );

        obj.geometry.computeBoundingBox();
        console.log(
          "Geometry BoundingBox:",
          obj.geometry.boundingBox
        );
      }

      // Material
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          console.log(
            "Materials:",
            obj.material.map(m => m.name)
          );
        } else {
          console.log("Material:", obj.material.name);
        }
      }

      // Children
      if (obj.children.length > 0) {
        console.log(
          "Children:",
          obj.children.map(c => c.name)
        );
      }
    });

    // 🌍 FULL SCENE BOUNDING BOX
    const sceneBox = new THREE.Box3().setFromObject(scene);
    console.log("\n========= FULL SCENE BOUNDING BOX =========");
    console.log("Scene Size:", sceneBox.getSize(new THREE.Vector3()));
    console.log("Scene Center:", sceneBox.getCenter(new THREE.Vector3()));
  }, [scene]);

  // 🔥 Show everything for inspection
  scene.traverse(obj => (obj.visible = true));

  return <primitive object={scene} scale={0.3} />;
}
