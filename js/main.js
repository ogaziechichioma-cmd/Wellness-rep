function formatPhoneDisplay(number) {
  const digits = String(number).replace(/\D/g, '');
  if (digits.startsWith('234') && digits.length === 13) {
    return '+234 ' + digits.slice(3, 6) + ' ' + digits.slice(6, 9) + ' ' + digits.slice(9);
  }
  return '+' + digits;
}

async function loadSiteSettings() {
  const { data, error } = await sb.from('site_settings').select('*').eq('id', 1).single();
  if (error || !data) return;
  window.SITE_SETTINGS = data;

  document.querySelectorAll('[data-business-name]').forEach((el) => (el.textContent = data.business_name));
  document.querySelectorAll('[data-tagline]').forEach((el) => (el.textContent = data.tagline));
  document.querySelectorAll('[data-about-text]').forEach((el) => (el.textContent = data.about_text || ''));
  document.querySelectorAll('[data-contact-email]').forEach((el) => {
    el.textContent = data.contact_email || '';
    el.href = 'mailto:' + (data.contact_email || '');
  });
  document.querySelectorAll('[data-contact-phone]').forEach((el) => {
    const number = data.whatsapp_number || '2348072335354';
    el.textContent = formatPhoneDisplay(number);
    el.href = 'tel:+' + number;
  });
  const insta = document.querySelector('[data-instagram]');
  if (insta && data.instagram_url) insta.href = data.instagram_url;

  const heroImg = document.querySelector('[data-hero-image]');
  if (heroImg && data.hero_image_url) heroImg.src = data.hero_image_url;

  const aboutImg = document.querySelector('[data-about-image]');
  if (aboutImg && data.about_image_url) aboutImg.src = data.about_image_url;

  document.querySelectorAll('[data-logo]').forEach((el) => {
    if (data.logo_url) { el.src = data.logo_url; el.style.display = ''; }
  });
  if (data.logo_url) {
    let favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = data.logo_url;
  }

  const waNumber = data.whatsapp_number || '2348072335354';
  document.querySelectorAll('[data-wa-link], [data-wa-order-link]').forEach((el) => {
    const orderTemplate = data.order_message_template || "Hi Regent Stores, I'd like to place an order.\n\nName:\nProduct(s) + quantity:\nDelivery address:\n\n(Please fill in the above and send)";
    el.href = `https://wa.me/${waNumber}?text=${encodeURIComponent(orderTemplate)}`;
  });
}

function productCardHTML(p) {
  return `
    <article class="product-card">
      <a class="thumb" href="/product/${p.slug}">
        ${p.compare_note ? `<span class="tag">${p.compare_note}</span>` : ''}
        <img src="${p.image_url}" alt="${p.name}" loading="lazy">
      </a>
      <div class="body">
        <h3><a href="/product/${p.slug}">${p.name}</a></h3>
        <p>${p.short_description || ''}</p>
        <div class="price-row"><span class="price">${formatNaira(p.price)}</span></div>
        <div class="row-actions">
          <button class="btn btn-primary qty-add-btn" onclick='addToCart(${JSON.stringify({ id: p.id, name: p.name, price: p.price, image_url: p.image_url, bundle_qty: p.bundle_qty, bundle_price: p.bundle_price })}, 1)'>Add to cart</button>
          <a class="btn btn-outline" href="/product/${p.slug}">Details</a>
        </div>
      </div>
    </article>
  `;
}

async function loadFeaturedProducts() {
  const grid = document.getElementById('featured-grid');
  if (!grid) return;
  const { data, error } = await sb.from('products').select('*').eq('is_active', true).order('sort_order');
  if (error || !data) { grid.innerHTML = '<p>Products are loading — please refresh in a moment.</p>'; return; }
  grid.innerHTML = data.map(productCardHTML).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  loadSiteSettings();
  loadFeaturedProducts();
});
