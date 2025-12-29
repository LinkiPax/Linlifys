import { useState } from "react";
import TreeScene from "./TreeScene";
import TreeDebugUI from "./TreeDebugUI";

export default function TreePage() {
  const [debug, setDebug] = useState({
    index: 0
  });

  return (
    <>
      <TreeDebugUI debug={debug} setDebug={setDebug} />
      <TreeScene debug={debug} />
    </>
  );
}
