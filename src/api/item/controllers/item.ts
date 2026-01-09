
// // //intent and vector
// import { factories } from "@strapi/strapi";
// import OpenAI from "openai";
// import type { UID } from "@strapi/types";
// import type { ChatCompletionTool } from "openai/resources/chat/completions";

// //type Intent = "faq" | "data";

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY!,
// });


// function assertValidContentType(
//   strapi: any,
//   uid: string
// ): asserts uid is UID.ContentType {
//   if (!strapi.contentTypes[uid]) {
//     throw new Error(`Invalid content-type UID: ${uid}`);
//   }
// }

// function getSchemaSnapshot(strapi: any): Record<string, string[]> {
//   const snapshot: Record<string, string[]> = {};

//   for (const [uid, ct] of Object.entries(strapi.contentTypes)) {
//     if (!uid.startsWith("api::")) continue;

//     snapshot[uid] = Object.entries((ct as any).attributes)
//       .filter(([, attr]: any) =>
//         ["string", "text", "integer", "decimal", "float","biginteger"].includes(attr.type)
//       )
//       .map(([key]) => key)
//       .filter(
//         (key) =>
//           !["locale", "createdAt", "updatedAt", "publishedAt"].includes(key)
//       );
//   }

//   return snapshot;
// }

// const TOOLS: ChatCompletionTool[] = [
//   {
//     type: "function",
//     function: {
//       name: "query_strapi",
//       description:
//         "Choose a Strapi collection and optional filters based on the user question",
//       parameters: {
//         type: "object",
//         properties: {
//           collection: {
//             type: "string",
//             description: "Strapi collection UID (api::x.x)",
//           },
//           filters: {
//             type: "object",
//             additionalProperties: { type: "string" },
//           },
//         },
//         required: ["collection"],
//       },
//     },
//   },
// ];
// // async function classifyIntent(question: string): Promise<Intent> {
// //   const response = await openai.chat.completions.create({
// //     model: "gpt-4.1-mini",
// //     temperature: 0,
// //     messages: [
// //       {
// //         role: "system",
// //         content: `
// // You are an intent classifier.

// // Classify the user's question into exactly ONE category.

// // faq:
// // - how / what / why questions
// // - explanations
// // - help, policy, documentation
// // - conceptual information

// // data:
// // - show, list, filter
// // - prices, attributes
// // - database or catalog queries
// // - requests needing structured results

// // Reply with ONLY ONE WORD:
// // faq or data
// //         `.trim(),
// //       },
// //       { role: "user", content: question },
// //     ],
// //   });

// //   const intent = response.choices[0].message.content?.trim();

// //   if (intent === "faq" || intent === "data") {
// //     return intent;
// //   }
// //   console.log(intent);
// //   // Safe fallback
// //   return "faq";
// // }





// export default factories.createCoreController(
//   "api::item.item",
//   ({ strapi }) => ({
//     async ask(ctx) {
//       try {
//          console.log("BODY:", ctx.request);
//         const { question } = ctx.request.body as { question?: string };

//         if (!question || typeof question !== "string") {
//           ctx.badRequest("Question is required");
//           return;
//         }

        
//         const result = await tryStrapiFunctionCalling(ctx, question, strapi);

//         if (result === "handled") {
//           return;
//         }

//         await runVectorSearchFAQ(ctx, question, strapi);
//       } catch (error) {
//         console.error("ASK ERROR:", error);
//         ctx.internalServerError("Something went wrong");
//       }
//     },
//   })
// );

// async function tryStrapiFunctionCalling(
//   ctx: any,
//   question: string,
//   strapi: any
// ) {
//   try {
//     const schema = getSchemaSnapshot(strapi);

//     const ai = await openai.chat.completions.create({
//       model: "gpt-4.1-mini",
//       temperature: 0,
//       messages: [
//         {
//           role: "system",
//           content: `
// You are a Strapi query planner.

// Rules:
// - You MUST call query_strapi
// - collection MUST be one of these:
// ${Object.keys(schema).join("\n")}
// - filters MUST use schema fields only
// - If the question contains concrete values (names, places, numbers),
//   infer the most likely schema fields and include them in filters.
// - Only return {} if the question is generic.

// Schema:
// ${JSON.stringify(schema, null, 2)}
// `.trim(),
//         },
//         { role: "user", content: question },
//       ],
//       tools: TOOLS,
//       tool_choice: {
//         type: "function",
//         function: { name: "query_strapi" },
//       },
//     });

//     const toolCall = ai.choices[0]?.message?.tool_calls?.[0];
//     if (!toolCall || toolCall.type !== "function") {
//       return "skipped";
//     }

//     const fnArgs = "arguments" in toolCall.function
//       ? toolCall.function.arguments
//       : null;

//     if (!fnArgs) return "skipped";

//     const args = JSON.parse(fnArgs) as {
//       collection: string;
//       filters?: Record<string, string>;
//     };

//     if (!args.collection || !schema[args.collection]) {
//       return "skipped";
//     }

  
//     // No filters → DO NOT query DB → vector search handles it
//     if (!args.filters || Object.keys(args.filters).length === 0) {
//       return "skipped";
//     }

//     assertValidContentType(strapi, args.collection);

   
//     const filters: Record<string, any> = {};

//     for (const [key, value] of Object.entries(args.filters)) {
//       const attribute = strapi.contentTypes[args.collection].attributes[key];
//       if (!attribute) continue;

//       if (["string", "text", "richtext", "email"].includes(attribute.type)) {
//         filters[key] = { $containsi: value };
//       }

//       if (["integer", "decimal", "float", "biginteger"].includes(attribute.type)) {
//         filters[key] = { $eq: Number(value) };
//       }
//     }

//     const result = await strapi.entityService.findMany(args.collection, {
//       publicationState: "live",
//       locale: "en",
//       filters,
//       fields: schema[args.collection] as unknown as never,
//     });

//     if (!Array.isArray(result) || result.length === 0) {
//       return "skipped";
//     }

    
//     const SYSTEM_FIELDS = new Set([
//       "id",
//       "documentId",
//       "createdAt",
//       "updatedAt",
//       "publishedAt",
//       "locale",
//     ]);

//     const items = result.map((row: any) => {
//       const clean: Record<string, any> = {};
//       for (const [k, v] of Object.entries(row)) {
//         if (!SYSTEM_FIELDS.has(k)) clean[k] = v;
//       }
//       return clean;
//     });

//     ctx.body = {
//       type: "collection",
//       schema: Object.keys(items[0]),
//       items,
//     };

//     return "handled";
//   } catch (error) {
//     console.error("DATA ERROR:", error);
//     return "skipped";
//   }
// }


// async function runVectorSearchFAQ(ctx: any, question: string, strapi: any) {
//   const embeddingResponse = await openai.embeddings.create({
//     model: "text-embedding-3-small",
//     input: question,
//   });

//   const userVector = embeddingResponse.data[0].embedding;
//   const knex = strapi.db.connection;

//   const results = await knex("items")
//     .select(
//       "id",
//       "question",
//       "answer",
//       knex.raw("(embedding <=> ?::vector) AS distance", [
//         JSON.stringify(userVector),
//       ])
//     )
//     .orderByRaw("embedding <=> ?::vector", [
//       JSON.stringify(userVector),
//     ])
//     .limit(1);

//   const bestMatch = results?.[0];

//   if (!bestMatch || bestMatch.distance > 0.85) {
//     ctx.body = { type: "text", content: "Answer not available." };
//     return;
//   }

//   const prompt = `
// You are a factual FAQ answer extractor.

// Rules:
// - Use ONLY the FAQ content
// - Answer precisely
// - Max 2–3 sentences
// - No filler

// FAQ:
// ${bestMatch.answer}

// User Question:
// ${question}

// Answer:
//   `.trim();

//   const completion = await openai.chat.completions.create({
//     model: "gpt-4.1-mini",
//     temperature: 0,
//     messages: [{ role: "user", content: prompt }],
//   });

//   ctx.body = {
//     type: "text",
//     content: completion.choices[0].message.content,
//   };
// }


// intent + vector (FINAL, STABLE, TYPE-SAFE)
// intent + vector (FINAL, FIXED)
// import { factories } from "@strapi/strapi";
// import OpenAI from "openai";
// import type { ChatCompletionTool } from "openai/resources/chat/completions";

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY!,
// });

// /* -------------------------------------------------- */
// /* ADMIN CONFIG                                      */
// /* -------------------------------------------------- */

// const AVAILABLE_COLLECTIONS = [
//   { name: "deal", fields: ["from", "to", "fare"] },
//   { name: "flight", fields: ["origin", "destination", "fare"] },
// ];

// const COLLECTION_NAMES = AVAILABLE_COLLECTIONS.map(c => c.name);

// /* -------------------------------------------------- */
// /* HELPERS                                           */
// /* -------------------------------------------------- */

