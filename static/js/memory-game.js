// 記憶遊戲主程式（困難6x10，勝利頁面樣式統一）
const emojiSets = [
    '🍎','🍌','🍇','🍓','🍒','🍍','🥝','🍉','🍋','🍑','🍊','🍈','🥥','🥭','🍐','🍏','🍔','🍟',
    '🍕','🍗','🍤','🍦','🍰','🍩','🍪','🍫','🍿','🍜','🍙','🍚','🍛','🍢'
];
const difficultyMap = {
    easy: { rows: 4, cols: 4 },      // 8對
    medium: { rows: 4, cols: 6 },    // 12對
    hard: { rows: 6, cols: 10 }      // 30對
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
let currentDifficulty = 'easy';

function getDifficulty() {
    return difficultyMap[currentDifficulty];
}

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function createBoard() {
    const { rows, cols } = getDifficulty();
    const boardElem = document.getElementById('memory-game-board');
    boardElem.innerHTML = '';
    boardElem.style.gridTemplateColumns = `repeat(${cols}, 80px)`;
    const pairCount = (rows * cols) / 2;
    totalPairs = pairCount;
    let emojis = shuffle([...emojiSets]).slice(0, pairCount);
    let cards = shuffle([...emojis, ...emojis]);
    board = [];
    matched = 0;
    moves = 0;
    flipped = [];
    timerStarted = false;
    document.getElementById('move-count').textContent = '0';
    document.getElementById('timer').textContent = '0';
    for (let i = 0; i < cards.length; i++) {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.dataset.value = cards[i];
        card.dataset.index = i;
        card.innerHTML = `<span class="front"></span><span class="back">${cards[i]}</span>`;
        card.addEventListener('click', flipCard);
        boardElem.appendChild(card);
        board.push(card);
    }
}

function flipCard(e) {
    if (lock) return;
    const card = e.currentTarget;
    if (card.classList.contains('flipped') || flipped.length === 2) return;
    card.classList.add('flipped');
    flipped.push(card);
    if (!timerStarted) {
        startTimer();
        timerStarted = true;
    }
    if (flipped.length === 2) {
        moves++;
        document.getElementById('move-count').textContent = moves;
        checkMatch();
    }
}

function checkMatch() {
    const [c1, c2] = flipped;
    if (c1.dataset.value === c2.dataset.value) {
        c1.classList.add('matched');
        c2.classList.add('matched');
        matched++;
        flipped = [];
        if (matched === totalPairs) {
            setTimeout(showResult, 500);
        }
    } else {
        lock = true;
        setTimeout(() => {
            c1.classList.remove('flipped');
            c2.classList.remove('flipped');
            flipped = [];
            lock = false;
        }, 800);
    }
}

function startTimer() {
    timer = 0;
    document.getElementById('timer').textContent = '0';
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timer++;
        document.getElementById('timer').textContent = timer;
    }, 1000);
}

function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
}

function showResult() {
    stopTimer();
    document.getElementById('result-message').textContent =
        `恭喜完成！總步數：${moves}，總時間：${timer} 秒`;
    document.getElementById('result-page').style.display = 'flex';
}

function hideResult() {
    document.getElementById('result-page').style.display = 'none';
}

function startGame() {
    hideResult();
    createBoard();
    stopTimer();
    document.getElementById('reset-button').disabled = false;
}

function resetGame() {
    startGame();
}

document.getElementById('start-button').onclick = () => {
    currentDifficulty = document.getElementById('difficulty').value;
    startGame();
};
document.getElementById('reset-button').onclick = resetGame;
document.getElementById('result-button').onclick = startGame;

window.onload = () => {
    startGame();
};