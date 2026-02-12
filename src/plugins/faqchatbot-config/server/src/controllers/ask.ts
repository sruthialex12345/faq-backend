

// import OpenAI from "openai";
// import type { ChatCompletionTool } from "openai/resources/chat/completions";
// import { PassThrough } from "stream";

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY!,
// });

// // --- HELPER FUNCTIONS ---

// // Changed type 'Strapi' to 'any' to fix the TS error
// async function getActiveCollections(strapi: any) {
//   try {
//     console.log("🔍 [DEBUG] Fetching active collections...");
//     const pluginStore = strapi.store({
//       environment: null,
//       type: "plugin",
//       name: "faqchatbot-config",
//     });

//     const settings = await pluginStore.get({ key: "collections" });
//     console.log("🔍 [DEBUG] Plugin settings fetched:", settings);

//     if (!settings) return [];

//     const activeList = [];
//     for (const item of settings) {
//       const ignored = ["faq", "faqitem", "item"];
//       const name = item.name.toLowerCase();

//      const hasEnabledFields = item.fields?.some((f: any) => f.enabled);

// if (!hasEnabledFields || ignored.includes(name)) {
//   console.log(`   - Skipping '${item.name}' (no enabled fields)`);
//   continue;
// }


//       const uid = `api::${item.name}.${item.name}`;
//       const contentType = strapi.contentTypes[uid];

//       if (!contentType) {
//         console.warn(`⚠️ [WARNING] Content type not found for UID: ${uid}`);
//         continue;
//       }

//       const fields = Object.keys(contentType.attributes).filter((key) => {
//         const attr = contentType.attributes[key];
//         return [
//           "string", "text", "email", "uid", "richtext", "enumeration",
//           "integer", "biginteger", "decimal", "float", "date", "datetime",
//           "time", "relation"
//         ].includes(attr.type);
//       });

//       console.log(`   + Adding '${item.name}' with fields:`, fields);
//       activeList.push({ name: item.name, fields: fields });
//     }

//     console.log("✅ [DEBUG] Final active collections:", activeList);
//     return activeList;
//   } catch (err) {
//     console.error("❌ [ERROR] Error loading active collections:", err);
//     return [];
//   }
// }

// const TOOLS: ChatCompletionTool[] = [
//   {
//     type: "function",
//     function: {
//       name: "realtime_query",
//       description: "Plan a Strapi query using filters and sort",
//       parameters: {
//         type: "object",
//         properties: {
//           intent: { type: "string", enum: ["realtime", "faq"] },
//           collection: { type: "string" },
//           filters: {
//             type: "object",
//             additionalProperties: true,
//           },
//           sort: {
//             type: "array",
//             items: { type: "string" },
//           },
//         },
//         required: ["intent"],
//       },
//     },
//   },
// ];

// async function rephraseQuestion(history: any[], question: string) {
//   if (!history || !Array.isArray(history) || history.length === 0) {
//     console.log("REWRITE: skipped (no history)");
//     return question;
//   }
//   try {
//     const response = await openai.chat.completions.create({
//       model: "gpt-4o-mini",
//       temperature: 0,
//       messages: [
//         {
//           role: "system",
//           content: `You are a Search Query Optimizer.
//         Your task is to determine if the user's new message is a **Follow-up** or a **New Topic** and if a follow-up just rewrite the question .
//         Do NOT return any explanations, only the optimized search string.

//         ### RULES
//         1. **Dependency Check (The "Pronoun" Rule):**
//            - ONLY combine with history if the new question contains **Pronouns** ("it", "that", "they") or is **Grammatically Incomplete** ("How much?", "Where do I buy?", "Is it refundable?").
           
//         2. **Independence Check (The "Specifics" Rule):**
//            - If the user asks a complete question containing a **New Specific Noun** or **Scenario** (e.g., "Group of 7 people", "Booking for pets"), treat it as a **Standalone Query**.
//            - **Do NOT** attach the previous topic to it.
//            - *Example:* History="Commuter Pass", Input="Can I book for a group of 7?" -> Output="Group booking for 7 people" (Correct).
//            - *Bad Output:* "Group booking for Commuter Pass" (Incorrect).

//         3. **Output:**
//            - Return ONLY the optimized search string.`
//         },
//         ...history.slice(-4),
//         { role: "user", content: question },
//       ],
//     });
//     const rewritten = response.choices[0].message.content?.trim();
//     console.log(`REWRITE: "${question}" → "${rewritten}"`);
//     return rewritten || question;
//   } catch {
//     return question;
//   }
// }

// function sanitizeFilters(filters: any): any {
//   if (!filters || typeof filters !== "object") return filters;

//   if (Array.isArray(filters)) {
//     return filters.map(sanitizeFilters);
//   }

//   const operators = [
//     "eq", "ne", "lt", "gt", "lte", "gte", "in", "notIn", "contains",
//     "notContains", "containsi", "notContainsi", "null", "notNull",
//     "between", "startsWith", "endsWith", "or", "and", "not"
//   ];

//   const newFilters: any = {};

//   for (const key in filters) {
//     let newKey = key;
//     if (operators.includes(key) && !key.startsWith("$")) {
//       newKey = `$${key}`;
//     }
    
//     newFilters[newKey] = sanitizeFilters(filters[key]);
//   }

//   return newFilters;
// }

// // Changed type 'Strapi' to 'any'
// async function handleRealtime(ctx: any, strapi: any, plan: any, activeCollections: any) {
//   console.log(" REALTIME HANDLER");
//   console.log(" RAW PLAN:", JSON.stringify(plan, null, 2));

//   const sanitizedFilters = sanitizeFilters(plan.filters || {});
//   console.log(" SANITIZED FILTERS:", JSON.stringify(sanitizedFilters, null, 2));

//   const config = activeCollections.find((c: any) => c.name === plan.collection);
//   if (!config) return false;

//   const uid = `api::${plan.collection}.${plan.collection}`;

//   const result = await strapi.entityService.findMany(uid, {
//     filters: sanitizedFilters,
//     sort: plan.sort,
//     limit: 10,
//   });

//   ctx.body = {
//     type: "collection",
//     title: plan.collection,
//     schema: config.fields,
//     items: result.map((row: any) => {
//       const clean: any = {};
//       for (const f of config.fields) clean[f] = row[f];
//       return clean;
//     }),
//   };

//   return true;
// }

// // Changed type 'Strapi' to 'any'
// async function handleFAQ(ctx: any, question: string, strapi: any) {
//   console.log("FAQ QUESTION:", question);
//   const embedding = await openai.embeddings.create({
//     model: "text-embedding-3-small",
//     input: question,
//   });
//   const vector = embedding.data[0].embedding;
//   const knex = strapi.db.connection;
  
//   const results = await knex("chatbot_config_faqqas")
//     .select(
//       "answer",
//       knex.raw("(embedding <=> ?::vector) AS distance", [
//         JSON.stringify(vector),
//       ])
//     )
//     .whereNotNull("published_at")
//     .orderByRaw("embedding <=> ?::vector", [JSON.stringify(vector)])
//     .limit(3);

//   if (!results.length || results[0].distance > 0.85) {
//     ctx.body = { type: "text", content: "Answer not available." };
//     return;
//   }
//   const contextBlock = results.map((r: any) => r.answer).join("\n---\n");
//   let lastAssistantMessage = "None";
//   const history = ctx.request.body.history || [];
//   if (Array.isArray(history)) {
//     const last = [...history].reverse().find((m) => m.role === "assistant");
//     if (last?.content) lastAssistantMessage = last.content;
//   }
//   ctx.set({
//     "Content-Type": "text/event-stream",
//     "Cache-Control": "no-cache",
//     "Connection": "keep-alive",
//     "X-Accel-Buffering": "no",
//   });
//   ctx.status = 200;
//   // @ts-ignore
//   ctx.res.socket?.setNoDelay(true);
//   const stream = new PassThrough();
//   ctx.body = stream;
//   const send = (data: any) => {
//     stream.write(`data: ${JSON.stringify(data)}\n\n`);
//     // @ts-ignore
//     (ctx.res as any).flush?.();
//   };
//   const completion = await openai.chat.completions.create({
//     model: "gpt-4o-mini",
//     temperature: 0.3,
//     stream: true,
//     messages: [
//       {
//         role: "system",
//         content: `
// ### ROLE
// You are a specialized Knowledge-Base Assistant acting as a plugin for this website.
// ### CORE INSTRUCTIONS
// 1. **Source of Truth:** Use the [CONTEXT] below.
// 2. **Smart Inference:** Correct typos and infer intent.
// 3. **Semantic Flexibility:** If user asks broadly (e.g., "Policy") and the context has specifics, synthesize the answer.
// ### RESPONSE LOGIC
// * **CASE A: Yes/No Questions**
//   * Output: Exactly ONE single sentence.
//   * Start with "Yes," or "No," and include the rule from context.
// * **CASE B: Quantitative Questions**
//   * Output: Exactly ONE single sentence with the value.
// * **CASE C: General / Explanatory**
//   * Output: Direct answer followed by details.
// ### DATABASE CONTEXT
// ${contextBlock}
// ### LAST ASSISTANT MESSAGE (Conversation memory)
// "${lastAssistantMessage}"
// ### CURRENT USER INPUT
// Original: "${question}"
//         `.trim(),
//       },
//       { role: "user", content: question },
//     ],
//   });
//   for await (const chunk of completion) {
//     const token = chunk.choices[0]?.delta?.content;
//     if (token) send({ type: "token", value: token });
//   }
//   send({ type: "done" });
//   stream.end();
// }

// // --- MAIN CONTROLLER EXPORT ---
// // Replaced { strapi: Strapi } with { strapi: any }
// export default ({ strapi }: { strapi: any }) => ({
//   async ask(ctx: any) {
//     const { question, history = [] } = ctx.request.body;
//     console.log("QUESTION:", question);

//     try {
//       const activeCollections = await getActiveCollections(strapi);

//       if (!activeCollections || activeCollections.length === 0) {
//         console.log("⚠️ [WARNING] No active collections found. Falling back to FAQ.");
//         const rewritten = await rephraseQuestion(history, question);
//         await handleFAQ(ctx, rewritten, strapi);
//         return;
//       }