// function richTextToPlainText(richText: any): string {
//   if (!Array.isArray(richText)) return "";
//   return richText
//     .map(b => b.children?.map((c: any) => c.text).join("") || "")
//     .join("\n\n");
// }

// /* -------------------------------------------------- */
// /* OPENAI TOOL                                      */
// /* -------------------------------------------------- */

// const TOOLS: ChatCompletionTool[] = [
//   {
//     type: "function",
//     function: {
//       name: "query_strapi",
//       parameters: {
//         type: "object",
//         properties: {
//           collection: { type: "string" },
//           filters: { type: "object", additionalProperties: true },
//         },
//         required: ["collection"],
//       },
//     },
//   },
// ];

// /* -------------------------------------------------- */
// /* REALTIME HANDLER                                  */
// /* -------------------------------------------------- */

// async function handleRealtime(ctx: any, question: string, strapi: any) {
//   console.log("🔵 Realtime handler");

//   const ai = await openai.chat.completions.create({
//     model: "gpt-4.1-mini",
//     temperature: 0,
//     messages: [
//       {
//         role: "system",
//         content: `
// Choose a collection from:
// ${AVAILABLE_COLLECTIONS.map(c => c.name).join(", ")}

// Return JSON only:
// { "collection": "...", "filters": { } }
//         `.trim(),
//       },
//       { role: "user", content: question },
//     ],
//     tools: TOOLS,
//     tool_choice: { type: "function", function: { name: "query_strapi" } },
//   });

//   const toolCall = ai.choices[0]?.message?.tool_calls?.[0];
//   if (!toolCall || toolCall.type !== "function") return false;

//   const args = JSON.parse(toolCall.function.arguments ?? "{}");
//   console.log("🟠 Realtime args:", args);

//   if (!COLLECTION_NAMES.includes(args.collection)) return false;

//   const allowedFields =
//     AVAILABLE_COLLECTIONS.find(c => c.name === args.collection)?.fields || [];

//   const filters: Record<string, any> = {};
//   for (const key in args.filters || {}) {
//     if (allowedFields.includes(key)) {
//       filters[key] = { $containsi: args.filters[key] };
//     }
//   }

//   const collectionUid = `api::${args.collection}.${args.collection}`;

//   let result;
//   try {
//     result = await strapi.entityService.findMany(collectionUid, {
//       filters,
//       limit: 10,
//     });
//   } catch (err) {
//     console.error("❌ Realtime query failed:", err);
//     return false; // fallback to FAQ
//   }

//   ctx.body = {
//     type: "collection",
//     title: args.collection,
//     schema: allowedFields,
//     items: result.map((row: any) => {
//       const clean: any = {};
//       for (const f of allowedFields) clean[f] = row[f];
//       return clean;
//     }),
//   };

//   console.log("✅ Realtime cards sent:", result.length);
//   return true;
// }

// /* -------------------------------------------------- */
// /* FAQ HANDLER (NO HALLUCINATION)                    */
// /* -------------------------------------------------- */

// async function handleFAQ(ctx: any, question: string, strapi: any) {
//   console.log("🟢 FAQ handler");

//   const embeddingResponse = await openai.embeddings.create({
//     model: "text-embedding-3-small",
//     input: question,
//   });

//   const userVector = embeddingResponse.data[0].embedding;
//   const knex = strapi.db.connection;

//   const results = await knex("items")
//     .select(
//       "id",
//       "question",
//       "answer",
//       knex.raw("(embedding <=> ?::vector) AS distance", [
//         JSON.stringify(userVector),
//       ])
//     )
//     .orderByRaw("embedding <=> ?::vector", [
//       JSON.stringify(userVector),
//     ])
//     .limit(1);

//   const bestMatch = results?.[0];

//   if (!bestMatch || bestMatch.distance > 0.85) {
//     ctx.body = { type: "text", content: "Answer not available." };
//     return;
//   }

//   const prompt = `
// You are a factual FAQ answer extractor.

// Rules:
// - Use ONLY the FAQ content
// - Answer precisely
// - Max 2–3 sentences
// - No filler

// FAQ:
// ${bestMatch.answer}

// User Question:
// ${question}

// Answer:
//   `.trim();

//   const completion = await openai.chat.completions.create({
//     model: "gpt-4.1-mini",
//     temperature: 0,
//     messages: [{ role: "user", content: prompt }],
//   });

//   ctx.body = {
//     type: "text",
//     content: completion.choices[0].message.content,
//   };
// }

// /* -------------------------------------------------- */
// /* CONTROLLER                                       */
// /* -------------------------------------------------- */

// export default factories.createCoreController(
//   "api::item.item",
//   ({ strapi }) => ({
//     async ask(ctx) {
//       const { question } = ctx.request.body;
//       console.log("🟣 Question:", question);

//       const intentRes = await openai.chat.completions.create({
//         model: "gpt-4.1-mini",
//         temperature: 0,
//         messages: [
//           {
//             role: "system",
//             content: `
// Decide intent:
// - realtime → listings, deals, prices
// - faq → explanations, policies
// Reply ONLY: realtime or faq
//             `.trim(),
//           },
//           { role: "user", content: question },
//         ],
//       });

//       const intent =
//         intentRes.choices[0].message.content?.trim().toLowerCase();

//       console.log("🟡 Intent:", intent);

//       if (intent === "realtime") {
//         const handled = await handleRealtime(ctx, question, strapi);
//         if (handled) return;
//       }

//       await handleFAQ(ctx, question, strapi);
//     },
//   })
// );




// import { factories } from "@strapi/strapi";
// import OpenAI from "openai";

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY!,
// });

// /* -------------------------------------------------- */
// /* ADMIN CONFIG (ONLY PLACE YOU DEFINE SCHEMA)       */
// /* -------------------------------------------------- */

// const AVAILABLE_COLLECTIONS = [
//   { name: "deal", fields: ["from", "to", "fare"] },
//   { name: "flight", fields: ["origin", "destination", "fare"] },
// ];

// const COLLECTION_NAMES = AVAILABLE_COLLECTIONS.map(c => c.name);

// /* -------------------------------------------------- */
// /* SCHEMA SNAPSHOT (GENERIC)                          */
// /* -------------------------------------------------- */

// function getSchemaSnapshot() {
//   return AVAILABLE_COLLECTIONS.reduce((acc, c) => {
//     acc[c.name] = c.fields;
//     return acc;
//   }, {} as Record<string, string[]>);
// }

// /* -------------------------------------------------- */
// /* REALTIME HANDLER (STRICT JSON THINKING)            */
// /* -------------------------------------------------- */

// async function handleRealtime(ctx: any, question: string, strapi: any) {
//   console.log("🔵 Realtime handler");

//   const schema = getSchemaSnapshot();

//   const ai = await openai.chat.completions.create({
//     model: "gpt-4.1-mini",
//     temperature: 0,
//     response_format: { type: "json_object" }, // 🔥 CRITICAL FIX
//     messages: [
//       {
//         role: "system",
//         content: `
// You are a generic query planner.

// Available collections and their fields:
// ${JSON.stringify(schema, null, 2)}

// Rules:
// - Choose the most relevant collection
// - If the user mentions any value that corresponds to a field,
//   you MUST include it in filters
// - Use field names EXACTLY as provided
// - Do NOT invent values
// - Always return a filters object (empty only if none found)
// - Return JSON ONLY

// Format:
// {
//   "collection": "<collection_name>",
//   "filters": {
//     "<field>": "<value>"
//   }
// }
//         `.trim(),
//       },
//       { role: "user", content: question },
//     ],
//   });

//   const content = ai.choices[0].message.content || "{}";
//   const args = JSON.parse(content);

//   console.log("🟠 AI planned query:", args);

//   if (!args.collection || !COLLECTION_NAMES.includes(args.collection)) {
//     return false;
//   }

//   const allowedFields =
//     AVAILABLE_COLLECTIONS.find(c => c.name === args.collection)?.fields || [];

//   const filters: Record<string, any> = {};
//   for (const key in args.filters || {}) {
//     if (allowedFields.includes(key)) {
//       filters[key] = { $containsi: args.filters[key] };
//     }
//   }

//   console.log("🔍 Filters sent to Strapi:", filters);

//   const collectionUid = `api::${args.collection}.${args.collection}`;

//   let result;
//   try {
//     result = await strapi.entityService.findMany(collectionUid, {
//       filters,
//       limit: 10,
//     });
//   } catch (err) {
//     console.error("❌ Realtime query failed:", err);
//     return false;
//   }

//   ctx.body = {
//     type: "collection",
//     title: args.collection,
//     schema: allowedFields,
//     items: result.map((row: any) => {
//       const clean: any = {};
//       for (const f of allowedFields) clean[f] = row[f];
//       return clean;
//     }),
//   };

//   console.log("✅ Realtime cards sent:", result.length);
//   return true;
// }

// /* -------------------------------------------------- */
// /* FAQ HANDLER (STRICT RAG, NO HALLUCINATION)        */
// /* -------------------------------------------------- */

