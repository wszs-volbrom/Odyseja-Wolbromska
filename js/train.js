import { clamp, canvasFont, formatTime } from "./utils.js";

export const TRAIN_ROUTE_SEGMENTS = [
  { id: "wolbrom", name: "Wolbrom", start: 0, end: 0.2, scenery: "stationVillage", speedLimit: 45 },
  { id: "trzyciaz", name: "Trzyciąż", start: 0.2, end: 0.4, scenery: "countryside", speedLimit: 90 },
  { id: "miechow", name: "Miechów", start: 0.4, end: 0.65, scenery: "town", speedLimit: 75 },
  { id: "debniki", name: "Dębniki", start: 0.65, end: 0.82, scenery: "urbanApproach", speedLimit: 60 },
  { id: "krakow", name: "Kraków Główny", start: 0.82, end: 1, scenery: "cityStation", speedLimit: 35 }
];

export const TRAIN_STATIONS = [
  { name: "WOLBROM", progress: 0, passengers: 18, required: false },
  { name: "TRZYCIĄŻ", progress: 0.25, passengers: 9, required: true },
  { name: "MIECHÓW", progress: 0.5, passengers: 16, required: true },
  { name: "DĘBNIKI", progress: 0.75, passengers: 12, required: true },
  { name: "KRAKÓW GŁ.", progress: 1, passengers: 0, required: true }
];

const SIGNAL_COLORS = {
  green: "#54d86a",
  yellow: "#ffd84f",
  red: "#ef476f"
};

function seededNoise(n) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawPanel(ctx, x, y, w, h, title = "") {
  ctx.save();
  drawRoundedRect(ctx, x, y, w, h, 8);
  ctx.fillStyle = "rgba(9, 18, 25, 0.9)";
  ctx.fill();
  ctx.strokeStyle = "#e8d9b9";
  ctx.lineWidth = 2;
  ctx.stroke();
  if (title) {
    ctx.font = canvasFont(900, 17);
    ctx.fillStyle = "#fff3d2";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(title, x + 12, y + 10);
  }
  ctx.restore();
}

