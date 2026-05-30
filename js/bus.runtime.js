(function () {
  "use strict";

const { clamp, rectsOverlap, canvasFont, formatTime } = window.ODYSEJA_UTILS;

const BUS_ROUTE_SEGMENTS = [
  {
    id: "wolbrom",
    name: "Wolbrom Centrum",
    start: 0,
    end: 0.18,
    trafficDensity: 0.25,
    potholeDensity: 0.25,
    roadworkDensity: 0.1,
    scenery: "smallTown",
    stopName: "Wolbrom Centrum",
    waitingPassengers: 4
  },
  {
    id: "village",
    name: "Droga przez wioski",
    start: 0.18,
    end: 0.38,
    trafficDensity: 0.35,
    potholeDensity: 0.35,
    roadworkDensity: 0.12,
    scenery: "village",
    stopName: "GoĹ‚aczewy",
    waitingPassengers: 2
  },
  {
    id: "skala",
    name: "SkaĹ‚a",
    start: 0.38,
    end: 0.58,
    trafficDensity: 0.45,
    potholeDensity: 0.28,
    roadworkDensity: 0.22,
    scenery: "smallTown",
    stopName: "SkaĹ‚a Rynek",
    waitingPassengers: 3
  },
  {
    id: "zielonki",
    name: "Zielonki",
    start: 0.58,
    end: 0.78,
    trafficDensity: 0.6,
    potholeDensity: 0.22,
    roadworkDensity: 0.25,
    scenery: "suburbs",
    stopName: "Zielonki",
    waitingPassengers: 3
  },
  {
    id: "krakow",
    name: "KrakĂłw",
    start: 0.78,
    end: 1,
    trafficDensity: 0.75,
    potholeDensity: 0.12,
    roadworkDensity: 0.3,
    scenery: "city",
    stopName: "KrakĂłw",
    waitingPassengers: 0
  }
];

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

class RoadLaneSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.count = 4;
  }

  get roadTop() {
    return Math.max(190, Math.floor(this.canvas.height * 0.38));
  }

  get laneHeight() {
    return Math.max(50, Math.min(70, Math.floor((this.canvas.height - this.roadTop - 90) / this.count)));
  }

  get roadBottom() {
    return this.roadTop + this.laneHeight * this.count;
  }

  laneCenter(lane) {
    return this.roadTop + this.laneHeight * lane + this.laneHeight / 2;
  }

  directionForLane(lane) {
    return lane < 2 ? -1 : 1;
  }

  laneScale(lane) {
    return 0.76 + lane * 0.09;
  }

  render(ctx, scrollX) {
    const w = this.canvas.width;
    const roadTop = this.roadTop;
    const roadBottom = this.roadBottom;
    const laneH = this.laneHeight;

    const shoulder = ctx.createLinearGradient(0, roadTop - 84, 0, roadTop);
    shoulder.addColorStop(0, "#5f8b43");
    shoulder.addColorStop(0.45, "#89a653");
    shoulder.addColorStop(1, "#394f3e");
    ctx.fillStyle = shoulder;
    ctx.fillRect(0, roadTop - 84, w, 84);

    ctx.fillStyle = "#bcc4b3";
    ctx.fillRect(0, roadTop - 18, w, 18);
    ctx.fillStyle = "#7a8177";
    for (let x = -((scrollX * 0.48) % 72); x < w + 80; x += 72) {
      ctx.fillRect(Math.round(x), roadTop - 18, 68, 14);
      ctx.fillStyle = "#8f9789";
      ctx.fillRect(Math.round(x + 2), roadTop - 16, 64, 2);
      ctx.fillStyle = "#7a8177";
    }

    const road = ctx.createLinearGradient(0, roadTop, 0, roadBottom + 120);
    road.addColorStop(0, "#4a4f4f");
    road.addColorStop(0.48, "#333838");
    road.addColorStop(1, "#171c1c");
    ctx.fillStyle = road;
    ctx.fillRect(0, roadTop, w, roadBottom - roadTop + 120);

    for (let lane = 0; lane < this.count; lane += 1) {
      ctx.fillStyle = lane % 2 === 0 ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.06)";
      ctx.fillRect(0, roadTop + lane * laneH, w, laneH);
    }

    ctx.fillStyle = "rgba(255,255,255,0.05)";
    for (let x = -((scrollX * 0.72) % 96); x < w + 100; x += 96) {
      for (let lane = 0; lane < this.count; lane += 1) {
        const y = this.laneCenter(lane) + (seededNoise(x + lane * 17) - 0.5) * 22;
        ctx.fillRect(Math.round(x + seededNoise(x) * 18), Math.round(y), 2, 2);
      }
    }

    ctx.fillStyle = "#c7d3c5";
    ctx.fillRect(0, roadBottom, w, 10);
    ctx.fillStyle = "#758276";
    ctx.fillRect(0, roadTop - 1, w, 3);
    ctx.fillRect(0, roadBottom, w, 3);

    ctx.strokeStyle = "rgba(245, 245, 232, 0.78)";
    ctx.lineWidth = 3;
    for (const lane of [1, 3]) {
      const y = Math.round(roadTop + lane * laneH);
      for (let x = -((scrollX * 0.86) % 88); x < w + 90; x += 88) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 42, y);
        ctx.stroke();
      }
    }

    const separatorY = Math.round(roadTop + 2 * laneH);
    ctx.strokeStyle = "#f3d25d";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, separatorY - 5);
    ctx.lineTo(w, separatorY - 5);
    ctx.moveTo(0, separatorY + 5);
    ctx.lineTo(w, separatorY + 5);
    ctx.stroke();

    ctx.fillStyle = "rgba(0,0,0,0.16)";
    ctx.fillRect(0, separatorY - 1, w, 2);

    for (let lane = 0; lane < this.count; lane += 1) {
      const dir = this.directionForLane(lane);
      const y = this.laneCenter(lane);
      for (let x = -((scrollX * 0.58) % 260) + 88; x < w + 280; x += 260) {
        this.drawLaneArrow(ctx, x, y, dir);
      }
    }

    ctx.fillStyle = "#27372f";
    ctx.fillRect(0, roadBottom + 10, w, 118);
  }

  drawLaneArrow(ctx, x, y, dir) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir, 1);
    ctx.fillStyle = "rgba(255, 255, 240, 0.22)";
    ctx.beginPath();
    ctx.moveTo(42, 0);
    ctx.lineTo(16, -15);
    ctx.lineTo(16, -6);
    ctx.lineTo(-38, -6);
    ctx.lineTo(-38, 6);
    ctx.lineTo(16, 6);
    ctx.lineTo(16, 15);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

