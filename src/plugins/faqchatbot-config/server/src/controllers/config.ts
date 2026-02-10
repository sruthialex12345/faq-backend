// import type { Core } from '@strapi/strapi };

// export default ({ strapi }: { strapi: Core.Strapi }) => ({
//   // GET Settings
//   async index(ctx: any) {
//     // 1. Define the store (Global Scope: environment = null)
//     const pluginStore = strapi.store({
//       environment: null,
//       type: 'plugin',
//       name: 'faqchatbot-config',
//     });

//     // 2. Retrieve data
//     const settings = await pluginStore.get({ key: 'collections' });

//     // 3. Return (default to empty array if null)
//     ctx.body = settings || [];
//   },

//   // SAVE Settings
//   async update(ctx: any) {
//     // 1. Get 'collections' from the request body
//     // (My frontend code sends: { collections: [...] })
//     const { collections } = ctx.request.body;

//     // 2. Define the store (Global Scope: environment = null)
//     const pluginStore = strapi.store({
//       environment: null,
//       type: 'plugin',
//       name: 'faqchatbot-config',
//     });

//     // 3. Save the data
//     await pluginStore.set({ key: 'collections', value: collections });
    
//     // 4. Return success
//     ctx.body = { ok: true };
//   },
// });


import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async index(ctx: any) {
    const data = await strapi
      .plugin('faqchatbot-config')
      .service('config')
      .getConfig();

    ctx.body = data;
  },

  async update(ctx: any) {
    // ✅ FRONTEND sends array directly, NOT { collections }
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
