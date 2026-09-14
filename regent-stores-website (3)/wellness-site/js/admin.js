const BUCKET = 'site-media';

// ---------- Auth ----------
async function checkSession() {
  const { data } = await sb.auth.getSession();
  if (data.session) showDashboard();
  else showLogin();
}

function showLogin() {
  document.getElementById('admin-login-view').style.display = 'block';
  document.getElementById('admin-dashboard-view').style.display = 'none';
}

function showDashboard() {
  document.getElementById('admin-login-view').style.display = 'none';
  document.getElementById('admin-dashboard-view').style.display = 'block';
  loadProductsAdmin();
  loadSettingsAdmin();
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');
  errorEl.textContent = '';
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) { errorEl.textContent = error.message; return; }
  showDashboard();
}

async function handleLogout() {
  await sb.auth.signOut();
  showLogin();
}

// ---------- Tabs ----------
function switchTab(tab) {
  document.querySelectorAll('.admin-tabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.admin-panel').forEach((p) => (p.style.display = p.id === `panel-${tab}` ? 'block' : 'none'));
}

// ---------- Image upload helper ----------
async function uploadImage(file, folder) {
  const ext = file.name.split('.').pop();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await sb.storage.from(BUCKET).upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// ---------- Products ----------
let productsCache = [];

async function loadProductsAdmin() {
  const { data, error } = await sb.from('products').select('*').order('sort_order');
  const root = document.getElementById('products-admin-list');
  if (error) { root.innerHTML = `<p class="admin-error">${error.message}</p>`; return; }
  productsCache = data;
  root.innerHTML = data.map((p) => productAdminCard(p)).join('');
}

function productAdminCard(p) {
  return `
  <div class="admin-card" data-id="${p.id}">
    <div class="admin-card-head">
      <div class="admin-row" style="flex:1;">
        <img class="admin-thumb" src="${p.image_url || ''}" alt="">
        <div>
          <label>Replace image</label>
          <input type="file" accept="image/*" onchange="handleProductImage(event, '${p.id}')">
          <div class="field-hint">JPG or PNG. Square-ish or portrait images work best.</div>
        </div>
      </div>
      <label style="display:flex; align-items:center; gap:8px; font-weight:600; font-size:0.85rem;">
        <input type="checkbox" ${p.is_active ? 'checked' : ''} onchange="this.dataset.changed=true">
        Active
      </label>
    </div>

    <label>Product name</label>
    <input type="text" data-field="name" value="${escapeAttr(p.name)}">

    <label>Price (₦)</label>
    <input type="number" data-field="price" value="${p.price}">

    <label>Promo note (e.g. "Buy 1, Get 1 Free")</label>
    <input type="text" data-field="compare_note" value="${escapeAttr(p.compare_note || '')}">

    <label>Short description (shown on product cards)</label>
    <input type="text" data-field="short_description" value="${escapeAttr(p.short_description || '')}">

    <label>Full description (shown on the product page)</label>
    <textarea data-field="description">${p.description || ''}</textarea>

    <label>Details — one per line (shown as a bullet list)</label>
    <textarea data-field="details">${p.details || ''}</textarea>

    <label>Bundle deal (optional — e.g. "buy 2, pay a set price")</label>
    <div class="admin-row" style="grid-template-columns: 1fr 1fr;">
      <div>
        <div class="field-hint">Quantity that triggers the deal</div>
        <input type="number" data-field="bundle_qty" value="${p.bundle_qty ?? ''}" placeholder="e.g. 2">
      </div>
      <div>
        <div class="field-hint">Total price (₦) for that quantity</div>
        <input type="number" data-field="bundle_price" value="${p.bundle_price ?? ''}" placeholder="e.g. 45000">
      </div>
    </div>

    <div class="save-bar">
      <button class="btn btn-primary" onclick="saveProduct('${p.id}', this)">Save changes</button>
      <span class="save-msg" style="display:none;">Saved</span>
    </div>

    <div style="margin-top:24px; border-top:1px solid var(--line); padding-top:16px;">
      <h3 style="font-size:1rem;">Reviews for this product</h3>
      <div id="reviews-${p.id}">Loading reviews…</div>
      <div class="review-row" style="margin-top:12px;">
        <input type="text" placeholder="Author name" id="new-review-author-${p.id}">
        <select id="new-review-rating-${p.id}">
          <option value="5">5 stars</option>
          <option value="4">4 stars</option>
          <option value="3">3 stars</option>
          <option value="2">2 stars</option>
          <option value="1">1 star</option>
        </select>
        <input type="file" accept="image/*" id="new-review-image-${p.id}" style="grid-column: span 2;">
        <button class="icon-btn" onclick="addReview('${p.id}')">Add review</button>
        <textarea placeholder="Review text" id="new-review-body-${p.id}"></textarea>
      </div>
    </div>
  </div>`;
}

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;');
}