class BusController {
  constructor(lanes) {
    this.lanes = lanes;
    this.width = 116;
    this.height = 50;
    this.screenX = 180;
    this.x = 0;
    this.lane = 2;
    this.targetLane = 2;
    this.y = lanes.laneCenter(this.lane) - this.height / 2;
    this.targetY = this.y;
    this.speed = 190;
    this.minSpeed = 0;
    this.maxSpeed = 360;
    this.condition = 100;
    this.hornCooldown = 0;
    this.laneCooldown = 0;
    this.lastSpeed = this.speed;
  }

  get bounds() {
    const scale = this.lanes.laneScale(this.lane);
    return {
      x: this.x,
      y: this.y + this.height * (1 - scale) * 0.5,
      w: this.width * scale,
      h: this.height * scale
    };
  }

  update(dt, input, passengers) {
    this.lastSpeed = this.speed;
    this.hornCooldown = Math.max(0, this.hornCooldown - dt);
    this.laneCooldown = Math.max(0, this.laneCooldown - dt);

    if (this.laneCooldown <= 0 && input.justPressed("KeyW", "ArrowUp")) {
      this.setTargetLane(this.targetLane - 1, passengers);
    }
    if (this.laneCooldown <= 0 && input.justPressed("KeyS", "ArrowDown")) {
      this.setTargetLane(this.targetLane + 1, passengers);
    }

    if (input.down("KeyA", "ArrowLeft")) this.speed -= 270 * dt;
    if (input.down("KeyD", "ArrowRight")) this.speed += 190 * dt;
    if (!input.down("KeyA", "ArrowLeft") && !input.down("KeyD", "ArrowRight") && this.speed > 0) {
      this.speed -= 5 * dt;
    }
    this.speed = clamp(this.speed, this.minSpeed, this.maxSpeed);

    if (input.justPressed("Space") && this.hornCooldown <= 0) {
      this.hornCooldown = 0.8;
      passengers.showPassengerReaction("BIP BIP!");
    }

    const speedDelta = this.speed - this.lastSpeed;
    if (speedDelta < -5.8) passengers.changeSatisfaction(-0.22, "Ostre hamowanie!");
    if (speedDelta > 5.2) passengers.changeSatisfaction(-0.12, "Spokojniej z gazem!");

    this.x += this.speed * dt;
    this.targetY = this.lanes.laneCenter(this.targetLane) - this.height / 2;
    this.y = this.y + (this.targetY - this.y) * (1 - Math.pow(0.001, dt));
    this.lane = Math.round((this.y + this.height / 2 - this.lanes.roadTop) / this.lanes.laneHeight);
  }

  setTargetLane(lane, passengers) {
    const next = clamp(lane, 0, 3);
    if (next === this.targetLane) return;
    this.targetLane = next;
    this.laneCooldown = 0.18;
    if (this.speed > 260) passengers.changeSatisfaction(-1.4, "SzarpaĹ‚o przy zmianie pasa!");
  }

  render(ctx) {
    const drawX = this.screenX;
    const drawY = Math.round(this.y);
    const scale = this.lanes.laneScale(this.lane);
    ctx.save();
    ctx.translate(drawX + this.width / 2, drawY + this.height / 2);
    ctx.scale(scale, scale);
    ctx.translate(-this.width / 2, -this.height / 2);
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.beginPath();
    ctx.ellipse(58, this.height + 6, 64, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f2c84d";
    ctx.fillRect(0, 6, this.width, this.height - 8);
    ctx.fillStyle = "#d74332";
    ctx.fillRect(76, 6, 32, this.height - 8);
    ctx.fillStyle = "#26323b";
    ctx.fillRect(10, 13, 24, 15);
    ctx.fillRect(41, 13, 24, 15);
    ctx.fillStyle = "#fff1a8";
    ctx.fillRect(7, 33, 64, 7);
    ctx.fillStyle = "#1e1e1e";
    ctx.fillRect(13, this.height - 5, 20, 10);
    ctx.fillRect(82, this.height - 5, 20, 10);
    ctx.fillStyle = "#4e4e4e";
    ctx.fillRect(18, this.height - 3, 10, 6);
    ctx.fillRect(87, this.height - 3, 10, 6);
    ctx.strokeStyle = "#2a2415";
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 6, this.width, this.height - 8);
    ctx.fillStyle = "#1c2026";
    ctx.font = canvasFont(900, 15);
    ctx.textAlign = "center";
    ctx.fillText("WOLBROM - KRAKĂ“W", this.width / 2, 48);
    ctx.restore();
  }
}

