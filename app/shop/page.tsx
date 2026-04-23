'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, Search, Package } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useFilterStore } from '@/lib/filters';
import { ProductCard } from '@/components/shared/ProductCard';
import { FilterSidebar } from '@/components/shared/FilterSidebar';
import { Navbar } from '@/components/store/Navbar';
import { feedback } from '@/lib/haptic';
import type { Product } from '@/types';

// Fallback mock products for development
const MOCK_PRODUCTS: Product[] = [
  {
    id: '1', name: 'AirMax Alpha Phantom', slug: 'airmax-phantom',
    description: 'Premium running shoes with maximum comfort and style.',
    category_id: 'shoes', price: 18500, sale_price: 15000,
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop'],
    gender: 'unisex', sizes: ['40', '41', '42', '43', '44'], stock: 25, published: true,
    colors: [{ name: 'Red', hex: '#ef4444' }, { name: 'Black', hex: '#1a1a1a' }],
    created_at: new Date().toISOString(),
  },
  {
    id: '2', name: 'Vee Elevate Hoodie', slug: 'vee-elevate',
    description: 'Cozy premium hoodie for everyday lifestyle.',
    category_id: 'apparel', price: 6500, sale_price: null,
    images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop'],
    gender: 'unisex', sizes: ['S', 'M', 'L', 'XL'], stock: 50, published: true,
    colors: [{ name: 'Black', hex: '#1a1a1a' }, { name: 'Grey', hex: '#9ca3af' }],
    created_at: new Date().toISOString(),
  },
  {
    id: '3', name: 'Cloudstratus Runners', slug: 'cloudstratus',
    description: 'Lightweight cloud-like running experience.',
    category_id: 'shoes', price: 12000, sale_price: 9500,
    images: ['https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=800&auto=format&fit=crop'],
    gender: 'woman', sizes: ['37', '38', '39', '40'], stock: 18, published: true,
    colors: [{ name: 'White', hex: '#f5f5f5' }, { name: 'Blue', hex: '#3b82f6' }],
    created_at: new Date().toISOString(),
  },
  {
    id: '4', name: 'Vee Street Joggers', slug: 'street-joggers',
    description: 'Premium cotton joggers with tapered fit.',
    category_id: 'apparel', price: 4500, sale_price: null,
    images: ['https://images.unsplash.com/photo-1552902865-b72c031ac5ea?q=80&w=800&auto=format&fit=crop'],
    gender: 'man', sizes: ['S', 'M', 'L', 'XL', '2XL'], stock: 30, published: true,
    colors: [{ name: 'Navy', hex: '#1e3a5f' }, { name: 'Black', hex: '#1a1a1a' }],
    created_at: new Date().toISOString(),
  },
  {
    id: '5', name: 'Ultraboost Velocity', slug: 'ultraboost-velocity',
    description: 'Next-gen boost technology for ultimate performance.',
    category_id: 'shoes', price: 22000, sale_price: 18500,
    images: ['https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?q=80&w=800&auto=format&fit=crop'],
    gender: 'man', sizes: ['41', '42', '43', '44', '45'], stock: 12, published: true,
    colors: [{ name: 'Black', hex: '#1a1a1a' }, { name: 'White', hex: '#f5f5f5' }],
    created_at: new Date().toISOString(),
  },
  {
    id: '6', name: 'Vee Crop Tee', slug: 'vee-crop-tee',
    description: 'Soft-touch crop tee with minimal branding.',
    category_id: 'apparel', price: 2800, sale_price: 2200,
    images: ['https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=800&auto=format&fit=crop'],
    gender: 'woman', sizes: ['XS', 'S', 'M', 'L'], stock: 40, published: true,
    colors: [{ name: 'White', hex: '#f5f5f5' }, { name: 'Pink', hex: '#ec4899' }],
    created_at: new Date().toISOString(),
  },
];

function ShopContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const {
    gender, sizes, colors, priceMin, priceMax, sortBy, category, search,
    setCategory, setGender, setSearch,
  } = useFilterStore();

  // Sync URL params on mount
  useEffect(() => {
    const urlCategory = searchParams.get('category');
    const urlGender = searchParams.get('gender');
    const urlSearch = searchParams.get('search');
    const urlSale = searchParams.get('sale');

    if (urlCategory) setCategory(urlCategory);
    if (urlGender && ['man', 'woman', 'unisex'].includes(urlGender)) {
      setGender(urlGender as 'man' | 'woman' | 'unisex');
    }
    if (urlSearch) setSearch(urlSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch products
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const supabase = createClient();
        let query = supabase
          .from('products')
          .select('*, categories(name, slug)')
          .eq('published', true);

        if (category) {
          const { data: cat } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', category)
            .single();
          if (cat) query = query.eq('category_id', cat.id);
        }

        if (gender && gender !== 'all') {
          query = query.or(`gender.eq.${gender},gender.eq.unisex`);
        }

        const { data, error } = await query;
        if (error) throw error;
        if (data && data.length > 0) {
          setProducts(data as unknown as Product[]);
        } else {
          // Fallback to mock data if no products in DB
          setProducts(MOCK_PRODUCTS);
        }
      } catch {
        // Fallback to mock data
        setProducts(MOCK_PRODUCTS);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [category, gender]);

  // Client-side filtering
  const filtered = useMemo(() => {
    let result = [...products];

    // Gender filter
    if (gender && gender !== 'all') {
      result = result.filter((p) => p.gender === gender || p.gender === 'unisex');
    }

    // Size filter
    if (sizes.length > 0) {
      result = result.filter((p) => p.sizes?.some((s) => sizes.includes(s)));
    }

    // Color filter
    if (colors.length > 0) {
      result = result.filter((p) =>
        p.colors?.some((c) => colors.includes(c.name))
      );
    }

    // Price filter
    result = result.filter((p) => {
      const price = p.sale_price ?? p.price;
      return price >= priceMin && price <= priceMax;
    });

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortBy) {
      case 'price_asc':
        result.sort((a, b) => (a.sale_price ?? a.price) - (b.sale_price ?? b.price));
        break;
      case 'price_desc':
        result.sort((a, b) => (b.sale_price ?? b.price) - (a.sale_price ?? a.price));
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      default:
        break;
    }

    return result;
  }, [products, gender, sizes, colors, priceMin, priceMax, sortBy, search]);

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', paddingTop: 8 }}>
        {/* Hero Banner */}
        <section style={{
          padding: '48px 24px 32px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: '-30%', right: '-10%',
            width: '50%', height: '80%', borderRadius: '50%',
            background: 'rgba(14,165,233,0.08)', filter: 'blur(80px)',
          }} />
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, color: '#0a1628', marginBottom: 12 }}
          >
            {category === 'shoes' ? ' Shoes' : category === 'apparel' ? ' Apparel' : ' Shop All'}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ color: '#5b7a99', fontSize: 16, fontWeight: 500, maxWidth: 500, margin: '0 auto' }}
          >
            Premium lifestyle fashion with instant M-Pesa checkout
          </motion.p>
        </section>

        {/* Toolbar */}
        <div style={{
          maxWidth: 1400, margin: '0 auto', padding: '0 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 20, gap: 12,
        }}>
          {/* Mobile filter toggle */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => { setFiltersOpen(true); feedback('light'); }}
            className="lg:hidden"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 16px', borderRadius: 12,
              background: 'rgba(14,165,233,0.08)',
              border: '1.5px solid rgba(14,165,233,0.15)',
              fontSize: 13, fontWeight: 600, color: '#0284c7', cursor: 'pointer',
            }}
          >
            <SlidersHorizontal size={16} /> Filters
          </motion.button>

          {/* Search bar */}
          <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94b4cc' }} />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
              style={{ paddingLeft: 40, borderRadius: 12 }}
            />
          </div>

          <p style={{ fontSize: 13, color: '#94b4cc', fontWeight: 500, whiteSpace: 'nowrap' }}>
            {filtered.length} product{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Layout: Sidebar + Grid */}
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px 80px', display: 'flex', gap: 28 }}>
          {/* Desktop sidebar (always visible on lg+) */}
          <div className="hidden lg:block" style={{ width: 280, flexShrink: 0 }}>
            <div style={{
              position: 'sticky', top: 100,
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: 20,
              border: '1.5px solid rgba(14,165,233,0.12)',
              overflow: 'hidden',
            }}>
              <FilterSidebar
                isOpen={true}
                onClose={() => { }}
                activeCategory={category}
              />
            </div>
          </div>

          {/* Mobile sidebar */}
          <div className="lg:hidden">
            <FilterSidebar
              isOpen={filtersOpen}
              onClose={() => setFiltersOpen(false)}
              activeCategory={category}
            />
          </div>

          {/* Product Grid */}
          <div style={{ flex: 1 }}>
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 420, borderRadius: 20 }} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  textAlign: 'center', padding: '80px 20px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
                }}
              >
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: 'rgba(14,165,233,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Package size={36} color="#94b4cc" />
                </div>
                <h3 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 20, fontWeight: 700, color: '#0a1628' }}>
                  No products found
                </h3>
                <p style={{ color: '#5b7a99', fontSize: 14 }}>
                  Try adjusting your filters or search query.
                </p>
              </motion.div>
            ) : (
              <motion.div
                layout
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 20,
                }}
              >
                <AnimatePresence mode="popLayout">
                  {filtered.map((product, idx) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="skeleton" style={{ width: 200, height: 40, borderRadius: 12 }} />
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}
