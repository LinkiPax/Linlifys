export default function getTreeStage(count) {
  if (count < 5) return "seed";
  if (count < 20) return "sapling";
  if (count < 50) return "young-tree";
  return "full-tree";
}
