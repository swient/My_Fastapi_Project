function toggleDarkMode() {
  const body = document.body;
  const darkModeToggle = document.getElementById('darkMode');
  const controlBar = document.querySelector('.control-bar');
  const gameTitle = document.querySelectorAll('.game-title');
  
  if (darkModeToggle.checked) {
    body.classList.add('dark-mode');
    controlBar.classList.add('dark-mode'); // 添加 dark-mode 類名到 .control-bar
    gameTitle.forEach(title => title.classList.add('dark-mode')); // 添加 dark-mode 類名到 .game-title
    localStorage.setItem('darkMode', 'enabled'); // 將深色模式設置存儲在本地存儲中
  } else {
    body.classList.remove('dark-mode');
    controlBar.classList.remove('dark-mode'); // 移除 .control-bar 的 dark-mode 類名
    gameTitle.forEach(title => title.classList.remove('dark-mode')); // 移除 .game-title 的 dark-mode 類名
    localStorage.setItem('darkMode', 'disabled'); // 將深色模式設置存儲在本地存儲中
  }
}

// 檢查本地存儲中的深色模式設置並應用
if (localStorage.getItem('darkMode') === 'enabled') {
  document.body.classList.add('dark-mode');
  document.querySelector('.control-bar').classList.add('dark-mode'); // 添加 dark-mode 類名到 .control-bar
  document.querySelectorAll('.game-title').forEach(title => title.classList.add('dark-mode')); // 添加 dark-mode 類名到 .game-title
  document.getElementById('darkMode').checked = true;
}