// async function handleFAQ(ctx: any, question: string, strapi: any) {
//   console.log("🟢 FAQ handler");

//   const embeddingResponse = await openai.embeddings.create({
//     model: "text-embedding-3-small",
//     input: question,
//   });

//   const userVector = embeddingResponse.data[0].embedding;
//   const knex = strapi.db.connection;

//   const results = await knex("items")
//     .select(
//       "answer",
//       knex.raw("(embedding <=> ?::vector) AS distance", [
//         JSON.stringify(userVector),
//       ])
//     )
//     .orderByRaw("embedding <=> ?::vector", [
//       JSON.stringify(userVector),
//     ])
//     .limit(1);

//   const bestMatch = results?.[0];

//   if (!bestMatch || bestMatch.distance > 0.85) {
//     ctx.body = { type: "text", content: "Answer not available." };
//     return;
//   }

//   const completion = await openai.chat.completions.create({
//     model: "gpt-4.1-mini",
//     temperature: 0,
//     messages: [
//       {
//         role: "system",
//         content: `
// You are a factual FAQ answer extractor.
// Use ONLY the provided content.
// Max 2–3 sentences.
// Summarize precisely without filler.
//         `.trim(),
//       },
//       { role: "user", content: bestMatch.answer },
//     ],
//   });

//   ctx.body = {
//     type: "text",
//     content: completion.choices[0].message.content,
//   };
// }

// /* -------------------------------------------------- */
// /* CONTROLLER (ORCHESTRATOR)                         */
// /* -------------------------------------------------- */

// export default factories.createCoreController(
//   "api::item.item",
//   ({ strapi }) => ({
//     async ask(ctx) {
//       const { question } = ctx.request.body;
//       console.log("🟣 Question:", question);

//       const intentRes = await openai.chat.completions.create({
//         model: "gpt-4.1-mini",
//         temperature: 0,
//         messages: [
//           {
//             role: "system",
//             content: `
// Decide intent:
// - realtime → listings, filters, prices, availability
// - faq → explanations, policies, definitions

// Reply ONLY: realtime or faq
//             `.trim(),
//           },
//           { role: "user", content: question },
//         ],
//       });

//       const intent =
//         intentRes.choices[0].message.content?.trim().toLowerCase();

//       console.log("🟡 Intent:", intent);

//       if (intent === "realtime") {
//         const handled = await handleRealtime(ctx, question, strapi);
//         if (handled) return;
//       }

//       await handleFAQ(ctx, question, strapi);
//     },
//   })
// );




// import { factories } from "@strapi/strapi";
// import OpenAI from "openai";
// import type { ChatCompletionTool } from "openai/resources/chat/completions";

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY!,
// });

// /* -------------------------------------------------- */
// /* ADMIN CONFIG (ONLY PLACE YOU DEFINE SCHEMA)       */
// /* -------------------------------------------------- */

// const AVAILABLE_COLLECTIONS = [
//   { name: "deal", fields: ["from", "to", "fare"] },
//   { name: "flight", fields: ["origin", "destination", "fare"] },
// ];

// /* -------------------------------------------------- */
// /* FUNCTION CALLING TOOL (EXECUTION ONLY)             */
// /* -------------------------------------------------- */

// const TOOLS: ChatCompletionTool[] = [
//   {
//     type: "function",
//     function: {
//       name: "query_strapi",
//       description: "Execute a Strapi collection query",
//       parameters: {
//         type: "object",
//         properties: {
//           collection: { type: "string" },
//           filters: {
//             type: "object",
//             additionalProperties: { type: "string" },
//           },
//         },
//         required: ["collection", "filters"],
//       },
//     },
//   },
// ];

// /* -------------------------------------------------- */
// /* STEP 1: AI SIGNAL EXTRACTION (NO COLLECTION PICK)  */
// /* -------------------------------------------------- */

// async function extractSignals(question: string) {
//   const res = await openai.chat.completions.create({
//     model: "gpt-4.1-mini",
//     temperature: 0,
//     response_format: { type: "json_object" },
//     messages: [
//       {
//         role: "system",
//         content: `
// Extract search signals.

// Rules:
// - Extract filters mentioned
// - Extract keywords (nouns / verbs)
// - Do NOT choose a collection
// - Do NOT invent values
// - Return JSON ONLY

// Format:
// {
//   "filters": { "<field>": "<value>" },
//   "keywords": ["word1", "word2"]
// }
//         `.trim(),
//       },
//       { role: "user", content: question },
//     ],
//   });

//   return JSON.parse(res.choices[0].message.content || "{}");
// }

// /* -------------------------------------------------- */
// /* STEP 2: GENERIC COLLECTION SCORING                 */
// /* -------------------------------------------------- */

// function scoreCollection(
//   collection: { name: string; fields: string[] },
//   filters: Record<string, string>,
//   keywords: string[]
// ) {
//   let score = 0;

//   for (const f of Object.keys(filters)) {
//     if (collection.fields.includes(f)) score += 3;
//   }

//   for (const k of keywords) {
//     if (collection.name.includes(k)) score += 2;
//   }

//   return score;
// }

// /* -------------------------------------------------- */
// /* REALTIME HANDLER (AI THINKS → FUNCTION EXECUTES)   */
// /* -------------------------------------------------- */

// async function handleRealtime(ctx: any, question: string, strapi: any) {
//   console.log("🔵 Realtime handler");

//   const { filters = {}, keywords = [] } = await extractSignals(question);
//   console.log("🟠 AI signals:", { filters, keywords });

//   const scored = AVAILABLE_COLLECTIONS.map(c => ({
//     ...c,
//     score: scoreCollection(c, filters, keywords),
//   })).sort((a, b) => b.score - a.score);

//   const best = scored[0];
//   if (!best || best.score === 0) return false;

//   console.log("🟢 Selected collection:", best.name);

//   /* ---------- FUNCTION CALLING (YOU ASKED FOR THIS) ---------- */

//   const exec = await openai.chat.completions.create({
//     model: "gpt-4.1-mini",
//     temperature: 0,
//     tools: TOOLS,
//     tool_choice: { type: "function", function: { name: "query_strapi" } },
//     messages: [
//       {
//         role: "system",
//         content: "Execute the prepared Strapi query using the function.",
//       },
//       {
//         role: "user",
//         content: JSON.stringify({
//           collection: best.name,
//           filters,
//         }),
//       },
//     ],
//   });

//   const call = exec.choices[0].message.tool_calls?.[0];
//   if (!call) return false;

// if (call.type !== "function") {
//   throw new Error("Expected function tool call");
// }

// const args = JSON.parse(call.function.arguments);
// console.log("🟣 Function args:", args);

// // 🔥 DO NOT TRUST args.filters
// const strapiFilters: Record<string, any> = {};
// for (const key in filters) {
//   if (best.fields.includes(key)) {
//     strapiFilters[key] = { $containsi: filters[key] };
//   }
// }

//   console.log("🔍 Filters sent to Strapi:", strapiFilters);

//   const uid = `api::${best.name}.${best.name}`;
//   const result = await strapi.entityService.findMany(uid, {
//     filters: strapiFilters,
//     limit: 10,
//   });

//   ctx.body = {
//     type: "collection",
//     title: best.name,
//     schema: best.fields,
//     items: result.map((row: any) => {
//       const clean: any = {};
//       for (const f of best.fields) clean[f] = row[f];
//       return clean;
//     }),
//   };

//   console.log("✅ Realtime cards sent:", result.length);
//   return true;
// }

// /* -------------------------------------------------- */
// /* FAQ HANDLER — ❗ UNCHANGED (YOUR ORIGINAL)         */
// /* -------------------------------------------------- */

// async function handleFAQ(ctx: any, question: string, strapi: any) {
//   const embeddingResponse = await openai.embeddings.create({
//     model: "text-embedding-3-small",
//     input: question,
//   });

//   const userVector = embeddingResponse.data[0].embedding;
//   const knex = strapi.db.connection;

//   const results = await knex("items")
//     .select(
//       "id",
//       "question",
//       "answer",
//       knex.raw("(embedding <=> ?::vector) AS distance", [
//         JSON.stringify(userVector),
//       ])
//     )
//     .orderByRaw("embedding <=> ?::vector", [
//       JSON.stringify(userVector),
//     ])
//     .limit(1);

//   const bestMatch = results?.[0];

//   if (!bestMatch || bestMatch.distance > 0.85) {
//     ctx.body = { type: "text", content: "Answer not available." };
//     return;
//   }

//   const prompt = `
// You are a factual FAQ answer extractor.

// Rules:
// - Use ONLY the FAQ content
// - Answer precisely
// - Max 2–3 sentences
// - No filler

// FAQ:
// ${bestMatch.answer}

// User Question:
// ${question}

// Answer:
//   `.trim();

//   const completion = await openai.chat.completions.create({
//     model: "gpt-4.1-mini",
//     temperature: 0,
//     messages: [{ role: "user", content: prompt }],
//   });

