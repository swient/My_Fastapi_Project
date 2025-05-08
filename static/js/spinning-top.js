// 旋轉陀螺主程式
const difficultyWidthMap = {
  easy: 40,
  medium: 35,
  hard: 30,
};

// 狀態變數
let timer = 0;
let timerInterval = null;
let energy = 50;
let gameActive = false;
let animationFrame = null;
let targetMin = 30;
let targetMax = 60;
let targetWidth = 20;
let holding = false;
let started = false;
let targetMoveTimer = null;
let direction = 1;
let directionCount = 0;
let directionLimit = 30;
let score = 0;
let currentDifficulty = "easy";

// UI 元素快取
const timerElem = document.getElementById("timer");
const scoreElem = document.getElementById("score");
const spinningTopImgElem = document.getElementById("spinning-top-img");
const spinButtonElem = document.getElementById("spin-button");
const resultButtonElem = document.getElementById("result-button");
const resultMessageElem = document.getElementById("result-message");
const resultPageElem = document.getElementById("result-page");
const bestScoreElem = document.getElementById("best-score");
const difficultyElem = document.getElementById("difficulty");

// 能量條更新
function updateEnergyBar() {
  const energyBarElem = document.getElementById("energy-bar");
  energyBarElem.style.width = energy + "%";
  let dist = 0;
  if (energy < targetMin) {
    dist = targetMin - energy;
  } else if (energy > targetMax) {
    dist = energy - targetMax;
  } else {
    dist = Math.min(energy - targetMin, targetMax - energy);
  }
  if (dist > 10) {
    energyBarElem.style.background = "#4caf50"; // 綠色
  } else if (dist > 4) {
    energyBarElem.style.background = "#ffc107"; // 橘色
  } else {
    energyBarElem.style.background = "#f44336"; // 紅色
  }
}

// 目標框更新
function updateTargetBox() {
  const targetBoxElem = document.getElementById("target-box");
  targetBoxElem.style.left = targetMin + "%";
  targetBoxElem.style.width = targetMax - targetMin + "%";
}

// 目標框移動
function moveTargetBox() {
  if (directionCount >= directionLimit) {
    direction = Math.random() < 0.5 ? -1 : 1;
    directionLimit = Math.floor(Math.random() * 11) + 10;
    directionCount = 0;
  }
  let newMin = targetMin + direction;
  // 邊界反彈
  if (newMin < 0) {
    newMin = 0;
    direction = 1;
    directionLimit = Math.floor(Math.random() * 11) + 10;
    directionCount = 0;
  }
  if (newMin > 100 - targetWidth) {
    newMin = 100 - targetWidth;
    direction = -1;
    directionLimit = Math.floor(Math.random() * 11) + 10;
    directionCount = 0;
  }
  targetMin = newMin;
  targetMax = targetMin + targetWidth;
  directionCount++;
  updateTargetBox();
}

function startTargetMove() {
  moveTargetBox();
  if (targetMoveTimer) clearInterval(targetMoveTimer);
  targetMoveTimer = setInterval(moveTargetBox, 50);
}

function stopTargetMove() {
  if (targetMoveTimer) clearInterval(targetMoveTimer);
}

function setupGame() {
  hideResult();
  stopTimer();
  stopTargetMove();
  energy = 50;
  timer = 0;
  score = 0;
  started = false;
  gameActive = false;
  targetWidth = difficultyWidthMap[currentDifficulty];
  targetMin = 50 - targetWidth / 2;
  targetMax = 50 + targetWidth / 2;
  timerElem.textContent = "0";
  scoreElem.textContent = "0";
  spinningTopImgElem.style.transform = "rotate(0deg)";
  updateEnergyBar();
  updateTargetBox();
  spinButtonElem.disabled = false;
}

function startGame() {
  if (started) return;
  started = true;
  gameActive = true;
  timer = 0;
  timerElem.textContent = "0";
  startTargetMove();
  loop();
  startTimer();
}

function endGame() {
  gameActive = false;
  started = false;
  stopTimer();
  stopTargetMove();
  cancelAnimationFrame(animationFrame);
  spinButtonElem.disabled = true;
  let best = parseInt(
    localStorage.getItem("spinning-top-best-time") || "0",
    10
  );
  if (timer > best) {
    best = timer;
    localStorage.setItem("spinning-top-best-time", best);
  }
  resultMessageElem.textContent = `遊戲結束！存活時間：${timer} 秒`;
  bestScoreElem.textContent = "";
  resultPageElem.style.display = "flex";
}

function hideResult() {
  resultPageElem.style.display = "none";
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timer++;
    score += 2;
    timerElem.textContent = timer;
    scoreElem.textContent = score;
  }, 1000);
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
}

function loop() {
  if (!gameActive) return;
  if (holding) {
    energy += 0.2;
  } else {
    energy -= 0.2;
  }
  if (energy > 100) energy = 100;
  if (energy < 0) energy = 0;
  updateEnergyBar();
  if (energy < targetMin || energy > targetMax) {
    endGame();
    return;
  }
  const angle = (100 - energy) * 3 + timer * 360;
  spinningTopImgElem.style.transform = `rotate(${angle}deg)`;
  animationFrame = requestAnimationFrame(loop);
}

function onSpinButtonDown() {
  if (!started) startGame();
  holding = true;
}

function onSpinButtonUp() {
  holding = false;
}

// 事件綁定
window.onload = () => {
  spinButtonElem.onmousedown = onSpinButtonDown;
  spinButtonElem.onmouseup = onSpinButtonUp;
  spinButtonElem.onmouseleave = onSpinButtonUp;
  spinButtonElem.ontouchstart = onSpinButtonDown;
  spinButtonElem.ontouchend = onSpinButtonUp;
  resultButtonElem.onclick = setupGame;
  difficultyElem.addEventListener("change", (e) => {
    currentDifficulty = e.target.value;
    setupGame();
  });
  setupGame();
};
