  // 常數與資料
  const foundationSuits = ['♣', '♦', '♥', '♠'];
  const suits = ['♣', '♦', '♥', '♠'];
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  // 遊戲狀態
  let tableau, foundations, stock, waste, movesStack, redoStack;
  let timer = 0, timerInterval = null;

  // 拖曳相關全域變數
  let dragInfo = null;
  let dragImage = null;

  // 工具函式
  const isRed = suit => suit === '♥' || suit === '♦';

  const createDeck = () =>
    suits.flatMap(suit => ranks.map(rank => ({ suit, rank, faceUp: false })));

  const shuffle = deck => {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  };

  // 遊戲初始化
  function setupGame() {
    let deck = createDeck();
    shuffle(deck);
    tableau = Array.from({ length: 7 }, (_, i) =>
      Array.from({ length: i + 1 }, (_, j) => {
        const card = deck.pop();
        card.faceUp = j === i;
        return card;
      })
    );
    stock = deck;
    waste = [];
    foundations = [[], [], [], []];
    movesStack = [];
    redoStack = [];
    resetTimer();
    render();
  }

  // 判斷是否有解（簡化）
  function isSolvable() {
    const tops = tableau.map(col => col[col.length - 1]).filter(Boolean);
    return tops.some(card => card.rank === 'A' || card.rank === 'K');
  }

  // 渲染 UI
  function render(isUndo = false) {
    // 儲存狀態
    if (!isUndo) {
      movesStack.push({
        tableau: JSON.parse(JSON.stringify(tableau)),
        foundations: JSON.parse(JSON.stringify(foundations)),
        stock: JSON.parse(JSON.stringify(stock)),
        waste: JSON.parse(JSON.stringify(waste))
      });
      if (movesStack.length > 100) movesStack.shift();
    }
    // 控制按鈕
    const undoBtn = document.getElementById('undo-button');
    if (undoBtn) undoBtn.disabled = movesStack.length <= 1;
    const redoBtn = document.getElementById('redo-button');
    if (redoBtn) redoBtn.disabled = redoStack.length === 0;

    // 渲染 tableau
    const tableauDiv = document.getElementById('tableau');
    tableauDiv.innerHTML = '';
    tableau.forEach((col, idx) => {
      const colDiv = document.createElement('div');
      colDiv.className = 'tableau-col';
      colDiv.dataset.col = idx;
      col.forEach((card, i) => {
        const cardDiv = createCardDiv(card, i, idx, 'tableau');
        colDiv.appendChild(cardDiv);
      });
      tableauDiv.appendChild(colDiv);
    });

    // 渲染 foundation
    ['foundation0', 'foundation1', 'foundation2', 'foundation3'].forEach((id, i) => {
      const fDiv = document.getElementById(id);
      fDiv.className = 'foundation';
      fDiv.innerHTML = '';
      if (foundations[i].length) {
        const card = foundations[i][foundations[i].length - 1];
        const cardDiv = createCardDiv(card, foundations[i].length - 1, i, 'foundation');
        fDiv.appendChild(cardDiv);
        fDiv.style.color = '';
        fDiv.style.fontSize = '';
        fDiv.style.display = '';
        fDiv.style.alignItems = '';
        fDiv.style.justifyContent = '';
      } else {
        fDiv.textContent = foundationSuits[i];
        fDiv.style.color = isRed(foundationSuits[i]) ? '#d22' : '#222';
        fDiv.style.fontSize = '2em';
        fDiv.style.display = 'flex';
        fDiv.style.alignItems = 'center';
        fDiv.style.justifyContent = 'center';
      }
    });

    // 渲染 stock & waste
    const stockDiv = document.getElementById('stock');
    stockDiv.innerHTML = '';
    if (stock.length) {
      const cardDiv = document.createElement('div');
      cardDiv.className = 'card face-down';
      stockDiv.appendChild(cardDiv);
      stockDiv.style.fontSize = '';
    } else {
      stockDiv.textContent = '↺';
      stockDiv.style.fontSize = '2.2em';
    }
    const wasteDiv = document.getElementById('waste');
    wasteDiv.innerHTML = '';
    if (waste.length) {
      const card = waste[waste.length - 1];
      const cardDiv = createCardDiv(card, null, null, 'waste');
      wasteDiv.appendChild(cardDiv);
    }
  }

  // 建立卡牌 DOM
  function createCardDiv(card, idx, colIdx, area) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card' + (card.faceUp ? ' face-up' : ' face-down');
    if (card.faceUp) {
      cardDiv.setAttribute('data-suit', card.suit);
      // 左上
      const corner = document.createElement('div');
      corner.className = 'card-corner card-corner-tl';
      corner.innerHTML = `<span class="card-rank">${card.rank}</span><span class="card-suit">${card.suit}</span>`;
      cardDiv.appendChild(corner);
      // 右下
      const cornerBR = document.createElement('div');
      cornerBR.className = 'card-corner card-corner-br';
      cornerBR.innerHTML = `<span class="card-rank">${card.rank}</span><br><span class="card-suit">${card.suit}</span>`;
      cardDiv.appendChild(cornerBR);
      // 中央
      const center = document.createElement('div');
      center.className = 'card-center';
      center.textContent =
        card.rank === 'K' ? '🤴' :
        card.rank === 'Q' ? '👸' :
        card.rank === 'J' ? '🃏' : card.suit;
      cardDiv.appendChild(center);
    }
    // 事件
    if (area === 'tableau' && card.faceUp) {
      cardDiv.addEventListener('click', (e) => {
        if (window.justDragged) {
          window.justDragged = false;
          return;
        }
        onTableauCardClick(colIdx, idx);
      });
      cardDiv.addEventListener('mousedown', (e) => onCardMouseDown(e, 'tableau', colIdx, idx));
    }
    if (area === 'foundation' && card.faceUp) {
      cardDiv.addEventListener('click', (e) => {
        if (window.justDragged) {
          window.justDragged = false;
          return;
        }
        onFoundationCardClick(colIdx);
      });
      cardDiv.addEventListener('mousedown', (e) => onCardMouseDown(e, 'foundation', colIdx, idx));
    }
    if (area === 'waste' && card.faceUp) {
      cardDiv.addEventListener('click', (e) => {
        if (window.justDragged) {
          window.justDragged = false;
          return;
        }
        onWasteClick(e);
      });
      cardDiv.addEventListener('mousedown', (e) => onCardMouseDown(e, 'waste', colIdx, idx));
    }
    return cardDiv;
  }

  // 事件處理
  function onTableauCardClick(colIdx, cardIdx) {
    if (!timerInterval) startTimer();
    const col = tableau[colIdx];
    const card = col[cardIdx];
    if (!card.faceUp) return;
    const moving = col.slice(cardIdx);
    if (moving.some(c => !c.faceUp)) return;
    if (moving.length === 1) {
      for (let i = 0; i < 4; i++) {
        if (canMoveToFoundation(card, i)) {
          foundations[i].push(tableau[colIdx].pop());
          if (tableau[colIdx].length && !tableau[colIdx][tableau[colIdx].length - 1].faceUp) {
            tableau[colIdx][tableau[colIdx].length - 1].faceUp = true;
          }
          render();
          checkWin();
          return;
        }
      }
    }
    for (let i = 0; i < 7; i++) {
      if (i !== colIdx && canMoveToTableau(moving[0], i)) {
        tableau[i].push(...moving);
        tableau[colIdx] = col.slice(0, cardIdx);
        if (tableau[colIdx].length && !tableau[colIdx][tableau[colIdx].length - 1].faceUp) {
          tableau[colIdx][tableau[colIdx].length - 1].faceUp = true;
        }
        render();
        return;
      }
    }
  }

  function canMoveToFoundation(card, foundationIdx) {
    if (card.suit !== foundationSuits[foundationIdx]) return false;
    const f = foundations[foundationIdx];
    if (!f.length) return card.rank === 'A';
    const top = f[f.length - 1];
    return top.suit === card.suit && ranks.indexOf(card.rank) === ranks.indexOf(top.rank) + 1;
  }

  function canMoveToTableau(card, tableauIdx) {
    const col = tableau[tableauIdx];
    if (!col.length) return card.rank === 'K';
    const top = col[col.length - 1];
    return top.faceUp && isRed(top.suit) !== isRed(card.suit) &&
      ranks.indexOf(top.rank) === ranks.indexOf(card.rank) + 1;
  }

  function onStockClick() {
    if (stock.length) {
      waste.push({ ...stock.pop(), faceUp: true });
    } else {
      stock = waste.reverse().map(card => ({ ...card, faceUp: false }));
      waste = [];
    }
    render();
  }

  function onWasteClick() {
    if (!waste.length) return;
    const card = waste[waste.length - 1];
    for (let i = 0; i < 4; i++) {
      if (canMoveToFoundation(card, i)) {
        foundations[i].push(waste.pop());
        render();
        checkWin();
        return;
      }
    }
    for (let i = 0; i < 7; i++) {
      if (canMoveToTableau(card, i)) {
        tableau[i].push(waste.pop());
        render();
        return;
      }
    }
  }

  function onFoundationCardClick(foundationIdx) {
    if (!timerInterval) startTimer();
    if (!foundations[foundationIdx].length) return;
    const card = foundations[foundationIdx][foundations[foundationIdx].length - 1];
    for (let i = 0; i < 7; i++) {
      if (canMoveToTableau(card, i)) {
        tableau[i].push(foundations[foundationIdx].pop());
        render();
        return;
      }
    }
    for (let i = 0; i < 4; i++) {
      if (i !== foundationIdx && canMoveToFoundation(card, i)) {
        foundations[i].push(foundations[foundationIdx].pop());
        render();
        checkWin();
        return;
      }
    }
  }

  function checkWin() {
    const allFaceUp = tableau.every(col => col.every(card => card.faceUp));
    if (allFaceUp && !foundations.every(f => f.length === 13)) {
      autoFinish();
    }
    if (foundations.every(f => f.length === 13)) {
      setTimeout(showResult, 100);
    }
  }

  function autoFinish() {
    let moved = false;
    for (let i = 0; i < 7; i++) {
      const col = tableau[i];
      if (col.length) {
        const card = col[col.length - 1];
        for (let j = 0; j < 4; j++) {
          if (canMoveToFoundation(card, j)) {
            foundations[j].push(col.pop());
            moved = true;
            render();
            setTimeout(autoFinish, 120);
            return;
          }
        }
      }
    }
    if (waste.length) {
      const card = waste[waste.length - 1];
      for (let j = 0; j < 4; j++) {
        if (canMoveToFoundation(card, j)) {
          foundations[j].push(waste.pop());
          moved = true;
          render();
          setTimeout(autoFinish, 120);
          return;
        }
      }
    }
    if (!moved && (stock.length > 0 || waste.length > 0)) {
      onStockClick();
      setTimeout(autoFinish, 120);
      return;
    }
    if (!moved && foundations.every(f => f.length === 13)) {
      setTimeout(showResult, 100);
    }
  }

  // 計時器
  function startTimer() {
    if (timerInterval) return;
    timerInterval = setInterval(() => {
      timer++;
      document.getElementById('timer').textContent = timer;
    }, 1000);
  }
  function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
  }
  function resetTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
    timer = 0;
    document.getElementById('timer').textContent = '0';
  }

  function showResult() {
    stopTimer();
    document.getElementById('result-message').textContent = `恭喜完成接龍！總時間：${timer} 秒`;
    document.getElementById('result-page').style.display = 'flex';
  }

  // Undo/Redo
  function undo() {
    if (movesStack.length > 1) {
      redoStack.push(movesStack.pop());
      const prev = movesStack[movesStack.length - 1];
      tableau = JSON.parse(JSON.stringify(prev.tableau));
      foundations = JSON.parse(JSON.stringify(prev.foundations));
      stock = JSON.parse(JSON.stringify(prev.stock));
      waste = JSON.parse(JSON.stringify(prev.waste));
      render(true);
    }
  }
  function redo() {
    if (redoStack.length > 0) {
      const next = redoStack.pop();
      movesStack.push(JSON.parse(JSON.stringify(next)));
      tableau = JSON.parse(JSON.stringify(next.tableau));
      foundations = JSON.parse(JSON.stringify(next.foundations));
      stock = JSON.parse(JSON.stringify(next.stock));
      waste = JSON.parse(JSON.stringify(next.waste));
      render(true);
    }
  }

  // 拖曳影像建立
  function createDragImage(cards) {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.pointerEvents = 'none';
    container.style.zIndex = 9999;
    container.style.left = '0px';
    container.style.top = '0px';
    container.style.width = '90px';
    container.style.height = (120 + (cards.length - 1) * 30) + 'px';
    cards.forEach((card, idx) => {
      const cardDiv = document.createElement('div');
      cardDiv.className = 'card face-up dragging-card';
      cardDiv.style.position = 'absolute';
      cardDiv.style.left = '0px';
      cardDiv.style.top = (idx * 30) + 'px';
      cardDiv.style.width = '90px';
      cardDiv.style.height = '120px';
      cardDiv.style.boxShadow = '0 2px 8px #888';
      cardDiv.setAttribute('data-suit', card.suit);
      const corner = document.createElement('div');
      corner.className = 'card-corner card-corner-tl';
      corner.innerHTML = `<span class="card-rank">${card.rank}</span><span class="card-suit">${card.suit}</span>`;
      cardDiv.appendChild(corner);
      const cornerBR = document.createElement('div');
      cornerBR.className = 'card-corner card-corner-br';
      cornerBR.innerHTML = `<span class="card-rank">${card.rank}</span><br><span class="card-suit">${card.suit}</span>`;
      cardDiv.appendChild(cornerBR);
      const center = document.createElement('div');
      center.className = 'card-center';
      if (card.rank === 'K') center.textContent = '🤴';
      else if (card.rank === 'Q') center.textContent = '👸';
      else if (card.rank === 'J') center.textContent = '🃏';
      else center.textContent = card.suit;
      cardDiv.appendChild(center);
      container.appendChild(cardDiv);
    });
    return container;
  }

  function moveDragImage(x, y) {
    if (dragImage) {
      dragImage.style.left = '0px';
      dragImage.style.top = '0px';
      let zoom = 1;
      const bodyStyle = window.getComputedStyle(document.body);
      if (bodyStyle.zoom) zoom = parseFloat(bodyStyle.zoom);
      dragImage.style.transform = `translate3d(${(x - dragInfo.offsetX) / zoom}px, ${(y - dragInfo.offsetY) / zoom}px, 0)`;
    }
  }

  function onCardMouseDown(e, area, colIdx, cardIdx) {
    if (e.button !== 0) return;
    document.body.style.userSelect = 'none';
    dragInfo = {
      area,
      colIdx,
      cardIdx,
      startX: e.pageX,
      startY: e.pageY,
      dragging: false,
      cards: [],
      downTarget: e.target
    };
    dragInfo.offsetX = 40;
    dragInfo.offsetY = 60;
    if (area === 'tableau') {
      const col = tableau[colIdx];
      if (!col.length || !col[cardIdx].faceUp) return;
      const moving = col.slice(cardIdx);
      if (moving.some(c => !c.faceUp)) return;
      dragInfo.cards = moving;
      dragInfo.fromCardIdx = cardIdx;
    } else if (area === 'waste') {
      if (!waste.length) return;
      dragInfo.cards = [waste[waste.length - 1]];
    } else if (area === 'foundation') {
      const f = foundations[colIdx];
      if (!f.length) return;
      dragInfo.cards = [f[f.length - 1]];
    }
    window.addEventListener('mousemove', onCardMouseMove);
    window.addEventListener('mouseup', onCardMouseUp);
  }

  function onCardMouseMove(e) {
    if (!dragInfo) return;
    const dx = e.pageX - dragInfo.startX;
    const dy = e.pageY - dragInfo.startY;
    const threshold = 8;
    if (!dragInfo.dragging) {
      if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
        dragInfo.dragging = true;
        dragImage = createDragImage(dragInfo.cards);
        document.body.appendChild(dragImage);
        setFoundationPointer(true);
        moveDragImage(e.pageX, e.pageY);
      }
    } else {
      moveDragImage(e.pageX, e.pageY);
    }
  }
  
  // 拖曳時 foundation 顯示 pointer
  function setFoundationPointer(enable) {
    for (let i = 0; i < 4; i++) {
      const fDiv = document.getElementById('foundation' + i);
      if (enable) {
        fDiv.classList.add('drag-pointer');
      } else {
        fDiv.classList.remove('drag-pointer');
      }
    }
  }

  function onCardMouseUp(e) {
    document.body.style.userSelect = '';
    window.removeEventListener('mousemove', onCardMouseMove);
    window.removeEventListener('mouseup', onCardMouseUp);
    if (
      dragInfo &&
      dragInfo.dragging &&
      dragInfo.area === 'waste' &&
      dragInfo.downTarget &&
      dragInfo.downTarget.classList &&
      dragInfo.downTarget.classList.contains('card')
    ) {
      if (dragImage) {
        dragImage.remove();
        dragImage = null;
      }
      if (e && typeof e.preventDefault === 'function') e.preventDefault();
      window.justDragged = true;
      setTimeout(() => { window.justDragged = false; }, 100);
      dragInfo = null;
      return;
    }
    if (!dragInfo || !dragInfo.dragging) {
      window.justDragged = dragInfo && dragInfo.dragging ? true : false;
      dragInfo = null;
      return;
    }
    if (dragImage) {
      dragImage.remove();
      dragImage = null;
    }
    // 取得滑鼠下所有元素，優先判斷最上層的牌
    let dropTargets = document.elementsFromPoint(e.clientX, e.clientY);
    let dropTarget = null;
    let foundFaceDownCard = false;
    // 先找最上層的 .card
    for (let el of dropTargets) {
      if (el.classList && el.classList.contains('card')) {
        // 判斷是否為未翻開的牌（face-down）
        if (el.classList.contains('face-down')) {
          foundFaceDownCard = true;
          break; // 拖到未翻開的牌時，不允許放置
        }
        // 若在 foundation 內，dropTarget 設為 foundation
        const foundationDiv = el.closest('.foundation');
        if (foundationDiv) {
          dropTarget = foundationDiv;
        } else {
          dropTarget = el.closest('.tableau-col');
        }
        break;
      }
    }
    // 若沒找到 .card，找最上層的 .tableau-col 或 .foundation
    if (!dropTarget && !foundFaceDownCard) {
      for (let el of dropTargets) {
        if (el.classList && (el.classList.contains('tableau-col') || el.classList.contains('foundation'))) {
          dropTarget = el;
          break;
        }
      }
    }
    // 如果拖到未翻開的牌，直接禁止放置
    if (foundFaceDownCard || !dropTarget) {
      dragInfo = null;
      return;
    }
    if (dropTarget.classList.contains('tableau-col')) {
      const colIdx = parseInt(dropTarget.dataset.col, 10);
      if (dragInfo.area === 'waste') {
        const card = waste[waste.length - 1];
        // 僅允許放到該列最上層已翻開的牌或空白
        const col = tableau[colIdx];
        if (
          (col.length === 0) ||
          (col.length > 0 && col[col.length - 1].faceUp)
        ) {
          if (canMoveToTableau(card, colIdx)) {
            tableau[colIdx].push(waste.pop());
            render();
          }
        }
      } else if (dragInfo.area === 'tableau') {
        const fromCol = tableau[dragInfo.colIdx];
        const movingCards = fromCol.slice(dragInfo.fromCardIdx);
        if (dragInfo.colIdx !== colIdx && canMoveToTableau(movingCards[0], colIdx)) {
          tableau[colIdx].push(...movingCards);
          tableau[dragInfo.colIdx] = fromCol.slice(0, dragInfo.fromCardIdx);
          if (tableau[dragInfo.colIdx].length && !tableau[dragInfo.colIdx][tableau[dragInfo.colIdx].length - 1].faceUp) {
            tableau[dragInfo.colIdx][tableau[dragInfo.colIdx].length - 1].faceUp = true;
          }
          render();
        }
      }
      if (dragInfo.area === 'foundation') {
        const fromF = foundations[dragInfo.colIdx];
        const card = fromF[fromF.length - 1];
        if (canMoveToTableau(card, colIdx)) {
          tableau[colIdx].push(fromF.pop());
          render();
        }
      }
    } else if (dropTarget.classList.contains('foundation')) {
      const foundationIdx = ['foundation0','foundation1','foundation2','foundation3'].indexOf(dropTarget.id);
      if (foundationIdx !== -1) {
        if (dragInfo.area === 'waste') {
          const card = waste[waste.length - 1];
          if (canMoveToFoundation(card, foundationIdx)) {
            foundations[foundationIdx].push(waste.pop());
            render();
            checkWin();
          }
        } else if (dragInfo.area === 'tableau') {
          const fromCol = tableau[dragInfo.colIdx];
          if (dragInfo.fromCardIdx === fromCol.length - 1) {
            const card = fromCol[fromCol.length - 1];
            if (canMoveToFoundation(card, foundationIdx)) {
              foundations[foundationIdx].push(fromCol.pop());
              if (fromCol.length && !fromCol[fromCol.length - 1].faceUp) {
                fromCol[fromCol.length - 1].faceUp = true;
              }
              render();
              checkWin();
            }
          }
        }
      }
    }
    window.justDragged = true;
    setTimeout(() => { window.justDragged = false; }, 100);
    dragInfo = null;
    setFoundationPointer(false);
  }
  
  // 事件註冊
  window.onload = () => {
    document.getElementById('stock').addEventListener('click', onStockClick);
    document.getElementById('start-button').addEventListener('click', setupGame);
    document.getElementById('result-button').addEventListener('click', setupGame);
    const undoBtn = document.getElementById('undo-button');
    if (undoBtn) undoBtn.addEventListener('click', undo);
    const redoBtn = document.getElementById('redo-button');
    if (redoBtn) redoBtn.addEventListener('click', redo);
    setupGame();
  };