// Scroll reveal animation (with a safe fallback for older browsers).
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach(element => observer.observe(element));
} else {
  document.querySelectorAll(".reveal").forEach(element => element.classList.add("visible"));
}

const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

// Accessible responsive navigation and product search.
(() => {
  const menuToggle = document.querySelector(".menu-toggle");
  const mainNav = document.querySelector(".main-nav");
  const dropdown = document.querySelector(".nav-dropdown");
  const dropdownToggle = document.querySelector(".nav-dropdown-toggle");

  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", () => {
      const open = mainNav.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(open));
    });
    mainNav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        mainNav.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  if (dropdown && dropdownToggle) {
    dropdownToggle.addEventListener("click", () => {
      const open = dropdown.classList.toggle("open");
      dropdownToggle.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("click", event => {
      if (!dropdown.contains(event.target)) {
        dropdown.classList.remove("open");
        dropdownToggle.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        dropdown.classList.remove("open");
        dropdownToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  const searchForm = document.querySelector(".site-search");
  if (searchForm) {
    searchForm.addEventListener("submit", event => {
      const input = searchForm.querySelector('input[name="q"]');
      const query = input ? input.value.trim() : "";
      if (!query) {
        event.preventDefault();
        input?.focus();
      }
    });
  }
})();
