# Regent Stores — Website

A two-page beauty, health & wellness website with a Supabase-powered backend
and a private `/admin` dashboard for editing everything without touching code.

## What's inside
- `index.html` — homepage (hero, about, featured products, contact, floating WhatsApp + cart)
- `products.html` — full product catalog
- `product.html` — single product template, served at clean URLs like `/product/collagen-glow-duo`
- `admin.html` — password-protected dashboard to edit products, prices, descriptions, reviews, images and contact info
- `css/style.css` — all styling
- `js/` — site logic (cart, product loading, admin dashboard)
- `sql/schema.sql` — run once in Supabase to create your tables and starter products
- `netlify.toml`, `_redirects`, `build.js` — deployment configuration

## Step 1 — Supabase (your backend & database)

1. Create a free account at **supabase.com** → **New Project**. Choose a name, a database
   password (save it), and a region. Wait for it to finish setting up (~2 minutes).
2. Open **SQL Editor → New query**, paste the entire contents of `sql/schema.sql`,
   and click **Run**. This creates your `products`, `reviews`, and `site_settings`
   tables and adds your 4 starting products (using the real photos bundled in `/assets`).
3. Open **Storage → New bucket**. Name it exactly `site-media` and turn ON
   **Public bucket**. This is where product and site images are stored.
4. Open **Authentication → Users → Add user**. Create yourself an admin account
   with your email and a password — this is what you'll log in with at `/admin`.
5. Open **Project Settings → API** and copy:
   - **Project URL**
   - **anon public** key (do NOT use the "service_role" key anywhere in this project)

## Step 2 — Connect the website to Supabase

**If deploying to Netlify with the included build step (recommended):**
Set these two Netlify environment variables (see Step 3) — nothing to edit here.

**If hosting elsewhere without a build step:**
Open `js/supabase-config.js` and replace the two placeholder values with your
Project URL and anon key, then save.

## Step 3 — Deploy to Netlify

1. Go to **netlify.com** → **Add new site**.
   - Easiest: drag and drop this whole folder onto the "Deploy manually" screen.
   - Or connect it to a GitHub repository for automatic deploys on every change.
2. Go to **Site settings → Environment variables** and add:
   - `SUPABASE_URL` = your Project URL
   - `SUPABASE_ANON_KEY` = your anon public key
3. Make sure the build command is `node build.js` and the publish directory is `.`
   (already set in `netlify.toml` if Netlify detects it automatically).
4. Deploy. Your site is now live on a `netlify.app` address. Add a custom domain
   any time under **Domain settings**.

## Step 4 — Log in and start editing

Visit `yoursite.com/admin`, sign in with the email/password you created in
Supabase Authentication, and you can:
- Edit product names, prices, promo text, descriptions and detail bullet points
- Upload or replace product images
- Add or delete customer reviews per product
- Update your business name, tagline, about text, WhatsApp number, email,
  address, Instagram link, and homepage hero image

All changes save straight to Supabase and appear on the live site immediately —
no redeploying, no code.

## Notes
- The **anon public** key is safe to expose in the website's code — it's
  designed to be public. Access control is enforced by the database's Row
  Level Security rules in `schema.sql`, which only allow edits from a signed-in
  admin.
- Never share your **service_role** key or database password with anyone or
  paste them into this project.
- To change the WhatsApp number product orders are sent to, update it once
  in **Admin → Contact & Site Info** — it updates the floating button, the
  contact section, and the checkout link everywhere.
