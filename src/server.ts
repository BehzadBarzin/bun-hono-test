import { Hono } from "hono";
import { configs } from "./configs";

const app = new Hono({
  strict: false, // app.get('/hello') will match "GET /hello/"
});

app.get("/", (c) => c.text("Hello Bun!"));

export default {
  port: configs.app.port,
  fetch: app.fetch,
};
