//WebPilot\frontend\src\api\openai.ts
import OpenAI from "openai";
import tools from "@/functions/index.json" assert { type: "json" };
import { functions } from "@/functions/index";
import { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";

// Define the interface for route context
export interface RouteContext {
  route: string;
  pageDescription?: string;
  context?: { [key: string]: any };
  interactiveElements?: Array<{
    elementName: string;
    elementType: string;
    eventType: string;
    boundFunction: string;
    referencedFunctions: string[];
    elementId?: string;
    elementClass?: string;
    elementText?: string;
  }>;
}

export const client = new OpenAI({
  apiKey: process.env["NEXT_PUBLIC_OPENAI_API_KEY"],
  dangerouslyAllowBrowser: true,
});

// Function to create context-aware system prompt based on the current route/context
export const createSystemPrompt = (routeContext: RouteContext | null = null) => {
  const dbSystemPrompt = `You are a database LLM with three functions: 'getDBData', 'getUserData', and 'getDBSchema'. Follow these strict rules without deviation:

GENERAL INSTRUCTIONS:
1. Schema Retrieval First: Always call 'getDBSchema' before using 'getDBData' to obtain the exact table names and columns. Do NOT assume or invent any schema details.
2. Relation Tables Enforcement: When data is relational, identify all necessary tables and include any relation tables required for proper joins.
3. Base Table Consideration: The query always starts from the base table "User" (via .from('User')). Do NOT include "User" in the join chain; it is implicit.
4. Ordering of Tables in the Join Chain:
   - Include only the additional tables (beyond "User") in your join chain.
   - The table that contains the foreign key (child/relation table) MUST be listed first.
   - The table being referenced (parent table) MUST come after the relation table.
   - Every table in 'getDBData' must have at least one valid column specified.
5. Disambiguation of Foreign Keys:
   - If a relation table has multiple foreign keys referencing different tables, explicitly choose the correct join key by placing it as the first element in that table's column array.
   - For example, in a table like "query-user" or "post-user", if filtering is on the base "User", then the first column must be the foreign key that relates to "User".
6. Separation of Calls: Do NOT combine calls to 'getDBSchema' and 'getDBData' in a single query. Retrieve the schema first, analyze it, then call 'getDBData'.
7. Do not include additional tables unless there is a valid relationship according to the schema.
8. Column Selection Based on Table Relationships:
   - When constructing join queries, include only the columns that are actually present in the table as defined by the schema.
   - Do not assume that columns available in a parent table are available in a relation table.
   - Always verify that the join key (the first element in the columns array) corresponds to a valid foreign key relationship.
   - Ensure that any additional columns listed for a table exist in that table to avoid errors.

THREE-SHOT EXAMPLES:

Example 1:
User Query: "get me the last 5 messages sent by any user"
Expected 'getDBData' Payload:
{
  "tables": ["message-user", "Message"],
  "columns": [
    ["sender", "message", "created_at"],
    ["message_id", "created_at", "message", "seen"]
  ]
}
Reasoning:
- The base "User" is implicit (via .from('User')), so it is not included in the join chain.
- The relation table "message-user" is listed first because it holds the foreign keys linking a user to a message.
- The first column in "message-user" is chosen to correctly indicate the join with the base "User".
- The parent table "Message" is then included to retrieve detailed message information.
- Additionally, the selected columns are verified against the schema, ensuring that only columns existing in each table are requested.

Example 2:
User Query: "get me the last 3 latest queries raised by any user"
Expected 'getDBData' Payload:
{
  "tables": ["query-user", "Query"],
  "columns": [
    ["user", "created_at"],
    ["query_id", "created_at", "text", "department", "user_mail"]
  ]
}
Reasoning:
- The base "User" is implicit, so only additional tables are included.
- The relation table "query-user" is listed first as it links the base "User" to the queries.
- The first column in "query-user" is chosen to ensure the join is correctly made with the base "User".
- The parent table "Query" is then added to retrieve full query details.
- Additionally, the columns selected for the relation table are verified to exist in that table per the schema, avoiding inclusion of columns that belong only to the parent table.

Example 3:
User Query: "what was the details of post about AI Technology? get me the details of the post"
Expected 'getDBData' Payload:
{
  "tables": ["post-user", "Posts"],
  "columns": [
    ["user", "created_at"],
    ["post_id", "Title", "Content"]
  ]
}
Reasoning:
- The base "User" table is implicit; therefore, the join chain includes only the additional tables.
- The relation table "post-user" is listed first because it contains the foreign keys connecting to "User".
- The first column in "post-user" is chosen to ensure the join is made using the correct foreign key.
- The parent table "Posts" is listed next to provide the detailed post data.
- Additionally, the selection of columns in each table respects the schema, ensuring that no invalid columns are requested.`;

  // If we have route context, create a web assistant prompt with UI interaction abilities
const webAssistantPrompt = routeContext ? 
    `You are Rox, a helpful AI assistant for a web application.
    You are currently on the ${routeContext.route} page.
    Page Description: ${routeContext.pageDescription || 'Not provided'}
    Page Context: ${JSON.stringify(routeContext.context || {})}
    
    USER INTERFACE INTERACTION ABILITIES:
    You can interact with the UI on behalf of the user. You have the following actions available:
    1. Navigate to other pages using 'navigateTo'
    2. Fill in form fields using 'fillInput'
    3. Click buttons, links or other interactive elements using 'clickElement'
    4. Submit forms using 'submitForm'
    
    Here are the interactive elements currently available on this page:
    ${JSON.stringify(routeContext.interactiveElements || [], null, 2)}
    
    FORM FIELD HANDLING - IMPORTANT GUIDELINES:
    - For email fields, use 'email' as the text selector
    - For password fields, use 'password' as the text selector
    - For name fields, use 'name' as the text selector
    - For title fields (in posts/tickets), use 'title' as the text selector
    - For department fields, use 'department' as the text selector
    - For message/content fields, use 'message' or 'content' as the text selector
    - Always include elementType (e.g., 'input', 'textarea') AND text in your selectors
    - NEVER use empty selectors - they will fail
    
    FORM SUBMISSION PROCESS:
    1. ALWAYS fill each form field individually using fillInput before submitting
    2. For form submission, use submitForm with a selector that specifically targets the form
    3. If submitForm doesn't work, try clicking a submit button with clickElement
    4. For post creation forms, ensure title and content are filled before submitting
    5. For ticket forms, ensure all required fields (email, department, etc.) are filled
    
    CRITICAL SELECTOR REQUIREMENTS:
    - When using fillInput, clickElement, or submitForm, you MUST provide at least two properties in the selector object
    - NEVER send an empty selector object {}
    - Always include elementType (e.g., 'input', 'button', 'form') AND at least one other property:
      * text: The visible text in or near the element (required for form fields)
      * elementId: The HTML id attribute if known
      * elementName: The name attribute if known
      * elementClass: CSS class if known
    
    GOOD INPUT SELECTOR EXAMPLES:
    fillInput({selector: {elementType: "input", text: "email"}, value: "user@example.com"})
    fillInput({selector: {elementType: "input", text: "password"}, value: "securePassword"})
    fillInput({selector: {elementType: "input", text: "title"}, value: "My New Post"})
    fillInput({selector: {elementType: "textarea", text: "content"}, value: "Post content here..."})
    fillInput({selector: {elementType: "select", text: "department"}, value: "Support"})
    
    GOOD FORM SUBMISSION EXAMPLES:
    submitForm({selector: {elementType: "form", elementClass: "form"}})
    clickElement({selector: {elementType: "button", text: "Submit"}})
    clickElement({selector: {elementType: "button", text: "Create Post"}}) : '';
    
    BAD EXAMPLE (will fail):
    fillInput({selector: {}, value: "test@example.com"})
  
    GOOD EXAMPLES (will work):
    fillInput({selector: {elementType: "input", elementName: "email"}, value: "test@example.com"})
    clickElement({selector: {elementType: "button", text: "Submit"}})

    When a user asks you to perform an action:
    1. Analyze what the user wants you to do
    2. Identify the correct function to use
    3. Determine which element to interact with using SPECIFIC selectors
    4. Use the appropriate function call to perform the action
    5. Confirm to the user what you've done: '';
    
    Remember, when using these functions:
    - For 'navigateTo', simply provide the route path (e.g., '/messages', '/signup')
    - For 'fillInput', 'clickElement', 'submitForm', you need to specify a selector with AT LEAST ONE of the following properties:
      - elementName (e.g., "email", "password")
      - elementType (e.g., "input", "button", "a")
      - elementId (e.g., "submitButton", "loginForm")
      - elementClass (e.g., "btn-primary", "form-control")
      - text (e.g., "Submit", "Login")
    
    Examples:
    - If user asks "go to the messages page", use navigateTo({route: '/messages'})
    - If user asks "enter my email as john@example.com", use fillInput({selector: {elementType: 'input', elementName: 'email'}, value: 'john@example.com'})
    - If user asks "click the submit button", use clickElement({selector: {elementType: 'button', text: 'Submit'}})
    - If user asks "post a message saying Hello team", first fill the input and then submit the form
    
    You should try multiple selectors if the first one doesn't work, as elements may be identified differently.

    Your primary goal is to:
    - Provide context-specific guidance for this page
    - Help users understand page features and actions
    - Perform actions on behalf of the user when asked
    - Offer step-by-step assistance
    - Be conversational and proactively helpful` : '';

  // Combine the prompts with appropriate context switching
  return `${dbSystemPrompt}

${webAssistantPrompt ? webAssistantPrompt : ''}

If the user query appears to be requesting database information, use the database functions following the specified rules.
If the user query appears to be asking for help with navigation or understanding the current page, respond as Rox the web assistant.
If the user is asking you to perform an action on their behalf, use the appropriate UI interaction function.
Always provide helpful, concise responses appropriate to the context of the query.`;
};

// Main streaming function with context support
export async function streamOpenAI(input: string, routeContext: RouteContext | null = null) {
  let messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: createSystemPrompt(routeContext)
    },
    { role: "user", content: input },
  ];
  
  const typedTools = tools as ChatCompletionTool[];
  
  try {
    const completion = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
      tools: typedTools,
      tool_choice: "auto",
    });
    
    let choice = completion.choices[0];
    let finalResponse = choice.message.content;

    // Keep track of whether we've handled tool calls
    let handledToolCalls = false;

    while (choice.finish_reason === "tool_calls" && choice.message.tool_calls) {
      handledToolCalls = true;
      console.log("Processing tool calls:", choice.message.tool_calls);
      
      // Add the assistant's message with tool calls to the conversation
      messages.push(choice.message);
      
      // Process each tool call
      // In the streamOpenAI function, modify the tool call processing section:
      for (const toolCall of choice.message.tool_calls) {
        try {
          const funcName = toolCall.function.name;
          let funcArgs;
          
          try {
            // Safely parse the arguments
            funcArgs = JSON.parse(toolCall.function.arguments);
            
            // Enforce stronger validation for selectors
            if (['fillInput', 'clickElement', 'submitForm'].includes(funcName)) {
              // Ensure selector exists and has at least two properties
              if (!funcArgs.selector || Object.keys(funcArgs.selector).length < 2) {
                console.warn(`${funcName}: Incomplete selector. Adding required properties`);
                
                // Ensure we have at least elementType
                if (!funcArgs.selector) funcArgs.selector = {};
                
                // Set appropriate elementType if missing
                if (!funcArgs.selector.elementType) {
                  if (funcName === 'fillInput') funcArgs.selector.elementType = 'input';
                  else if (funcName === 'submitForm') funcArgs.selector.elementType = 'form';
                  else if (funcName === 'clickElement') funcArgs.selector.elementType = 'button';
                }
                
                // Add a text property if we have a value (for fillInput) or nothing else
                if (funcName === 'fillInput' && funcArgs.value && !funcArgs.selector.text) {
                  // For email fields, add appropriate text identifier
                  if (funcArgs.value.includes('@')) {
                    funcArgs.selector.text = 'email';
                  } 
                  // For other fields, use a fallback
                  else if (Object.keys(funcArgs.selector).length < 2) {
                    funcArgs.selector.text = funcArgs.value.substring(0, 10);
                  }
                }
                
                // Ensure we have at least two properties
                if (Object.keys(funcArgs.selector).length < 2) {
                  if (!funcArgs.selector.elementClass) {
                    if (funcName === 'fillInput') funcArgs.selector.elementClass = 'form-control';
                    else if (funcName === 'submitForm') funcArgs.selector.elementClass = 'form';
                    else if (funcName === 'clickElement') funcArgs.selector.elementClass = 'btn';
                  }
                }
              }
            }
            
            // For fillInput, ensure value property exists
            if (funcName === 'fillInput' && !funcArgs.value && funcArgs.value !== '') {
              console.warn('No value provided for fillInput');
              funcArgs.value = '';
            }
          } catch (parseError) {

            console.error("Error parsing function arguments:", parseError);
            // Provide sensible defaults based on function type
            if (funcName === 'fillInput') {
              funcArgs = { selector: { elementType: 'input' }, value: '' };
            } else if (['clickElement', 'submitForm'].includes(funcName)) {
              funcArgs = { selector: { elementType: funcName === 'submitForm' ? 'form' : 'button' } };
            } else {
              funcArgs = {};
            }
          }
          
          const funcId = toolCall.id;
          
          console.log(`Executing function ${funcName} with args:`, funcArgs);
          
          // Type assertion to access functions with string index
          const typedFunctions = functions as {[key: string]: Function};
          
          // Make sure the function exists
          if (!typedFunctions[funcName]) {
            throw new Error(`Function ${funcName} not found`);
          }
          
          // Execute the function
          let funcRes;
          if (Object.keys(funcArgs).length === 0) {
            funcRes = await typedFunctions[funcName]();
          } else {
            funcRes = await typedFunctions[funcName](funcArgs);
          }
          
          console.log(`Function ${funcName} result:`, funcRes);
          
          // Add tool response as a message
          messages.push({
            role: "tool",
            tool_call_id: funcId,
            content: typeof funcRes === 'string' ? funcRes : JSON.stringify(funcRes),
          });
        } catch (toolError) {
          console.error("Error executing tool call:", toolError);
          // Add error response for this specific tool
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: `Error: ${toolError instanceof Error ? toolError.message : 'Unknown error'}`,
          });
        }
      }
      
      // Get the next response after processing tool calls
      try {
        const followUpCompletion = await client.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: messages,
          tools: typedTools,
          tool_choice: "auto",
        });
        
        choice = followUpCompletion.choices[0];
        finalResponse = choice.message.content;
        
        // If we get more tool calls, continue the loop
        if (choice.finish_reason !== "tool_calls") {
          // If no more tool calls, add the final assistant message to the conversation
          messages.push(choice.message);
        }
      } catch (followUpError) {
        console.error("Error getting follow-up completion:", followUpError);
        finalResponse = "I encountered an error while trying to complete that action. Please try again.";
        break;
      }
    }

    // Return the final response
    return finalResponse || "I've processed your request.";
  } catch (error) {
    console.error("Error in streamOpenAI:", error);
    return `I'm sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}