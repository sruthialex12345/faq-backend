export default {
  routes: [
    {
      method: "POST",
      path: "/items/ask",
      handler: "item.ask",
      config: {
        auth: false, 
      },
    },
  ],
};
