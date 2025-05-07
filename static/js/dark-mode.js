if (localStorage.getItem("darkMode") === "enabled") {
  var link = document.createElement("link");
  link.id = "dark-theme-css";
  link.rel = "stylesheet";
  link.href = "/static/css/dark-mode.css";
  document.head.appendChild(link);
}

function setDarkTheme(enabled) {
  const id = "dark-theme-css";
  let link = document.getElementById(id);

  if (enabled) {
    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = "/static/css/dark-mode.css";
      document.head.appendChild(link);
    }
    localStorage.setItem("darkMode", "enabled");
  } else {
    if (link) link.remove();
    localStorage.setItem("darkMode", "disabled");
  }
}

function toggleDarkMode() {
  const darkModeToggle = document.getElementById("darkMode");
  setDarkTheme(darkModeToggle.checked);
}

// 頁面載入時自動套用
window.addEventListener("DOMContentLoaded", function () {
  const darkMode = localStorage.getItem("darkMode");
  if (darkMode === "enabled") {
    setDarkTheme(true);
    const toggle = document.getElementById("darkMode");
    if (toggle) toggle.checked = true;
  }
});
