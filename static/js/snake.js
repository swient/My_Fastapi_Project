// 貪吃蛇遊戲主程式
const box = 24;
const canvasSize = 600;
let snake = [];
let direction = null;
let nextDirection = null;
let food = null;
let score = 0;
let timer = 0;
let timerInterval = null;
let gameInterval = null;
let isGameOver = false;
let isStarted = false;

// UI 元素快取
const canvasElem = document.getElementById("snake-game");
const ctx = canvasElem.getContext("2d");
const scoreElem = document.getElementById("score");
const timerElem = document.getElementById("timer");
const resetButtonElem = document.getElementById("reset-button");
const resultButtonElem = document.getElementById("result-button");
const resultMessageElem = document.getElementById("result-message");
const resultPageElem = document.getElementById("result-page");

// 初始化遊戲
function setupGame() {
  snake = [{ x: 8 * box, y: 10 * box }];
  direction = null;
  nextDirection = null;
  food = spawnFood();
  score = 0;
  timer = 0;
  isGameOver = false;
  isStarted = false;
  draw();
  resetTimer();
  resultPageElem.style.display = "none";
  if (gameInterval) clearInterval(gameInterval);
  if (timerInterval) clearInterval(timerInterval);
}

// 食物隨機產生
function spawnFood() {
  return {
    x: Math.floor(Math.random() * (canvasSize / box)) * box,
    y: Math.floor(Math.random() * (canvasSize / box)) * box,
  };
}

// 畫面更新
function draw() {
  // 畫棋盤格背景
  for (let y = 0; y < canvasSize / box; y++) {
    for (let x = 0; x < canvasSize / box; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? "#e3f2fd" : "#bbdefb";
      ctx.fillRect(x * box, y * box, box, box);
    }
  }

  // 畫蛇（全部方框）
  for (let i = 0; i < snake.length; i++) {
    if (i === 0) {
      // 蛇頭（深綠方塊）
      ctx.fillStyle = "#2e7d32";
      ctx.fillRect(snake[i].x, snake[i].y, box, box);
    } else {
      // 蛇身（淺綠方塊）
      ctx.fillStyle = "#43a047";
      ctx.fillRect(snake[i].x, snake[i].y, box, box);
    }
  }

  // 畫食物（蘋果 emoji）
  ctx.font = `${
    box * 0.95
  }px "Segoe UI Emoji", "Noto Color Emoji", "Apple Color Emoji", "Arial"`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🍎", food.x + box / 2, food.y + box / 2);

  // 更新分數與時間
  scoreElem.textContent = score;
  timerElem.textContent = timer;
}

// 蛇移動邏輯
function moveSnake() {
  direction = nextDirection;
  let head = { ...snake[0] };
  if (direction === "LEFT") head.x -= box;
  if (direction === "UP") head.y -= box;
  if (direction === "RIGHT") head.x += box;
  if (direction === "DOWN") head.y += box;

  // 撞牆或撞到自己
  if (
    head.x < 0 ||
    head.x >= canvasSize ||
    head.y < 0 ||
    head.y >= canvasSize ||
    snake.some((segment) => segment.x === head.x && segment.y === head.y)
  ) {
    showResult();
    return;
  }

  snake.unshift(head);

  // 吃到食物
  if (head.x === food.x && head.y === food.y) {
    score += 10;
    food = spawnFood();
  } else {
    snake.pop();
  }
}

// 遊戲主循環
function gameLoop() {
  if (isGameOver) return;
  if (direction !== null && nextDirection !== null) {
    moveSnake();
  }
  draw();
}

// 計時器
function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!isGameOver) {
      timer++;
      timerElem.textContent = timer;
    }
  }, 1000);
}

function resetTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
  timer = 0;
  timerElem.textContent = "0";
}

// 遊戲結束
function showResult() {
  isGameOver = true;
  clearInterval(gameInterval);
  clearInterval(timerInterval);
  resultMessageElem.textContent = `遊戲結束！分數：${score}`;
  resultPageElem.style.display = "flex";
}

// 鍵盤事件
function handleKeydown(e) {
  // 支援方向鍵與 WASD
  let key = e.key.toLowerCase();
  let dir = null;
  if (key === "arrowleft" || key === "a") dir = "LEFT";
  if (key === "arrowup" || key === "w") dir = "UP";
  if (key === "arrowright" || key === "d") dir = "RIGHT";
  if (key === "arrowdown" || key === "s") dir = "DOWN";

  if (dir) {
    // 首次按下方向鍵或 WASD 時啟動遊戲並設定方向
    if (!isStarted) {
      isStarted = true;
      direction = dir;
      nextDirection = dir;
      startTimer();
      if (gameInterval) clearInterval(gameInterval);
      gameInterval = setInterval(gameLoop, 120);
    } else {
      // 遊戲進行中時，避免反向
      if (
        (dir === "LEFT" && direction !== "RIGHT") ||
        (dir === "UP" && direction !== "DOWN") ||
        (dir === "RIGHT" && direction !== "LEFT") ||
        (dir === "DOWN" && direction !== "UP")
      ) {
        nextDirection = dir;
      }
    }
  }
}

// 事件註冊
window.onload = () => {
  resetButtonElem.addEventListener("click", setupGame);
  resultButtonElem.addEventListener("click", setupGame);
  document.addEventListener("keydown", handleKeydown);
  setupGame();
};
