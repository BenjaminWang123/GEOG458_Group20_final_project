document.addEventListener("DOMContentLoaded", () => {
  const animatedItems = document.querySelectorAll(
    ".glass-card, .page-card, .source-card, .two-column, .hero-text, .hero-panel"
  );

  animatedItems.forEach((item) => {
    item.classList.add("reveal");
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    {
      threshold: 0.12,
    }
  );

  animatedItems.forEach((item) => observer.observe(item));

  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  const navLinks = document.querySelectorAll(".nav-link");

  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;

    const normalized = href.split("/").pop();
    if (normalized === currentPath) {
      link.classList.add("active");
    }
  });
});