
import type { Core } from "@strapi/strapi";

console.log(" BOOTSTRAP FILE EXECUTED");

export default async ({ strapi }: { strapi: Core.Strapi }) => {
  const knex = strapi.db.connection;

  console.log(" faqchatbot-config bootstrap loaded");

  const runAfterStrapiReady = async () => {
    console.log(" Running embedding setup...");

    try {
      const client = knex.client.config.client;
      console.log(" DB Client:", client);

      if (!["pg", "postgres", "postgresql"].includes(client)) {
        console.log("Not Postgres, skipping pgvector");
        return;
      }

      await knex.raw("CREATE EXTENSION IF NOT EXISTS vector");

      const tableName = "chatbot_config_faqqas";

      const hasTable = await knex.schema.hasTable(tableName);

      if (!hasTable) {
        console.log("Table not found:", tableName);
        return;
      }

      console.log("Table found:", tableName);

      const hasColumn = await knex.schema.hasColumn(tableName, "embedding");

      if (!hasColumn) {
        await knex.raw(
          `ALTER TABLE "${tableName}" ADD COLUMN embedding vector(1536)`
        );
        console.log(" embedding column CREATED");
      } else {
        console.log(" embedding column already exists");
      }
    } catch (err: any) {
      console.error(" embedding column error:", err.message);
    }



    strapi.db.lifecycles.subscribe({
      models: ["plugin::faqchatbot-config.faqqa"],

      async afterCreate(event) {
        setTimeout(() => {
          strapi
            .plugin("faqchatbot-config").service("embedding").updateEmbedding(event.model.uid, event.result); }, 400);
      },

      async afterUpdate(event) {
        setTimeout(() => {
          strapi.plugin("faqchatbot-config").service("embedding").updateEmbedding(event.model.uid, event.result);
        }, 400);
      },
    });
  };
  setTimeout(runAfterStrapiReady, 3000);
};
