import { AxesHelper } from "three";
import { useMemo } from "react";

export default function OriginHelper({ size = 10 }) {
  const helper = useMemo(() => new AxesHelper(size), [size]);
  return <primitive object={helper} />;
}
