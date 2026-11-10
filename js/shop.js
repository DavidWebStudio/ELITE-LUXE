// ELITE LUXE storefront: product filters, search, persistent cart and WhatsApp checkout.
(() => {
  "use strict";

  const WHATSAPP_NUMBER = "2347085408445"; // International format, digits only.
  const CART_KEY = "eliteLuxeCart";
  const products = [
    { id: 1, name: "Signature Evening Dress", price: 45000, category: "clothing" },
    { id: 2, name: "Classic Luxe Handbag", price: 38000, category: "bags" },
    { id: 3, name: "Elegant Heels", price: 32000, category: "shoes" },
    { id: 4, name: "Signature Eau de Parfum", price: 28000, category: "fragrances" },
    { id: 5, name: "Beauty Essentials Set", price: 22000, category: "beauty" },
    { id: 6, name: "Everyday Style Collection", price: 35000, category: "clothing" }
  ];

  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const formatPrice = amount => "₦" + Number(amount || 0).toLocaleString("en-NG");

  let cart = [];
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    cart = Array.isArray(saved) ? saved.filter(item =>
      item && Number.isFinite(Number(item.id)) &&
      Number.isFinite(Number(item.price)) &&
      Number.isFinite(Number(item.quantity)) && Number(item.quantity) > 0
    ) : [];
  } catch {
    cart = [];
  }

  const cartItems = $("#cart-items");
  const cartTotal = $("#cart-total");
  const drawer = $("#cart-drawer");
  const overlay = $("#cart-overlay");

  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
    catch (error) { console.warn("Cart could not be saved in this browser.", error); }
  }

  function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + Number(item.quantity), 0);
    $$(".cart-count").forEach(node => { node.textContent = count; });
  }

  function renderCart() {
    if (!cartItems || !cartTotal) return;
    cartItems.replaceChildren();

    if (!cart.length) {
      const empty = document.createElement("p");
      empty.className = "empty-cart";
      empty.textContent = "Your bag is currently empty.";
      cartItems.appendChild(empty);
      cartTotal.textContent = formatPrice(0);
      return;
    }

    cart.forEach(item => {
      const row = document.createElement("div");
      row.className = "cart-item";
      const details = document.createElement("div");
      const title = document.createElement("h3");
      title.textContent = item.name;
      const price = document.createElement("p");
      price.textContent = `${formatPrice(item.price)} × ${item.quantity}`;
      details.append(title, price);

      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "REMOVE";
      remove.setAttribute("aria-label", `Remove ${item.name} from bag`);
      remove.addEventListener("click", () => removeFromCart(item.id));
      row.append(details, remove);
      cartItems.appendChild(row);
    });

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    cartTotal.textContent = formatPrice(total);
  }

  function openCart() {
    if (!drawer || !overlay) return;
    drawer.classList.add("open");
    overlay.classList.add("open");
    drawer.setAttribute("aria-modal", "true");
    document.body.classList.add("cart-open");
    $("#close-cart")?.focus();
  }

  function closeCart() {
    drawer?.classList.remove("open");
    overlay?.classList.remove("open");
    drawer?.removeAttribute("aria-modal");
    document.body.classList.remove("cart-open");
    $("#open-cart")?.focus();
  }

  function addToCart(productId) {
    const product = products.find(item => item.id === productId);
    if (!product) return;
    const existing = cart.find(item => item.id === productId);
    if (existing) existing.quantity += 1;
    else cart.push({ ...product, quantity: 1 });
    saveCart();
    updateCartCount();
    renderCart();
    openCart();
  }

  function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartCount();
    renderCart();
  }

  $("#open-cart")?.addEventListener("click", event => {
    event.preventDefault();
    openCart();
  });
  $("#close-cart")?.addEventListener("click", closeCart);
  overlay?.addEventListener("click", closeCart);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeCart();
  });

  $$(".add-to-cart").forEach(button => {
    button.addEventListener("click", () => addToCart(Number(button.dataset.id)));
  });

  // Apply category and text search together, so filters never override search.
  const filterButtons = $$(".filter-btn");
  const productCards = $$(".product-card");
  const searchInput = $("#site-search-input");
  let activeCategory = "all";

  function applyProductFilters() {
    const query = (searchInput?.value || "").trim().toLowerCase();
    let visibleCount = 0;

    productCards.forEach(card => {
      const category = (card.dataset.category || "").toLowerCase();
      const searchable = `${card.textContent} ${category}`.toLowerCase();
      const matchesCategory = activeCategory === "all" || category === activeCategory;
      const matchesSearch = !query || searchable.includes(query);
      const visible = matchesCategory && matchesSearch;
      card.hidden = !visible;
      if (visible) visibleCount++;
    });

    let emptyMessage = $("#no-search-results");
    if (!visibleCount) {
      if (!emptyMessage) {
        emptyMessage = document.createElement("p");
        emptyMessage.id = "no-search-results";
        emptyMessage.className = "empty-cart";
        emptyMessage.textContent = "No products match your search. Try another name or category.";
        $("#product-grid")?.after(emptyMessage);
      }
      emptyMessage.hidden = false;
    } else if (emptyMessage) {
      emptyMessage.hidden = true;
    }
  }

  filterButtons.forEach(button => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.filter || "all";
      filterButtons.forEach(item => {
        const selected = item === button;
        item.classList.toggle("active", selected);
        item.setAttribute("aria-pressed", String(selected));
      });
      applyProductFilters();
    });
  });

  const searchForm = $(".site-search");
  searchInput?.addEventListener("input", applyProductFilters);
  searchForm?.addEventListener("submit", event => {
    event.preventDefault();
    applyProductFilters();
    $("#products")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // Support direct links such as shop.html?category=bags&q=leather.
  const params = new URLSearchParams(window.location.search);
  const requestedCategory = params.get("category");
  const requestedQuery = params.get("q");
  if (requestedQuery && searchInput) searchInput.value = requestedQuery;
  if (requestedCategory && filterButtons.some(button => button.dataset.filter === requestedCategory)) {
    activeCategory = requestedCategory;
    filterButtons.forEach(button => {
      const selected = button.dataset.filter === activeCategory;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
  }
  filterButtons.forEach(button => {
    if (!button.hasAttribute("aria-pressed")) {
      button.setAttribute("aria-pressed", String(button.dataset.filter === activeCategory));
    }
  });

  $("#checkout-btn")?.addEventListener("click", () => {
    if (!cart.length) {
      alert("Your shopping bag is empty.");
      return;
    }
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let message = "Hello ELITE LUXE! I would like to place an order:\n\n";
    cart.forEach(item => {
      message += `${item.name} x ${item.quantity} — ${formatPrice(item.price * item.quantity)}\n`;
    });
    message += `\nTOTAL: ${formatPrice(total)}\n\nPlease provide payment and delivery details.`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  });

  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();
  updateCartCount();
  renderCart();
  applyProductFilters();
})();

// Shared responsive navigation and dropdown behaviour.
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
})();
