


// import type { Core } from '@strapi/strapi';

// export default ({ strapi }: { strapi: Core.Strapi }) => ({
//   async index(ctx: any) {
//     const data = await strapi
//       .plugin('faqchatbot-config')
//       .service('config')
//       .getConfig();

//     ctx.body = data;
//   },

//   async update(ctx: any) {
//     // ✅ FRONTEND sends array directly, NOT { collections }
//     const settings = ctx.request.body;

//     console.log('🔥 CONTROLLER RECEIVED:', JSON.stringify(settings, null, 2));

//     const data = await strapi
//       .plugin('faqchatbot-config')
//       .service('config')
//       .setConfig(settings);

//     console.log('✅ SAVED DATA:', JSON.stringify(data, null, 2));

//     ctx.body = data;
//   },
// });




import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => ({

  async index(ctx: any) {
    const settings = await strapi
      .plugin('faqchatbot-config')
      .service('config')
      .getConfig();

    // Detect all content types for admin UI
    const contentTypes = Object.values(strapi.contentTypes)
      .filter((ct: any) => ct.uid.startsWith('api::'))
      .map((ct: any) => ({
        uid: ct.uid,
        displayName: ct.info.displayName,
        attributes: Object.keys(ct.attributes).map((attr) => ({
          name: attr
        })),
      }));

    ctx.body = {
      settings,
      contentTypes,
    };
  },

  async update(ctx: any) {
    const settings = ctx.request.body;

    console.log('🔥 CONTROLLER RECEIVED:', JSON.stringify(settings, null, 2));

    const data = await strapi
      .plugin('faqchatbot-config')
      .service('config')
      .setConfig(settings);

    console.log('✅ SAVED DATA:', JSON.stringify(data, null, 2));

    ctx.body = data;
  },

});