async function handleProductImage(event, id) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const url = await uploadImage(file, 'products');
    await sb.from('products').update({ image_url: url }).eq('id', id);
    loadProductsAdmin();
  } catch (err) {
    alert('Image upload failed: ' + err.message);
  }
}

async function saveProduct(id, btn) {
  const card = btn.closest('.admin-card');
  const fields = {};
  card.querySelectorAll('[data-field]').forEach((el) => {
    const isOptionalNumber = el.dataset.field === 'bundle_qty' || el.dataset.field === 'bundle_price';
    if (isOptionalNumber) {
      fields[el.dataset.field] = el.value === '' ? null : Number(el.value);
    } else {
      fields[el.dataset.field] = el.tagName === 'TEXTAREA' || el.type === 'text' ? el.value : Number(el.value);
    }
  });
  fields.is_active = card.querySelector('input[type="checkbox"]').checked;
  fields.updated_at = new Date().toISOString();

  const { error } = await sb.from('products').update(fields).eq('id', id);
  const msg = card.querySelector('.save-msg');
  if (error) { alert('Save failed: ' + error.message); return; }
  msg.style.display = 'inline';
  setTimeout(() => (msg.style.display = 'none'), 2000);
}

// ---------- Reviews ----------
async function loadReviewsFor(productId) {
  const el = document.getElementById(`reviews-${productId}`);
  const { data, error } = await sb.from('reviews').select('*').eq('product_id', productId).order('created_at', { ascending: false });
  if (error) { el.innerHTML = `<p class="admin-error">${error.message}</p>`; return; }
  if (!data.length) { el.innerHTML = '<p class="field-hint">No reviews yet.</p>'; return; }
  el.innerHTML = data.map((r) => `
    <div class="review-row">
      <strong>${r.author}</strong>
      <span>${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
      <span>${r.image_url ? `<img src="${r.image_url}" style="width:36px;height:36px;object-fit:cover;border-radius:4px;">` : ''}</span>
      <button class="icon-btn" onclick="deleteReview('${r.id}', '${productId}')">Delete</button>
      <textarea readonly>${r.body}</textarea>
    </div>
  `).join('');
}

async function addReview(productId) {
  const author = document.getElementById(`new-review-author-${productId}`).value.trim();
  const rating = Number(document.getElementById(`new-review-rating-${productId}`).value);
  const body = document.getElementById(`new-review-body-${productId}`).value.trim();
  const fileInput = document.getElementById(`new-review-image-${productId}`);
  if (!author || !body) { alert('Please fill in the reviewer name and review text.'); return; }

  let image_url = null;
  if (fileInput.files[0]) {
    try { image_url = await uploadImage(fileInput.files[0], 'reviews'); }
    catch (err) { alert('Review image upload failed: ' + err.message); return; }
  }

  const { error } = await sb.from('reviews').insert({ product_id: productId, author, rating, body, image_url });
  if (error) { alert('Could not add review: ' + error.message); return; }
  document.getElementById(`new-review-author-${productId}`).value = '';
  document.getElementById(`new-review-body-${productId}`).value = '';
  fileInput.value = '';
  loadReviewsFor(productId);
}

async function deleteReview(id, productId) {
  if (!confirm('Delete this review?')) return;
  await sb.from('reviews').delete().eq('id', id);
  loadReviewsFor(productId);
}

// ---------- Products: add new ----------
function slugify(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `product-${Date.now()}`;
}