class PassengerSystem {
  constructor() {
    this.passengerCount = 0;
    this.passengerTarget = 14;
    this.satisfaction = 100;
    this.recentReactionText = "";
    this.reactionTimer = 0;
    this.oppositeLaneTimer = 0;
    this.smoothTimer = 0;
  }

  addPassengers(amount) {
    this.passengerCount += amount;
    this.changeSatisfaction(5, "Nowi pasaĹĽerowie!");
  }

  changeSatisfaction(amount, reason = "") {
    this.satisfaction = clamp(this.satisfaction + amount, 0, 100);
    if (reason) this.showPassengerReaction(reason);
  }

  updateDrivingComfort(dt, bus) {
    this.reactionTimer = Math.max(0, this.reactionTimer - dt);
    if (bus.targetLane < 2) {
      this.oppositeLaneTimer += dt;
      if (this.oppositeLaneTimer > 0.8) {
        this.changeSatisfaction(-10 * dt, "Jedziesz pod prÄ…d!");
      }
    } else {
      this.oppositeLaneTimer = Math.max(0, this.oppositeLaneTimer - dt * 2);
    }

    if (bus.speed > 115 && bus.speed < 245 && bus.targetLane >= 2) {
      this.smoothTimer += dt;
      if (this.smoothTimer > 5) {
        this.changeSatisfaction(1.5, "PĹ‚ynna jazda.");
        this.smoothTimer = 0;
      }
    } else {
      this.smoothTimer = 0;
    }
  }

  showPassengerReaction(text) {
    this.recentReactionText = text;
    this.reactionTimer = 1.45;
  }

  renderHUD(ctx, game, bus, routeLength, routeName, segmentName) {
    const distance = Math.max(0, Math.ceil((routeLength - bus.x) / 320));
    const compact = game.isTouchHud();
    ctx.save();
    ctx.fillStyle = "rgba(10, 14, 20, 0.9)";
    ctx.fillRect(0, 0, game.canvas.width, compact ? 82 : 88);
    ctx.fillStyle = "#fff7dd";
    ctx.font = canvasFont(900, compact ? 18 : 22);
    ctx.textAlign = "left";
    ctx.fillText(`${game.currentLevel.label}  ${routeName}`, 18, 28);
    ctx.fillText(`Do Krakowa: ${distance} km`, 18, 58);
    ctx.fillText(`PasaĹĽerowie: ${this.passengerCount}/${this.passengerTarget}`, game.canvas.width * 0.34, 28);
    ctx.fillText(`Satysfakcja: ${Math.round(this.satisfaction)}%`, game.canvas.width * 0.34, 58);
    ctx.fillText(`Stan busa: ${Math.round(bus.condition)}%`, game.canvas.width * 0.66, 28);
    ctx.fillText(`Czas: ${formatTime(game.timer.time)}`, game.canvas.width * 0.66, 58);
    ctx.fillStyle = "#8ee884";
    ctx.font = canvasFont(900, compact ? 15 : 18);
    ctx.textAlign = "center";
    ctx.fillText(segmentName, game.canvas.width / 2, compact ? 78 : 82);
    if (this.reactionTimer > 0 && this.recentReactionText) {
      ctx.fillStyle = "#ffd166";
      ctx.strokeStyle = "#171717";
      ctx.lineWidth = 5;
      ctx.font = canvasFont(900, compact ? 24 : 28);
      ctx.strokeText(this.recentReactionText, game.canvas.width / 2, compact ? 118 : 126);
      ctx.fillText(this.recentReactionText, game.canvas.width / 2, compact ? 118 : 126);
    }
    ctx.restore();
  }
}

class BusStop {
  constructor(x, lane, name, waitingPassengers) {
    this.x = x;
    this.lane = lane;
    this.name = name;
    this.waitingPassengers = waitingPassengers;
    this.collected = false;
    this.missed = false;
    this.stopZone = 150;
    this.stopHoldTime = 0;
  }

  update(dt, bus, lanes, passengers, system) {
    if (this.collected || this.missed) return;
    const inZone = Math.abs(bus.x - this.x) < this.stopZone && Math.abs(bus.targetLane - this.lane) <= 0;
    if (inZone && bus.speed < 42) {
      this.stopHoldTime += dt;
      if (this.stopHoldTime >= 1) {
        this.collected = true;
        passengers.addPassengers(this.waitingPassengers);
        system.showText(`+${this.waitingPassengers} pasaĹĽerĂłw`, this.x, lanes.laneCenter(this.lane) - 82, "#80ff9b");
        system.showText(`Przystanek: ${this.name}`, this.x, lanes.laneCenter(this.lane) - 112, "#ffd166");
      }
    } else {
      this.stopHoldTime = Math.max(0, this.stopHoldTime - dt * 0.8);
    }
    if (!this.collected && bus.x > this.x + this.stopZone + 190) {
      this.missed = true;
      passengers.changeSatisfaction(-13, "PominiÄ™to przystanek!");
      system.showText("PominiÄ™to przystanek!", this.x, lanes.laneCenter(this.lane) - 92, "#ef476f");
    }
  }

