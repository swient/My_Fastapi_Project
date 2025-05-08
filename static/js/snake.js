// 貪吃蛇遊戲主程式
const ROWS = 25;
const COLS = 25;
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
const boardElem = document.getElementById("snake-board");
const scoreElem = document.getElementById("score");
const timerElem = document.getElementById("timer");
const resetButtonElem = document.getElementById("reset-button");
const resultButtonElem = document.getElementById("result-button");
const resultMessageElem = document.getElementById("result-message");
const resultPageElem = document.getElementById("result-page");

// 初始化棋盤
function createBoard() {
  boardElem.innerHTML = "";
  boardElem.style.display = "grid";
  boardElem.style.gridTemplateRows = `repeat(${ROWS}, 1fr)`;
  boardElem.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.dataset.row = y;
      cell.dataset.col = x;
      boardElem.appendChild(cell);
    }
  }
}

// 初始化遊戲
function setupGame() {
  createBoard();
  snake = [{ x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) }];
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
  let pos;
  do {
    pos = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS),
    };
  } while (snake.some((s) => s.x === pos.x && s.y === pos.y));
  return pos;
}

// 畫面更新
function draw() {
  // 清空所有 cell 狀態
  const cells = boardElem.querySelectorAll(".cell");
  cells.forEach((cell) => {
    cell.className = "cell";
    cell.textContent = "";
    // 交錯色
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    if ((row + col) % 2 === 0) {
      cell.classList.add("even-cell");
    }
  });

  // 畫蛇
  for (let i = 0; i < snake.length; i++) {
    const idx = snake[i].y * COLS + snake[i].x;
    if (i === 0) {
      cells[idx].classList.add("snake-head");
    } else {
      cells[idx].classList.add("snake-body");
    }
  }

  // 畫食物
  const foodIdx = food.y * COLS + food.x;
  cells[foodIdx].textContent = "🍎";

  // 更新分數與時間
  scoreElem.textContent = score;
  timerElem.textContent = timer;
}

// 蛇移動邏輯
function moveSnake() {
  direction = nextDirection;
  let head = { ...snake[0] };
  if (direction === "LEFT") head.x -= 1;
  if (direction === "UP") head.y -= 1;
  if (direction === "RIGHT") head.x += 1;
  if (direction === "DOWN") head.y += 1;

  // 撞牆或撞到自己
  if (
    head.x < 0 ||
    head.x >= COLS ||
    head.y < 0 ||
    head.y >= ROWS ||
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
