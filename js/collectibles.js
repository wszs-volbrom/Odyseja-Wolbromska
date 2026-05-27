import { COLLECTIBLE_IMAGES } from "./assets.js";
import { canvasFont, rectsOverlap } from "./utils.js";

export class CollectibleItem {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.w = 42;
    this.h = 42;
    this.type = type;
    this.collected = false;
    this.floatOffset = Math.random() * Math.PI * 2;
  }

  get bounds() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  update(dt, game) {
    if (this.collected) return;
    if (rectsOverlap(this.bounds, game.player.bounds)) {
      this.collected = true;
      game.hunger.add(this.type.hunger);
      game.collectedCount += 1;
      game.consumedKcal += this.type.hunger;
      game.addSkinWalletKcal(this.type.hunger);
      game.checkExtraLifeReward();
      if (this.type.speedBoost) game.player.speedBoost = this.type.speedBoost;
      game.player.registerOzempicSnack();
      const label = this.type.speedBoost ? `+${this.type.hunger} kcal +boost` : `+${this.type.hunger} kcal`;
      game.addFloatingText(label, this.x, this.y - 12, this.type.color);
      game.audio.playCollectible();
    }
  }

  render(ctx, camera, time) {
    if (this.collected) return;
    const bob = Math.sin(time * 4 + this.floatOffset) * 4;
    const x = Math.round(this.x - camera.x);
    const y = Math.round(this.y - camera.y + bob);
    ctx.save();
    const img = COLLECTIBLE_IMAGES.get(this.type.name);
    if (img) {
      const maxW = this.w + 14;
      const maxH = this.h + 14;
      const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
      const drawW = img.naturalWidth * scale;
      const drawH = img.naturalHeight * scale;
      ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 3;
      ctx.drawImage(img, x + this.w / 2 - drawW / 2, y + this.h / 2 - drawH / 2, drawW, drawH);
    } else {
      ctx.fillStyle = this.type.color;
      ctx.strokeStyle = "#2b2113";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, y, this.w, this.h, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#201900";
      ctx.font = canvasFont(700, 10);
      ctx.textAlign = "center";
      ctx.fillText(this.type.short, x + this.w / 2, y + 24);
    }
    ctx.restore();
  }
}