  isBusNear(bus) {
    return !this.collected && !this.missed && Math.abs(bus.x - this.x) < this.stopZone && Math.abs(bus.targetLane - this.lane) <= 0;
  }

  render(ctx, bus, lanes) {
    const x = Math.round(this.x - bus.x + bus.screenX);
    if (x < -220 || x > lanes.canvas.width + 220) return;
    const laneY = lanes.laneCenter(this.lane);
    const bayY = laneY - lanes.laneHeight / 2 + 6;
    ctx.save();
    ctx.fillStyle = this.collected ? "rgba(93, 180, 105, 0.25)" : this.missed ? "rgba(160, 63, 77, 0.25)" : "rgba(255, 225, 115, 0.26)";
    ctx.fillRect(x - this.stopZone, bayY, this.stopZone * 2, lanes.laneHeight - 12);
    ctx.strokeStyle = "#f8db74";
    ctx.lineWidth = 3;
    ctx.strokeRect(x - this.stopZone, bayY, this.stopZone * 2, lanes.laneHeight - 12);
    ctx.fillStyle = "rgba(255, 247, 221, 0.28)";
    ctx.font = canvasFont(900, 18);
    ctx.textAlign = "center";
    ctx.fillText("BUS", x - 48, laneY + 7);
    ctx.fillText("STOP", x + 42, laneY + 7);
    ctx.strokeStyle = "rgba(255, 247, 221, 0.45)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - this.stopZone + 18, bayY + lanes.laneHeight - 22);
    ctx.lineTo(x - this.stopZone + 78, bayY + lanes.laneHeight - 22);
    ctx.moveTo(x + this.stopZone - 78, bayY + 18);
    ctx.lineTo(x + this.stopZone - 18, bayY + 18);
    ctx.stroke();

    const shelterY = lanes.roadTop - 112;
    ctx.fillStyle = "rgba(38, 56, 72, 0.8)";
    ctx.fillRect(x - 76, shelterY + 22, 118, 58);
    ctx.fillStyle = "rgba(124, 194, 222, 0.55)";
    ctx.fillRect(x - 68, shelterY + 30, 102, 42);
    ctx.fillStyle = "#1d2730";
    ctx.fillRect(x - 82, shelterY + 14, 130, 16);
    ctx.fillStyle = "#f1d778";
    ctx.fillRect(x - 65, shelterY + 18, 96, 9);
    ctx.fillStyle = "#fff7dd";
    ctx.font = canvasFont(900, 14);
    ctx.textAlign = "center";
    ctx.fillText(this.name, x - 17, shelterY + 26);

    ctx.fillStyle = "#f0d76f";
    ctx.fillRect(x + 56, shelterY + 2, 18, 74);
    ctx.fillStyle = "#233443";
    ctx.fillRect(x + 50, shelterY - 16, 30, 24);
    ctx.fillStyle = "#fff7dd";
    ctx.font = canvasFont(900, 15);
    ctx.fillText("BUS", x + 65, shelterY + 1);

    if (!this.collected && !this.missed) {
      for (let i = 0; i < this.waitingPassengers; i += 1) {
        this.drawPassenger(ctx, x - 52 + i * 19, shelterY + 58, i);
      }
      if (this.isBusNear(bus)) {
        ctx.font = canvasFont(900, 18);
        ctx.strokeStyle = "#1a1a1a";
        ctx.lineWidth = 5;
        ctx.strokeText("Zatrzymaj siÄ™...", x, bayY - 12);
        ctx.fillStyle = "#ffe07a";
        ctx.fillText("Zatrzymaj siÄ™...", x, bayY - 12);
      }
    }
    ctx.restore();
  }

  drawPassenger(ctx, x, y, index) {
    const colors = ["#f6b46a", "#78c5ff", "#f2749d", "#9bd66f"];
    ctx.fillStyle = "#e8b985";
    ctx.fillRect(x + 3, y, 8, 8);
    ctx.fillStyle = colors[index % colors.length];
    ctx.fillRect(x, y + 8, 14, 22);
    ctx.fillStyle = "#2d2d32";
    ctx.fillRect(x + 1, y + 30, 4, 9);
    ctx.fillRect(x + 9, y + 30, 4, 9);
  }
}

class TrafficObstacle {
  constructor(type, x, lane, lanes) {
    this.type = type;
    this.x = x;
    this.lane = lane;
    this.direction = lanes.directionForLane(lane);
    this.hit = false;
    this.dead = false;

    const configs = {
      pothole: { w: 58, h: 22, speed: 0, damage: 5, penalty: 6, color: "#151515" },
      cone: { w: 28, h: 36, speed: 0, damage: 1, penalty: 3, color: "#f47b20" },
      roadworksBarrier: { w: 94, h: 38, speed: 0, damage: 16, penalty: 13, color: "#d4443f" },
      slowCar: { w: 94, h: 42, speed: 90, damage: 22, penalty: 18, color: "#568bd6" },
      truck: { w: 138, h: 54, speed: 76, damage: 34, penalty: 24, color: "#8d8f97" },
      oppositeCar: { w: 96, h: 42, speed: 245, damage: 38, penalty: 30, color: "#d65656" },
      tractor: { w: 106, h: 48, speed: 62, damage: 18, penalty: 16, color: "#68a34b" }
    };
    Object.assign(this, configs[type] || configs.cone);
  }

