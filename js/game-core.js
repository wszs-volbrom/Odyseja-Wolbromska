import { CONFIG, GAME_FONT, COLLECTIBLE_TYPES } from "./config.js";
import {
  getCampaignLevel,
  getNextCampaignLevelIndex,
  hasNextCampaignLevel,
} from "./levels.js";
import { clamp, lerp, rectsOverlap, formatTime, canvasFont, detectTouchDevice } from "./utils.js";
import { SaveSystem } from "./save.js";
import { InputManager } from "./input.js";
import { SpeedrunTimer, HungerSystem, CameraSystem } from "./systems.js";
import {
  UI_IMAGES,
  SpriteLoader,
  LevelAssetManager,
  loadCollectibleImages,
  loadEnemyImages,
  loadUiImages,
} from "./assets.js";
import { PlayerController } from "./player.js";
import { CollectibleItem } from "./collectibles.js";
import {
  BossFlyingTrackerEnemy,
  TestArenaBossEnemy,
  TwinkChaseTarget,
} from "./enemies.js";
import { AudioManager } from "./audio.js";
import { SkinShop } from "./shop.js";
import { ProceduralLevelGenerator } from "./procedural.js";
import { BusRideLevelSystem } from "./bus.js";
import { TrainRideLevelSystem } from "./train.js";
import {
  renderGameFrame,
  renderDim,
  renderBackground,
  renderParallaxRoad,
  renderBackdropLayer,
  drawAssetInBox,
  renderWorld,
  renderDetails,
  renderPlatform,
  renderCheckpoints,
  renderFinish,
  renderFloatingTexts,
} from "./rendering.js";




class MobileControls {
  constructor(game) {
    this.game = game;
    this.root = document.getElementById("mobileControls");
    this.activePointers = new Map();
    this.actionToCode = {
      left: "ArrowLeft",
      right: "ArrowRight",
      jump: "Space",
      sprint: "ShiftLeft"
    };
    this.bind();
  }

  bind() {
    if (!this.root) return;
    this.root.querySelectorAll("[data-touch-action]").forEach((button) => {
      button.addEventListener("pointerdown", (event) => this.handleDown(event, button));
      button.addEventListener("pointerup", (event) => this.handleUp(event, button));
      button.addEventListener("pointercancel", (event) => this.handleUp(event, button));
      button.addEventListener("lostpointercapture", (event) => this.handleUp(event, button));
      button.addEventListener("contextmenu", (event) => event.preventDefault());
    });
  }

  handleDown(event, button) {
    event.preventDefault();
    const action = button.dataset.touchAction;
    if (action === "pause") {
      if (this.game.state === "playing") this.game.pause();
      else if (this.game.state === "paused") this.game.resume();
      return;
    }
    const code = this.actionToCode[action];
    if (!code) return;
    button.setPointerCapture?.(event.pointerId);
    this.activePointers.set(event.pointerId, { action, code, button });
    button.classList.add("is-active");
    this.game.input.pressVirtual(code);
  }

  handleUp(event, button) {
    const active = this.activePointers.get(event.pointerId);
    if (!active) return;
    event.preventDefault();
    this.activePointers.delete(event.pointerId);
    active.button.classList.remove("is-active");
    const stillHeld = [...this.activePointers.values()].some((item) => item.code === active.code);
    if (!stillHeld) this.game.input.releaseVirtual(active.code);
  }

  clear() {
    this.activePointers.clear();
    this.root?.querySelectorAll(".is-active").forEach((button) => button.classList.remove("is-active"));
    this.game.input.clearVirtual();
  }

  setVisible(visible) {
    if (!this.root) return;
    this.root.classList.toggle("hidden", !visible);
    if (!visible) this.clear();
  }
}

