// 井字棋主程式
let board = [];
let playerWin = 0; // 玩家勝場
let computerWin = 0; // 電腦勝場
let gameActive = true;
let isPlayerX = true; // 玩家是否為 X
let currentPlayer = null; // 輪到誰

// UI 元素快取
const boardElem = document.getElementById("tic-tac-toe-board");
const turnElem = document.getElementById("turn");
const playerScoreElem = document.getElementById("player-score");
const computerScoreElem = document.getElementById("computer-score");
const resetButtonElem = document.getElementById("reset-button");
const resultButtonElem = document.getElementById("result-button");
const resultMessageElem = document.getElementById("result-message");
const resultPageElem = document.getElementById("result-page");

function setupGame() {
  board = Array(9).fill("");
  isPlayerX = !isPlayerX; // 每局交替
  currentPlayer = "X";
  gameActive = true;
  turnElem.textContent = getPlayerLabel(currentPlayer);
  boardElem.innerHTML = "";
  resultPageElem.style.display = "none";
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.dataset.index = i;
    cell.addEventListener("click", handleCellClick);
    cell.addEventListener("mouseenter", handleCellPreview);
    cell.addEventListener("mouseleave", handleCellPreviewLeave);
    boardElem.appendChild(cell);
  }
  // 若玩家不是 X，則電腦先手
  if (!isPlayerX) {
    setTimeout(computerMove, 400);
  }
}

function handleCellClick(e) {
  const idx = parseInt(e.currentTarget.dataset.index, 10);
  const playerChess = isPlayerX ? "X" : "O";
  const computerChess = isPlayerX ? "O" : "X";
  if (!gameActive || board[idx] || currentPlayer !== playerChess) return;
  board[idx] = currentPlayer;
  e.currentTarget.textContent = currentPlayer;
  e.currentTarget.classList.remove("o", "x", "preview-o", "preview-x");
  if (currentPlayer === "O") {
    e.currentTarget.classList.add("o");
  } else if (currentPlayer === "X") {
    e.currentTarget.classList.add("x");
  }
  if (board.every((cell) => cell)) {
    showResult("平手！");
    gameActive = false;
    return;
  }
  // 判斷玩家勝利是否勝利
  if (checkWin(playerChess)) {
    playerWin++;
    showResult("恭喜，你勝利了！");
    updateScore();
    gameActive = false;
    return;
  }
  currentPlayer = computerChess;
  turnElem.textContent = getPlayerLabel(currentPlayer);
  setTimeout(computerMove, 400);
}

function handleCellPreview(e) {
  const idx = parseInt(e.currentTarget.dataset.index, 10);
  if (!gameActive || board[idx]) return;
  // 只在輪到玩家時預覽，且只預覽玩家自己的棋
  const playerChess = isPlayerX ? "X" : "O";
  if (currentPlayer !== playerChess) return;
  if (playerChess === "O") {
    e.currentTarget.textContent = "O";
    e.currentTarget.classList.add("preview-o");
  } else if (playerChess === "X") {
    e.currentTarget.textContent = "X";
    e.currentTarget.classList.add("preview-x");
  }
}

function handleCellPreviewLeave(e) {
  const idx = parseInt(e.currentTarget.dataset.index, 10);
  if (!gameActive || board[idx]) return;
  e.currentTarget.textContent = "";
  e.currentTarget.classList.remove("preview-o", "preview-x");
}

function computerMove() {
  if (!gameActive) return;
  const playerChess = isPlayerX ? "X" : "O";
  const computerChess = isPlayerX ? "O" : "X";
  const empty = board
    .map((v, i) => (v === "" ? i : null))
    .filter((i) => i !== null);

  // 優先找能直接勝利的步驟
  for (let i of empty) {
    board[i] = computerChess;
    if (checkWin(computerChess)) {
      boardElem.children[i].textContent = computerChess;
      boardElem.children[i].classList.remove(
        "o",
        "x",
        "preview-o",
        "preview-x"
      );
      boardElem.children[i].classList.add(computerChess === "X" ? "x" : "o");
      // 電腦獲勝
      computerWin++;
      showResult("很遺憾，你失敗了！");
      updateScore();
      gameActive = false;
      return;
    }
    board[i] = "";
  }

  // 阻擋玩家直接勝利
  for (let i of empty) {
    board[i] = playerChess;
    if (checkWin(playerChess)) {
      board[i] = computerChess;
      boardElem.children[i].textContent = computerChess;
      boardElem.children[i].classList.remove(
        "o",
        "x",
        "preview-o",
        "preview-x"
      );
      boardElem.children[i].classList.add(computerChess === "X" ? "x" : "o");
      // 判斷是否平手
      if (board.every((cell) => cell)) {
        showResult("平手！");
        gameActive = false;
        return;
      }
      currentPlayer = playerChess;
      turnElem.textContent = getPlayerLabel(currentPlayer);
      return;
    }
    board[i] = "";
  }

  // 隨機落子
  const idx = empty[Math.floor(Math.random() * empty.length)];
  board[idx] = computerChess;
  boardElem.children[idx].textContent = computerChess;
  boardElem.children[idx].classList.remove("o", "x", "preview-o", "preview-x");
  boardElem.children[idx].classList.add(computerChess === "X" ? "x" : "o");
  // 先判斷電腦是否勝利
  if (checkWin(computerChess)) {
    computerWin++;
    showResult("很遺憾，你失敗了！");
    updateScore();
    gameActive = false;
    return;
  }
  // 再判斷是否平手
  if (board.every((cell) => cell)) {
    showResult("平手！");
    gameActive = false;
    return;
  }
  currentPlayer = playerChess;
  turnElem.textContent = getPlayerLabel(currentPlayer);
}

function checkWin(player) {
  // prettier-ignore
  const wins = [
    [0,1,2],[3,4,5],[6,7,8], // 橫
    [0,3,6],[1,4,7],[2,5,8], // 直
    [0,4,8],[2,4,6]          // 斜
  ];
  return wins.some((line) => line.every((idx) => board[idx] === player));
}

function updateScore() {
  playerScoreElem.innerText = `玩家勝場：${playerWin}`;
  computerScoreElem.innerText = `電腦勝場：${computerWin}`;
}

function showResult(msg) {
  resultMessageElem.textContent = msg;
  // 根據結果調整顏色
  if (msg.includes("勝利")) {
    resultMessageElem.style.color = "#4CAF50";
    resultButtonElem.style.backgroundColor = "#4CAF50";
  } else if (msg.includes("失敗")) {
    resultMessageElem.style.color = "#f44336";
    resultButtonElem.style.backgroundColor = "#f44336";
  } else {
    resultMessageElem.style.color = "#ffc107";
    resultButtonElem.style.backgroundColor = "#ffc107";
  }
  resultPageElem.style.display = "flex";
}

function getPlayerLabel(player) {
  if ((isPlayerX && player === "X") || (!isPlayerX && player === "O")) {
    return `輪到：${player}(玩家)`;
  } else {
    return `輪到：${player}(AI)`;
  }
}

window.onload = () => {
  resetButtonElem.addEventListener("click", () => {
    playerWin = 0;
    computerWin = 0;
    updateScore();
    isPlayerX = false;
    setupGame();
  });
  resultButtonElem.addEventListener("click", setupGame);
  isPlayerX = false;
  setupGame();
};
