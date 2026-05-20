// Dynamic Database Product Loader & Real-Time E-Commerce Cart for Mini Cart
// Fetches products from our Python Flask Backend (running locally or deployed on Render)
// Implements a fully-functional cart drawer, LocalStorage persistence, badges, and smooth navigation!
// Equipped with advanced real-time category filtering and live search matching!

const BACKEND_API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.hostname === ""
  ? "http://localhost:5000" 
  : "YOUR_RENDER_BACKEND_URL";

// Global Store State
let allProducts = [];
let cart = JSON.parse(localStorage.getItem("mini_cart_items")) || [];

document.addEventListener("DOMContentLoaded", () => {
  // 1. Inject Styles & HTML for the Cart Drawer
  injectCartDrawerUI();

  // 2. Load and Render products from Backend API
  initializeDynamicProducts();

  // 3. Initialize Cart Functionality & Event Listeners
  initializeCartSystem();
});

// ==========================================
// 1. Dynamic Products Loading & Searching
// ==========================================
async function initializeDynamicProducts() {
  const productGrid = document.querySelector('.product-grid');
  if (!productGrid) return;

  console.log(`Connecting to Mini Cart Python Backend at: ${BACKEND_API_URL}`);
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/products`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    allProducts = await response.json(); // Store in global state
    renderProducts(allProducts, productGrid);
    
    // Once products are loaded, initialize live search and category click filters
    initializeSearch();
    initializeCategoryFilters();
  } catch (error) {
    console.warn("Backend connection failed. Make sure your Python Flask backend is running on http://localhost:5000 !", error);
  }
}

// Render dynamic products list in the DOM
function renderProducts(products, container) {
  if (!products) return;
  container.innerHTML = ""; // Clear placeholders

  products.forEach(product => {
    // Build rating stars HTML
    let ratingStarsHtml = "";
    const rating = product.rating || 5;
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        ratingStarsHtml += '<ion-icon name="star"></ion-icon>\n';
      } else {
        ratingStarsHtml += '<ion-icon name="star-outline"></ion-icon>\n';
      }
    }

    // Build badge HTML if present
    const badgeHtml = product.badge 
      ? `<p class="showcase-badge">${product.badge}</p>` 
      : '';

    // Build price HTML
    const oldPriceHtml = product.oldPrice 
      ? `<del>$${product.oldPrice.toFixed(2)}</del>` 
      : '';

    const showcaseHtml = `
      <div class="showcase" data-id="${product.id}">
        <div class="showcase-banner">
          <img src="${product.imgSrcDefault}" alt="${product.title}" width="300" class="product-img default">
          <img src="${product.imgSrcHover || product.imgSrcDefault}" alt="${product.title}" width="300" class="product-img hover">
          ${badgeHtml}
          <div class="showcase-actions">
            <button class="btn-action">
              <ion-icon name="heart-outline"></ion-icon>
            </button>
            <button class="btn-action">
              <ion-icon name="eye-outline"></ion-icon>
            </button>
            <button class="btn-action">
              <ion-icon name="repeat-outline"></ion-icon>
            </button>
            <button class="btn-action btn-add-cart" onclick="handleAddToCart('${product.id}', '${product.title.replace(/'/g, "\\'")}', ${product.price}, '${product.imgSrcDefault}')">
              <ion-icon name="bag-add-outline"></ion-icon>
            </button>
          </div>
        </div>
        <div class="showcase-content">
          <a href="#new-products" class="showcase-category">${product.category}</a>
          <a href="#new-products">
            <h3 class="showcase-title">${product.title}</h3>
          </a>
          <div class="showcase-rating">
            ${ratingStarsHtml}
          </div>
          <div class="price-box">
            <p class="price">$${product.price.toFixed(2)}</p>
            ${oldPriceHtml}
          </div>
        </div>
      </div>
    `;
    container.innerHTML += showcaseHtml;
  });
}

// ==========================================
// 2. Real-Time Interactive Filters & Search
// ==========================================
function filterProductsByCategory(categoryName) {
  const query = categoryName.trim().toLowerCase();
  console.log(`Filtering by category: ${query}`);

  let filtered = allProducts;
  
  if (query && query !== "all" && query !== "home" && query !== "categories" && query !== "blog" && query !== "hot offers") {
    filtered = allProducts.filter(product => {
      const pTitle = product.title.toLowerCase();
      const pCat = product.category.toLowerCase();
      
      // Match category names, submenus, and flexible keywords
      return pCat.includes(query) || 
             query.includes(pCat) || 
             pTitle.includes(query) ||
             (query === "men's" && (pTitle.includes("men") || pCat === "jacket" || pCat === "shirt")) ||
             (query === "women's" && (pTitle.includes("women") || pCat === "jewelry")) ||
             (query === "footwear" && pCat === "sports") ||
             (query === "formal" && pCat === "shirt") ||
             (query === "casual" && (pCat === "shirt" || pCat === "jacket"));
    });
  }

  // Update Section Title to indicate search results / filter selected
  const titleEl = document.querySelector('#new-products .title');
  if (titleEl) {
    if (query && query !== "all" && query !== "home" && query !== "categories" && query !== "blog" && query !== "hot offers") {
      titleEl.innerHTML = `Showing: ${categoryName} <span style="font-size: 0.8rem; color: #ff4d4d; cursor: pointer; margin-left: 12px; font-weight: 500;" id="reset-filter-btn">(Show All)</span>`;
      
      const resetBtn = document.getElementById("reset-filter-btn");
      if (resetBtn) {
        resetBtn.addEventListener("click", (e) => {
          e.preventDefault();
          filterProductsByCategory("all");
        });
      }
    } else {
      titleEl.textContent = "New Products";
    }
  }

  // Render the matching products
  const container = document.querySelector('.product-grid');
  if (container) {
    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: #666; font-family: 'Poppins', sans-serif;">
          <ion-icon name="alert-circle-outline" style="font-size: 3.5rem; color: #ff4d4d; margin-bottom: 12px;"></ion-icon>
          <p style="font-size: 1.1rem; font-weight: 500; margin-bottom: 5px;">No matching items found</p>
          <p style="font-size: 0.9rem; color: #999;">We couldn't find any products in "${categoryName}".</p>
          <button onclick="window.resetStoreFilters()" style="margin-top: 15px; padding: 8px 18px; background: #222; color: #fff; border: none; border-radius: 4px; font-size: 0.85rem; font-weight: 600; cursor: pointer;">Show All Products</button>
        </div>
      `;
    } else {
      renderProducts(filtered, container);
    }
  }

  // Smooth scroll down to the product display area
  const targetSection = document.getElementById("new-products");
  if (targetSection) {
    targetSection.scrollIntoView({ behavior: "smooth" });
  }
}

