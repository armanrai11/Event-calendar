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
const iso = (d) => d.toISOString().slice(0, 10);

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
    const has = events.some((e) => e.date === dateStr);
    const today = dateStr === iso(new Date()) ? " today" : "";
    grid.innerHTML += `<div class="day${today}" data-date="${dateStr}">${d}${has ? '<span class="dot"></span>' : ""}</div>`;
  }
  grid.querySelectorAll(".day[data-date]").forEach((el) =>
    el.addEventListener("click", () => { $("date").value = el.dataset.date; $("title").focus(); })
  );
}

function drawList(filter = "") {
  const items = events.filter((e) =>
    (e.title + e.description + e.category).toLowerCase().includes(filter.toLowerCase()));
  listEl.innerHTML = items.length ? "" : `<p class="empty">No events yet. Add your first event above!</p>`;
  items.forEach((e) => {
    const div = document.createElement("div");
    div.className = "event";
    div.innerHTML = `<div><strong>${e.title}</strong><span class="badge">${e.category}</span><br>
      <small>🗓️ ${e.date} ${e.time ? "⏰ " + e.time : ""}</small><br><small>${e.description || ""}</small></div>
      <div class="actions"><button class="editBtn">✏️ Edit</button><button class="delBtn">🗑️ Delete</button></div>`;
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
  statusEl.textContent = res.ok ? (id ? "✅ Event updated!" : "✅ Event added!") : "❌ Something went wrong";
  resetForm(); loadEvents();
});

function fillForm(e) {
  $("eventId").value = e._id; $("title").value = e.title; $("date").value = e.date;
  $("time").value = e.time || ""; $("category").value = e.category; $("description").value = e.description || "";
  $("formTitle").textContent = "✏️ Edit Event"; $("saveBtn").textContent = "Update Event";
  $("cancelEdit").hidden = false; window.scrollTo({ top: 0, behavior: "smooth" });
}
function resetForm() {
  form.reset(); $("eventId").value = ""; $("formTitle").textContent = "➕ Add Event";
  $("saveBtn").textContent = "Save Event"; $("cancelEdit").hidden = true;
}
$("cancelEdit").onclick = resetForm;

// ---------- DELETE ----------
async function removeEvent(id) {
  if (!confirm("Delete this event?")) return;
  await fetch(`${API}/${id}`, { method: "DELETE", headers: authHeaders() });
  statusEl.textContent = "🗑️ Event deleted"; loadEvents();
}

// ---------- Month navigation + search ----------
$("prevBtn").onclick = () => { view.setMonth(view.getMonth() - 1); drawCalendar(); };
$("nextBtn").onclick = () => { view.setMonth(view.getMonth() + 1); drawCalendar(); };
$("search").addEventListener("input", (e) => drawList(e.target.value));

// ---------- 3D tilt effect on the calendar card ----------
const card = document.getElementById("calendarCard");
card.addEventListener("mousemove", (e) => {
  const r = card.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
  card.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
});
card.addEventListener("mouseleave", () => (card.style.transform = ""));

// ---------- 3D background with Three.js: floating cubes & spheres ----------
(function init3D() {
  if (!window.THREE) return;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
  camera.position.z = 14;
  const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("bg3d"), alpha: true });
  renderer.setSize(innerWidth, innerHeight);
  const shapes = [];
  const geo = [new THREE.BoxGeometry(1, 1, 1), new THREE.SphereGeometry(0.6, 24, 24), new THREE.TorusGeometry(0.6, 0.22, 12, 24)];
  for (let i = 0; i < 26; i++) {
    const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(Math.random(), 0.7, 0.55), transparent: true, opacity: 0.75 });
    const mesh = new THREE.Mesh(geo[i % 3], mat);
    mesh.position.set((Math.random() - 0.5) * 26, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 6);
    scene.add(mesh); shapes.push(mesh);
  }
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const light = new THREE.PointLight(0xffffff, 60); light.position.set(5, 5, 8); scene.add(light);
  (function animate() {
    requestAnimationFrame(animate);
    shapes.forEach((s, i) => { s.rotation.x += 0.003 + i * 0.0002; s.rotation.y += 0.004; s.position.y += Math.sin(Date.now() * 0.001 + i) * 0.002; });
    renderer.render(scene, camera);
  })();
  addEventListener("resize", () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
})();

loadEvents();

// ---------- Auth state in the header (login/logout) ----------
(function initAuthBar() {
  const who = document.getElementById("whoami");
  const loginLink = document.getElementById("loginLink");
  const logoutBtn = document.getElementById("logoutBtn");
  if (!who || !loginLink || !logoutBtn) return;
  const user = localStorage.getItem("ec_user");
  const token = localStorage.getItem("ec_token");
  if (user && token) {
    who.textContent = "👋 Hi, " + user;
    loginLink.hidden = true;
    logoutBtn.hidden = false;
  }
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("ec_user");
    localStorage.removeItem("ec_token");
    location.href = "/login.html";
  });
})();