//       console.log("🔍 [DEBUG] Active collections:", JSON.stringify(activeCollections, null, 2));

//       const completion = await openai.chat.completions.create({
//         model: "gpt-4o-mini",
//         temperature: 0,
//         tools: TOOLS,
//         tool_choice: "auto",
//         messages: [
//           {
//             role: "system",
//             content: `
// You are a STRICT query planner.

// MANDATORY RULES:
// - You MUST classify the intent as "realtime" if the user mentions:
//   - locations (e.g., "to Paris," "from New York")
//   - availability (e.g., "is there a flight")
//   - price or budget constraints (e.g., "under $500")
// - Use "faq" intent ONLY if the question is about general information or policies.
// - NEVER classify as "faq" if the user asks about availability, schedules, or real-time data.
// - You MUST extract filters if the user mentions:
//   - locations (from / to / origin / destination)
//   - price / budget / under / above / less than / more than
// - NEVER ignore constraints mentioned by the user
// - If intent is "realtime" and constraints exist:
//   - filters MUST be non-empty
// - Use:
//   - $containsi for text
//   - $lt / $gt / $between for numbers
//   - $or for alternatives
// - Use sort ONLY when ranking is requested
// - ONLY use empty filters {} if the user explicitly asks "show all"

// ------------------------------------------------
// LOCATION NORMALIZATION (CRITICAL)
// ------------------------------------------------
// The database stores locations in the format:
//     City Name (AIRPORT_CODE)

// Examples:
// - "Kochi (COK)"
// - "Chennai (MAA)"
// - "Delhi Indira Gandhi International (DEL)"
// - "Paris Orly (ORY)"

// Before producing any filters, you must normalize all user-provided locations to match this format.

// ------------------------------------------------
// ### 1. Airport Codes & Abbreviations
// If the user provides an airport code (e.g., "COK", "MAA", "JFK", "LHR", "DXB"),
// you must search for that code inside parentheses.

// Example:
// User: "flight from COK to MAA"
// → origin $containsi "COK"
// → destination $containsi "MAA"

// ------------------------------------------------
// ### 2. City Names & Aliases
// If the user provides a city name, historical name, or local spelling,
// you must search by the city name portion of the field.

// Examples:
// - "Bombay" → "Mumbai"
// - "Madras" → "Chennai"
// - "Cochin" → "Kochi"
// - "NYC" → "New York"
// - "LA" → "Los Angeles"

// Example:
// User: "flight from Cochin to Madras"
// → origin $containsi "Kochi"
// → destination $containsi "Chennai"

// ------------------------------------------------
// ### 3. Suburbs, Towns & Rural Places
// If the user provides a place that does not have an international airport,
// map it to the nearest major airport city.
// Then search using that city's name.

// Examples:
// - "Brooklyn" → "New York"
// - "Noida" → "Delhi"
// - "Kollam" → "Trivandrum"
// - "Alappuzha" → "Kochi"

// Example:
// User: "flight from Kollam to Paris"
// → origin $containsi "Trivandrum"
// → destination $containsi "Paris"

// ------------------------------------------------
// ### 4. Always Match Against Stored Strings
// Filters must be designed to match the database strings.
// You may use either:
// - the city name part  
// - or the airport code part  
// whichever is more precise for the user's input.

// Never output raw user input unless it matches the database format.

// ------------------------------------------------
// Available collections:
// ${JSON.stringify(activeCollections, null, 2)}
// Return ONLY via function call.
// `.trim(),
//           },
//           { role: "user", content: question },
//         ],
//       });

//       console.log("🔍 [DEBUG] Completion response:", JSON.stringify(completion.choices[0]?.message, null, 2));

//       const toolCall = completion.choices[0].message.tool_calls?.[0];
//       if (!toolCall || toolCall.type !== "function") {
//         console.log("⚠️ [WARNING] No tool call detected. Falling back to FAQ.");
//         const rewritten = await rephraseQuestion(history, question);
//         await handleFAQ(ctx, rewritten, strapi);
//         return;
//       }

//       const plan = JSON.parse(toolCall.function.arguments);
//       console.log("AI PLAN:", plan);

//       if (plan.intent === "realtime") {
//         const handled = await handleRealtime(ctx, strapi, plan, activeCollections);
//         if (handled) return;
//       }

//       const rewritten = await rephraseQuestion(history, question);
//       await handleFAQ(ctx, rewritten, strapi);
//     } catch (err) {
//       console.error("❌ [ERROR] Error in ask controller:", err);
//       ctx.body = { type: "text", content: "An error occurred while processing your request." };
//     }
//   },
// });



// import OpenAI from "openai";
// import type { ChatCompletionTool } from "openai/resources/chat/completions";
// import { PassThrough } from "stream";

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY!,
// });
// async function getActiveCollections(strapi: any) {
//   try {
//     console.log(" [DEBUG] Fetching active collections...");
//     const pluginStore = strapi.store({
//       environment: null,
//       type: "plugin",
//       name: "faqchatbot-config",
//     });
//     const settings = await pluginStore.get({ key: "collections" });
//     console.log(" [DEBUG] Plugin settings fetched:", settings);
//     if (!settings) return [];

//     const activeList = [];
//     for (const item of settings) {
//       const ignored = ["faqitem", "item"];
//       const name = item.name.toLowerCase();

//      const hasEnabledFields = item.fields?.some((f: any) => f.enabled);

// if (!hasEnabledFields || ignored.includes(name)) {
//   console.log(`   - Skipping '${item.name}' (no enabled fields)`);
//   continue;
// }


//       const uid = `api::${item.name}.${item.name}`;
//       const contentType = strapi.contentTypes[uid];

//       if (!contentType) {
//         console.warn(` [WARNING] Content type not found for UID: ${uid}`);
//         continue;
//       }

//       const fields = Object.keys(contentType.attributes).filter((key) => {
//         const attr = contentType.attributes[key];
//         return [
//           "string", "text", "email", "uid", "richtext", "enumeration",
//           "integer", "biginteger", "decimal", "float", "date", "datetime",
//           "time", "relation"
//         ].includes(attr.type);
//       });

//       console.log(`   + Adding '${item.name}' with fields:`, fields);
//       activeList.push({ name: item.name, fields: fields });
//     }

//     console.log(" [DEBUG] Final active collections:", activeList);
//     return activeList;
//   } catch (err) {
//     console.error(" [ERROR] Error loading active collections:", err);
//     return [];
//   }
// }

// const TOOLS: ChatCompletionTool[] = [
//   {
//     type: "function",
//     function: {
//       name: "realtime_query",
//       description: "Plan a Strapi query using filters and sort",
//       parameters: {
//         type: "object",
//         properties: {
//           intent: { type: "string", enum: ["realtime", "faq"] },
//           collection: { type: "string" },
//           filters: {
//             type: "object",
//             additionalProperties: true,
//           },
//           sort: {
//             type: "array",
//             items: { type: "string" },
//           },
//         },
//         required: ["intent"],
//       },
//     },
//   },
// ];

// async function rephraseQuestion(history: any[], question: string) {
//   if (!history || !Array.isArray(history) || history.length === 0) {
//     console.log("REWRITE: skipped (no history)");
//     return question;
//   }
//   try {
//     const response = await openai.chat.completions.create({
//       model: "gpt-4o-mini",
//       temperature: 0,
//       messages: [
//         {
//           role: "system",
//           content: `You are a Search Query Optimizer.
//         Your task is to determine if the user's new message is a **Follow-up** or a **New Topic** and if a follow-up just rewrite the question .
//         Do NOT return any explanations, only the optimized search string.

//         ### RULES
//         1. **Dependency Check (The "Pronoun" Rule):**
//            - ONLY combine with history if the new question contains **Pronouns** ("it", "that", "they") or is **Grammatically Incomplete** ("How much?", "Where do I buy?", "Is it refundable?").
           
//         2. **Independence Check (The "Specifics" Rule):**
//            - If the user asks a complete question containing a **New Specific Noun** or **Scenario** (e.g., "Group of 7 people", "Booking for pets"), treat it as a **Standalone Query**.
//            - **Do NOT** attach the previous topic to it.
//            - *Example:* History="Commuter Pass", Input="Can I book for a group of 7?" -> Output="Group booking for 7 people" (Correct).
//            - *Bad Output:* "Group booking for Commuter Pass" (Incorrect).

//         3. **Output:**
//            - Return ONLY the optimized search string.`
//         },
//         ...history.slice(-4),
//         { role: "user", content: question },
//       ],
//     });
//     const rewritten = response.choices[0].message.content?.trim();
//     console.log(`REWRITE: "${question}" → "${rewritten}"`);
//     return rewritten || question;
//   } catch {
//     return question;
//   }
// }

// function sanitizeFilters(filters: any): any {
//   if (!filters || typeof filters !== "object") return filters;

//   if (Array.isArray(filters)) {
//     return filters.map(sanitizeFilters);
//   }

//   const operators = [
//     "eq", "ne", "lt", "gt", "lte", "gte", "in", "notIn", "contains",
//     "notContains", "containsi", "notContainsi", "null", "notNull",
//     "between", "startsWith", "endsWith", "or", "and", "not"
//   ];

//   const newFilters: any = {};

//   for (const key in filters) {
//     let newKey = key;
//     if (operators.includes(key) && !key.startsWith("$")) {
//       newKey = `$${key}`;
//     }
    
//     newFilters[newKey] = sanitizeFilters(filters[key]);
//   }

//   return newFilters;
// }

// function updateJsonContext(prevContext: any, question: string) {
//   const MAX_HISTORY = 10;

//   const ctx = { ...(prevContext || {}) };

//   // Maintain history
//   ctx.history = Array.isArray(ctx.history) ? ctx.history : [];
//   ctx.history.push(question);
//   if (ctx.history.length > MAX_HISTORY) ctx.history.shift();

//   // Simple keyword extraction
//   const words = question
//     .toLowerCase()
//     .replace(/[^\w\s]/g, "")
//     .split(" ")
//     .filter((w) => w.length > 3);

