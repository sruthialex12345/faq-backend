export default [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',

  {
    name: 'strapi::compression',
    config: {
      enabled: false, // 🔥 REQUIRED for word-by-word streaming
    },
  },

  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
