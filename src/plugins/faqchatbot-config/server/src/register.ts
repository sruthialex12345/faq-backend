import type { Core } from '@strapi/strapi';

const register = ({ strapi }: { strapi: Core.Strapi }) => {
  // 🔥 Force plugin content-types to load
  strapi.log.info('✅ faqchatbot-config plugin registered');
};

export default register;
