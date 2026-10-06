const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const WIDTH = 640;
const HEIGHT = 480;

// --- GESTION DU SON (Web Audio API) ---
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new AudioCtx();
  }
}

function playSound(type) {
  if (!audioCtx) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  const now = audioCtx.currentTime;

  if (type === 'shoot') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  } else if (type === 'hit') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(40, now + 0.08);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
    osc.start(now);
    osc.stop(now + 0.08);
  } else if (type === 'gem') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.setValueAtTime(900, now + 0.05);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  } else if (type === 'levelup') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(600, now + 0.15);
    osc.frequency.linearRampToValueAtTime(900, now + 0.3);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.3);
  } else if (type === 'ulti') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.4);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
    osc.start(now);
    osc.stop(now + 0.4);
  }
}

// --- ÉTAT DU JEU ---
let gameState = "MENU"; // MENU, JEU, BOUTIQUE, GAMEOVER
let selectedWeapon = "Epee";

const player = {
  x: WIDTH / 2,
  y: HEIGHT / 2,
  pvMax: 100,
  pv: 100,
  vitesse: 3.5,
  mulDegats: 1.0,
  cadence: 1.0,
  nbTirs: 1,
  gold: 50,
  level: 1,
  xp: 0,
  xpMax: 50,
  dirX: 1,
  dirY: 0,
  ulti: false,
  cdDash: 0,
  cdDashMax: 30,
  cdTir: 0
};

let vague = 1;
let highScore = localStorage.getItem('foret_highscore') || 0;

let monstres = [];
let projectiles = [];
let enemyProjectiles = [];
let gems = [];
let particles = [];
let popups = [];
let shakeTime = 0;
let blackHoleAnimation = null;

const keys = {};

window.addEventListener('keydown', e => { 
  initAudio();
  keys[e.key] = true; 
});
window.addEventListener('keyup', e => { keys[e.key] = false; });

// --- GRAPHISMES 3D ISOMÉTRIQUES ---

function drawGround3D() {
  ctx.fillStyle = '#228B22';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.strokeStyle = '#2eb82e';
  ctx.lineWidth = 1;
  for (let y = 0; y < HEIGHT; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }
}

function drawTree3D(x, y) {
  ctx.fillStyle = 'rgba(0, 40, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(x + 15, y + 50, 20, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#4a2f13';
  ctx.fillRect(x + 10, y + 20, 10, 30);
  ctx.fillStyle = '#654321';
  ctx.fillRect(x + 13, y + 20, 7, 30);

  ctx.fillStyle = '#005500';
  ctx.beginPath(); ctx.arc(x + 15, y + 15, 22, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#228B22';
  ctx.beginPath(); ctx.arc(x + 12, y + 10, 18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#32CD32';
  ctx.beginPath(); ctx.arc(x + 10, y + 5, 12, 0, Math.PI * 2); ctx.fill();
}

const trees = [
  {x: 60, y: 80}, {x: 500, y: 100}, 
  {x: 120, y: 320}, {x: 480, y: 350}
];

function drawEntity3D(x, y, w, h, color, darkColor, isBoss = false) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h, w / 2, h / 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = darkColor;
  ctx.fillRect(x, y + 5, w, h);

  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h - 3);

  if (isBoss) {
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(x + w / 4, y + h / 4, w / 2, h / 2);
  }
}

// --- PARTICULES & SCREEN SHAKE ---

function addParticles(x, y, color, count = 8) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 15 + Math.random() * 10,
      color: color
    });
  }
}

function triggerShake(duration = 10) {
  shakeTime = duration;
}

// --- LOGIQUE DU JEU ---

