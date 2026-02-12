module.exports = async ({ strapi }) => {
  const entries = await strapi.db
    .query('plugin::faqchatbot-config.faqqa')
    .findMany();

  for (const entry of entries) {
    const text = `Q: ${entry.question}\nA: ${entry.answer}`;

    const embedding = await strapi
      .plugin('faqchatbot-config')
      .service('embed')
      .generateEmbedding(text);

    if (embedding) {
      await strapi.db
        .query('plugin::faqchatbot-config.faqqa')
        .update({
          where: { id: entry.id },
          data: { embedding },
        });

      console.log(`Updated FAQ ${entry.id} → ${embedding.length}`);
    }
  }

  console.log("Embeddings regenerated!");
};
