const mobileMenuButton = document.getElementById("mobileMenuBtn");
const mobileMenu = document.getElementById("mobileMenu");
const navbar = document.querySelector(".navbar");
const currentYear = document.getElementById("currentYear");

function setMenuState(isOpen) {
  mobileMenu.classList.toggle("open", isOpen);
  mobileMenuButton.setAttribute("aria-expanded", String(isOpen));
  mobileMenuButton.setAttribute(
    "aria-label",
    isOpen ? "Close navigation" : "Open navigation"
  );
  document.body.classList.toggle("menu-open", isOpen);
}

mobileMenuButton.addEventListener("click", () => {
  setMenuState(!mobileMenu.classList.contains("open"));
});

document.querySelectorAll(".mobile-menu a").forEach((link) => {
  link.addEventListener("click", () => setMenuState(false));
});

window.addEventListener("scroll", () => {
  navbar.classList.toggle("scrolled", window.scrollY > 12);
}, { passive: true });

const revealItems = document.querySelectorAll(
  ".intro-section, .feature-card, .step, .use-case, .developer-card, .cta-card"
);

revealItems.forEach((item) => item.classList.add("reveal"));

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}
