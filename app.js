/* =====================================================
   QuickCart: app logic
   1. Data  2. State  3. Helpers  4. Render  5. Events
   ===================================================== */

// ---------- 1. DATA ----------
const FREE_DELIVERY_AT = 199;   // free delivery above this subtotal
const DELIVERY_FEE = 25;
const HANDLING_FEE = 5;

const PAGE_SIZE = 40;           // products shown per "Load more" click
let CATEGORIES = ['All'];       // built from the data after loading

let PRODUCTS = [
  { id: 1,  name: 'Fresh Bananas (Robusta)',   category: 'Fruits & Veg', unit: '6 pcs',   price: 42,  mrp: 50,  emoji: '🍌' },
  { id: 2,  name: 'Red Apples (Shimla)',       category: 'Fruits & Veg', unit: '500 g',   price: 89,  mrp: 110, emoji: '🍎' },
  { id: 3,  name: 'Tomato (Hybrid)',           category: 'Fruits & Veg', unit: '500 g',   price: 28,  mrp: 35,  emoji: '🍅' },
  { id: 4,  name: 'Fresh Spinach',             category: 'Fruits & Veg', unit: '250 g',   price: 25,  mrp: 30,  emoji: '🥬' },
  { id: 5,  name: 'Toned Milk',                category: 'Dairy & Eggs', unit: '500 ml',  price: 29,  mrp: 29,  emoji: '🥛' },
  { id: 6,  name: 'Farm Fresh Eggs',           category: 'Dairy & Eggs', unit: '6 pcs',   price: 54,  mrp: 60,  emoji: '🥚' },
  { id: 7,  name: 'Salted Butter',             category: 'Dairy & Eggs', unit: '100 g',   price: 58,  mrp: 62,  emoji: '🧈' },
  { id: 8,  name: 'Classic Salted Chips',      category: 'Snacks',       unit: '90 g',    price: 30,  mrp: 35,  emoji: '🥔' },
  { id: 9,  name: 'Chocolate Cookies',         category: 'Snacks',       unit: '150 g',   price: 45,  mrp: 50,  emoji: '🍪' },
  { id: 10, name: 'Roasted Peanuts',           category: 'Snacks',       unit: '200 g',   price: 60,  mrp: 70,  emoji: '🥜' },
  { id: 11, name: 'Orange Juice',              category: 'Beverages',    unit: '1 L',     price: 105, mrp: 120, emoji: '🧃' },
  { id: 12, name: 'Cold Coffee',               category: 'Beverages',    unit: '200 ml',  price: 50,  mrp: 55,  emoji: '☕' },
  { id: 13, name: 'Sparkling Water',           category: 'Beverages',    unit: '750 ml',  price: 40,  mrp: 40,  emoji: '💧' },
  { id: 14, name: 'Whole Wheat Bread',         category: 'Bakery',       unit: '400 g',   price: 45,  mrp: 50,  emoji: '🍞' },
  { id: 15, name: 'Butter Croissant',          category: 'Bakery',       unit: '2 pcs',   price: 70,  mrp: 80,  emoji: '🥐' },
  { id: 16, name: 'Dishwash Liquid',           category: 'Household',    unit: '500 ml',  price: 99,  mrp: 125, emoji: '🧴' },
  { id: 17, name: 'Paper Towels',              category: 'Household',    unit: '2 rolls', price: 85,  mrp: 100, emoji: '🧻' },
  { id: 18, name: 'Floor Cleaner',             category: 'Household',    unit: '1 L',     price: 135, mrp: 160, emoji: '🧼' }
];

// ---------- 2. STATE ----------
const state = {
  category: 'All',
  query: '',
  limit: PAGE_SIZE,
  cart: loadCart()   // { productId: quantity }
};

// ---------- 3. HELPERS ----------
const $ = (id) => document.getElementById(id);
const rupee = (n) => '₹' + n.toLocaleString('en-IN');

function loadCart() {
  try { return JSON.parse(localStorage.getItem('quickcart') || '{}'); }
  catch { return {}; }
}
function saveCart() {
  try { localStorage.setItem('quickcart', JSON.stringify(state.cart)); } catch {}
}

function cartLines() {
  return Object.entries(state.cart)
    .map(([id, qty]) => ({ product: PRODUCTS.find((p) => p.id === Number(id)), qty }))
    .filter((l) => l.product);
}

