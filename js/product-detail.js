function getSlugFromPath() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  // Expect /product/<slug>
  const idx = parts.indexOf('product');
  return idx >= 0 && parts[idx + 1] ? decodeURIComponent(parts[idx + 1]) : null;
}

let currentProduct = null;
let currentQty = 1;

function renderStars(rating) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

function renderReviews(reviews) {
  const el = document.getElementById('reviews-list');
  if (!el) return;
  if (!reviews.length) {
    el.innerHTML = '<p>No reviews yet — be the first to order and let us know what you think.</p>';
    return;
  }
  el.innerHTML = reviews.map((r) => `
    <div class="review-card">
      ${r.image_url ? `<img src="${r.image_url}" alt="Photo from ${r.author}" style="width:100%; max-width:220px; border:1px solid var(--line); margin-bottom:12px;">` : ''}
      <div class="stars">${renderStars(r.rating)}</div>
      <p>${r.body}</p>
      <div class="author">${r.author}</div>
    </div>
  `).join('');
}

async function loadProduct() {
  const slug = getSlugFromPath();
  const root = document.getElementById('product-root');
  if (!slug) { root.innerHTML = '<p>Product not found.</p>'; return; }

  const { data: product, error } = await sb.from('products').select('*').eq('slug', slug).eq('is_active', true).single();
  if (error || !product) {
    root.innerHTML = '<div class="wrap"><h2>We couldn\'t find that product.</h2><p><a href="/products.html">Back to all products</a></p></div>';
    return;
  }
  currentProduct = product;
  document.title = product.name + ' — Regent Stores';

  document.getElementById('p-image').src = product.image_url;
  document.getElementById('p-image').alt = product.name;
  document.getElementById('p-name').textContent = product.name;
  document.getElementById('p-description').textContent = product.description || product.short_description || '';
  document.getElementById('p-price').textContent = formatNaira(product.price);
  const promo = document.getElementById('p-promo');
  if (product.compare_note) { promo.textContent = product.compare_note; promo.style.display = 'inline-block'; }
  else promo.style.display = 'none';

  const detailList = document.getElementById('p-details');
  const lines = (product.details || '').split('\n').filter(Boolean);
  detailList.innerHTML = lines.map((l) => `<li>${l}</li>`).join('');

  const { data: reviews } = await sb.from('reviews').select('*').eq('product_id', product.id).order('created_at', { ascending: false });
  renderReviews(reviews || []);
}

function updateQtyDisplay() {
  document.getElementById('p-qty').textContent = currentQty;
}

document.addEventListener('DOMContentLoaded', () => {
  loadSiteSettings();
  loadProduct();

  document.getElementById('qty-minus')?.addEventListener('click', () => {
    if (currentQty > 1) currentQty--;
    updateQtyDisplay();
  });
  document.getElementById('qty-plus')?.addEventListener('click', () => {
    currentQty++;
    updateQtyDisplay();
  });
  document.getElementById('add-to-cart-btn')?.addEventListener('click', () => {
    if (currentProduct) addToCart(currentProduct, currentQty);
  });
});
