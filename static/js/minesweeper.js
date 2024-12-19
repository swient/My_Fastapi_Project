document.addEventListener('DOMContentLoaded', () => {
  const boardElement = document.getElementById('board');
  const timerElement = document.getElementById('timer');
  const minesLeftElement = document.getElementById('mines-left');
  const startButton = document.getElementById('start-button');
  const resetButton = document.getElementById('reset-button');
  const difficultySelect = document.getElementById('difficulty');
  const resultPage = document.getElementById('result-page');
  const resultMessage = document.getElementById('result-message');
  const resultButton = document.getElementById('result-button');

  let board = [];
  let timer = 0;
  let timerInterval;
  let mineCount = 0;
  let revealedCount = 0;
  let rows, cols, mines;
  let firstClick = false;
  let gameEnded = false;

  function initializeGame() {
    clearInterval(timerInterval);
    timerInterval = null
    timer = 0;
    revealedCount = 0;
    firstClick = true;
    gameEnded = false;
    resetButton.textContent = '😀';
    timerElement.textContent = '0';
  
    const difficulty = difficultySelect.value;
    if (difficulty === 'easy') {
      rows = 10;
      cols = 10;
      mines = 10;
    } else if (difficulty === 'medium') {
      rows = 10;
      cols = 20;
      mines = 25;
    } else {
      rows = 15;
      cols = 25;
      mines = 40;
    }

    mineCount = mines;
    minesLeftElement.textContent = mineCount;
    // 隱藏結果頁面
    document.getElementById('result-page').style.display = 'none';
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
    boardElement.innerHTML = '';
    boardElement.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    boardElement.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.row = i;
        cell.dataset.col = j;

        cell.addEventListener('click', handleLeftClick);
        cell.addEventListener('contextmenu', handleRightClick);
        cell.addEventListener('mouseover', handleMouseOver);
        cell.addEventListener('mouseout', handleMouseOut);
        cell.addEventListener('mousedown', handleMouseDown);
        cell.addEventListener('mouseup', handleMouseUp);

        boardElement.appendChild(cell);
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
    if (!timerInterval) {
      timerInterval = setInterval(() => {
        timer++;
        timerElement.textContent = timer;
      }, 1000);
    }
  }

  function handleLeftClick(e) {
    if (gameEnded) 
        return; // 檢查遊戲是否結束
    
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
      endGame(false);
    } else {
      revealCell(row, col);
      checkWin();
    }
  }

  function handleRightClick(e) {
    if (gameEnded) 
        return; // 檢查遊戲是否結束
    
    e.preventDefault();
    const cell = e.target;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    if (board[row][col].revealed) return;

    if (board[row][col].flagged) {
      board[row][col].flagged = false;
      cell.classList.remove('flagged');
      cell.textContent = '';
      mineCount++;
    } else {
      board[row][col].flagged = true;
      cell.classList.add('flagged');
      cell.textContent = '🚩';
      mineCount--;
    }

    minesLeftElement.textContent = mineCount;

    // 在棋盤容器上添加事件監聽器，阻止右鍵選單彈出
    boardElement.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
    // 在結果介面添加事件監聽器，阻止右鍵選單彈出
    resultPage.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  function handleMouseOver(e) {
    if (gameEnded) 
        return; // 檢查遊戲是否結束
    
    const cell = e.target;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    if (!cell.classList.contains('revealed') && !board[row][col].flagged) {
    cell.classList.add('hover');
    }
  }

  function handleMouseOut(e) {
    const cell = e.target;
    cell.classList.remove('hover');
  }

  function handleMouseDown(e) {
    if (gameEnded) 
        return; // 檢查遊戲是否結束
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
          endGame(false);
        }
      } else {
        neighbors.forEach(({ row, col, revealed, flagged }) => {
          if (!revealed && ! flagged) {
            const neighborCell = boardElement.children[row * cols + col];
            neighborCell.classList.add('hover');
          }
        });
      }
    }
  }

  function handleMouseUp() {
    const cells = boardElement.querySelectorAll('.cell');
    cells.forEach((cell) => cell.classList.remove('hover'));
  }

  function revealCell(row, col) {
    const cell = board[row][col];
    if (cell.revealed || cell.flagged) return;

    cell.revealed = true;
    revealedCount++;
    const cellElement = boardElement.children[row * cols + col];
    cellElement.classList.add('revealed');

    if (cell.nearby) {
      cellElement.textContent = cell.nearby;
    } else {
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
          const cellElement = boardElement.children[i * cols + j];
          cellElement.classList.add('revealed');
          cellElement.textContent = '💣';
        }
      }
    }
  }

  function checkWin() {
    if (revealedCount === rows * cols - mines) {
      endGame(true);
    }
  }

  function endGame(win) {
    clearInterval(timerInterval);
    resetButton.textContent = win ? '😎' : '😭';
    if (win) {
        resultMessage.textContent = '恭喜，你勝利了！';
        resultMessage.style.color = '#4CAF50';
        resultButton.style.backgroundColor = '#4CAF50'; // 綠色
    } else {
        resultMessage.textContent = '很遺憾，你失敗了！';
        resultMessage.style.color = '#f44336';
        resultButton.style.backgroundColor = '#f44336'; // 紅色
    }
    resultPage.style.display = 'flex';
    gameEnded = true;
  }

  startButton.addEventListener('click', initializeGame);
  resetButton.addEventListener('click', initializeGame);
  resultButton.addEventListener('click', initializeGame);

  initializeGame();
});