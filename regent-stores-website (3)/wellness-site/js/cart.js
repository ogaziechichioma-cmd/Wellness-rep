// ===========================================================
// Cart: stored in localStorage so it survives navigation between
// the home page, products page and individual product pages.
// ===========================================================
const CART_KEY = 'bv_cart_v1';
const WA_FALLBACK_NUMBER = '2348072335354';

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch (e) { return []; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  renderCart();
}

function addToCart(product, qty) {
  qty = qty || 1;
  const cart = getCart();
  const existing = cart.find((i) => i.id === product.id);
  if (existing) existing.qty += qty;
  else cart.push({
    id: product.id,
    name: product.name,
    price: Number(product.price),
    image_url: product.image_url,
    bundle_qty: product.bundle_qty || null,
    bundle_price: product.bundle_price || null,
    qty,
  });
  saveCart(cart);
  openCart();
}

// Applies simple bundle pricing when a product defines bundle_qty/bundle_price
// (e.g. "buy 2 for ₦45,000"). Whole bundles are charged at bundle_price;
// any remainder is charged at the regular unit price.
function lineTotal(item) {
  if (item.bundle_qty && item.bundle_price && item.qty >= item.bundle_qty) {
    const bundles = Math.floor(item.qty / item.bundle_qty);
    const remainder = item.qty % item.bundle_qty;
    return bundles * item.bundle_price + remainder * item.price;
  }
  return item.qty * item.price;
}

function changeQty(id, delta) {
  const cart = getCart();
  const item = cart.find((i) => i.id === id);
  if (!item) return;
  item.qty += delta;
  const next = item.qty <= 0 ? cart.filter((i) => i.id !== id) : cart;
  saveCart(next);
}

function removeFromCart(id) {
  saveCart(getCart().filter((i) => i.id !== id));
}

function cartCount() {
  return getCart().reduce((n, i) => n + i.qty, 0);
}

function cartTotal() {
  return getCart().reduce((n, i) => n + lineTotal(i), 0);
}

function formatNaira(n) {
  return '₦' + Number(n).toLocaleString('en-NG');
}

function openCart() {
  document.getElementById('cart-drawer')?.classList.add('open');
  document.getElementById('cart-overlay')?.classList.add('open');
}
function closeCart() {
  document.getElementById('cart-drawer')?.classList.remove('open');
  document.getElementById('cart-overlay')?.classList.remove('open');
}

function renderCart() {
  const list = document.getElementById('cart-items');
  const countEl = document.getElementById('cart-count');
  const totalEl = document.getElementById('cart-total-amount');
  if (countEl) countEl.textContent = cartCount();
  if (!list) return;

  const cart = getCart();
  if (cart.length === 0) {
    list.innerHTML = '<div class="cart-empty">Your cart is empty. Add a product to get started.</div>';
  } else {
    list.innerHTML = cart.map((i) => `
      <div class="cart-line">
        <img src="${i.image_url || ''}" alt="${i.name}">
        <div class="meta">
          <h4>${i.name}</h4>
          <div class="qty-stepper">
            <button onclick="changeQty('${i.id}', -1)" aria-label="Decrease quantity">−</button>
            <span>${i.qty}</span>
            <button onclick="changeQty('${i.id}', 1)" aria-label="Increase quantity">+</button>
          </div>
          <div>${formatNaira(lineTotal(i))}${i.bundle_qty && i.qty >= i.bundle_qty ? ` <span style="font-size:0.75rem; color:var(--ink-soft);">(bundle applied)</span>` : ''}</div>
          <button class="remove" onclick="removeFromCart('${i.id}')">Remove</button>
        </div>
      </div>
    `).join('');
  }
  if (totalEl) totalEl.textContent = formatNaira(cartTotal());
}

function buildWhatsAppMessage() {
  const cart = getCart();
  if (cart.length === 0) return 'Hi Regent Stores, I would like to place an order.';
  let msg = 'Hi Regent Stores, I would like to order:%0A';
  cart.forEach((i) => {
    msg += `- ${i.name} x${i.qty} (${formatNaira(lineTotal(i))})%0A`;
  });
  msg += `Total: ${formatNaira(cartTotal())}`;
  return msg;
}

function checkoutViaWhatsApp() {
  const number = window.SITE_SETTINGS?.whatsapp_number || WA_FALLBACK_NUMBER;
  const url = `https://wa.me/${number}?text=${buildWhatsAppMessage()}`;
  window.open(url, '_blank');
}

document.addEventListener('DOMContentLoaded', () => {
  renderCart();
  document.getElementById('cart-overlay')?.addEventListener('click', closeCart);
  document.querySelectorAll('[data-open-cart]').forEach((el) => el.addEventListener('click', openCart));
  document.querySelectorAll('[data-close-cart]').forEach((el) => el.addEventListener('click', closeCart));
  document.getElementById('checkout-whatsapp')?.addEventListener('click', checkoutViaWhatsApp);
});
