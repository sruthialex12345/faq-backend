import type { Core } from '@strapi/strapi';
import contentTypes from './src/content-types';

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    console.log('Registering faqchatbot-config plugin...');
    console.log('Content Types:', contentTypes);
  },
  bootstrap({ strapi }: { strapi: Core.Strapi }) {
    console.log('Bootstrapping faqchatbot-config plugin...');
  },
  contentTypes,
};
