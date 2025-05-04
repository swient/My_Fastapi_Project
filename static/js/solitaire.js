  // 常數與資料
  const foundationSuits = ['♣', '♦', '♥', '♠'];
  const suits = ['♣', '♦', '♥', '♠'];
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  // 遊戲狀態
  let tableau, foundations, stock, waste, movesStack, redoStack;
  let timer = 0, timerInterval = null;
  let score = 0;

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
    let solvable = false;
    while (!solvable) {
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
      solvable = isSolvable();
    }
    resetTimer();
    score = 0;
    render();

    document.getElementById('result-page').style.display = 'none';
    document.getElementById('reset-button').disabled = false;
  }

  // 快速判斷是否有解
  function isSolvable() {
    // 1. 最上層有A可直接進Foundation
    const tops = tableau.map(col => col[col.length - 1]).filter(Boolean);
    if (tops.some(card => card.rank === 'A')) return true;

    // 2. 計算可移動到Foundation的牌數
    let movableToFoundation = 0;
    for (let i = 0; i < tops.length; i++) {
      if (tops[i].rank === 'A') movableToFoundation++;
      if (tops[i].rank === '2' && foundations.some(f => f.length && f[f.length-1].rank === 'A' && f[f.length-1].suit === tops[i].suit)) movableToFoundation++;
    }
    if (movableToFoundation >= 2) return true;

    // 3. 檢查紅黑交錯且連號的可移動性
    let movableStack = false;
    for (let i = 0; i < tableau.length; i++) {
      const col = tableau[i];
      if (col.length < 2) continue;
      const top = col[col.length - 1];
      const below = col[col.length - 2];
      if (top.faceUp && below.faceUp && isRed(top.suit) !== isRed(below.suit) &&
          ranks.indexOf(below.rank) === ranks.indexOf(top.rank) + 1) {
        movableStack = true;
        break;
      }
    }
    if (movableStack) return true;

    // 4. 蓋著的牌比例過高則判為難解
    const totalCards = tableau.reduce((sum, col) => sum + col.length, 0);
    const faceDownCards = tableau.reduce((sum, col) => sum + col.filter(card => !card.faceUp).length, 0);
    if (faceDownCards / totalCards > 0.7) return false;

    // 5. 預設：有A或可移動堆疊或蓋牌比例不高則判為可解
    return true;
  }

  // 渲染 UI
  function render(isUndo = false) {
    // 儲存狀態
    if (!isUndo) {
      movesStack.push({
        tableau: JSON.parse(JSON.stringify(tableau)),
        foundations: JSON.parse(JSON.stringify(foundations)),
        stock: JSON.parse(JSON.stringify(stock)),
        waste: JSON.parse(JSON.stringify(waste)),
        score: score
      });
      if (movesStack.length > 100) movesStack.shift();
    }
    // 分數顯示
    document.getElementById('score').textContent = score;
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

    // 取得起點卡牌 DOM
    const tableauDiv = document.getElementById('tableau');
    const colDiv = tableauDiv.children[colIdx];
    const cardDiv = colDiv.children[cardIdx];

    // 移動到 foundation
    if (moving.length === 1) {
      for (let i = 0; i < 4; i++) {
        if (canMoveToFoundation(card, i)) {
          const targetDiv = document.getElementById('foundation' + i);
          // 先同步更新資料與 DOM
          foundations[i].push(tableau[colIdx].pop());
          score += 10; // 移到 foundation 加分
          if (tableau[colIdx].length && !tableau[colIdx][tableau[colIdx].length - 1].faceUp) {
            tableau[colIdx][tableau[colIdx].length - 1].faceUp = true;
            score += 5; // 翻開新牌加分
          }
          // 執行動畫
          animateCardMove(cardDiv, targetDiv, card, () => {
            render();
            checkWin();
          });
          return;
        }
      }
    }

    // 移動到其他 tableau
    for (let i = 0; i < 7; i++) {
      if (i !== colIdx && canMoveToTableau(moving[0], i)) {
        // 目標位置：目標疊最後一張牌，若無則該疊 colDiv
        const tableauDiv2 = document.getElementById('tableau');
        const targetColDiv = tableauDiv2.children[i];
        let targetCardDiv = null;
        let tableauOffset = 0;
        if (targetColDiv.children.length > 0) {
          targetCardDiv = targetColDiv.children[targetColDiv.children.length - 1];
          let zoom = 1;
          const bodyStyle = window.getComputedStyle(document.body);
          if (bodyStyle.zoom) zoom = parseFloat(bodyStyle.zoom);
          tableauOffset = 30 / zoom;
        } else {
          targetCardDiv = targetColDiv;
          tableauOffset = 0;
        }
        // 先同步更新資料與 DOM
        tableau[i].push(...moving);
        tableau[colIdx] = col.slice(0, cardIdx);
        if (tableau[colIdx].length && !tableau[colIdx][tableau[colIdx].length - 1].faceUp) {
          tableau[colIdx][tableau[colIdx].length - 1].faceUp = true;
        }
        // 執行動畫
        animateCardMove(cardDiv, targetCardDiv, moving[0], () => {
          render();
        }, tableauOffset, moving);
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
    // 取得 waste 卡牌 DOM
    const wasteDiv = document.getElementById('waste');
    const cardDiv = wasteDiv.querySelector('.card.face-up');
    // 移動到 foundation
    for (let i = 0; i < 4; i++) {
      if (canMoveToFoundation(card, i)) {
        const targetDiv = document.getElementById('foundation' + i);
        // 先同步更新資料與 DOM
        foundations[i].push(waste.pop());
        score += 10;
        // 執行動畫
        animateCardMove(cardDiv, targetDiv, card, () => {
          render();
          checkWin();
        });
        return;
      }
    }
    // 移動到 tableau
    for (let i = 0; i < 7; i++) {
      if (canMoveToTableau(card, i)) {
        const tableauDiv = document.getElementById('tableau');
        const targetColDiv = tableauDiv.children[i];
        let targetCardDiv = null;
        let tableauOffset = 0;
        if (targetColDiv.children.length > 0) {
          targetCardDiv = targetColDiv.children[targetColDiv.children.length - 1];
          let zoom = 1;
          const bodyStyle = window.getComputedStyle(document.body);
          if (bodyStyle.zoom) zoom = parseFloat(bodyStyle.zoom);
          tableauOffset = 30 / zoom;
        } else {
          targetCardDiv = targetColDiv;
          tableauOffset = 0;
        }
        // 先同步更新資料與 DOM
        tableau[i].push(waste.pop());
        // 執行動畫
        animateCardMove(cardDiv, targetCardDiv, card, () => {
          render();
        }, tableauOffset);
        return;
      }
    }
  }

  function onFoundationCardClick(foundationIdx) {
    if (!timerInterval) startTimer();
    if (!foundations[foundationIdx].length) return;
    const card = foundations[foundationIdx][foundations[foundationIdx].length - 1];
    // 取得 foundation 卡牌 DOM
    const foundationDiv = document.getElementById('foundation' + foundationIdx);
    const cardDiv = foundationDiv.querySelector('.card.face-up');
    // 移動到 tableau
    for (let i = 0; i < 7; i++) {
      if (canMoveToTableau(card, i)) {
        const tableauDiv = document.getElementById('tableau');
        const targetColDiv = tableauDiv.children[i];
        let targetCardDiv = null;
        let tableauOffset = 0;
        if (targetColDiv.children.length > 0) {
          targetCardDiv = targetColDiv.children[targetColDiv.children.length - 1];
          let zoom = 1;
          const bodyStyle = window.getComputedStyle(document.body);
          if (bodyStyle.zoom) zoom = parseFloat(bodyStyle.zoom);
          tableauOffset = 30 / zoom;
        } else {
          targetCardDiv = targetColDiv;
          tableauOffset = 0;
        }
        // 先同步更新資料與 DOM
        tableau[i].push(foundations[foundationIdx].pop());
        score -= 10; // 從 foundation 移回 tableau 扣分
        // 執行動畫
        animateCardMove(cardDiv, targetCardDiv, card, () => {
          render();
        }, tableauOffset);
        return;
      }
    }
    // 移動到其他 foundation
    for (let i = 0; i < 4; i++) {
      if (i !== foundationIdx && canMoveToFoundation(card, i)) {
        const targetDiv = document.getElementById('foundation' + i);
        // 先同步更新資料與 DOM
        foundations[i].push(foundations[foundationIdx].pop());
        // 執行動畫
        animateCardMove(cardDiv, targetDiv, card, () => {
          render();
          checkWin();
        });
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
            score += 10;
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
          score += 10;
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
    document.getElementById('result-message').textContent = `恭喜完成接龍！總時間：${timer} 秒，總分數：${score} 分`;
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
      score = prev.score ?? 0;
      score -= 5; // 重作扣5分
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
      score = next.score ?? 0;
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
      cardDiv.style.position = 'fixed';
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

  // 卡牌點擊移動動畫
  function animateCardMove(cardElem, targetElem, cardData, callback, tableauOffset = 0, movingCards = null) {
    // 取得縮放倍率
    let zoom = 1;
    const bodyStyle = window.getComputedStyle(document.body);
    if (bodyStyle.zoom) zoom = parseFloat(bodyStyle.zoom);

    // 起點座標（加上 scroll，並除以 zoom）
    const startRect = cardElem.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;
    const startLeft = (startRect.left + scrollX) / zoom;
    const startTop = (startRect.top + scrollY) / zoom;

    // 終點座標（加上 scroll，並除以 zoom）
    const targetRect = targetElem.getBoundingClientRect();
    let targetLeft = (targetRect.left + scrollX) / zoom;
    let targetTop = (targetRect.top + scrollY) / zoom + tableauOffset / zoom;

    // 判斷是否為多張卡牌動畫
    let animCards = [];
    let total = 1;
    if (Array.isArray(movingCards) && movingCards.length > 1) {
      total = movingCards.length;
      for (let i = 0; i < movingCards.length; i++) {
        const cardDiv = createCardDiv(movingCards[i], i, null, 'tableau');
        cardDiv.style.position = 'absolute';
        cardDiv.style.left = startLeft + 'px';
        cardDiv.style.top = (startTop + i * 30) + 'px';
        cardDiv.style.width = startRect.width / zoom + 'px';
        cardDiv.style.height = startRect.height / zoom + 'px';
        cardDiv.style.margin = '0';
        cardDiv.style.zIndex = 9999 + i;
        cardDiv.style.pointerEvents = 'none';
        animCards.push(cardDiv);
        document.body.appendChild(cardDiv);
      }
    } else {
      // 單張卡牌動畫
      const animCard = cardElem.cloneNode(true);
      animCard.style.position = 'absolute';
      animCard.style.left = startLeft + 'px';
      animCard.style.top = startTop + 'px';
      animCard.style.width = startRect.width / zoom + 'px';
      animCard.style.height = startRect.height / zoom + 'px';
      animCard.style.margin = '0';
      animCard.style.zIndex = 9999;
      animCard.style.pointerEvents = 'none';
      animCards.push(animCard);
      document.body.appendChild(animCard);
    }

    // 動態計算動畫時間（速度：每秒 600px）
    const dx = targetLeft - startLeft;
    const dy = targetTop - startTop;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const speed = 1000; // px/s
    const duration = Math.max(0.15, distance / speed); // 最短 0.15s

    // 強制 reflow
    animCards.forEach(card => card.getBoundingClientRect());
    // 動畫開始時隱藏原卡牌
    if (Array.isArray(movingCards)) {
      movingCards.forEach(card => {
        let selector = `.card.face-up[data-suit="${card.suit}"]`;
        let candidates = Array.from(document.querySelectorAll(selector));
        let match = candidates.find(div => div.textContent.includes(card.rank));
        if (match) match.classList.add('invisible');
      });
    } else if (cardElem) {
      cardElem.classList.add('invisible');
    }

    // 設定動畫終點
    requestAnimationFrame(() => {
      animCards.forEach((card, i) => {
        card.style.left = targetLeft + 'px';
        card.style.top = (targetTop + i * 30) + 'px';
        card.style.transition = `left ${duration}s linear, top ${duration}s linear`;
      });
    });

    // 動畫結束
    let finished = 0;
    animCards.forEach(card => {
      card.addEventListener('transitionend', () => {
        card.remove();
        finished++;
        if (finished === total && callback) callback();
      }, { once: true });
    });
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
        // 拖曳時隱藏原卡牌
        dragInfo.cards.forEach(card => {
          let selector = `.card.face-up[data-suit="${card.suit}"]`;
          let candidates = Array.from(document.querySelectorAll(selector));
          let match = candidates.find(div => div.textContent.includes(card.rank));
          if (match) match.classList.add('invisible');
        });
        dragImage = createDragImage(dragInfo.cards);
        document.body.appendChild(dragImage);
        setFoundationPointer(true);
        moveDragImage(e.clientX, e.clientY);
      }
    } else {
      moveDragImage(e.clientX, e.clientY);
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
    // 拖曳結束顯示原卡牌
    if (dragInfo && dragInfo.cards) {
      dragInfo.cards.forEach(card => {
        let selector = `.card.face-up[data-suit="${card.suit}"]`;
        let candidates = Array.from(document.querySelectorAll(selector));
        let match = candidates.find(div => div.textContent.includes(card.rank));
        if (match) match.classList.remove('invisible');
      });
    }
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