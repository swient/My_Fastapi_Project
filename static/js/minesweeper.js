const difficultyMap = {
  easy: { rows: 10, cols: 10, mines: 10 },
  medium: { rows: 10, cols: 20, mines: 25 },
  hard: { rows: 15, cols: 25, mines: 40 },
};

const boardElem = document.getElementById("board");
const timerElem = document.getElementById("timer");
const minesLeftElem = document.getElementById("mines-left");
const resetButtonElem = document.getElementById("reset-button");
const faceButtonElem = document.getElementById("face-button");
const difficultyElem = document.getElementById("difficulty");
const resultPageElem = document.getElementById("result-page");
const resultMessageElem = document.getElementById("result-message");
const resultButtonElem = document.getElementById("result-button");

let board = [];
let timer = 0;
let timerInterval = null;
let mineCount = 0;
let revealedCount = 0;
let rows, cols, mines;
let firstClick = false;
let gameEnded = false;
let currentDifficulty = "easy";

function setupGame() {
  resetTimer();
  revealedCount = 0;
  firstClick = true;
  gameEnded = false;
  faceButtonElem.textContent = "😀";

  ({ rows, cols, mines } = difficultyMap[currentDifficulty]);
  mineCount = mines;
  minesLeftElem.textContent = mineCount;
  // 隱藏結果頁面
  resultPageElem.style.display = "none";
  createBoard();
}

function ensureFirstClickSafe(row, col) {
  while (board[row][col].mine) {
    createBoard();
    placeMines();
  }
}

function createBoard() {
  board = Array.from({ length: rows }, () => Array(cols).fill({}));
  boardElem.innerHTML = "";
  boardElem.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  boardElem.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      // 左上角
      if (i === 0 && j === 0) {
        cell.classList.add("corner-top-left");
      }
      // 右上角
      if (i === 0 && j === cols - 1) {
        cell.classList.add("corner-top-right");
      }
      // 左下角
      if (i === rows - 1 && j === 0) {
        cell.classList.add("corner-bottom-left");
      }
      // 右下角
      if (i === rows - 1 && j === cols - 1) {
        cell.classList.add("corner-bottom-right");
      }
      cell.dataset.row = i;
      cell.dataset.col = j;

      cell.addEventListener("click", handleLeftClick);
      cell.addEventListener("contextmenu", handleRightClick);
      cell.addEventListener("mouseover", handleMouseOver);
      cell.addEventListener("mouseout", handleMouseOut);
      cell.addEventListener("mousedown", handleMouseDown);
      cell.addEventListener("mouseup", handleMouseUp);

      boardElem.appendChild(cell);
    }
  }

  placeMines();
}

function placeMines() {
  let placed = 0;
  while (placed < mines) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);

    if (!board[row][col].mine) {
      board[row][col] = { mine: true, revealed: false, flagged: false };
      placed++;
    }
  }

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (!board[i][j].mine) {
        board[i][j] = {
          mine: false,
          revealed: false,
          flagged: false,
          nearby: getNearbyMineCount(i, j),
        };
      }
    }
  }
}

function getNearbyMineCount(row, col) {
  // prettier-ignore
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],         [0, 1],
    [1, -1], [1, 0], [1, 1],
  ];
  return directions.reduce((count, [dx, dy]) => {
    const x = row + dx,
      y = col + dy;
    return count + (board[x] && board[x][y] && board[x][y].mine ? 1 : 0);
  }, 0);
}

function startTimer() {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    timer++;
    timerElem.textContent = timer;
  }, 1000);
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
}

function resetTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
  timer = 0;
  timerElem.textContent = "0";
}

function handleLeftClick(e) {
  if (gameEnded) return; // 檢查遊戲是否結束

  const cell = e.target;
  const row = parseInt(cell.dataset.row);
  const col = parseInt(cell.dataset.col);

  if (board[row][col].flagged || board[row][col].revealed) return;

  if (firstClick) {
    ensureFirstClickSafe(row, col);
    firstClick = false;
    startTimer();
  }

  if (board[row][col].mine) {
    revealAllMines();
    showResult(false);
  } else {
    revealCell(row, col);
    checkWin();
  }
}

