import { generateHouseholdTaskDump } from "../shared/schema";

// Example user IDs to assign tasks
const userIds = [26, 28];

const main = () => {
  const tasks = generateHouseholdTaskDump(userIds);
  console.log("Generated Household Tasks:", tasks);
  console.log(
    "If you encounter 'zsh: command not found: ts-node', install it by running:"
  );
  console.log("npm install -g ts-node");
  console.log("Then, run the script again using:");
  console.log(
    "ts-node /Users/matheusmurbach/Workspace/NewRepo/scripts/generateTasks.ts"
  );
  console.log(
    "If you encounter 'TypeError: Unknown file extension \".ts\"', try the following:"
  );
  console.log("1. Run the script with the --loader flag:");
  console.log(
    "   ts-node --loader ts-node/esm /Users/matheusmurbach/Workspace/NewRepo/scripts/generateTasks.ts"
  );
  console.log(
    "2. Alternatively, compile the TypeScript file to JavaScript and run it:"
  );
  console.log(
    "   tsc /Users/matheusmurbach/Workspace/NewRepo/scripts/generateTasks.ts"
  );
  console.log(
    "   node /Users/matheusmurbach/Workspace/NewRepo/scripts/generateTasks.js"
  );
  console.log(
    "If you encounter 'ARG_UNKNOWN_OPTION', ensure you are using the correct version of ts-node:"
  );
  console.log("1. Uninstall the current version:");
  console.log("   npm uninstall -g ts-node");
  console.log("2. Install the latest compatible version:");
  console.log("   npm install -g ts-node");
  console.log("3. Run the script again using one of the following:");
  console.log(
    "   ts-node --loader ts-node/esm /Users/matheusmurbach/Workspace/NewRepo/scripts/generateTasks.ts"
  );
  console.log("   OR compile the TypeScript file to JavaScript and run it:");
  console.log(
    "   tsc /Users/matheusmurbach/Workspace/NewRepo/scripts/generateTasks.ts"
  );
  console.log(
    "   node /Users/matheusmurbach/Workspace/NewRepo/scripts/generateTasks.js"
  );
};

main();
