import { useHelper } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

export default function OriginHelper({ size = 5 }) {
  const ref = useRef();
  useHelper(ref, THREE.AxesHelper, size);
  return <group ref={ref} />;
}