//   ctx.keywords = [...new Set([...(ctx.keywords || []), ...words])];

//   ctx.lastQuestion = question;

//   return ctx;
// }


// async function handleRealtime(ctx: any, strapi: any, plan: any, activeCollections: any) {
//   console.log(" REALTIME HANDLER");
//   console.log(" RAW PLAN:", JSON.stringify(plan, null, 2));

//   const sanitizedFilters = sanitizeFilters(plan.filters || {});
//   console.log(" SANITIZED FILTERS:", JSON.stringify(sanitizedFilters, null, 2));

//   const config = activeCollections.find((c: any) => c.name === plan.collection);
//   if (!config) return false;

//   const uid = `api::${plan.collection}.${plan.collection}`;

//   const result = await strapi.entityService.findMany(uid, {
//     filters: sanitizedFilters,
//     sort: plan.sort,
//     limit: 10,
//   });

//   ctx.body = {
//     type: "collection",
//     title: plan.collection,
//     schema: config.fields,
//     items: result.map((row: any) => {
//       const clean: any = {};
//       for (const f of config.fields) clean[f] = row[f];
//       return clean;
//     }),
//   };

//   return true;
// }


// async function handleFAQ(ctx: any, question: string, strapi: any) {
//   console.log("FAQ QUESTION:", question);
//   const embedding = await openai.embeddings.create({
//     model: "text-embedding-3-small",
//     input: question,
//   });
//   const vector = embedding.data[0].embedding;
//   const knex = strapi.db.connection;
  
//   const results = await knex("chatbot_config_faqqas")
//     .select(
//       "answer",
//       knex.raw("(embedding <=> ?::vector) AS distance", [
//         JSON.stringify(vector),
//       ])
//     )
//     .whereNotNull("published_at")
//     .orderByRaw("embedding <=> ?::vector", [JSON.stringify(vector)])
//     .limit(3);

//   if (!results.length || results[0].distance > 0.85) {
//     ctx.body = { type: "text", content: "Answer not available." };
//     return;
//   }
//   const contextBlock = results.map((r: any) => r.answer).join("\n---\n");
//   let lastAssistantMessage = "None";
//   const history = ctx.request.body.history || [];
//   if (Array.isArray(history)) {
//     const last = [...history].reverse().find((m) => m.role === "assistant");
//     if (last?.content) lastAssistantMessage = last.content;
//   }
//   ctx.set({
//     "Content-Type": "text/event-stream",
//     "Cache-Control": "no-cache",
//     "Connection": "keep-alive",
//     "X-Accel-Buffering": "no",
//   });
//   ctx.status = 200;
 
//   ctx.res.socket?.setNoDelay(true);
//   const stream = new PassThrough();
//   ctx.body = stream;
//   const send = (data: any) => {
//     stream.write(`data: ${JSON.stringify(data)}\n\n`);
  
//     (ctx.res as any).flush?.();
//   };
//   const completion = await openai.chat.completions.create({
//     model: "gpt-4o-mini",
//     temperature: 0.3,
//     stream: true,
//     messages: [
//       {
//         role: "system",
//         content: `
// ### ROLE
// You are a specialized Knowledge-Base Assistant acting as a plugin for this website.
// ### CORE INSTRUCTIONS
// 1. **Source of Truth:** Use the [CONTEXT] below.
// 2. **Smart Inference:** Correct typos and infer intent.
// 3. **Semantic Flexibility:** If user asks broadly (e.g., "Policy") and the context has specifics, synthesize the answer.
// ### RESPONSE LOGIC
// * **CASE A: Yes/No Questions**
//   * Output: Exactly ONE single sentence.
//   * Start with "Yes," or "No," and include the rule from context.
// * **CASE B: Quantitative Questions**
//   * Output: Exactly ONE single sentence with the value.
// * **CASE C: General / Explanatory**
//   * Output: Direct answer followed by details.
// ### DATABASE CONTEXT
// ${contextBlock}
// ### LAST ASSISTANT MESSAGE (Conversation memory)
// "${lastAssistantMessage}"
// ### CURRENT USER INPUT
// Original: "${question}"
//         `.trim(),
//       },
//       { role: "user", content: question },
//     ],
//   });
//   for await (const chunk of completion) {
//     const token = chunk.choices[0]?.delta?.content;
//     if (token) send({ type: "token", value: token });
//   }
//   send({ type: "done" });
//   stream.end();
// }


// export default ({ strapi }: { strapi: any }) => ({
//   async ask(ctx: any) {
//     const { question, history = [] } = ctx.request.body;

//     let jsonContext = ctx.request.body.context || {};
// jsonContext = updateJsonContext(jsonContext, question);
// console.log(" JSON CONTEXT:", JSON.stringify(jsonContext, null, 2));

// ctx.set("X-User-Context", JSON.stringify(jsonContext));
//     console.log("QUESTION:", question);

//     try {
//       const activeCollections = await getActiveCollections(strapi);

//       if (!activeCollections || activeCollections.length === 0) {
//         console.log(" [WARNING] No active collections found. Falling back to FAQ.");
// const rewritten = await rephraseQuestion(history, question);
// await handleFAQ(ctx, rewritten, strapi);

//         return;
//       }

//       console.log(" [DEBUG] Active collections:", JSON.stringify(activeCollections, null, 2));

//       const completion = await openai.chat.completions.create({
//         model: "gpt-4o-mini",
//         temperature: 0,
//         tools: TOOLS,
//         tool_choice: "auto",
//         messages: [
//           {
//             role: "system",
//             content: `
// You are a STRICT query planner.

// MANDATORY RULES:
// - You MUST classify the intent as "realtime" if the user mentions:
//   - locations (e.g., "to Paris," "from New York")
//   - availability (e.g., "is there a flight")
//   - price or budget constraints (e.g., "under $500")
// - Use "faq" intent ONLY if the question is about general information or policies.
// - NEVER classify as "faq" if the user asks about availability, schedules, or real-time data.
// - You MUST extract filters if the user mentions:
//   - locations (from / to / origin / destination)
//   - price / budget / under / above / less than / more than
// - NEVER ignore constraints mentioned by the user
// - If intent is "realtime" and constraints exist:
//   - filters MUST be non-empty
// - Use:
//   - $containsi for text
//   - $lt / $gt / $between for numbers
//   - $or for alternatives
// - Use sort ONLY when ranking is requested
// - ONLY use empty filters {} if the user explicitly asks "show all"

// ------------------------------------------------
// LOCATION NORMALIZATION (CRITICAL)
// ------------------------------------------------
// The database stores locations in the format:
//     City Name (AIRPORT_CODE)

// Examples:
// - "Kochi (COK)"
// - "Chennai (MAA)"
// - "Delhi Indira Gandhi International (DEL)"
// - "Paris Orly (ORY)"

// Before producing any filters, you must normalize all user-provided locations to match this format.

// ------------------------------------------------
// ### 1. Airport Codes & Abbreviations
// If the user provides an airport code (e.g., "COK", "MAA", "JFK", "LHR", "DXB"),
// you must search for that code inside parentheses.

// Example:
// User: "flight from COK to MAA"
// → origin $containsi "COK"
// → destination $containsi "MAA"

// ------------------------------------------------
// ### 2. City Names & Aliases
// If the user provides a city name, historical name, or local spelling,
// you must search by the city name portion of the field.

// Examples:
// - "Bombay" → "Mumbai"
// - "Madras" → "Chennai"
// - "Cochin" → "Kochi"
// - "NYC" → "New York"
// - "LA" → "Los Angeles"

// Example:
// User: "flight from Cochin to Madras"
// → origin $containsi "Kochi"
// → destination $containsi "Chennai"

// ------------------------------------------------
// ### 3. Suburbs, Towns & Rural Places
// If the user provides a place that does not have an international airport,
// map it to the nearest major airport city.
// Then search using that city's name.

// Examples:
// - "Brooklyn" → "New York"
// - "Noida" → "Delhi"
// - "Kollam" → "Trivandrum"
// - "Alappuzha" → "Kochi"

// Example:
// User: "flight from Kollam to Paris"
// → origin $containsi "Trivandrum"
// → destination $containsi "Paris"

// ------------------------------------------------
// ### 4. Always Match Against Stored Strings
// Filters must be designed to match the database strings.
// You may use either:
// - the city name part  
// - or the airport code part  
// whichever is more precise for the user's input.

// Never output raw user input unless it matches the database format.

// ------------------------------------------------
// Available collections:
// ${JSON.stringify(activeCollections, null, 2)}
// Return ONLY via function call.
// `.trim(),
//           },
//           { role: "user", content: question },
//         ],
//       });

//       //console.log(" [DEBUG] Completion response:", JSON.stringify(completion.choices[0]?.message, null, 2));

//       const toolCall = completion.choices[0].message.tool_calls?.[0];
//       if (!toolCall || toolCall.type !== "function") {
//         console.log(" [WARNING] No tool call detected. Falling back to FAQ.");
//         const rewritten = await rephraseQuestion(history, question);
//         await handleFAQ(ctx, rewritten, strapi);
//         return;
//       }

//       const plan = JSON.parse(toolCall.function.arguments);
//       console.log("AI PLAN:", plan);

//       if (plan.intent === "realtime") {
//         const handled = await handleRealtime(ctx, strapi, plan, activeCollections);
//         if (handled) {

//   return;
// }
//       }

//       const rewritten = await rephraseQuestion(history, question);
//       await handleFAQ(ctx, rewritten, strapi);
//     } catch (err) {
//       console.error("[ERROR] Error in ask controller:", err);
//       ctx.body = { type: "text", content: "An error occurred while processing your request." };
//     }
//   },
// });






//now working
// import OpenAI from "openai";


// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY!,
// });
// async function getActiveCollections(strapi: any) {
//   try {
//     console.log(" [DEBUG] Fetching active collections...");
//     const pluginStore = strapi.store({
//       environment: null,
//       type: "plugin",
//       name: "faqchatbot-config",
//     });
//     const settings = await pluginStore.get({ key: "collections" });
//     console.log(" [DEBUG] Plugin settings fetched:", settings);
//     if (!settings) return [];