function initializeSearch() {
  const searchInput = document.querySelector('.search-field');
  const searchBtn = document.querySelector('.search-btn');

  const executeSearch = () => {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) {
      filterProductsByCategory("all");
      return;
    }

    console.log(`Live searching for: ${query}`);
    const filtered = allProducts.filter(product => {
      return product.title.toLowerCase().includes(query) || 
             product.category.toLowerCase().includes(query);
    });

    // Update section title for search results
    const titleEl = document.querySelector('#new-products .title');
    if (titleEl) {
      titleEl.innerHTML = `Search Results for "${searchInput.value}" <span style="font-size: 0.8rem; color: #ff4d4d; cursor: pointer; margin-left: 12px; font-weight: 500;" id="reset-filter-btn">(Clear Search)</span>`;
      
      const resetBtn = document.getElementById("reset-filter-btn");
      if (resetBtn) {
        resetBtn.addEventListener("click", (e) => {
          e.preventDefault();
          searchInput.value = "";
          filterProductsByCategory("all");
        });
      }
    }

    const container = document.querySelector('.product-grid');
    if (container) {
      if (filtered.length === 0) {
        container.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: #666; font-family: 'Poppins', sans-serif;">
            <ion-icon name="search-outline" style="font-size: 3.5rem; color: #ff4d4d; margin-bottom: 12px;"></ion-icon>
            <p style="font-size: 1.1rem; font-weight: 500; margin-bottom: 5px;">No products match your search</p>
            <p style="font-size: 0.9rem; color: #999;">We couldn't find any items matching "${searchInput.value}".</p>
            <button onclick="window.resetStoreFilters()" style="margin-top: 15px; padding: 8px 18px; background: #222; color: #fff; border: none; border-radius: 4px; font-size: 0.85rem; font-weight: 600; cursor: pointer;">Show All Products</button>
          </div>
        `;
      } else {
        renderProducts(filtered, container);
      }
    }

    // Scroll smoothly to results
    const targetSection = document.getElementById("new-products");
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (searchInput) {
    // Real-time filter as you type
    searchInput.addEventListener("input", executeSearch);
  }
  if (searchBtn) {
    searchBtn.addEventListener("click", (e) => {
      e.preventDefault();
      executeSearch();
    });
  }
}

function initializeCategoryFilters() {
  // Bind all nav links, dropdown menus, accordion sidebar options
  const links = document.querySelectorAll(
    '.desktop-navigation-menu a, .mobile-navigation-menu a, .sidebar-menu-category-list a, .sidebar-submenu-title'
  );
  
  links.forEach(link => {
    link.addEventListener("click", (e) => {
      const text = link.textContent.trim();
      const textLower = text.toLowerCase();
      const href = link.getAttribute("href");

      // If the link goes to a separate section like Blog or Hot Offers/Deals, let the smooth scrolling take care of it!
      if (href === "#blog" || href === "#deal-of-the-day" || textLower === "blog" || textLower === "hot offers" || textLower === "home") {
        return; // Do NOT prevent default or filter products!
      }

      // Skip normal navigational links or outer actions (like external checkout)
      if (href && !href.startsWith("#")) return; 

      e.preventDefault();
      
      // Close side menus if active
      const mobileMenu = document.querySelector('[data-mobile-menu].active');
      const overlay = document.querySelector('[data-overlay].active');
      if (mobileMenu) mobileMenu.classList.remove('active');
      if (overlay) overlay.classList.remove('active');

      filterProductsByCategory(text);
    });
  });
}

window.resetStoreFilters = () => {
  const searchInput = document.querySelector('.search-field');
  if (searchInput) searchInput.value = "";
  filterProductsByCategory("all");
};

// ==========================================
// 3. Shopping Cart Logic (State & Drawer Rendering)
// ==========================================
function updateCartBadges() {
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  const badges = document.querySelectorAll('.action-btn .count');
  badges.forEach(badge => {
    const parentIcon = badge.parentElement.querySelector('ion-icon[name="bag-handle-outline"]');
    if (parentIcon) {
      badge.textContent = totalCount;
    }
  });
}

function saveCartToStorage() {
  localStorage.setItem("mini_cart_items", JSON.stringify(cart));
  updateCartBadges();
}

function handleAddToCart(id, title, price, img) {
  console.log(`Adding to Cart: ${title} - $${price}`);

  const existingItemIndex = cart.findIndex(item => item.id === id);
  if (existingItemIndex > -1) {
    cart[existingItemIndex].quantity += 1;
  } else {
    cart.push({ id, title, price, img, quantity: 1 });
  }

  saveCartToStorage();
  renderCartItems();
  
  showToastNotification(`Added to cart: ${title}`);
}

function renderCartItems() {
  const container = document.getElementById("cart-items-list");
  const totalValElement = document.getElementById("cart-total-val");
  const checkoutBtn = document.getElementById("cart-checkout-btn");
  
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `<p class="cart-empty-msg">Your cart is empty.</p>`;
    totalValElement.textContent = "$0.00";
    checkoutBtn.disabled = true;
    checkoutBtn.style.opacity = "0.5";
    checkoutBtn.style.cursor = "not-allowed";
    return;
  }

  checkoutBtn.disabled = false;
  checkoutBtn.style.opacity = "1";
  checkoutBtn.style.cursor = "pointer";
  container.innerHTML = "";

  let grandTotal = 0;

  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    grandTotal += itemTotal;

    const itemHtml = `
      <div class="cart-item">
        <img src="${item.img}" alt="${item.title}">
        <div class="cart-item-details">
          <div class="cart-item-title">${item.title}</div>
          <div class="cart-item-price">$${item.price.toFixed(2)}</div>
          <div class="cart-item-quantity">
            <button class="cart-qty-btn" onclick="updateQty('${item.id}', -1)">-</button>
            <span class="cart-qty-val">${item.quantity}</span>
            <button class="cart-qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
          </div>
        </div>
        <button class="cart-item-remove" onclick="removeCartItem('${item.id}')">
          <ion-icon name="trash-outline"></ion-icon>
        </button>
      </div>
    `;
    container.innerHTML += itemHtml;
  });

  totalValElement.textContent = `$${grandTotal.toFixed(2)}`;
}

function updateQty(id, change) {
  const itemIndex = cart.findIndex(item => item.id === id);
  if (itemIndex > -1) {
    cart[itemIndex].quantity += change;
    if (cart[itemIndex].quantity <= 0) {
      cart.splice(itemIndex, 1);
    }
    saveCartToStorage();
    renderCartItems();
  }
}

function removeCartItem(id) {
  cart = cart.filter(item => item.id !== id);
  saveCartToStorage();
  renderCartItems();
}

async function placeOrder() {
  const checkoutBtn = document.getElementById("cart-checkout-btn");
  checkoutBtn.textContent = "Processing...";
  checkoutBtn.disabled = true;

  const grandTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  try {
    const response = await fetch(`${BACKEND_API_URL}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: "guest_user",
        total: grandTotal,
        items: cart
      })
    });
    
    const result = await response.json();
    if (response.ok) {
      cart = [];
      saveCartToStorage();
      renderCartItems();
      toggleCartDrawer(false);

      alert(`🎉 Order Placed Successfully!\n\nOrder ID: ${result.orderId}\nThank you for shopping with Mini Cart!`);
    } else {
      alert(`Failed to place order: ${result.error || "Please try again."}`);
    }
  } catch (error) {
    console.error("Order error: ", error);
    alert("Connection to backend failed. Please ensure backend is running!");
  } finally {
    checkoutBtn.textContent = "Place Order & Checkout";
    checkoutBtn.disabled = false;
  }
}