//   ctx.body = {
//     type: "text",
//     content: completion.choices[0].message.content,
//   };
// }

// /* -------------------------------------------------- */
// /* CONTROLLER (ENTRY POINT)                           */
// /* -------------------------------------------------- */

// export default factories.createCoreController(
//   "api::item.item",
//   ({ strapi }) => ({
//     async ask(ctx) {
//       const { question } = ctx.request.body;
//       console.log("🟣 Question:", question);

//       const intentRes = await openai.chat.completions.create({
//         model: "gpt-4.1-mini",
//         temperature: 0,
//         messages: [
//           {
//             role: "system",
//             content: `
// Decide intent:
// - realtime → listings, search, availability
// - faq → explanations, policies

// Reply ONLY: realtime or faq
//             `.trim(),
//           },
//           { role: "user", content: question },
//         ],
//       });

//       const intent =
//         intentRes.choices[0].message.content?.trim().toLowerCase();

//       console.log("🟡 Intent:", intent);

//       if (intent === "realtime") {
//         const handled = await handleRealtime(ctx, question, strapi);
//         if (handled) return;
//       }

//       await handleFAQ(ctx, question, strapi);
//     },
//   })
// );



// import { factories } from "@strapi/strapi";
// import OpenAI from "openai";
// import type { ChatCompletionTool } from "openai/resources/chat/completions";

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY!,
// });

// /* -------------------------------------------------- */
// /* ADMIN CONFIG (ONLY PLACE YOU DEFINE SCHEMA)       */
// /* -------------------------------------------------- */

// const AVAILABLE_COLLECTIONS = [
//   { name: "deal", fields: ["from", "to", "fare"] },
//   { name: "flight", fields: ["origin", "destination", "fare"] },
// ];

// /* -------------------------------------------------- */
// /* FUNCTION CALLING TOOL (EXECUTION ONLY)             */
// /* -------------------------------------------------- */

// const TOOLS: ChatCompletionTool[] = [
//   {
//     type: "function",
//     function: {
//       name: "query_strapi",
//       description: "Execute a Strapi collection query",
//       parameters: {
//         type: "object",
//         properties: {
//           collection: { type: "string" },
//           filters: {
//             type: "object",
//             additionalProperties: { type: "string" },
//           },
//         },
//         required: ["collection", "filters"],
//       },
//     },
//   },
// ];

// /* -------------------------------------------------- */
// /* STEP 2: GENERIC COLLECTION SCORING (UNCHANGED)     */
// /* -------------------------------------------------- */

// function scoreCollection(
//   collection: { name: string; fields: string[] },
//   filters: Record<string, string>,
//   keywords: string[]
// ) {
//   let score = 0;

//   for (const f of Object.keys(filters)) {
//     if (collection.fields.includes(f)) score += 3;
//   }

//   for (const k of keywords) {
//     if (collection.name.includes(k)) score += 2;
//   }

//   return score;
// }

// /* -------------------------------------------------- */
// /* REALTIME HANDLER (UNCHANGED LOGIC)                 */
// /* -------------------------------------------------- */

// async function handleRealtime(
//   ctx: any,
//   question: string,
//   strapi: any,
//   filters: Record<string, string>,
//   keywords: string[]
// ) {
//   console.log("🔵 Realtime handler");
//   console.log("🟠 AI signals:", { filters, keywords });

//   const scored = AVAILABLE_COLLECTIONS.map(c => ({
//     ...c,
//     score: scoreCollection(c, filters, keywords),
//   })).sort((a, b) => b.score - a.score);

//   const best = scored[0];
//   if (!best || best.score === 0) return false;

//   console.log("🟢 Selected collection:", best.name);

//   /* ---------- FUNCTION CALLING (UNCHANGED) ---------- */

//   const exec = await openai.chat.completions.create({
//     model: "gpt-4.1-mini",
//     temperature: 0,
//     tools: TOOLS,
//     tool_choice: { type: "function", function: { name: "query_strapi" } },
//     messages: [
//       {
//         role: "system",
//         content: "Execute the prepared Strapi query using the function.",
//       },
//       {
//         role: "user",
//         content: JSON.stringify({
//           collection: best.name,
//           filters,
//         }),
//       },
//     ],
//   });

//   const call = exec.choices[0].message.tool_calls?.[0];
//   if (!call) return false;

//   if (call.type !== "function") {
//     throw new Error("Expected function tool call");
//   }

//   const args = JSON.parse(call.function.arguments);
//   console.log("🟣 Function args:", args);

//   // 🔥 DO NOT TRUST args.filters (UNCHANGED)
//   const strapiFilters: Record<string, any> = {};
//   for (const key in filters) {
//     if (best.fields.includes(key)) {
//       strapiFilters[key] = { $containsi: filters[key] };
//     }
//   }

//   console.log("🔍 Filters sent to Strapi:", strapiFilters);

//   const uid = `api::${best.name}.${best.name}`;
//   const result = await strapi.entityService.findMany(uid, {
//     filters: strapiFilters,
//     limit: 10,
//   });

//   ctx.body = {
//     type: "collection",
//     title: best.name,
//     schema: best.fields,
//     items: result.map((row: any) => {
//       const clean: any = {};
//       for (const f of best.fields) clean[f] = row[f];
//       return clean;
//     }),
//   };

//   console.log("✅ Realtime cards sent:", result.length);
//   return true;
// }

// /* -------------------------------------------------- */
// /* FAQ HANDLER — ❗ EXACTLY UNCHANGED                 */
// /* -------------------------------------------------- */

// async function handleFAQ(ctx: any, question: string, strapi: any) {
//   const embeddingResponse = await openai.embeddings.create({
//     model: "text-embedding-3-small",
//     input: question,
//   });

//   const userVector = embeddingResponse.data[0].embedding;
//   const knex = strapi.db.connection;

//   const results = await knex("items")
//     .select(
//       "id",
//       "question",
//       "answer",
//       knex.raw("(embedding <=> ?::vector) AS distance", [
//         JSON.stringify(userVector),
//       ])
//     )
//     .orderByRaw("embedding <=> ?::vector", [
//       JSON.stringify(userVector),
//     ])
//     .limit(1);

//   const bestMatch = results?.[0];

//   if (!bestMatch || bestMatch.distance > 0.85) {
//     ctx.body = { type: "text", content: "Answer not available." };
//     return;
//   }

//   const prompt = `
// You are a factual FAQ answer extractor.

// Rules:
// - Use ONLY the FAQ content
// - Answer precisely
// - Max 2–3 sentences
// - No filler

// FAQ:
// ${bestMatch.answer}

// User Question:
// ${question}

// Answer:
//   `.trim();

//   const completion = await openai.chat.completions.create({
//     model: "gpt-4.1-mini",
//     temperature: 0,
//     messages: [{ role: "user", content: prompt }],
//   });

//   ctx.body = {
//     type: "text",
//     content: completion.choices[0].message.content,
//   };
// }

// /* -------------------------------------------------- */
// /* CONTROLLER (ONLY PART MERGED)                      */
// /* -------------------------------------------------- */

// export default factories.createCoreController(
//   "api::item.item",
//   ({ strapi }) => ({
//     async ask(ctx) {
//       const { question } = ctx.request.body;
//       console.log("🟣 Question:", question);

//       /* 🔥 SINGLE AI CALL: INTENT + SIGNALS */

//       const intentRes = await openai.chat.completions.create({
//         model: "gpt-4.1-mini",
//         temperature: 0,
//         response_format: { type: "json_object" },
//         messages: [
//           {
//             role: "system",
//             content: `
// Analyze the user question.

// Tasks:
// 1. Decide intent: "realtime" or "faq"
// 2. If realtime, extract filters and keywords

// Rules:
// - Do NOT invent values
// - Return JSON ONLY

// Format:
// {
//   "intent": "realtime | faq",
//   "filters": { "<field>": "<value>" },
//   "keywords": ["word1", "word2"]
// }
//             `.trim(),
//           },
//           { role: "user", content: question },
//         ],
//       });

//       const parsed = JSON.parse(intentRes.choices[0].message.content || "{}");
//       const intent = parsed.intent;
//       const filters = parsed.filters || {};
//       const keywords = parsed.keywords || [];

//       console.log("🟡 Intent:", intent);

//       if (intent === "realtime") {
//         const handled = await handleRealtime(
//           ctx,
//           question,
//           strapi,
//           filters,
//           keywords
//         );
//         if (handled) return;
//       }

//       await handleFAQ(ctx, question, strapi);
//     },
//   })
// );

//workig

// import { factories } from "@strapi/strapi";
// import OpenAI from "openai";
// import type { ChatCompletionTool } from "openai/resources/chat/completions";

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY!,
// });

// /* -------------------------------------------------- */
// /* SCHEMA (SINGLE SOURCE OF TRUTH)                    */
// /* -------------------------------------------------- */

