


// import config from './config';
// // If you have a default controller (like 'myController'), import it here too

// export default {
//   config,
//   // myController, 
// };



// import config from "./config";
// import controller from "../controllers/controller";
// import ask from "../controllers/ask";

// export default {
//   controllers: {
//     controller,
//     ask,
//   },
//   config,
// };


import controller from "./controller";
import config from "./config";
import ask from "./ask";
import cardMapping from "./cardMapping";
import suggestQuestionsAndLogo from "./suggestQuestionsAndLogo";

export default {
  controller,
  config,
  ask,
  suggestQuestionsAndLogo,
  cardMapping
};