//     const activeList = [];
//     for (const item of settings) {
//       const ignored = ["faqitem", "item"];
//       const name = item.name.toLowerCase();

//      const hasEnabledFields = item.fields?.some((f: any) => f.enabled);

// if (!hasEnabledFields || ignored.includes(name)) {
//   console.log(`   - Skipping '${item.name}' (no enabled fields)`);
//   continue;
// }


//       const uid = `api::${item.name}.${item.name}`;
//       const contentType = strapi.contentTypes[uid];

//       if (!contentType) {
//         console.warn(` [WARNING] Content type not found for UID: ${uid}`);
//         continue;
//       }

//       const fields = Object.keys(contentType.attributes).filter((key) => {
//         const attr = contentType.attributes[key];
//         return [
//           "string", "text", "email", "uid", "richtext", "enumeration",
//           "integer", "biginteger", "decimal", "float", "date", "datetime",
//           "time", "relation"
//         ].includes(attr.type);
//       });

//       console.log(`   + Adding '${item.name}' with fields:`, fields);
//       activeList.push({ name: item.name, fields: fields });
//     }

//     console.log(" [DEBUG] Final active collections:", activeList);
//     return activeList;
//   } catch (err) {
//     console.error(" [ERROR] Error loading active collections:", err);
//     return [];
//   }
// }

// async function rephraseQuestion(history: any[], question: string) {
//   if (!history || !Array.isArray(history) || history.length === 0) {
//     console.log("REWRITE: skipped (no history)");
//     return question;
//   }
//   try {
//     const response = await openai.chat.completions.create({
//       model: "gpt-4o-mini",
//       temperature: 0,
//       messages: [
//         {
//           role: "system",
//           content: `You are a Search Query Optimizer.
//         Your task is to determine if the user's new message is a **Follow-up** or a **New Topic** and if a follow-up just rewrite the question .
//         Do NOT return any explanations, only the optimized search string.

//         ### RULES
//         1. **Dependency Check (The "Pronoun" Rule):**
//            - ONLY combine with history if the new question contains **Pronouns** ("it", "that", "they") or is **Grammatically Incomplete** ("How much?", "Where do I buy?", "Is it refundable?").
           
//         2. **Independence Check (The "Specifics" Rule):**
//            - If the user asks a complete question containing a **New Specific Noun** or **Scenario** (e.g., "Group of 7 people", "Booking for pets"), treat it as a **Standalone Query**.
//            - **Do NOT** attach the previous topic to it.
//            - *Example:* History="Commuter Pass", Input="Can I book for a group of 7?" -> Output="Group booking for 7 people" (Correct).
//            - *Bad Output:* "Group booking for Commuter Pass" (Incorrect).

//         3. **Output:**
//            - Return ONLY the optimized search string.`
//         },
//         ...history.slice(-4),
//         { role: "user", content: question },
//       ],
//     });
//     const rewritten = response.choices[0].message.content?.trim();
//     console.log(`REWRITE: "${question}" → "${rewritten}"`);
//     return rewritten || question;
//   } catch {
//     return question;
//   }
// }

// function sanitizeFilters(filters: any): any {
//   if (!filters || typeof filters !== "object") return filters;

//   if (Array.isArray(filters)) {
//     return filters.map(sanitizeFilters);
//   }

//   const operators = [
//     "eq", "ne", "lt", "gt", "lte", "gte", "in", "notIn", "contains",
//     "notContains", "containsi", "notContainsi", "null", "notNull",
//     "between", "startsWith", "endsWith", "or", "and", "not"
//   ];

//   const newFilters: any = {};

//   for (const key in filters) {
//     let newKey = key;
//     if (operators.includes(key) && !key.startsWith("$")) {
//       newKey = `$${key}`;
//     }
    
//     newFilters[newKey] = sanitizeFilters(filters[key]);
//   }

//   return newFilters;
// }

// function updateJsonContext(prevContext: any, question: string) {
//   const MAX_HISTORY = 10;

//   const ctx = { ...(prevContext || {}) };

//   // Maintain history
//   ctx.history = Array.isArray(ctx.history) ? ctx.history : [];
//   ctx.history.push(question);
//   if (ctx.history.length > MAX_HISTORY) ctx.history.shift();

//   // Simple keyword extraction
//   const words = question
//     .toLowerCase()
//     .replace(/[^\w\s]/g, "")
//     .split(" ")
//     .filter((w) => w.length > 3);

//   ctx.keywords = [...new Set([...(ctx.keywords || []), ...words])];

//   ctx.lastQuestion = question;

//   return ctx;
// }


// async function searchRealtime(
//   strapi: any,
//   plan: any,
//   activeCollections: any
// ) {
//   console.log(" REALTIME SEARCH");
//   console.log(" PLAN:", JSON.stringify(plan, null, 2));

//   if (!plan || !plan.collection) {
//     console.log("No collection in plan");
//     return null;
//   }

//   const sanitizedFilters = sanitizeFilters(plan.filters || {});
//   console.log(" SANITIZED FILTERS:", JSON.stringify(sanitizedFilters, null, 2));

//   const config = activeCollections.find(
//     (c: any) => c.name === plan.collection
//   );

//   if (!config) {
//     console.log("Collection not active");
//     return null;
//   }

//   const uid = `api::${plan.collection}.${plan.collection}`;

//   try {
//     // COUNT OPERATION
//     if (plan.operation === "count") {
//       const count = await strapi.entityService.count(uid, {
//         filters: sanitizedFilters,
//       });

//       return {
//         type: "count",
//         collection: plan.collection,
//         value: count,
//       };
//     }

//     // LIST / SEARCH OPERATION
//     const result = await strapi.entityService.findMany(uid, {
//       filters: sanitizedFilters,
//       sort: plan.sort,
//       limit: 10,
//     });

//     const cleaned = result.map((row: any) => {
//       const clean: any = {};
//       for (const f of config.fields) clean[f] = row[f];
//       return clean;
//     });

//     return {
//       type: "list",
//       collection: plan.collection,
//       schema: config.fields,
//       items: cleaned,
//     };
//   } catch (err) {
//     console.error("Realtime search error:", err);
//     return null;
//   }
// }



// async function searchFAQ(question: string, strapi: any) {
//   console.log("FAQ SEARCH:", question);

//   // 1. Create embedding
//   const embedding = await openai.embeddings.create({
//     model: "text-embedding-3-small",
//     input: question,
//   });

//   const vector = embedding.data[0].embedding;
//   const knex = strapi.db.connection;

//   // 2. Vector similarity search
//   const results = await knex("chatbot_config_faqqas")
//     .select(
//       "answer",
//       knex.raw("(embedding <=> ?::vector) AS distance", [
//         JSON.stringify(vector),
//       ])
//     )
//     .whereNotNull("published_at")
//     .orderByRaw("embedding <=> ?::vector", [JSON.stringify(vector)])
//     .limit(3);

//   // 3. If nothing useful
//   if (!results.length || results[0].distance > 0.85) {
//     console.log("FAQ: No good match");
//     return [];
//   }

//   // 4. Return only answers
//   const answers = results.map((r: any) => r.answer);
//   console.log("FAQ MATCHES:", answers.length);

//   return answers;
// }

// async function simplePlanner(
//   question: string,
//   activeCollections: any[]
// ) {
//   console.log("🧠 AI PLANNER QUESTION:", question);

//   const response = await openai.chat.completions.create({
//     model: "gpt-4o-mini",
//     temperature: 0,
//     messages: [
//       {
//         role: "system",
//         content: `
// You are a STRICT database query planner that converts user questions into Strapi query JSON.

// --------------------------------
// CORE TASK
// --------------------------------
// Return ONLY valid JSON. No text. No explanation.

// --------------------------------
// COLLECTION SELECTION
// --------------------------------
// - Choose the most relevant collection from the available list.
// - Never invent collection names.

// --------------------------------
// FIELD RULES
// --------------------------------
// - Only use fields that exist in the selected collection schema.
// - Never hallucinate fields.

// --------------------------------
// TEXT FILTER RULES (VERY IMPORTANT)
// --------------------------------
// - For city names, titles, destinations, names → ALWAYS use "containsi"
// - NEVER use "eq" for text
// - NEVER use "in" for text arrays
// - For multiple text values use "$or" with containsi

// Example:
// User: "flight to paris or amsterdam"
// Filters:
// {
//   "$or": [
//     { "destination": { "containsi": "paris" } },
//     { "destination": { "containsi": "amsterdam" } }
//   ]
// }

// --------------------------------
// NUMBER FILTER RULES
// --------------------------------
// - For price, fare, amount → use lt, lte, gt, gte, between
// - "under" → lte
// - "above" → gte
// - "between" → between

// --------------------------------
// OPERATION RULES
// --------------------------------
// - "how many", "count" → operation = "count"
// - otherwise → operation = "list"

// --------------------------------
// SORT RULES
// --------------------------------
// - "cheapest", "lowest" → sort ["fare:asc"]
// - "highest", "expensive" → sort ["fare:desc"]
// - Only add sort if user implies ranking

// --------------------------------
// INTENT CLASSIFICATION (CRITICAL)
// --------------------------------
// First decide intent:

// INTENT = "realtime"
// - User asks about availability, price, list, count, search, show items
// - Mentions data stored in collections

// INTENT = "faq"
// - User asks "who is", "what is", "explain", "details about"
// - General knowledge
// - No clear database entity

// If no clear database match → ALWAYS choose "faq"
// NEVER force a collection.

// OUTPUT FORMAT

// Return ONLY JSON.

// If no database match exists, return:

// {
//   "collection": null
// }

// Otherwise return:

// {
//   "collection": "name",
//   "operation": "list" | "count",
//   "filters": {},
//   "sort": []
// }


// --------------------------------
// AVAILABLE COLLECTIONS
// --------------------------------
// ${JSON.stringify(activeCollections, null, 2)}
// `
//       },
//       {
//         role: "user",
//         content: question
//       }
//     ]
//   });

//   try {
//     const raw = response.choices[0].message.content || "{}";

