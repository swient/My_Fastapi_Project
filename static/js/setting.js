document.addEventListener('DOMContentLoaded', function () {
  // UI 元素快取
  const menuItems = document.querySelectorAll('.menu-item');
  const sections = document.querySelectorAll('.settings-section');
  const profileForm = document.querySelector("#profileSection form");
  const passwordForm = document.querySelector("#passwordSection form");
  const profileErrorElement = document.querySelector(".profile-error");
  const profileSuccessElement = document.querySelector(".profile-success");
  const passwordErrorElement = document.querySelector(".password-error");
  const passwordSuccessElement = document.querySelector(".password-success");

  menuItems.forEach(item => {
    item.addEventListener('click', function() {
      // Remove active class from all menu items
      menuItems.forEach(i => i.classList.remove('active'));
      // Add active class to the clicked menu item
      this.classList.add('active');

      // Hide all sections
      sections.forEach(section => section.classList.remove('active'));
      // Show the corresponding section
      const sectionId = this.getAttribute('data-section');
      document.getElementById(sectionId + 'Section').classList.add('active');
    });
  });

  profileForm.addEventListener("submit", function(event) {
    event.preventDefault();
    const formData = new FormData(profileForm);
    fetch("/change_profile", {
      method: "POST",
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        showMessage("error", data.error, profileErrorElement, profileSuccessElement);
      } else if (data.success) {
        showMessage("success", data.success, profileErrorElement, profileSuccessElement);
      }
    });
  });

  passwordForm.addEventListener("submit", function(event) {
    event.preventDefault();
    const formData = new FormData(passwordForm);
    fetch("/change_password", {
      method: "POST",
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        showMessage("error", data.error, passwordErrorElement, passwordSuccessElement);
      } else if (data.success) {
        showMessage("success", data.success, passwordErrorElement, passwordSuccessElement);
      }
    });
  });

  function showMessage(type, message, errorElement, successElement) {
    if (type === "error") {
      errorElement.textContent = message;
      errorElement.style.display = "block";
      successElement.style.display = "none";
    } else if (type === "success") {
      successElement.textContent = message;
      successElement.style.display = "block";
      errorElement.style.display = "none";
    }
    setTimeout(() => {
      errorElement.style.display = "none";
      successElement.style.display = "none";
    }, 3000);
  }
});