function spawnEnemies() {
  monstres = [];
  if (vague % 5 === 0) {
    let pvBoss = 350 + vague * 120;
    monstres.push({
      x: WIDTH / 2 - 25, y: 80,
      pv: pvBoss, pvMax: pvBoss,
      type: "BOSS", size: 50, speed: 1, cdAttaque: 0
    });
  } else {
    let count = 3 + vague * 2;
    let types = ["Gobelin"];
    if (vague >= 2) types.push("Squelette");
    if (vague >= 3) types.push("Orc");

    for (let i = 0; i < count; i++) {
      let t = types[Math.floor(Math.random() * types.length)];
      let size = t === "Orc" ? 28 : 20;
      let hp = t === "Gobelin" ? 20 : (t === "Orc" ? 55 : 30);
      monstres.push({
        x: Math.random() * (WIDTH - 60) + 30,
        y: Math.random() > 0.5 ? 40 : HEIGHT - 60,
        pv: hp + vague * 5,
        pvMax: hp + vague * 5,
        type: t, size: size,
        speed: t === "Gobelin" ? 2.2 : (t === "Orc" ? 1.2 : 1.5),
        cdAttaque: 0
      });
    }
  }
}

function shoot(dx, dy, degats, color) {
  playSound('shoot');

  let baseAngle = Math.atan2(dy, dx);
  let spreadAngle = 0.2; // Écart pour tirs multiples

  let startIdx = -(player.nbTirs - 1) / 2;

  for (let i = 0; i < player.nbTirs; i++) {
    let angle = baseAngle + (startIdx + i) * spreadAngle;
    projectiles.push({
      x: player.x + 10,
      y: player.y + 10,
      vx: Math.cos(angle) * 7,
      vy: Math.sin(angle) * 7,
      degats: degats * player.mulDegats,
      color: color,
      life: 45
    });
  }
}

function addXP(amount) {
  player.xp += amount;
  if (player.xp >= player.xpMax) {
    player.xp -= player.xpMax;
    player.level++;
    player.xpMax = Math.round(player.xpMax * 1.4);
    player.pv = Math.min(player.pvMax, player.pv + 25);
    playSound('levelup');
    popups.push({ text: "Niveau Supérieur !", x: player.x - 20, y: player.y - 25, life: 40, col: '#00FFFF' });
  }
}

function handleInput() {
  let speed = player.vitesse;
  if (keys['Shift'] && player.cdDash <= 0) {
    speed *= 2.5;
    player.cdDash = player.cdDashMax;
    addParticles(player.x + 10, player.y + 10, '#3388FF', 10);
  }

  let moveX = 0, moveY = 0;
  if (keys['ArrowLeft'] || keys['q'] || keys['Q']) moveX -= 1;
  if (keys['ArrowRight'] || keys['d'] || keys['D']) moveX += 1;
  if (keys['ArrowUp'] || keys['z'] || keys['Z']) moveY -= 1;
  if (keys['ArrowDown'] || keys['s'] || keys['S']) moveY += 1;

  if (moveX !== 0 || moveY !== 0) {
    player.x += moveX * speed;
    player.y += moveY * speed;
    player.dirX = moveX;
    player.dirY = moveY;
  }

  player.x = Math.max(10, Math.min(WIDTH - 30, player.x));
  player.y = Math.max(30, Math.min(HEIGHT - 40, player.y));

  // Tir continu
  if (keys[' '] && player.cdTir <= 0) {
    let dmg = selectedWeapon === "Epee" ? 25 : (selectedWeapon === "Arc" ? 18 : 15);
    let col = selectedWeapon === "Epee" ? '#00FFFF' : (selectedWeapon === "Arc" ? '#FFF' : '#FFA500');
    shoot(player.dirX, player.dirY, dmg, col);

    let baseCd = selectedWeapon === "Epee" ? 12 : (selectedWeapon === "Arc" ? 9 : 14);
    player.cdTir = Math.max(3, Math.round(baseCd / player.cadence));
  }

  // Ultime (Touche R)
  if ((keys['r'] || keys['R']) && player.ulti) {
    keys['r'] = keys['R'] = false;
    triggerUltimate();
  }

  // Boutique manuelle (Touche B)
  if (keys['b'] || keys['B']) {
    keys['b'] = keys['B'] = false;
    gameState = "BOUTIQUE";
  }
}

