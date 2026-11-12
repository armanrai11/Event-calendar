// ============================================================
//  Shared Express app: CRUD routes + storage layer.
//  Used by server.js (local / laptop) and api/index.js (Vercel).
//
//  Storage modes (first that works wins):
//   1. MONGO_URI set            -> that MongoDB (e.g. MongoDB Atlas)
//   2. Local run (not Vercel)   -> built-in MongoDB on port 27017,
//                                  data saved in ./data/db (persistent),
//                                  database "eventdb", collection "events"
//   3. Fallback                 -> temporary in-memory list
//                                  (used on Vercel without MONGO_URI,
//                                   and if MongoDB cannot be reached)
// ============================================================
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Event = require("./models/Event");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // serve the website

let useMongo = false;
let connected = false;
const mem = []; // fallback store
const memId = () => Math.random().toString(16).slice(2) + Date.now().toString(16);

async function ensureConnected() {
  if (connected) return;
  connected = true; // set early so parallel requests don't race
  try {
    let uri = process.env.MONGO_URI;
    if (!uri && !process.env.VERCEL) {
      const { MongoMemoryServer } = require("mongodb-memory-server");
      const dataDir = path.join(__dirname, "data", "db");
      fs.mkdirSync(dataDir, { recursive: true });
      const memory = await MongoMemoryServer.create({
        instance: { port: 27017, dbPath: dataDir, dbName: "eventdb" },
      });
      uri = memory.getUri("eventdb");
      console.log("Built-in MongoDB on 127.0.0.1:27017, db 'eventdb', data folder ./data/db");
    }
    if (uri) {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
      useMongo = true;
      console.log("MongoDB connected");
    } else {
      console.log("No MongoDB available (Vercel without MONGO_URI) - in-memory fallback store");
    }
  } catch (err) {
    useMongo = false;
    console.log("MongoDB unavailable (" + err.message.split("\n")[0] + ") - using in-memory fallback store");
  }
  app.locals.storage = useMongo ? "MongoDB" : "in-memory fallback";
}

const store = {
  async create(data) {
    if (useMongo) return Event.create(data);
    const event = { _id: memId(), category: "Other", time: "", description: "", ...data };
    mem.push(event); return event;
  },
  async all() {
    if (useMongo) return Event.find().sort({ date: 1, time: 1 });
    return [...mem].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  },
  async one(id) {
    if (useMongo) return Event.findById(id);
    return mem.find((e) => e._id === id) || null;
  },
  async update(id, data) {
    if (useMongo) return Event.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    const e = mem.find((x) => x._id === id);
    if (!e) return null;
    Object.assign(e, data); return e;
  },
  async remove(id) {
    if (useMongo) return Event.findByIdAndDelete(id);
    const i = mem.findIndex((x) => x._id === id);
    if (i === -1) return null;
    return mem.splice(i, 1)[0];
  },
};

// ---------- CRUD routes ----------
// CREATE -> POST /api/events | READ -> GET /api/events[/:id]
// UPDATE -> PUT /api/events/:id | DELETE -> DELETE /api/events/:id
app.use("/api", async (req, res, next) => { await ensureConnected(); next(); });

app.get("/api/status", (req, res) =>
  res.json({ ok: true, storage: app.locals.storage || "starting", database: "eventdb", collection: "events" }));

app.post("/api/events", async (req, res) => {
  try {
    if (!req.body.title || !req.body.date)
      return res.status(400).json({ error: "title and date are required" });
    res.status(201).json(await store.create(req.body));
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.get("/api/events", async (req, res) => res.json(await store.all()));

app.get("/api/events/:id", async (req, res) => {
  const event = await store.one(req.params.id).catch(() => null);
  if (!event) return res.status(404).json({ error: "Event not found" });
  res.json(event);
});

app.put("/api/events/:id", async (req, res) => {
  try {
    const event = await store.update(req.params.id, req.body);
    if (!event) return res.status(404).json({ error: "Event not found" });
    res.json(event);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete("/api/events/:id", async (req, res) => {
  const event = await store.remove(req.params.id).catch(() => null);
  if (!event) return res.status(404).json({ error: "Event not found" });
  res.json({ message: "Event deleted" });
});

module.exports = { app, ensureConnected };