function drawPixelText(ctx, text, x, y, size, color = "#fff7dd", align = "left") {
  ctx.save();
  ctx.font = canvasFont(900, size);
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.lineWidth = Math.max(3, Math.floor(size / 5));
  ctx.strokeStyle = "rgba(11, 14, 16, 0.9)";
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

export class RailSignal {
  constructor(progress, state = "green", type = "main") {
    this.progress = progress;
    this.state = state;
    this.type = type;
    this.passed = false;
  }

  get color() {
    return SIGNAL_COLORS[this.state] || SIGNAL_COLORS.green;
  }

  render(ctx, system) {
    const x = Math.round(system.worldToScreen(this.progress * system.routeLength));
    const y = system.trackY - 126;
    if (x < -80 || x > system.canvas.width + 80) return;

    ctx.save();
    ctx.fillStyle = "#323232";
    ctx.fillRect(x - 3, y + 22, 6, 108);
    ctx.fillStyle = "#e8e0cc";
    ctx.fillRect(x - 6, y + 128, 12, 7);
    ctx.fillStyle = "#992f37";
    ctx.fillRect(x - 5, y + 74, 10, 12);
    ctx.fillStyle = "#f4f0dc";
    ctx.fillRect(x - 5, y + 88, 10, 12);
    ctx.fillStyle = "#992f37";
    ctx.fillRect(x - 5, y + 102, 10, 12);

    drawRoundedRect(ctx, x - 18, y, 36, 52, 6);
    ctx.fillStyle = "#10161a";
    ctx.fill();
    ctx.strokeStyle = "#d3c6a5";
    ctx.lineWidth = 2;
    ctx.stroke();

    const states = ["red", "yellow", "green"];
    states.forEach((state, index) => {
      const cy = y + 12 + index * 14;
      ctx.fillStyle = this.state === state ? SIGNAL_COLORS[state] : "#2a3033";
      ctx.beginPath();
      ctx.arc(x, cy, 5, 0, Math.PI * 2);
      ctx.fill();
      if (this.state === state) {
        ctx.strokeStyle = "rgba(255,255,220,0.82)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
    ctx.restore();
  }
}

export class TrainRouteMap {
  constructor(stops = TRAIN_STATIONS) {
    this.stops = stops;
  }

  render(ctx, x, y, w, h, progress, currentSegment) {
    drawPanel(ctx, x, y, w, h);
    const lineX = x + 42;
    const lineY = y + 38;
    const lineW = w - 84;

    ctx.save();
    ctx.strokeStyle = "#f0dcc0";
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(lineX, lineY);
    ctx.lineTo(lineX + lineW, lineY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = "#37d85f";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(lineX, lineY);
    ctx.lineTo(lineX + lineW * clamp(progress, 0, 1), lineY);
    ctx.stroke();

    for (const stop of this.stops) {
      const sx = lineX + lineW * stop.progress;
      ctx.fillStyle = progress >= stop.progress ? "#54d86a" : "#ece3d0";
      ctx.beginPath();
      ctx.arc(sx, lineY, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#10252c";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.font = canvasFont(900, 15);
      ctx.fillStyle = stop.progress >= currentSegment.start && stop.progress <= currentSegment.end ? "#ffd84f" : "#fff3d2";
      ctx.textAlign = "center";
      ctx.fillText(stop.name, sx, y + h - 18);
    }

    const trainX = lineX + lineW * clamp(progress, 0, 1);
    ctx.fillStyle = "#c43e32";
    ctx.fillRect(trainX - 18, lineY - 30, 36, 16);
    ctx.fillStyle = "#f0a22c";
    ctx.fillRect(trainX - 17, lineY - 23, 34, 5);
    ctx.fillStyle = "#10161a";
    ctx.fillRect(trainX - 12, lineY - 32, 24, 4);
    ctx.fillStyle = "#1f2528";
    ctx.fillRect(trainX - 14, lineY - 13, 8, 4);
    ctx.fillRect(trainX + 6, lineY - 13, 8, 4);
    ctx.restore();
  }
}

export class TrainController {
  constructor(routeLength) {
    this.routeLength = routeLength;
    this.distance = 0;
    this.speed = 0;
    this.condition = 100;
    this.satisfaction = 88;
    this.passengers = TRAIN_STATIONS[0].passengers;
    this.completedStops = 1;
    this.visitedStops = new Set(["WOLBROM"]);
    this.doorsOpen = false;
    this.dwellTimer = 0;
    this.hornTimer = 0;
    this.actionCooldown = 0;
    this.lastStrongBrake = false;
    this.screenX = 330;
  }

  get progress() {
    return clamp(this.distance / this.routeLength, 0, 1);
  }

  update(dt, game, system) {
    const input = game.input;
    this.screenX = clamp(system.canvas.width * 0.32, 190, 380);
    this.actionCooldown = Math.max(0, this.actionCooldown - dt);
    this.hornTimer = Math.max(0, this.hornTimer - dt);
    this.dwellTimer = Math.max(0, this.dwellTimer - dt);

    const speedLimit = system.currentSpeedLimit();
    const accelerating = input.down("ArrowRight", "KeyD");
    const lightBrake = input.down("ArrowLeft", "KeyA");
    const strongBrake = input.down("ArrowDown", "KeyS");
    const interact = input.justPressed("ArrowUp", "KeyW");
    const horn = input.justPressed("Space");

    if (horn) {
      this.hornTimer = 0.45;
      system.addText("PIIIIP!", this.screenX + 118, system.trackY - 130, "#ffd84f");
    }

    if (interact) this.handleStationInteraction(system, game);

    if (this.doorsOpen) {
      this.speed = 0;
      if (this.dwellTimer <= 0 && interact) this.doorsOpen = false;
    } else {
      if (accelerating) this.speed += 34 * dt;
      if (lightBrake) this.speed -= 48 * dt;
      if (strongBrake) this.speed -= 92 * dt;
      this.speed -= (accelerating ? 2.5 : 8.5) * dt;
      this.speed = clamp(this.speed, 0, 122);
    }

    if (strongBrake && this.speed > 18 && !this.lastStrongBrake) {
      this.satisfaction = clamp(this.satisfaction - 1.4, 0, 100);
      system.addText("Ostrożnie!", this.screenX + 40, system.trackY - 170, "#ffd84f");
    }
    this.lastStrongBrake = strongBrake;

    if (this.speed > speedLimit + 5) {
      this.satisfaction = clamp(this.satisfaction - 5 * dt, 0, 100);
      this.condition = clamp(this.condition - 2.6 * dt, 0, 100);
      if (Math.floor(system.time * 2) % 2 === 0) {
        system.warning = "ZWOLNIJ!";
      }
    }

    this.distance += this.speed * dt * 4.2;
    this.distance = clamp(this.distance, 0, this.routeLength);

    system.checkSignals(game);
    system.checkSkippedStations(game);

    if (this.condition <= 0) {
      game.gameOver("Pociąg odmówił współpracy po tej trasie.");
      return;
    }
    if (this.progress >= 0.998 && this.speed <= 5 && this.visitedStops.has("KRAKÓW GŁ.")) {
      game.completeLevel();
    }
  }

  handleStationInteraction(system, game) {
    if (this.actionCooldown > 0) return;
    this.actionCooldown = 0.32;
    const station = system.stationInStopWindow();
    if (!station) {
      system.addText("Nie ma peronu", this.screenX + 120, system.trackY - 160, "#ef476f");
      return;
    }
    if (this.speed > 5) {
      this.satisfaction = clamp(this.satisfaction - 5, 0, 100);
      system.addText("Za szybko!", this.screenX + 110, system.trackY - 160, "#ef476f");
      return;
    }
    if (this.doorsOpen) {
      this.doorsOpen = false;
      system.addText("Drzwi zamknięte", this.screenX + 110, system.trackY - 160, "#fff7dd");
      return;
    }

    this.doorsOpen = true;
    this.dwellTimer = 1.0;
    if (!this.visitedStops.has(station.name)) {
      this.visitedStops.add(station.name);
      this.completedStops += 1;
      this.passengers += station.passengers;
      const stopQuality = Math.abs(this.progress - station.progress);
      if (stopQuality <= 0.006) {
        this.satisfaction = clamp(this.satisfaction + 5, 0, 100);
        system.addText("Idealny stop!", this.screenX + 108, system.trackY - 166, "#54d86a");
      } else {
        this.satisfaction = clamp(this.satisfaction - 4, 0, 100);
        system.addText("Krzywy stop", this.screenX + 108, system.trackY - 166, "#ffd84f");
      }
      if (station.name === "KRAKÓW GŁ.") {
        system.addText("Kraków Główny!", this.screenX + 120, system.trackY - 186, "#54d86a");
      }
    } else {
      system.addText("Postój", this.screenX + 108, system.trackY - 166, "#fff7dd");
    }
  }
}

export class TrainRideLevelSystem {
  constructor(level, canvas) {
    this.level = level;
    this.canvas = canvas;
    this.routeLength = level.length || 24000;
    this.train = new TrainController(this.routeLength);
    this.routeMap = new TrainRouteMap(TRAIN_STATIONS);
    this.signals = [
      new RailSignal(0.12, "green"),
      new RailSignal(0.31, "yellow"),
      new RailSignal(0.43, "green"),
      new RailSignal(0.62, "yellow"),
      new RailSignal(0.71, "red"),
      new RailSignal(0.84, "yellow"),
      new RailSignal(0.94, "green")
    ];
    this.texts = [];
    this.time = 0;
    this.warning = "";
    this.pixelScale = 0.11;
  }

  get trackY() {
    return Math.round(clamp(this.canvas.height * 0.61, 315, this.canvas.height - 175));
  }

  get topHudH() {
    return this.canvas.width < 760 ? 72 : 86;
  }

  get bottomHudH() {
    return this.canvas.width < 760 ? 112 : 126;
  }

  update(dt, game) {
    this.time += dt;
    this.warning = "";
    this.train.update(dt, game, this);
    for (const text of this.texts) {
      text.y += text.vy * dt;
      text.life -= dt;
    }
    this.texts = this.texts.filter((text) => text.life > 0);
  }

  worldToScreen(worldDistance, parallax = 1) {
    return this.train.screenX + (worldDistance - this.train.distance) * this.pixelScale * parallax;
  }

  addText(text, x, y, color = "#fff7dd") {
    this.texts.push({ text, x, y, color, life: 1.2, vy: -24 });
  }

  currentSegment() {
    const progress = this.train.progress;
    return TRAIN_ROUTE_SEGMENTS.find((segment) => progress >= segment.start && progress <= segment.end) || TRAIN_ROUTE_SEGMENTS[TRAIN_ROUTE_SEGMENTS.length - 1];
  }

  currentSpeedLimit() {
    return this.currentSegment().speedLimit;
  }

  nextSignal() {
    return this.signals.find((signal) => !signal.passed) || this.signals[this.signals.length - 1];
  }

  nextStation() {
    return TRAIN_STATIONS.find((station) => station.required && !this.train.visitedStops.has(station.name)) || TRAIN_STATIONS[TRAIN_STATIONS.length - 1];
  }

  stationInStopWindow() {
    return TRAIN_STATIONS.find((station) => Math.abs(this.train.progress - station.progress) <= 0.018);
  }

  checkSignals(game) {
    for (const signal of this.signals) {
      if (signal.passed || this.train.progress < signal.progress) continue;
      signal.passed = true;
      if (signal.state === "red" && this.train.speed > 5) {
        this.train.condition = clamp(this.train.condition - 42, 0, 100);
        this.train.satisfaction = clamp(this.train.satisfaction - 28, 0, 100);
        this.addText("CZERWONE!", this.train.screenX + 80, this.trackY - 180, "#ef476f");
        if (this.train.condition <= 0 || this.train.satisfaction <= 0) {
          game.gameOver("Przejazd na czerwonym sygnale zakończył kurs.");
        }
      } else if (signal.state === "yellow" && this.train.speed > this.currentSpeedLimit() * 0.82) {
        this.train.satisfaction = clamp(this.train.satisfaction - 7, 0, 100);
        this.addText("Żółte: hamuj", this.train.screenX + 92, this.trackY - 180, "#ffd84f");
      }
    }
  }

  checkSkippedStations() {
    for (const station of TRAIN_STATIONS) {
      if (!station.required || this.train.visitedStops.has(station.name)) continue;
      if (this.train.progress > station.progress + 0.035) {
        this.train.visitedStops.add(station.name);
        this.train.satisfaction = clamp(this.train.satisfaction - 22, 0, 100);
        this.addText(`Pominięto ${station.name}`, this.train.screenX + 126, this.trackY - 178, "#ef476f");
      }
    }
  }

  render(ctx, game) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    this.renderSky(ctx);
    this.renderFarScenery(ctx);
    this.renderMidScenery(ctx);
    this.renderStationLayer(ctx);
    this.renderCatenary(ctx);
    this.renderTracks(ctx);
    this.renderTrain(ctx);
    this.signals.forEach((signal) => signal.render(ctx, this));
    this.renderForeground(ctx);
    this.renderTexts(ctx);
    this.renderTopHud(ctx, game);
    this.renderBottomHud(ctx);
    game.renderDim(ctx);
    ctx.restore();
  }

  renderSky(ctx) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const segment = this.currentSegment();
    const sky = ctx.createLinearGradient(0, 0, 0, this.trackY);
    sky.addColorStop(0, segment.scenery === "cityStation" ? "#7db9e8" : "#56b8ff");
    sky.addColorStop(0.55, "#8ad0ff");
    sky.addColorStop(1, "#c9e5df");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 8; i += 1) {
      const base = i * 280;
      const x = -((this.train.distance * 0.018 + base) % (w + 320)) + w + 80;
      const y = this.topHudH + 36 + seededNoise(i * 41) * 62 + Math.sin(this.time + i) * 2;
      this.drawCloud(ctx, x, y, 0.65 + seededNoise(i * 9) * 0.45);
    }

    for (let i = 0; i < 3; i += 1) {
      const x = ((this.time * 18 + i * 220) % (w + 120)) - 80;
      const y = this.topHudH + 56 + seededNoise(i * 72) * 90;
      ctx.strokeStyle = "rgba(35, 45, 47, 0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 8, y - 4);
      ctx.lineTo(x + 16, y);
      ctx.stroke();
    }
  }

  drawCloud(ctx, x, y, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "rgba(255, 247, 221, 0.92)";
    ctx.fillRect(-44, 18, 118, 16);
    ctx.fillRect(-24, 2, 42, 32);
    ctx.fillRect(8, -10, 46, 44);
    ctx.fillRect(48, 8, 34, 26);
    ctx.fillStyle = "rgba(124, 146, 160, 0.32)";
    ctx.fillRect(-34, 31, 102, 5);
    ctx.restore();
  }

  renderFarScenery(ctx) {
    const w = this.canvas.width;
    const baseY = this.trackY - 155;
    const segment = this.currentSegment();
    ctx.save();
    ctx.fillStyle = "rgba(52, 90, 93, 0.18)";
    ctx.beginPath();
    ctx.moveTo(0, baseY + 24);
    for (let x = 0; x <= w + 80; x += 80) {
      ctx.lineTo(x, baseY + Math.sin((x + this.train.distance * 0.01) * 0.012) * 18);
    }
    ctx.lineTo(w + 80, this.trackY + 12);
    ctx.lineTo(0, this.trackY + 12);
    ctx.closePath();
    ctx.fill();

    const spacing = segment.scenery === "countryside" ? 290 : 210;
    for (let i = -2; i < w / spacing + 4; i += 1) {
      const world = Math.floor(this.train.distance * 0.16 / spacing + i) * spacing;
      const x = -((this.train.distance * 0.16) % spacing) + i * spacing;
      const n = seededNoise(world * 0.11);
      if (segment.scenery === "cityStation" || segment.scenery === "urbanApproach") {
        this.drawDistantBlock(ctx, x, baseY - 20 - n * 28, 92 + n * 52, 120 + n * 80);
      } else {
        this.drawDistantVillage(ctx, x, baseY + 18, 0.8 + n * 0.28);
      }
    }

    if (segment.scenery === "cityStation" || segment.scenery === "urbanApproach") {
      this.drawChurchTower(ctx, w * 0.72 - (this.train.distance * 0.025) % 120, baseY - 52);
    }
    ctx.restore();
  }

  drawDistantBlock(ctx, x, y, w, h) {
    ctx.fillStyle = "rgba(67, 75, 82, 0.48)";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "rgba(255, 219, 105, 0.42)";
    for (let yy = y + 18; yy < y + h - 12; yy += 24) {
      for (let xx = x + 14; xx < x + w - 12; xx += 28) {
        if (seededNoise(xx + yy) > 0.38) ctx.fillRect(xx, yy, 10, 12);
      }
    }
  }

  drawDistantVillage(ctx, x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "rgba(142, 105, 76, 0.35)";
    ctx.beginPath();
    ctx.moveTo(0, 44);
    ctx.lineTo(44, 2);
    ctx.lineTo(94, 44);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(232, 214, 164, 0.38)";
    ctx.fillRect(8, 44, 78, 48);
    ctx.fillStyle = "rgba(58, 90, 68, 0.28)";
    ctx.fillRect(98, 35, 36, 56);
    ctx.restore();
  }

  drawChurchTower(ctx, x, y) {
    ctx.fillStyle = "rgba(51, 63, 76, 0.44)";
    ctx.fillRect(x, y + 28, 36, 96);
    ctx.fillRect(x + 8, y, 20, 34);
    ctx.fillStyle = "rgba(255, 230, 154, 0.36)";
    ctx.fillRect(x + 12, y + 46, 10, 18);
  }

  renderMidScenery(ctx) {
    const w = this.canvas.width;
    const segment = this.currentSegment();
    const ground = this.trackY - 58;
    const spacing = segment.scenery === "countryside" ? 128 : 92;
    for (let i = -3; i < w / spacing + 8; i += 1) {
      const slot = Math.floor((this.train.distance * 0.38) / spacing) + i;
      const x = -((this.train.distance * 0.38) % spacing) + i * spacing;
      const n = seededNoise(slot);
      if (n > (segment.scenery === "countryside" ? 0.25 : 0.5)) {
        this.drawTree(ctx, x, ground, 0.82 + n * 0.32);
      } else {
        this.drawSmallHouse(ctx, x, ground + 2, 0.72 + n * 0.18);
      }
    }
  }

  drawTree(ctx, x, ground, scale = 1) {
    ctx.save();
    ctx.translate(x, ground);
    ctx.scale(scale, scale);
    ctx.fillStyle = "#6a4a2e";
    ctx.fillRect(-5, -52, 10, 52);
    ctx.fillStyle = "#326d3e";
    ctx.fillRect(-28, -82, 56, 36);
    ctx.fillStyle = "#418649";
    ctx.fillRect(-38, -64, 76, 34);
    ctx.fillStyle = "#5aa95a";
    ctx.fillRect(-22, -100, 44, 28);
    ctx.restore();
  }

  drawSmallHouse(ctx, x, ground, scale = 1) {
    ctx.save();
    ctx.translate(x, ground);
    ctx.scale(scale, scale);
    ctx.fillStyle = "#8d4937";
    ctx.beginPath();
    ctx.moveTo(-42, -44);
    ctx.lineTo(0, -82);
    ctx.lineTo(48, -44);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#d6c88e";
    ctx.fillRect(-34, -44, 72, 50);
    ctx.fillStyle = "#a7b7b4";
    ctx.fillRect(-18, -24, 14, 16);
    ctx.fillRect(12, -24, 14, 16);
    ctx.restore();
  }

  renderStationLayer(ctx) {
    TRAIN_STATIONS.forEach((station) => {
      const x = this.worldToScreen(station.progress * this.routeLength);
      if (x < -360 || x > this.canvas.width + 360) return;
      this.drawStation(ctx, x, station);
    });
  }

  drawStation(ctx, x, station) {
    const platformY = this.trackY - 34;
    ctx.save();
    ctx.fillStyle = "#7b7667";
    ctx.fillRect(x - 230, platformY, 460, 18);
    ctx.fillStyle = "#c9c1a4";
    for (let px = x - 230; px < x + 230; px += 42) {
      ctx.fillRect(px, platformY - 10, 38, 10);
    }
    ctx.fillStyle = "#1f2933";
    ctx.fillRect(x - 175, platformY - 94, 160, 60);
    ctx.fillStyle = "#376f9f";
    ctx.fillRect(x - 168, platformY - 86, 146, 28);
    drawPixelText(ctx, station.name, x - 95, platformY - 72, 20, "#fff7dd", "center");
    drawPixelText(ctx, "Kierunek: KRAKÓW", x - 95, platformY - 43, 15, "#fff7dd", "center");
    ctx.fillStyle = "#163c5d";
    ctx.fillRect(x + 44, platformY - 84, 92, 54);
    ctx.fillStyle = "#7db9e8";
    ctx.fillRect(x + 52, platformY - 75, 76, 14);
    ctx.fillStyle = "#245a82";
    ctx.fillRect(x + 50, platformY - 61, 80, 31);
    ctx.fillStyle = "#f3c64b";
    ctx.fillRect(x + 152, platformY - 70, 36, 50);
    drawPixelText(ctx, "BILETY", x + 170, platformY - 78, 14, "#fff7dd", "center");
    this.drawStationClock(ctx, x + 202, platformY - 90);
    this.drawPassengers(ctx, x + 60, platformY - 18, station.passengers);
    if (station.name === "WOLBROM") this.drawBakeryAd(ctx, x + 245, platformY - 86);
    ctx.restore();
  }

  drawStationClock(ctx, x, y) {
    ctx.fillStyle = "#e8e0cc";
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#283133";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = "#283133";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 10);
    ctx.moveTo(x, y);
    ctx.lineTo(x + 8, y + 3);
    ctx.stroke();
  }

  drawPassengers(ctx, x, y, count) {
    const shown = clamp(Math.ceil(count / 3), 2, 8);
    for (let i = 0; i < shown; i += 1) {
      const px = x + i * 18;
      ctx.fillStyle = i % 2 ? "#774a9b" : "#2f6f9f";
      ctx.fillRect(px, y - 34, 11, 28);
      ctx.fillStyle = "#d6a06d";
      ctx.fillRect(px + 1, y - 45, 9, 9);
      ctx.fillStyle = "#1d2228";
      ctx.fillRect(px - 1, y - 7, 4, 8);
      ctx.fillRect(px + 8, y - 7, 4, 8);
    }
  }

  drawBakeryAd(ctx, x, y) {
    ctx.fillStyle = "#f3d66d";
    ctx.fillRect(x, y, 102, 58);
    ctx.strokeStyle = "#403321";
    ctx.strokeRect(x, y, 102, 58);
    drawPixelText(ctx, "PIEKARNIA", x + 51, y + 17, 16, "#2b2418", "center");
    ctx.fillStyle = "#b36b2a";
    ctx.fillRect(x + 26, y + 35, 48, 10);
    ctx.fillRect(x + 36, y + 27, 28, 10);
  }

  renderCatenary(ctx) {
    const w = this.canvas.width;
    const top = this.trackY - 210;
    ctx.save();
    ctx.strokeStyle = "#1b2b2b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, top + 20);
    ctx.lineTo(w, top + 20);
    ctx.moveTo(0, top + 44);
    ctx.lineTo(w, top + 44);
    ctx.stroke();

    const spacing = 210;
    for (let i = -2; i < w / spacing + 5; i += 1) {
      const x = -((this.train.distance * 0.62) % spacing) + i * spacing;
      ctx.fillStyle = "#4d3d2a";
      ctx.fillRect(x, top - 8, 8, 224);
      ctx.fillRect(x - 6, top + 4, 20, 8);
      ctx.strokeStyle = "#2b2118";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 4, top + 12);
      ctx.lineTo(x + 88, top + 44);
      ctx.stroke();
      if (i % 3 === 0) {
        ctx.strokeStyle = "#3a2a1f";
        ctx.lineWidth = 4;
        ctx.strokeRect(x + 16, top + 16, 120, 22);
        for (let gx = x + 22; gx < x + 132; gx += 22) {
          ctx.beginPath();
          ctx.moveTo(gx, top + 17);
          ctx.lineTo(gx + 16, top + 37);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  renderTracks(ctx) {
    const w = this.canvas.width;
    const y = this.trackY;
    ctx.save();
    ctx.fillStyle = "#61733d";
    ctx.fillRect(0, y - 28, w, 42);
    ctx.fillStyle = "#2a3026";
    ctx.fillRect(0, y + 24, w, this.canvas.height - y - 24);
    ctx.fillStyle = "#46423a";
    ctx.fillRect(0, y + 8, w, 26);
    ctx.fillStyle = "#716451";
    for (let x = -((this.train.distance * 0.92) % 34); x < w + 40; x += 34) {
      ctx.fillRect(Math.round(x), y + 4, 22, 42);
    }
    ctx.strokeStyle = "#d2d2c8";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, y + 12);
    ctx.lineTo(w, y + 12);
    ctx.moveTo(0, y + 34);
    ctx.lineTo(w, y + 34);
    ctx.stroke();
    ctx.fillStyle = "#2f2a25";
    for (let x = -((this.train.distance * 0.7) % 80); x < w + 80; x += 80) {
      ctx.fillRect(Math.round(x), y + 58, 8, 26);
      ctx.fillStyle = "#e2dcc7";
      ctx.fillRect(Math.round(x - 8), y + 50, 24, 9);
      ctx.fillStyle = "#2f2a25";
    }
    ctx.restore();
  }

  renderTrain(ctx) {
    const x = Math.round(this.train.screenX - 214);
    const y = this.trackY - 116 + Math.sin(this.time * 7) * clamp(this.train.speed / 90, 0, 1.4);
    const length = 520;
    ctx.save();
    ctx.translate(0, Math.round(y));
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(x + 20, 115, length - 20, 14);
    ctx.fillStyle = "#6b7478";
    ctx.fillRect(x + 24, 22, length - 74, 76);
    ctx.fillStyle = "#c9342e";
    ctx.fillRect(x + 24, 26, length - 74, 32);
    ctx.fillStyle = "#ee9a22";
    ctx.fillRect(x + 24, 59, length - 74, 20);
    ctx.fillStyle = "#d6dad8";
    ctx.fillRect(x + 24, 80, length - 74, 18);
    ctx.fillStyle = "#be2e2c";
    ctx.beginPath();
    ctx.moveTo(x + length - 50, 22);
    ctx.lineTo(x + length - 2, 46);
    ctx.lineTo(x + length - 2, 99);
    ctx.lineTo(x + length - 50, 99);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#1e2c36";
    for (let wx = x + 48; wx < x + length - 92; wx += 44) {
      ctx.fillRect(wx, 36, 25, 19);
      ctx.fillStyle = "#9ec7d8";
      ctx.fillRect(wx + 3, 39, 19, 13);
      ctx.fillStyle = "#1e2c36";
    }
    for (let dx = x + 92; dx < x + length - 110; dx += 132) {
      ctx.fillStyle = "#d9dedc";
      ctx.fillRect(dx, 32, 16, 58);
      ctx.fillRect(dx + 18, 32, 16, 58);
      ctx.fillStyle = "#28333b";
      ctx.fillRect(dx + 14, 32, 4, 58);
    }

    ctx.fillStyle = "#1e2528";
    for (let bx = x + 42; bx < x + length - 68; bx += 78) {
      ctx.fillRect(bx, 99, 54, 14);
      ctx.beginPath();
      ctx.arc(bx + 12, 116, 8, 0, Math.PI * 2);
      ctx.arc(bx + 42, 116, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = "#1d1d1d";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 168, 20);
    ctx.lineTo(x + 196, -10);
    ctx.lineTo(x + 226, 20);
    ctx.moveTo(x + 182, -4);
    ctx.lineTo(x + 210, -4);
    ctx.stroke();
    ctx.fillStyle = "#384044";
    ctx.fillRect(x + 34, 12, 68, 8);
    ctx.fillRect(x + 248, 12, 76, 8);
    ctx.fillStyle = this.train.doorsOpen ? "#54d86a" : "#ef476f";
    ctx.fillRect(x + 126, 100, 30, 7);
    if (this.train.hornTimer > 0) {
      drawPixelText(ctx, "PIIIP!", x + length - 6, 12, 19, "#ffd84f", "left");
    }
    ctx.restore();
  }

  renderForeground(ctx) {
    const w = this.canvas.width;
    const y = this.trackY + 52;
    ctx.save();
    const grass = ctx.createLinearGradient(0, y, 0, this.canvas.height);
    grass.addColorStop(0, "#32643f");
    grass.addColorStop(1, "#14281f");
    ctx.fillStyle = grass;
    ctx.fillRect(0, y, w, this.canvas.height - y);
    for (let x = -((this.train.distance * 0.86) % 34); x < w + 40; x += 34) {
      ctx.fillStyle = seededNoise(x) > 0.7 ? "#ffd84f" : "#4aa657";
      ctx.fillRect(x, y + 16 + seededNoise(x * 3) * 24, 3, 3);
    }
    ctx.restore();
  }

  renderTopHud(ctx, game) {
    const w = this.canvas.width;
    const h = this.topHudH;
    const signal = this.nextSignal();
    ctx.save();
    ctx.fillStyle = "rgba(5, 17, 24, 0.92)";
    ctx.fillRect(0, 0, w, h);

    const barX = 22;
    const barY = 18;
    const barW = clamp(w * 0.23, 230, 380);
    ctx.strokeStyle = "#f2dfbf";
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barW, 28);
    ctx.fillStyle = "#101719";
    ctx.fillRect(barX + 2, barY + 2, barW - 4, 24);
    const hungerRatio = clamp(game.hunger.value / game.hunger.max, 0, 1);
    ctx.fillStyle = hungerRatio < 0.22 ? "#ef476f" : "#54d86a";
    ctx.fillRect(barX + 2, barY + 2, (barW - 4) * hungerRatio, 24);
    drawPixelText(ctx, `${Math.ceil(game.hunger.value)} kcal`, barX + barW / 2, barY + 15, 22, "#0f1517", "center");

    drawPixelText(ctx, `♥ x ${game.player.lives}`, barX + barW + 38, barY + 15, 24, "#ff4d68");
    drawPixelText(ctx, `Czas: ${formatTime(game.timer.time)}`, w * 0.36, barY + 15, 22, "#fff7dd", "center");
    drawPixelText(ctx, `3-1B`, w * 0.49, barY + 15, 24, "#fff7dd", "center");
    drawPixelText(ctx, "WOLBROM -> KRAKÓW", w * 0.62, barY + 15, 24, "#ffd84f", "center");

    const kmLeft = Math.max(0, Math.ceil((1 - this.train.progress) * 23));
    drawPixelText(ctx, `Dystans do Krakowa: ${kmLeft} km`, 24, h - 18, 20, "#fff7dd");
    drawPixelText(ctx, `Pasażerowie: ${this.train.passengers}/76`, w * 0.29, h - 18, 20, "#fff7dd");
    drawPixelText(ctx, `Przystanki: ${this.train.completedStops}/5`, w * 0.46, h - 18, 20, "#fff7dd");
    drawPixelText(ctx, `Stan: ${Math.round(this.train.condition)}%`, w * 0.61, h - 18, 20, this.train.condition < 40 ? "#ef476f" : "#fff7dd");
    drawPixelText(ctx, `Satysfakcja: ${Math.round(this.train.satisfaction)}%`, w * 0.74, h - 18, 20, this.train.satisfaction < 45 ? "#ef476f" : "#54d86a");
    drawPixelText(ctx, `Sygnał: ${signal.state}`, w - 26, h - 18, 20, signal.color, "right");
    ctx.restore();
  }

  renderBottomHud(ctx) {
    const w = this.canvas.width;
    const h = this.bottomHudH;
    const y = this.canvas.height - h - 12;
    const next = this.nextStation();
    const nextKm = Math.max(0, ((next.progress - this.train.progress) * 23).toFixed(1));
    const small = w < 760;

    ctx.save();
    const panelH = small ? 84 : 98;
    const leftW = small ? 108 : 150;
    const gap = 12;
    let x = 18;
    drawPanel(ctx, x, y, leftW, panelH, "Prędkość:");
    drawPixelText(ctx, `${Math.round(this.train.speed)}`, x + 28, y + 60, small ? 25 : 31, "#54d86a");
    drawPixelText(ctx, "km/h", x + leftW - 16, y + 62, small ? 17 : 20, "#54d86a", "right");
    x += leftW + gap;
    drawPanel(ctx, x, y, leftW, panelH, "Ograniczenie:");
    drawPixelText(ctx, `${this.currentSpeedLimit()}`, x + 28, y + 60, small ? 25 : 31, "#ffd84f");
    drawPixelText(ctx, "km/h", x + leftW - 16, y + 62, small ? 17 : 20, "#ffd84f", "right");
    x += leftW + gap;
    drawPanel(ctx, x, y, small ? 92 : 128, panelH, "Sygnał:");
    this.drawSignalIcon(ctx, x + (small ? 62 : 90), y + 50, this.nextSignal().state);
    x += (small ? 92 : 128) + gap;
    const nextW = small ? 210 : 270;
    drawPanel(ctx, x, y, nextW, panelH, "Następny przystanek:");
    drawPixelText(ctx, next.name, x + 18, y + 50, small ? 24 : 31, "#ffd84f");
    drawPixelText(ctx, `${nextKm} km`, x + 18, y + 78, small ? 21 : 25, "#54d86a");

    const mapX = small ? 18 : x + nextW + gap + 28;
    const mapY = small ? y - 94 : y;
    const mapW = small ? w - 36 : Math.max(330, w - mapX - 24);
    this.routeMap.render(ctx, mapX, mapY, mapW, small ? 76 : panelH, this.train.progress, this.currentSegment());
    if (this.warning) drawPixelText(ctx, this.warning, w / 2, y - 22, 30, "#ef476f", "center");
    ctx.restore();
  }

  drawSignalIcon(ctx, x, y, state) {
    ctx.fillStyle = "#10161a";
    drawRoundedRect(ctx, x - 16, y - 30, 32, 62, 7);
    ctx.fill();
    ctx.strokeStyle = "#d3c6a5";
    ctx.lineWidth = 2;
    ctx.stroke();
    ["red", "yellow", "green"].forEach((color, index) => {
      ctx.fillStyle = state === color ? SIGNAL_COLORS[color] : "#2a3033";
      ctx.beginPath();
      ctx.arc(x, y - 18 + index * 18, 6, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  renderTexts(ctx) {
    ctx.save();
    ctx.textAlign = "center";
    for (const text of this.texts) {
      if (text.x < -160 || text.x > this.canvas.width + 160) continue;
      ctx.globalAlpha = clamp(text.life, 0, 1);
      drawPixelText(ctx, text.text, text.x, text.y, 24, text.color, "center");
    }
    ctx.restore();
  }
}
