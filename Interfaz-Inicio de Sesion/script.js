const registerButton = document.getElementById("register");
const loginButton = document.getElementById("login");
const container = document.getElementById("container");

// Al hacer clic en el botón de "Login", activa la clase para mostrar el login
loginButton.addEventListener("click", () => {
    container.classList.add("right-panel-active");
});

// Al hacer clic en el botón de "Register", desactiva la clase para mostrar el registro
registerButton.addEventListener("click", () => {
    container.classList.remove("right-panel-active");
});