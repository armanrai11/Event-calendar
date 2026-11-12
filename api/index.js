// Vercel serverless entry point: Vercel runs this file as a function
// and forwards every request to the same Express app used locally.
// Set MONGO_URI (MongoDB Atlas) in Vercel > Project > Settings >
// Environment Variables for a real persistent database in production.
const { app, ensureConnected } = require("../app");

module.exports = async (req, res) => {
  await ensureConnected();
  return app(req, res);
};