//     // Safety cleanup in case model adds ```json
//     const cleaned = raw
//       .replace(/```json/g, "")
//       .replace(/```/g, "")
//       .trim();

//     const plan = JSON.parse(cleaned);

//     console.log("🧠 AI PLAN:", JSON.stringify(plan, null, 2));
//     return plan;
//   } catch (err) {
//     console.log("❌ Planner JSON parse failed");
//     return null;
//   }
// }

// async function realtimeInterpreterAI(question: string, realtimeData: any) {
//   if (!realtimeData) return null;

//   console.log("🧩 REALTIME AI INPUT:", JSON.stringify(realtimeData, null, 2));

//   const response = await openai.chat.completions.create({
//     model: "gpt-4o-mini",
//     temperature: 0.2,
//     messages: [
//       {
//         role: "system",
//         content: `
// You are a realtime data interpreter.

// Convert database JSON into a SHORT natural language summary.

// Rules:
// - Do NOT output JSON
// - Do NOT hallucinate
// - If count → say number
// - If list → summarize important fields only
// - Max 3–4 lines
// `
//       },
//       {
//         role: "user",
//         content: `
// QUESTION: ${question}

// REALTIME DATA:
// ${JSON.stringify(realtimeData)}
// `
//       }
//     ]
//   });

//   const text = response.choices[0].message.content;
//   console.log("🧠 REALTIME AI OUTPUT:", text);

//   return text;
// }

// async function finalAggregator(question: string, faq: any, realtime: any) {
//    // 🔍 ADD LOGS HERE
//   console.log("AGG INPUT QUESTION:", question);
//   console.log("AGG INPUT REALTIME:", JSON.stringify(realtime, null, 2));
//   const response = await openai.chat.completions.create({
//     model: "gpt-4o-mini",
//     temperature: 0.3,
//     messages: [
//       {
//         role: "system",
//         content: `
// You are an intelligent AI Assistant for a website chatbot.

// You receive:
// 1. FAQ semantic answers (knowledge base)
// 2. Realtime database results (lists or counts)
// 3. Conversation memory
// 4. User question

// Your job is to generate the FINAL HUMAN-FRIENDLY ANSWER.

// --------------------------------
// CORE BEHAVIOR
// --------------------------------
// - Always answer naturally like a human assistant.
// - Never show raw JSON or database format.
// - Correct typos and infer user intent.
// - Use conversation memory when needed.
// - Prefer realtime data when available because it is more accurate.
// - Use FAQ when realtime is empty or unclear.

// --------------------------------
// ANSWER LOGIC
// --------------------------------

// CASE 1 — REALTIME COUNT
// If realtime type is "count":
// - Return ONE sentence with the number.
// Example:
// "There are 5 flights available."

// CASE 2 — REALTIME LIST
// If realtime type is "list":
// - Show clean bullet or numbered list.
// - Use important fields only.
// - Do not exceed 10 items.
// - No JSON, only natural language.

// CASE 3 — FAQ ONLY
// If realtime is null or empty:
// - Use FAQ answer.
// - Be concise but informative.
// - For Yes/No questions → one sentence starting with Yes or No.
// - For quantity questions → one sentence with value.
// - For general questions → direct answer + short explanation.

// CASE 4 — BOTH FAQ + REALTIME
// If both exist:
// - Use realtime as main answer.
// - Use FAQ only as supporting sentence if helpful.
// - Do not repeat information.

// CASE 5 — NOTHING FOUND
// If both FAQ and realtime are empty:
// - Say politely that information is not available.

// --------------------------------
// FORMATTING RULES
// --------------------------------
// - No markdown tables.
// - No technical terms like "collection", "schema", "JSON".
// - No hallucinations.
// - No unnecessary emojis.
// - Max 5–6 lines unless listing items.

// --------------------------------
// MEMORY USAGE
// --------------------------------
// - If user previously asked related question, connect answers.
// - Do not repeat entire history.

// --------------------------------
// FINAL GOAL
// --------------------------------
// Provide the most accurate, concise, and helpful final response using FAQ + realtime + memory together.

// `
//       },
//       {
//         role: "user",
//         content: `
// QUESTION: ${question}

// FAQ:
// ${JSON.stringify(faq)}

// REALTIME:
// ${JSON.stringify(realtime)}
// `
//       }
//     ]
//   });

//   return response.choices[0].message.content;
// }


// export default ({ strapi }: { strapi: any }) => ({
//   async ask(ctx: any) {
//     const { question, history = [] } = ctx.request.body;

//     let jsonContext = ctx.request.body.context || {};
// jsonContext = updateJsonContext(jsonContext, question);
// console.log(" JSON CONTEXT:", JSON.stringify(jsonContext, null, 2));

// ctx.set("X-User-Context", JSON.stringify(jsonContext));
//     console.log("QUESTION:", question);

//     try {
//   const activeCollections = await getActiveCollections(strapi);

//   if (!activeCollections || activeCollections.length === 0) {
//     console.log("No active collections");
//   }

//   const rewritten = await rephraseQuestion(history, question);
//   console.log("🧠 REWRITTEN QUESTION:", rewritten);

//   // FAQ
//   const faqResults = await searchFAQ(rewritten, strapi);
//   console.log("📚 FAQ RESULTS:", JSON.stringify(faqResults, null, 2));

//   // PLAN
//   const plan = await simplePlanner(rewritten, activeCollections);
//   console.log("📌 PLANNER RESULT:", JSON.stringify(plan, null, 2));

//   // REALTIME
// // REALTIME
// let realtimeResults = null;
// let realtimeAIText = null;

// if (plan && plan.collection) {
//   realtimeResults = await searchRealtime(strapi, plan, activeCollections);
//   console.log("⚡ REALTIME RESULTS:", JSON.stringify(realtimeResults, null, 2));

//   realtimeAIText = await realtimeInterpreterAI(
//     rewritten,
//     realtimeResults
//   );
// } else {
//   console.log("🟡 Planner chose FAQ path — realtime skipped");
// }


//   // FINAL AI
// const finalAnswer = await finalAggregator(
//   rewritten,
//   faqResults,
//   realtimeAIText   // ← IMPORTANT CHANGE
// );
//   console.log("🤖 FINAL ANSWER:", finalAnswer);

//   ctx.body = {
//     type: "text",
//     content: finalAnswer,
//   };

// } catch (err) {
//   console.error("[ERROR]", err);
//   ctx.body = { type: "text", content: "Error occurred." };
// }
//   },
// });




//tested
// import OpenAI from "openai";


// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY!,
// });
// async function getActiveCollections(strapi: any) {
//   try {
//     console.log(" [DEBUG] Fetching active collections...");
//     const pluginStore = strapi.store({
//       environment: null,
//       type: "plugin",
//       name: "faqchatbot-config",
//     });
//     const settings = await pluginStore.get({ key: "collections" });
//     console.log(" [DEBUG] Plugin settings fetched:", settings);
//     if (!settings) return [];

//     const activeList = [];
//     for (const item of settings) {
//       const ignored = ["faqitem", "item"];
//       const name = item.name.toLowerCase();

//      const hasEnabledFields = item.fields?.some((f: any) => f.enabled);

// if (!hasEnabledFields || ignored.includes(name)) {
//   console.log(`   - Skipping '${item.name}' (no enabled fields)`);
//   continue;
// }


//       const uid = `api::${item.name}.${item.name}`;
//       const contentType = strapi.contentTypes[uid];

//       if (!contentType) {
//         console.warn(` [WARNING] Content type not found for UID: ${uid}`);
//         continue;
//       }

//       const fields = Object.keys(contentType.attributes).filter((key) => {
//         const attr = contentType.attributes[key];
//         return [
//           "string", "text", "email", "uid", "richtext", "enumeration",
//           "integer", "biginteger", "decimal", "float", "date", "datetime",
//           "time", "relation"
//         ].includes(attr.type);
//       });

//       console.log(`   + Adding '${item.name}' with fields:`, fields);
//       activeList.push({ name: item.name, fields: fields });
//     }

//     console.log(" [DEBUG] Final active collections:", activeList);
//     return activeList;
//   } catch (err) {
//     console.error(" [ERROR] Error loading active collections:", err);
//     return [];
//   }
// }

// async function rephraseQuestion(history: any[], question: string) {
//   if (!history || !Array.isArray(history) || history.length === 0) {
//     console.log("REWRITE: skipped (no history)");
//     return question;
//   }
//   try {
//     const response = await openai.chat.completions.create({
//       model: "gpt-4o-mini",
//       temperature: 0,
//       messages: [
//         {
//           role: "system",
//           content: `You are a Search Query Optimizer.
//         Your task is to determine if the user's new message is a **Follow-up** or a **New Topic** and if a follow-up just rewrite the question .
//         Do NOT return any explanations, only the optimized search string.

//         ### RULES
//         1. **Dependency Check (The "Pronoun" Rule):**
//            - ONLY combine with history if the new question contains **Pronouns** ("it", "that", "they") or is **Grammatically Incomplete** ("How much?", "Where do I buy?", "Is it refundable?").
           
//         2. **Independence Check (The "Specifics" Rule):**
//            - If the user asks a complete question containing a **New Specific Noun** or **Scenario** (e.g., "Group of 7 people", "Booking for pets"), treat it as a **Standalone Query**.
//            - **Do NOT** attach the previous topic to it.
//            - *Example:* History="Commuter Pass", Input="Can I book for a group of 7?" -> Output="Group booking for 7 people" (Correct).
//            - *Bad Output:* "Group booking for Commuter Pass" (Incorrect).

//         3. **Output:**
//            - Return ONLY the optimized search string.`
//         },
//         ...history.slice(-4),
//         { role: "user", content: question },
//       ],
//     });
//     const rewritten = response.choices[0].message.content?.trim();
//     console.log(`REWRITE: "${question}" → "${rewritten}"`);
//     return rewritten || question;
//   } catch {
//     return question;
//   }
// }

// function sanitizeFilters(filters: any): any {
//   if (!filters || typeof filters !== "object") return filters;

//   if (Array.isArray(filters)) {
//     return filters.map(sanitizeFilters);
//   }

