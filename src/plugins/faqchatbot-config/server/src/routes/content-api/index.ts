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
  type: "content-api",
  routes: [
    {
      method: "GET",
      path: "/",
      handler: "controller.index",
      config: {
        auth: false,
      },
    },
    {
      method: "POST",
      path: "/ask",
      handler: "ask.ask",
      config: {
        auth: false,
      },
    },
  ],
});