// const SCHEMA = {
//   deal: {
//     from: { type: "string", operators: ["$containsi"] },
//     to: { type: "string", operators: ["$containsi"] },
//     fare: { type: "number", operators: ["$lt", "$gt", "$eq", "$between"] },
//   },
//   flight: {
//     origin: { type: "string", operators: ["$containsi"] },
//     destination: { type: "string", operators: ["$containsi"] },
//     fare: { type: "number", operators: ["$lt", "$gt", "$eq"] },
//   },
// };

// /* -------------------------------------------------- */
// /* FUNCTION CALLING TOOL (UNCHANGED)                  */
// /* -------------------------------------------------- */

// const TOOLS: ChatCompletionTool[] = [
//   {
//     type: "function",
//     function: {
//       name: "query_strapi",
//       description: "Execute a Strapi query",
//       parameters: {
//         type: "object",
//         properties: {
//           collection: { type: "string" },
//           filters: { type: "object" },
//           sort: { type: "array", items: { type: "string" } },
//         },
//         required: ["collection"],
//       },
//     },
//   },
// ];

// /* -------------------------------------------------- */
// /* GENERIC REALTIME HANDLER                           */
// /* -------------------------------------------------- */

// async function handleRealtime(ctx: any, strapi: any, plan: any) {
//   console.log("🔵 REALTIME HANDLER START");
//   console.log("🧩 PLAN RECEIVED:", JSON.stringify(plan, null, 2));

//   const { collection, filters = {}, sort } = plan;

//   const schema = (SCHEMA as any)[collection];
//   if (!schema) {
//     console.log("❌ COLLECTION NOT IN SCHEMA:", collection);
//     return false;
//   }

//   const strapiFilters: Record<string, any> = {};

//   /* ---------- VALIDATE & APPLY FILTERS ---------- */

//   for (const field in filters) {
//     if (!schema[field]) {
//       console.log(`⚠️ FIELD DROPPED (not in schema): ${field}`);
//       continue;
//     }

//     const allowedOps = schema[field].operators;
//     const ops = filters[field];

//     for (const op in ops) {
//       if (!allowedOps.includes(op)) {
//         console.log(`⚠️ OPERATOR DROPPED: ${field}.${op}`);
//         continue;
//       }

//       if (op === "$between" && Array.isArray(ops[op])) {
//         strapiFilters[field] = {
//           $gte: ops[op][0],
//           $lte: ops[op][1],
//         };
//       } else {
//         strapiFilters[field] = { [op]: ops[op] };
//       }
//     }
//   }

//   console.log(
//     "🔍 STRAPI FILTERS (FINAL):",
//     JSON.stringify(strapiFilters, null, 2)
//   );
//   console.log("↕️ SORT APPLIED:", sort);

//   const uid = `api::${collection}.${collection}`;

//   const result = await strapi.entityService.findMany(uid, {
//     filters: strapiFilters,
//     sort,
//     limit: 10,
//   });

//   console.log("📦 STRAPI RESULT COUNT:", result.length);
//   console.log("📦 STRAPI RAW RESULT:", result);

//   ctx.body = {
//     type: "collection",
//     title: collection,
//     schema: Object.keys(schema),
//     items: result.map((row: any) => {
//       const clean: any = {};
//       for (const f of Object.keys(schema)) clean[f] = row[f];
//       return clean;
//     }),
//   };

//   console.log("✅ REALTIME HANDLER END");
//   return true;
// }

// /* -------------------------------------------------- */
// /* FAQ HANDLER — ❗ UNCHANGED (LOGS ADDED ONLY)       */
// /* -------------------------------------------------- */

// async function handleFAQ(ctx: any, question: string, strapi: any) {
//   const embeddingResponse = await openai.embeddings.create({
//     model: "text-embedding-3-small",
//     input: question,
//   });

//   const userVector = embeddingResponse.data[0].embedding;
//   const knex = strapi.db.connection;

//   const results = await knex("items")
//     .select(
//       "id",
//       "question",
//       "answer",
//       knex.raw("(embedding <=> ?::vector) AS distance", [
//         JSON.stringify(userVector),
//       ])
//     )
//     .orderByRaw("embedding <=> ?::vector", [
//       JSON.stringify(userVector),
//     ])
//     .limit(1);

//   const bestMatch = results?.[0];

//   if (!bestMatch || bestMatch.distance > 0.85) {
//     ctx.body = { type: "text", content: "Answer not available." };
//     return;
//   }

//   const prompt = `
// You are a factual FAQ answer extractor.

// Rules:
// - Use ONLY the FAQ content
// - Answer precisely
// - Max 2–3 sentences
// - No filler

// FAQ:
// ${bestMatch.answer}

// User Question:
// ${question}

// Answer:
//   `.trim();

//   const completion = await openai.chat.completions.create({
//     model: "gpt-4.1-mini",
//     temperature: 0,
//     messages: [{ role: "user", content: prompt }],
//   });

//   ctx.body = {
//     type: "text",
//     content: completion.choices[0].message.content,
//   };
// }


// /* -------------------------------------------------- */
// /* CONTROLLER — GENERIC PROMPT                        */
// /* -------------------------------------------------- */

// export default factories.createCoreController(
//   "api::item.item",
//   ({ strapi }) => ({
//     async ask(ctx) {
//       const { question } = ctx.request.body;
//       console.log("🟣 USER QUESTION:", question);

//       const ai = await openai.chat.completions.create({
//         model: "gpt-4.1-mini",
//         temperature: 0,
//         response_format: { type: "json_object" },
//         messages: [
//           {
//             role: "system",
//             content: `
// You are a generic query planner.

// Schema:
// ${JSON.stringify(SCHEMA, null, 2)}

// Rules:
// - Use ONLY fields & operators from schema
// - Do NOT invent anything
// - Convert "under / above / cheapest / expensive" into operators
// - Return JSON ONLY

// Format:
// {
//   "intent": "realtime | faq",
//   "collection": "<collection>",
//   "filters": {
//     "<field>": { "<operator>": value }
//   },
//   "sort": ["<field>:asc | desc"]
// }
//             `.trim(),
//           },
//           { role: "user", content: question },
//         ],
//       });

//       const rawContent = ai.choices[0].message.content;
//       console.log("🧠 RAW AI CONTENT:", rawContent);

//       const parsed = JSON.parse(rawContent || "{}");
//       console.log("🧩 PARSED PLAN:", JSON.stringify(parsed, null, 2));

//       if (parsed.intent === "realtime") {
//         const handled = await handleRealtime(ctx, strapi, parsed);
//         if (handled) return;
//       }

//       await handleFAQ(ctx, question, strapi);
//     },
//   })
// );


// //full wokring wothour funcioncalling
// import { factories } from "@strapi/strapi";
// import OpenAI from "openai";

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY!,
// });

// /* -------------------------------------------------- */
// /* SIMPLE CONFIG — YOUR OLD STYLE                     */
// /* -------------------------------------------------- */

// const AVAILABLE_COLLECTIONS = [
//   { name: "deal", fields: ["from", "to", "fare","description"] },
//   { name: "flight", fields: ["origin", "destination", "fare","description"] },
// ];

// /* -------------------------------------------------- */
// /* REALTIME HANDLER (NO buildSchema)                  */
// /* -------------------------------------------------- */

// async function handleRealtime(ctx: any, strapi: any, plan: any) {
//   console.log(" REALTIME HANDLER");
//   console.log(" PLAN:", JSON.stringify(plan, null, 2));

//   const { collection, filters = {}, sort } = plan;

//   const config = AVAILABLE_COLLECTIONS.find(
//     c => c.name === collection
//   );
//   if (!config) return false;

//   const strapiFilters: Record<string, any> = {};

//   // 🔥 trust AI filters directly
//   for (const field in filters) {
//     if (!config.fields.includes(field)) continue;

//     const ops = filters[field];
//     for (const op in ops) {
//       if (op === "$between" && Array.isArray(ops[op])) {
//         strapiFilters[field] = {
//           $gte: ops[op][0],
//           $lte: ops[op][1],
//         };
//       } else {
//         strapiFilters[field] = { [op]: ops[op] };
//       }
//     }
//   }

//   console.log("🔍 STRAPI FILTERS:", strapiFilters);
//   console.log("↕️ SORT:", sort);

//   const uid = `api::${collection}.${collection}`;

//   const result = await strapi.entityService.findMany(uid, {
//     filters: strapiFilters,
//     sort,
//     limit: 10,
//   });

//   ctx.body = {
//     type: "collection",
//     title: collection,
//     schema: config.fields,
//     items: result.map((row: any) => {
//       const clean: any = {};
//       for (const f of config.fields) clean[f] = row[f];
//       return clean;
//     }),
//   };

//   return true;
// }

// /* -------------------------------------------------- */
// /* FAQ HANDLER — EXACTLY YOUR ORIGINAL                */
// /* -------------------------------------------------- */

