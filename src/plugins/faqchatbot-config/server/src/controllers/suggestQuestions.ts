export default ({ strapi }: { strapi: any }) => ({
  async getSuggested(ctx: any) {
    const pluginStore = strapi.store({
      environment: null,
      type: "plugin",
      name: "faqchatbot-config",
    });

    const settings = await pluginStore.get({ key: "settings" });

    ctx.body = {
      suggestedQuestions: settings?.suggestedQuestions || [],
    };
  },
});
