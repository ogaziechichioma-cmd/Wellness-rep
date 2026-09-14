async function loadAllProducts() {
  const grid = document.getElementById('all-products-grid');
  if (!grid) return;
  const { data, error } = await sb.from('products').select('*').eq('is_active', true).order('sort_order');
  if (error || !data) { grid.innerHTML = '<p>Products are loading — please refresh in a moment.</p>'; return; }
  grid.innerHTML = data.map(productCardHTML).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  loadSiteSettings();
  loadAllProducts();
});