function triggerUltimate() {
  player.ulti = false;
  playSound('ulti');
  triggerShake(20);

  monstres.forEach(m => {
    m.pv = 0;
    gems.push({ x: m.x, y: m.y, val: m.type === "BOSS" ? 100 : 15 });
  });

  if (selectedWeapon === "Baton") {
    blackHoleAnimation = { radius: 10, maxRadius: 200 };
  }
}

function update() {
  if (gameState !== "JEU") return;

  handleInput();

  if (player.cdDash > 0) player.cdDash--;
  if (player.cdTir > 0) player.cdTir--;

  // Particules
  particles.forEach((p, i) => {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  });

  // Projectiles Joueur
  projectiles.forEach((p, index) => {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;

    monstres.forEach(m => {
      if (p.x > m.x && p.x < m.x + m.size && p.y > m.y && p.y < m.y + m.size) {
        m.pv -= p.degats;
        playSound('hit');
        addParticles(p.x, p.y, p.color, 4);
        popups.push({ text: "-" + Math.round(p.degats), x: m.x, y: m.y - 10, life: 20, col: '#FFD700' });
        p.life = 0;
      }
    });

    if (p.life <= 0) projectiles.splice(index, 1);
  });

  // Projectiles Ennemis (Squelettes)
  enemyProjectiles.forEach((ep, index) => {
    ep.x += ep.vx;
    ep.y += ep.vy;
    ep.life--;

    if (Math.abs(ep.x - (player.x + 10)) < 15 && Math.abs(ep.y - (player.y + 10)) < 15) {
      player.pv -= 10;
      triggerShake(8);
      playSound('hit');
      ep.life = 0;
      if (player.pv <= 0) checkGameOver();
    }

    if (ep.life <= 0) enemyProjectiles.splice(index, 1);
  });

  // Ramassage des Gemmes d'XP
  gems.forEach((g, i) => {
    let dist = Math.hypot((player.x + 10) - g.x, (player.y + 10) - g.y);
    if (dist < 25) {
      addXP(g.val);
      playSound('gem');
      gems.splice(i, 1);
    }
  });

  // Monstres
  monstres.forEach((m, index) => {
    if (m.pv <= 0) {
      player.gold += m.type === "BOSS" ? 100 : 15;
      gems.push({ x: m.x + m.size / 2, y: m.y + m.size / 2, val: m.type === "BOSS" ? 80 : 15 });
      addParticles(m.x + m.size / 2, m.y + m.size / 2, '#FF0000', 12);
      monstres.splice(index, 1);
      return;
    }

    let dx = player.x - m.x;
    let dy = player.y - m.y;
    let dist = Math.hypot(dx, dy);

    // Attaque à distance Squelette
    if (m.type === "Squelette") {
      m.cdAttaque = (m.cdAttaque || 0) + 1;
      if (dist > 120) {
        m.x += (dx / dist) * m.speed;
        m.y += (dy / dist) * m.speed;
      }
      if (m.cdAttaque > 100) {
        m.cdAttaque = 0;
        enemyProjectiles.push({
          x: m.x + 10, y: m.y + 10,
          vx: (dx / dist) * 4,
          vy: (dy / dist) * 4,
          life: 80
        });
      }
    } else {
      if (dist > 0) {
        m.x += (dx / dist) * m.speed;
        m.y += (dy / dist) * m.speed;
      }
    }

    if (dist < 20) {
      player.pv -= 0.4;
      triggerShake(3);
      if (player.pv <= 0) checkGameOver();
    }
  });

  // Fin de vague
  if (monstres.length === 0 && gems.length === 0) {
    vague++;
    gameState = "BOUTIQUE";
  }
}

function checkGameOver() {
  gameState = "GAMEOVER";
  if (vague - 1 > highScore) {
    highScore = vague - 1;
    localStorage.setItem('foret_highscore', highScore);
  }
}

// --- RENDU GLOBALE ---

