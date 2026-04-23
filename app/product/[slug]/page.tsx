'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Heart, Share2, ChevronLeft, ChevronRight,
  ArrowLeft, Truck, ShieldCheck, RefreshCcw, Check
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useCartStore } from '@/lib/cart';
import { formatPrice } from '@/lib/utils';
import { feedback } from '@/lib/haptic';
import { HapticButton } from '@/components/shared/HapticButton';
import { Navbar } from '@/components/store/Navbar';
import type { Product, ProductColor } from '@/types';

const FALLBACK: Product = {
  id: '1', name: 'AirMax Alpha Phantom', slug: 'airmax-phantom',
  description: 'Premium running shoes designed for maximum comfort and style. Features responsive cushioning, breathable mesh upper, and a sleek silhouette that transitions from track to street effortlessly.',
  category_id: 'shoes', price: 18500, sale_price: 15000,
  images: [
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=1000&auto=format&fit=crop',
  ],
  gender: 'unisex', sizes: ['39', '40', '41', '42', '43', '44', '45'],
  colors: [{ name: 'Red', hex: '#ef4444' }, { name: 'Black', hex: '#1a1a1a' }, { name: 'White', hex: '#f5f5f5' }],
  stock: 25, published: true, created_at: new Date().toISOString(),
};

export default function ProductPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [product, setProduct] = useState<Product>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [currentImg, setCurrentImg] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [wishlistAdded, setWishlistAdded] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('products')
        .select('*, categories(name, slug)')
        .eq('slug', slug)
        .eq('published', true)
        .single();

      if (data) {
        setProduct(data as unknown as Product);
      }
      setLoading(false);
    }
    load();
  }, [slug]);

  useEffect(() => {
    if (product.colors?.length > 0 && !selectedColor) {
      setSelectedColor(product.colors[0]);
    }
  }, [product, selectedColor]);

  const images = product.images?.length > 0 ? product.images : ['/placeholder.jpg'];
  const price = product.sale_price ?? product.price;
  const discount = product.sale_price
    ? Math.round(((product.price - product.sale_price) / product.price) * 100)
    : 0;

  const handleAddToCart = () => {
    if (!selectedSize) {
      feedback('error', 'error');
      return;
    }
    const color = selectedColor || product.colors?.[0] || { name: 'Default', hex: '#ccc' };
    addItem(product, selectedSize, color);
    openCart();
    feedback('success', 'success');
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: product.name,
        text: `Check out ${product.name} on Vee Lifestyle`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      feedback('success', 'success');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
          <div className="skeleton" style={{ aspectRatio: '4/5', borderRadius: 24 }} />
          <div>
            <div className="skeleton" style={{ height: 40, width: '70%', borderRadius: 12, marginBottom: 16 }} />
            <div className="skeleton" style={{ height: 24, width: '40%', borderRadius: 10, marginBottom: 24 }} />
            <div className="skeleton" style={{ height: 120, borderRadius: 16, marginBottom: 16 }} />
            <div className="skeleton" style={{ height: 56, borderRadius: 28 }} />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 80px' }}>
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}
        >
          <Link
            href="/shop"
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#0ea5e9', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}
            onClick={() => feedback('light')}
          >
            <ArrowLeft size={16} /> Back to Shop
          </Link>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 48 }} className="lg:!grid-cols-2">
          {/* Image Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Main Image */}
            <div style={{
              position: 'relative', aspectRatio: '4/5', borderRadius: 24, overflow: 'hidden',
              background: '#f0f9ff',
              border: '1.5px solid rgba(14,165,233,0.1)',
            }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentImg}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ position: 'absolute', inset: 0 }}
                >
                  <Image
                    src={images[currentImg]}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                </motion.div>
              </AnimatePresence>

              {/* Badges */}
              <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {discount > 0 && (
                  <span className="badge badge-danger" style={{ fontSize: 13, padding: '6px 12px' }}>
                    -{discount}% OFF
                  </span>
                )}
              </div>

              {/* Nav Arrows */}
              {images.length > 1 && (
                <>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { setCurrentImg((p) => (p === 0 ? images.length - 1 : p - 1)); feedback('light'); }}
                    style={{
                      position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                      width: 40, height: 40, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)',
                      border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
                    }}
                  >
                    <ChevronLeft size={20} color="#0a1628" />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { setCurrentImg((p) => (p + 1) % images.length); feedback('light'); }}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      width: 40, height: 40, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)',
                      border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
                    }}
                  >
                    <ChevronRight size={20} color="#0a1628" />
                  </motion.button>
                </>
              )}

              {/* Dots */}
              {images.length > 1 && (
                <div style={{
                  position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
                  display: 'flex', gap: 6,
                }}>
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => { setCurrentImg(i); feedback('light'); }}
                      style={{
                        width: currentImg === i ? 24 : 8, height: 8,
                        borderRadius: 4,
                        background: currentImg === i ? '#0ea5e9' : 'rgba(255,255,255,0.6)',
                        border: 'none', cursor: 'pointer',
                        transition: 'all 0.3s',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                {images.map((img, i) => (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setCurrentImg(i); feedback('light'); }}
                    style={{
                      width: 72, height: 72, borderRadius: 14, overflow: 'hidden',
                      border: currentImg === i ? '2.5px solid #0ea5e9' : '2px solid rgba(14,165,233,0.1)',
                      cursor: 'pointer', flexShrink: 0, background: '#f0f9ff',
                      boxShadow: currentImg === i ? '0 0 0 3px rgba(14,165,233,0.15)' : 'none',
                      transition: 'all 0.2s', position: 'relative',
                    }}
                  >
                    <Image src={img} alt="" fill className="object-cover" sizes="72px" />
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {/* Name + Price */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                {product.gender === 'man' ? "Men's" : product.gender === 'woman' ? "Women's" : 'Unisex'}
              </p>
              <h1 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 800, color: '#0a1628', lineHeight: 1.1, marginBottom: 14, letterSpacing: '-0.03em' }}>
                {product.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 28, fontWeight: 800, color: '#0a1628' }}>
                  {formatPrice(price)}
                </span>
                {product.sale_price && (
                  <span style={{ fontSize: 18, color: '#94b4cc', textDecoration: 'line-through', fontWeight: 500 }}>
                    {formatPrice(product.price)}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <p style={{ color: '#5b7a99', fontSize: 15, lineHeight: 1.7, marginBottom: 28, fontWeight: 400 }}>
              {product.description}
            </p>

            {/* Color Selection */}
            {product.colors?.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#0a1628', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  Color: <span style={{ fontWeight: 500, color: '#5b7a99' }}>{selectedColor?.name}</span>
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  {product.colors.map((color) => (
                    <motion.button
                      key={color.name}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => { setSelectedColor(color); feedback('light'); }}
                      title={color.name}
                      style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: color.hex,
                        border: selectedColor?.name === color.name
                          ? '3px solid #0ea5e9'
                          : '2px solid rgba(0,0,0,0.12)',
                        cursor: 'pointer',
                        boxShadow: selectedColor?.name === color.name
                          ? '0 0 0 3px #fff, 0 0 0 5px #0ea5e9'
                          : 'inset 0 1px 4px rgba(0,0,0,0.1)',
                        transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {selectedColor?.name === color.name && (
                        <Check size={16} color={color.hex === '#f5f5f5' || color.hex === '#ffffff' ? '#0a1628' : '#fff'} strokeWidth={3} />
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {product.sizes?.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#0a1628', marginBottom: 10 }}>
                  Size {selectedSize && <span style={{ fontWeight: 500, color: '#5b7a99' }}>— {selectedSize}</span>}
                  {!selectedSize && <span style={{ fontWeight: 500, color: '#ef4444', marginLeft: 6 }}>Select a size</span>}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {product.sizes.map((size) => (
                    <motion.button
                      key={size}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => { setSelectedSize(size); feedback('light'); }}
                      style={{
                        minWidth: 48, height: 44,
                        padding: '0 14px',
                        borderRadius: 12,
                        border: selectedSize === size
                          ? '2px solid #0ea5e9'
                          : '1.5px solid rgba(14,165,233,0.15)',
                        background: selectedSize === size ? 'rgba(14,165,233,0.08)' : 'rgba(255,255,255,0.9)',
                        color: selectedSize === size ? '#0284c7' : '#0a1628',
                        fontSize: 14, fontWeight: selectedSize === size ? 700 : 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: selectedSize === size ? '0 0 0 3px rgba(14,165,233,0.1)' : 'none',
                      }}
                    >
                      {size}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
              <div style={{ flex: 1 }}>
                <HapticButton
                  variant="primary"
                  fullWidth
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  haptic="success"
                  sound="success"
                >
                  {addedToCart ? (
                    <><Check size={18} /> Added!</>
                  ) : product.stock === 0 ? (
                    'Out of Stock'
                  ) : (
                    <><ShoppingBag size={18} /> Add to Cart — {formatPrice(price)}</>
                  )}
                </HapticButton>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => { setWishlistAdded(!wishlistAdded); feedback(wishlistAdded ? 'light' : 'success', wishlistAdded ? 'click' : 'success'); }}
                style={{
                  width: 52, height: 52, borderRadius: 16,
                  background: wishlistAdded ? 'rgba(239,68,68,0.1)' : 'rgba(14,165,233,0.07)',
                  border: `1.5px solid ${wishlistAdded ? 'rgba(239,68,68,0.3)' : 'rgba(14,165,233,0.15)'}`,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Heart size={20} color={wishlistAdded ? '#ef4444' : '#5b7a99'} fill={wishlistAdded ? '#ef4444' : 'none'} />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => { handleShare(); }}
                style={{
                  width: 52, height: 52, borderRadius: 16,
                  background: 'rgba(14,165,233,0.07)',
                  border: '1.5px solid rgba(14,165,233,0.15)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Share2 size={20} color="#5b7a99" />
              </motion.button>
            </div>

            {/* Trust Badges */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
              padding: 16, borderRadius: 16,
              background: 'rgba(14,165,233,0.04)',
              border: '1px solid rgba(14,165,233,0.1)',
            }}>
              {[
                { icon: <Truck size={18} />, title: 'Fast Delivery', desc: 'Same day in Nairobi' },
                { icon: <ShieldCheck size={18} />, title: 'Authentic', desc: '100% genuine' },
                { icon: <RefreshCcw size={18} />, title: 'Easy Returns', desc: '7-day returns' },
              ].map((badge) => (
                <div key={badge.title} style={{ textAlign: 'center' }}>
                  <div style={{ color: '#0ea5e9', marginBottom: 4, display: 'flex', justifyContent: 'center' }}>{badge.icon}</div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#0a1628' }}>{badge.title}</p>
                  <p style={{ fontSize: 10, color: '#94b4cc' }}>{badge.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </>
  );
}