class UIManager {
  constructor(game) {
    this.game = game;
    this.disclaimerOverlay = document.getElementById("disclaimerOverlay");
    this.menuOverlay = document.getElementById("menuOverlay");
    this.startGuideOverlay = document.getElementById("startGuideOverlay");
    this.chaseIntroOverlay = document.getElementById("chaseIntroOverlay");
    this.loadingOverlay = document.getElementById("loadingOverlay");
    this.pauseOverlay = document.getElementById("pauseOverlay");
    this.controlsOverlay = document.getElementById("controlsOverlay");
    this.settingsOverlay = document.getElementById("settingsOverlay");
    this.resultOverlay = document.getElementById("resultOverlay");
    this.resultTitle = document.getElementById("resultTitle");
    this.resultDetails = document.getElementById("resultDetails");
    this.bestTimeLabel = document.getElementById("bestTimeLabel");
    this.unlimitedLivesToggle = document.getElementById("unlimitedLivesToggle");
    this.skipLevelToggle = document.getElementById("skipLevelToggle");
    this.musicVolumeSlider = document.getElementById("musicVolumeSlider");
    this.sfxVolumeSlider = document.getElementById("sfxVolumeSlider");
    this.touchControlsModeSelect = document.getElementById("touchControlsMode");
    this.musicVolumeValue = document.getElementById("musicVolumeValue");
    this.sfxVolumeValue = document.getElementById("sfxVolumeValue");
    this.loadingTitle = document.getElementById("loadingTitle");
    this.loadingDetails = document.getElementById("loadingDetails");
    this.loadingBarFill = document.getElementById("loadingBarFill");
    this.skinWalletLabel = document.getElementById("skinWalletLabel");
    this.skinShopGrid = document.getElementById("skinShopGrid");
    this.screenControls = document.getElementById("screenControls");
    this.fullscreenButton = document.getElementById("fullscreenButton");
    this.screenPauseButton = document.getElementById("screenPauseButton");

    document.getElementById("acceptDisclaimerButton").addEventListener("click", () => this.showMenu());
    document.getElementById("startButton").addEventListener("click", () => {
      if (game.startGuideSeen) {
        game.startGame();
      } else {
        this.showStartGuide();
      }
    });
    document.getElementById("beginGameButton").addEventListener("click", () => {
      game.startGuideSeen = true;
      game.startGame();
    });
    document.getElementById("beginChaseButton")?.addEventListener("click", () => game.beginLoadedLevel());
    this.unlimitedLivesToggle.addEventListener("click", () => {
      game.unlimitedLives = !game.unlimitedLives;
      this.updateMenu();
    });
    this.skipLevelToggle.addEventListener("click", () => {
      game.skipLevelCheat = !game.skipLevelCheat;
      this.updateMenu();
    });
    document.getElementById("resetBestButton").addEventListener("click", () => {
      SaveSystem.resetBestTime();
      this.updateMenu();
    });
    document.getElementById("controlsButton").addEventListener("click", () => this.showShop());
    document.getElementById("settingsButton").addEventListener("click", () => this.showSettings());
    document.getElementById("backButton").addEventListener("click", () => this.showMenu());
    document.getElementById("settingsBackButton").addEventListener("click", () => this.showMenu());
    document.getElementById("nextLevelButton").addEventListener("click", () => game.nextLevel());
    document.getElementById("retryButton").addEventListener("click", () => game.restartLevel());
    document.getElementById("menuButton").addEventListener("click", () => game.returnToMenu());
    document.getElementById("resumeButton").addEventListener("click", () => game.resume());
    document.getElementById("pauseRestartButton").addEventListener("click", () => game.restartLevel());
    document.getElementById("pauseMenuButton").addEventListener("click", () => game.returnToMenu());
    this.fullscreenButton?.addEventListener("click", () => game.toggleFullscreen());
    this.screenPauseButton?.addEventListener("click", () => {
      if (game.state === "playing") game.pause();
      else if (game.state === "paused") game.resume();
    });
    this.musicVolumeSlider.addEventListener("input", () => {
      game.audio.setMusicVolume(Number(this.musicVolumeSlider.value) / 100);
      this.updateSettingsLabels();
    });
    this.sfxVolumeSlider.addEventListener("input", () => {
      game.audio.setSfxVolume(Number(this.sfxVolumeSlider.value) / 100);
      this.updateSettingsLabels();
    });
    this.touchControlsModeSelect.addEventListener("change", () => {
      game.setTouchControlsMode(this.touchControlsModeSelect.value);
      this.updateSettingsLabels();
    });
    game.skinShop.connect({
      walletLabel: this.skinWalletLabel,
      shopGrid: this.skinShopGrid,
      afterAction: () => {
        this.updateShop();
        this.updateMenu();
      },
    });
    this.updateMenu();
    this.updateShop();
    this.syncSettingsControls();
    this.updateScreenControls();
  }

  updateMenu() {
    const best = SaveSystem.getBestTime(false);
    this.bestTimeLabel.textContent = best ? `Najlepszy czas: ${formatTime(best)}` : "Najlepszy czas: brak";
    this.unlimitedLivesToggle.textContent = `Unlimited lives: ${this.game.unlimitedLives ? "YES" : "NO"}`;
    this.skipLevelToggle.textContent = `Skip Level (O): ${this.game.skipLevelCheat ? "YES" : "NO"}`;
  }

  updateShop() {
    this.game.skinShop.update();
  }

  syncSettingsControls() {
    this.musicVolumeSlider.value = Math.round(this.game.audio.musicVolume * 100);
    this.sfxVolumeSlider.value = Math.round(this.game.audio.sfxVolume * 100);
    this.touchControlsModeSelect.value = this.game.touchControlsMode;
    this.updateSettingsLabels();
  }

  updateSettingsLabels() {
    this.musicVolumeValue.textContent = `${Math.round(this.game.audio.musicVolume * 100)}%`;
    this.sfxVolumeValue.textContent = `${Math.round(this.game.audio.sfxVolume * 100)}%`;
  }

  updateScreenControls() {
    if (!this.screenControls) return;
    const visible = this.game.state === "playing" || this.game.state === "paused";
    this.screenControls.classList.toggle("hidden", !visible);
  }