function totals() {
  const lines = cartLines();
  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.qty, 0);
  const empty = subtotal === 0;
  const delivery = empty || subtotal >= FREE_DELIVERY_AT ? 0 : DELIVERY_FEE;
  const handling = empty ? 0 : HANDLING_FEE;
  const count = lines.reduce((sum, l) => sum + l.qty, 0);
  return { subtotal, delivery, handling, grand: subtotal + delivery + handling, count };
}

let toastTimer;
function toast(message) {
  const el = $('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
}

// ---------- 4. RENDER ----------
function renderCategories() {
  $('categories').innerHTML = CATEGORIES.map((c) => {
    const active = c === state.category;
    return `<button data-category="${c}"
      class="shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition
      ${active ? 'border-brand-600 bg-brand-600 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-brand-500'}">
      ${c}</button>`;
  }).join('');
}

function visibleProducts() {
  const q = state.query.trim().toLowerCase();
  return PRODUCTS.filter((p) =>
    (state.category === 'All' || p.category === state.category) &&
    (!q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
  );
}

function actionButton(p) {
  const qty = state.cart[p.id] || 0;
  if (qty === 0) {
    return `<button data-add="${p.id}"
      class="w-full rounded-lg border border-brand-600 bg-brand-50 py-1.5 text-sm font-bold text-brand-600 transition hover:bg-brand-600 hover:text-white">
      ADD</button>`;
  }
  return `<div class="flex items-center justify-between rounded-lg bg-brand-600 text-white">
    <button data-dec="${p.id}" class="px-3 py-1.5 text-lg font-bold" aria-label="Decrease">−</button>
    <span class="text-sm font-bold">${qty}</span>
    <button data-inc="${p.id}" class="px-3 py-1.5 text-lg font-bold" aria-label="Increase">+</button>
  </div>`;
}

function productImage(p) {
  if (!p.image) return p.emoji || '🛒';
  // If the image URL is broken, fall back to a cart emoji
  return `<img src="${escapeHtml(p.image)}" alt="" loading="lazy" class="h-full w-full object-contain"
    onerror="this.replaceWith(document.createTextNode('🛒'))" />`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderProducts() {
  const all = visibleProducts();
  const list = all.slice(0, state.limit);
  $('sectionTitle').textContent = state.category === 'All' ? 'All products' : state.category;
  $('resultCount').textContent = `${all.length} item${all.length === 1 ? '' : 's'}`;
  $('empty').classList.toggle('hidden', all.length > 0);
  $('loadMore').classList.toggle('hidden', all.length <= list.length);

  $('products').innerHTML = list.map((p) => {
    const off = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
    return `<article class="product-card relative flex flex-col rounded-2xl border border-gray-100 bg-white p-3">
      ${off ? `<span class="absolute left-3 top-3 rounded-md bg-accent px-1.5 py-0.5 text-[11px] font-bold text-gray-900">${off}% OFF</span>` : ''}
      <div class="flex h-28 items-center justify-center overflow-hidden rounded-xl bg-gray-50 text-6xl">${productImage(p)}</div>
      <p class="mt-2 text-xs font-medium text-gray-500">⚡ 10 mins</p>
      <h3 class="line-clamp-2 min-h-10 text-sm font-semibold leading-5">${escapeHtml(p.name)}</h3>
      <p class="text-xs text-gray-500">${escapeHtml(p.unit || '')}</p>
      <div class="mb-2 mt-1 flex items-baseline gap-2">
        <span class="text-sm font-bold">${rupee(p.price)}</span>
        ${off ? `<span class="text-xs text-gray-400 line-through">${rupee(p.mrp)}</span>` : ''}
      </div>
      <div class="mt-auto">${actionButton(p)}</div>
    </article>`;
  }).join('');
}

function renderCart() {
  const lines = cartLines();
  const t = totals();

  // Header badge
  const badge = $('cartCount');
  badge.textContent = t.count;
  badge.classList.toggle('hidden', t.count === 0);
  badge.classList.toggle('flex', t.count > 0);
  badge.classList.remove('pop'); void badge.offsetWidth; badge.classList.add('pop');

  // Items
  $('cartItems').innerHTML = lines.length
    ? lines.map(({ product: p, qty }) => `
      <div class="flex items-center gap-3 rounded-xl bg-white p-3">
        <div class="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg bg-gray-50 text-3xl">${productImage(p)}</div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold">${escapeHtml(p.name)}</p>
          <p class="text-xs text-gray-500">${escapeHtml(p.unit || '')}</p>
          <p class="text-sm font-bold">${rupee(p.price * qty)}</p>
        </div>
        <div class="flex items-center rounded-lg bg-brand-600 text-white">
          <button data-dec="${p.id}" class="px-2.5 py-1 font-bold" aria-label="Decrease">−</button>
          <span class="px-1 text-sm font-bold">${qty}</span>
          <button data-inc="${p.id}" class="px-2.5 py-1 font-bold" aria-label="Increase">+</button>
        </div>
      </div>`).join('')
    : `<div class="py-16 text-center text-gray-500">
         <div class="text-6xl">🛒</div>
         <p class="mt-3 font-semibold text-gray-700">Your cart is empty</p>
         <p class="text-sm">Add something fresh to get started.</p>
       </div>`;

  // Free delivery progress
  const remaining = Math.max(FREE_DELIVERY_AT - t.subtotal, 0);
  $('deliveryNote').textContent = t.subtotal === 0
    ? `Free delivery on orders above ${rupee(FREE_DELIVERY_AT)}`
    : remaining > 0
      ? `Add ${rupee(remaining)} more for free delivery`
      : '🎉 You unlocked free delivery!';
  $('progress').style.width = Math.min((t.subtotal / FREE_DELIVERY_AT) * 100, 100) + '%';

  // Bill
  $('subtotal').textContent = rupee(t.subtotal);
  $('deliveryFee').textContent = t.delivery === 0 && t.subtotal > 0 ? 'FREE' : rupee(t.delivery);
  $('handlingFee').textContent = rupee(t.handling);
  $('grandTotal').textContent = rupee(t.grand);
  $('checkout').disabled = t.count === 0;
}

function renderAll() {
  renderProducts();
  renderCart();
}

// ---------- 5. EVENTS ----------
function changeQty(id, delta) {
  const next = (state.cart[id] || 0) + delta;
  if (next <= 0) delete state.cart[id];
  else state.cart[id] = next;
  saveCart();
  renderAll();
}

function openCart() {
  $('cart').classList.add('open');
  $('overlay').classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
}
function closeCart() {
  $('cart').classList.remove('open');
  $('overlay').classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
}

// One click listener handles every ADD / + / − button (event delegation)
document.addEventListener('click', (e) => {
  const add = e.target.closest('[data-add]');
  const inc = e.target.closest('[data-inc]');
  const dec = e.target.closest('[data-dec]');
  const cat = e.target.closest('[data-category]');

  if (add) { changeQty(Number(add.dataset.add), 1); toast('Added to cart'); }
  else if (inc) changeQty(Number(inc.dataset.inc), 1);
  else if (dec) changeQty(Number(dec.dataset.dec), -1);
  else if (cat) { state.category = cat.dataset.category; state.limit = PAGE_SIZE; renderCategories(); renderProducts(); }
});

$('search').addEventListener('input', (e) => { state.query = e.target.value; state.limit = PAGE_SIZE; renderProducts(); });
$('loadMore').addEventListener('click', () => { state.limit += PAGE_SIZE; renderProducts(); });
$('openCart').addEventListener('click', openCart);
$('closeCart').addEventListener('click', closeCart);
$('overlay').addEventListener('click', closeCart);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCart(); });

$('checkout').addEventListener('click', () => {
  const t = totals();
  if (t.count === 0) return;
  state.cart = {};
  saveCart();
  renderAll();
  closeCart();
  toast(`Order placed! ${rupee(t.grand)}. Arriving in 10 mins ⚡`);
});

// ---------- INIT ----------
// Load products.json (made from your Kaggle CSV). If it is missing, keep the built-in demo products.
async function init() {
  try {
    const res = await fetch('products.json');
    if (!res.ok) throw new Error('products.json not found');
    const data = await res.json();
    if (Array.isArray(data) && data.length) PRODUCTS = data;
  } catch (err) {
    console.warn('Using demo products:', err.message);
  }
  // Keep only cart items that still exist in the loaded catalogue
  for (const id of Object.keys(state.cart)) {
    if (!PRODUCTS.some((p) => p.id === Number(id))) delete state.cart[id];
  }
  CATEGORIES = ['All', ...[...new Set(PRODUCTS.map((p) => p.category))].sort()];
  renderCategories();
  renderAll();
}
init();