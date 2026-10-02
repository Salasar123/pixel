// ========================================================
// BASE DE DATOS LOCAL ROBUSTA - HELADOS CARLOMANGO
// ========================================================

const CarlomangoDB = (function () {
  const KEYS = {
    USERS: 'carlomango_users_db',
    STOCK: 'carlomango_stock_db',
    SESSION: 'carlomango_session',
    CART: 'carlomango_cart_db',
    ORDERS: 'carlomango_orders_db'
  };

  // Helper privado de lectura y escritura
  function _read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.error(`CarlomangoDB: error leyendo ${key}`, e);
      return fallback;
    }
  }

  function _write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`CarlomangoDB: error guardando ${key}`, e);
      return false;
    }
  }

  // Hashing seguro nativo usando Web Crypto API (SHA-256)
  async function _hashPassword(password, salt = 'carlomango_secret_salt_2026') {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ---------------- GESTIÓN DE USUARIOS ----------------

  function getUsers() {
    return _read(KEYS.USERS, []);
  }

  function findUserByEmail(email) {
    if (!email) return null;
    return getUsers().find(u => u.email.trim().toLowerCase() === email.trim().toLowerCase()) || null;
  }

  async function registerUser({ name, email, password, phone = '' }) {
    if (!name || !email || !password) {
      return { ok: false, error: 'Por favor, completa todos los campos requeridos.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.includes('@') || password.length < 5) {
      return { ok: false, error: 'Ingresa un correo válido y contraseña de mínimo 5 caracteres.' };
    }

    if (findUserByEmail(cleanEmail)) {
      return { ok: false, error: 'Ya existe una cuenta registrada con este correo electrónico.' };
    }

    const users = getUsers();
    const passwordHash = await _hashPassword(password);

    const newUser = {
      id: 'usr_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      name: name.trim(),
      email: cleanEmail,
      phone: phone.trim(),
      passwordHash: passwordHash,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    _write(KEYS.USERS, users);

    const sessionData = { id: newUser.id, name: newUser.name, email: newUser.email, phone: newUser.phone };
    _write(KEYS.SESSION, sessionData);

    return { ok: true, user: sessionData };
  }

  async function login({ email, password }) {
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const user = findUserByEmail(cleanEmail);

    if (!user) {
      return { ok: false, error: 'Correo o contraseña incorrectos.' };
    }

    const incomingHash = await _hashPassword(password);
    
    // Compatibilidad en caso de migración de registros anteriores
    const isMatch = user.passwordHash 
      ? user.passwordHash === incomingHash 
      : user.password === btoa(password);

    if (!isMatch) {
      return { ok: false, error: 'Correo o contraseña incorrectos.' };
    }

    const session = { id: user.id, name: user.name, email: user.email, phone: user.phone || '' };
    _write(KEYS.SESSION, session);
    return { ok: true, user: session };
  }

  function getSession() {
    return _read(KEYS.SESSION, null);
  }

  function logout() {
    localStorage.removeItem(KEYS.SESSION);
  }

  // ---------------- CONTROL DE STOCK ----------------

  function initStock(defaults) {
    const current = _read(KEYS.STOCK, null);
    if (!current) {
      _write(KEYS.STOCK, defaults);
      return { ...defaults };
    }

    let changed = false;
    Object.keys(defaults).forEach(id => {
      if (!(id in current)) {
        current[id] = defaults[id];
        changed = true;
      }
    });

    if (changed) _write(KEYS.STOCK, current);
    return current;
  }

  function getStock() {
    return _read(KEYS.STOCK, {});
  }

  function decrementStock(id, qty = 1) {
    const stock = getStock();
    const currentQty = stock[id] ?? 0;

    if (currentQty >= qty) {
      stock[id] = currentQty - qty;
      _write(KEYS.STOCK, stock);
      return { ok: true, remaining: stock[id] };
    }
    return { ok: false, remaining: currentQty, error: 'Sin stock suficiente' };
  }

  function restoreStock(id, qty = 1) {
    const stock = getStock();
    stock[id] = (stock[id] ?? 0) + qty;
    _write(KEYS.STOCK, stock);
    return stock[id];
  }

  function setStock(id, qty) {
    const stock = getStock();
    stock[id] = Math.max(0, parseInt(qty, 10) || 0);
    _write(KEYS.STOCK, stock);
    return stock[id];
  }

  // ---------------- HISTORIAL DE PEDIDOS ----------------

  function saveOrder(cartItems, total, customerNotes = '') {
    const session = getSession();
    const orders = _read(KEYS.ORDERS, []);

    const newOrder = {
      orderId: 'ORD-' + Date.now(),
      date: new Date().toLocaleString(),
      user: session ? { name: session.name, email: session.email, phone: session.phone } : 'Invitado',
      items: cartItems,
      total: parseFloat(total).toFixed(2),
      notes: customerNotes,
      status: 'Enviado a WhatsApp'
    };

    orders.unshift(newOrder);
    _write(KEYS.ORDERS, orders);
    return newOrder;
  }

  function getOrders() {
    return _read(KEYS.ORDERS, []);
  }

  return {
    // Autenticación
    registerUser,
    login,
    logout,
    getSession,
    getUsers,
    // Stock
    initStock,
    getStock,
    decrementStock,
    restoreStock,
    setStock,
    // Pedidos
    saveOrder,
    getOrders
  };
})();