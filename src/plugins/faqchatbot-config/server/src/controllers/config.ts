// import dns from 'dns/promises';
// import axios from 'axios';
// import type { Core } from '@strapi/strapi';

// async function validateBaseDomain(url: string): Promise<{ valid: boolean; message?: string }> {
//   try {
//     if (!url) return { valid: true };

//     let normalized = url.trim().toLowerCase();

//     // 🔹 Normalize protocol
//     if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
//       normalized = 'https://' + normalized;
//     }

//     // 🔹 Remove trailing slash
//     normalized = normalized.replace(/\/+$/, '');

//     const parsed = new URL(normalized);

//     // 🔹 DNS check
//     await dns.lookup(parsed.hostname);

//     // 🔹 Reachability check (2s timeout)
//     await axios.get(parsed.origin, { timeout: 2000 });

//     return { valid: true };
//   } catch (err) {
//     return {
//       valid: false,
//       message: 'Base domain is invalid, DNS failed, or site not reachable.',
//     };
//   }
// }

// export default ({ strapi }: { strapi: Core.Strapi }) => ({
//   async index(ctx: any) {
//     const settings = await strapi.plugin('faqchatbot-config').service('config').getConfig();

//     // Detect all content types for admin UI
//     const contentTypes = Object.values(strapi.contentTypes)
//       .filter((ct: any) => ct.uid.startsWith('api::'))
//       .map((ct: any) => ({
//         uid: ct.uid,
//         displayName: ct.info.displayName,
//         attributes: Object.keys(ct.attributes).map((attr) => ({
//           name: attr,
//         })),
//       }));

//     ctx.body = {
//       settings,
//       contentTypes,
//     };
//   },

//   async update(ctx: any) {
//     console.log('🚀 UPDATE CONTROLLER HIT');
//     const settings = ctx.request.body;

//     const check = await validateBaseDomain(settings.baseDomain);
//     console.log('🌍 BASE DOMAIN RECEIVED:', settings.baseDomain);

//     if (!check.valid) {
//       ctx.status = 400;
//       ctx.body = { error: check.message };
//       return;
//     }

//     console.log('🔥 CONTROLLER RECEIVED:', JSON.stringify(settings, null, 2));

//     const data = await strapi.plugin('faqchatbot-config').service('config').setConfig(settings);

//     console.log('✅ SAVED DATA:', JSON.stringify(data, null, 2));

//     ctx.body = data;
//   },
// });

import dns from 'dns/promises';
import axios from 'axios';
import type { Core } from '@strapi/strapi';

async function validateBaseDomain(
  url: string,
  isDev: boolean
): Promise<{ valid: boolean; message?: string }> {
  try {
    if (!url) return { valid: true };

    let normalized = url.trim().toLowerCase();

    // Normalize protocol
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized;
    }

    // Remove trailing slash
    normalized = normalized.replace(/\/+$/, '');

    const parsed = new URL(normalized);

    // ✅ DEV MODE → skip external checks
    if (isDev) {
      return { valid: true };
    }

    // DNS check
    await dns.lookup(parsed.hostname);

    // Reachability check (accept any HTTP status)
    await axios.get(parsed.origin, {
      timeout: 2000,
      validateStatus: () => true,
    });

    return { valid: true };
  } catch {
    return {
      valid: false,
      message: 'Base domain is invalid, DNS failed, or site not reachable.',
    };
  }
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async index(ctx: any) {
    const settings = await strapi.plugin('faqchatbot-config').service('config').getConfig();

    // Detect all content types for admin UI
    const contentTypes = Object.values(strapi.contentTypes)
      .filter((ct: any) => ct.uid.startsWith('api::'))
      .map((ct: any) => ({
        uid: ct.uid,
        displayName: ct.info.displayName,
        attributes: Object.keys(ct.attributes).map((attr) => ({
          name: attr,
        })),
      }));

    ctx.body = {
      settings,
      contentTypes,
    };
  },

  async update(ctx: any) {
    const settings = ctx.request.body;

    const isDev = process.env.NODE_ENV !== 'production';

    const check = await validateBaseDomain(settings.baseDomain, isDev);

    if (!check.valid) {
      ctx.status = 400;
      ctx.body = { error: check.message };
      return;
    }

    const data = await strapi.plugin('faqchatbot-config').service('config').setConfig(settings);

    ctx.body = data;
  },
});