function drawUI() {
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, WIDTH, 40);

  // Bar de vie
  ctx.fillStyle = '#555';
  ctx.fillRect(10, 8, 140, 14);
  ctx.fillStyle = '#00FF00';
  ctx.fillRect(10, 8, Math.max(0, (player.pv / player.pvMax) * 140), 14);

  // Barre d'XP
  ctx.fillStyle = '#333';
  ctx.fillRect(10, 24, 140, 8);
  ctx.fillStyle = '#00FFFF';
  ctx.fillRect(10, 24, Math.max(0, (player.xp / player.xpMax) * 140), 8);

  ctx.fillStyle = '#FFF';
  ctx.font = '11px sans-serif';
  ctx.fillText(`PV: ${Math.round(player.pv)} / ${player.pvMax}`, 15, 19);
  ctx.fillText(`Niv. ${player.level}`, 160, 22);

  ctx.fillText(`Vague: ${vague}`, 230, 22);
  ctx.fillStyle = '#FFD700';
  ctx.fillText(`Or: ${player.gold}g`, 320, 22);
  ctx.fillStyle = '#FFF';
  ctx.fillText(`Arme: ${selectedWeapon}`, 410, 22);

  // Dash Cooldown Indicator
  let dashPct = 1 - (player.cdDash / player.cdDashMax);
  ctx.fillStyle = dashPct >= 1 ? '#3388FF' : '#555';
  ctx.fillRect(540, 10, 80, 20);
  ctx.fillStyle = '#FFF';
  ctx.fillText("DASH", 565, 24);
}

