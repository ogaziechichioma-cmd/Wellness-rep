-- =========================================================
-- Regent Stores - Supabase schema
-- Run this once in Supabase SQL Editor (SQL Editor > New query > Run)
-- =========================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------
-- PRODUCTS
-- ---------------------------------------------------------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  price numeric not null,
  bundle_qty int,
  bundle_price numeric,
  compare_note text,
  short_description text,
  description text,
  details text,
  image_url text,
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------------------------------------------------------
-- REVIEWS  (image_url lets a review show a customer photo)
-- ---------------------------------------------------------
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  author text not null,
  rating int not null check (rating between 1 and 5),
  body text not null,
  image_url text,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- SITE SETTINGS (single row: id = 1)
-- ---------------------------------------------------------
create table if not exists site_settings (
  id int primary key default 1,
  business_name text not null default 'Regent Stores',
  tagline text default 'Your one stop shop for everything beauty, health and wellness.',
  logo_url text,
  hero_image_url text,
  about_image_url text,
  about_text text,
  whatsapp_number text default '2348072335354',
  order_message_template text default 'Hi Regent Stores, I would like to place an order.

Name:
Product(s) + quantity:
Delivery address:

(Please fill in the above and send)',
  contact_email text,
  contact_address text,
  instagram_url text,
  updated_at timestamptz default now(),
  constraint single_row check (id = 1)
);

insert into site_settings (id, business_name, tagline, whatsapp_number, logo_url, hero_image_url, about_image_url, about_text)
values (
  1,
  'Regent Stores',
  'Your one stop shop for everything beauty, health and wellness.',
  '2348072335354',
  '/assets/logo.jpg',
  '/assets/hero.jpg',
  '/assets/product-collagen-alt.jpg',
  'Regent Stores brings you trusted skincare, men''s wellness supplements and intimacy essentials - all in one place, with fast and discreet delivery.'
)
on conflict (id) do nothing;

-- ---------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------
alter table products enable row level security;
alter table reviews enable row level security;
alter table site_settings enable row level security;

drop policy if exists "Public read products" on products;
create policy "Public read products" on products for select using (true);
drop policy if exists "Admin write products" on products;
create policy "Admin write products" on products for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "Public read reviews" on reviews;
create policy "Public read reviews" on reviews for select using (true);
drop policy if exists "Admin write reviews" on reviews;
create policy "Admin write reviews" on reviews for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "Public read settings" on site_settings;
create policy "Public read settings" on site_settings for select using (true);
drop policy if exists "Admin write settings" on site_settings;
create policy "Admin write settings" on site_settings for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ---------------------------------------------------------
-- SEED PRODUCTS (edit freely later from /admin)
-- Image paths point at /assets/... bundled in the project.
-- Replace them any time from the admin dashboard - uploads go to
-- Supabase Storage and instantly override these.
-- ---------------------------------------------------------
insert into products (slug, name, price, bundle_qty, bundle_price, compare_note, short_description, description, details, image_url, sort_order)
values
(
  'collagen-glow-duo',
  'Collagen Glow Duo',
  34500,
  null,
  null,
  'Buy 1, Get 1 FREE',
  'Collagen jelly cream + a free firming serum for firmer, brighter skin.',
  'RoseMine Collagen Jelly Cream is a rich, fast-absorbing formula built on hydrolyzed collagen and niacinamide to hydrate, firm and rejuvenate skin. Every order comes with a free firming serum (NAD+ EGF or CPR Anti-Aging, depending on current stock) worth just as much, so you double the care for your skin at no extra cost.',
  'Contains hydrolyzed collagen and niacinamide
Hydrates, firms and rejuvenates
Suitable for all skin types
Includes 1 free firming serum (a 34,500 naira value, on us)',
  '/assets/product-collagen.jpg',
  1
),
(
  'longjack-performance-combo',
  'Longjack XXXL Performance Combo',
  35000,
  null,
  null,
  '1 Longjack = 1 Free Delay Gel + 2 Free Condoms',
  'Men''s libido and stamina support with delay gel and condoms included.',
  'Longjack XXXL Men Power Booster is formulated to support stamina, drive and performance. Every pack in this combo comes with a free delay gel and two condoms, so you''re fully set from one order.',
  'Supports stamina, strength and performance
Includes 1 free delay gel
Includes 2 free condoms
Discreet packaging on delivery',
  '/assets/product-longjack.jpg',
  2
),
(
  'man-plus-extra-combo',
  'Man Plus Extra Combo',
  35000,
  null,
  null,
  '1 Man Plus Extra = 1 Free Delay Gel + 2 Free Condoms',
  'Men''s performance supplement bundled with delay gel and condoms.',
  'Man Plus Extra is a trusted men''s performance supplement made with 7 natural ingredients, formulated to boost energy, stamina and confidence. This bundle pairs it with a free delay gel and two condoms so you get everything you need in a single order.',
  'Made with 7 natural ingredients, 8050mg extra strength
Supports reproductive health, mood and blood flow
Includes 1 free delay gel
Includes 2 free condoms
Discreet packaging on delivery',
  '/assets/product-manplus.jpg',
  3
),
(
  'intimacy-essentials',
  'Intimacy Essentials Collection',
  25000,
  2,
  45000,
  'Any 2 for 45,000 naira',
  'Premium personal pleasure products, discreetly packaged.',
  'Our intimacy collection covers a range of premium personal pleasure products, each body-safe and rechargeable. Pick a single item for 25,000 naira, or mix and match any two for 45,000 naira - final combo confirmed with our team on WhatsApp at checkout.',
  'Body-safe, rechargeable designs
Multiple styles available - ask us what''s in stock
Single item: 25,000 naira. Any 2 items: 45,000 naira
100% discreet packaging, no branding on the parcel',
  '/assets/product-sextoy.jpg',
  4
)
on conflict (slug) do nothing;

-- ---------------------------------------------------------
-- SEED REVIEWS
-- ---------------------------------------------------------
insert into reviews (product_id, author, rating, body, image_url)
select id, 'Ifeoma K.', 5, 'I can''t stop staring at my skin in the mirror! Three weeks into the Collagen Glow Duo and the difference speaks for itself - smoother, brighter, so much more even. My friends keep asking what I changed. The free serum on top made this an absolute steal. Regent Stores has a customer for life in me!', '/assets/review-testimonial.jpg'
from products where slug = 'collagen-glow-duo'
union all
select id, 'Amaka O.', 5, 'My skin has never felt this firm. The serum absorbs so fast and the BOGO deal is unbeatable.', null
from products where slug = 'collagen-glow-duo'
union all
select id, 'Tunde A.', 5, 'Delivery was discreet and fast. Product works exactly as described.', null
from products where slug = 'longjack-performance-combo'
union all
select id, 'Emeka I.', 4, 'Good value with the free extras included. Would recommend to a friend.', null
from products where slug = 'longjack-performance-combo'
union all
select id, 'Segun B.', 5, 'Solid combo deal, arrived well packaged and unmarked.', null
from products where slug = 'man-plus-extra-combo'
union all
select id, 'Chidinma N.', 5, 'Quality is top notch and it arrived in completely plain packaging. Ordering two together saved me a good amount too.', null
from products where slug = 'intimacy-essentials'
on conflict do nothing;

-- ---------------------------------------------------------
-- STORAGE
-- Create a PUBLIC bucket named "site-media" from the Storage tab
-- in the Supabase dashboard (see README). Anything you upload from
-- /admin lands there and overrides the bundled /assets images above.
-- ---------------------------------------------------------
