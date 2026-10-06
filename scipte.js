document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const WIDTH = 640;
  const HEIGHT = 480;

  // --- AUDIO ---
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) audioCtx = new AudioCtx();
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
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.08);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'hit') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(40, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  }

  // --- ETAT DU JEU ---
  let gameState = "MENU";
  let selectedWeapon = "Epee";

  const player = {
    x: WIDTH / 2,
    y: HEIGHT / 2,
    pvMax: 100,
    pv: 100,
    bouclierMax: 0,
    bouclier: 0,
    vitesse: 3.5,
    mulDegats: 1.0,
    cadence: 1.0,
    rangeBonus: 0,
    omniTirNiveau: 0,
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

  const keys = {};

  window.addEventListener('keydown', e => {
    initAudio();
    keys[e.key] = true;

    if (gameState === "MENU") {
      if (e.key === '1') { selectedWeapon = "Epee"; startGame(); }
      if (e.key === '2') { selectedWeapon = "Arc"; startGame(); }
      if (e.key === '3') { selectedWeapon = "Baton"; startGame(); }
    } else if (gameState === "BOUTIQUE") {
      if (e.key === '1' && player.gold >= 20) { player.gold -= 20; player.pv = Math.min(player.pvMax, player.pv + 30); }
      if (e.key === '2' && player.gold >= 40) { player.gold -= 40; player.pvMax += 20; player.pv += 20; }
      if (e.key === '3' && player.gold >= 50) { player.gold -= 50; player.bouclierMax += 25; player.bouclier += 25; }
      if (e.key === '4' && player.gold >= 50) { player.gold -= 50; player.mulDegats += 0.2; }
      if (e.key === '5' && player.gold >= 45) { player.gold -= 45; player.cadence += 0.25; }
      if (e.key === '6' && player.gold >= 35) { player.gold -= 35; player.rangeBonus += 30; }
      if (e.key === '7') {
        if (player.omniTirNiveau === 0 && player.gold >= 100) { player.gold -= 100; player.omniTirNiveau = 1; }
        else if (player.omniTirNiveau === 1 && player.gold >= 200) { player.gold -= 200; player.omniTirNiveau = 2; }
      }
      if (e.key === '8' && player.gold >= 200) { player.gold -= 200; player.ulti = true; }

      if (e.key === 'Enter' || e.key === ' ') {
        gameState = "JEU";
        spawnEnemies();
      }
    }
  });

  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function startGame() {
    gameState = "JEU";
    vague = 1;
    player.pv = player.pvMax;
    player.x = WIDTH / 2;
    player.y = HEIGHT / 2;
    spawnEnemies();
  }

  function spawnEnemies() {
    monstres = [];
    let count = 3 + vague * 2;
    for (let i = 0; i < count; i++) {
      monstres.push({
        x: Math.random() * (WIDTH - 60) + 30,
        y: Math.random() > 0.5 ? 40 : HEIGHT - 60,
        pv: 20 + vague * 5,
        pvMax: 20 + vague * 5,
        type: "Gobelin",
        size: 20,
        speed: 2
      });
    }
  }

  function createSingleProjectile(dx, dy, degats, color) {
    let len = Math.hypot(dx, dy) || 1;
    projectiles.push({
      x: player.x + 10,
      y: player.y + 10,
      vx: (dx / len) * 7,
      vy: (dy / len) * 7,
      degats: degats * player.mulDegats,
      color: color,
      life: 45 + player.rangeBonus
    });
  }

  function shoot(dx, dy, degats, color) {
    playSound('shoot');
    if (player.omniTirNiveau === 1) {
      [[1,0], [-1,0], [0,1], [0,-1]].forEach(d => createSingleProjectile(d[0], d[1], degats, color));
    } else if (player.omniTirNiveau === 2) {
      [[1,0], [-1,0], [0,1], [0,-1], [0.707,0.707], [-0.707,0.707], [0.707,-0.707], [-0.707,-0.707]].forEach(d => createSingleProjectile(d[0], d[1], degats, color));
    } else {
      createSingleProjectile(dx, dy, degats, color);
    }
  }

  function handleInput() {
    let moveX = 0, moveY = 0;
    if (keys['ArrowLeft'] || keys['q'] || keys['Q']) moveX -= 1;
    if (keys['ArrowRight'] || keys['d'] || keys['D']) moveX += 1;
    if (keys['ArrowUp'] || keys['z'] || keys['Z']) moveY -= 1;
    if (keys['ArrowDown'] || keys['s'] || keys['S']) moveY += 1;

    if (moveX !== 0 || moveY !== 0) {
      player.x += moveX * player.vitesse;
      player.y += moveY * player.vitesse;
      player.dirX = moveX;
      player.dirY = moveY;
    }

    player.x = Math.max(10, Math.min(WIDTH - 30, player.x));
    player.y = Math.max(30, Math.min(HEIGHT - 40, player.y));

    if (keys[' '] && player.cdTir <= 0) {
      shoot(player.dirX, player.dirY, 25, '#00FFFF');
      player.cdTir = Math.max(3, Math.round(12 / player.cadence));
    }

    if (keys['b'] || keys['B']) {
      keys['b'] = keys['B'] = false;
      gameState = "BOUTIQUE";
    }
  }

  function update() {
    if (gameState !== "JEU") return;

    handleInput();
    if (player.cdTir > 0) player.cdTir--;

    projectiles.forEach((p, index) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      monstres.forEach(m => {
        if (p.x > m.x && p.x < m.x + m.size && p.y > m.y && p.y < m.y + m.size) {
          m.pv -= p.degats;
          playSound('hit');
          p.life = 0;
        }
      });
      if (p.life <= 0) projectiles.splice(index, 1);
    });

    monstres.forEach((m, index) => {
      if (m.pv <= 0) {
        player.gold += 15;
        monstres.splice(index, 1);
        return;
      }
      let dx = player.x - m.x;
      let dy = player.y - m.y;
      let dist = Math.hypot(dx, dy);
      if (dist > 0) {
        m.x += (dx / dist) * m.speed;
        m.y += (dy / dist) * m.speed;
      }
    });

    if (monstres.length === 0) {
      vague++;
      gameState = "BOUTIQUE";
    }
  }

  function render() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    if (gameState === "MENU") {
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      ctx.fillStyle = '#4caf50';
      ctx.font = '28px sans-serif';
      ctx.fillText("FORÊT MAGIQUE 3D", 190, 100);

      ctx.fillStyle = '#FFF';
      ctx.font = '16px sans-serif';
      ctx.fillText("Choisissez votre arme :", 220, 170);
      ctx.fillText("1. Épée", 250, 220);
      ctx.fillText("2. Arc", 250, 260);
      ctx.fillText("3. Bâton", 250, 300);

      ctx.fillStyle = '#aaa';
      ctx.font = '13px sans-serif';
      ctx.fillText("Appuyez sur 1, 2 ou 3 pour jouer", 210, 380);
      return;
    }

    if (gameState === "BOUTIQUE") {
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      ctx.fillStyle = '#FFD700';
      ctx.font = '20px sans-serif';
      ctx.fillText(`BOUTIQUE - Vague ${vague - 1} Terminée`, 160, 50);
      ctx.fillText(`Or : ${player.gold}g`, 260, 85);

      ctx.fillStyle = '#FFF';
      ctx.font = '14px sans-serif';
      ctx.fillText("1. Soin +30 PV (20g)", 120, 130);
      ctx.fillText("2. +20 PV Max (40g)", 120, 160);
      ctx.fillText("3. +25 Bouclier (50g)", 120, 190);
      ctx.fillText("4. +20% Dégâts (50g)", 120, 220);
      ctx.fillText("5. +25% Vitesse d'Attaque (45g)", 120, 250);
      ctx.fillText("6. +30 Range (35g)", 120, 280);

      let omni = player.omniTirNiveau === 0 ? "7. Tir 4 Dirs (100g)" :
                 (player.omniTirNiveau === 1 ? "7. Tir 8 Dirs (200g)" : "7. Tir Omnidirectionnel MAX");
      ctx.fillText(omni, 120, 310);

      ctx.fillStyle = '#4caf50';
      ctx.fillText("Appuyez sur [Entrée] ou [Espace] pour la suite", 140, 380);
      return;
    }

    // Terrain
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Joueur
    ctx.fillStyle = '#00FFFF';
    ctx.fillRect(player.x, player.y, 20, 20);

    // Monstres
    ctx.fillStyle = '#FF0000';
    monstres.forEach(m => ctx.fillRect(m.x, m.y, m.size, m.size));

    // Projectiles
    ctx.fillStyle = '#FFFF00';
    projectiles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // HUD
    ctx.fillStyle = '#FFF';
    ctx.font = '12px sans-serif';
    ctx.fillText(`PV: ${player.pv}`, 10, 20);
    ctx.fillText(`Or: ${player.gold}g`, 80, 20);
    ctx.fillText(`Vague: ${vague}`, 150, 20);
  }

  function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
  }

  gameLoop();
});