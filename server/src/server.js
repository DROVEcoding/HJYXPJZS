import { createApp } from "./app.js";
import { assertRuntimeConfig, config } from "./config.js";

assertRuntimeConfig();

const app = createApp();

app.listen(config.port, () => {
  console.log(`HJYXPJZS API listening on http://127.0.0.1:${config.port}`);
});