function handleRightClick(e) {
  if (gameEnded) return; // 檢查遊戲是否結束

  e.preventDefault();
  const cell = e.target;
  const row = parseInt(cell.dataset.row);
  const col = parseInt(cell.dataset.col);

  if (board[row][col].revealed) return;

  if (board[row][col].flagged) {
    board[row][col].flagged = false;
    cell.classList.remove("flagged");
    cell.textContent = "";
    mineCount++;
  } else {
    board[row][col].flagged = true;
    cell.classList.add("flagged");
    cell.textContent = "🚩";
    mineCount--;
  }

  minesLeftElem.textContent = mineCount;

  // 在棋盤容器上添加事件監聽器，阻止右鍵選單彈出
  boardElem.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });
  // 在結果介面添加事件監聽器，阻止右鍵選單彈出
  resultPageElem.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });
}

function handleMouseOver(e) {
  if (gameEnded) return; // 檢查遊戲是否結束

  const cell = e.target;
  const row = parseInt(cell.dataset.row);
  const col = parseInt(cell.dataset.col);

  if (!cell.classList.contains("revealed") && !board[row][col].flagged) {
    cell.classList.add("hover");
  }
}

function handleMouseOut(e) {
  const cell = e.target;
  cell.classList.remove("hover");
}

function handleMouseDown(e) {
  if (gameEnded) return; // 檢查遊戲是否結束
  if (e.buttons === 3) {
    const cell = e.target;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    const neighbors = getNeighbors(row, col);
    const flaggedCount = neighbors.filter(({ flagged }) => flagged).length;

    if (flaggedCount === board[row][col].nearby) {
      let hitMine = false;
      neighbors.forEach(({ row, col, flagged }) => {
        if (!flagged) {
          if (board[row][col].mine) {
            hitMine = true;
          } else {
            revealCell(row, col);
            checkWin();
          }
        }
      });

      if (hitMine) {
        revealAllMines();
        showResult(false);
      }
    } else {
      neighbors.forEach(({ row, col, revealed, flagged }) => {
        if (!revealed && !flagged) {
          const neighborCell = boardElem.children[row * cols + col];
          neighborCell.classList.add("hover");
        }
      });
    }
  }
}

function handleMouseUp() {
  const cells = boardElem.querySelectorAll(".cell");
  cells.forEach((cell) => cell.classList.remove("hover"));
}

function revealCell(row, col) {
  const cell = board[row][col];
  if (cell.revealed || cell.flagged) return;

  cell.revealed = true;
  revealedCount++;
  const cellElement = boardElem.children[row * cols + col];
  cellElement.classList.add("revealed");

  if (cell.nearby) {
    cellElement.textContent = cell.nearby;
  } else {
    // prettier-ignore
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],         [0, 1],
      [1, -1], [1, 0], [1, 1],
    ];
    directions.forEach(([dx, dy]) => {
      const x = row + dx,
        y = col + dy;
      if (board[x] && board[x][y]) revealCell(x, y);
    });
  }
}

function getNeighbors(row, col) {
  // prettier-ignore
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],         [0, 1],
    [1, -1], [1, 0], [1, 1],
  ];
  return directions
    .map(([dx, dy]) => ({ row: row + dx, col: col + dy }))
    .filter(({ row, col }) => board[row] && board[row][col])
    .map(({ row, col }) => ({ ...board[row][col], row, col }));
}

function revealAllMines() {
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (board[i][j].mine) {
        const cellElement = boardElem.children[i * cols + j];
        cellElement.classList.add("revealed");
        cellElement.textContent = "💣";
      }
    }
  }
}

function checkWin() {
  if (revealedCount === rows * cols - mines) {
    showResult(true);
  }
}

function showResult(win) {
  stopTimer();
  faceButtonElem.textContent = win ? "😎" : "😭";
  if (win) {
    resultMessageElem.textContent = "恭喜，你勝利了！";
    resultMessageElem.style.color = "#4CAF50";
    resultButtonElem.style.backgroundColor = "#4CAF50"; // 綠色
  } else {
    resultMessageElem.textContent = "很遺憾，你失敗了！";
    resultMessageElem.style.color = "#f44336";
    resultButtonElem.style.backgroundColor = "#f44336"; // 紅色
  }
  resultPageElem.style.display = "flex";
  gameEnded = true;
}

window.onload = () => {
  resetButtonElem.addEventListener("click", setupGame);
  faceButtonElem.addEventListener("click", setupGame);
  resultButtonElem.addEventListener("click", setupGame);
  difficultyElem.addEventListener("change", (e) => {
    currentDifficulty = e.target.value;
    setupGame();
  });
  setupGame();
};