  showMenu() {
    this.disclaimerOverlay.classList.add("hidden");
    this.menuOverlay.classList.remove("hidden");
    this.startGuideOverlay.classList.add("hidden");
    this.chaseIntroOverlay.classList.add("hidden");
    this.loadingOverlay.classList.add("hidden");
    this.controlsOverlay.classList.add("hidden");
    this.settingsOverlay.classList.add("hidden");
    this.pauseOverlay.classList.add("hidden");
    this.resultOverlay.classList.add("hidden");
    this.updateMenu();
    this.syncSettingsControls();
  }

  showStartGuide() {
    this.disclaimerOverlay.classList.add("hidden");
    this.menuOverlay.classList.add("hidden");
    this.startGuideOverlay.classList.remove("hidden");
    this.chaseIntroOverlay.classList.add("hidden");
    this.loadingOverlay.classList.add("hidden");
    this.controlsOverlay.classList.add("hidden");
    this.settingsOverlay.classList.add("hidden");
    this.pauseOverlay.classList.add("hidden");
    this.resultOverlay.classList.add("hidden");
  }

  hideAll() {
    this.disclaimerOverlay.classList.add("hidden");
    this.menuOverlay.classList.add("hidden");
    this.startGuideOverlay.classList.add("hidden");
    this.chaseIntroOverlay.classList.add("hidden");
    this.loadingOverlay.classList.add("hidden");
    this.controlsOverlay.classList.add("hidden");
    this.settingsOverlay.classList.add("hidden");
    this.pauseOverlay.classList.add("hidden");
    this.resultOverlay.classList.add("hidden");
  }

  showChaseIntro() {
    this.disclaimerOverlay.classList.add("hidden");
    this.menuOverlay.classList.add("hidden");
    this.startGuideOverlay.classList.add("hidden");
    this.loadingOverlay.classList.add("hidden");
    this.controlsOverlay.classList.add("hidden");
    this.settingsOverlay.classList.add("hidden");
    this.pauseOverlay.classList.add("hidden");
    this.resultOverlay.classList.add("hidden");
    this.chaseIntroOverlay.classList.remove("hidden");
    this.updateScreenControls();
  }

  showShop() {
    this.menuOverlay.classList.add("hidden");
    this.settingsOverlay.classList.add("hidden");
    this.controlsOverlay.classList.remove("hidden");
    this.updateShop();
  }

  showLoading(levelLabel = "") {
    this.disclaimerOverlay.classList.add("hidden");
    this.menuOverlay.classList.add("hidden");
    this.startGuideOverlay.classList.add("hidden");
    this.chaseIntroOverlay.classList.add("hidden");
    this.controlsOverlay.classList.add("hidden");
    this.settingsOverlay.classList.add("hidden");
    this.pauseOverlay.classList.add("hidden");
    this.resultOverlay.classList.add("hidden");
    this.loadingTitle.textContent = levelLabel ? `Ładowanie ${levelLabel}` : "Ładowanie poziomu";
    this.loadingDetails.textContent = "Przygotowywanie assetów...";
    this.loadingBarFill.style.width = "0%";
    this.loadingOverlay.classList.remove("hidden");
  }

  updateLoading(progress, done, total) {
    const pct = Math.round(clamp(progress, 0, 1) * 100);
    this.loadingBarFill.style.width = `${pct}%`;
    this.loadingDetails.textContent = total ? `Assety poziomu: ${done}/${total}` : "Gotowe.";
  }

  showSettings() {
    this.menuOverlay.classList.add("hidden");
    this.controlsOverlay.classList.add("hidden");
    this.settingsOverlay.classList.remove("hidden");
    this.syncSettingsControls();
  }

  showPause(show) {
    this.pauseOverlay.classList.toggle("hidden", !show);
  }

  showResult(title, details, nextEnabled = true) {
    this.resultTitle.textContent = title;
    this.resultDetails.innerHTML = details;
    document.getElementById("nextLevelButton").style.display = nextEnabled ? "block" : "none";
    this.resultOverlay.classList.remove("hidden");
  }

