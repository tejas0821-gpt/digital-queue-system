/*
 * API hookup: set DEMO_MODE to false. Keep BASE_URL empty when the frontend
 * and API share a host; otherwise set it to the backend's public HTTPS origin.
 * Adjust endpoint paths and the normalizers to match the team's API contract.
 */
const API = {
  DEMO_MODE: true,
  BASE_URL: "", // e.g. "https://queue-api.example.edu"; blank means same origin
  createToken: { url: "/api/tokens", method: "POST" },
  tokenStatus: { url: "/api/tokens/{id}", method: "GET" },
  leaveQueue: { url: "/api/tokens/{id}/leave", method: "POST" },
  queue: { url: "/api/queue", method: "GET" }
};
const STORE_KEY = "lineup-demo-tokens-v1";
const $ = (id) => document.getElementById(id);
const page = location.pathname.split("/").pop() || "index.html";
const queryId = new URLSearchParams(location.search).get("id");
const pad = (n) => String(n).padStart(3, "0");

function readDemo() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || "[]"); } catch { return []; }
}
function writeDemo(tokens) { localStorage.setItem(STORE_KEY, JSON.stringify(tokens)); }
function seedDemo() {
  let tokens = readDemo();
  if (!tokens.length) {
    tokens = [
      { id: "Q-101", name: "Jordan Lee", category: "Account support", position: 1, status: "serving", created: Date.now() - 900000 },
      { id: "Q-102", name: "Sam Rivera", category: "General enquiry", position: 2, status: "waiting", created: Date.now() - 600000 },
      { id: "Q-103", name: "Taylor Kim", category: "Billing & payments", position: 3, status: "waiting", created: Date.now() - 300000 },
      { id: "Q-104", name: "Casey Patel", category: "Technical support", position: 4, status: "waiting", created: Date.now() }
    ];
    writeDemo(tokens);
  }
  return tokens;
}
function normalizeToken(data) {
  // Map the real backend's JSON fields here. The brief's example uses name/position.
  return { id: data.id ?? data.token_id ?? data.token, name: data.name, category: data.category, position: data.position, status: data.status, nowServing: data.now_serving ?? data.nowServing, estimatedWait: data.estimated_wait ?? data.estimatedWait };
}
function normalizeQueue(data) {
  // Update `items` and each row's field names to match the endpoint sheet.
  const items = Array.isArray(data) ? data : (data.queue ?? data.tokens ?? data.items ?? []);
  return { items, nowServing: data.now_serving ?? data.nowServing ?? items.find(x => x.status === "serving")?.id ?? "—", averageWait: data.average_wait ?? data.averageWait ?? Math.max(3, items.filter(x => x.status === "waiting").length * 4) };
}
async function request(config, { body, id } = {}) {
  if (API.DEMO_MODE) return demoRequest(config, { body, id });
  const path = config.url.replace("{id}", encodeURIComponent(id ?? ""));
  const url = API.BASE_URL ? new URL(path, API.BASE_URL).href : path;
  const response = await fetch(url, { method: config.method, headers: { "Accept": "application/json", ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
  if (!response.ok) {
    let detail = "";
    try { detail = (await response.json()).error || ""; } catch { /* response may not contain JSON */ }
    throw new Error(detail || `Request failed (${response.status}). Please try again.`);
  }
  return response.status === 204 ? {} : response.json();
}
function demoRequest(config, { body, id } = {}) {
  const tokens = seedDemo();
  if (config === API.createToken) {
    const waiting = tokens.filter(t => t.status === "waiting").length;
    const token = { id: `Q-${101 + Math.max(0, ...tokens.map(t => Number(String(t.id).replace(/\D/g, "")) - 101 + 1))}`, name: body.name, category: body.category, position: waiting + 1, status: "waiting", created: Date.now() };
    tokens.push(token); writeDemo(tokens); return normalizeToken(token);
  }
  if (config === API.tokenStatus) {
    const found = tokens.find(t => t.id === id);
    if (!found) throw new Error("We couldn't find that token. Check the link and try again.");
    // Recalculate place using the current waiting order, as the queue advances.
    if (found.status === "waiting") found.position = tokens.filter(t => t.status === "waiting" && t.created < found.created).length + 1;
    writeDemo(tokens);
    return normalizeToken({ ...found, now_serving: tokens.find(t => t.status === "serving")?.id ?? "—", estimated_wait: found.position * 4 });
  }
  if (config === API.leaveQueue) {
    const found = tokens.find(t => t.id === id);
    if (found) { found.status = "cancelled"; writeDemo(tokens); }
    return { ok: true };
  }
  if (config === API.queue) {
    const items = tokens.filter(t => t.status === "waiting" || t.status === "serving").sort((a,b) => a.created - b.created);
    return normalizeQueue({ queue: items, now_serving: items.find(t => t.status === "serving")?.id ?? "—", average_wait: Math.max(3, items.filter(t => t.status === "waiting").length * 4) });
  }
}
function message(el, text, type = "") { el.textContent = text; el.className = `form-message ${type}`; }
function setQr(containerId, value, size = 104) {
  const target = $(containerId);
  if (!target) return;
  target.replaceChildren();
  if (window.QRCode) new QRCode(target, { text: value, width: size, height: size, colorDark: "#183e2c", colorLight: "#ffffff", correctLevel: QRCode.CorrectLevel.M });
  else target.innerHTML = `<span class="qr-unavailable" title="Load the QR library to show this pass">QR</span>`;
}
function waitForQr(id, value) {
  if (window.QRCode) { setQr(id, value); return; }
  let tries = 0;
  const timer = setInterval(() => { if (window.QRCode) { clearInterval(timer); setQr(id, value); } else if (++tries > 30) clearInterval(timer); }, 120);
}

async function setupJoin() {
  const form = $("join-form"); if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = $("customer-name").value.trim(), category = $("category").value;
    if (name.length < 2) { message($("form-message"), "Please enter a name with at least 2 characters."); $("customer-name").focus(); return; }
    if (!category) { message($("form-message"), "Choose a service to continue."); $("category").focus(); return; }
    const button = form.querySelector("button[type=submit]"); button.disabled = true; button.querySelector("span").textContent = "Saving your place…";
    try {
      const data = await request(API.createToken, { body: { name, category } });
      const token = normalizeToken(data);
      if (!token.id) throw new Error("The response did not include a token ID. Check the field mapping in app.js.");
      localStorage.setItem("lineup-current-token", token.id);
      location.href = `status.html?id=${encodeURIComponent(token.id)}`;
    } catch (error) { message($("form-message"), error.message); button.disabled = false; button.querySelector("span").textContent = "Take my place"; }
  });
}

function displayStatus(data) {
  $("status-name").textContent = data.name || "friend";
  $("token-number").textContent = data.id || "—";
  $("status-category").textContent = data.category || "Your service";
  $("position").textContent = data.status === "serving" ? "Now" : (data.position ?? "—");
  $("wait-time").innerHTML = data.status === "serving" ? "0<small> min</small>" : `${data.estimatedWait ?? (Number(data.position) * 4 || "—")}<small> min</small>`;
  $("now-serving").textContent = data.nowServing || "—";
  const badge = $("status-badge");
  const states = { waiting: ["Waiting", ""], serving: ["You're up next", "serving"], called: ["You're up next", "serving"], completed: ["Complete", "done"], cancelled: ["Left queue", "done"] };
  const [label, klass] = states[data.status] || [data.status || "Waiting", ""];
  badge.lastChild.textContent = ` ${label}`; badge.className = `status-badge ${klass}`;
  const active = data.status === "waiting" || data.status === "serving" || data.status === "called";
  $("leave-button").disabled = !active;
  $("leave-button").textContent = active ? "Leave the queue  ×" : "Queue finished";
  const pos = Math.max(1, Number(data.position) || 1);
  $("progress-bar").style.width = data.status === "serving" ? "88%" : `${Math.max(12, Math.min(80, 72 / pos))}%`;
  $("progress-label").textContent = data.status === "serving" ? "It’s your turn" : active ? `${Math.max(0, pos - 1)} ${pos === 2 ? "person" : "people"} ahead` : "Thanks for checking in";
  if (!$("token-qr").dataset.ready) { waitForQr("token-qr", `${location.origin}${location.pathname}?id=${encodeURIComponent(data.id)}`); $("token-qr").dataset.ready = "true"; }
}
async function setupStatus() {
  if (!$("ticket-number")) return;
  const id = queryId || localStorage.getItem("lineup-current-token");
  if (!id) { $("status-message").textContent = "No token ID found. Get a token first, then open your pass."; $("leave-button").disabled = true; return; }
  if (!queryId) history.replaceState({}, "", `status.html?id=${encodeURIComponent(id)}`);
  let timer;
  const refresh = async () => {
    try { const data = normalizeToken(await request(API.tokenStatus, { id })); displayStatus(data); $("status-message").textContent = ""; $("last-updated").textContent = ` · ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`; if (["completed", "cancelled"].includes(data.status)) clearInterval(timer); }
    catch (error) { $("status-message").textContent = error.message; }
  };
  $("leave-button").addEventListener("click", async () => {
    if (!confirm("Leave the queue? Your token will be cancelled.")) return;
    const button = $("leave-button"); button.disabled = true;
    try { await request(API.leaveQueue, { id, body: { id } }); await refresh(); }
    catch (error) { $("status-message").textContent = error.message; button.disabled = false; }
  });
  $("share-token").addEventListener("click", async (e) => { e.preventDefault(); try { await navigator.clipboard.writeText(location.href); e.currentTarget.innerHTML = "Link copied <span>✓</span>"; } catch { location.href = location.href; } });
  await refresh(); timer = setInterval(refresh, 5000);
}

async function setupDisplay() {
  if (!$("queue-rows")) return;
  const refresh = async () => {
    try {
      const data = normalizeQueue(await request(API.queue));
      const active = data.items.filter(t => ["waiting", "serving", "called"].includes(t.status));
      $("display-serving").textContent = data.nowServing || "—";
      $("waiting-count").textContent = active.filter(t => t.status === "waiting").length;
      $("average-wait").innerHTML = `${data.averageWait ?? "—"}<small> min</small>`;
      const host = $("queue-rows"); host.replaceChildren();
      if (!active.length) host.innerHTML = `<div class="empty-queue"><div class="empty-icon">⌁</div><strong>It's quiet right now</strong><span>No one is waiting. Take a spot whenever you're ready.</span></div>`;
      active.slice(0, 8).forEach((token, index) => {
        const row = document.createElement("div"); row.className = "queue-row";
        const id = token.id ?? token.token_id ?? token.token ?? "—", name = token.name ?? "Guest", service = token.category ?? token.service ?? "General enquiry", state = token.status || "waiting";
        row.innerHTML = `<span class="row-token"></span><span class="row-name"></span><span class="row-service"></span><span class="row-status"></span>`;
        row.querySelector(".row-token").textContent = id; row.querySelector(".row-name").textContent = name; row.querySelector(".row-service").textContent = service;
        const badge = row.querySelector(".row-status"); badge.textContent = state === "serving" ? "Serving" : `#${index + 1} in line`; if (state === "serving") badge.classList.add("serving"); host.appendChild(row);
      });
      $("queue-updated").textContent = `Last updated ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } catch (error) { $("queue-rows").innerHTML = `<div class="empty-queue"><div class="empty-icon">!</div><strong>Couldn’t load the queue</strong><span></span></div>`; $("queue-rows").querySelector("span").textContent = error.message; }
  };
  const updateClock = () => { const el = $("clock"); if (el) el.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); };
  updateClock(); await refresh(); setInterval(refresh, 5000); setInterval(updateClock, 30000);
}
function setupQrPage() {
  if (!$("join-qr")) return;
  const urlField = $("join-url"), messageEl = $("qr-message");
  const defaultUrl = `${location.origin}${location.pathname.replace(/qr\.html$/, "index.html")}`;
  const saved = localStorage.getItem("lineup-join-url");
  urlField.value = saved || defaultUrl;
  const draw = () => {
    const value = urlField.value.trim();
    try {
      const parsed = new URL(value);
      if (!/^https?:$/.test(parsed.protocol)) throw new Error();
      if (!window.QRCode) throw new Error("QR library is still loading. Check your internet connection and try again.");
      setQr("join-qr", parsed.href, 208);
      $("qr-address").textContent = parsed.href;
      const localHost = /^(localhost|127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})$/i.test(parsed.hostname);
      $("qr-visibility").textContent = localHost ? "This is a local address. It only works on this computer or, for a LAN IP, on the same Wi-Fi. To let people scan from anywhere, deploy the frontend at a public HTTPS address and put that address here." : (parsed.protocol === "https:" ? "Public HTTPS link: phones can open this from any network, as long as the site and backend are deployed and reachable." : "This address is not HTTPS. For phones on other networks, deploy the site with HTTPS.");
      $("qr-visibility").className = `qr-visibility ${localHost || parsed.protocol !== "https:" ? "local-warning" : "public-ready"}`;
      localStorage.setItem("lineup-join-url", parsed.href);
      messageEl.textContent = "";
    } catch (error) { messageEl.textContent = error.message || "Enter a valid web address starting with http:// or https://."; }
  };
  $("update-qr").addEventListener("click", draw);
  urlField.addEventListener("keydown", (e) => { if (e.key === "Enter") draw(); });
  $("download-qr").addEventListener("click", () => {
    const canvas = $("join-qr").querySelector("canvas"), image = $("join-qr").querySelector("img");
    const link = document.createElement("a"); link.download = "lineup-join-qr.png"; link.href = canvas?.toDataURL("image/png") || image?.src || "";
    if (link.href) link.click(); else messageEl.textContent = "The QR image is not ready yet.";
  });
  if (window.QRCode) draw(); else { let n = 0; const wait = setInterval(() => { if (window.QRCode) { clearInterval(wait); draw(); } else if (++n > 30) { clearInterval(wait); messageEl.textContent = "QR library couldn’t load. Check your internet connection."; } }, 150); }
}
document.addEventListener("DOMContentLoaded", () => { seedDemo(); setupJoin(); setupStatus(); setupDisplay(); setupQrPage(); });
