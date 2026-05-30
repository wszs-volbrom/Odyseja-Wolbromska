(function () {
  "use strict";

  const ODYSEJA_CONFIG = window.ODYSEJA_CONFIG;
  if (!ODYSEJA_CONFIG) {
    throw new Error("Save config failed to load. Make sure js/config.runtime.js is included before js/save.runtime.js.");
  }

  const { DEFAULT_SKIN_ID, INITIAL_SKIN_WALLET, PLAYER_SKINS } = ODYSEJA_CONFIG;

  class SaveSystem {
    static key(speedrun) {
      return speedrun ? "odysejaWolbromska.bestTime.speedrun" : "odysejaWolbromska.bestTime.casual";
    }

    static storageGet(key, fallback = null) {
      try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : raw;
      } catch {
        return fallback;
      }
    }

    static storageSet(key, value) {
      try {
        localStorage.setItem(key, String(value));
        return true;
      } catch {
        return false;
      }
    }

    static getBestTime(speedrun) {
      try {
        const raw = localStorage.getItem(SaveSystem.key(speedrun));
        return raw ? Number(raw) : null;
      } catch {
        return null;
      }
    }

    static setBestTime(speedrun, value) {
      const current = SaveSystem.getBestTime(speedrun);
      if (!current || value < current) {
        try {
          localStorage.setItem(SaveSystem.key(speedrun), String(value));
        } catch {
          return false;
        }
        return true;
      }
      return false;
    }

    static resetBestTime() {
      try {
        localStorage.removeItem(SaveSystem.key(true));
        localStorage.removeItem(SaveSystem.key(false));
      } catch {
        // Local files can block storage in some browsers; the game should still run.
      }
    }

    static getSkinWallet() {
      const raw = SaveSystem.storageGet("odysejaWolbromska.skinWallet", null);
      if (raw === null) {
        SaveSystem.storageSet("odysejaWolbromska.skinWallet", INITIAL_SKIN_WALLET);
        return INITIAL_SKIN_WALLET;
      }
      return Number.isFinite(Number(raw)) ? Number(raw) : INITIAL_SKIN_WALLET;
    }

    static setSkinWallet(value) {
      SaveSystem.storageSet("odysejaWolbromska.skinWallet", Math.max(0, Math.floor(value)));
    }

    static getSelectedSkin() {
      const id = SaveSystem.storageGet("odysejaWolbromska.selectedSkin", DEFAULT_SKIN_ID);
      return PLAYER_SKINS[id] ? id : DEFAULT_SKIN_ID;
    }

    static setSelectedSkin(id) {
      if (PLAYER_SKINS[id]) SaveSystem.storageSet("odysejaWolbromska.selectedSkin", id);
    }

    static getOwnedSkins() {
      const raw = SaveSystem.storageGet("odysejaWolbromska.ownedSkins", DEFAULT_SKIN_ID);
      const owned = new Set(String(raw).split(",").filter((id) => PLAYER_SKINS[id]));
      owned.add(DEFAULT_SKIN_ID);
      return owned;
    }

    static setOwnedSkins(owned) {
      const ids = [...owned].filter((id) => PLAYER_SKINS[id]);
      if (!ids.includes(DEFAULT_SKIN_ID)) ids.unshift(DEFAULT_SKIN_ID);
      SaveSystem.storageSet("odysejaWolbromska.ownedSkins", ids.join(","));
    }

    static getCompletedLevels() {
      const raw = SaveSystem.storageGet("odysejaWolbromska.completedLevels", "[]");
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.filter((label) => typeof label === "string");
      } catch {
        // Older or corrupted values should not block campaign progress reads.
      }
      return String(raw)
        .split(",")
        .map((label) => label.trim())
        .filter(Boolean);
    }

    static markLevelCompleted(label) {
      if (!label) return false;
      const completed = new Set(SaveSystem.getCompletedLevels());
      completed.add(label);
      return SaveSystem.storageSet("odysejaWolbromska.completedLevels", JSON.stringify([...completed]));
    }

    static hasCompletedLevel(label) {
      return SaveSystem.getCompletedLevels().includes(label);
    }

    static getHighestUnlockedLevel() {
      return SaveSystem.storageGet("odysejaWolbromska.highestUnlockedLevel", "1-1");
    }

    static setHighestUnlockedLevel(label) {
      if (!label) return false;
      return SaveSystem.storageSet("odysejaWolbromska.highestUnlockedLevel", label);
    }
  }

  window.ODYSEJA_SAVE = Object.freeze({
    SaveSystem,
  });
})();
