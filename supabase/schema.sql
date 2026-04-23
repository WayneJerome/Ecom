-- ============================================================
-- VEE LIFESTYLE — Supabase Schema + RLS Policies
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- for geo distance calc

-- ─── Profiles ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY, -- Clerk user ID
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','rider','admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Categories ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed categories
INSERT INTO public.categories (name, slug, image_url, description) VALUES
  ('Shoes', 'shoes', '', 'Premium footwear collection'),
  ('Apparel', 'apparel', '', 'Lifestyle clothing and accessories')
ON CONFLICT (slug) DO NOTHING;

-- ─── Products ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  price DECIMAL(12,2) NOT NULL,
  sale_price DECIMAL(12,2),
  images TEXT[] DEFAULT '{}',
  gender TEXT NOT NULL DEFAULT 'unisex' CHECK (gender IN ('man','woman','unisex')),
  sizes TEXT[] DEFAULT '{}',
  colors JSONB DEFAULT '[]',
  stock INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_gender ON public.products(gender);
CREATE INDEX idx_products_published ON public.products(published);
CREATE INDEX idx_products_featured ON public.products(featured);

-- ─── Orders ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  delivery_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','processing','in_transit','delivered','cancelled','failed')),
  paystack_ref TEXT,
  mpesa_ref TEXT,
  rider_id UUID REFERENCES public.rider_profiles(id) ON DELETE SET NULL,
  delivery_address JSONB NOT NULL,
  tracking_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_customer ON public.orders(customer_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_rider ON public.orders(rider_id);
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);

-- ─── Order Tracking ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT,
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tracking_order ON public.order_tracking(order_id);

-- ─── Wishlists ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ─── Rider Profiles ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rider_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vehicle_type TEXT NOT NULL DEFAULT 'motorcycle',
  license_plate TEXT,
  verified BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  earnings_total DECIMAL(12,2) DEFAULT 0,
  current_lat DECIMAL(10,7),
  current_lng DECIMAL(10,7),
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Rider Earnings ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rider_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rider_id UUID NOT NULL REFERENCES public.rider_profiles(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  payout_status TEXT NOT NULL DEFAULT 'pending' CHECK (payout_status IN ('pending','paid','failed')),
  paid_at TIMESTAMPTZ,
  mpesa_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_earnings_rider ON public.rider_earnings(rider_id);
CREATE INDEX idx_earnings_status ON public.rider_earnings(payout_status);

-- ─── Delivery Settings ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.delivery_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  base_rate DECIMAL(12,2) NOT NULL DEFAULT 200,
  per_km_rate DECIMAL(12,2) NOT NULL DEFAULT 20,
  max_distance_km INTEGER NOT NULL DEFAULT 50,
  rider_base_pay DECIMAL(12,2) NOT NULL DEFAULT 150,
  rider_per_km_pay DECIMAL(12,2) NOT NULL DEFAULT 15,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.delivery_settings (base_rate, per_km_rate, rider_base_pay, rider_per_km_pay)
VALUES (200, 20, 150, 15) ON CONFLICT DO NOTHING;

-- ─── Notifications ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'system' CHECK (type IN ('order','promo','system','delivery')),
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);

-- ─── Offers/Banners ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  cta_url TEXT NOT NULL DEFAULT '/',
  cta_label TEXT NOT NULL DEFAULT 'Shop Now',
  active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Site Settings ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.site_settings (key, value) VALUES
  ('hero_title', 'Wear The Vibe'),
  ('hero_subtitle', 'Premium lifestyle fashion for the bold and the free'),
  ('announcement', 'Free delivery on orders above KES 3,000 🚀'),
  ('currency', 'KES'),
  ('store_email', 'hello@veelifestyle.co.ke'),
  ('store_phone', '+254700000000')
ON CONFLICT (key) DO NOTHING;

-- ─── Analytics Events ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  session_id TEXT,
  user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_event ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_created ON public.analytics_events(created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Categories: public read
CREATE POLICY "categories_public_read" ON public.categories FOR SELECT USING (true);

-- Products: public read for published
CREATE POLICY "products_public_read" ON public.products FOR SELECT USING (published = true);

-- Orders: customers can read own orders
CREATE POLICY "orders_own_read" ON public.orders FOR SELECT
  USING (customer_id = current_setting('request.jwt.claim.sub', true));

-- Wishlists: users can CRUD their own
CREATE POLICY "wishlists_own_crud" ON public.wishlists FOR ALL
  USING (user_id = current_setting('request.jwt.claim.sub', true));

-- Notifications: users see own + broadcast (null user_id)
CREATE POLICY "notifications_own_read" ON public.notifications FOR SELECT
  USING (user_id IS NULL OR user_id = current_setting('request.jwt.claim.sub', true));

-- Offers: public read for active
CREATE POLICY "offers_public_read" ON public.offers FOR SELECT USING (active = true);

-- Site settings: public read
CREATE POLICY "site_settings_public_read" ON public.site_settings FOR SELECT USING (true);

-- Delivery settings: public read
CREATE POLICY "delivery_settings_public_read" ON public.delivery_settings FOR SELECT USING (true);

-- Rider profiles: public read for verified active
CREATE POLICY "rider_profiles_public_read" ON public.rider_profiles FOR SELECT USING (verified = true);

-- Order tracking: anyone with order reference can read
CREATE POLICY "order_tracking_public_read" ON public.order_tracking FOR SELECT USING (true);

-- Analytics: insert only (no auth check for anon tracking)
CREATE POLICY "analytics_insert" ON public.analytics_events FOR INSERT WITH CHECK (true);

-- ─── Updated_at trigger ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER rider_profiles_updated_at BEFORE UPDATE ON public.rider_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── Realtime: enable for GPS tracking ────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_tracking;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rider_profiles;
