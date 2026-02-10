import { Core } from "@strapi/strapi";
import OpenAI from "openai";

export default ({ strapi }: { strapi: Core.Strapi }) => {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  return {
    async updateEmbedding(uid: string, result: any) {
      try {
        console.log("====================================");
        console.log("🧠 Embedding service called");
        console.log("👉 UID:", uid);
        console.log("👉 ID:", result.id);

        // ✅ Only run for your content-type
        if (!uid.includes("faqqa")) return;

        if (!process.env.OPENAI_API_KEY) {
          console.error("❌ OPENAI_API_KEY missing");
          return;
        }

        // ✅ Build text
        let answerText = result.answer;
        if (typeof answerText === "object") {
          answerText = JSON.stringify(answerText);
        }

        const textToEmbed = [result.question, answerText]
          .filter(Boolean)
          .join("\n")
          .trim();

        console.log("📝 Text:", textToEmbed);

        if (!textToEmbed) return;

        // ✅ Generate embedding
        const response = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: textToEmbed,
        });

        const vector = response.data[0].embedding;

        // ✅ pgvector MUST use [ ... ]
        const vectorString = `[${vector.join(",")}]`;

        console.log("📊 Vector length:", vector.length);

        const tableName = "chatbot_config_faqqas";
        const id = result.id;

        const knex = strapi.db.connection;

        // ✅ IMPORTANT: wait for DB commit (Strapi v5 fix)
        await new Promise((r) => setTimeout(r, 300));

        // ✅ Check row exists
        const check = await knex.raw(
          `SELECT id FROM "${tableName}" WHERE id = ?`,
          [id]
        );
        console.log("🔍 Row exists:", check.rows);

        if (!check.rows.length) {
          console.log("❌ Row not found, skipping embedding update");
          return;
        }

        // ✅ Update embedding
        const update = await knex.raw(
          `UPDATE "${tableName}" SET embedding = ?::vector WHERE id = ?`,
          [vectorString, id]
        );

        console.log("✅ Updated rows:", update.rowCount);

        // ✅ Verify saved embedding
        const verify = await knex.raw(
          `SELECT embedding FROM "${tableName}" WHERE id = ?`,
          [id]
        );

        console.log("🎯 Stored embedding:", verify.rows[0]?.embedding ? "OK ✅" : "NULL ❌");
        console.log("====================================");
      } catch (error: any) {
        console.error("❌ Embedding error FULL:", error);
      }
    },
  };
};