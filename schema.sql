-- ==============================================================================
-- ADCEYLORA ECO FOOD - Supabase Database Schema
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ==============================================================================

-- Clean up existing tables if needed
drop table if exists sales cascade;
drop table if exists products cascade;
drop table if exists categories cascade;

-- 1. Categories Table
create table categories (
    id text primary key,
    name text unique not null,
    "desc" text,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Products Table
create table products (
    id text primary key,
    sku text unique not null,
    name text not null,
    category text references categories(name) on update cascade on delete set null,
    cost numeric(10, 2) not null default 0,
    price numeric(10, 2) not null default 0,
    stock integer not null default 0,
    min_stock integer not null default 10,
    date_added date default current_date,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Sales Table
create table sales (
    id text primary key,
    date text not null,
    timestamp timestamp with time zone default timezone('utc'::text, now()),
    items jsonb not null default '[]'::jsonb,
    total numeric(10, 2) not null default 0,
    method text default 'මුදල් (Cash)'
);

-- 4. Enable Row Level Security (RLS)
alter table categories enable row level security;
alter table products enable row level security;
alter table sales enable row level security;

-- 5. Public read/write policies (anon key enabled)
create policy "Public Access Categories" on categories for all using (true) with check (true);
create policy "Public Access Products" on products for all using (true) with check (true);
create policy "Public Access Sales" on sales for all using (true) with check (true);

-- 6. Pre-seed Default Categories for ADCEYLORA ECO FOOD
insert into categories (id, name, "desc") values
('cat-1', 'Dehydrated Foods (විජලනය කළ ආහාර)', 'විජලනය කළ කොස්, පළතුරු සහ එළවළු'),
('cat-2', 'Herbal & Ayurvedic (දේශීය ඖෂධීය කුඩු)', 'හීන් බෝවිටියා, මුරුංගා ආදී ඖෂධීය කුඩු'),
('cat-3', 'Spices & Seasonings (කුළුබඩු)', 'පිරිසිදු ලංකා කුරුඳු, ගම්මිරිස් සහ තුනපහ'),
('cat-4', 'Healthy Snacks (කෙටි ආහාර)', 'ස්වාභාවික බතල සහ මඤ්ඤොක්කා චිප්ස්');

-- 7. Pre-seed Default Products
insert into products (id, sku, name, category, cost, price, stock, min_stock, date_added) values
('prod-1', 'DF-JACK-100', 'විජලනය කළ කොස් (Dehydrated Jackfruit 100g)', 'Dehydrated Foods (විජලනය කළ ආහාර)', 350.00, 650.00, 18, 25, '2026-10-15'),
('prod-2', 'HB-POW-50', 'හීන් බෝවිටියා කුඩු (Heen Bovitiya Powder 50g)', 'Herbal & Ayurvedic (දේශීය ඖෂධීය කුඩු)', 420.00, 850.00, 8, 20, '2026-10-18'),
('prod-3', 'MR-POW-100', 'මුරුංගා කොළ කුඩු (Moringa Leaf Powder 100g)', 'Herbal & Ayurvedic (දේශීය ඖෂධීය කුඩු)', 280.00, 550.00, 45, 15, '2026-10-22'),
('prod-4', 'SP-CIN-50', 'සැබෑ ලංකා කුරුඳු කුඩු (Pure Ceylon Cinnamon 50g)', 'Spices & Seasonings (කුළුබඩු)', 190.00, 380.00, 60, 20, '2026-10-25'),
('prod-5', 'SNK-CHIP-75', 'ස්වාභාවික බතල චිප්ස් (Sweet Potato Healthy Chips 75g)', 'Healthy Snacks (කෙටි ආහාර)', 150.00, 300.00, 4, 30, '2026-11-01');
