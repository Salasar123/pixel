// ========================================================
// 1. LLUVIA DE EMOJIS (MANGOS Y HELADOS)
// ========================================================
(function () {
  function startRain() {
    const canvas = document.getElementById('icecream-rain');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const items = ['🥭', '🍦', '🍨', '🍧', '🍓', '✨'];
    let particles = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    class Drop {
      constructor(first = false) {
        this.reset(first);
      }
      reset(first = false) {
        this.x = Math.random() * canvas.width;
        this.y = first ? Math.random() * canvas.height : -30;
        this.size = 20 + Math.random() * 16;
        this.speedY = 1.2 + Math.random() * 2;
        this.speedX = -0.4 + Math.random() * 0.8;
        this.symbol = items[Math.floor(Math.random() * items.length)];
        this.angle = Math.random() * Math.PI * 2;
        this.spin = -0.015 + Math.random() * 0.03;
      }
      update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.angle += this.spin;
        if (this.y > canvas.height + 30) this.reset(false);
      }
      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.font = `${this.size}px "Segoe UI Emoji", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.symbol, 0, 0);
        ctx.restore();
      }
    }

    for (let i = 0; i < 24; i++) particles.push(new Drop(true));

    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      requestAnimationFrame(render);
    }
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startRain);
  } else {
    startRain();
  }
})();

// ========================================================
// 1.5 CARRUSEL DE BIENVENIDA
// ========================================================
(function initHeroCarousel() {
  function start() {
    const carousel = document.getElementById('hero-carousel');
    if (!carousel) return;

    const slides = Array.from(carousel.querySelectorAll('.hc-slide'));
    const dotsWrap = document.getElementById('hc-dots');
    const prevBtn = document.getElementById('hc-prev');
    const nextBtn = document.getElementById('hc-next');
    if (!slides.length || !dotsWrap) return;

    let current = 0;
    let timer = null;
    const AUTOPLAY_MS = 5500;

    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'hc-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Ir a la diapositiva ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    });

    const dots = Array.from(dotsWrap.querySelectorAll('.hc-dot'));

    function render() {
      slides.forEach((s, i) => s.classList.toggle('active', i === current));
      dots.forEach((d, i) => d.classList.toggle('active', i === current));
    }

    function goTo(index) {
      current = (index + slides.length) % slides.length;
      render();
      resetAutoplay();
    }

    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }

    function resetAutoplay() {
      if (timer) clearInterval(timer);
      timer = setInterval(next, AUTOPLAY_MS);
    }

    if (nextBtn) nextBtn.addEventListener('click', next);
    if (prevBtn) prevBtn.addEventListener('click', prev);

    carousel.addEventListener('mouseenter', () => { if (timer) clearInterval(timer); });
    carousel.addEventListener('mouseleave', resetAutoplay);

    render();
    resetAutoplay();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();

// ========================================================
// 2. SISTEMA DE STOCK Y CARRITO DE COMPRAS
// ========================================================
document.addEventListener('DOMContentLoaded', () => {
  const PHONE_NUMBER = "51968135439";

  // Inicialización de Stock en Tarjetas
  const cards = document.querySelectorAll('[data-id][data-stock]');
  const defaults = {};
  cards.forEach(card => {
    const id = card.getAttribute('data-id');
    defaults[id] = parseInt(card.getAttribute('data-stock'), 10) || 0;
  });

  const stock = typeof CarlomangoDB !== 'undefined' ? CarlomangoDB.initStock(defaults) : defaults;

  function renderStockBadge(card, qty) {
    let badge = card.querySelector('.stock-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'stock-badge';
      const target = card.querySelector('.prod-card-content, .welcome-card-body, .promo-price') || card;
      target.insertBefore(badge, target.firstChild);
    }
    badge.classList.remove('stock-high', 'stock-low', 'stock-out');
    if (qty <= 0) {
      badge.textContent = 'Agotado';
      badge.classList.add('stock-out');
    } else if (qty <= 5) {
      badge.textContent = `¡Últimas ${qty} unids!`;
      badge.classList.add('stock-low');
    } else {
      badge.textContent = `Disponible: ${qty} unids`;
      badge.classList.add('stock-high');
    }
  }

  cards.forEach(card => {
    const id = card.getAttribute('data-id');
    renderStockBadge(card, stock[id] ?? 0);
  });

  // GESTIÓN DEL CARRITO
  const cartDrawer = document.getElementById('cart-drawer');
  const cartBackdrop = document.getElementById('cart-backdrop');
  const cartToggleBtn = document.getElementById('cart-toggle-btn');
  const cartCloseBtn = document.getElementById('cart-close-btn');
  const cartItemsContainer = document.getElementById('cart-items');
  const cartTotalEl = document.getElementById('cart-total');
  const cartCountEl = document.getElementById('cart-count');
  const cartCheckoutBtn = document.getElementById('cart-checkout-btn');

  let cart = JSON.parse(localStorage.getItem('carlomango_cart')) || {};

  function saveCart() {
    localStorage.setItem('carlomango_cart', JSON.stringify(cart));
    updateCartUI();
  }

  function openCart() {
    cartDrawer.classList.add('open');
    cartBackdrop.classList.add('open');
  }

  function closeCart() {
    cartDrawer.classList.remove('open');
    cartBackdrop.classList.remove('open');
  }

  if (cartToggleBtn) cartToggleBtn.onclick = openCart;
  if (cartCloseBtn) cartCloseBtn.onclick = closeCart;
  if (cartBackdrop) cartBackdrop.onclick = closeCart;

  function updateCartUI() {
    let count = 0;
    let total = 0;
    cartItemsContainer.innerHTML = '';

    const entries = Object.entries(cart);
    if (entries.length === 0) {
      cartItemsContainer.innerHTML = '<p class="empty-cart-msg">Tu carrito está vacío. ¡Agrega un helado!</p>';
    } else {
      entries.forEach(([id, item]) => {
        count += item.qty;
        total += item.price * item.qty;

        const row = document.createElement('div');
        row.className = 'cart-item';
        row.innerHTML = `
          <div class="ci-info">
            <strong>${item.name}</strong>
            <span>S/ ${(item.price * item.qty).toFixed(2)}</span>
          </div>
          <div class="ci-controls">
            <button class="ci-btn" data-action="minus" data-id="${id}">-</button>
            <span>${item.qty}</span>
            <button class="ci-btn" data-action="plus" data-id="${id}">+</button>
          </div>
        `;
        cartItemsContainer.appendChild(row);
      });
    }

    cartCountEl.textContent = count;
    cartTotalEl.textContent = `S/ ${total.toFixed(2)}`;
  }

  // Delegación para sumar/restar en el carrito
  cartItemsContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.ci-btn');
    if (!btn) return;
    const id = btn.getAttribute('data-id');
    const action = btn.getAttribute('data-action');

    if (action === 'plus') {
      const currentStock = typeof CarlomangoDB !== 'undefined' ? CarlomangoDB.getStock()[id] : 99;
      if (currentStock > 0) {
        cart[id].qty += 1;
        if (typeof CarlomangoDB !== 'undefined') {
          const res = CarlomangoDB.decrementStock(id);
          const card = document.querySelector(`[data-id="${id}"]`);
          if (card) renderStockBadge(card, res.remaining);
        }
      } else {
        alert('No hay más unidades disponibles de este producto.');
      }
    } else if (action === 'minus') {
      cart[id].qty -= 1;
      if (typeof CarlomangoDB !== 'undefined') {
        const updated = CarlomangoDB.restoreStock(id, 1);
        const card = document.querySelector(`[data-id="${id}"]`);
        if (card) renderStockBadge(card, updated);
      }
      if (cart[id].qty <= 0) {
        delete cart[id];
      }
    }
    saveCart();
  });

  // SELECTOR DE CANTIDAD (- / valor / +) en cada tarjeta
  document.querySelectorAll('.qty-selector').forEach(selector => {
    const card = selector.closest('[data-id]');
    if (!card) return;
    const valueEl = selector.querySelector('.qty-value');
    const minusBtn = selector.querySelector('.qty-minus');
    const plusBtn = selector.querySelector('.qty-plus');

    function getMaxQty() {
      const id = card.getAttribute('data-id');
      const currentStock = typeof CarlomangoDB !== 'undefined' ? (CarlomangoDB.getStock()[id] ?? 0) : 99;
      return Math.max(currentStock, 1);
    }

    if (minusBtn) {
      minusBtn.addEventListener('click', () => {
        let qty = parseInt(valueEl.textContent, 10) || 1;
        qty = Math.max(1, qty - 1);
        valueEl.textContent = qty;
      });
    }

    if (plusBtn) {
      plusBtn.addEventListener('click', () => {
        let qty = parseInt(valueEl.textContent, 10) || 1;
        const max = getMaxQty();
        if (qty >= max) {
          alert('No hay más unidades disponibles de este producto.');
          return;
        }
        qty += 1;
        valueEl.textContent = qty;
      });
    }
  });

  // Botones de "Añadir al Carrito" en tarjetas
  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('[data-id]');
      if (!card) return;

      const id = card.getAttribute('data-id');
      const name = card.getAttribute('data-name') || 'Helado artesanal';
      const price = parseFloat(card.getAttribute('data-price')) || 0;

      const qtySelector = card.querySelector('.qty-selector .qty-value');
      let qtyToAdd = qtySelector ? (parseInt(qtySelector.textContent, 10) || 1) : 1;

      const currentStock = typeof CarlomangoDB !== 'undefined' ? (CarlomangoDB.getStock()[id] ?? 0) : 99;
      if (currentStock <= 0) {
        alert('Este producto está agotado por el momento.');
        return;
      }

      if (qtyToAdd > currentStock) qtyToAdd = currentStock;

      if (cart[id]) {
        cart[id].qty += qtyToAdd;
      } else {
        cart[id] = { name, price, qty: qtyToAdd };
      }

      if (typeof CarlomangoDB !== 'undefined') {
        let remaining = currentStock;
        for (let i = 0; i < qtyToAdd; i++) {
          const res = CarlomangoDB.decrementStock(id);
          remaining = res.remaining;
        }
        renderStockBadge(card, remaining);
      }

      // Reinicia el selector de cantidad a 1 tras agregar
      if (qtySelector) qtySelector.textContent = '1';

      saveCart();
      openCart();
    });
  });

  // Enviar pedido por WhatsApp
  if (cartCheckoutBtn) {
    cartCheckoutBtn.addEventListener('click', () => {
      const entries = Object.entries(cart);
      if (entries.length === 0) {
        alert('Tu carrito está vacío.');
        return;
      }

      let text = "¡Hola Helados Carlomango! 🍨 Deseo realizar el siguiente pedido:\n\n";
      let total = 0;
      entries.forEach(([_, item]) => {
        const sub = item.price * item.qty;
        total += sub;
        text += `• ${item.qty}x ${item.name} - S/ ${sub.toFixed(2)}\n`;
      });
      text += `\n*Total a Pagar: S/ ${total.toFixed(2)}*\n`;
      text += "¿Podrían confirmarme la disponibilidad y tiempo de entrega?";

      if (typeof CarlomangoDB !== 'undefined') {
        CarlomangoDB.saveOrder(cart, total);
      }

      const url = `https://api.whatsapp.com/send?phone=${PHONE_NUMBER}&text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    });
  }

  // Pestañas de la carta
  const tabs = document.querySelectorAll('.tab-btn');
  const grids = document.querySelectorAll('.products-grid');
  tabs.forEach(tab => {
    tab.onclick = () => {
      tabs.forEach(t => t.classList.remove('active'));
      grids.forEach(g => g.classList.remove('active'));
      tab.classList.add('active');
      const target = document.getElementById(`cat-${tab.getAttribute('data-target')}`);
      if (target) target.classList.add('active');
    };
  });

  // Menú móvil
  const toggleBtn = document.getElementById('nav-toggle-btn');
  const navLinks = document.getElementById('nav-links');
  if (toggleBtn && navLinks) {
    toggleBtn.onclick = () => navLinks.classList.toggle('nav-open');
    navLinks.querySelectorAll('a').forEach(a => a.onclick = () => navLinks.classList.remove('nav-open'));
  }

  // ======================================================
  // 3. GESTIÓN DE LOGIN Y REGISTRO (CON VENTANA MODAL)
  // ======================================================
  (function initLogin() {
    if (typeof CarlomangoDB === 'undefined') return;

    const openBtn = document.getElementById('login-open-btn');
    const modal = document.getElementById('login-modal');
    const closeBtn = document.getElementById('login-close-btn');
    const userChip = document.getElementById('user-chip');
    const logoutBtn = document.getElementById('logout-btn');

    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');
    const loginError = document.getElementById('login-error');
    const registerError = document.getElementById('register-error');

    if (!openBtn || !modal) {
      console.warn('CarlomangoDB: no se encontró el botón o el modal de inicio de sesión.');
      return;
    }

    function refreshSession() {
      const session = CarlomangoDB.getSession();
      if (session) {
        openBtn.style.display = 'none';
        userChip.style.display = 'inline-flex';
        userChip.querySelector('span').textContent = `Hola, ${session.name.split(' ')[0]}`;
      } else {
        openBtn.style.display = 'inline-flex';
        userChip.style.display = 'none';
      }
    }

    function openModal() { modal.classList.add('open'); }
    function closeModal() {
      modal.classList.remove('open');
      if (loginError) loginError.textContent = '';
      if (registerError) registerError.textContent = '';
    }

    openBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
    });

    if (tabLogin && tabRegister) {
      tabLogin.onclick = () => {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        formLogin.classList.add('active');
        formRegister.classList.remove('active');
      };
      tabRegister.onclick = () => {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        formRegister.classList.add('active');
        formLogin.classList.remove('active');
      };
    }

    if (formLogin) {
      formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const result = await CarlomangoDB.login({ email, password });
        if (!result.ok) {
          loginError.textContent = result.error;
          return;
        }
        formLogin.reset();
        closeModal();
        refreshSession();
      });
    }

    if (formRegister) {
      formRegister.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const phone = document.getElementById('register-phone').value.trim();
        const password = document.getElementById('register-password').value;

        const result = await CarlomangoDB.registerUser({ name, email, password, phone });
        if (!result.ok) {
          registerError.textContent = result.error;
          return;
        }
        formRegister.reset();
        closeModal();
        refreshSession();
      });
    }

    if (logoutBtn) {
      logoutBtn.onclick = () => {
        CarlomangoDB.logout();
        refreshSession();
      };
    }

    refreshSession();
  })();

  updateCartUI();
});