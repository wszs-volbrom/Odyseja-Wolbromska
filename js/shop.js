import { DEFAULT_SKIN_ID, INITIAL_SKIN_WALLET, PLAYER_SKINS } from "./skins.js";
import { SaveSystem } from "./save.js";

void INITIAL_SKIN_WALLET;

export class SkinShop {
  constructor(game) {
    this.game = game;
    this.skinWalletLabel = null;
    this.skinShopGrid = null;
    this.afterAction = null;

    this.game.ownedSkins = SaveSystem.getOwnedSkins();
    this.game.selectedSkinId = SaveSystem.getSelectedSkin();
    if (!this.game.ownedSkins.has(this.game.selectedSkinId)) this.game.selectedSkinId = DEFAULT_SKIN_ID;
    this.game.skinWallet = SaveSystem.getSkinWallet();
  }

  connect({ walletLabel, shopGrid, afterAction = null } = {}) {
    this.skinWalletLabel = walletLabel || null;
    this.skinShopGrid = shopGrid || null;
    this.afterAction = afterAction;
    this.bindActions();
    this.update();
  }

  bindActions() {
    this.skinShopGrid?.querySelectorAll(".skin-action").forEach((button) => {
      if (button.dataset.skinShopBound === "true") return;
      button.dataset.skinShopBound = "true";
      button.addEventListener("click", async () => {
        await this.handleAction(button.dataset.skinId);
        this.update();
        this.afterAction?.();
      });
    });
  }

  update() {
    if (!this.skinWalletLabel || !this.skinShopGrid) return;
    this.skinWalletLabel.textContent = `Saldo: ${Math.floor(this.game.skinWallet)} kcal`;
    this.skinShopGrid.querySelectorAll(".skin-card").forEach((card) => {
      const id = card.dataset.skinId;
      const skin = PLAYER_SKINS[id];
      const owned = this.game.ownedSkins.has(id);
      const selected = this.game.selectedSkinId === id;
      const button = card.querySelector(".skin-action");
      card.classList.toggle("selected", selected);
      card.classList.toggle("locked", !owned);
      if (!button || !skin) return;
      if (selected) {
        button.textContent = "Wybrano";
        button.disabled = true;
      } else if (owned) {
        button.textContent = "Wybierz";
        button.disabled = false;
      } else {
        button.textContent = this.game.skinWallet >= skin.price ? `Kup za ${skin.price} kcal` : `Brakuje ${skin.price - this.game.skinWallet} kcal`;
        button.disabled = this.game.skinWallet < skin.price;
      }
    });
  }

  addWalletKcal(amount) {
    this.game.skinWallet = Math.floor(this.game.skinWallet + Math.max(0, amount));
    SaveSystem.setSkinWallet(this.game.skinWallet);
  }

  async handleAction(skinId) {
    const skin = PLAYER_SKINS[skinId];
    if (!skin) return false;

    if (!this.game.ownedSkins.has(skinId)) {
      if (this.game.skinWallet < skin.price) return false;
      this.game.skinWallet -= skin.price;
      this.game.ownedSkins.add(skinId);
      SaveSystem.setSkinWallet(this.game.skinWallet);
      SaveSystem.setOwnedSkins(this.game.ownedSkins);
    }

    this.game.selectedSkinId = skinId;
    SaveSystem.setSelectedSkin(skinId);
    await this.game.sprites.load(skinId);
    return true;
  }
}