  render(ctx) {
    const game = this.game;
    const kcal = game.hunger.value;
    const mobileHud = game.isTouchHud();
    const barW = mobileHud ? Math.min(188, Math.max(150, game.canvas.width * 0.42)) : 300;
    const barH = mobileHud ? 22 : 26;
    const x = mobileHud ? 14 : 24;
    const y = mobileHud ? 27 : 32;
    const ratio = kcal / CONFIG.hunger.max;
    const lowPulse = ratio < 0.25 ? 0.7 + Math.sin(game.time * 12) * 0.3 : 1;
    const kcalColor = ratio > 0.6 ? "#5fd068" : ratio > 0.3 ? "#ffd166" : `rgba(239, 71, 111, ${lowPulse})`;

    ctx.save();
    ctx.fillStyle = "rgba(15, 18, 22, 0.66)";
    ctx.fillRect(0, 0, game.canvas.width, mobileHud ? 70 : 82);
    ctx.fillStyle = "#f4f0df";
    ctx.fillStyle = "#2e323a";
    ctx.fillRect(x, y - 15, barW, barH);
    ctx.fillStyle = kcalColor;
    ctx.fillRect(x, y - 15, barW * ratio, barH);
    ctx.strokeStyle = "#f4f0df";
    ctx.strokeRect(x, y - 15, barW, barH);
    ctx.fillStyle = "#201900";
    ctx.font = canvasFont(800, mobileHud ? 17 : 21);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${Math.ceil(kcal)} kcal`, x + barW / 2, y - 15 + barH / 2 + 1);
    ctx.textBaseline = "alphabetic";

    ctx.fillStyle = "#f4f0df";
    ctx.textAlign = "left";
    if (mobileHud) {
      const secondY = 56;
      this.drawLifeIcon(ctx, x, secondY - 15, 20);
      ctx.font = canvasFont(800, 14);
      ctx.fillText(`x ${game.player.lives}`, x + 26, secondY);
      ctx.fillText(`POZIOM: ${game.currentLevel.label}`, x + 82, secondY);
      const eatenX = Math.min(game.canvas.width - 166, x + 214);
      ctx.fillText(`ZJEDZONE: ${game.consumedKcal} kcal`, eatenX, secondY);
    } else {
      ctx.font = canvasFont(700, 20);
      this.drawLifeIcon(ctx, 360, y - 21, 24);
      ctx.fillText(`x ${game.player.lives}`, 392, y);
      ctx.fillText(`Czas: ${formatTime(game.timer.time)}`, 470, y);
      ctx.fillText(`${game.currentLevel.label}`, 610, y);
      ctx.fillText(`Zjedzone: ${game.consumedKcal} kcal`, 690, y);
      ctx.font = canvasFont(700, 17);
      ctx.fillText(game.currentLevel.world, 24, 66);
      ctx.fillText(`Best: ${formatTime(SaveSystem.getBestTime(false))}`, 360, 66);
      ctx.fillText(`Pyszności: ${game.collectedCount}`, 535, 66);
    }
    ctx.restore();
  }

  drawLifeIcon(ctx, x, y, size) {
    const heart = UI_IMAGES.get("live");
    if (heart) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(heart, x, y, size, size);
      ctx.restore();
      return;
    }
    ctx.fillStyle = "#ef476f";
    ctx.beginPath();
    ctx.moveTo(x + size / 2, y + size);
    ctx.bezierCurveTo(x - size * 0.2, y + size * 0.55, x, y, x + size * 0.38, y + size * 0.25);
    ctx.bezierCurveTo(x + size * 0.5, y, x + size * 0.92, y, x + size, y + size * 0.25);
    ctx.bezierCurveTo(x + size * 1.15, y + size * 0.62, x + size * 0.62, y + size * 0.85, x + size / 2, y + size);
    ctx.fill();
  }
}

class GameManager {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.input = new InputManager();
    this.sprites = new SpriteLoader();
    this.camera = new CameraSystem(this.canvas);
    this.levelAssets = new LevelAssetManager();
    this.player = new PlayerController(this);
    this.hunger = new HungerSystem(this);
    this.timer = new SpeedrunTimer();
    this.audio = new AudioManager();
    this.speedrunMode = false;
    this.touchControlsMode = this.loadTouchControlsMode();
    this.skinShop = new SkinShop(this);
    this.ui = new UIManager(this);
    this.mobileControls = new MobileControls(this);
    this.levelGenerator = new ProceduralLevelGenerator();
    this.levelIndex = 0;
    this.levelNumber = 1;
    this.currentLevel = getCampaignLevel(this.levelIndex);
    this.level = this.levelGenerator.generate(1, false, this.currentLevel);
    this.busRide = null;
    this.trainRide = null;
    this.state = "menu";
    this.startGuideSeen = false;
    this.unlimitedLives = false;
    this.skipLevelCheat = false;
    this.collectedCount = 0;
    this.consumedKcal = 0;
    this.nextExtraLifeKcal = 15000;
    this.floatingTexts = [];
    this.projectiles = [];
    this.finishWarningCooldown = 0;
    this.dimAlpha = 0;
    this.dimTarget = 0;
    this.sceneFreezeTime = null;
    this.lastTime = 0;
    this.time = 0;
    this.dt = 0;

    this.bindControls();
    this.resize();
    window.addEventListener("resize", () => this.resize());
    document.addEventListener("fullscreenchange", () => this.resize());
    document.addEventListener("webkitfullscreenchange", () => this.resize());
    const coarsePointerQuery = window.matchMedia ? window.matchMedia("(pointer: coarse)") : null;
    coarsePointerQuery?.addEventListener?.("change", () => this.updateTouchControlsVisibility());

    this.sprites.load(this.selectedSkinId);
    loadCollectibleImages();
    loadEnemyImages();
    loadUiImages();
    document.fonts?.load(`12px ${GAME_FONT}`).catch(() => {});
    requestAnimationFrame((now) => this.loop(now));
  }

  bindControls() {
    this.input.bind("Escape", () => {
      if (this.state === "playing") this.pause();
      else if (this.state === "paused") this.resume();
    });
    this.input.bind("KeyR", () => {
      if (["playing", "paused", "complete", "gameover"].includes(this.state)) this.restartLevel();
    });
    this.input.bind("KeyO", () => {
      if (this.skipLevelCheat && this.state === "playing") this.skipLevel();
    });
  }

  resize() {
    const box = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.max(320, Math.floor(box.width));
    this.canvas.height = Math.max(320, Math.floor(box.height));
    this.updateTouchControlsVisibility();
  }

  getFullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  }

  toggleFullscreen() {
    const target = document.querySelector(".game-shell") || this.canvas;
    const current = this.getFullscreenElement();
    if (current || target.classList.contains("is-faux-fullscreen")) {
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (current) exit?.call(document);
      target.classList.remove("is-faux-fullscreen");
      this.resize();
      return;
    }

    const request = target.requestFullscreen || target.webkitRequestFullscreen;
    if (!request) {
      target.classList.add("is-faux-fullscreen");
      this.resize();
      return;
    }
    request.call(target)?.catch?.(() => {
      target.classList.add("is-faux-fullscreen");
      this.resize();
    });
  }

  loadTouchControlsMode() {
    try {
      const raw = localStorage.getItem("odysejaWolbromska.touchControlsMode");
      return ["auto", "on", "off"].includes(raw) ? raw : "auto";
    } catch {
      return "auto";
    }
  }

  setTouchControlsMode(mode) {
    this.touchControlsMode = ["auto", "on", "off"].includes(mode) ? mode : "auto";
    try {
      localStorage.setItem("odysejaWolbromska.touchControlsMode", this.touchControlsMode);
    } catch {
      // Local file storage can be unavailable; the setting still applies this session.
    }
    this.updateTouchControlsVisibility();
  }

  addSkinWalletKcal(amount) {
    this.skinShop.addWalletKcal(amount);
  }

  async handleSkinShopAction(skinId) {
    return this.skinShop.handleAction(skinId);
  }

  shouldShowTouchControls() {
    if (this.touchControlsMode === "on") return true;
    if (this.touchControlsMode === "off") return false;
    return detectTouchDevice();
  }

  updateTouchControlsVisibility() {
    const stateAllowsControls = this.state === "playing";
    this.mobileControls?.setVisible(stateAllowsControls && this.shouldShowTouchControls());
    this.ui?.updateScreenControls();
  }

  isTouchHud() {
    return this.canvas.width <= 700 || (this.shouldShowTouchControls() && detectTouchDevice());
  }

  async startGame() {
    this.levelIndex = 0;
    this.levelNumber = 1;
    this.currentLevel = getCampaignLevel(this.levelIndex);
    this.collectedCount = 0;
    this.consumedKcal = 0;
    this.nextExtraLifeKcal = 15000;
    this.player.clearOzempicStatus(false);
    this.state = "loading";
    this.ui.showLoading(`${this.currentLevel.world} ${this.currentLevel.label}`);
    this.generateLevel();
    await this.loadCurrentLevelAssets();
    this.player.reset();
    this.hunger.reset();
    this.timer.reset();
    this.dimAlpha = 0;
    this.dimTarget = 0;
    this.sceneFreezeTime = null;
    if (this.currentLevel.twinkChase) {
      this.state = "chaseintro";
      this.ui.showChaseIntro();
      return;
    }
    this.beginLoadedLevel();
  }

  generateLevel() {
    this.currentLevel = getCampaignLevel(this.levelIndex);
    this.levelNumber = this.levelIndex + 1;
    if (this.currentLevel.requiresCompletedLevel && !SaveSystem.hasCompletedLevel(this.currentLevel.requiresCompletedLevel)) {
      this.state = "complete";
      this.ui.showResult("Poziom zablokowany", "Najpierw ukończ poziom 2-4.", false);
      return;
    }
    if (this.currentLevel.mode === "busRide") {
      this.level = {
        width: this.currentLevel.length,
        platforms: [],
        collectibles: [],
        enemies: [],
        details: [],
        backdrops: [],
        checkpoints: [],
        finish: { x: this.currentLevel.length, y: CONFIG.groundY - 120, w: 80, h: 120 },
        spawn: { x: 82, y: CONFIG.groundY - this.player.h }
      };
      this.busRide = new BusRideLevelSystem(this.currentLevel, this.canvas);
      this.trainRide = null;
      this.camera.x = 0;
      this.camera.y = 0;
      this.floatingTexts = [];
      this.projectiles = [];
      this.finishWarningCooldown = 0;
      this.dimAlpha = 0;
      this.dimTarget = 0;
      this.sceneFreezeTime = null;
      return;
    }
    if (this.currentLevel.mode === "trainRide") {
      this.level = {
        width: this.currentLevel.length,
        platforms: [],
        collectibles: [],
        enemies: [],
        checkpoints: [],
        details: [],
        decorativeBuildings: [],
        finish: { x: this.currentLevel.length - 120, y: CONFIG.groundY - 120, w: 42, h: 120 },
        spawn: { x: 82, y: CONFIG.groundY - this.player.h }
      };
      this.trainRide = new TrainRideLevelSystem(this.currentLevel, this.canvas);
      this.busRide = null;
      this.camera.x = 0;
      this.camera.y = 0;
      this.floatingTexts = [];
      this.projectiles = [];
      this.finishWarningCooldown = 0;
      this.dimAlpha = 0;
      this.dimTarget = 0;
      this.sceneFreezeTime = null;
      return;
    }
    this.busRide = null;
    this.trainRide = null;
    this.levelGenerator = new ProceduralLevelGenerator(Date.now() + this.levelNumber * 99991);
    this.level = this.levelGenerator.generate(this.levelNumber, this.speedrunMode, this.currentLevel);
    this.camera.x = 0;
    this.camera.y = 0;
    this.floatingTexts = [];
    this.projectiles = [];
    this.finishWarningCooldown = 0;
    this.dimAlpha = 0;
    this.dimTarget = 0;
    this.sceneFreezeTime = null;
    this.player.spawnX = this.level.spawn ? this.level.spawn.x : 82;
    this.player.spawnY = this.level.spawn ? this.level.spawn.y : CONFIG.groundY - this.player.h;
    this.player.spawnHeight = this.level.spawn ? CONFIG.player.drawHeight : this.player.h;
    this.player.checkpoint = { x: this.player.spawnX, y: this.player.spawnY, standingHeight: this.player.spawnHeight };
  }

  async nextLevel() {
    const nextIndex = getNextCampaignLevelIndex(this.levelIndex);
    const nextLevel = getCampaignLevel(nextIndex);
    if (nextLevel.requiresCompletedLevel && !SaveSystem.hasCompletedLevel(nextLevel.requiresCompletedLevel)) {
      this.ui.showResult("Poziom zablokowany", "Najpierw ukończ poziom 2-4.", false);
      return;
    }
    this.levelIndex = nextIndex;
    this.collectedCount = 0;
    this.currentLevel = getCampaignLevel(this.levelIndex);
    this.state = "loading";
    this.ui.showLoading(`${this.currentLevel.world} ${this.currentLevel.label}`);
    this.generateLevel();
    await this.loadCurrentLevelAssets();
    const lives = this.player.lives;
    this.player.reset();
    this.player.lives = lives;
    this.hunger.reset();
    this.timer.reset();
    this.dimAlpha = 0;
    this.dimTarget = 0;
    this.sceneFreezeTime = null;
    if (this.currentLevel.twinkChase) {
      this.state = "chaseintro";
      this.ui.showChaseIntro();
      return;
    }
    this.beginLoadedLevel();
  }

  skipLevel() {
    this.addFloatingText("Skip level!", this.player.x + this.player.w / 2, this.player.y - 42, "#ffd166");
    if (!hasNextCampaignLevel(this.levelIndex)) {
      this.completeLevel();
      return;
    }
    this.nextLevel();
  }

  async restartLevel() {
    this.collectedCount = 0;
    this.consumedKcal = 0;
    this.nextExtraLifeKcal = 15000;
    this.state = "loading";
    this.ui.showLoading(`${this.currentLevel.world} ${this.currentLevel.label}`);
    this.generateLevel();
    await this.loadCurrentLevelAssets();
    this.player.reset();
    this.hunger.reset();
    this.timer.reset();
    this.dimAlpha = 0;
    this.dimTarget = 0;
    this.sceneFreezeTime = null;
    if (this.currentLevel.twinkChase) {
      this.state = "chaseintro";
      this.ui.showChaseIntro();
      return;
    }
    this.beginLoadedLevel();
  }

  beginLoadedLevel() {
    this.state = "playing";
    this.ui.hideAll();
    this.timer.start();
    this.audio.playMusic(this.currentLevel.music || "levelLoop");
    this.updateTouchControlsVisibility();
  }

  async loadCurrentLevelAssets() {
    if (this.currentLevel.mode === "busRide" || this.currentLevel.mode === "trainRide") {
      this.ui.updateLoading(1, 0, 0);
      return;
    }
    await this.levelAssets.loadForLevel(this.level, (progress, done, total) => {
      this.ui.updateLoading(progress, done, total);
    });
  }

  returnToMenu() {
    this.state = "menu";
    this.timer.stop();
    this.audio.pauseMusic();
    this.dimAlpha = 0;
    this.dimTarget = 0;
    this.sceneFreezeTime = null;
    this.ui.showMenu();
  }

  pause() {
    this.state = "paused";
    this.timer.stop();
    this.audio.pauseMusic();
    this.ui.showPause(true);
    this.updateTouchControlsVisibility();
  }

  resume() {
    this.state = "playing";
    this.timer.start();
    this.audio.playMusic();
    this.ui.showPause(false);
    this.updateTouchControlsVisibility();
  }

  playerDie(fromPit) {
    if (this.state !== "playing") return;
    if (!this.unlimitedLives) this.player.lives -= 1;
    if (fromPit) this.addFloatingText("Przepaść!", this.player.x, this.player.y - 20, "#ef476f");
    this.audio.playEnemyDefeated();
    if (this.player.lives <= 0) {
      this.gameOver();
    } else {
      this.projectiles = [];
      this.player.respawnAtCheckpoint();
    }
  }

  gameOver(message = "NIE UDAŁO CI SIĘ DOTRZEĆ DO DUBAJU.") {
    this.state = "gameover";
    this.timer.stop();
    this.audio.pauseMusic();
    this.dimTarget = 0.82;
    this.sceneFreezeTime = this.time;
    this.ui.showResult(
      "Game Over",
      `${message}<br>Czas: ${formatTime(this.timer.time)}<br>Skonsumowane: ${this.consumedKcal} kcal<br>Pyszności: ${this.collectedCount}`,
      false
    );
  }

  checkExtraLifeReward() {
    while (this.consumedKcal >= this.nextExtraLifeKcal) {
      this.player.lives += 1;
      this.addFloatingText("+1 życie!", this.player.x + this.player.w / 2, this.player.y - 28, "#5fd068");
      this.nextExtraLifeKcal += 15000;
    }
  }

  completeLevel() {
    if (this.state !== "playing") return;
    this.state = "complete";
    this.timer.stop();
    this.audio.pauseMusic();
    this.dimTarget = 0.74;
    this.sceneFreezeTime = this.time;
    SaveSystem.markLevelCompleted(this.currentLevel.label);
    if (this.currentLevel.label === "2-4") SaveSystem.setHighestUnlockedLevel("3-1");
    if (this.currentLevel.label === "3-1") SaveSystem.setHighestUnlockedLevel("3-1B");
    if (this.currentLevel.label === "3-1B") SaveSystem.setHighestUnlockedLevel("3-1B");
    const bestBefore = SaveSystem.getBestTime(this.speedrunMode);
    const newRecord = SaveSystem.setBestTime(this.speedrunMode, this.timer.time);
    const bestAfter = SaveSystem.getBestTime(this.speedrunMode);
    const recordLine = newRecord && bestBefore ? "Pobito rekord!" : newRecord ? "Pierwszy rekord zapisany." : "Rekord bez zmian.";
    const hasNext = hasNextCampaignLevel(this.levelIndex);
    this.ui.showResult(
      "Poziom ukończony",
      `${this.currentLevel.world} ${this.currentLevel.label}<br>Czas: ${formatTime(this.timer.time)}<br>Najlepszy: ${formatTime(bestAfter)}<br>${recordLine}<br>Skonsumowane: ${this.consumedKcal} kcal<br>Pyszności: ${this.collectedCount}`,
      hasNext
    );
  }

  addFloatingText(text, x, y, color = "#fff7dd") {
    this.floatingTexts.push({ text, x, y, color, life: 1.05, vy: -34 });
  }

  loop(now) {
    const seconds = now / 1000;
    this.dt = Math.min(0.033, seconds - (this.lastTime || seconds));
    this.lastTime = seconds;
    this.time += this.dt;

    if (this.state === "playing") this.update(this.dt);
    this.dimAlpha = lerp(this.dimAlpha, this.dimTarget, 1 - Math.pow(0.0005, this.dt));
    this.updateTouchControlsVisibility();
    this.render();
    this.input.update(this.dt);
    requestAnimationFrame((next) => this.loop(next));
  }

  update(dt) {
    this.timer.update(dt);
    if (this.currentLevel.mode === "busRide" && this.busRide) {
      this.busRide.update(dt, this);
      return;
    }
    if (this.currentLevel.mode === "trainRide" && this.trainRide) {
      this.trainRide.update(dt, this);
      return;
    }
    this.player.update(dt);
    if (this.level.fixedCamera) {
      this.camera.x = 0;
      this.camera.y = 0;
    }
    else this.camera.update(dt, this.player, this.level.width);

    for (const item of this.level.collectibles) item.update(dt, this);
    this.level.collectibles = this.level.collectibles.filter((item) => !item.collected);

    for (const enemy of this.level.enemies) {
      enemy.update(dt, this);
      enemy.handlePlayerCollision(this);
    }
    this.level.enemies = this.level.enemies.filter((enemy) => !enemy.dead);

    for (const projectile of this.projectiles) projectile.update(dt, this);
    this.projectiles = this.projectiles.filter((projectile) => !projectile.dead);
    if (this.finishWarningCooldown > 0) this.finishWarningCooldown -= dt;
    if (this.level.bossFight) this.updateBossArena(dt);
    if (this.level.twinkChase) this.updateTwinkChase(dt);

    for (const checkpoint of this.level.checkpoints) {
      if (!checkpoint.active && Math.abs(this.player.x - checkpoint.x) < 44 && this.player.y < checkpoint.y + 110) {
        checkpoint.active = true;
        this.player.checkpoint = { x: checkpoint.x, y: checkpoint.y, standingHeight: CONFIG.player.drawHeight };
        this.addFloatingText("Checkpoint", checkpoint.x, checkpoint.y - 22, "#45d4ff");
      }
    }

    if (!this.level.twinkChase && rectsOverlap(this.player.bounds, this.level.finish)) {
      const bossAlive = this.level.boss && this.level.enemies.some((enemy) => enemy instanceof BossFlyingTrackerEnemy || enemy instanceof TestArenaBossEnemy);
      if (bossAlive) {
        if (this.finishWarningCooldown <= 0) {
          this.addFloatingText("Najpierw boss!", this.player.x, this.player.y - 30, "#ffd166");
          this.finishWarningCooldown = 0.8;
        }
      } else {
        this.completeLevel();
      }
    }

    for (const text of this.floatingTexts) {
      text.y += text.vy * dt;
      text.life -= dt;
    }
    this.floatingTexts = this.floatingTexts.filter((text) => text.life > 0);
  }

  updateBossArena(dt) {
    const bossAlive = this.level.enemies.some((enemy) => enemy instanceof TestArenaBossEnemy);
    if (!bossAlive) {
      this.completeLevel();
      return;
    }
    this.level.collectibleSpawnTimer = (this.level.collectibleSpawnTimer || 0) - dt;
    if (this.level.collectibleSpawnTimer > 0 || this.level.collectibles.length >= 4) return;

    const reachableSpots = [
      { x: 155, y: 330 },
      { x: 460, y: 292 },
      { x: 780, y: 320 },
      { x: 1030, y: 276 },
      { x: 180, y: CONFIG.groundY },
      { x: 610, y: CONFIG.groundY },
      { x: 1040, y: CONFIG.groundY }
    ];
    const spot = reachableSpots[Math.floor(Math.random() * reachableSpots.length)];
    const fancyPool = ["Lays Chips", "Delicje", "Energy Drink", "Kinder Bueno", "Schoko Bons"];
    if (Math.random() < 0.16) fancyPool.push("Kubełek KFC");
    const name = fancyPool[Math.floor(Math.random() * fancyPool.length)];
    const type = COLLECTIBLE_TYPES.find((item) => item.name === name) || COLLECTIBLE_TYPES[0];
    this.level.collectibles.push(new CollectibleItem(spot.x + Math.random() * 70, spot.y - 72 - Math.random() * 32, type));
    this.addFloatingText("KCAL DROP!", spot.x + 35, spot.y - 95, "#ffd166");
    this.level.collectibleSpawnTimer = 3.2 + Math.random() * 2.4;
  }

  updateTwinkChase(dt) {
    const twink = this.level.enemies.find((enemy) => enemy instanceof TwinkChaseTarget);
    if (!twink) return;
    this.levelGenerator.extendTwinkChase(this.level, this.player.x + this.canvas.width * 3.2, this.speedrunMode);

    const keepAfterX = Math.max(0, this.player.x - 900);
    const ground = this.level.platforms[0];
    this.level.platforms = [ground, ...this.level.platforms.slice(1).filter((platform) => platform.x + platform.w > keepAfterX)];
    this.level.details = this.level.details.filter((detail) => detail.x + detail.w > keepAfterX);
    this.level.collectibles = this.level.collectibles.filter((item) => !item.collected && item.x + item.w > keepAfterX);

    const lead = twink.x - this.player.x;
    if (lead > 900) {
      this.level.escapeWarningCooldown = (this.level.escapeWarningCooldown || 0) - dt;
      if (this.level.escapeWarningCooldown <= 0) {
        this.addFloatingText("UCIEKA!", this.player.x + this.player.w / 2, this.player.y - 38, "#ef476f");
        this.level.escapeWarningCooldown = 1.1;
      }
    }

    this.level.collectibleSpawnTimer = (this.level.collectibleSpawnTimer || 0) - dt;
    if (this.level.collectibleSpawnTimer > 0 || this.level.collectibles.length >= 5) return;
    const spawnX = this.player.x + this.canvas.width * this.levelGenerator.rand(0.52, 0.86);
    const spawnY = CONFIG.groundY - this.levelGenerator.rand(82, 132);
    this.levelGenerator.addSingleCollectible(this.level.collectibles, spawnX, spawnY, this.speedrunMode);
    this.level.collectibleSpawnTimer = this.levelGenerator.rand(3.4, 5.2);
  }

  render() {
    renderGameFrame(this);
  }

  renderDim(ctx) {
    renderDim(this, ctx);
  }

  renderBackground(ctx) {
    renderBackground(this, ctx);
  }

  renderParallaxRoad(ctx, theme) {
    renderParallaxRoad(this, ctx, theme);
  }

  renderBackdropLayer(ctx) {
    renderBackdropLayer(this, ctx);
  }

  drawAssetInBox(ctx, img, x, y, w, h) {
    drawAssetInBox(ctx, img, x, y, w, h);
  }

  renderWorld(ctx) {
    renderWorld(this, ctx);
  }

  renderDetails(ctx) {
    renderDetails(this, ctx);
  }

  renderPlatform(ctx, p) {
    renderPlatform(this, ctx, p);
  }

  renderCheckpoints(ctx) {
    renderCheckpoints(this, ctx);
  }

  renderFinish(ctx) {
    renderFinish(this, ctx);
  }

  renderFloatingTexts(ctx) {
    renderFloatingTexts(this, ctx);
  }
}

export { GameManager as Game };

