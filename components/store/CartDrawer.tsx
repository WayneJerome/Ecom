'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/lib/cart';
import { formatPrice } from '@/lib/utils';
import { feedback } from '@/lib/haptic';
import { HapticButton } from '@/components/shared/HapticButton';

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal, totalItems } = useCartStore();
  const sub = subtotal();
  const FREE_DELIVERY_THRESHOLD = 3000;
  const progressPct = Math.min((sub / FREE_DELIVERY_THRESHOLD) * 100, 100);
  const remaining = Math.max(FREE_DELIVERY_THRESHOLD - sub, 0);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { closeCart(); feedback('light'); }}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(10,22,40,0.55)',
              backdropFilter: 'blur(6px)',
              zIndex: 50,
            }}
          />

          {/* Drawer Panel */}
          <motion.aside
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 35 }}
            style={{
              position: 'fixed',
              top: 0, right: 0, bottom: 0,
              width: '100%',
              maxWidth: 440,
              background: 'rgba(255,255,255,0.96)',
              backdropFilter: 'blur(32px)',
              zIndex: 51,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-16px 0 64px rgba(14,165,233,0.15)',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid rgba(14,165,233,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'linear-gradient(135deg,#0ea5e9,#0284c7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <ShoppingBag size={18} color="#fff" />
                </div>
                <div>
                  <h2 style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 800, fontSize: 18, color: '#0a1628', letterSpacing: '-0.03em' }}>
                    Your Cart
                  </h2>
                  <p style={{ fontSize: 12, color: '#5b7a99', fontWeight: 500 }}>
                    {totalItems()} item{totalItems() !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => { closeCart(); feedback('light'); }}
                style={{
                  background: 'rgba(14,165,233,0.07)',
                  border: 'none', borderRadius: 10, padding: 8,
                  cursor: 'pointer', display: 'flex',
                }}
                aria-label="Close cart"
              >
                <X size={18} color="#0a1628" />
              </motion.button>
            </div>

            {/* Free Delivery Progress */}
            {sub > 0 && (
              <div style={{ padding: '12px 24px', background: '#f0f9ff' }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: remaining === 0 ? '#10b981' : '#0ea5e9', marginBottom: 6 }}>
                  {remaining === 0
                    ? '🎉 You qualify for FREE delivery!'
                    : `Add ${formatPrice(remaining)} more for FREE delivery`}
                </p>
                <div style={{ height: 5, background: 'rgba(14,165,233,0.12)', borderRadius: 4, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                    style={{
                      height: '100%',
                      background: remaining === 0
                        ? 'linear-gradient(90deg,#10b981,#059669)'
                        : 'linear-gradient(90deg,#0ea5e9,#0284c7)',
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {items.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, paddingTop: 60 }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(14,165,233,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShoppingBag size={36} color="#94b4cc" />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: 18, color: '#0a1628', marginBottom: 6 }}>
                      Your cart is empty
                    </p>
                    <p style={{ color: '#5b7a99', fontSize: 13 }}>Add some items to get started!</p>
                  </div>
                  <HapticButton variant="primary" onClick={() => closeCart()}>
                    <Link href="/shop" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                      Browse Shop <ArrowRight size={15} />
                    </Link>
                  </HapticButton>
                </div>
              ) : (
                items.map((item: any) => {
                  const price = item.product.sale_price ?? item.product.price;
                  return (
                    <motion.div
                      key={`${item.product.id}-${item.selectedSize}-${item.selectedColor.name}`}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0 }}
                      style={{
                        display: 'flex',
                        gap: 14,
                        padding: 14,
                        borderRadius: 16,
                        background: 'rgba(255,255,255,0.9)',
                        border: '1.5px solid rgba(14,165,233,0.1)',
                        boxShadow: '0 2px 12px rgba(14,165,233,0.05)',
                      }}
                    >
                      {/* Image */}
                      <div style={{ width: 72, height: 72, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: '#f0f9ff' }}>
                        {item.product.images?.[0] ? (
                          <Image
                            src={item.product.images[0]}
                            alt={item.product.name}
                            width={72}
                            height={72}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#bae6fd,#e0f7ff)' }} />
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: 13, color: '#0a1628', lineHeight: 1.3, marginBottom: 4 }}>
                          {item.product.name}
                        </p>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                          <span style={{ fontSize: 11, color: '#5b7a99', fontWeight: 500, background: 'rgba(14,165,233,0.08)', padding: '2px 7px', borderRadius: 6 }}>
                            Size: {item.selectedSize}
                          </span>
                          <span style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, color: '#5b7a99', fontWeight: 500, background: 'rgba(14,165,233,0.08)', padding: '2px 7px', borderRadius: 6 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.selectedColor.hex, display: 'inline-block' }} />
                            {item.selectedColor.name}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          {/* Qty Controls */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={() => { updateQuantity(item.product.id, item.selectedSize, item.selectedColor.name, item.quantity - 1); feedback('light'); }}
                              style={{ width: 26, height: 26, borderRadius: 8, border: '1.5px solid rgba(14,165,233,0.2)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Minus size={12} color="#0ea5e9" />
                            </motion.button>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#0a1628', minWidth: 20, textAlign: 'center' }}>
                              {item.quantity}
                            </span>
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={() => { updateQuantity(item.product.id, item.selectedSize, item.selectedColor.name, item.quantity + 1); feedback('light'); }}
                              style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Plus size={12} color="#fff" />
                            </motion.button>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontWeight: 800, fontSize: 14, color: '#0a1628', fontFamily: 'Space Grotesk,sans-serif' }}>
                              {formatPrice(price * item.quantity)}
                            </span>
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={() => { removeItem(item.product.id, item.selectedSize, item.selectedColor.name); feedback('medium', 'error'); }}
                              style={{ background: 'rgba(239,68,68,0.08)', border: 'none', borderRadius: 8, padding: 5, cursor: 'pointer', display: 'flex' }}
                            >
                              <Trash2 size={14} color="#ef4444" />
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div style={{
                padding: '20px 24px',
                borderTop: '1px solid rgba(14,165,233,0.12)',
                background: 'rgba(255,255,255,0.98)',
              }}>
                {/* Subtotal */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <span style={{ fontSize: 15, color: '#5b7a99', fontWeight: 600 }}>Subtotal</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#0a1628', fontFamily: 'Space Grotesk,sans-serif' }}>
                    {formatPrice(sub)}
                  </span>
                </div>
                <Link href="/checkout" onClick={() => { closeCart(); feedback('success', 'success'); }}>
                  <HapticButton variant="primary" fullWidth size="lg" haptic="success" sound="success">
                    Checkout — {formatPrice(sub)} <ArrowRight size={16} />
                  </HapticButton>
                </Link>
                <button
                  onClick={() => { closeCart(); feedback('light'); }}
                  style={{ marginTop: 10, width: '100%', textAlign: 'center', fontSize: 13, color: '#5b7a99', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
