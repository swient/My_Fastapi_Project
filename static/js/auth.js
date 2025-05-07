document.addEventListener("DOMContentLoaded", function () {
  // 登入表單
  const loginFormElem = document.querySelector(
    "form.login-form[action='/login']"
  );
  if (loginFormElem) {
    loginFormElem.addEventListener("submit", function (event) {
      event.preventDefault();
      const formData = new FormData(loginFormElem);
      fetch("/login", {
        method: "POST",
        body: formData,
      })
        .then((response) =>
          response.json().then((data) => ({ status: response.status, ...data }))
        )
        .then((data) => {
          if (data.success) {
            showPopup(data.success, "success");
            setTimeout(() => {
              window.location.href = data.redirect || "/";
            }, 1000);
          } else if (data.error) {
            showPopup(data.error, "error");
          }
        });
    });
  }

  // 註冊表單
  const registerFormElem = document.querySelector(
    "form.register-form[action='/register']"
  );
  if (registerFormElem) {
    registerFormElem.addEventListener("submit", function (event) {
      event.preventDefault();
      const formData = new FormData(registerFormElem);
      fetch("/register", {
        method: "POST",
        body: formData,
      })
        .then((response) =>
          response.json().then((data) => ({ status: response.status, ...data }))
        )
        .then((data) => {
          if (data.success) {
            showPopup(data.success, "success");
            setTimeout(() => {
              window.location.href = data.redirect || "/login";
            }, 1000);
          } else if (data.error) {
            showPopup(data.error, "error");
          }
        });
    });
  }

  function showPopup(message, type) {
    const popupElem = document.querySelector(".auth-popup");
    const iconElem = popupElem.querySelector(".auth-popup-icon");
    const messageElem = popupElem.querySelector(".auth-popup-message");

    // 設定訊息
    messageElem.textContent = message;

    // 設定圖示和樣式
    if (type === "success") {
      iconElem.textContent = "✅";
      popupElem.classList.remove("error");
      popupElem.classList.add("success");
    } else if (type === "error") {
      iconElem.textContent = "⛔";
      popupElem.classList.remove("success");
      popupElem.classList.add("error");
    } else {
      iconElem.textContent = "";
      popupElem.classList.remove("success", "error");
    }

    // 顯示 popup
    popupElem.style.display = "block";

    // 自動隱藏
    setTimeout(() => {
      popupElem.style.display = "none";
    }, 2000);
  }
});
