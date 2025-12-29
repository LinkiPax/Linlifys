import CommonScene from "./CommonScene";
import TreeGrowth from "./TreeGrowth";

export default function TreeScene({ debug }) {
  return (
    <CommonScene>
      <TreeGrowth debug={debug} />
    </CommonScene>
  );
}
