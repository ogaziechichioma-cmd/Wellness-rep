// Shared Supabase client. Requires supabase-config.js and the Supabase
// JS CDN script to be loaded on the page before this file.
(function () {
  const cfg = window.SUPABASE_CONFIG || {};
  if (!cfg.url || cfg.url.includes('YOUR_SUPABASE')) {
    console.warn('Supabase is not configured yet. See js/supabase-config.js');
  }
  window.sb = window.supabase.createClient(cfg.url, cfg.anonKey);
})();
