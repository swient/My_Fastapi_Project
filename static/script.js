// 全局變量
let rows = 30;
let cols = 15;
let mineCount = 50;
let flagCount = mineCount;
let board = [];
let isGameOver = false;
let timer;
let elapsedTime = 0;

// DOM 元素引用
const minefield = document.getElementById('minesweeper');
const flagCounter = document.getElementById('flag-count');
const timeCounter = document.getElementById('timer');
const restartButton = document.getElementById('restart');

// 初始化遊戲
function init() {
    flagCounter.textContent = `Flags: ${flagCount}`;
    timeCounter.textContent = 'Time: 0';
    createBoard();
    startTimer();
}

// 創建棋盤
function createBoard() {
    minefield.innerHTML = '';  // 清空舊的棋盤
    board = [];  // 重置遊戲數據

    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-item');

            // 左鍵點擊事件
            cell.addEventListener('click', () => handleLeftClick(r, c));

            // 右鍵點擊事件（標旗）
            cell.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                handleRightClick(r, c);
            });

            minefield.appendChild(cell);
            row.push({
                mine: false,
                flagged: false,
                opened: false,
                element: cell
            });
        }
        board.push(row);
    }

    placeMines();
}

// 放置地雷
function placeMines() {
    let placedMines = 0;
    while (placedMines < mineCount) {
        const r = Math.floor(Math.random() * rows);
        const c = Math.floor(Math.random() * cols);
        if (!board[r][c].mine) {
            board[r][c].mine = true;
            placedMines++;
        }
    }
}

// 處理左鍵點擊
function handleLeftClick(r, c) {
    if (isGameOver || board[r][c].flagged || board[r][c].opened) return;

    if (board[r][c].mine) {
        gameOver(false);
    } else {
        openCell(r, c);
        checkWin();
    }
}

// 開啟方格
function openCell(r, c) {
    if (board[r][c].opened) return;

    board[r][c].opened = true;
    board[r][c].element.classList.add('opened');
    const mineCount = countAdjacentMines(r, c);

    if (mineCount > 0) {
        board[r][c].element.textContent = mineCount;
    } else {
        // 打開周圍無雷的格子
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                    openCell(nr, nc);
                }
            }
        }
    }
}

// 計算周圍的地雷數
function countAdjacentMines(r, c) {
    let count = 0;
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].mine) {
                count++;
            }
        }
    }
    return count;
}

// 處理右鍵點擊（標旗）
function handleRightClick(r, c) {
    if (isGameOver || board[r][c].opened) return;

    board[r][c].flagged = !board[r][c].flagged;
    board[r][c].element.textContent = board[r][c].flagged ? '🚩' : '';
    flagCount += board[r][c].flagged ? -1 : 1;
    flagCounter.textContent = `Flags: ${flagCount}`;
    checkWin();
}

// 計時器
function startTimer() {
    clearInterval(timer);
    elapsedTime = 0;
    timer = setInterval(() => {
        elapsedTime++;
        timeCounter.textContent = `Time: ${elapsedTime}`;
    }, 1000);
}

// 遊戲結束
function gameOver(win) {
    clearInterval(timer);
    isGameOver = true;

    board.forEach(row => row.forEach(cell => {
        if (cell.mine) {
            cell.element.textContent = '💣';
        }
    }));

    restartButton.textContent = win ? '😎' : '😵';
}

// 檢查是否獲勝
function checkWin() {
    let openedCells = 0;
    let correctFlags = 0;

    board.forEach(row => row.forEach(cell => {
        if (cell.opened) openedCells++;
        if (cell.flagged && cell.mine) correctFlags++;
    }));

    if (openedCells === rows * cols - mineCount || correctFlags === mineCount) {
        gameOver(true);
    }
}

// 重啟遊戲
function restartGame() {
    isGameOver = false;
    flagCount = mineCount;
    flagCounter.textContent = `Flags: ${mineCount}`;
    timeCounter.textContent = 'Time: 0';
    restartButton.textContent = '😃';
    createBoard();
    startTimer();
}

// 綁定重啟按鈕事件
restartButton.addEventListener('click', restartGame);

// 初始化遊戲
init();