import { axesHelper } from "three";
import { useMemo } from "react";

export default function OriginHelper({ size = 5 }) {
  const helper = useMemo(() => new axesHelper(size), [size]);
  return <primitive object={helper} />;
}