  getBounds(lanes) {
    const scale = lanes.laneScale(this.lane);
    return {
      x: this.x,
      y: lanes.laneCenter(this.lane) - (this.h * scale) / 2,
      w: this.w * scale,
      h: this.h * scale
    };
  }

  update(dt, bus, lanes, passengers, system) {
    this.x += this.speed * this.direction * dt;
    if (!this.hit && rectsOverlap(bus.bounds, this.getBounds(lanes))) {
      this.hit = true;
      bus.condition = clamp(bus.condition - this.damage, 0, 100);
      passengers.changeSatisfaction(-this.penalty, this.type === "pothole" ? "Dziura!" : "Kolizja!");
      system.showText(`-${this.damage}% bus`, bus.x + 60, bus.y - 20, "#ef476f");
      if (this.speed === 0) this.dead = true;
    }
    if (this.x < bus.x - 520 || this.x > bus.x + lanes.canvas.width + 980) this.dead = true;
  }

  render(ctx, bus, lanes) {
    const bounds = this.getBounds(lanes);
    const x = Math.round(bounds.x - bus.x + bus.screenX);
    const y = Math.round(bounds.y);
    const scale = lanes.laneScale(this.lane);
    if (x + bounds.w < -100 || x > lanes.canvas.width + 100) return;
    ctx.save();
    ctx.translate(x + bounds.w / 2, y + bounds.h / 2);
    ctx.scale(scale, scale);
    ctx.translate(-this.w / 2, -this.h / 2);
    if (this.type === "pothole") this.renderPothole(ctx, 0, 0);
    else if (this.type === "cone") this.renderCone(ctx, 0, 0);
    else if (this.type === "roadworksBarrier") this.renderBarrier(ctx, 0, 0);
    else this.renderVehicle(ctx, 0, 0);
    ctx.restore();
  }

  renderPothole(ctx, x, y) {
    ctx.fillStyle = "#101312";
    ctx.beginPath();
    ctx.ellipse(x + this.w / 2, y + this.h / 2, this.w / 2, this.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#343a37";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 12, y + 11);
    ctx.lineTo(x + 23, y + 5);
    ctx.lineTo(x + 35, y + 13);
    ctx.lineTo(x + 48, y + 8);
    ctx.stroke();
    ctx.fillStyle = "#5d645f";
    ctx.fillRect(x + 7, y + 18, 5, 3);
    ctx.fillRect(x + 43, y + 18, 4, 3);
  }

  renderCone(ctx, x, y) {
    ctx.fillStyle = "#f47b20";
    ctx.beginPath();
    ctx.moveTo(x + this.w / 2, y);
    ctx.lineTo(x + this.w, y + this.h);
    ctx.lineTo(x, y + this.h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff3d1";
    ctx.fillRect(x + 7, y + 18, this.w - 14, 5);
    ctx.fillStyle = "#5a2d17";
    ctx.fillRect(x - 3, y + this.h - 3, this.w + 6, 5);
  }

  renderBarrier(ctx, x, y) {
    ctx.fillStyle = "#2b2d31";
    ctx.fillRect(x + 8, y + 29, 5, 18);
    ctx.fillRect(x + this.w - 13, y + 29, 5, 18);
    ctx.fillStyle = "#fff3d1";
    ctx.fillRect(x, y + 8, this.w, 22);
    ctx.strokeStyle = "#cf3f3f";
    ctx.lineWidth = 8;
    for (let sx = x - 20; sx < x + this.w; sx += 32) {
      ctx.beginPath();
      ctx.moveTo(sx, y + 31);
      ctx.lineTo(sx + 30, y + 8);
      ctx.stroke();
    }
    ctx.strokeStyle = "#2a2a2a";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y + 8, this.w, 22);
  }

  renderVehicle(ctx, x, y) {
    const dir = this.direction;
    ctx.save();
    ctx.translate(x + this.w / 2, y + this.h / 2);
    ctx.scale(dir, 1);
    ctx.translate(-this.w / 2, -this.h / 2);
    const isTruck = this.type === "truck";
    const isTractor = this.type === "tractor";
    ctx.fillStyle = this.color;
    drawRoundedRect(ctx, 0, isTruck ? 5 : 8, this.w, isTruck ? this.h - 12 : this.h - 14, 6);
    ctx.fill();
    ctx.fillStyle = "#c7e6f0";
    ctx.fillRect(13, 13, isTruck ? 28 : 22, 13);
    if (!isTractor) ctx.fillRect(45, 13, isTruck ? 44 : 22, 13);
    if (isTruck) {
      ctx.fillStyle = "#35465c";
      ctx.fillRect(70, 10, this.w - 80, this.h - 22);
      ctx.fillStyle = "#fff7dd";
      ctx.font = canvasFont(900, 13);
      ctx.textAlign = "center";
      ctx.fillText("TRANS", this.w - 34, 31);
    }
    if (isTractor) {
      ctx.fillStyle = "#f1c84e";
      ctx.fillRect(12, 4, 28, 14);
    }
    ctx.fillStyle = "#1d1d1d";
    ctx.fillRect(12, this.h - 9, 18, 9);
    ctx.fillRect(this.w - 30, this.h - 9, 18, 9);
    ctx.restore();
  }
}

class BusRideLevelSystem {
  constructor(level, canvas) {
    this.level = level;
    this.canvas = canvas;
    this.lanes = new RoadLaneSystem(canvas);
    this.bus = new BusController(this.lanes);
    this.passengers = new PassengerSystem();
    this.routeLength = level.length || 16000;
    this.routeName = level.route || "WOLBROM -> KRAKĂ“W";
    this.texts = [];
    this.obstacles = [];
    this.nextObstacleX = 620;
    this.lastSegmentId = "";
    this.sceneryProps = [];
    this.segments = BUS_ROUTE_SEGMENTS.map((segment) => ({
      ...segment,
      startX: segment.start * this.routeLength,
      endX: segment.end * this.routeLength
    }));
    this.stops = this.segments.map((segment, index) => {
      const x = index === this.segments.length - 1
        ? segment.endX - 420
        : segment.startX + (segment.endX - segment.startX) * 0.68;
      return new BusStop(x, 3, segment.stopName, segment.waitingPassengers);
    });
    this.passengers.passengerTarget = this.stops.reduce((sum, stop) => sum + stop.waitingPassengers, 0);
    this.sceneryProps = this.generateSceneryProps();
  }

