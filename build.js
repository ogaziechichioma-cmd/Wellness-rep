// Runs automatically on Netlify during deploy (see netlify.toml).
// It writes your Supabase URL and anon key (set as Netlify environment
// variables) into js/supabase-config.js, so you never have to edit code.
const fs = require('fs');
const path = require('path');

// The Supabase client appends /rest/v1 itself, so strip it here in case
// the SUPABASE_URL env var was set to the full REST endpoint instead of
// the bare project URL (e.g. "https://xxx.supabase.co/rest/v1/").
const url = (process.env.SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const key = process.env.SUPABASE_ANON_KEY || '';

const content = `// AUTO-GENERATED at deploy time from Netlify environment variables.
// If you are running this site without a build step (plain drag-and-drop),
// replace the two values below directly and do not run build.js.
window.SUPABASE_CONFIG = {
  url: "${url}",
  anonKey: "${key}"
};
`;

fs.writeFileSync(path.join(__dirname, 'js', 'supabase-config.js'), content);
console.log('supabase-config.js written.', url ? '(URL set)' : '(WARNING: SUPABASE_URL is empty)');
