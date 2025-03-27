// api/functionHandler.ts
import { addPost } from "./addPost";
import { getMessages } from "./getMessages";
import { getPosts } from "./getPosts";
import { getUsers as fetchUsers } from "./getUsers"; // rename to avoid confusion
import { sendMessage } from "./sendMessage";
import { addTicket } from "./sendTicket"; // Adjust path if needed

const toolImplementations: { [name: string]: (args: any) => Promise<any> } = {
  addPost: async (args) => {
    console.log(`[addPost] Called with args:`, args);
    const result = await addPost(args.title, args.content);
    console.log(`[addPost] Returned result:`, result);
    return result;
  },
  getMessages: async () => {
    console.log(`[getMessages] Called`);
    const result = await getMessages();
    console.log(`[getMessages] Returned result:`, result);
    return result;
  },
  getPosts: async () => {
    console.log(`[getPosts] Called`);
    const result = await getPosts();
    console.log(`[getPosts] Returned result:`, result);
    return result;
  },
  getUsers: async () => {
    console.log(`[getUsers] Called`);
    const result = await fetchUsers(); // call your backend getUsers
    console.log(`[getUsers] Returned result:`, result);
    // Format the result into a natural language string.
    if (Array.isArray(result)) {
      if (result.length === 0) {
        return "No users were found.";
      }
      const usersSummary = result
        .map((user) => `User ID ${user.user_id} with email ${user.mail}`)
        .join("; ");
      console.log(`final summary is `, usersSummary);
      return `Found the following users: ${usersSummary}.`;
    }
    return "Unexpected result format for users.";
  },
  sendMessage: async (args) => {
    console.log(`[sendMessage] Called with args:`, args);
    const result = await sendMessage(args.receiver_id, args.content);
    console.log(`[sendMessage] Returned result:`, result);
    return result;
  },
  addTicket: async (args) => {
    console.log(`[addTicket] Called with args:`, args);
    const result = await addTicket(args.mail, args.department, args.detail);
    console.log(`[addTicket] Returned result:`, result);
    return result;
  },
};

export async function handleToolCall(
  toolName: string,
  args: any
): Promise<any> {
  console.log(`handleToolCall: Received call for "${toolName}" with arguments:`, args);
  const toolFn = toolImplementations[toolName];
  if (!toolFn) {
    console.error(`handleToolCall: No implementation found for function: ${toolName}`);
    throw new Error(`No implementation found for function: ${toolName}`);
  }
  try {
    const result = await toolFn(args);
    console.log(`handleToolCall: Function "${toolName}" executed successfully with result:`, result);
    return result;
  } catch (err) {
    console.error(`handleToolCall: Error executing function "${toolName}":`, err);
    throw err;
  }
}