  currentSegment() {
    return this.segments.find((segment) => this.bus.x >= segment.startX && this.bus.x < segment.endX) || this.segments[this.segments.length - 1];
  }

  showText(text, x, y, color = "#fff7dd") {
    this.texts.push({ text, x, y, color, life: 1.3, vy: -28 });
  }

  update(dt, game) {
    this.bus.update(dt, game.input, this.passengers);
    this.passengers.updateDrivingComfort(dt, this.bus);
    const segment = this.currentSegment();
    if (segment.id !== this.lastSegmentId) {
      this.lastSegmentId = segment.id;
      this.passengers.showPassengerReaction(segment.name);
      this.showText(segment.name, this.bus.x + this.canvas.width * 0.48, this.lanes.roadTop - 72, "#ffd166");
    }

    this.spawnObstacles();
    for (const stop of this.stops) stop.update(dt, this.bus, this.lanes, this.passengers, this);
    for (const obstacle of this.obstacles) obstacle.update(dt, this.bus, this.lanes, this.passengers, this);
    this.obstacles = this.obstacles.filter((obstacle) => !obstacle.dead);

    for (const text of this.texts) {
      text.y += text.vy * dt;
      text.life -= dt;
    }
    this.texts = this.texts.filter((text) => text.life > 0);

    if (this.bus.condition <= 0) {
      game.gameOver("Bus nie dojechaĹ‚ do Krakowa.");
      return;
    }
    if (this.passengers.satisfaction <= 0) {
      game.gameOver("PasaĹĽerowie zbuntowali siÄ™ w busie.");
      return;
    }
    if (this.bus.x >= this.routeLength) {
      game.completeLevel();
    }
  }

  spawnObstacles() {
    const segment = this.currentSegment();
    const spawnAhead = this.bus.x + this.canvas.width + 360;
    while (this.nextObstacleX < spawnAhead && this.nextObstacleX < this.routeLength - 260) {
      const density = Math.max(0.18, segment.trafficDensity);
      const gap = 180 + Math.random() * (220 / density);
      this.nextObstacleX += gap;
      const lane = Math.floor(Math.random() * 4);
      const roll = Math.random();
      let type = "cone";
      if (lane < 2) {
        type = roll < 0.72 ? "oppositeCar" : "truck";
      } else if (roll < segment.potholeDensity) {
        type = "pothole";
      } else if (roll < segment.potholeDensity + segment.roadworkDensity * 0.48) {
        type = "roadworksBarrier";
      } else if (roll < segment.potholeDensity + segment.roadworkDensity * 0.88) {
        type = "cone";
      } else if (roll < 0.88) {
        type = "slowCar";
      } else {
        type = "tractor";
      }
      const nearStop = this.stops.some((stop) => Math.abs(stop.x - this.nextObstacleX) < 240);
      if (!nearStop) this.obstacles.push(new TrafficObstacle(type, this.nextObstacleX, lane, this.lanes));
    }
  }

  generateSceneryProps() {
    const props = [];
    for (const segment of this.segments) {
      let x = segment.startX + 120;
      let index = 0;
      while (x < segment.endX - 80) {
        const n = seededNoise(x + index * 31);
        const type = this.pickSceneryType(segment.scenery, n);
        props.push({
          x,
          type,
          label: this.pickSceneryLabel(segment, type, n),
          color: this.pickSceneryColor(segment.scenery, n),
          scale: 0.85 + seededNoise(x * 0.3) * 0.35,
          parallax: type === "skyline" ? 0.34 : type === "field" ? 0.48 : 0.62,
          segmentId: segment.id
        });
        x += 155 + seededNoise(x * 0.73) * 170;
        index += 1;
      }
    }
    return props;
  }

  pickSceneryType(scenery, n) {
    if (scenery === "city") return n < 0.62 ? "skyline" : n < 0.78 ? "sign" : "building";
    if (scenery === "suburbs") return n < 0.32 ? "building" : n < 0.64 ? "tree" : n < 0.82 ? "pole" : "sign";
    if (scenery === "village") return n < 0.34 ? "house" : n < 0.7 ? "tree" : n < 0.86 ? "field" : "pole";
    return n < 0.45 ? "building" : n < 0.68 ? "shop" : n < 0.84 ? "tree" : "sign";
  }

