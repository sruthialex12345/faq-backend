// import contentAPIRoutes from './content-api';
// import adminAPIRoutes from './admin';

// const routes = {
//   'content-api': contentAPIRoutes,
//   admin: adminAPIRoutes,
// };

// export default routes;



// import admin from './admin';

// export default {
//   // 'content-api': contentAPIRoutes, // We are removing this because we deleted the default controller
//   admin,
// };


import admin from "./admin";
import contentApi from "./content-api";

export default {
  admin,
  "content-api": contentApi,
};
