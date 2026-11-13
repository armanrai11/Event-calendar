# Event Calendar 3D

An interactive event calendar website with a **3D look**, a **Node.js + Express backend**,
**MongoDB database**, and **full CRUD operations**.

## Simple explanation (for viva / presentation)

> "This is a full-stack web app. The **frontend** (HTML, CSS, JavaScript) shows a monthly
> calendar. Three.js adds a 3D animated background and the calendar card tilts in 3D when
> you move the mouse. When you add, edit or delete an event, the frontend sends a request
> to the **backend API** built with Express. The backend stores events in **MongoDB**
> using Mongoose. These four operations — Create, Read, Update, Delete — are called CRUD,
> and every database app is built on them."

## CRUD operations

| Operation | Method | API route          | What it does       |
|-----------|--------|--------------------|--------------------|
| Create    | POST   | `/api/events`      | Add a new event    |
| Read      | GET    | `/api/events`      | Get all events     |
| Read      | GET    | `/api/events/:id`  | Get one event      |
| Update    | PUT    | `/api/events/:id`  | Edit an event      |
| Delete    | DELETE | `/api/events/:id`  | Remove an event    |

## Project structure

```
event-calendar-3d/
├── server.js          <- Backend: Express server + CRUD routes
├── models/Event.js    <- MongoDB schema (title, date, time, category, description)
├── public/
│   ├── index.html     <- Page structure
│   ├── style.css      <- Styling, glass cards, 3D tilt
│   └── app.js         <- Calendar logic, API calls, Three.js 3D background
├── package.json       <- Dependencies list
└── .env.example       <- Copy to .env to use your own MongoDB
```

## Requirements

- Node.js 18 or above (https://nodejs.org)

## How to run

**Windows (easiest):** just double-click **`RUN-ON-WINDOWS.bat`** — it installs all
dependencies, starts the backend and opens the website in your browser automatically.
If Node.js is missing it opens the Node.js download page first; install Node LTS, then
double-click the file again.

**Manual (any OS):**

```bash
npm install     # install all dependencies (already done once)
npm start       # start the server
```

Then open **http://localhost:3000** in your browser.

## Database options

1. **Zero setup (default):** leave `MONGO_URI` empty in `.env` — the app starts a built-in
   in-memory MongoDB automatically (needs internet the first time to download it).
2. **Your own MongoDB:** copy `.env.example` to `.env` and set
   `MONGO_URI=mongodb://127.0.0.1:27017/eventdb` (local) or your MongoDB Atlas link.
3. **Fallback:** if MongoDB cannot be reached, the server automatically uses a temporary
   in-memory list so the demo never crashes (data resets when the server restarts).

## Login system

- Open **http://localhost:3000/login.html** to **Login** or **Register**.
- **Login is compulsory and comes first:** opening the calendar without an account
  sends you to the login page. Events are **individual** — every user sees and
  manages only their own events. The Admin page (after login) shows all records.
- Accounts are stored in MongoDB (database **eventdb**, collection **users**) with
  passwords hashed using bcrypt — you can see the records in MongoDB Compass.
- API: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
  (header `x-auth-token`). After login the home page greets you by name with a
  Logout button.

## See the backend data (Admin)

- **Admin page:** open **http://localhost:3000/admin.html** — a live table of everything
  stored in the database (auto-refreshes), with delete buttons.
- **Raw API:** open **http://localhost:3000/api/events** to see the data as JSON, and
  **http://localhost:3000/api/status** to check the storage mode.
- **MongoDB Compass:** connect to `mongodb://127.0.0.1:27017` → database **eventdb** →
  collection **events**. Local data is stored persistently in the project's `data/db`
  folder, so events survive server restarts.

## Deploy on Vercel

1. Push this folder to GitHub.
2. On vercel.com, **Add New Project** and import the GitHub repository — no build
   settings to change (`vercel.json` routes everything to `api/index.js`).
3. For a persistent production database, create a free cluster on **MongoDB Atlas** and
   add its connection string as an environment variable named **MONGO_URI** in
   Vercel → Project → Settings → Environment Variables. Without it, the deployed app
   uses a temporary in-memory store (works, but data resets).

## Features

- Monthly calendar, click a date to add an event on that day, yellow dot marks event days
- Add / edit / delete events with category, time and description
- Search events, previous / next month navigation
- 3D: Three.js floating cubes, spheres and rings in the background + 3D tilt card effect

## Tech stack

Frontend: HTML, CSS, JavaScript, Three.js | Backend: Node.js, Express | Database: MongoDB, Mongoose
