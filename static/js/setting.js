document.addEventListener("DOMContentLoaded", function () {
  // UI 元素快取
  const menuItemElemList = document.querySelectorAll(".menu-item");
  const sectionElemList = document.querySelectorAll(".settings-section");
  const profileFormElem = document.querySelector("#profileSection form");
  const passwordFormElem = document.querySelector("#passwordSection form");

  menuItemElemList.forEach((menuItemElem) => {
    menuItemElem.addEventListener("click", function () {
      // Remove active class from all menu items
      menuItemElemList.forEach((elem) => elem.classList.remove("active"));
      // Add active class to the clicked menu item
      this.classList.add("active");

      // Hide all sections
      sectionElemList.forEach((sectionElem) =>
        sectionElem.classList.remove("active")
      );
      // Show the corresponding section
      const sectionId = this.getAttribute("data-section");
      document.getElementById(sectionId + "Section").classList.add("active");
    });
  });

  profileFormElem.addEventListener("submit", function (event) {
    event.preventDefault();
    const formData = new FormData(profileFormElem);
    fetch("/change_profile", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          showPopup(data.error, "error");
        } else if (data.success) {
          showPopup(data.success, "success");
        }
      });
  });

  passwordFormElem.addEventListener("submit", function (event) {
    event.preventDefault();
    const formData = new FormData(passwordFormElem);
    fetch("/change_password", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          showPopup(data.error, "error");
        } else if (data.success) {
          showPopup(data.success, "success");
        }
      });
  });

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
