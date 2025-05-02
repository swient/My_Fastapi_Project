// 陀螺穩定區間遊戲主程式（修正版：按下旋轉鈕才開始，難度決定目標框移動速度）
let timer = 0;
let timerInterval = null;
let energy = 50;
let gameActive = false;
let animationFrame = null;
let targetMin = 30;
let targetMax = 60;
let targetWidth = 20;

const difficultyWidthMap = {
    easy: 40,
    medium: 35,
    hard: 30
};
let holding = false;
let started = false;
let targetMoveTimer = null;

function updateEnergyBar() {
    const bar = document.getElementById('energy-bar');
    bar.style.width = energy + '%';
    // 計算能量條與目標區間邊緣的最近距離
    let dist = 0;
    if (energy < targetMin) {
        dist = targetMin - energy;
    } else if (energy > targetMax) {
        dist = energy - targetMax;
    } else {
        dist = Math.min(energy - targetMin, targetMax - energy);
    }
    // 根據距離決定顏色
    if (dist > 10) {
        bar.style.background = '#4caf50'; // 綠色
    } else if (dist > 4) {
        bar.style.background = '#ffc107'; // 橘色
    } else {
        bar.style.background = '#f44336'; // 紅色
    }
}

function updateTargetBox() {
    const box = document.getElementById('target-box');
    box.style.left = targetMin + '%';
    box.style.width = (targetMax - targetMin) + '%';
}

let direction = 1; // 1: 右, -1: 左
let directionCount = 0;
let directionLimit = 30;

function moveTargetBox() {
    // 若達到方向持續次數，隨機換方向與持續次數
    if (directionCount >= directionLimit) {
        direction = Math.random() < 0.5 ? -1 : 1;
        directionLimit = Math.floor(Math.random() * 11) + 10; // 10~20
        directionCount = 0;
    }
    let newMin = targetMin + direction;
    // 邊界反彈
    if (newMin < 0) {
        newMin = 0;
        direction = 1;
        directionLimit = Math.floor(Math.random() * 11) + 10;
        directionCount = 0;
    }
    if (newMin > 100 - targetWidth) {
        newMin = 100 - targetWidth;
        direction = -1;
        directionLimit = Math.floor(Math.random() * 11) + 10;
        directionCount = 0;
    }
    targetMin = newMin;
    targetMax = targetMin + targetWidth;
    directionCount++;
    updateTargetBox();
}

function startTargetMove() {
    moveTargetBox();
    if (targetMoveTimer) clearInterval(targetMoveTimer);
    targetMoveTimer = setInterval(() => {
        moveTargetBox();
    }, 50);
}

function stopTargetMove() {
    if (targetMoveTimer) clearInterval(targetMoveTimer);
}

function resetGame() {
    hideResult();
    stopTimer();
    stopTargetMove();
    energy = 50;
    timer = 0;
    score = 0;
    started = false;
    gameActive = false;
    // 依目前選單設定難度
    const diff = document.getElementById('difficulty').value;
    targetWidth = difficultyWidthMap[diff];
    // 目標區間置中，包住能量條初始值
    targetMin = 50 - targetWidth / 2;
    targetMax = 50 + targetWidth / 2;
    document.getElementById('timer').textContent = '0';
    document.getElementById('score').textContent = '0';
    document.getElementById('spinning-top-img').style.transform = 'rotate(0deg)';
    updateEnergyBar();
    updateTargetBox();
    document.getElementById('spin-button').disabled = false;
}

function startGame() {
    if (started) return;
    started = true;
    gameActive = true;
    timer = 0;
    document.getElementById('timer').textContent = '0';
    startTargetMove();
    loop();
    startTimer();
}

function endGame() {
    gameActive = false;
    started = false;
    stopTimer();
    stopTargetMove();
    cancelAnimationFrame(animationFrame);
    document.getElementById('spin-button').disabled = true;
    let best = parseInt(localStorage.getItem('spinning-top-best-time') || '0', 10);
    if (timer > best) {
        best = timer;
        localStorage.setItem('spinning-top-best-time', best);
    }
    document.getElementById('result-message').textContent =
        `遊戲結束！存活時間：${timer} 秒`;
    document.getElementById('best-score').textContent = '';
    document.getElementById('result-page').style.display = 'flex';
}

function hideResult() {
    document.getElementById('result-page').style.display = 'none';
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timer++;
        score += 2;
        document.getElementById('timer').textContent = timer;
        document.getElementById('score').textContent = score;
    }, 1000);
}

function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
}

function loop() {
    if (!gameActive) return;
    if (holding) {
        energy += 0.5;
    } else {
        energy -= 0.5;
    }
    if (energy > 100) energy = 100;
    if (energy < 0) energy = 0;
    updateEnergyBar();
    if (energy < targetMin || energy > targetMax) {
        endGame();
        return;
    }
    let angle = (100 - energy) * 3 + timer * 360;
    document.getElementById('spinning-top-img').style.transform = `rotate(${angle}deg)`;
    animationFrame = requestAnimationFrame(loop);
}

function onSpinButtonDown() {
    if (!started) startGame();
    holding = true;
}
function onSpinButtonUp() {
    holding = false;
}

document.getElementById('start-button').onclick = () => {
    // 依難度設定目標框寬度
    const diff = document.getElementById('difficulty').value;
    targetWidth = difficultyWidthMap[diff];
    resetGame();
};
document.getElementById('spin-button').onmousedown = onSpinButtonDown;
document.getElementById('spin-button').onmouseup = onSpinButtonUp;
document.getElementById('spin-button').onmouseleave = onSpinButtonUp;
document.getElementById('spin-button').ontouchstart = onSpinButtonDown;
document.getElementById('spin-button').ontouchend = onSpinButtonUp;
document.getElementById('result-button').onclick = () => {
    resetGame();
};

window.onload = () => {
    // 能量條與目標框
    let barWrap = document.createElement('div');
    barWrap.style.width = '400px';
    barWrap.style.height = '22px';
    barWrap.style.background = '#eee';
    barWrap.style.borderRadius = '12px';
    barWrap.style.margin = '0 auto 18px auto';
    barWrap.style.overflow = 'hidden';
    barWrap.style.position = 'relative';
    barWrap.style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)';
    let targetBox = document.createElement('div');
    targetBox.id = 'target-box';
    targetBox.style.position = 'absolute';
    targetBox.style.top = '0';
    targetBox.style.height = '100%';
    targetBox.style.background = 'rgba(0,123,255,0.25)';
    targetBox.style.border = '2px solid #007bff';
    targetBox.style.borderRadius = '10px';
    targetBox.style.pointerEvents = 'none';
    barWrap.appendChild(targetBox);
    let bar = document.createElement('div');
    bar.id = 'energy-bar';
    bar.style.height = '100%';
    bar.style.width = '50%';
    bar.style.background = '#ffc107';
    bar.style.transition = 'width 0.2s';
    barWrap.appendChild(bar);
    let area = document.querySelector('.spinning-top-area');
    area.parentNode.insertBefore(barWrap, area);
    resetGame();
};