//   const operators = [
//     "eq", "ne", "lt", "gt", "lte", "gte", "in", "notIn", "contains",
//     "notContains", "containsi", "notContainsi", "null", "notNull",
//     "between", "startsWith", "endsWith", "or", "and", "not"
//   ];

//   const newFilters: any = {};

//   for (const key in filters) {
//     let newKey = key;
//     if (operators.includes(key) && !key.startsWith("$")) {
//       newKey = `$${key}`;
//     }
    
//     newFilters[newKey] = sanitizeFilters(filters[key]);
//   }

//   return newFilters;
// }

// function updateJsonContext(prevContext: any, question: string) {
//   const MAX_HISTORY = 10;

//   const ctx = { ...(prevContext || {}) };

//   // Maintain history
//   ctx.history = Array.isArray(ctx.history) ? ctx.history : [];
//   ctx.history.push(question);
//   if (ctx.history.length > MAX_HISTORY) ctx.history.shift();

//   // Simple keyword extraction
//   const words = question
//     .toLowerCase()
//     .replace(/[^\w\s]/g, "")
//     .split(" ")
//     .filter((w) => w.length > 3);

//   ctx.keywords = [...new Set([...(ctx.keywords || []), ...words])];

//   ctx.lastQuestion = question;

//   return ctx;
// }


// async function searchRealtime(
//   strapi: any,
//   plan: any,
//   activeCollections: any
// ) {
//   console.log(" REALTIME SEARCH");
//   console.log(" PLAN:", JSON.stringify(plan, null, 2));

//   if (!plan || !plan.collection) {
//     console.log("No collection in plan");
//     return null;
//   }

//   const sanitizedFilters = sanitizeFilters(plan.filters || {});
//   console.log(" SANITIZED FILTERS:", JSON.stringify(sanitizedFilters, null, 2));

//   const config = activeCollections.find(
//     (c: any) => c.name === plan.collection
//   );

//   if (!config) {
//     console.log("Collection not active");
//     return null;
//   }

//   const uid = `api::${plan.collection}.${plan.collection}`;

//   try {
//     // COUNT OPERATION
//     if (plan.operation === "count") {
//       const count = await strapi.entityService.count(uid, {
//         filters: sanitizedFilters,
//       });

//       return {
//         type: "count",
//         collection: plan.collection,
//         value: count,
//       };
//     }

//     // LIST / SEARCH OPERATION
//     const result = await strapi.entityService.findMany(uid, {
//       filters: sanitizedFilters,
//       sort: plan.sort,
//       limit: 10,
//     });

//     const cleaned = result.map((row: any) => {
//       const clean: any = {};
//       for (const f of config.fields) clean[f] = row[f];
//       return clean;
//     });

//     return {
//       type: "list",
//       collection: plan.collection,
//       schema: config.fields,
//       items: cleaned,
//     };
//   } catch (err) {
//     console.error("Realtime search error:", err);
//     return null;
//   }
// }



// async function searchFAQ(question: string, strapi: any) {
//   console.log("FAQ SEARCH:", question);

//   // 1. Create embedding
//   const embedding = await openai.embeddings.create({
//     model: "text-embedding-3-small",
//     input: question,
//   });

//   const vector = embedding.data[0].embedding;
//   const knex = strapi.db.connection;

//   // 2. Vector similarity search
//   const results = await knex("chatbot_config_faqqas")
//     .select(
//       "answer",
//       knex.raw("(embedding <=> ?::vector) AS distance", [
//         JSON.stringify(vector),
//       ])
//     )
//     .whereNotNull("published_at")
//     .orderByRaw("embedding <=> ?::vector", [JSON.stringify(vector)])
//     .limit(3);

//   // 3. If nothing useful
//   if (!results.length || results[0].distance > 0.85) {
//     console.log("FAQ: No good match");
//     return [];
//   }

//   // 4. Return only answers
//   const answers = results.map((r: any) => r.answer);
//   console.log("FAQ MATCHES:", answers.length);

//   return answers;
// }

// async function simplePlanner(
//   question: string,
//   activeCollections: any[]
// ) {
//   console.log("🧠 AI PLANNER QUESTION:", question);

//   const response = await openai.chat.completions.create({
//     model: "gpt-4o-mini",
//     temperature: 0,
//     messages: [
//       {
//         role: "system",
//         content: `
// You are a STRICT database query planner that converts user questions into Strapi query JSON.

// --------------------------------
// CORE TASK
// --------------------------------
// Return ONLY valid JSON. No text. No explanation.

// --------------------------------
// COLLECTION SELECTION
// --------------------------------
// - Choose the most relevant collection from the available list.
// - Never invent collection names.

// --------------------------------
// FIELD RULES
// --------------------------------
// - Only use fields that exist in the selected collection schema.
// - Never hallucinate fields.


// --------------------------------
// LOCATION NORMALIZATION (CRITICAL)
// --------------------------------
// The database stores locations in the format:
// City Name (AIRPORT_CODE)

// Before generating filters, you MUST normalize
// all user-provided places into the nearest
// major city or airport name.

// RULES:

// 1. SMALL TOWNS / VILLAGES
// - Convert to nearest major airport city.
// Example:
// "Kalveerampalayam" → "Coimbatore"
// "Kollam" → "Trivandrum"
// "Alappuzha" → "Kochi"

// 2. OLD OR LOCAL NAMES
// - Convert to modern official city name.
// Example:
// "Madras" → "Chennai"
// "Cochin" → "Kochi"
// "Bombay" → "Mumbai"

// 3. SUBURBS / DISTRICTS
// - Convert to main metro city.
// Example:
// "Brooklyn" → "New York"
// "Noida" → "Delhi"

// 4. AIRPORT CODES
// - If user provides code (COK, MAA, JFK),
// search using containsi for that code.

// Example:
// User: "flight from COK"
// Filter:
// { "origin": { "containsi": "COK" } }

// 5. ALWAYS MATCH DATABASE STRINGS
// - Use containsi
// - Never use raw spelling if DB format differs
// - Prefer airport code if available

// --------------------------------
// TEXT FILTER RULES (VERY IMPORTANT)
// --------------------------------
// - For city names, titles, destinations, names → ALWAYS use "containsi"
// - NEVER use "eq" for text
// - NEVER use "in" for text arrays
// - For multiple text values use "$or" with containsi

// Example:
// User: "flight to paris or amsterdam"
// Filters:
// {
//   "$or": [
//     { "destination": { "containsi": "paris" } },
//     { "destination": { "containsi": "amsterdam" } }
//   ]
// }

// --------------------------------
// NUMBER FILTER RULES
// --------------------------------
// - For price, fare, amount → use lt, lte, gt, gte, between
// - "under" → lte
// - "above" → gte
// - "between" → between

// --------------------------------
// OPERATION RULES
// --------------------------------
// - "how many", "count" → operation = "count"
// - otherwise → operation = "list"

// --------------------------------
// SORT RULES
// --------------------------------
// - "cheapest", "lowest" → sort ["fare:asc"]
// - "highest", "expensive" → sort ["fare:desc"]
// - Only add sort if user implies ranking

// --------------------------------
// INTENT CLASSIFICATION (CRITICAL)
// --------------------------------
// First decide intent:

// INTENT = "realtime"
// - User asks about availability, price, list, count, search, show items
// - Mentions data stored in collections

// INTENT = "faq"
// - User asks "who is", "what is", "explain", "details about"
// - General knowledge
// - No clear database entity

// If no clear database match → ALWAYS choose "faq"
// NEVER force a collection.

// OUTPUT FORMAT

// Return ONLY JSON.

// If no database match exists, return:

// {
//   "collection": null
// }

// Otherwise return:

// {
//   "collection": "name",
//   "operation": "list" | "count",
//   "filters": {},
//   "sort": []
// }


// --------------------------------
// AVAILABLE COLLECTIONS
// --------------------------------
// ${JSON.stringify(activeCollections, null, 2)}
// `
//       },
//       {
//         role: "user",
//         content: question
//       }
//     ]
//   });

//   try {
//     const raw = response.choices[0].message.content || "{}";

//     // Safety cleanup in case model adds ```json
//     const cleaned = raw
//       .replace(/```json/g, "")
//       .replace(/```/g, "")
//       .trim();

//     const plan = JSON.parse(cleaned);

//     console.log("🧠 AI PLAN:", JSON.stringify(plan, null, 2));
//     return plan;
//   } catch (err) {
//     console.log("❌ Planner JSON parse failed");
//     return null;
//   }
// }

// async function realtimeInterpreterAI(question: string, realtimeData: any) {
//   if (!realtimeData) return null;

//   console.log("🧩 REALTIME AI INPUT:", JSON.stringify(realtimeData, null, 2));

//   const response = await openai.chat.completions.create({
//     model: "gpt-4o-mini",
//     temperature: 0.2,
//     messages: [
//       {
//         role: "system",
//         content: `
// You are a realtime data interpreter.

// Convert database JSON into a SHORT natural language summary.

// Rules:
// - Do NOT output JSON
// - Do NOT hallucinate
// - If count → say number
// - If list → summarize important fields only
// - Max 3–4 lines
// `
//       },
//       {
//         role: "user",
//         content: `
// QUESTION: ${question}

// REALTIME DATA:
// ${JSON.stringify(realtimeData)}
// `
//       }
//     ]
//   });

//   const text = response.choices[0].message.content;
//   console.log("🧠 REALTIME AI OUTPUT:", text);

//   return text;
// }

// async function finalAggregator(
//   question: string,
//   faq: any,
//   realtimeMeta: any,
//   realtimeText: any
// ) {
//   console.log("AGG INPUT QUESTION:", question);
//   console.log("AGG META:", JSON.stringify(realtimeMeta, null, 2));
//   console.log("AGG TEXT:", realtimeText);

//   const response = await openai.chat.completions.create({
//     model: "gpt-4o-mini",
//     temperature: 0.3,
//     messages: [
//       {
//         role: "system",
//         content: `
// You are an intelligent AI Assistant for a website chatbot.

// INPUTS:
// - FAQ semantic answers
// - REALTIME_META (structured database info)
// - REALTIME_TEXT (human summary)
// - User question

