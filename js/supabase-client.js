// Shared Supabase client. Requires supabase-config.js and the Supabase
// JS CDN script to be loaded on the page before this file.
(function () {
  const cfg = window.SUPABASE_CONFIG || {};
  if (!cfg.url || cfg.url.includes('YOUR_SUPABASE')) {
    console.warn('Supabase is not configured yet. See js/supabase-config.js');
  }
  // The client appends /rest/v1 itself, so strip it if the configured
  // URL already included the REST path (a common copy-paste mistake).
  const baseUrl = (cfg.url || '').replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  window.sb = window.supabase.createClient(baseUrl, cfg.anonKey);
})();
