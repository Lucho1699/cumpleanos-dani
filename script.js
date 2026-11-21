/* =========================================================
   LÓGICA PRINCIPAL - PROYECTO CUMPLEAÑOS DANI
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  // 1. GESTOR DE AUDIO
  const audioPlim = document.getElementById('audio-plim');
  const audioAura = document.getElementById('audio-aura');
  const musicToggleBtn = document.getElementById('musicToggleBtn');
  const musicIcon = document.getElementById('musicIcon');
  const musicText = document.getElementById('musicText');
  let isMuted = false;
  let currentAudio = audioPlim;
  let hasUserInteracted = false;

  function safePlay(audioElem) {
    if (isMuted) return;
    const playPromise = audioElem.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        musicIcon.textContent = '🎵';
        musicText.textContent = 'Música: On';
        musicToggleBtn.style.opacity = '1';
      }).catch(err => {
        console.warn('El navegador espera interacción para reproducir:', err);
        // Si fue bloqueado, esperar al primer click en pantalla
        const enableAudioOnFirstClick = () => {
          if (!isMuted && currentAudio) {
            currentAudio.play().catch(e => console.log(e));
          }
          document.removeEventListener('click', enableAudioOnFirstClick);
          document.removeEventListener('touchstart', enableAudioOnFirstClick);
        };
        document.addEventListener('click', enableAudioOnFirstClick);
        document.addEventListener('touchstart', enableAudioOnFirstClick);
      });
    }
  }

  function playPlimMusic() {
    audioAura.pause();
    audioAura.currentTime = 0;
    currentAudio = audioPlim;
    safePlay(audioPlim);
  }

  function playAuraMusic() {
    audioPlim.pause();
    audioPlim.currentTime = 0;
    currentAudio = audioAura;
    safePlay(audioAura);
  }

  // Activar Plim Plim con el primer clic en la pantalla si el usuario no ha tocado Empezar aún
  const unlockAudioOnPageTouch = () => {
    if (!hasUserInteracted) {
      hasUserInteracted = true;
      if (screens.celebration && screens.celebration.classList.contains('active')) {
        playAuraMusic();
      } else {
        playPlimMusic();
      }
    }
    document.removeEventListener('pointerdown', unlockAudioOnPageTouch);
  };
  document.addEventListener('pointerdown', unlockAudioOnPageTouch);

  musicToggleBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    if (isMuted) {
      audioPlim.pause();
      audioAura.pause();
      musicIcon.textContent = '🔇';
      musicText.textContent = 'Música: Off';
      musicToggleBtn.style.opacity = '0.6';
    } else {
      currentAudio.play().catch(e => console.log(e));
      musicIcon.textContent = '🎵';
      musicText.textContent = 'Música: On';
      musicToggleBtn.style.opacity = '1';
    }
  });

  // GESTOR DE PANTALLAS
  const screens = {
    start: document.getElementById('screen-start'),
    level1: document.getElementById('screen-level1'),
    level2: document.getElementById('screen-level2'),
    level3: document.getElementById('screen-level3'),
    celebration: document.getElementById('screen-celebration')
  };

  function showScreen(screenKey) {
    Object.values(screens).forEach(s => {
      s.classList.remove('active');
      s.style.display = 'none';
    });
    const target = screens[screenKey];
    if (target) {
      target.style.display = 'flex';
      setTimeout(() => target.classList.add('active'), 10);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // DISPARAR CONFETI
  function triggerConfetti(particleRatio, opts) {
    if (typeof confetti === 'function') {
      confetti(Object.assign({}, {
        origin: { y: 0.7 },
        zIndex: 99999
      }, opts, {
        particleCount: Math.floor(200 * particleRatio)
      }));
    }
  }

  function megaExplosionConfetti() {
    triggerConfetti(0.25, { spread: 26, startVelocity: 55 });
    triggerConfetti(0.2, { spread: 60 });
    triggerConfetti(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    triggerConfetti(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    triggerConfetti(0.1, { spread: 120, startVelocity: 45 });
  }

  // -------------------------------------------------------------
  // PANTALLA START -> IR A NIVEL 1
  // -------------------------------------------------------------
  const btnStartGame = document.getElementById('btnStartGame');
  btnStartGame.addEventListener('click', () => {
    playPlimMusic();
    showScreen('level1');
    initPuzzleLevel();
  });


  // -------------------------------------------------------------
  // NIVEL 1: ROMPECABEZAS SLIDER 3x3 (TUNG TUNG SAHUR)
  // -------------------------------------------------------------
  const puzzleBoard = document.getElementById('puzzle-board');
  const puzzleMovesText = document.getElementById('puzzle-moves');
  const btnAutoSolvePuzzle = document.getElementById('btnAutoSolvePuzzle');

  let puzzleState = [0, 1, 2, 3, 4, 5, 6, 7, 8]; // 8 es el espacio vacío
  let puzzleMoves = 0;

  function renderPuzzle() {
    puzzleBoard.innerHTML = '';
    puzzleMovesText.textContent = `Movimientos: ${puzzleMoves}`;

    puzzleState.forEach((val, idx) => {
      const tile = document.createElement('div');
      tile.className = 'puzzle-tile';
      if (val === 8) {
        tile.classList.add('empty');
      } else {
        const origRow = Math.floor(val / 3);
        const origCol = val % 3;
        // 288px / 3 = 96px por pieza
        tile.style.backgroundPosition = `-${origCol * 96}px -${origRow * 96}px`;
        tile.textContent = val + 1;
        tile.addEventListener('click', () => moveTile(idx));
      }
      puzzleBoard.appendChild(tile);
    });
  }

  function moveTile(idx) {
    const emptyIdx = puzzleState.indexOf(8);
    const validMoves = [
      emptyIdx - 1, // izquierda
      emptyIdx + 1, // derecha
      emptyIdx - 3, // arriba
      emptyIdx + 3  // abajo
    ];

    // Restricciones de bordes
    const isAdjacent = (
      (Math.abs(emptyIdx - idx) === 3) ||
      (Math.abs(emptyIdx - idx) === 1 && Math.floor(emptyIdx / 3) === Math.floor(idx / 3))
    );

    if (isAdjacent) {
      // Intercambiar
      puzzleState[emptyIdx] = puzzleState[idx];
      puzzleState[idx] = 8;
      puzzleMoves++;
      renderPuzzle();
      checkPuzzleWin();
    }
  }

  function checkPuzzleWin() {
    const isWon = puzzleState.every((val, i) => val === i);
    if (isWon) {
      megaExplosionConfetti();
      setTimeout(() => {
        alert('🎉 ¡NIVEL 1 COMPLETADO! Has despertado a Tung Tung Sahur.');
        showScreen('level2');
        initNamesLevel();
      }, 500);
    }
  }

  function initPuzzleLevel() {
    puzzleMoves = 0;
    // Mezcla inicial garantizada de ser solvable
    puzzleState = [0, 1, 2, 3, 4, 8, 6, 7, 5]; // Solo a 2 movimientos de resolver
    renderPuzzle();
  }

  btnAutoSolvePuzzle.addEventListener('click', () => {
    puzzleState = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    renderPuzzle();
    checkPuzzleWin();
  });


  // -------------------------------------------------------------
  // NIVEL 2: COMPLETAR NOMBRES (TOP DE PERSONAS QUE TE QUIEREN)
  // -------------------------------------------------------------
  const squadNames = [
    { rank: 1, name: "Luchitto Diaz", hint: "El número 1 indiscutible y autor intelectual de esto 😎" },
    { rank: 2, name: "Sergei", hint: "El incondicional que siempre te saca risas" },
    { rank: 3, name: "Geripsita", hint: "Compañía top que nunca falla" },
    { rank: 4, name: "Andreina Roina", hint: "Pura alegría y buena energía" },
    { rank: 5, name: "Willy Rex", hint: "El crack legendario de las risas" },
    { rank: 6, name: "Nellisita Morenita", hint: "Dulzura y cariño al 100%" }
  ];

  let currentWordIdx = 0;
  let currentFilledLetters = [];
  let availablePool = [];

  const wordRankBadge = document.getElementById('word-rank-badge');
  const wordHintTitle = document.getElementById('word-hint-title');
  const wordSlotsContainer = document.getElementById('word-slots-container');
  const lettersPoolContainer = document.getElementById('letters-pool');
  const namesProgressBar = document.getElementById('names-progress-bar');
  const namesProgressText = document.getElementById('names-progress-text');
  const completedNamesList = document.getElementById('completed-names-list');
  const btnResetCurrentWord = document.getElementById('btnResetCurrentWord');
  const btnSkipWord = document.getElementById('btnSkipWord');

  function initNamesLevel() {
    currentWordIdx = 0;
    completedNamesList.innerHTML = '';
    loadCurrentWord();
  }

  function loadCurrentWord() {
    if (currentWordIdx >= squadNames.length) {
      // Nivel 2 completado
      megaExplosionConfetti();
      setTimeout(() => {
        alert('🏆 ¡Increíble! Descubriste a todo tu escuadrón que te adora.');
        showScreen('level3');
      }, 500);
      return;
    }

    const currentItem = squadNames[currentWordIdx];
    wordRankBadge.textContent = `🏆 TOP #${currentItem.rank}`;
    wordHintTitle.textContent = `Pista: ${currentItem.hint}`;
    
    // Progreso
    const percent = (currentWordIdx / squadNames.length) * 100;
    namesProgressBar.style.width = `${percent}%`;
    namesProgressText.textContent = `${currentWordIdx} de ${squadNames.length} completados`;

    // Preparar letras
    const rawTarget = currentItem.name;
    const targetLetters = rawTarget.split('');
    currentFilledLetters = [];

    // Generar pool de letras (las correctas + 2 extras aleatorias)
    const extraChars = "ABCDEFGHILMNOPRSTUVWXYZ";
    let pool = rawTarget.toUpperCase().replace(/\s/g, '').split('');
    for (let i = 0; i < 2; i++) {
      pool.push(extraChars[Math.floor(Math.random() * extraChars.length)]);
    }
    // Barajar pool
    pool.sort(() => Math.random() - 0.5);
    availablePool = pool.map((char, id) => ({ id, char, used: false }));

    renderWordBoard();
  }

  function renderWordBoard() {
    const currentItem = squadNames[currentWordIdx];
    const targetChars = currentItem.name.split('');

    // 1. Render Slots
    wordSlotsContainer.innerHTML = '';
    let letterCountIndex = 0;

    targetChars.forEach((ch, idx) => {
      const slot = document.createElement('div');
      if (ch === ' ') {
        slot.className = 'letter-slot space-slot';
      } else {
        slot.className = 'letter-slot';
        const filled = currentFilledLetters[letterCountIndex];
        if (filled) {
          slot.textContent = filled.char;
          slot.classList.add('filled');
          // Al hacer clic en un slot lleno, se devuelve la letra
          const currentIndexToRemove = letterCountIndex;
          slot.addEventListener('click', () => removeLetter(currentIndexToRemove));
        } else {
          slot.textContent = '';
        }
        letterCountIndex++;
      }
      wordSlotsContainer.appendChild(slot);
    });

    // 2. Render Pool de Letras
    lettersPoolContainer.innerHTML = '';
    availablePool.forEach(item => {
      const btn = document.createElement('button');
      btn.className = 'pool-btn';
      btn.textContent = item.char;
      if (item.used) {
        btn.classList.add('used');
      } else {
        btn.addEventListener('click', () => selectLetter(item));
      }
      lettersPoolContainer.appendChild(btn);
    });

    checkWordCompletion();
  }

  function selectLetter(item) {
    const currentItem = squadNames[currentWordIdx];
    const totalLettersNeeded = currentItem.name.replace(/\s/g, '').length;

    if (currentFilledLetters.length < totalLettersNeeded) {
      item.used = true;
      currentFilledLetters.push({ poolId: item.id, char: item.char });
      renderWordBoard();
    }
  }

  function removeLetter(slotIndex) {
    if (slotIndex < currentFilledLetters.length) {
      const removed = currentFilledLetters.splice(slotIndex, 1)[0];
      const poolItem = availablePool.find(p => p.id === removed.poolId);
      if (poolItem) poolItem.used = false;
      renderWordBoard();
    }
  }

  btnResetCurrentWord.addEventListener('click', () => {
    currentFilledLetters.forEach(item => {
      const p = availablePool.find(pool => pool.id === item.poolId);
      if (p) p.used = false;
    });
    currentFilledLetters = [];
    renderWordBoard();
  });

  btnSkipWord.addEventListener('click', () => {
    wordSolvedSuccess();
  });

  function checkWordCompletion() {
    const currentItem = squadNames[currentWordIdx];
    const targetClean = currentItem.name.toUpperCase().replace(/\s/g, '');
    const currentBuilt = currentFilledLetters.map(l => l.char).join('');

    if (currentBuilt.length === targetClean.length) {
      if (currentBuilt === targetClean) {
        triggerConfetti(0.15, { spread: 50 });
        wordSolvedSuccess();
      } else {
        // Efecto de error sutil
        wordSlotsContainer.style.animation = 'shake 0.3s';
        setTimeout(() => wordSlotsContainer.style.animation = '', 300);
      }
    }
  }

  function wordSolvedSuccess() {
    const currentItem = squadNames[currentWordIdx];
    
    // Agregar a la lista de completados
    const pill = document.createElement('div');
    pill.className = 'completed-pill';
    pill.textContent = `✓ ${currentItem.rank}. ${currentItem.name}`;
    completedNamesList.appendChild(pill);

    currentWordIdx++;
    setTimeout(() => {
      loadCurrentWord();
    }, 400);
  }


  // -------------------------------------------------------------
  // NIVEL 3: COFRE TEMU & BOTÓN AURA
  // -------------------------------------------------------------
  const clickableGiftBox = document.getElementById('clickableGiftBox');
  const temuPrizeCard = document.getElementById('temuPrizeCard');
  const btnAuraUnlock = document.getElementById('btnAuraUnlock');

  clickableGiftBox.addEventListener('click', () => {
    megaExplosionConfetti();
    clickableGiftBox.style.display = 'none';
    temuPrizeCard.classList.remove('hidden');
  });

  btnAuraUnlock.addEventListener('click', () => {
    // CAMBIO ÉPICO DE MÚSICA: BATALLA DE AURA
    playAuraMusic();
    megaExplosionConfetti();
    showScreen('celebration');
    initSparksCanvas();

    // Reproducir el video en loop del Six Seven
    const sixSevenVideo = document.getElementById('sixSevenVideo');
    if (sixSevenVideo) {
      sixSevenVideo.play().catch(e => console.log('Video play:', e));
    }
  });


  // -------------------------------------------------------------
  // FASE CENTRAL: CANVAS DE CHISPAS Y FUEGOS ARTIFICIALES
  // -------------------------------------------------------------
  const canvas = document.getElementById('sparks-canvas');
  let ctx = null;
  let sparks = [];

  function initSparksCanvas() {
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    requestAnimationFrame(animateSparks);

    // Lanzar ráfagas automáticas de confeti cada 4 segundos
    setInterval(() => {
      if (screens.celebration.classList.contains('active')) {
        triggerConfetti(0.1, { spread: 70, origin: { y: 0.6 } });
      }
    }, 4500);
  }

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createSpark(x, y, isVolcano = false) {
    const angle = isVolcano ? (Math.random() * Math.PI - Math.PI) : (Math.random() * Math.PI * 2);
    const speed = isVolcano ? (Math.random() * 8 + 3) : (Math.random() * 5 + 1);
    const colors = ['#ffcc00', '#ff007f', '#00f7ff', '#ff5722', '#ffffff'];
    
    return {
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (isVolcano ? 4 : 0),
      size: Math.random() * 3.5 + 1.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      decay: Math.random() * 0.02 + 0.015
    };
  }

  function animateSparks() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Generar chispas continuas desde las zonas de volcanes
    if (screens.celebration.classList.contains('active') && Math.random() < 0.6) {
      const leftX = window.innerWidth * 0.35;
      const rightX = window.innerWidth * 0.65;
      const volcanoY = window.innerHeight * 0.55;
      for (let i = 0; i < 3; i++) {
        sparks.push(createSpark(leftX, volcanoY, true));
        sparks.push(createSpark(rightX, volcanoY, true));
      }
    }

    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12; // gravedad
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        sparks.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    requestAnimationFrame(animateSparks);
  }

  // -------------------------------------------------------------
  // MENSAJE PERSONALIZADO EDITABLE / GUARDABLE
  // -------------------------------------------------------------
  const btnEditMessage = document.getElementById('btnEditMessage');
  const btnSaveMessage = document.getElementById('btnSaveMessage');
  const birthdayMessageContainer = document.getElementById('birthdayMessageContainer');

  // Recuperar mensaje previo si existiera en LocalStorage
  const savedMsg = localStorage.getItem('dani_birthday_msg');
  if (savedMsg) {
    birthdayMessageContainer.innerHTML = savedMsg;
  }

  btnEditMessage.addEventListener('click', () => {
    birthdayMessageContainer.contentEditable = "true";
    birthdayMessageContainer.classList.add('editable-active');
    birthdayMessageContainer.focus();
    btnEditMessage.classList.add('hidden');
    btnSaveMessage.classList.remove('hidden');
  });

  btnSaveMessage.addEventListener('click', () => {
    birthdayMessageContainer.contentEditable = "false";
    birthdayMessageContainer.classList.remove('editable-active');
    btnSaveMessage.classList.add('hidden');
    btnEditMessage.classList.remove('hidden');
    // Guardar en localStorage
    localStorage.setItem('dani_birthday_msg', birthdayMessageContainer.innerHTML);
    megaExplosionConfetti();
  });

  // Botón más confeti
  const btnMoreConfetti = document.getElementById('btnMoreConfetti');
  btnMoreConfetti.addEventListener('click', () => {
    megaExplosionConfetti();
  });

});