// --------------------------------
// CORE RULE
// --------------------------------
// REALTIME_META decides logic.
// REALTIME_TEXT decides wording.

// --------------------------------
// ANSWER LOGIC
// --------------------------------

// CASE 1 — REALTIME_META.type = "count"
// Return ONE sentence with the number.

// CASE 2 — REALTIME_META.type = "list"
// Use REALTIME_TEXT as main answer.

// CASE 3 — REALTIME_META = null
// Use FAQ.

// CASE 4 — BOTH EXIST
// Use REALTIME_TEXT as main + FAQ as support.

// CASE 5 — NOTHING
// Say information unavailable.

// Never show JSON.
// Never hallucinate.
// Max 5 lines.
// `
//       },
//       {
//         role: "user",
//         content: `
// QUESTION: ${question}

// FAQ:
// ${JSON.stringify(faq)}

// REALTIME_META:
// ${JSON.stringify(realtimeMeta)}

// REALTIME_TEXT:
// ${realtimeText}
// `
//       }
//     ]
//   });

//   return response.choices[0].message.content;
// }


// export default ({ strapi }: { strapi: any }) => ({
//   async ask(ctx: any) {
//     const { question, history = [] } = ctx.request.body;

//     let jsonContext = ctx.request.body.context || {};
// jsonContext = updateJsonContext(jsonContext, question);
// console.log(" JSON CONTEXT:", JSON.stringify(jsonContext, null, 2));

// ctx.set("X-User-Context", JSON.stringify(jsonContext));
//     console.log("QUESTION:", question);

//     try {
//   const activeCollections = await getActiveCollections(strapi);

//   if (!activeCollections || activeCollections.length === 0) {
//     console.log("No active collections");
//   }

//   const rewritten = await rephraseQuestion(history, question);
//   console.log("🧠 REWRITTEN QUESTION:", rewritten);

//   // FAQ
//   const faqResults = await searchFAQ(rewritten, strapi);
//   console.log("📚 FAQ RESULTS:", JSON.stringify(faqResults, null, 2));

//   // PLAN
//   const plan = await simplePlanner(rewritten, activeCollections);
//   console.log("📌 PLANNER RESULT:", JSON.stringify(plan, null, 2));

//   // REALTIME
// // REALTIME
// let realtimeResults = null;
// let realtimeAIText = null;

// if (plan && plan.collection) {
//   realtimeResults = await searchRealtime(strapi, plan, activeCollections);
//   console.log("⚡ REALTIME RESULTS:", JSON.stringify(realtimeResults, null, 2));

//   realtimeAIText = await realtimeInterpreterAI(
//     rewritten,
//     realtimeResults
//   );
// } else {
//   console.log("🟡 Planner chose FAQ path — realtime skipped");
// }


//   // FINAL AI
// const finalAnswer = await finalAggregator(
//   rewritten,
//   faqResults,
//   realtimeResults,   // meta
//   realtimeAIText     // text
// );
//   console.log("🤖 FINAL ANSWER:", finalAnswer);

// if (realtimeResults && realtimeResults.type === "list") {
//   ctx.body = {
//     type: "text+collection",
//     content: finalAnswer,
//     title: realtimeResults.collection,
//     schema: realtimeResults.schema,
//     items: realtimeResults.items,
//   };
// } else {
//   ctx.body = {
//     type: "text",
//     content: finalAnswer,
//   };
// }

// } catch (err) {
//   console.error("[ERROR]", err);
//   ctx.body = { type: "text", content: "Error occurred." };
// }
//   },
// });



 import OpenAI from "openai";


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});
async function getActiveCollections(strapi: any) {
  try {
    console.log(" [DEBUG] Fetching active collections...");
    const pluginStore = strapi.store({
      environment: null,
      type: "plugin",
      name: "faqchatbot-config",
    });
    const settings = await pluginStore.get({ key: "collections" });
    console.log(" [DEBUG] Plugin settings fetched:", settings);
    if (!settings) return [];

    const activeList = [];
    for (const item of settings) {
      const ignored = ["faqitem", "item"];
      const name = item.name.toLowerCase();

     const hasEnabledFields = item.fields?.some((f: any) => f.enabled);

if (!hasEnabledFields || ignored.includes(name)) {
  console.log(`   - Skipping '${item.name}' (no enabled fields)`);
  continue;
}


      const uid = `api::${item.name}.${item.name}`;
      const contentType = strapi.contentTypes[uid];

      if (!contentType) {
        console.warn(` [WARNING] Content type not found for UID: ${uid}`);
        continue;
      }

      const fields = Object.keys(contentType.attributes).filter((key) => {
        const attr = contentType.attributes[key];
        return [
          "string", "text", "email", "uid", "richtext", "enumeration",
          "integer", "biginteger", "decimal", "float", "date", "datetime",
          "time", "relation"
        ].includes(attr.type);
      });

      console.log(`   + Adding '${item.name}' with fields:`, fields);
      activeList.push({ name: item.name, fields: fields });
    }

    console.log(" [DEBUG] Final active collections:", activeList);
    return activeList;
  } catch (err) {
    console.error(" [ERROR] Error loading active collections:", err);
    return [];
  }
}

async function rephraseQuestion(history: any[], question: string) {
  if (!history || !Array.isArray(history) || history.length === 0) {
    console.log("REWRITE: skipped (no history)");
    return question;
  }
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `You are a Search Query Optimizer.
        Your task is to determine if the user's new message is a **Follow-up** or a **New Topic** and if a follow-up just rewrite the question .
        Do NOT return any explanations, only the optimized search string.

        ### RULES
        1. **Dependency Check (The "Pronoun" Rule):**
           - ONLY combine with history if the new question contains **Pronouns** ("it", "that", "they") or is **Grammatically Incomplete** ("How much?", "Where do I buy?", "Is it refundable?").
           
        2. **Independence Check (The "Specifics" Rule):**
           - If the user asks a complete question containing a **New Specific Noun** or **Scenario** (e.g., "Group of 7 people", "Booking for pets"), treat it as a **Standalone Query**.
           - **Do NOT** attach the previous topic to it.
           - *Example:* History="Commuter Pass", Input="Can I book for a group of 7?" -> Output="Group booking for 7 people" (Correct).
           - *Bad Output:* "Group booking for Commuter Pass" (Incorrect).

        3. **Output:**
           - Return ONLY the optimized search string.`
        },
        ...history.slice(-4),
        { role: "user", content: question },
      ],
    });
const rewritten = response.choices[0].message.content?.trim();
console.log(`REWRITE: "${question}" → "${rewritten}"`);

if (!rewritten) return question;

const lower = rewritten.toLowerCase();

// If model answered instead of rewriting → ignore
if (
  lower.includes("unavailable") ||
  lower.includes("sorry") ||
  lower.includes("i am") ||
  lower.includes("cannot") ||
  rewritten.length > 120
) {
  console.log("REWRITE REJECTED – using original question");
  return question;
}

return rewritten;


  } catch (err) {
    console.error("Error in rephraseQuestion:", err);
    return question;
  }
  
}

function sanitizeFilters(filters: any): any {
  if (!filters || typeof filters !== "object") return filters;

  if (Array.isArray(filters)) {
    return filters.map(sanitizeFilters);
  }

  const operators = [
    "eq", "ne", "lt", "gt", "lte", "gte", "in", "notIn", "contains",
    "notContains", "containsi", "notContainsi", "null", "notNull",
    "between", "startsWith", "endsWith", "or", "and", "not"
  ];

  const newFilters: any = {};

  for (const key in filters) {
    let newKey = key;
    if (operators.includes(key) && !key.startsWith("$")) {
      newKey = `$${key}`;
    }
    
    newFilters[newKey] = sanitizeFilters(filters[key]);
  }

  return newFilters;
}

function updateJsonContext(prevContext: any, question: string) {
  const MAX_HISTORY = 10;

  const ctx = { ...(prevContext || {}) };

  // Maintain history
  ctx.history = Array.isArray(ctx.history) ? ctx.history : [];
  ctx.history.push(question);
  if (ctx.history.length > MAX_HISTORY) ctx.history.shift();

  // Simple keyword extraction
  const words = question
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(" ")
    .filter((w) => w.length > 3);

  ctx.keywords = [...new Set([...(ctx.keywords || []), ...words])];

  ctx.lastQuestion = question;

  return ctx;
}


async function searchRealtime(
  strapi: any,
  plan: any,
  activeCollections: any
) {
  console.log(" REALTIME SEARCH");
  console.log(" PLAN:", JSON.stringify(plan, null, 2));

  if (!plan || !plan.collection) {
    console.log("No collection in plan");
    return null;
  }

  const sanitizedFilters = sanitizeFilters(plan.filters || {});
  console.log(" SANITIZED FILTERS:", JSON.stringify(sanitizedFilters, null, 2));

  const config = activeCollections.find(
    (c: any) => c.name === plan.collection
  );

  if (!config) {
    console.log("Collection not active");
    return null;
  }

  const uid = `api::${plan.collection}.${plan.collection}`;

  try {
    // COUNT OPERATION
    if (plan.operation === "count") {
      const count = await strapi.entityService.count(uid, {
        filters: sanitizedFilters,
      });

      return {
        type: "count",
        collection: plan.collection,
        value: count,
      };
    }

    // LIST / SEARCH OPERATION
    const result = await strapi.entityService.findMany(uid, {
      filters: sanitizedFilters,
      sort: plan.sort,
      limit: 10,
    });

    const cleaned = result.map((row: any) => {
      const clean: any = {};
      for (const f of config.fields) clean[f] = row[f];
      return clean;
    });

    return {
      type: "list",
      collection: plan.collection,
      schema: config.fields,
      items: cleaned,
    };
  } catch (err) {
    console.error("Realtime search error:", err);
    return null;
  }
}


