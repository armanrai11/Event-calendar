// ============================================================
//  Frontend logic: draws the calendar, talks to the CRUD API
//  CREATE -> POST    /api/events
//  READ   -> GET     /api/events
//  UPDATE -> PUT     /api/events/:id
//  DELETE -> DELETE  /api/events/:id
// ============================================================
const API = "/api/events";
const TOKEN = localStorage.getItem("ec_token");
if (!TOKEN) location.replace("/login.html"); // login first, then use the website
const authHeaders = () => ({ "x-auth-token": localStorage.getItem("ec_token") || "" });
let events = [];
let view = new Date(); view.setDate(1);

const grid = document.getElementById("calendarGrid");
const monthLabel = document.getElementById("monthLabel");
const listEl = document.getElementById("eventList");
const form = document.getElementById("eventForm");
const statusEl = document.getElementById("status");
const $ = (id) => document.getElementById(id);
// Format a date as YYYY-MM-DD using LOCAL time. (toISOString() is UTC —
// in IST it turned midnight of the 24th into the 23rd, an off-by-one bug.)
const iso = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");

// ---------- READ all events, then draw ----------
async function loadEvents() {
  const res = await fetch(API, { headers: authHeaders() });
  if (res.status === 401) { // session missing/expired -> back to login
    localStorage.removeItem("ec_token"); localStorage.removeItem("ec_user");
    location.replace("/login.html"); return;
  }
  events = await res.json();
  drawCalendar(); drawList();
}

function drawCalendar() {
  const y = view.getFullYear(), m = view.getMonth();
  monthLabel.textContent = view.toLocaleString("en", { month: "long", year: "numeric" });
  grid.innerHTML = "";
  const firstDay = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  for (let i = 0; i < firstDay; i++) grid.innerHTML += `<div class="day dim"></div>`;
  for (let d = 1; d <= days; d++) {
    const dateStr = iso(new Date(y, m, d));
    const cats = [...new Set(events.filter((e) => e.date === dateStr).map((e) => (e.category || "Other").toLowerCase()))].slice(0, 3);
    const today = dateStr === iso(new Date()) ? " today" : "";
    const dots = cats.length ? `<span class="dots">${cats.map((c) => `<span class="dot cat-${c}"></span>`).join("")}</span>` : "";
    grid.innerHTML += `<div class="day${today}" data-date="${dateStr}">${d}${dots}</div>`;
  }
  grid.querySelectorAll(".day[data-date]").forEach((el) =>
    el.addEventListener("click", () => {
      grid.querySelectorAll(".day.selected").forEach((x) => x.classList.remove("selected"));
      el.classList.add("selected");
      $("date").value = el.dataset.date; $("title").focus();
    })
  );
}

function drawList(filter = "") {
  const items = events.filter((e) =>
    (e.title + e.description + e.category).toLowerCase().includes(filter.toLowerCase()));
  listEl.innerHTML = items.length ? "" : `<p class="empty">No events yet. Add your first event above!</p>`;
  items.forEach((e) => {
    const div = document.createElement("div");
    const slug = (e.category || "Other").toLowerCase();
    div.className = "event cat-" + slug;
    div.innerHTML = `<div><strong>${e.title}</strong><span class="badge cat-${slug}">${e.category}</span><br>
      <small>${e.date}${e.time ? " · " + e.time : ""}</small><br><small>${e.description || ""}</small></div>
      <div class="actions"><button class="editBtn">Edit</button><button class="delBtn">Delete</button></div>`;
    div.querySelector(".editBtn").onclick = () => fillForm(e);
    div.querySelector(".delBtn").onclick = () => removeEvent(e._id);
    listEl.appendChild(div);
  });
}

// ---------- CREATE or UPDATE ----------
form.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const data = { title: $("title").value, date: $("date").value, time: $("time").value,
    category: $("category").value, description: $("description").value };
  const id = $("eventId").value;
  const res = await fetch(id ? `${API}/${id}` : API,
    { method: id ? "PUT" : "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify(data) });
  statusEl.textContent = res.ok ? (id ? "Event updated." : "Event added.") : "Something went wrong. Please try again.";
  resetForm(); loadEvents();
});

function fillForm(e) {
  $("eventId").value = e._id; $("title").value = e.title; $("date").value = e.date;
  $("time").value = e.time || ""; $("category").value = e.category; $("description").value = e.description || "";
  $("formTitle").textContent = "Edit Event"; $("saveBtn").textContent = "Update Event";
  $("cancelEdit").hidden = false; window.scrollTo({ top: 0, behavior: "smooth" });
}
function resetForm() {
  form.reset(); $("eventId").value = ""; $("formTitle").textContent = "Add Event";
  $("saveBtn").textContent = "Save Event"; $("cancelEdit").hidden = true;
}
$("cancelEdit").onclick = resetForm;

// ---------- DELETE ----------
async function removeEvent(id) {
  if (!confirm("Delete this event?")) return;
  await fetch(`${API}/${id}`, { method: "DELETE", headers: authHeaders() });
  statusEl.textContent = "Event deleted."; loadEvents();
}

// ---------- Month navigation + search ----------
$("prevBtn").onclick = () => { view.setMonth(view.getMonth() - 1); drawCalendar(); };
$("nextBtn").onclick = () => { view.setMonth(view.getMonth() + 1); drawCalendar(); };
$("search").addEventListener("input", (e) => drawList(e.target.value));

loadEvents();

// ---------- Auth state in the header (login/logout) ----------
(function initAuthBar() {
  const who = document.getElementById("whoami");
  const loginLink = document.getElementById("loginLink");
  const logoutBtn = document.getElementById("logoutBtn");
  const adminLink = document.getElementById("adminLink");
  if (!who || !loginLink || !logoutBtn) return;
  const user = localStorage.getItem("ec_user");
  const token = localStorage.getItem("ec_token");
  if (user && token) {
    const displayName = user.includes("@") ? user.split("@")[0] : user;
    who.textContent = "Hi, " + displayName;
    loginLink.hidden = true;
    logoutBtn.hidden = false;
    // Admin panel is only shown to the site owner's accounts
    // (the server also enforces this — hiding alone would not be enough).
    const ADMIN_USERS = ["4617arman@gmail.com"];
    if (adminLink) adminLink.hidden = !ADMIN_USERS.includes(user.toLowerCase());
  }
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("ec_user");
    localStorage.removeItem("ec_token");
    location.href = "/login.html";
  });
})();
