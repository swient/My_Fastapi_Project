// 記憶遊戲主程式
// prettier-ignore
const emojiSets = [
  "🍎", "🍌", "🍇", "🍓", "🍒", "🍍", "🥝", "🍉", "🍋", "🍑", "🍊",
  "🍈", "🥥", "🥭", "🍐", "🍏", "🍔", "🍟", "🍕", "🍗", "🍤", "🍦",
  "🍰", "🍩", "🍪", "🍫", "🍿", "🍜", "🍙", "🍚", "🍛", "🍢"
];
const difficultyMap = {
  easy: { rows: 4, cols: 4 }, // 8對
  medium: { rows: 4, cols: 6 }, // 12對
  hard: { rows: 4, cols: 10 }, // 20對
};

let board = [];
let flipped = [];
let matched = 0;
let moves = 0;
let timer = 0;
let timerInterval = null;
let lock = false;
let totalPairs = 0;
let timerStarted = false;
let currentDifficulty = "easy";
let cardEmojis = [];

// UI 元素快取
const boardElem = document.getElementById("memory-game-board");
const moveCountElem = document.getElementById("move-count");
const timerElem = document.getElementById("timer");
const resetButtonElem = document.getElementById("reset-button");
const resultButtonElem = document.getElementById("result-button");
const resultMessageElem = document.getElementById("result-message");
const resultPageElem = document.getElementById("result-page");
const difficultyElem = document.getElementById("difficulty");

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function createBoard() {
  const { rows, cols } = difficultyMap[currentDifficulty];
  boardElem.innerHTML = "";
  boardElem.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  const pairCount = (rows * cols) / 2;
  totalPairs = pairCount;
  let emojis = shuffle([...emojiSets]).slice(0, pairCount);
  let cards = shuffle([...emojis, ...emojis]);
  board = [];
  matched = 0;
  flipped = [];
  timerStarted = false;

  // 用一個陣列記錄每張卡的 emoji
  cardEmojis = cards;
  cards.forEach((emoji, i) => {
    const card = document.createElement("div");
    card.className = "memory-card";
    card.dataset.index = i;
    card.innerHTML = `<span class="front"></span><span class="back"></span>`;
    card.addEventListener("click", flipCard);
    boardElem.appendChild(card);
    board.push(card);
  });
}

function flipCard(e) {
  if (lock) return;
  const card = e.currentTarget;
  if (card.classList.contains("flipped") || flipped.length === 2) return;
  const idx = parseInt(card.dataset.index, 10);
  // 翻牌時才顯示 emoji
  card.querySelector(".back").textContent = cardEmojis[idx];
  card.classList.add("flipped");
  flipped.push(card);
  if (!timerStarted) {
    startTimer();
    timerStarted = true;
  }
  if (flipped.length === 2) {
    moves++;
    moveCountElem.textContent = moves;
    checkMatch();
  }
}

function checkMatch() {
  const [c1, c2] = flipped;
  const idx1 = parseInt(c1.dataset.index, 10);
  const idx2 = parseInt(c2.dataset.index, 10);
  if (cardEmojis[idx1] === cardEmojis[idx2]) {
    c1.classList.add("matched");
    c2.classList.add("matched");
    matched++;
    flipped = [];
    if (matched === totalPairs) {
      setTimeout(showResult, 500);
    }
  } else {
    lock = true;
    setTimeout(() => {
      c1.classList.remove("flipped");
      c2.classList.remove("flipped");
      // 收回時隱藏 emoji
      c1.querySelector(".back").textContent = "";
      c2.querySelector(".back").textContent = "";
      flipped = [];
      lock = false;
    }, 800);
  }
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

function showResult() {
  stopTimer();
  resultMessageElem.textContent = `恭喜完成！總步數：${moves}，總時間：${timer} 秒`;
  resultPageElem.style.display = "flex";
}

function setupGame() {
  createBoard();
  resetTimer();
  moves = 0;
  moveCountElem.textContent = moves;
  resultPageElem.style.display = "none";
}

window.onload = () => {
  resetButtonElem.addEventListener("click", setupGame);
  resultButtonElem.addEventListener("click", setupGame);
  difficultyElem.addEventListener("change", (e) => {
    currentDifficulty = e.target.value;
    setupGame();
  });
  setupGame();
};