function toggleCartDrawer(isOpen) {
  const drawer = document.getElementById("mini-cart-drawer");
  const overlay = document.getElementById("mini-cart-overlay");
  
  if (drawer && overlay) {
    if (isOpen) {
      drawer.classList.add("active");
      overlay.classList.add("active");
      renderCartItems();
    } else {
      drawer.classList.remove("active");
      overlay.classList.remove("active");
    }
  }
}

window.handleAddToCart = handleAddToCart;
window.updateQty = updateQty;
window.removeCartItem = removeCartItem;
window.placeOrder = placeOrder;

// ==========================================
// 4. Inject CSS and Cart UI Elements
// ==========================================
function injectCartDrawerUI() {
  const style = document.createElement('style');
  style.textContent = `
    /* Cart Drawer Styles */
    .mini-cart-drawer {
      position: fixed;
      top: 0;
      right: -420px;
      width: 400px;
      height: 100%;
      background: #ffffff;
      box-shadow: -5px 0 25px rgba(0,0,0,0.15);
      z-index: 10000;
      transition: right 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      font-family: 'Poppins', sans-serif;
    }
    @media (max-width: 450px) {
      .mini-cart-drawer {
        width: 100%;
        right: -105%;
      }
    }
    .mini-cart-drawer.active {
      right: 0;
    }
    .mini-cart-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      backdrop-filter: blur(2px);
      z-index: 9999;
      display: none;
    }
    .mini-cart-overlay.active {
      display: block;
    }
    .cart-header {
      padding: 20px;
      border-bottom: 1px solid #e8e8e8;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #fafafa;
    }
    .cart-header h3 {
      font-size: 1.15rem;
      font-weight: 600;
      color: #1a1a1a;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .cart-close-btn {
      background: none;
      border: none;
      font-size: 1.7rem;
      cursor: pointer;
      color: #444;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.2s;
    }
    .cart-close-btn:hover {
      color: #ff4d4d;
    }
    .cart-items-container {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    }
    .cart-item {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid #f2f2f2;
    }
    .cart-item img {
      width: 60px;
      height: 60px;
      object-fit: cover;
      border-radius: 6px;
      border: 1px solid #e0e0e0;
      margin-right: 15px;
    }
    .cart-item-details {
      flex: 1;
    }
    .cart-item-title {
      font-size: 0.88rem;
      font-weight: 500;
      color: #222;
      margin-bottom: 3px;
      line-height: 1.3;
    }
    .cart-item-price {
      font-size: 0.88rem;
      font-weight: 600;
      color: #ff4d4d;
    }
    .cart-item-quantity {
      display: flex;
      align-items: center;
      margin-top: 8px;
    }
    .cart-qty-btn {
      width: 22px;
      height: 22px;
      background: #f0f0f0;
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }
    .cart-qty-btn:hover {
      background: #e0e0e0;
    }
    .cart-qty-val {
      margin: 0 10px;
      font-size: 0.85rem;
      font-weight: 500;
      min-width: 15px;
      text-align: center;
    }
    .cart-item-remove {
      background: none;
      border: none;
      cursor: pointer;
      color: #aaa;
      font-size: 1.15rem;
      transition: color 0.2s;
      padding: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .cart-item-remove:hover {
      color: #ff4d4d;
    }
    .cart-footer {
      padding: 20px;
      border-top: 1px solid #e8e8e8;
      background: #fafafa;
    }
    .cart-total-row {
      display: flex;
      justify-content: space-between;
      font-size: 1.05rem;
      font-weight: 600;
      color: #222;
      margin-bottom: 15px;
    }
    .cart-total-price {
      color: #ff4d4d;
    }
    .checkout-btn {
      width: 100%;
      padding: 12px;
      background: #ff4d4d;
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .checkout-btn:hover {
      background: #ff3333;
    }
    .cart-empty-msg {
      text-align: center;
      color: #888;
      margin-top: 50px;
      font-size: 0.9rem;
    }
    /* Toast Notification */
    .mini-cart-toast {
      position: fixed;
      bottom: 25px;
      right: 25px;
      background: #222;
      color: #fff;
      padding: 12px 24px;
      border-radius: 6px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      z-index: 10001;
      display: flex;
      align-items: center;
      gap: 8px;
      transform: translateY(120px);
      opacity: 0;
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s;
      font-family: 'Poppins', sans-serif;
      font-size: 0.9rem;
    }
    .mini-cart-toast.active {
      transform: translateY(0);
      opacity: 1;
    }
    .mini-cart-toast ion-icon {
      font-size: 1.2rem;
      color: #4caf50;
    }
    /* Smooth Scroll */
    html {
      scroll-behavior: smooth;
    }
  `;
  document.head.appendChild(style);

  const drawerHtml = `
    <div class="mini-cart-overlay" id="mini-cart-overlay"></div>
    <div class="mini-cart-drawer" id="mini-cart-drawer">
      <div class="cart-header">
        <h3><ion-icon name="cart-outline"></ion-icon> Shopping Cart</h3>
        <button class="cart-close-btn" id="cart-close-btn">
          <ion-icon name="close-outline"></ion-icon>
        </button>
      </div>
      <div class="cart-items-container" id="cart-items-list">
        <!-- Cart Items list loaded dynamically -->
      </div>
      <div class="cart-footer">
        <div class="cart-total-row">
          <span>Subtotal:</span>
          <span class="cart-total-price" id="cart-total-val">$0.00</span>
        </div>
        <button class="checkout-btn" id="cart-checkout-btn" onclick="placeOrder()">Place Order & Checkout</button>
      </div>
    </div>
    <div class="mini-cart-toast" id="mini-cart-toast">
      <ion-icon name="checkmark-circle-outline"></ion-icon>
      <span id="mini-cart-toast-msg">Item added to cart!</span>
    </div>
  `;
  const containerDiv = document.createElement('div');
  containerDiv.innerHTML = drawerHtml;
  document.body.appendChild(containerDiv);
}

function initializeCartSystem() {
  const overlay = document.getElementById("mini-cart-overlay");
  const closeBtn = document.getElementById("cart-close-btn");

  const cartIconElements = document.querySelectorAll('.action-btn ion-icon[name="bag-handle-outline"]');
  cartIconElements.forEach(icon => {
    const btn = icon.parentElement;
    btn.style.cursor = "pointer";
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      toggleCartDrawer(true);
    });
  });

  if (overlay) overlay.addEventListener("click", () => toggleCartDrawer(false));
  if (closeBtn) closeBtn.addEventListener("click", () => toggleCartDrawer(false));

  updateCartBadges();
}

function showToastNotification(msg) {
  const toast = document.getElementById("mini-cart-toast");
  const msgEl = document.getElementById("mini-cart-toast-msg");
  if (toast && msgEl) {
    msgEl.textContent = msg;
    toast.classList.add("active");
    setTimeout(() => {
      toast.classList.remove("active");
    }, 2500);
  }
}
