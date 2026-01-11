// 1 RIVAL — clean baseline
// - Flip starts timer on first flip
// - Quit shows stats modal
// - Exit stats = auto new game (reset + ready state)

const $ = (id) => document.getElementById(id);

// HUD
const timeEl = $("time");
const setsEl = $("sets");
const repsEl = $("reps");
const calsEl = $("cals");

// Card UI
const repOverlay = $("repOverlay");
const hintText = $("hintText");
const statusText = $("statusText");

// Buttons
const flipBtn = $("flipBtn");
const quitBtn = $("quitBtn");
const resetBtn = $("resetBtn");
const modeBtn = $("modeBtn");

// Modal
const modalOverlay = $("modalOverlay");
const closeBtn = $("closeBtn");
const playAgainBtn = $("playAgainBtn");
const downloadBtn = $("downloadBtn");

const mTime = $("mTime");
const mSets = $("mSets");
const mReps = $("mReps");
const mCals = $("mCals");

// ---- State ----
let running = false;
let timerId = null;
let elapsedSec = 0;

let sets = 0;
let reps = 0;
let calories = 0;

let mode = "1-10";

// ---- Helpers ----
function pad2(n) {
  return String(n).padStart(2, "0");
}

function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${pad2(m)}:${pad2(s)}`;
}

function updateHUD() {
  timeEl.textContent = fmtTime(elapsedSec);
  setsEl.textContent = String(sets);
  repsEl.textContent = String(reps);
  calsEl.textContent = String(Math.round(calories));
}

function startTimer() {
  stopTimer();
  timerId = setInterval(() => {
    elapsedSec += 1;
    updateHUD();
  }, 1000);
}

function stopTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

function caloriesForSet(repCount) {
  // 0.5–1.5 cals per rep estimate
  const perRep = 0.5 + Math.random();
  return repCount * perRep;
}

function drawReps() {
  // (future modes can branch here)
  return Math.floor(Math.random() * 10) + 1;
}

// ---- Modal ----
function showModal() {
  modalOverlay.classList.add("show");
  modalOverlay.setAttribute("aria-hidden", "false");
}

function hideModal() {
  modalOverlay.classList.remove("show");
  modalOverlay.setAttribute("aria-hidden", "true");
}

function fillModalStats() {
  mTime.textContent = fmtTime(elapsedSec);
  mSets.textContent = String(sets);
  mReps.textContent = String(reps);
  mCals.textContent = String(Math.round(calories));
}

// ---- Reset / New Game ----
function resetState() {
  running = false;
  stopTimer();

  elapsedSec = 0;
  sets = 0;
  reps = 0;
  calories = 0;

  // Restore pre-message (no big number yet)
  repOverlay.className = "repOverlay";
  repOverlay.innerHTML = '<span class="preText">YOUR ONLY RIVAL IS YOU</span>';

  hintText.textContent = "Press FLIP to start";
  statusText.textContent = "Ready";

  quitBtn.disabled = true;

  // Clear modal fields too
  mTime.textContent = "00:00";
  mSets.textContent = "0";
  mReps.textContent = "0";
  mCals.textContent = "0";

  updateHUD();
}

function exitToNewGame() {
  hideModal();
  resetState();
}

// ---- Game ----
function quitGame() {
  if (!running) return;

  running = false;
  stopTimer();

  statusText.textContent = "Complete";
  hintText.textContent = "Session ended";

  fillModalStats();
  showModal();
}

// ---- Download card (simple stats image) ----
function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function downloadStatsCard() {
  const W = 1080,
    H = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  const grad = ctx.createRadialGradient(W * 0.25, H * 0.15, 10, W * 0.5, H * 0.5, W * 0.95);
  grad.addColorStop(0, "#1b1d21");
  grad.addColorStop(1, "#070709");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(255,255,255,.14)";
  ctx.lineWidth = 8;
  roundRect(ctx, 64, 64, W - 128, H - 128, 44);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,.92)";
  ctx.font = "950 72px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillText("1 RIVAL", 110, 190);

  ctx.fillStyle = "rgba(255,255,255,.65)";
  ctx.font = "800 28px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillText("SESSION STATS", 110, 240);

  const lines = [
    ["TIME", fmtTime(elapsedSec)],
    ["SETS", String(sets)],
    ["REPS", String(reps)],
    ["CALORIES", String(Math.round(calories))],
  ];

  let y = 360;
  for (const [k, v] of lines) {
    ctx.fillStyle = "rgba(255,255,255,.62)";
    ctx.font = "900 26px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillText(k, 110, y);

    ctx.fillStyle = "rgba(255,255,255,.92)";
    ctx.font = "950 74px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillText(v, 110, y + 82);

    y += 170;
  }

  ctx.fillStyle = "rgba(255,255,255,.72)";
  ctx.font = "900 28px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillText("There is only 1 rival… you.", 110, 960);

  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = "1-rival-session.png";
  a.click();
}

// ---- Events ----
flipBtn.addEventListener("click", () => {
  if (!running) {
    running = true;
    startTimer();
    quitBtn.disabled = false;
    statusText.textContent = "Live";
    hintText.textContent = "Flip → execute";
  }

  const n = drawReps();
  sets += 1;
  reps += n;
  calories += caloriesForSet(n);

  // Switch overlay to number mode
  repOverlay.className = "repOverlay";
  repOverlay.textContent = String(n);

  updateHUD();
});

quitBtn.addEventListener("click", quitGame);

resetBtn.addEventListener("click", () => {
  hideModal();
  resetState();
});

modeBtn.addEventListener("click", () => {
  mode = "1-10";
  modeBtn.textContent = "Mode: 1–10";
});

playAgainBtn.addEventListener("click", exitToNewGame);
closeBtn.addEventListener("click", exitToNewGame);

modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) exitToNewGame();
});

downloadBtn.addEventListener("click", downloadStatsCard);

// Boot
resetState();
