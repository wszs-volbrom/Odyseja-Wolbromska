"use strict";

function installRoundRectPolyfill() {
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function roundRect(x, y, w, h, r) {
      const radius = Math.min(r, w / 2, h / 2);
      this.moveTo(x + radius, y);
      this.arcTo(x + w, y, x + w, y + h, radius);
      this.arcTo(x + w, y + h, x, y + h, radius);
      this.arcTo(x, y + h, x, y, radius);
      this.arcTo(x, y, x + w, y, radius);
      return this;
    };
  }
}

function startGame() {
  const gameApi = window.ODYSEJA_GAME;
  if (!gameApi || !gameApi.GameManager) {
    throw new Error("Game entry failed to load. Make sure js/game-core.runtime.js is included before js/main.runtime.js.");
  }
  installRoundRectPolyfill();
  new gameApi.GameManager();
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", startGame, { once: true });
} else {
  startGame();
}
