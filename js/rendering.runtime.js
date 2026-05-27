(function () {
  "use strict";

  const ODYSEJA_CONFIG = window.ODYSEJA_CONFIG;
  const ODYSEJA_UTILS = window.ODYSEJA_UTILS;
  if (!ODYSEJA_CONFIG || !ODYSEJA_UTILS) {
    throw new Error("Rendering helpers failed to load. Make sure config/runtime utils are included before js/rendering.runtime.js.");
  }

  const { CONFIG, THEME_PALETTES } = ODYSEJA_CONFIG;
  const { clamp, canvasFont } = ODYSEJA_UTILS;
  function renderGameFrame(game) {
      const ctx = game.ctx;
      const renderTime = game.sceneFreezeTime ?? game.time;
      ctx.clearRect(0, 0, game.canvas.width, game.canvas.height);
      game.renderBackground(ctx);
      game.renderWorld(ctx);
      game.level.collectibles.forEach((item) => item.render(ctx, game.camera, renderTime));
      game.level.enemies.forEach((enemy) => enemy.render(ctx, game.camera));
      game.projectiles.forEach((projectile) => projectile.render(ctx, game.camera));
      game.player.render(ctx, game.camera, game.sprites, renderTime);
      game.renderFloatingTexts(ctx);
      game.ui.render(ctx);
      game.renderDim(ctx);
    }
  
  function renderDim(game, ctx) {
      if (game.dimAlpha <= 0.01) return;
      ctx.save();
      ctx.fillStyle = `rgba(0, 0, 0, ${game.dimAlpha})`;
      ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
      ctx.restore();
    }
  
  function renderBackground(game, ctx) {
      const w = game.canvas.width;
      const h = game.canvas.height;
      const cam = game.camera.x;
      const theme = game.currentLevel ? game.currentLevel.theme : "center";
      const palette = THEME_PALETTES[theme] || THEME_PALETTES.center;
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, palette.skyTop);
      sky.addColorStop(0.65, palette.skyMid);
      sky.addColorStop(1, palette.skyBottom);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);
  
      if (theme === "bossfight") {
        ctx.fillStyle = "rgba(255, 209, 102, 0.16)";
        for (let x = 0; x < w; x += 92) {
          ctx.fillRect(x, 96, 44, 310);
        }
        ctx.fillStyle = "rgba(239, 71, 111, 0.26)";
        ctx.fillRect(0, 118, w, 8);
        ctx.fillRect(0, 372, w, 10);
        ctx.fillStyle = "#ffd166";
        ctx.font = canvasFont(900, 24);
        ctx.textAlign = "center";
        ctx.fillText("TEST BOSS FIGHT", w / 2, 178);
        ctx.font = canvasFont(800, 9);
        ctx.fillText("STOMP THE BOSS - SURVIVE THE TEST ATTACKS", w / 2, 204);
        return;
      }
  
      const hasGeneratedBackdrops = (theme === "suburbs" || theme === "centerNight")
        && game.level
        && game.level.backdrops
        && game.level.backdrops.length;
      if (hasGeneratedBackdrops) game.renderBackdropLayer(ctx);
  
      ctx.fillStyle = palette.far;
      const farStep = theme === "suburbs" ? 230 : 260;
      if (!hasGeneratedBackdrops) {
        for (let x = -((cam * 0.18) % farStep); x < w + farStep; x += farStep) {
          const bx = Math.round(x);
          if (theme === "suburbs") {
            ctx.fillRect(bx + 18, 285, 132, 82);
            ctx.beginPath();
            ctx.moveTo(bx + 4, 285);
            ctx.lineTo(bx + 84, 224);
            ctx.lineTo(bx + 164, 285);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = "rgba(255, 235, 171, 0.38)";
            ctx.fillRect(bx + 52, 310, 20, 22);
            ctx.fillRect(bx + 102, 310, 20, 22);
            ctx.fillStyle = palette.far;
          } else {
            const blockH = theme === "market" ? 190 : 260;
            ctx.fillRect(bx, 118 + (260 - blockH), 145, blockH);
            ctx.fillStyle = "rgba(230, 222, 163, 0.45)";
            for (let row = 0; row < 5; row += 1) {
              for (let col = 0; col < 3; col += 1) {
                ctx.fillRect(bx + 20 + col * 36, 146 + row * 38 + (260 - blockH), 18, 18);
              }
            }
            ctx.fillStyle = palette.far;
          }
        }
      }
  
      ctx.fillStyle = palette.near;
      for (let x = -((cam * 0.35) % 320); x < w + 320; x += 320) {
        ctx.fillRect(Math.round(x + 80), 345, 110, 42);
        ctx.fillRect(Math.round(x + 80), 330, 8, 68);
        ctx.fillRect(Math.round(x + 178), 330, 8, 68);
        ctx.fillStyle = theme === "suburbs" ? "#d7c16e" : "#e8c85f";
        ctx.fillRect(Math.round(x + 91), 352, 72, 16);
        ctx.fillStyle = palette.near;
      }
  
      game.renderParallaxRoad(ctx, theme);
    }
  
  function renderParallaxRoad(game, ctx, theme) {
      const w = game.canvas.width;
      const h = game.canvas.height;
      const groundY = Math.round(CONFIG.groundY - game.camera.y);
      const scroll = game.camera.x * 0.58;
      const slabW = theme === "suburbs" ? 86 : 74;
      const slabOffset = -((scroll) % slabW);
      const sidewalkY = groundY - 27;
      const sidewalkH = 34;
      const roadY = groundY + 18;
  
      ctx.save();
  
      const sidewalkBase = theme === "market" ? "#b7aa94" : theme === "blocks" ? "#9ea6a4" : "#a7b8ad";
      const sidewalkTop = theme === "market" ? "#d3c3a4" : "#c4d2c9";
      ctx.fillStyle = sidewalkBase;
      ctx.fillRect(0, sidewalkY, w, sidewalkH);
      ctx.fillStyle = sidewalkTop;
      ctx.fillRect(0, sidewalkY, w, 5);
      ctx.strokeStyle = "rgba(44, 55, 51, 0.38)";
      ctx.lineWidth = 1.5;
      for (let x = slabOffset - slabW; x < w + slabW; x += slabW) {
        const sx = Math.round(x);
        ctx.beginPath();
        ctx.moveTo(sx, sidewalkY + 5);
        ctx.lineTo(sx, sidewalkY + sidewalkH);
        ctx.stroke();
      }
  
      const roadGradient = ctx.createLinearGradient(0, roadY, 0, h);
      roadGradient.addColorStop(0, "rgba(34, 36, 34, 0.78)");
      roadGradient.addColorStop(1, "rgba(15, 15, 16, 0.86)");
      ctx.fillStyle = roadGradient;
      ctx.fillRect(0, roadY, w, Math.max(0, h - roadY));
      ctx.fillStyle = "rgba(185, 194, 179, 0.25)";
      ctx.fillRect(0, roadY, w, 3);
  
      ctx.restore();
    }
  
  function renderBackdropLayer(game, ctx) {
      for (const d of game.level.backdrops || []) {
        const parallax = d.parallax ?? 0.26;
        const x = Math.round(d.x - game.camera.x * parallax);
        if (x + d.w < -120 || x > game.canvas.width + 120) continue;
        const cloudBob = d.type && d.type.includes("cloud") ? Math.round(Math.sin(game.time * 0.75 + (d.phase || 0)) * 2) : 0;
        const y = Math.round(d.y - game.camera.y * 0.08 + cloudBob);
        const assetImage = d.assetPath ? game.levelAssets.getImage(d.assetPath) : null;
        ctx.save();
        ctx.globalAlpha = d.alpha ?? 0.68;
        if (d.type === "night-moon" || d.type === "sunset-sun") {
          const glowX = x + d.w / 2;
          const glowY = y + d.h / 2;
          const glow = ctx.createRadialGradient(glowX, glowY, 10, glowX, glowY, d.w * 1.35);
          if (d.type === "sunset-sun") {
            glow.addColorStop(0, "rgba(255, 207, 84, 0.48)");
            glow.addColorStop(0.45, "rgba(255, 150, 60, 0.22)");
            glow.addColorStop(1, "rgba(255, 150, 60, 0)");
          } else {
            glow.addColorStop(0, "rgba(255, 246, 190, 0.42)");
            glow.addColorStop(0.42, "rgba(255, 246, 190, 0.18)");
            glow.addColorStop(1, "rgba(255, 246, 190, 0)");
          }
          ctx.globalAlpha = 1;
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(glowX, glowY, d.w * 1.35, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = d.alpha ?? 0.92;
        }
        if (assetImage) {
          drawAssetInBox(ctx, assetImage, x, y, d.w, d.h);
        } else {
          ctx.fillStyle = d.type === "backdrop-tree" ? "#58745a" : "#889889";
          ctx.fillRect(x, y, d.w, d.h);
        }
        ctx.restore();
      }
    }
  
  function drawAssetInBox(ctx, img, x, y, w, h) {
      ctx.imageSmoothingEnabled = false;
      const scale = Math.min(w / img.width, h / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const drawX = x + (w - drawW) / 2;
      const drawY = y + h - drawH;
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    }
  
  function renderWorld(game, ctx) {
      game.renderDetails(ctx);
      for (const p of game.level.platforms) game.renderPlatform(ctx, p);
      game.renderCheckpoints(ctx);
      game.renderFinish(ctx);
    }
  
  function renderDetails(game, ctx) {
      for (const d of game.level.details) {
        const parallax = d.type === "tutorial" ? 1 : d.parallax ?? 0.84;
        const x = Math.round(d.x - game.camera.x * parallax);
        const y = Math.round(d.y - game.camera.y);
        if (d.type === "tutorial") {
          ctx.save();
          ctx.font = canvasFont(800, 22);
          const text = d.text || "";
          const padX = 18;
          const padY = 10;
          const boxW = Math.max(d.w || 0, Math.ceil(ctx.measureText(text).width + padX * 2));
          const boxH = Math.max(d.h || 0, 44, Math.ceil(22 + padY * 2));
          const boxX = Math.round(x + ((d.w || boxW) - boxW) / 2);
          if (boxX + boxW < -80 || boxX > game.canvas.width + 80) {
            ctx.restore();
            continue;
          }
          ctx.fillStyle = "rgba(15, 18, 22, 0.76)";
          ctx.fillRect(boxX, y, boxW, boxH);
          ctx.strokeStyle = "#ffd166";
          ctx.lineWidth = 2;
          ctx.strokeRect(boxX, y, boxW, boxH);
          ctx.fillStyle = "#ffd166";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.lineWidth = 4;
          ctx.strokeStyle = "#201900";
          ctx.strokeText(text, boxX + boxW / 2, y + boxH / 2 + 1);
          ctx.fillText(text, boxX + boxW / 2, y + boxH / 2 + 1);
          ctx.restore();
          continue;
        }
        if (x + d.w < -80 || x > game.canvas.width + 80) continue;
        const assetImage = d.assetPath ? game.levelAssets.getImage(d.assetPath) : null;
        if (assetImage) {
          ctx.save();
          drawAssetInBox(ctx, assetImage, x, y, d.w, d.h);
          ctx.restore();
          continue;
        }
        if (d.type === "house") {
          ctx.fillStyle = d.theme === "suburbs" ? "#c9b08c" : "#bda58c";
          ctx.fillRect(x, y + d.h * 0.28, d.w, d.h * 0.72);
          ctx.fillStyle = "#7c4a3c";
          ctx.beginPath();
          ctx.moveTo(x - 8, y + d.h * 0.3);
          ctx.lineTo(x + d.w / 2, y);
          ctx.lineTo(x + d.w + 8, y + d.h * 0.3);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#f0db8c";
          ctx.fillRect(x + 18, y + d.h * 0.45, 22, 18);
          ctx.fillRect(x + d.w - 42, y + d.h * 0.45, 22, 18);
          ctx.fillStyle = "#594032";
          ctx.fillRect(x + d.w / 2 - 10, y + d.h - 34, 20, 34);
        } else if (d.type === "stop") {
          ctx.fillStyle = "#2f343a";
          ctx.fillRect(x, y + d.h - 16, d.w, 16);
          ctx.fillStyle = "#4c5964";
          ctx.fillRect(x + 14, y, d.w - 28, d.h);
          ctx.fillStyle = "rgba(180, 220, 230, 0.65)";
          ctx.fillRect(x + 24, y + 12, d.w - 48, d.h - 34);
        } else if (d.type === "shop") {
          ctx.fillStyle = d.theme === "market" ? "#695f58" : "#58606b";
          ctx.fillRect(x, y, d.w, d.h);
          ctx.fillStyle = "#2f343a";
          ctx.fillRect(x, y + d.h - 42, d.w, 42);
          ctx.fillStyle = "rgba(178, 224, 229, 0.68)";
          ctx.fillRect(x + 10, y + d.h - 34, d.w - 20, 24);
          ctx.fillStyle = d.sign === "ŻABKA" ? "#2bbf58" : d.sign === "BIEDRONKA" ? "#d92e2e" : d.sign === "ROSSMANN" ? "#dfe7f7" : "#f7d774";
          ctx.fillRect(x + 8, y + 10, d.w - 16, 20);
        } else {
          ctx.fillStyle = "#565d65";
          ctx.fillRect(x, y, d.w, d.h);
          ctx.fillStyle = "#30353c";
          ctx.fillRect(x, y + d.h - 28, d.w, 28);
          ctx.fillStyle = "#e8d47b";
          for (let wx = x + 14; wx < x + d.w - 16; wx += 30) {
            for (let wy = y + 16; wy < y + d.h - 42; wy += 32) ctx.fillRect(wx, wy, 14, 13);
          }
        }
        ctx.fillStyle = d.type === "shop" ? "rgba(255,255,255,0)" : "#f7d774";
        if (d.type !== "shop") ctx.fillRect(x + 8, y + d.h - 22, d.w - 16, 16);
        ctx.fillStyle = "#26200c";
        ctx.font = canvasFont(700, 7);
        ctx.textAlign = "center";
        ctx.fillText(d.sign, x + d.w / 2, d.type === "shop" ? y + 24 : y + d.h - 10);
      }
    }
  
  function renderPlatform(game, ctx, p) {
      if (p.kind === "wall") return;
      const x = Math.round(p.x - game.camera.x);
      const y = Math.round(p.y - game.camera.y);
      const theme = game.currentLevel ? game.currentLevel.theme : "center";
      if (x + p.w < -80 || x > game.canvas.width + 80) return;
      if (p.kind === "floating") {
        ctx.fillStyle = theme === "suburbs" ? "#78806f" : "#7b817d";
        ctx.fillRect(x, y, p.w, p.h);
        ctx.fillStyle = theme === "market" ? "#d3b98f" : "#c7c1aa";
        for (let tx = x; tx < x + p.w; tx += 24) ctx.strokeRect(tx, y, 24, p.h);
        return;
      }
  
      if (p.kind === "chaseObstacle") {
        ctx.fillStyle = "#745347";
        ctx.fillRect(x, y, p.w, p.h);
        ctx.fillStyle = "#a77a57";
        ctx.fillRect(x + 4, y + 4, Math.max(4, p.w - 8), 8);
        ctx.strokeStyle = "#2e211d";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, p.w, p.h);
        ctx.fillStyle = "rgba(255,255,255,0.16)";
        ctx.fillRect(x + 6, y + 14, Math.max(4, p.w - 12), 3);
        return;
      }
  
      const isSuburbs = theme === "suburbs";
      const isMarket = theme === "market";
      const topColor = isSuburbs ? "#58c13c" : isMarket ? "#c7aa77" : "#9aa39a";
      const topEdge = isSuburbs ? "#8fe25f" : isMarket ? "#dec48f" : "#c0c8bd";
      const dirtColor = isSuburbs ? "#4b3628" : isMarket ? "#58483c" : "#4c4d47";
      const dirtShade = isSuburbs ? "#38291f" : isMarket ? "#44372e" : "#3a3c38";
      const brickColor = isSuburbs ? "rgba(35, 24, 18, 0.2)" : "rgba(0,0,0,0.16)";
  
      ctx.save();
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x, y, p.w, p.h, 12);
      } else {
        ctx.rect(x, y, p.w, p.h);
      }
      ctx.clip();
  
      const dirtGradient = ctx.createLinearGradient(0, y + 18, 0, y + p.h);
      dirtGradient.addColorStop(0, dirtColor);
      dirtGradient.addColorStop(1, dirtShade);
      ctx.fillStyle = dirtGradient;
      ctx.fillRect(x, y, p.w, p.h);
  
      ctx.fillStyle = topColor;
      ctx.fillRect(x, y, p.w, 20);
      ctx.fillStyle = topEdge;
      ctx.fillRect(x, y, p.w, 6);
  
      if (isSuburbs) {
        ctx.fillStyle = "#307c23";
        const grassStart = Math.floor((Math.max(-18, x) - x) / 18) * 18 + x;
        for (let gx = grassStart; gx < x + p.w + 18; gx += 18) {
          const bladeH = 5 + Math.abs(Math.floor((p.x + gx) % 9));
          ctx.fillRect(gx + 3, y + 15, 3, bladeH);
          ctx.fillRect(gx + 10, y + 13, 3, Math.max(4, bladeH - 2));
        }
        ctx.fillStyle = "#f6d34e";
        const flowerStart = Math.floor((Math.max(-130, x) - x) / 130) * 130 + x + 34;
        for (let fx = flowerStart; fx < x + p.w; fx += 130) {
          if (Math.abs(Math.floor((p.x + fx) / 130)) % 3 === 0) {
            ctx.fillRect(fx, y + 7, 3, 3);
            ctx.fillRect(fx + 2, y + 5, 3, 3);
          }
        }
      }
  
      ctx.strokeStyle = isSuburbs ? "rgba(28, 91, 24, 0.55)" : "#777b72";
      const tileStart = Math.floor((Math.max(-CONFIG.tile, x) - x) / CONFIG.tile) * CONFIG.tile + x;
      const tileEnd = Math.min(x + p.w, game.canvas.width + CONFIG.tile);
      for (let tx = tileStart; tx < tileEnd; tx += CONFIG.tile) {
        ctx.strokeRect(tx, y, CONFIG.tile, 20);
      }
  
      ctx.fillStyle = brickColor;
      const shadowStart = Math.floor((Math.max(-64, x + 12) - (x + 12)) / 64) * 64 + x + 12;
      for (let tx = shadowStart; tx < tileEnd; tx += 64) {
        ctx.fillRect(tx, y + 32, 30, 9);
        ctx.fillRect(tx + 42, y + 64, 22, 7);
      }
      ctx.restore();
  
      ctx.strokeStyle = isSuburbs ? "rgba(180, 242, 114, 0.65)" : "rgba(255,255,255,0.16)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y + 20);
      ctx.lineTo(x + p.w, y + 20);
      ctx.stroke();
    }
  
  function renderCheckpoints(game, ctx) {
      for (const cp of game.level.checkpoints) {
        const x = Math.round(cp.x - game.camera.x);
        const y = Math.round(cp.y - game.camera.y);
        ctx.fillStyle = cp.active ? "#45d4ff" : "#f7d774";
        ctx.fillRect(x, y, 8, 74);
        ctx.fillStyle = cp.active ? "#9df3ff" : "#d94545";
        ctx.beginPath();
        ctx.moveTo(x + 8, y + 4);
        ctx.lineTo(x + 54, y + 18);
        ctx.lineTo(x + 8, y + 34);
        ctx.closePath();
        ctx.fill();
      }
    }
  
  function renderFinish(game, ctx) {
      if (game.level.bossFight) return;
      const f = game.level.finish;
      const x = Math.round(f.x - game.camera.x);
      const y = Math.round(f.y - game.camera.y);
      ctx.fillStyle = "#2d2d2d";
      ctx.fillRect(x, y, 10, f.h);
      ctx.fillStyle = "#f7d774";
      ctx.beginPath();
      ctx.moveTo(x + 10, y + 8);
      ctx.lineTo(x + 74, y + 28);
      ctx.lineTo(x + 10, y + 50);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#251900";
      ctx.font = canvasFont(800, 10);
      ctx.fillText("META", x + 21, y + 33);
    }
  
  function renderFloatingTexts(game, ctx) {
      ctx.save();
      ctx.textAlign = "center";
      ctx.font = canvasFont(800, 11);
      for (const text of game.floatingTexts) {
        const x = Math.round(text.x - game.camera.x);
        const y = Math.round(text.y - game.camera.y);
        ctx.globalAlpha = clamp(text.life, 0, 1);
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillText(text.text, x + 1, y + 1);
        ctx.fillStyle = text.color;
        ctx.fillText(text.text, x, y);
      }
      ctx.restore();
    }
  
  window.ODYSEJA_RENDERING = Object.freeze({
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
  });
})();