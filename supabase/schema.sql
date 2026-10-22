-- Deal Hay Mỗi Ngày: schema Supabase
-- Chạy trong Supabase SQL Editor bằng tài khoản project owner.
create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','editor','viewer')) default 'viewer',
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  image_url text,
  price numeric(14,2) check (price is null or price >= 0),
  original_price numeric(14,2) check (original_price is null or original_price >= 0),
  category text,
  shopee_url text,
  tiktok_url text,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_at_least_one_link check (shopee_url is not null or tiktok_url is not null)
);

create table if not exists public.affiliate_clicks (
  id bigint generated always as identity primary key,
  product_id uuid not null references public.products(id) on delete cascade,
  platform text not null check (platform in ('shopee','tiktok')),
  clicked_at timestamptz not null default now()
);
create index if not exists products_active_featured_idx on public.products(is_active, is_featured);
create index if not exists products_category_idx on public.products(category);
create index if not exists affiliate_clicks_product_time_idx on public.affiliate_clicks(product_id, clicked_at desc);
create index if not exists affiliate_clicks_platform_time_idx on public.affiliate_clicks(platform, clicked_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products
for each row execute function public.set_updated_at();

create or replace function public.current_admin_role()
returns text language sql stable security definer set search_path = public
as $$ select role from public.admin_users where user_id = auth.uid() limit 1 $$;
revoke all on function public.current_admin_role() from public;
grant execute on function public.current_admin_role() to authenticated;

-- Public visitors may read active products only.
alter table public.products enable row level security;
create policy "Public can read active products" on public.products
for select to anon, authenticated using (is_active = true or public.current_admin_role() in ('admin','editor','viewer'));

-- Only admin/editor can insert/update; only admin can delete.
create policy "Editors can insert products" on public.products
for insert to authenticated with check (public.current_admin_role() in ('admin','editor'));
create policy "Editors can update products" on public.products
for update to authenticated using (public.current_admin_role() in ('admin','editor')) with check (public.current_admin_role() in ('admin','editor'));
create policy "Admins can delete products" on public.products
for delete to authenticated using (public.current_admin_role() = 'admin');

alter table public.admin_users enable row level security;
create policy "Users can read own role" on public.admin_users
for select to authenticated using (user_id = auth.uid() or public.current_admin_role() = 'admin');
create policy "Admins manage roles" on public.admin_users
for all to authenticated using (public.current_admin_role() = 'admin') with check (public.current_admin_role() = 'admin');

alter table public.affiliate_clicks enable row level security;
-- Click insert is exposed through a controlled RPC; direct table access is denied.
revoke all on public.affiliate_clicks from anon, authenticated;
grant select on public.affiliate_clicks to authenticated;
create policy "Admins can view click rows" on public.affiliate_clicks
for select to authenticated using (public.current_admin_role() in ('admin','editor','viewer'));

create or replace function public.record_affiliate_click(p_product_id uuid, p_platform text)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if p_platform not in ('shopee','tiktok') then raise exception 'Invalid platform'; end if;
  if not exists (select 1 from public.products where id = p_product_id and is_active = true
      and ((p_platform = 'shopee' and shopee_url is not null) or (p_platform = 'tiktok' and tiktok_url is not null))) then
    raise exception 'Product or affiliate link unavailable';
  end if;
  insert into public.affiliate_clicks(product_id, platform) values (p_product_id, p_platform);
end; $$;
revoke all on function public.record_affiliate_click(uuid,text) from public;
grant execute on function public.record_affiliate_click(uuid,text) to anon, authenticated;

create or replace view public.affiliate_clicks_summary as
select platform, count(*)::bigint as total_clicks
from public.affiliate_clicks
group by platform;
grant select on public.affiliate_clicks_summary to authenticated;

-- Per-product totals for admins/editors:
create or replace view public.affiliate_clicks_by_product as
select p.id as product_id, p.title, c.platform, count(c.id)::bigint as total_clicks
from public.products p
left join public.affiliate_clicks c on c.product_id = p.id
group by p.id, p.title, c.platform;
grant select on public.affiliate_clicks_by_product to authenticated;

-- After creating the first user under Supabase Authentication > Users, run:
-- insert into public.admin_users(user_id, role)
-- values ('PASTE-AUTH-USER-UUID-HERE', 'admin');


-- Product image uploads: run this section after enabling Supabase Storage.
-- The bucket is public so product thumbnails can be displayed on the storefront.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view product images" on storage.objects;
create policy "Public can view product images" on storage.objects
for select to public using (bucket_id = 'product-images');

drop policy if exists "Editors can upload product images" on storage.objects;
create policy "Editors can upload product images" on storage.objects
for insert to authenticated
with check (bucket_id = 'product-images' and public.current_admin_role() in ('admin','editor'));

drop policy if exists "Editors can update product images" on storage.objects;
create policy "Editors can update product images" on storage.objects
for update to authenticated
using (bucket_id = 'product-images' and public.current_admin_role() in ('admin','editor'))
with check (bucket_id = 'product-images' and public.current_admin_role() in ('admin','editor'));

drop policy if exists "Admins can delete product images" on storage.objects;
create policy "Admins can delete product images" on storage.objects
for delete to authenticated
using (bucket_id = 'product-images' and public.current_admin_role() = 'admin');