function render() {
  ctx.save();

  if (shakeTime > 0) {
    ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
    shakeTime--;
  }

  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  if (gameState === "MENU") {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = '#4caf50';
    ctx.font = '28px bold sans-serif';
    ctx.fillText("FORÊT MAGIQUE 3D", 190, 90);

    ctx.fillStyle = '#FFF';
    ctx.font = '15px sans-serif';
    ctx.fillText("Choisissez votre arme pour démarrer :", 180, 160);

    ctx.fillText("1. Épée (Attaque Rapide)", 200, 210);
    ctx.fillText("2. Arc (Longue Portée)", 200, 250);
    ctx.fillText("3. Bâton de Mage (Trou Noir)", 200, 290);

    ctx.fillStyle = '#FFD700';
    ctx.fillText(`Meilleur Score : ${highScore} Vagues`, 210, 360);

    ctx.fillStyle = '#aaa';
    ctx.fillText("Appuyez sur (1, 2 ou 3) sur votre clavier", 180, 420);
    ctx.restore();
    return;
  }

  if (gameState === "BOUTIQUE") {
    ctx.fillStyle = 'rgba(0,0,0,0.88)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = '#FFD700';
    ctx.font = '22px sans-serif';
    ctx.fillText(`--- VAGUE ${vague - 1} TERMINÉE ! ---`, 180, 45);
    ctx.fillText(`Votre Or : ${player.gold}g`, 250, 80);

    ctx.fillStyle = '#FFF';
    ctx.font = '15px sans-serif';
    ctx.fillText("1. Soin +30 PV (20g)", 140, 130);
    ctx.fillText("2. +20 PV Max (40g)", 140, 170);
    ctx.fillText("3. +20% Dégâts (50g)", 140, 210);
    ctx.fillText("4. +25% Cadence de Tir (45g)", 140, 250);
    ctx.fillText(`5. Tir Multiple (+1 tir) [Max 3] (${player.nbTirs * 75}g)`, 140, 290);
    ctx.fillText("6. Débloquer Ultime (200g)", 140, 330);

    ctx.fillStyle = '#4caf50';
    ctx.font = '17px bold sans-serif';
    ctx.fillText("Appuyez sur [Entrée] ou [Espace] pour lancer la Vague " + vague, 80, 395);
    ctx.restore();
    return;
  }

  if (gameState === "GAMEOVER") {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#FF0000';
    ctx.font = '40px sans-serif';
    ctx.fillText("GAME OVER", 200, 190);
    ctx.fillStyle = '#FFF';
    ctx.font = '18px sans-serif';
    ctx.fillText(`Vous avez survécu à ${vague - 1} vagues`, 200, 250);
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`Meilleur Score : ${highScore} vagues`, 200, 290);
    ctx.restore();
    return;
  }

  // Terrain & Décor
  drawGround3D();
  trees.forEach(t => drawTree3D(t.x, t.y));

  // Gemmes d'XP au sol
  gems.forEach(g => {
    ctx.fillStyle = '#00FFFF';
    ctx.beginPath();
    ctx.arc(g.x, g.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // Particules
  particles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 3, 3);
  });

  // Joueur
  drawEntity3D(player.x, player.y, 20, 24, '#3388FF', '#0044AA');

  // Ennemis
  monstres.forEach(m => {
    let col = m.type === "Gobelin" ? '#32CD32' : (m.type === "Orc" ? '#FF4500' : (m.type === "Squelette" ? '#DDD' : '#8A2BE2'));
    let darkCol = m.type === "Gobelin" ? '#006400' : (m.type === "Orc" ? '#8B0000' : '#888');
    drawEntity3D(m.x, m.y, m.size, m.size, col, darkCol, m.type === "BOSS");
  });

  // Projectiles Joueur
  projectiles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // Projectiles Ennemis
  enemyProjectiles.forEach(ep => {
    ctx.fillStyle = '#FF0055';
    ctx.beginPath();
    ctx.arc(ep.x, ep.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // Popups de dégâts
  popups.forEach((p, i) => {
    ctx.fillStyle = p.col;
    ctx.font = '13px bold sans-serif';
    ctx.fillText(p.text, p.x, p.y);
    p.y -= 1;
    p.life--;
    if (p.life <= 0) popups.splice(i, 1);
  });

  // Trou Noir (Ultime)
  if (blackHoleAnimation) {
    ctx.fillStyle = 'rgba(75, 0, 130, 0.4)';
    ctx.beginPath();
    ctx.arc(player.x, player.y, blackHoleAnimation.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(player.x, player.y, blackHoleAnimation.radius * 0.6, 0, Math.PI * 2);
    ctx.fill();

    blackHoleAnimation.radius += 8;
    if (blackHoleAnimation.radius > blackHoleAnimation.maxRadius) {
      blackHoleAnimation = null;
    }
  }

  drawUI();
  ctx.restore();
}

// Entrées Menu / Boutique
window.addEventListener('keydown', e => {
  if (gameState === "MENU") {
    if (e.key === '1') { selectedWeapon = "Epee"; gameState = "JEU"; spawnEnemies(); }
    if (e.key === '2') { selectedWeapon = "Arc"; gameState = "JEU"; spawnEnemies(); }
    if (e.key === '3') { selectedWeapon = "Baton"; gameState = "JEU"; spawnEnemies(); }
  } else if (gameState === "BOUTIQUE") {
    if (e.key === '1' && player.gold >= 20) { player.gold -= 20; player.pv = Math.min(player.pvMax, player.pv + 30); }
    if (e.key === '2' && player.gold >= 40) { player.gold -= 40; player.pvMax += 20; player.pv += 20; }
    if (e.key === '3' && player.gold >= 50) { player.gold -= 50; player.mulDegats += 0.2; }
    if (e.key === '4' && player.gold >= 45) { player.gold -= 45; player.cadence += 0.25; }
    if (e.key === '5' && player.nbTirs < 3 && player.gold >= player.nbTirs * 75) {
      player.gold -= player.nbTirs * 75;
      player.nbTirs++;
    }
    if (e.key === '6' && player.gold >= 200) { player.gold -= 200; player.ulti = true; }

    if (e.key === 'Enter' || e.key === ' ') {
      gameState = "JEU";
      spawnEnemies();
    }
  }
});

// Boucle Principale
function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

gameLoop();