  pickSceneryLabel(segment, type, n) {
    if (type === "sign") {
      if (segment.id === "krakow") return "KRAKĂ“W";
      if (segment.id === "skala") return "SKAĹA";
      if (segment.id === "zielonki") return "ZIELONKI";
      return "KRAKĂ“W 28 km";
    }
    if (type === "shop") return n < 0.5 ? "PIEKARNIA" : "SKLEP";
    if (type === "building") return n < 0.5 ? "LEWIATAN" : "ROSSMANN";
    return "";
  }

  pickSceneryColor(scenery, n) {
    const palettes = {
      smallTown: ["#c7b28b", "#9fb39b", "#b78464", "#687884"],
      village: ["#b9b98d", "#8ca070", "#c2a16b", "#6f8a62"],
      suburbs: ["#9bafbd", "#b6ad9c", "#7f8e9e", "#778b78"],
      city: ["#60707f", "#748190", "#52606d", "#879099"]
    };
    const colors = palettes[scenery] || palettes.smallTown;
    return colors[Math.floor(n * colors.length) % colors.length];
  }

  render(ctx, game) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const segment = this.currentSegment();
    this.renderSky(ctx, segment, w, h);
    this.renderScenery(ctx, segment);
    this.lanes.render(ctx, this.bus.x);
    for (const stop of this.stops) stop.render(ctx, this.bus, this.lanes);
    for (const obstacle of [...this.obstacles].sort((a, b) => a.lane - b.lane)) {
      obstacle.render(ctx, this.bus, this.lanes);
    }
    this.bus.render(ctx);
    this.renderRouteSigns(ctx);
    this.renderTexts(ctx);
    this.passengers.renderHUD(ctx, game, this.bus, this.routeLength, this.routeName, segment.name);
    game.renderDim(ctx);
  }

