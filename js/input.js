export class InputManager {
  constructor() {
    this.keys = new Set();
    this.virtualKeys = new Set();
    this.pressed = new Set();
    this.virtualPressed = new Set();
    this.handlers = new Map();
    this.lastTap = { left: -Infinity, right: -Infinity };
    this.sprintDirection = 0;
    this.sprintTimer = 0;

    window.addEventListener("keydown", (event) => {
      const code = event.code;
      if (["Space", "ArrowLeft", "ArrowRight", "ShiftLeft", "ShiftRight"].includes(code)) {
        event.preventDefault();
      }
      if (!this.keys.has(code)) {
        this.pressed.add(code);
        this.detectDoubleTap(code);
      }
      this.keys.add(code);
      const handler = this.handlers.get(code);
      if (handler && !event.repeat) handler(event);
    });

    window.addEventListener("keyup", (event) => {
      this.keys.delete(event.code);
    });

    window.addEventListener("blur", () => {
      this.keys.clear();
      this.virtualKeys.clear();
      this.virtualPressed.clear();
    });
  }

  bind(code, fn) {
    this.handlers.set(code, fn);
  }

  update(dt = 0) {
    if (this.sprintTimer > 0) {
      this.sprintTimer -= dt;
      if (this.sprintTimer <= 0) this.sprintDirection = 0;
    }
    this.pressed.clear();
    this.virtualPressed.clear();
  }

  pressVirtual(code) {
    if (!this.virtualKeys.has(code)) this.virtualPressed.add(code);
    this.virtualKeys.add(code);
  }

  releaseVirtual(code) {
    this.virtualKeys.delete(code);
  }

  clearVirtual() {
    this.virtualKeys.clear();
    this.virtualPressed.clear();
  }

  detectDoubleTap(code) {
    const now = performance.now() / 1000;
    const tapWindow = 0.3;
    if (code === "KeyD" || code === "ArrowRight") {
      if (now - this.lastTap.right < tapWindow) {
        this.sprintDirection = 1;
        this.sprintTimer = 0.75;
      }
      this.lastTap.right = now;
    }
    if (code === "KeyA" || code === "ArrowLeft") {
      if (now - this.lastTap.left < tapWindow) {
        this.sprintDirection = -1;
        this.sprintTimer = 0.75;
      }
      this.lastTap.left = now;
    }
  }

  sprintingFor(direction) {
    return direction !== 0 && this.sprintDirection === direction && this.sprintTimer > 0;
  }

  down(...codes) {
    return codes.some((code) => this.keys.has(code) || this.virtualKeys.has(code));
  }

  justPressed(...codes) {
    return codes.some((code) => this.pressed.has(code) || this.virtualPressed.has(code));
  }
}
