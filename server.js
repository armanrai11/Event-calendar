// Local / laptop entry point: starts the shared app (app.js) on PORT.
// CRUD API: POST/GET/PUT/DELETE /api/events  (see app.js)
const { app, ensureConnected } = require("./app");

(async () => {
  await ensureConnected();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () =>
    console.log(`Server running -> http://localhost:${PORT}  (storage: ${app.locals.storage})`)
  );
})();
