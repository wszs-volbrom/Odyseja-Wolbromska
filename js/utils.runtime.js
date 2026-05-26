(function () {
const { GAME_FONT } = window.ODYSEJA_CONFIG;

const canvasFont = (weight, size) => `${weight} ${size}px ${GAME_FONT}`;

function drawNameTag(ctx, text, x, y, size = 18) {
  ctx.save();
  ctx.font = canvasFont(800, size);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const padX = 8;
  const padY = 4;
  const metrics = ctx.measureText(text);
  const boxW = Math.ceil(metrics.width + padX * 2);
  const boxH = Math.ceil(size + padY * 2);
  const boxX = Math.round(x - boxW / 2);
  const boxY = Math.round(y - boxH);
  ctx.fillStyle = "rgba(18, 22, 28, 0.78)";
  ctx.strokeStyle = "#fff7dd";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 4);
  ctx.fill();
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#201900";
  ctx.fillStyle = "#fff7dd";
  ctx.strokeText(text, x, boxY + boxH / 2 + 1);
  ctx.fillText(text, x, boxY + boxH / 2 + 1);
  ctx.restore();
}
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
function lerp(a, b, t) {
  return a + (b - a) * clamp(t, 0, 1);
}
function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "--:--.--";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${secs.toFixed(2).padStart(5, "0")}`;
}
function makeEdgeTransparentCanvas(img) {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = pixels.data;

  const width = canvas.width;
  const height = canvas.height;
  const visited = new Uint8Array(width * height);
  const stack = [];
  const isBackground = (idx) => {
    const i = idx * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    const greenScreen = g > 145 && r < 120 && b < 125;
    const whiteScreen = r > 242 && g > 242 && b > 242;
    const checkerLight = r > 226 && g > 226 && b > 226;
    const checkerGray = Math.abs(r - g) < 5 && Math.abs(g - b) < 5 && r > 215;
    return a < 8 || greenScreen || whiteScreen || checkerLight || checkerGray;
  };

  for (let x = 0; x < width; x += 1) {
    stack.push(x, (height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    stack.push(y * width, y * width + width - 1);
  }

  while (stack.length) {
    const idx = stack.pop();
    if (visited[idx] || !isBackground(idx)) continue;
    visited[idx] = 1;
    data[idx * 4 + 3] = 0;
    const x = idx % width;
    const y = Math.floor(idx / width);
    if (x > 0) stack.push(idx - 1);
    if (x < width - 1) stack.push(idx + 1);
    if (y > 0) stack.push(idx - width);
    if (y < height - 1) stack.push(idx + width);
  }

  ctx.putImageData(pixels, 0, 0);

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] > 12) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  if (minX > maxX || minY > maxY) return canvas;

  const padding = 2;
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(width - 1, maxX + padding);
  maxY = Math.min(height - 1, maxY + padding);
  const trimmed = document.createElement("canvas");
  trimmed.width = maxX - minX + 1;
  trimmed.height = maxY - minY + 1;
  trimmed.getContext("2d").drawImage(canvas, minX, minY, trimmed.width, trimmed.height, 0, 0, trimmed.width, trimmed.height);
  return trimmed;
}
function detectTouchDevice() {
  return Boolean(
    (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) ||
    "ontouchstart" in window ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
    window.innerWidth <= 760
  );
}

window.ODYSEJA_UTILS = Object.freeze({
  clamp,
  lerp,
  rectsOverlap,
  formatTime,
  canvasFont,
  drawNameTag,
  makeEdgeTransparentCanvas,
  detectTouchDevice,
});
})();