// async function handleFAQ(ctx: any, question: string, strapi: any) {
//   const embeddingResponse = await openai.embeddings.create({
//     model: "text-embedding-3-small",
//     input: question,
//   });

//   const userVector = embeddingResponse.data[0].embedding;
//   const knex = strapi.db.connection;
//   const results = await knex("items") 
//     .select(
//       "id",
//       "question",
//       "answer",
//       knex.raw("(embedding <=> ?::vector) AS distance", [
//         JSON.stringify(userVector),
//       ])
//     )
//     .orderByRaw("embedding <=> ?::vector", [
//       JSON.stringify(userVector),
//     ])
//     .limit(1);
// //
//   const bestMatch = results?.[0];

//   if (!bestMatch || bestMatch.distance > 0.85) {
//     ctx.body = { type: "text", content: "Answer not available." };
//     return;
//   }

//   const prompt = `
// You are a factual FAQ answer extractor.

// Rules:
// - Use ONLY the FAQ content
// - Answer precisely
// - Max 2–3 sentences
// - No filler

// FAQ:
// ${bestMatch.answer}

// User Question:
// ${question}

// Answer:
//   `.trim();

//   const completion = await openai.chat.completions.create({
//     model: "gpt-4.1-mini",
//     temperature: 0,
//     messages: [{ role: "user", content: prompt }],
//   });

//   ctx.body = {
//     type: "text",
//     content: completion.choices[0].message.content,
//   };
// }

// /* -------------------------------------------------- */
// /* CONTROLLER — PROMPT IS SOURCE OF TRUTH             */
// /* -------------------------------------------------- */

// export default factories.createCoreController(
//   "api::item.item",
//   ({ strapi }) => ({
//     async ask(ctx) {
//       const { question } = ctx.request.body;
//       console.log("🟣 QUESTION:", question);

//       const ai = await openai.chat.completions.create({
//         model: "gpt-4.1-mini",
//         temperature: 0,
//         response_format: { type: "json_object" },
//         messages: [
//           {
//   role: "system",
//   content: `
// You are a generic natural-language query planner.

// Available collections and fields:
// ${JSON.stringify(AVAILABLE_COLLECTIONS, null, 2)}

// Your tasks:
// 1. Decide intent: "realtime" (data lookup) or "faq" (explanation)
// 2. If realtime:
//    - Select the most relevant collection
//    - Identify which fields are constrained by the user query
//    - Extract values mentioned by the user
//    - Infer comparisons, ranges, or superlatives
//    - Convert them into structured filters and sorting

// Semantic understanding rules (IMPORTANT):

// 1. Concept mapping:
// - Treat words with similar meaning as equivalent concepts
//   - source / origin / start / from → starting location
//   - destination / target / arrival / to → ending location
//   - price / cost / fare / amount / budget → numeric cost
//   - cheapest / lowest / minimum → ascending sort
//   - expensive / highest / maximum → descending sort

// 2. Abbreviation & alias normalization:
// - If the user provides a shortened form, code, or abbreviation for a place,
//   infer the most likely full name using common travel conventions.
// - Examples of patterns (not an exhaustive list):
//   - city abbreviations (e.g., "cbe", "blr", "hyd")
//   - airport-style codes
//   - commonly used short forms
// - Always expand abbreviations into their full, human-readable form
//   before applying filters.

// 3. Field mapping:
// - Map inferred concepts to the appropriate field names
//   based on the selected collection’s fields.

// Comparison inference:
// - under / below / less than → "$lt"
// - above / over / greater than → "$gt"
// - exactly / equal → "$eq"
// - between X and Y → "$between"

// Filtering rules:
// - Use "$containsi" for text fields
// - Use numeric operators for numeric fields
// - Only use fields that exist in the selected collection
// - Never invent fields or collections

// Output rules:
// - Return ONLY valid JSON
// - No explanations or comments
// - Missing information → omit the filter

// Output format:
// {
//   "intent": "realtime | faq",
//   "collection": "<collection name>",
//   "filters": {
//     "<field>": { "<operator>": value }
//   },
//   "sort": ["<field>:asc | desc"]
// }
//   `.trim(),


//           },
//           { role: "user", content: question },
//         ],
//       });

//       const parsed = JSON.parse(
//         ai.choices[0].message.content || "{}"
//       );

//       console.log("🧠 AI PLAN:", parsed);

//       if (parsed.intent === "realtime") {
//         const handled = await handleRealtime(ctx, strapi, parsed);
//         if (handled) return;
//       }

//       await handleFAQ(ctx, question, strapi);
//     },
//   })
// );


//chatgpt now wokring on - final

// import { factories } from "@strapi/strapi";
// import OpenAI from "openai";
// import type { ChatCompletionTool } from "openai/resources/chat/completions";

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY!,
// });

// /* -------------------------------------------------- */
// /* AVAILABLE COLLECTIONS (SOURCE OF TRUTH)            */
// /* -------------------------------------------------- */

// const AVAILABLE_COLLECTIONS = [
//   { name: "deal", fields: ["from", "to", "fare", "description"] },
//   { name: "flight", fields: ["origin", "destination", "fare", "description"] },
// ];

// /* -------------------------------------------------- */
// /* FUNCTION TOOL — STRUCTURE ONLY                     */
// /* -------------------------------------------------- */

// const TOOLS: ChatCompletionTool[] = [
//   {
//     type: "function",
//     function: {
//       name: "realtime_query",
//       description: "Plan a Strapi query using filters and sort",
//       parameters: {
//         type: "object",
//         properties: {
//           intent: {
//             type: "string",
//             enum: ["realtime", "faq"],
//           },
//           collection: {
//             type: "string",
//           },
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

// /* -------------------------------------------------- */
// /* REALTIME HANDLER (GENERIC, JSON-MODE EQUIVALENT)   */
// /* -------------------------------------------------- */

// async function handleRealtime(ctx: any, strapi: any, plan: any) {
//   console.log(" REALTIME HANDLER");
//   console.log(" PLAN:", JSON.stringify(plan, null, 2));

//   const config = AVAILABLE_COLLECTIONS.find(
//     (c) => c.name === plan.collection
//   );
//   if (!config) {
//     console.log("❌ Invalid collection");
//     return false;
//   }

//   const uid = `api::${plan.collection}.${plan.collection}`;

//   const result = await strapi.entityService.findMany(uid, {
//     filters: plan.filters || {}, // allow empty = list all
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

// /* -------------------------------------------------- */
// /* FAQ VECTOR SEARCH (UNCHANGED BEHAVIOR)             */
// /* -------------------------------------------------- */

// async function handleFAQ(ctx: any, question: string, strapi: any) {
//   const embeddingResponse = await openai.embeddings.create({
//     model: "text-embedding-3-small",
//     input: question,
//   });

//   const userVector = embeddingResponse.data[0].embedding;
//   const knex = strapi.db.connection;

//   const results = await knex("items")
//     .select(
//       "answer",
//       knex.raw("(embedding <=> ?::vector) AS distance", [
//         JSON.stringify(userVector),
//       ])
//     )
//     .orderByRaw("embedding <=> ?::vector", [
//       JSON.stringify(userVector),
//     ])
//     .limit(1);

//   const bestMatch = results?.[0];

//   if (!bestMatch || bestMatch.distance > 0.85) {
//     ctx.body = { type: "text", content: "Answer not available." };
//     return;
//   }

//   const prompt = `
// You are a factual FAQ answer extractor.

// Rules:
// - Use ONLY the FAQ content
// - Answer precisely
// - Max 2–3 sentences
// - No filler

// FAQ:
// ${bestMatch.answer}

// User Question:
// ${question}

// Answer:
// `.trim();

//   const completion = await openai.chat.completions.create({
//     model: "gpt-4.1-mini",
//     temperature: 0,
//     messages: [{ role: "user", content: prompt }],
//   });

//   ctx.body = {
//     type: "text",
//     content: completion.choices[0].message.content,
//   };
// }

// /* -------------------------------------------------- */
// /* CONTROLLER — SINGLE ENTRY POINT                    */
// /* -------------------------------------------------- */

// export default factories.createCoreController(
//   "api::item.item",
//   ({ strapi }) => ({
//     async ask(ctx) {
//       const { question } = ctx.request.body;
//       console.log("🟣 QUESTION:", question);

//       const completion = await openai.chat.completions.create({
//         model: "gpt-4.1-mini",
//         temperature: 0,
//         tools: TOOLS,
//         tool_choice: "auto",
//         messages: [
//           {
//             role: "system",
//             content: `
// You are a query planner AND answerer.

// Rules:
// - You can ONLY request data using Strapi filters and sort.
// - Use "$or" to fetch multiple alternatives in a single query.
// - Use "sort" to rank results (e.g. cheapest → fare:asc).
// - If the user asks to compare options (e.g. "which is cheaper"),
//   fetch all relevant options and let the SORT decide the order.
// - Do NOT ask the backend to compare or calculate.
// - Do NOT invent fields or collections.
// - If no filters exist, return an empty filters object to list all.

