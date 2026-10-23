
const menuToggle = document.getElementById("menu-toggle");
const mainNav = document.getElementById("main-nav");

menuToggle.addEventListener("click", function () {
    const menuIsOpen = mainNav.classList.toggle("is-open");

    menuToggle.setAttribute("aria-expanded", menuIsOpen);
    menuToggle.setAttribute(
        "aria-label",
        menuIsOpen ? "Close navigation menu" : "Open navigation menu"
    );
});

mainNav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
        mainNav.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open navigation menu");
    });
});