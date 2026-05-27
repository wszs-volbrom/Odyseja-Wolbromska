(function () {
  "use strict";

  const ODYSEJA_CONFIG = window.ODYSEJA_CONFIG;
  const ODYSEJA_UTILS = window.ODYSEJA_UTILS;
  if (!ODYSEJA_CONFIG || !ODYSEJA_UTILS) {
    throw new Error("Audio dependencies failed to load. Make sure config and utils are included before js/audio.runtime.js.");
  }

  const { AUDIO_ASSETS } = ODYSEJA_CONFIG;
  const { clamp } = ODYSEJA_UTILS;

class AudioManager {
  constructor() {
    this.musicVolume = this.loadVolume("music", 1);
    this.sfxVolume = this.loadVolume("sfx", 1);
    this.musicBaseVolume = 0.36;
    this.currentMusicSrc = AUDIO_ASSETS.musicBg.levelLoop;
    this.music = new Audio(this.currentMusicSrc);
    this.music.loop = true;
    this.applyMusicVolume();
    this.jumpPool = this.createPool(AUDIO_ASSETS.sfxEffects.jump, 5, 0.62);
    this.enemyHitPool = this.createPool(AUDIO_ASSETS.sfxEffects.enemyHit, 4, 0.62);
    this.enemyDefeatedPool = this.createPool(AUDIO_ASSETS.sfxEffects.enemyDefeated, 4, 0.68);
    this.collectiblePool = this.createPool(AUDIO_ASSETS.sfxEffects.collectible, 5, 0.58);
    this.hungerWarningPool = this.createPool(AUDIO_ASSETS.sfxEffects.hungerWarning, 2, 0.72);
    this.jumpIndex = 0;
    this.enemyHitIndex = 0;
    this.enemyDefeatedIndex = 0;
    this.collectibleIndex = 0;
    this.hungerWarningIndex = 0;
  }

  createPool(src, count, volume) {
    return Array.from({ length: count }, () => {
      const sound = new Audio(src);
      sound.baseVolume = volume;
      sound.volume = volume * this.sfxVolume;
      return sound;
    });
  }

  loadVolume(type, fallback) {
    try {
      const raw = localStorage.getItem(`odysejaWolbromska.volume.${type}`);
      return raw === null ? fallback : clamp(Number(raw), 0, 1);
    } catch {
      return fallback;
    }
  }

  saveVolume(type, value) {
    try {
      localStorage.setItem(`odysejaWolbromska.volume.${type}`, String(value));
    } catch {
      // Storage can be blocked for local files; volume still works for the current session.
    }
  }

  setMusicVolume(value) {
    this.musicVolume = clamp(value, 0, 1);
    this.applyMusicVolume();
    this.saveVolume("music", this.musicVolume);
  }

  setSfxVolume(value) {
    this.sfxVolume = clamp(value, 0, 1);
    this.updateSfxVolumes();
    this.saveVolume("sfx", this.sfxVolume);
  }

  applyMusicVolume() {
    this.music.volume = this.musicBaseVolume * this.musicVolume;
  }

  setMusicTrack(trackKey = "levelLoop") {
    const nextSrc = AUDIO_ASSETS.musicBg[trackKey] || AUDIO_ASSETS.musicBg.levelLoop;
    if (this.currentMusicSrc === nextSrc) return;
    const wasPlaying = !this.music.paused;
    this.music.pause();
    this.music.currentTime = 0;
    this.currentMusicSrc = nextSrc;
    this.music.src = nextSrc;
    this.music.loop = true;
    this.applyMusicVolume();
    if (wasPlaying) this.playMusic();
  }

  updateSfxVolumes() {
    const pools = [this.jumpPool, this.enemyHitPool, this.enemyDefeatedPool, this.collectiblePool, this.hungerWarningPool].filter(Boolean);
    pools.flat().forEach((sound) => {
      sound.volume = (sound.baseVolume || 1) * this.sfxVolume;
    });
  }

  playFromPool(pool, indexKey) {
    const sound = pool[this[indexKey]];
    this[indexKey] = (this[indexKey] + 1) % pool.length;
    sound.currentTime = 0;
    sound.play().catch(() => {});
  }

  playMusic(trackKey = null) {
    if (trackKey) this.setMusicTrack(trackKey);
    if (!this.music.paused) return;
    this.music.play().catch(() => {
      // Browser may block audio until the next direct user gesture.
    });
  }

  pauseMusic() {
    this.music.pause();
  }

  playJump() {
    this.playFromPool(this.jumpPool, "jumpIndex");
  }

  playEnemyHit() {
    this.playFromPool(this.enemyHitPool, "enemyHitIndex");
  }

  playEnemyDefeated() {
    this.playFromPool(this.enemyDefeatedPool, "enemyDefeatedIndex");
  }

  playCollectible() {
    this.playFromPool(this.collectiblePool, "collectibleIndex");
  }

  playHungerWarning() {
    this.playFromPool(this.hungerWarningPool, "hungerWarningIndex");
  }
}

  window.ODYSEJA_AUDIO = Object.freeze({
    AudioManager,
  });
})();