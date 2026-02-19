// export default () => ({
//   type: 'content-api',
//   routes: [
//     {
//       method: 'GET',
//       path: '/',
//       // name of the controller file & the method.
//       handler: 'controller.index',
//       config: {
//         policies: [],
//       },
//     },
//   ],
// });

// export default () => ({
//   type: "content-api",
//   routes: [
//     {
//       method: "GET",
//       path: "/",
//       handler: "controller.index",
//       config: {
//         policies: [],
//       },
//     },

//     // ✅ NEW AI ASK ROUTE
//     {
//       method: "POST",
//       path: "/ask",
//       handler: "ask.ask",
//       config: {
//         auth: false,
//       },
//     },
//   ],
// });

export default () => ({
  type: 'content-api',
  routes: [
    {
      method: 'GET',
      path: '/',
      handler: 'controller.index',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/ask',
      handler: 'ask.ask',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/suggestion-and-logo',
      handler: 'suggestQuestionsAndLogo.getSuggestionAndLogo',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/card-mapping',
      handler: 'cardMapping.index',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/validate-key',
      handler: 'ask.validateKey',
      config: {
        auth: false,
      },
    },
  ],
});
