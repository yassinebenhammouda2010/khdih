const menuToggle =
    document.getElementById("menu-toggle");

const navbar =
    document.getElementById("navbar");


menuToggle.addEventListener(
    "click",
    () => {

        navbar.classList.toggle("open");


        if (
            navbar.classList.contains("open")
        ) {

            menuToggle.textContent = "✕";

        } else {

            menuToggle.textContent = "☰";

        }

    }
);


// Fermer le menu après avoir
// cliqué sur un lien

const navLinks =
    navbar.querySelectorAll("a");


navLinks.forEach((link) => {

    link.addEventListener(
        "click",
        () => {

            navbar.classList.remove("open");

            menuToggle.textContent = "☰";

        }
    );

});