// Available collections and fields:
// ${JSON.stringify(AVAILABLE_COLLECTIONS, null, 2)}

// Return ONLY via function call.
// `.trim(),
//           },
//           { role: "user", content: question },
//         ],
//       });

//       const toolCall = completion.choices[0].message.tool_calls?.[0];

//       if (!toolCall || toolCall.type !== "function") {
//         await handleFAQ(ctx, question, strapi);
//         return;
//       }

//       const plan = JSON.parse(toolCall.function.arguments);
//       console.log("🧠 AI PLAN:", plan);

//       if (plan.intent === "realtime") {
//         const handled = await handleRealtime(ctx, strapi, plan);
//         if (handled) return;
//       }

//       await handleFAQ(ctx, question, strapi);
//     },
//   })
// );


//wokring wiht single function tool for planner only
import { factories } from "@strapi/strapi";
import OpenAI from "openai";
import type { ChatCompletionTool } from "openai/resources/chat/completions";
import { PassThrough } from "stream";



const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/* -------------------------------------------------- */
/* AVAILABLE COLLECTIONS (SOURCE OF TRUTH)            */
/* -------------------------------------------------- */

const AVAILABLE_COLLECTIONS = [
  { name: "deal", fields: ["from", "to", "fare", "description"] },
  { name: "flight", fields: ["origin", "destination", "fare"] },
];

/* -------------------------------------------------- */
/* FUNCTION TOOL — PLANNER ONLY                       */
/* -------------------------------------------------- */

const TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "realtime_query",
      description: "Plan a Strapi query using filters and sort",
      parameters: {
        type: "object",
        properties: {
          intent: { type: "string", enum: ["realtime", "faq"] },
          collection: { type: "string" },
          filters: {
            type: "object",
            additionalProperties: true,
          },
          sort: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["intent"],
      },
    },
  },
];

/* -------------------------------------------------- */
/* CONTEXT REWRITER (FOLLOW-UP HANDLING)              */
/* -------------------------------------------------- */

async function rephraseQuestion(history: any[], question: string) {
  if (!history || !Array.isArray(history) || history.length === 0) {
    console.log("📝 REWRITE: skipped (no history)");
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
    console.log(`📝 REWRITE: "${question}" → "${rewritten}"`);
    return rewritten || question;
  } catch {
    return question;
  }
}

/* -------------------------------------------------- */
/* REALTIME HANDLER (FILTERING WORKS)                 */
/* -------------------------------------------------- */

async function handleRealtime(ctx: any, strapi: any, plan: any) {
  console.log("🟢 REALTIME HANDLER");
  console.log("📦 PLAN:", JSON.stringify(plan, null, 2));

  const config = AVAILABLE_COLLECTIONS.find(
    (c) => c.name === plan.collection
  );
  if (!config) return false;

  const uid = `api::${plan.collection}.${plan.collection}`;

  const result = await strapi.entityService.findMany(uid, {
    filters: plan.filters || {},
    sort: plan.sort,
    limit: 10,
    fields: config.fields, // ensures description is returned
  });

  ctx.body = {
    type: "collection",
    title: plan.collection,
    schema: config.fields,
    items: result.map((row: any) => {
      const clean: any = {};
      for (const f of config.fields) clean[f] = row[f];
      return clean;
    }),
  };

  return true;
}

/* -------------------------------------------------- */
/* FAQ VECTOR SEARCH (UNCHANGED, GENERIC)             */
/* -------------------------------------------------- */



async function handleFAQ(ctx: any, question: string, strapi: any) {
  console.log(":blue_book: FAQ QUESTION:", question);

  /* -------------------------------------------------- */
  /* VECTOR SEARCH (UNCHANGED)                          */
  /* -------------------------------------------------- */
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: question,
  });

  const vector = embedding.data[0].embedding;
  const knex = strapi.db.connection;

  const results = await knex("items")
    .select(
      "answer",
      knex.raw("(embedding <=> ?::vector) AS distance", [
        JSON.stringify(vector),
      ])
    )
    .orderByRaw("embedding <=> ?::vector", [JSON.stringify(vector)])
    .limit(4);

  if (!results.length || results[0].distance > 0.85) {
    ctx.body = { type: "text", content: "Answer not available." };
    return;
  }

  const contextBlock = results.map(r => r.answer).join("\n---\n");

  /* -------------------------------------------------- */
  /* HISTORY EXTRACTION (UNCHANGED)                     */
  /* -------------------------------------------------- */
  let lastAssistantMessage = "None";
  const history = ctx.request.body.history || [];
  if (history && Array.isArray(history)) {
    const lastMsg = [...history].reverse().find(m => m.role === "assistant");
    if (lastMsg && lastMsg.content) lastAssistantMessage = lastMsg.content;
  }

  /* -------------------------------------------------- */
  /* SSE SETUP                                          */
  /* -------------------------------------------------- */
  ctx.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  ctx.status = 200;

  ctx.res.socket?.setNoDelay(true);

  const stream = new PassThrough();
  ctx.body = stream;

const send = (data: any) => {
  stream.write(`data: ${JSON.stringify(data)}\n\n`);
  (ctx.res as any).flush?.();
};

  /* -------------------------------------------------- */
  /* OPENAI STREAM (PROMPT UNCHANGED)                   */
  /* -------------------------------------------------- */
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    stream: true,
    messages: [
      {
        role: "system",
        content: `
      ### ROLE
      You are a specialized Knowledge-Base Assistant acting as a plugin for this website.

            ### CORE INSTRUCTIONS
            1. **Source of Truth:** Use the [CONTEXT] below.
            2. **Smart Inference:** Correct typos and infer intent.
            3. **Semantic Flexibility:** If user asks broadly (e.g., "Policy") and the context has specifics, synthesize the answer.

            ### RESPONSE LOGIC
            *   **CASE A: Yes/No Questions**
                *   Output: Exactly ONE single sentence.
                *   Rule: Start with "Yes," or "No," AND immediately include the condition/rule from context.
            *   **CASE B: Quantitative Questions**
                *   Output: Exactly ONE single sentence with the value.
            *   **CASE C: General / Explanatory**
                *   Output: Direct answer followed by details.


      ### DATABASE CONTEXT
      ${contextBlock}

      ### LAST MESSAGE (For Context Only)
      "${lastAssistantMessage}"

      ### CURRENT USER INPUT
      Original: "${question}"
      (System Note: Interpreted for search as: "${question}")
        `.trim(),
      },
      {
        role: "user",
        content: question,
      },
    ],
  });

  /* -------------------------------------------------- */
  /* STREAM TOKENS                                      */
  /* -------------------------------------------------- */
for await (const chunk of completion) {
  const token = chunk.choices[0]?.delta?.content;
  if (token) send({ type: "token", value: token });
}
send({ type: "done" });
stream.end();

  // ❗ only end if not already ended
  // if (!stream.writableEnded) {
  //   send({ type: "done" });
  //   stream.end();
  // }
}


/* -------------------------------------------------- */
/* CONTROLLER — SINGLE OPTIMIZED ENTRY                */
/* -------------------------------------------------- */

export default factories.createCoreController(
  "api::item.item",
  ({ strapi }) => ({
    async ask(ctx) {
      const { question, history = [] } = ctx.request.body;
      console.log("🟣 QUESTION:", question);

      /* 1️⃣ CONTEXT-AWARE REWRITE */
      // const standaloneQuestion = await rephraseQuestion(history, question);

      /* 2️⃣ STRICT PLANNER (FORCES FILTERS) */
      const completion = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        temperature: 0,
        tools: TOOLS,
        tool_choice: "auto",
        messages: [
          {
            role: "system",
            content: `
You are a STRICT query planner.

MANDATORY RULES:
- You MUST extract filters if the user mentions:
  - locations (from / to / origin / destination)
  - price / budget / under / above / less than / more than
- NEVER ignore constraints mentioned by the user
- If intent is "realtime" and constraints exist:
  - filters MUST be non-empty
- Use:
  - $containsi for text
  - $lt / $gt / $between for numbers
  - $or for alternatives
- Use sort ONLY when ranking is requested
- ONLY use empty filters {} if the user explicitly asks "show all"
- If filters cannot be inferred → intent MUST be "faq"

Available collections:
${JSON.stringify(AVAILABLE_COLLECTIONS, null, 2)}

Return ONLY via function call.
`.trim(),
          },
          { role: "user", content: question },
        ],
      });

      const toolCall = completion.choices[0].message.tool_calls?.[0];

      if (!toolCall || toolCall.type !== "function") {
        // no planner result → FAQ
        const rewritten = await rephraseQuestion(history, question);
        await handleFAQ(ctx, rewritten, strapi);
        return;
      }

      const plan = JSON.parse(toolCall.function.arguments);
      console.log("🧠 AI PLAN:", plan);

      if (plan.intent === "realtime") {
        // 🚫 NO rewrite here
        const handled = await handleRealtime(ctx, strapi, plan);
        if (handled) return;
      }

      // ✅ FAQ ONLY → rewrite
      const rewritten = await rephraseQuestion(history, question);
      await handleFAQ(ctx, rewritten, strapi);

    },
  })
);


