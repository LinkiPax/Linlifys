// getTreeStage.js - Updated for 7 stages
export default function getTreeStage(count) {
  if (count < 5) return "seed";          // Stage 1
  if (count < 10) return "sprout";       // Stage 2
  if (count < 15) return "sapling";      // Stage 3
  if (count < 25) return "young-tree";   // Stage 4
  if (count < 35) return "mature-tree";  // Stage 5
  if (count < 45) return "large-tree";   // Stage 6
  return "full-tree";                     // Stage 7
}

// Alternative with tree numbers
export function getTreeNumber(count) {
  if (count < 5) return 1;   // Tiny Bush
  if (count < 10) return 2;  // Small Tree
  if (count < 15) return 3;  // Medium Tree
  if (count < 25) return 4;  // Large Tree
  if (count < 35) return 5;  // Very Large Tree
  if (count < 45) return 6;  // Giant Tree
  return 7;                  // Mega Tree
}

// Get tree name by stage
export function getTreeName(stage) {
  const stageNames = {
    "seed": "Tiny Bush",
    "sprout": "Small Tree",
    "sapling": "Medium Tree",
    "young-tree": "Large Tree",
    "mature-tree": "Very Large Tree",
    "large-tree": "Giant Tree",
    "full-tree": "Mega Tree"
  };
  return stageNames[stage] || "Unknown Tree";
}

// Get visitor requirements for next stage
export function getNextStageRequirements(currentCount) {
  const thresholds = [5, 10, 15, 25, 35, 45, Infinity];
  const currentStage = getTreeNumber(currentCount) - 1;
  
  if (currentStage >= 6) {
    return { nextStage: null, requiredVisitors: null, remaining: 0 };
  }
  
  const requiredVisitors = thresholds[currentStage];
  const remaining = Math.max(0, requiredVisitors - currentCount);
  
  return {
    nextStage: getTreeNumber(requiredVisitors),
    requiredVisitors,
    remaining
  };
}