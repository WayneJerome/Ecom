'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@clerk/nextjs';
import { ProductCard } from '@/components/shared/ProductCard';
import { Navbar } from '@/components/store/Navbar';
import { HapticButton } from '@/components/shared/HapticButton';
import { feedback } from '@/lib/haptic';
import type { Product } from '@/types';

export default function WishlistPage() {
  const { user } = useUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!user?.id) return;
    loadWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function loadWishlist() {
    try {
      const { data: wishItems } = await supabase
        .from('wishlists')
        .select('product_id, products(*)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (wishItems) {
        const prods = wishItems
          .map((w: any) => w.products)
          .filter(Boolean);
        setProducts(prods);
      }
    } catch { /* */ }
    setLoading(false);
  }

  async function removeFromWishlist(productId: string) {
    await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', user!.id)
      .eq('product_id', productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    feedback('medium', 'pop');
  }

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 80px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(236,72,153,0.1))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Heart size={22} color="#ef4444" fill="#ef4444" />
            </div>
            <div>
              <h1 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 28, fontWeight: 800, color: '#0a1628' }}>
                Wishlist
              </h1>
              <p style={{ color: '#5b7a99', fontSize: 14 }}>{products.length} saved item{products.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </motion.div>

        <div style={{ height: 1, background: 'rgba(14,165,233,0.1)', margin: '24px 0' }} />

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 420, borderRadius: 20 }} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', padding: '80px 20px' }}
          >
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'rgba(239,68,68,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <Heart size={36} color="#f5a3b3" />
            </div>
            <h3 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 20, fontWeight: 700, color: '#0a1628', marginBottom: 8 }}>
              Your wishlist is empty
            </h3>
            <p style={{ color: '#5b7a99', marginBottom: 24 }}>Save items you love for later!</p>
            <Link href="/shop">
              <HapticButton variant="primary">
                <ShoppingBag size={16} /> Browse Shop
              </HapticButton>
            </Link>
          </motion.div>
        ) : (
          <motion.div
            layout
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}
          >
            <AnimatePresence>
              {products.map((product, idx) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.05 }}
                  style={{ position: 'relative' }}
                >
                  <ProductCard product={product} />
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => removeFromWishlist(product.id)}
                    style={{
                      position: 'absolute', top: 12, right: 12, zIndex: 10,
                      width: 36, height: 36, borderRadius: 10,
                      background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)',
                      border: '1.5px solid rgba(239,68,68,0.2)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>
    </>
  );
}
