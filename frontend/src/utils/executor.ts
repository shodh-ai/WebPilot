// File: src/utils/executor.ts

interface UICommand {
    action: string;
    function: string;
    arguments: { [key: string]: any };
  }
  
  // Retrieve the global mapping of state update functions.
  // Your UI components must register their dynamic state change functions on this mapping.
  function getUIStateMapping(): { [key: string]: Function } {
    const mapping = (window as any).__UI_STATE_MAPPING__ || {};
    console.log("[Executor] Global UI state mapping retrieved:", mapping);
    return mapping;
  }
  
  export default async function executeUICommand(command: UICommand): Promise<any> {
    console.log("[Executor] Received UI command:", command);
    
    // Retrieve the mapping
    const mapping = getUIStateMapping();
    
    // Log available keys in mapping for clarity
    console.log("[Executor] Available function keys in mapping:", Object.keys(mapping));
    
    // Log the function name we are looking for
    console.log(`[Executor] Looking up function for key: "${command.function}"`);
    
    const fn = mapping[command.function];
    
    if (typeof fn === "function") {
      console.log(`[Executor] Found function for key "${command.function}":`, fn);
      
      // Log command.arguments details
      const args = command.arguments;
      console.log("[Executor] Command arguments received:", args);
      
      // Determine parameter for the state update function.
      let param;
      if (args.value !== undefined) {
        param = args.value;
        console.log("[Executor] Using 'value' from arguments as parameter:", param);
      } else if (Object.keys(args).length === 1) {
        const onlyKey = Object.keys(args)[0];
        param = args[onlyKey];
        console.log(`[Executor] Only one key found in arguments ("${onlyKey}"), using its value as parameter:`, param);
      } else {
        param = args;
        console.log("[Executor] Multiple argument keys detected; using the entire arguments object as parameter:", param);
      }
      
      try {
        console.log("[Executor] Executing function with parameter:", param);
        const result = fn(param);
        console.log(`[Executor] Successfully executed function "${command.function}". Result:`, result);
        return { success: true, result };
      } catch (error) {
        console.error(`[Executor] Error executing function "${command.function}" with parameter:`, param, "Error:", error);
        return { success: false, error: error };
      }
    } else {
      console.error(`[Executor] No matching state update function found for key: "${command.function}"`);
      return { success: false, error: `No matching state update function found for ${command.function}` };
    }
  }
  