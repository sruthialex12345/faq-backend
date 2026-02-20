// import type { Core } from '@strapi/strapi';

// type FieldConfig = {
//   name: string;
//   enabled: boolean;
// };

// type CollectionConfig = {
//   name: string;
//   fields: FieldConfig[];
// };

// const SYSTEM_FIELDS = [
//   'id',
//   'createdAt',
//   'updatedAt',
//   'publishedAt',
//   'createdBy',
//   'updatedBy',
//   'locale',
//   'localizations',
//   'embedding',
// ];

// export default ({ strapi }: { strapi: Core.Strapi }) => ({
//   async getConfig() {
//     const pluginStore = strapi.store({
//       environment: null,
//       type: 'plugin',
//       name: 'faqchatbot-config',
//     });

//     const savedSettingsRaw = await pluginStore.get({ key: 'collections' });

//     // ✅ FIX TYPE ERROR
//     const savedSettings: CollectionConfig[] = Array.isArray(savedSettingsRaw)
//       ? savedSettingsRaw
//       : [];

//     const contentTypeUIDs = Object.keys(strapi.contentTypes).filter(
//   (uid) => uid.startsWith('api::') || uid.startsWith('plugin::faqchatbot-config')
// );


// const detectedCollections = contentTypeUIDs.map((uid) => {
//   const ct = strapi.contentTypes[uid];

//   const name =
//     ct.info.singularName ||
//     ct.info.displayName?.toLowerCase() ||
//     uid.split('.').pop()!;

//   const existing = savedSettings.find((s) => s.name === name);

//   const fields: FieldConfig[] = Object.keys(ct.attributes)
//     .filter((attr) => !SYSTEM_FIELDS.includes(attr))
//     .map((attr) => {
//       const existingField = existing?.fields?.find((f) => f.name === attr);
//       return {
//         name: attr,
//         enabled: existingField ? existingField.enabled : false,
//       };
//     });

//   return {
//     name,
//     fields,
//     isPlugin: uid.startsWith('plugin::faqchatbot-config'), // ✅ ONLY ADD THIS
//   };
// });


//     return detectedCollections;
//   },

// async setConfig(settings: any) {
//   const pluginStore = strapi.store({
//     environment: null,
//     type: 'plugin',
//     name: 'faqchatbot-config',
//   });

//   // ✅ FRONTEND sends { items, openaiKey }
//   const collections = Array.isArray(settings) ? settings : settings.items;

//   await pluginStore.set({
//     key: 'collections',
//     value: collections,
//   });

//   // (optional) save openai key separately
//   if (settings.openaiKey !== undefined) {
//     await pluginStore.set({
//       key: 'openaiKey',
//       value: settings.openaiKey,
//     });
//   }

//   return collections;
// }

// });


import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => ({

  async getConfig() {
    const pluginStore = strapi.store({
      environment: null,
      type: 'plugin',
      name: 'faqchatbot-config',
    });
      

    // Read full settings object
    const settings = await pluginStore.get({ key: 'settings' });

    return (settings && typeof settings === 'object') ? settings : {};
  },

  async setConfig(newSettings: any) {
    const pluginStore = strapi.store({
      environment: null,
      type: 'plugin',
      name: 'faqchatbot-config',
    });
        const existingRaw = await pluginStore.get({ key: 'settings' });



 const existingSettings =
      (existingRaw && typeof existingRaw === 'object')
        ? existingRaw
        : {};


      let rebuiltCollections: any[] = [];

  if (newSettings.config) {
    rebuiltCollections = Object.entries(newSettings.config)
      .map(([uid, selectedFields]: any) => {
        const contentType = strapi.contentTypes[uid];
        if (!contentType) return null;

        const allFields = Object.keys(contentType.attributes);

        return {
          name: uid.split('.')[1], // "api::flight.flight" -> "flight"
          fields: allFields.map((field) => ({
            name: field,
            enabled: selectedFields.includes(field),
          })),
        };
      })
      .filter(Boolean);
  }
  
    // Merge
    const mergedSettings = {
      ...existingSettings,
      ...newSettings,
    };

if (rebuiltCollections.length > 0) {
  await pluginStore.set({
    key: 'collections',
    value: rebuiltCollections,
  });
}
    // Save full settings object
    // 3. Save merged object
    await pluginStore.set({
      key: 'settings',
      value: mergedSettings,
    });

    return mergedSettings;
  },

});