//full wokr-last
// import { factories } from "@strapi/strapi";
// import OpenAI from "openai";
// import type { ChatCompletionTool } from "openai/resources/chat/completions";

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY!,
// });

// /* -------------------------------------------------- */
// /* AVAILABLE COLLECTIONS                              */
// /* -------------------------------------------------- */

// const AVAILABLE_COLLECTIONS = [
//   { name: "deal", fields: ["from", "to", "fare", "description"] },
//   { name: "flight", fields: ["origin", "destination", "fare"] },
// ];

// /* -------------------------------------------------- */
// /* PLANNER TOOL                                      */
// /* -------------------------------------------------- */

// const PLANNER_TOOL: ChatCompletionTool = {
//   type: "function",
//   function: {
//     name: "realtime_query",
//     description: "Decide intent and plan Strapi query if needed",
//     parameters: {
//       type: "object",
//       properties: {
//         intent: { type: "string", enum: ["realtime", "faq"] },
//         collection: { type: "string" },
//         filters: { type: "object", additionalProperties: true },
//         sort: { type: "array", items: { type: "string" } },
//       },
//       required: ["intent"],
//     },
//   },
// };

// /* -------------------------------------------------- */
// /* FAQ REWRITE TOOL                                  */
// /* -------------------------------------------------- */

// const REWRITE_TOOL: ChatCompletionTool = {
//   type: "function",
//   function: {
//     name: "rewrite_faq_query",
//     description: "Rewrite follow-up FAQ question into standalone form",
//     parameters: {
//       type: "object",
//       properties: {
//         rewritten_question: { type: "string" },
//       },
//       required: ["rewritten_question"],
//     },
//   },
// };

// /* -------------------------------------------------- */
// /* FAQ CONTEXT REWRITE                                */
// /* -------------------------------------------------- */

// async function rewriteForFAQ(history: any[], question: string) {
//   console.log("📜 HISTORY:", history);

//   if (!history || history.length === 0) {
//     console.log("✏️ REWRITE SKIPPED (NO HISTORY)");
//     return question;
//   }

//   const completion = await openai.chat.completions.create({
//     model: "gpt-4o-mini",
//     temperature: 0,
//     tools: [REWRITE_TOOL],
//     tool_choice: {
//       type: "function",
//       function: { name: "rewrite_faq_query" },
//     },
//     messages: [
//       {
//         role: "system",
//         content: `
// Rewrite follow-up FAQ questions.

// Rules:
// - Rewrite ONLY if pronouns or incomplete references exist
// - Examples: it, its, that, which one, how to get it
// - If rewrite not needed, return original question
// - NEVER answer the question
// Return ONLY via function call.
//         `.trim(),
//       },
//       ...history.slice(-4),
//       { role: "user", content: question },
//     ],
//   });

//   const toolCall = completion.choices[0].message.tool_calls?.[0];
//   if (!toolCall || toolCall.type !== "function") return question;

//   const rewritten = JSON.parse(toolCall.function.arguments).rewritten_question;
//   console.log("✏️ REWRITTEN QUESTION:", rewritten);

//   return rewritten || question;
// }

// /* -------------------------------------------------- */
// /* FILTER NORMALIZER                                 */
// /* -------------------------------------------------- */

// function normalizeFilters(filters: any) {
//   if (!filters || typeof filters !== "object") return filters;

//   const normalized: any = {};
//   for (const [key, value] of Object.entries(filters)) {
//     if (typeof value === "string") {
//       normalized[key] = { $containsi: value };
//     } else {
//       normalized[key] = value;
//     }
//   }
//   return normalized;
// }

// /* -------------------------------------------------- */
// /* REALTIME HANDLER                                  */
// /* -------------------------------------------------- */

// async function handleRealtime(ctx: any, strapi: any, plan: any) {
//   console.log("🟢 REALTIME HANDLER");
//   console.log("📦 RAW PLAN:", JSON.stringify(plan, null, 2));

//   const config = AVAILABLE_COLLECTIONS.find(c => c.name === plan.collection);
//   if (!config) {
//     console.log("❌ INVALID COLLECTION");
//     return false;
//   }

//   const uid = `api::${plan.collection}.${plan.collection}`;
//   const safeFilters = normalizeFilters(plan.filters);

//   console.log("📦 NORMALIZED FILTERS:", JSON.stringify(safeFilters, null, 2));

//   const result = await strapi.entityService.findMany(uid, {
//     filters: safeFilters || {},
//     sort: plan.sort,
//     limit: 10,
//     fields: config.fields,
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

// /* -------------------------------------------------- */
// /* FAQ HANDLER (MULTI-ROW CONTEXT)                    */
// /* -------------------------------------------------- */

// async function handleFAQ(ctx: any, question: string, strapi: any) {
//   console.log("📘 FAQ QUESTION:", question);

//   const embedding = await openai.embeddings.create({
//     model: "text-embedding-3-small",
//     input: question,
//   });

//   const vector = embedding.data[0].embedding;
//   const knex = strapi.db.connection;

//   const results = await knex("items")
//     .select(
//       "answer",
//       knex.raw("(embedding <=> ?::vector) AS distance", [
//         JSON.stringify(vector),
//       ])
//     )
//     .orderByRaw("embedding <=> ?::vector", [JSON.stringify(vector)])
//     .limit(4);

//   if (!results.length || results[0].distance > 0.85) {
//     ctx.body = { type: "text", content: "Answer not available." };
//     return;
//   }

//   const contextBlock = results.map(r => r.answer).join("\n---\n");

//   const completion = await openai.chat.completions.create({
//     model: "gpt-4.1-mini",
//     temperature: 0,
//     messages: [
//       {
//         role: "user",
//         content: `
// Use ONLY the FAQ content below.
// You may combine information across entries.
// Do NOT add new facts.
// Max 2–3 sentences.

// FAQ CONTENT:
// ${contextBlock}

// Question:
// ${question}

// Answer:
//         `.trim(),
//       },
//     ],
//   });

//   ctx.body = {
//     type: "text",
//     content: completion.choices[0].message.content,
//   };
// }

// /* -------------------------------------------------- */
// /* CONTROLLER — FINAL                                */
// /* -------------------------------------------------- */

// export default factories.createCoreController(
//   "api::item.item",
//   ({ strapi }) => ({
//     async ask(ctx) {
//       const { question, history = [] } = ctx.request.body;

//       console.log("🟣 USER QUESTION:", question);

//       /* 1️⃣ CONTEXT REWRITE (FAQ ONLY) */
//       const rewrittenQuestion = await rewriteForFAQ(history, question);
//       console.log("🔁 STANDALONE QUESTION:", rewrittenQuestion);

//       /* 2️⃣ PLANNER */
//       const completion = await openai.chat.completions.create({
//         model: "gpt-4.1-mini",
//         temperature: 0,
//         tools: [PLANNER_TOOL],
//         tool_choice: "auto",
//         messages: [
//           {
//             role: "system",
//             content: `
// You are a STRICT intent planner
// - Use "faq" for:
//   benefits, usage, eligibility, discounts, rules, policies, how-to
// - Use "realtime" ONLY if user asks for:
//   listings, prices, availability, routes, deals, flights
// - Realtime MUST have filters if constraints exist
// - NEVER guess filters
// MANDATORY RULES:
// - You MUST extract filters if the user mentions:- locations (from / to / origin / destination)
// - price / budget / under / above / less than / more than
// - NEVER ignore constraints mentioned by the user
// - If intent is "realtime" and constraints exist:
// - filters MUST be non-empty
// - Use:
// - $containsi for text
// - $lt / $gt / $between for numbers
// - $or for alternatives
// - Use sort ONLY when ranking is requested
// - ONLY use empty filters {} if the user explicitly asks "show all"
// - If filters cannot be inferred → intent MUST be "faq"


// Available collections:
// ${JSON.stringify(AVAILABLE_COLLECTIONS, null, 2)}
// Return ONLY via function call.
//             `.trim(),
//           },
//           { role: "user", content: rewrittenQuestion },
//         ],
//       });

//       const toolCall = completion.choices[0].message.tool_calls?.[0];
//       if (!toolCall || toolCall.type !== "function") {
//         console.log("⚠️ NO TOOL CALL → FAQ");
//         await handleFAQ(ctx, rewrittenQuestion, strapi);
//         return;
//       }

//       const plan = JSON.parse(toolCall.function.arguments);
//       console.log("🧠 FINAL PLAN:", JSON.stringify(plan, null, 2));

//       if (plan.intent === "realtime") {
//         const handled = await handleRealtime(ctx, strapi, plan);
//         if (handled) return;
//       }

//       await handleFAQ(ctx, rewrittenQuestion, strapi);
//     },
//   })
// );

