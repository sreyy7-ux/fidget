// Tab switching
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
  });
});

// =====================
//     SPINNER
// =====================
const spinnerEl = document.getElementById('spinnerEl');
const speedDisplay = document.getElementById('speedDisplay');

let angle = 0;
let velocity = 0;
let friction = 0.985;
let lastX = null;
let lastY = null;
let animId = null;

function spinLoop() {
  if (Math.abs(velocity) > 0.01) {
    velocity *= friction;
    angle += velocity;
    spinnerEl.style.transform = `rotate(${angle}deg)`;
    const rpm = Math.abs(velocity * 60 / 6).toFixed(0);
    speedDisplay.textContent = rpm;
    animId = requestAnimationFrame(spinLoop);
  } else {
    velocity = 0;
    speedDisplay.textContent = '0';
  }
}

spinnerEl.addEventListener('mousedown', e => {
  cancelAnimationFrame(animId);
  lastX = e.clientX;
  lastY = e.clientY;
  velocity = 0;
});

document.addEventListener('mousemove', e => {
  if (lastX === null) return;
  const rect = spinnerEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const prevAngle = Math.atan2(lastY - cy, lastX - cx);
  const currAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
  let delta = (currAngle - prevAngle) * (180 / Math.PI);
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  velocity = delta * 1.5;
  angle += delta;
  spinnerEl.style.transform = `rotate(${angle}deg)`;
  lastX = e.clientX;
  lastY = e.clientY;
});

document.addEventListener('mouseup', () => {
  if (lastX !== null) {
    lastX = null;
    lastY = null;
    animId = requestAnimationFrame(spinLoop);
  }
});

// Touch support for spinner
spinnerEl.addEventListener('touchstart', e => {
  cancelAnimationFrame(animId);
  const t = e.touches[0];
  lastX = t.clientX;
  lastY = t.clientY;
  velocity = 0;
}, { passive: true });

document.addEventListener('touchmove', e => {
  if (lastX === null) return;
  const t = e.touches[0];
  const rect = spinnerEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const prevAngle = Math.atan2(lastY - cy, lastX - cx);
  const currAngle = Math.atan2(t.clientY - cy, t.clientX - cx);
  let delta = (currAngle - prevAngle) * (180 / Math.PI);
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  velocity = delta * 1.5;
  angle += delta;
  spinnerEl.style.transform = `rotate(${angle}deg)`;
  lastX = t.clientX;
  lastY = t.clientY;
}, { passive: true });

document.addEventListener('touchend', () => {
  if (lastX !== null) {
    lastX = null;
    lastY = null;
    animId = requestAnimationFrame(spinLoop);
  }
});

// Click to give a spin
spinnerEl.addEventListener('click', e => {
  if (Math.abs(velocity) < 2) velocity += 8;
  else velocity *= 1.3;
  cancelAnimationFrame(animId);
  animId = requestAnimationFrame(spinLoop);
});

// =====================
//     BUBBLE WRAP
// =====================
const bubbleGrid = document.getElementById('bubbleGrid');
const poppedCountEl = document.getElementById('poppedCount');
let poppedCount = 0;

function createBubbles() {
  bubbleGrid.innerHTML = '';
  poppedCount = 0;
  poppedCountEl.textContent = '0';
  for (let i = 0; i < 48; i++) {
    const b = document.createElement('div');
    b.className = 'bubble';
    b.addEventListener('click', () => popBubble(b));
    bubbleGrid.appendChild(b);
  }
}

function popBubble(b) {
  if (b.classList.contains('popped')) return;
  b.classList.add('popping');
  b.addEventListener('animationend', () => {
    b.classList.remove('popping');
    b.classList.add('popped');
  }, { once: true });
  poppedCount++;
  poppedCountEl.textContent = poppedCount;

  // Pop sound via Web Audio API
  playPop();
}

document.getElementById('resetBubbles').addEventListener('click', createBubbles);
createBubbles();

// =====================
//     STRESS BALL
// =====================
const stressBall = document.getElementById('stressBall');
const stressFace = document.getElementById('stressFace');
const squeezeFill = document.getElementById('squeezeFill');
let squeezeLevel = 0;
let squeezeInterval = null;
let squeezeDecay = null;

const faces = ['😐', '😤', '😣', '😫', '🤯'];

function updateStressBall() {
  const pct = Math.min(squeezeLevel, 100);
  squeezeFill.style.width = pct + '%';
  const idx = Math.floor(pct / 25);
  stressFace.textContent = faces[Math.min(idx, faces.length - 1)];
}

stressBall.addEventListener('mousedown', () => startSqueeze());
stressBall.addEventListener('mouseup', () => stopSqueeze());
stressBall.addEventListener('mouseleave', () => stopSqueeze());
stressBall.addEventListener('touchstart', () => startSqueeze(), { passive: true });
stressBall.addEventListener('touchend', () => stopSqueeze());

function startSqueeze() {
  clearInterval(squeezeDecay);
  squeezeInterval = setInterval(() => {
    squeezeLevel = Math.min(squeezeLevel + 5, 100);
    updateStressBall();
  }, 50);
}

function stopSqueeze() {
  clearInterval(squeezeInterval);
  squeezeDecay = setInterval(() => {
    squeezeLevel = Math.max(squeezeLevel - 2, 0);
    updateStressBall();
    if (squeezeLevel === 0) clearInterval(squeezeDecay);
  }, 50);
}

// =====================
//     CLICKER
// =====================
const clickerBtn = document.getElementById('clickerBtn');
const clickCountEl = document.getElementById('clickCount');
const totalClicksEl = document.getElementById('totalClicks');
const cpsEl = document.getElementById('cps');
const bestCpsEl = document.getElementById('bestCps');

let clicks = 0;
let recentClicks = [];
let bestCps = 0;

function updateCps() {
  const now = Date.now();
  recentClicks = recentClicks.filter(t => now - t < 1000);
  const cps = recentClicks.length;
  if (cps > bestCps) bestCps = cps;
  cpsEl.textContent = cps;
  bestCpsEl.textContent = bestCps;
}

clickerBtn.addEventListener('click', () => {
  clicks++;
  clickCountEl.textContent = clicks;
  totalClicksEl.textContent = clicks;
  recentClicks.push(Date.now());
  updateCps();

  clickerBtn.classList.remove('flashing');
  void clickerBtn.offsetWidth;
  clickerBtn.classList.add('flashing');
  playClick();
});

setInterval(updateCps, 100);

document.getElementById('resetClicker').addEventListener('click', () => {
  clicks = 0;
  recentClicks = [];
  bestCps = 0;
  clickCountEl.textContent = '0';
  totalClicksEl.textContent = '0';
  cpsEl.textContent = '0';
  bestCpsEl.textContent = '0';
});

// =====================
//     AUDIO
// =====================
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playPop() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  } catch (_) {}
}

function playClick() {
  try {
    const ctx = getAudioCtx();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  } catch (_) {}
}