async function createProduct() {
  const name = document.getElementById('new-p-name').value.trim();
  const price = Number(document.getElementById('new-p-price').value);
  const compare_note = document.getElementById('new-p-note').value.trim();
  if (!name || !price) { alert('Please enter at least a product name and price.'); return; }

  const slug = slugify(name);
  const maxSort = productsCache.reduce((m, p) => Math.max(m, p.sort_order || 0), 0);
  const { error } = await sb.from('products').insert({
    slug, name, price, compare_note: compare_note || null,
    short_description: '', description: '', details: '', image_url: '',
    sort_order: maxSort + 1, is_active: true,
  });
  if (error) { alert('Could not add product: ' + error.message); return; }
  document.getElementById('new-p-name').value = '';
  document.getElementById('new-p-price').value = '';
  document.getElementById('new-p-note').value = '';
  const msg = document.getElementById('new-product-msg');
  msg.style.display = 'inline';
  setTimeout(() => (msg.style.display = 'none'), 2500);
  loadProductsAdmin();
}

// ---------- Site settings ----------
async function loadSettingsAdmin() {
  const { data, error } = await sb.from('site_settings').select('*').eq('id', 1).single();
  if (error || !data) return;
  document.getElementById('s-business-name').value = data.business_name || '';
  document.getElementById('s-tagline').value = data.tagline || '';
  document.getElementById('s-about').value = data.about_text || '';
  document.getElementById('s-whatsapp').value = data.whatsapp_number || '';
  document.getElementById('s-order-template').value = data.order_message_template || '';
  document.getElementById('s-email').value = data.contact_email || '';
  document.getElementById('s-instagram').value = data.instagram_url || '';
  if (data.hero_image_url) document.getElementById('s-hero-preview').src = data.hero_image_url;
  if (data.logo_url) document.getElementById('s-logo-preview').src = data.logo_url;
  if (data.about_image_url) document.getElementById('s-about-preview').src = data.about_image_url;

  // now that products loaded, load reviews per product
  productsCache.forEach((p) => loadReviewsFor(p.id));
}

async function handleHeroImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const url = await uploadImage(file, 'site');
    document.getElementById('s-hero-preview').src = url;
    document.getElementById('s-hero-url').value = url;
  } catch (err) {
    alert('Image upload failed: ' + err.message);
  }
}

async function handleLogoImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const url = await uploadImage(file, 'site');
    document.getElementById('s-logo-preview').src = url;
    document.getElementById('s-logo-url').value = url;
  } catch (err) {
    alert('Image upload failed: ' + err.message);
  }
}

async function handleAboutImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const url = await uploadImage(file, 'site');
    document.getElementById('s-about-preview').src = url;
    document.getElementById('s-about-url').value = url;
  } catch (err) {
    alert('Image upload failed: ' + err.message);
  }
}

async function saveSettings(e) {
  e.preventDefault();
  const payload = {
    business_name: document.getElementById('s-business-name').value.trim(),
    tagline: document.getElementById('s-tagline').value.trim(),
    about_text: document.getElementById('s-about').value.trim(),
    whatsapp_number: document.getElementById('s-whatsapp').value.trim(),
    order_message_template: document.getElementById('s-order-template').value.trim(),
    contact_email: document.getElementById('s-email').value.trim(),
    instagram_url: document.getElementById('s-instagram').value.trim(),
    updated_at: new Date().toISOString(),
  };
  const heroUrl = document.getElementById('s-hero-url').value;
  if (heroUrl) payload.hero_image_url = heroUrl;
  const logoUrl = document.getElementById('s-logo-url').value;
  if (logoUrl) payload.logo_url = logoUrl;
  const aboutUrl = document.getElementById('s-about-url').value;
  if (aboutUrl) payload.about_image_url = aboutUrl;

  const { error } = await sb.from('site_settings').update(payload).eq('id', 1);
  const msg = document.getElementById('settings-save-msg');
  if (error) { alert('Save failed: ' + error.message); return; }
  msg.style.display = 'inline';
  setTimeout(() => (msg.style.display = 'none'), 2000);
}

document.addEventListener('DOMContentLoaded', () => {
  checkSession();
  document.getElementById('login-form')?.addEventListener('submit', handleLogin);
  document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
  document.getElementById('settings-form')?.addEventListener('submit', saveSettings);
  document.querySelectorAll('.admin-tabs button').forEach((b) => b.addEventListener('click', () => switchTab(b.dataset.tab)));
});