function cosineSimilarity(a: number[], b: number[]) {
  if (!a || !b || a.length !== b.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}


async function searchFAQ(question: string, strapi: any) {
  console.log("FAQ SEARCH:", question);

  // 1. Create embedding
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: question,
  });

  let queryVector = embedding.data[0].embedding;

  // FORCE MATCH DB LENGTH
  // queryVector = queryVector.slice(0, 1536);

  if (!queryVector || !queryVector.length) {
    console.log("FAQ: Query embedding failed");
    return [];
  }

  console.log("QUERY VECTOR LENGTH:", queryVector.length);
  // 2. Fetch all FAQ embeddings
  const faqs = await strapi.db
    .connection("chatbot_config_faqqas")
    .select("answer", "embedding")
    .whereNotNull("embedding")
    .whereNotNull("published_at");

  if (!faqs.length) return [];

  // 3. Score similarity
  const scored = faqs.map((f: any) => {
    let dbVector = f.embedding;

    try {
      // If stored as string JSON → parse
      if (typeof dbVector === "string") {
        dbVector = JSON.parse(dbVector);
      }

      // Force all values to numbers
      dbVector = Array.isArray(dbVector)
        ? dbVector.map((n: any) => Number(n))
        : [];

      // Length mismatch guard
      if (!Array.isArray(dbVector) || dbVector.length !== queryVector.length) {
        return { answer: f.answer, similarity: 0 };
      }

      return {
        answer: f.answer,
        similarity: cosineSimilarity(queryVector, dbVector),
      };
    } catch (err) {
      console.log("FAQ parse error:", err);
      return { answer: f.answer, similarity: 0 };
    }
  });

  // 4. Sort by similarity
  scored.sort((a, b) => b.similarity - a.similarity);

  console.log("TOP FAQ SIM:", scored[0]?.similarity);

  // 5. Threshold check
  if (!scored.length || scored[0].similarity < 0.40) {
    console.log("FAQ: No good match");
    return [];
  }

  // 6. Return top 3 answers
  return scored.slice(0, 3).map((s) => s.answer);
}

async function simplePlanner(
  question: string,
  activeCollections: any[]
) {
  console.log("🧠 AI PLANNER QUESTION:", question);

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `
You are a STRICT database query planner that converts user questions into Strapi query JSON.

--------------------------------
CORE TASK
--------------------------------
Return ONLY valid JSON. No text. No explanation.

--------------------------------
COLLECTION SELECTION
--------------------------------
- Choose the most relevant collection from the available list.
- Never invent collection names.

--------------------------------
FIELD RULES
--------------------------------
- Only use fields that exist in the selected collection schema.
- Never hallucinate fields.


--------------------------------
LOCATION NORMALIZATION (CRITICAL)
--------------------------------
The database stores locations in the format:
City Name (AIRPORT_CODE)

Before generating filters, you MUST normalize
all user-provided places into the nearest
major city or airport name.

RULES:

1. SMALL TOWNS / VILLAGES
- Convert to nearest major airport city.
Example:
"Kalveerampalayam" → "Coimbatore"
"Kollam" → "Trivandrum"
"Alappuzha" → "Kochi"

2. OLD OR LOCAL NAMES
- Convert to modern official city name.
Example:
"Madras" → "Chennai"
"Cochin" → "Kochi"
"Bombay" → "Mumbai"

3. SUBURBS / DISTRICTS
- Convert to main metro city.
Example:
"Brooklyn" → "New York"
"Noida" → "Delhi"

4. AIRPORT CODES
- If user provides code (COK, MAA, JFK),
search using containsi for that code.

Example:
User: "flight from COK"
Filter:
{ "origin": { "containsi": "COK" } }

5. ALWAYS MATCH DATABASE STRINGS
- Use containsi
- Never use raw spelling if DB format differs
- Prefer airport code if available

--------------------------------
TEXT FILTER RULES (VERY IMPORTANT)
--------------------------------
- For city names, titles, destinations, names → ALWAYS use "containsi"
- NEVER use "eq" for text
- NEVER use "in" for text arrays
- For multiple text values use "$or" with containsi

Example:
User: "flight to paris or amsterdam"
Filters:
{
  "$or": [
    { "destination": { "containsi": "paris" } },
    { "destination": { "containsi": "amsterdam" } }
  ]
}

--------------------------------
NUMBER FILTER RULES
--------------------------------
- For price, fare, amount → use lt, lte, gt, gte, between
- "under" → lte
- "above" → gte
- "between" → between

--------------------------------
OPERATION RULES
--------------------------------
- "how many", "count" → operation = "count"
- otherwise → operation = "list"

--------------------------------
SORT RULES
--------------------------------
- "cheapest", "lowest" → sort ["fare:asc"]
- "highest", "expensive" → sort ["fare:desc"]
- Only add sort if user implies ranking

--------------------------------
INTENT CLASSIFICATION (CRITICAL)
--------------------------------
First decide intent:

INTENT = "realtime"
- User asks about availability, price, list, count, search, show items
- Mentions data stored in collections

INTENT = "faq"
- User asks "who is", "what is", "explain", "details about"
- General knowledge
- No clear database entity

If no clear database match → ALWAYS choose "faq"
NEVER force a collection.

OUTPUT FORMAT

Return ONLY JSON.

If no database match exists, return:

{
  "collection": null
}

Otherwise return:

{
  "collection": "name",
  "operation": "list" | "count",
  "filters": {},
  "sort": []
}


--------------------------------
AVAILABLE COLLECTIONS
--------------------------------
${JSON.stringify(activeCollections, null, 2)}
`
      },
      {
        role: "user",
        content: question
      }
    ]
  });

  try {
    const raw = response.choices[0].message.content || "{}";

    // Safety cleanup in case model adds ```json
    const cleaned = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const plan = JSON.parse(cleaned);

    console.log("🧠 AI PLAN:", JSON.stringify(plan, null, 2));
    return plan;
  } catch (err) {
    console.log("❌ Planner JSON parse failed");
    return null;
  }
}

async function realtimeInterpreterAI(question: string, realtimeData: any) {
  if (!realtimeData) return null;

  console.log("🧩 REALTIME AI INPUT:", JSON.stringify(realtimeData, null, 2));

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: `
You are a realtime data interpreter.

Convert database JSON into a SHORT natural language summary.

Rules:
- Do NOT output JSON
- Do NOT hallucinate
- If count → say number
- If list → summarize important fields only
- Max 3–4 lines
`
      },
      {
        role: "user",
        content: `
QUESTION: ${question}

REALTIME DATA:
${JSON.stringify(realtimeData)}
`
      }
    ]
  });

  const text = response.choices[0].message.content;
  console.log("🧠 REALTIME AI OUTPUT:", text);

  return text;
}

async function finalAggregator(
  question: string,
  faq: any,
  realtimeMeta: any,
  realtimeText: any
) {
  console.log("AGG INPUT QUESTION:", question);
  console.log("AGG META:", JSON.stringify(realtimeMeta, null, 2));
  console.log("AGG TEXT:", realtimeText);

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content: `
You are an intelligent AI Assistant for a website chatbot.

INPUTS:
- FAQ semantic answers
- REALTIME_META (structured database info)
- REALTIME_TEXT (human summary)
- User question

--------------------------------
CORE RULE
--------------------------------
REALTIME_META decides logic.
REALTIME_TEXT decides wording.

--------------------------------
ANSWER LOGIC
--------------------------------

CASE 1 — REALTIME_META.type = "count"
Return ONE sentence with the number.

CASE 2 — REALTIME_META.type = "list"
Use REALTIME_TEXT as main answer.

CASE 3 — REALTIME_META = null
Use FAQ.

CASE 4 — BOTH EXIST
Use REALTIME_TEXT as main + FAQ as support.

CASE 5 — NOTHING
Say information unavailable.

Never show JSON.
Never hallucinate.
Max 5 lines.
`
      },
      {
        role: "user",
        content: `
QUESTION: ${question}

FAQ:
${JSON.stringify(faq)}

REALTIME_META:
${JSON.stringify(realtimeMeta)}

REALTIME_TEXT:
${realtimeText}
`
      }
    ]
  });

  return response.choices[0].message.content;
}


export default ({ strapi }: { strapi: any }) => ({
  async ask(ctx: any) {
    const { question, history = [] } = ctx.request.body;

    let jsonContext = ctx.request.body.context || {};
jsonContext = updateJsonContext(jsonContext, question);
console.log(" JSON CONTEXT:", JSON.stringify(jsonContext, null, 2));

ctx.set("X-User-Context", JSON.stringify(jsonContext));
    console.log("QUESTION:", question);

    try {
  const activeCollections = await getActiveCollections(strapi);

  if (!activeCollections || activeCollections.length === 0) {
    console.log("No active collections");
  }

  const rewritten = await rephraseQuestion(history, question);
  console.log("🧠 REWRITTEN QUESTION:", rewritten);

  // FAQ
  const faqResults = await searchFAQ(rewritten, strapi);
  console.log("📚 FAQ RESULTS:", JSON.stringify(faqResults, null, 2));

  // PLAN
  const plan = await simplePlanner(rewritten, activeCollections);
  console.log("📌 PLANNER RESULT:", JSON.stringify(plan, null, 2));

  // REALTIME
// REALTIME
let realtimeResults = null;
let realtimeAIText = null;

if (plan && plan.collection) {
  realtimeResults = await searchRealtime(strapi, plan, activeCollections);
  console.log("⚡ REALTIME RESULTS:", JSON.stringify(realtimeResults, null, 2));

  realtimeAIText = await realtimeInterpreterAI(
    rewritten,
    realtimeResults
  );
} else {
  console.log("🟡 Planner chose FAQ path — realtime skipped");
}


  // FINAL AI
const finalAnswer = await finalAggregator(
  rewritten,
  faqResults,
  realtimeResults,   // meta
  realtimeAIText     // text
);
  console.log("🤖 FINAL ANSWER:", finalAnswer);

if (realtimeResults && realtimeResults.type === "list") {
  ctx.body = {
    type: "text+collection",
    content: finalAnswer,
    title: realtimeResults.collection,
    schema: realtimeResults.schema,
    items: realtimeResults.items,
  };
} else {
  ctx.body = {
    type: "text",
    content: finalAnswer,
  };
}

} catch (err) {
  console.error("[ERROR]", err);
  ctx.body = { type: "text", content: "Error occurred." };
}
  },
});