  renderSky(ctx, segment, w, h) {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    if (segment.id === "krakow") {
      sky.addColorStop(0, "#93b8d5");
      sky.addColorStop(0.58, "#b5cfd5");
      sky.addColorStop(1, "#6a8764");
    } else if (segment.id === "village") {
      sky.addColorStop(0, "#78bfe8");
      sky.addColorStop(0.62, "#b7d0bd");
      sky.addColorStop(1, "#6d8b58");
    } else {
      sky.addColorStop(0, "#84c8f0");
      sky.addColorStop(0.64, "#b8d3c8");
      sky.addColorStop(1, "#78956a");
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "rgba(255,255,255,0.78)";
    for (let i = 0; i < 5; i += 1) {
      const x = (i * 260 - (this.bus.x * 0.08) % 260) - 70;
      const y = 52 + (i % 2) * 24;
      this.drawCloud(ctx, x, y, 0.75 + (i % 3) * 0.18);
    }
  }

  renderScenery(ctx) {
    const roadTop = this.lanes.roadTop;
    for (const prop of this.sceneryProps) {
      const x = Math.round(prop.x - this.bus.x * prop.parallax + this.bus.screenX);
      if (x < -260 || x > this.canvas.width + 260) continue;
      const ground = roadTop - 20 + (prop.parallax < 0.5 ? 18 : 0);
      if (prop.type === "tree") this.drawTree(ctx, x, ground, prop.scale);
      else if (prop.type === "pole") this.drawPole(ctx, x, ground);
      else if (prop.type === "field") this.drawField(ctx, x, ground);
      else if (prop.type === "sign") this.drawRoadsideSign(ctx, x, ground, prop.label);
      else if (prop.type === "skyline") this.drawSkyline(ctx, x, roadTop - 8, prop.scale);
      else if (prop.type === "house") this.drawHouse(ctx, x, ground, prop.scale, prop.color);
      else this.drawBuilding(ctx, x, ground, prop.scale, prop.color, prop.label, prop.type === "shop");
    }
  }

  drawCloud(ctx, x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.fillRect(10, 20, 96, 16);
    ctx.fillRect(26, 8, 28, 22);
    ctx.fillRect(52, 2, 36, 30);
    ctx.fillRect(84, 12, 36, 24);
    ctx.fillStyle = "rgba(172,190,201,0.45)";
    ctx.fillRect(18, 33, 92, 7);
    ctx.restore();
  }

  drawBuilding(ctx, x, ground, scale, color, label, shop = false) {
    const w = Math.round((shop ? 128 : 104) * scale);
    const h = Math.round((shop ? 90 : 132) * scale);
    const y = ground - h;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "#2e3942";
    ctx.fillRect(x, y, w, 10);
    ctx.fillStyle = "#ffe071";
    ctx.fillRect(x + 10, y + 20, w - 20, 17);
    ctx.fillStyle = "#2d3136";
    ctx.font = canvasFont(900, 12);
    ctx.textAlign = "center";
    if (label) ctx.fillText(label, x + w / 2, y + 33);
    ctx.fillStyle = "#dfe7be";
    const cols = shop ? 2 : 3;
    for (let row = 0; row < (shop ? 1 : 4); row += 1) {
      for (let col = 0; col < cols; col += 1) {
        ctx.fillRect(x + 15 + col * (w / cols), y + 48 + row * 21, 13, 12);
      }
    }
    if (shop) {
      ctx.fillStyle = "#92b9bd";
      ctx.fillRect(x + 14, y + h - 32, w - 28, 22);
    }
  }

  drawHouse(ctx, x, ground, scale, color) {
    const w = Math.round(114 * scale);
    const h = Math.round(78 * scale);
    const y = ground - h;
    ctx.fillStyle = color;
    ctx.fillRect(x, y + 24, w, h - 24);
    ctx.fillStyle = "#8e4a34";
    ctx.beginPath();
    ctx.moveTo(x - 8, y + 26);
    ctx.lineTo(x + w / 2, y);
    ctx.lineTo(x + w + 8, y + 26);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#eadf9b";
    ctx.fillRect(x + 16, y + 42, 16, 18);
    ctx.fillRect(x + w - 34, y + 42, 16, 18);
    ctx.fillStyle = "#5d4534";
    ctx.fillRect(x + w / 2 - 9, y + h - 28, 18, 28);
  }

  drawTree(ctx, x, ground, scale) {
    const h = 82 * scale;
    ctx.fillStyle = "#6a4420";
    ctx.fillRect(x + 22 * scale, ground - h * 0.42, 13 * scale, h * 0.42);
    ctx.fillStyle = "#2f6f3f";
    ctx.fillRect(x, ground - h, 58 * scale, 32 * scale);
    ctx.fillStyle = "#4b9b50";
    ctx.fillRect(x + 9 * scale, ground - h - 14 * scale, 42 * scale, 28 * scale);
    ctx.fillStyle = "#6fbf57";
    ctx.fillRect(x + 18 * scale, ground - h - 24 * scale, 24 * scale, 20 * scale);
  }

  drawPole(ctx, x, ground) {
    ctx.fillStyle = "#4b3a2d";
    ctx.fillRect(x, ground - 92, 7, 92);
    ctx.fillRect(x - 18, ground - 82, 44, 5);
    ctx.strokeStyle = "rgba(38, 34, 30, 0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 70, ground - 78);
    ctx.lineTo(x + 76, ground - 80);
    ctx.stroke();
  }

  drawField(ctx, x, ground) {
    ctx.fillStyle = "#7fa55c";
    ctx.fillRect(x - 30, ground - 18, 190, 18);
    ctx.fillStyle = "#d8c56a";
    for (let i = 0; i < 12; i += 1) ctx.fillRect(x - 24 + i * 15, ground - 25 - (i % 2) * 5, 4, 12);
  }

  drawRoadsideSign(ctx, x, ground, label) {
    ctx.fillStyle = "#2c3d53";
    ctx.fillRect(x, ground - 65, 112, 38);
    ctx.strokeStyle = "#e9f1ff";
    ctx.lineWidth = 3;
    ctx.strokeRect(x, ground - 65, 112, 38);
    ctx.fillStyle = "#f7f1d1";
    ctx.font = canvasFont(900, label.length > 10 ? 14 : 18);
    ctx.textAlign = "center";
    ctx.fillText(label, x + 56, ground - 41);
    ctx.fillStyle = "#27313d";
    ctx.fillRect(x + 14, ground - 27, 6, 27);
    ctx.fillRect(x + 92, ground - 27, 6, 27);
  }

  drawSkyline(ctx, x, ground, scale) {
    const widths = [38, 54, 42, 64, 48];
    ctx.fillStyle = "rgba(45, 57, 71, 0.62)";
    let offset = 0;
    for (let i = 0; i < widths.length; i += 1) {
      const bw = widths[i] * scale;
      const bh = (95 + (i % 3) * 32) * scale;
      ctx.fillRect(x + offset, ground - bh, bw, bh);
      ctx.fillStyle = "rgba(255, 217, 105, 0.7)";
      for (let wy = ground - bh + 14; wy < ground - 15; wy += 26) {
        ctx.fillRect(x + offset + 11, wy, 8, 10);
        ctx.fillRect(x + offset + bw - 20, wy, 8, 10);
      }
      ctx.fillStyle = "rgba(45, 57, 71, 0.62)";
      offset += bw + 16;
    }
  }

  renderRouteSigns(ctx) {
    const progress = clamp(this.bus.x / this.routeLength, 0, 1);
    const barW = Math.min(360, this.canvas.width * 0.34);
    const x = this.canvas.width - barW - 22;
    const y = this.lanes.roadBottom + 28;
    ctx.save();
    ctx.fillStyle = "rgba(20, 28, 26, 0.62)";
    ctx.fillRect(x, y, barW, 24);
    ctx.fillStyle = "#85d46a";
    ctx.fillRect(x + 4, y + 4, (barW - 8) * progress, 16);
    ctx.strokeStyle = "#fff7dd";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barW, 24);
    ctx.fillStyle = "#fff7dd";
    ctx.font = canvasFont(900, 14);
    ctx.textAlign = "center";
    ctx.fillText("TRASA DO KRAKOWA", x + barW / 2, y - 7);
    ctx.restore();
  }

  renderTexts(ctx) {
    ctx.save();
    ctx.textAlign = "center";
    for (const text of this.texts) {
      const x = Math.round(text.x - this.bus.x + this.bus.screenX);
      const y = Math.round(text.y);
      if (x < -160 || x > this.canvas.width + 160) continue;
      ctx.globalAlpha = clamp(text.life, 0, 1);
      ctx.font = canvasFont(900, 22);
      ctx.strokeStyle = "#161616";
      ctx.lineWidth = 5;
      ctx.strokeText(text.text, x, y);
      ctx.fillStyle = text.color;
      ctx.fillText(text.text, x, y);
    }
    ctx.restore();
  }
}


  window.ODYSEJA_BUS = Object.freeze({
    BUS_ROUTE_SEGMENTS,
    BusController,
    RoadLaneSystem,
    PassengerSystem,
    BusStop,
    TrafficObstacle,
    BusRideLevelSystem,
  });
})();

