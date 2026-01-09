// import OpenAI from "openai";

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// /**
//  * Generate embedding from OpenAI
//  */
// async function generateEmbedding(text: string) {
//   try {
//     const response = await openai.embeddings.create({
//       model: "text-embedding-3-small",
//       input: text,
//       encoding_format: "float",
//     });

//     return response.data[0].embedding; // array of 1536 floats
//   } catch (error) {
//     console.error("Embedding Error:", error);
//     return null;
//   }
// }

// /**
//  * Save embedding to DB: both vector + jsonb
//  */
// async function saveVectorToDB(id: number, text: string) {
//   try {
//     const embeddingVector = await generateEmbedding(text);
//     if (!embeddingVector) return;

//     await strapi.db
//       .connection("items")
//       .where({ id })
//       .update({
//         // vector column
//         embedding: strapi.db.connection.raw("?::vector", [
//           JSON.stringify(embeddingVector),
//         ]),

//         // jsonb backup
//         embedding_json: JSON.stringify(embeddingVector),
//       });

//     console.log(`Embedding stored for item ${id}`);
//   } catch (err) {
//     console.error("Failed to save embedding:", err);
//   }
// }

// export default {
//   /**
//    * When a new record is created
//    */
//   async afterCreate(event) {
//     const { result } = event;
//     const textToEmbed = `Q: ${result.question}\nA: ${result.answer}`;

//     setTimeout(() => saveVectorToDB(result.id, textToEmbed), 1000);
//   },

//   /**
//    * When an existing record is updated
//    */
//   async afterUpdate(event) {
//     const { result } = event;
//     const textToEmbed = `Q: ${result.question}\nA: ${result.answer}`;

//     setTimeout(() => saveVectorToDB(result.id, textToEmbed), 1000);
//   },

//   async afterDelete(event) {
//     console.log(`Item deleted:`, event.result?.id);
//   },
// };



// import OpenAI from "openai";
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });
// async function generateEmbedding(text: string) {
//   try {
//     const response = await openai.embeddings.create({
//       model: "text-embedding-3-small",
//       input: text,
//       encoding_format: "float",
//     });
//     return response.data[0].embedding;
//   } catch (error) {
//     console.error("Error", error);
//     return null; 
//   }
// }

// async function saveVectorToDB(id: number, text: string) {
//   try {
//     const embeddingVector = await generateEmbedding(text);
//     if (!embeddingVector) return;
//     const result = await strapi.db
//       .connection("items")
//       .where({ id })
//       .update({
//         embedding: strapi.db.connection.raw(
//           "?::vector",
//           [JSON.stringify(embeddingVector)]
//         ),
//       });

//   } catch (err) {
//   }
// }
// export default {
//   async afterCreate(event) {
//     const { result } = event;
//     const text = `Q: ${result.question}\nA: ${result.answer}`;
//     setTimeout(() => saveVectorToDB(result.id, text), 1000);
//   },
//   async afterUpdate(event) {
//     const { result } = event;
//     const text = `Q: ${result.question}\nA: ${result.answer}`;
//     setTimeout(() => saveVectorToDB(result.id, text), 1000);
//   },
//   async afterDelete(event) {
//     console.log(` deleted.`);
//   },
// };





import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function richTextToPlainText(richText: any): string {
  if (!Array.isArray(richText)) return "";
  return richText
    .map(block =>
      block.children?.map((child: any) => child.text || "").join(" ")
    )
    .join("\n");
}

async function generateEmbedding(text: string) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("Embedding error:", error);
    return null;
  }
}

async function saveVectorToDB(id: number, text: string) {
  try {
    const embeddingVector = await generateEmbedding(text);
    if (!embeddingVector) return;

    await strapi.db.connection("items")
      .where({ id })
      .update({
        embedding: strapi.db.connection.raw(
          "?::vector",
          [JSON.stringify(embeddingVector)]
        ),
      });

  } catch (err) {
    console.error("Vector save error:", err);
  }
}

export default {
  async afterCreate(event) {
    const { result } = event;

    const answerText = richTextToPlainText(result.answer);

    const text = `Q: ${result.question}\nA: ${answerText}`;

    setTimeout(() => saveVectorToDB(result.id, text), 1000);
  },

  async afterUpdate(event) {
    const { result } = event;

    const answerText = richTextToPlainText(result.answer);

    const text = `Q: ${result.question}\nA: ${answerText}`;

    setTimeout(() => saveVectorToDB(result.id, text), 1000);
  },

  async afterDelete() {
    console.log("Item deleted");
  },
};
