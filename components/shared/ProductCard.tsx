'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/lib/cart';
import { feedback } from '@/lib/haptic';
import { HapticButton } from './HapticButton';

interface ProductCardProps {
  product: any;
}

export function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<any | null>(null);

  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.openCart);

  const images = product.images?.length > 0 ? product.images : ['https://via.placeholder.com/400x500?text=No+Image'];
  const hasMultipleImages = images.length > 1;

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    if (hasMultipleImages) {
      setCurrentImageIdx((prev) => (prev + 1) % images.length);
      feedback('light');
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    if (hasMultipleImages) {
      setCurrentImageIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
      feedback('light');
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.sizes?.length > 0 && !selectedSize) {
      // Prompt select size visually (simplified for demo, usually toast)
      feedback('error', 'error');
      return;
    }
    
    // Choose default color if not selected and colors exist
    const colorToUse = selectedColor || (product.colors?.[0] ?? { name: 'Default', hex: '#ccc' });
    const sizeToUse = selectedSize || (product.sizes?.[0] ?? 'N/A');

    addItem(product, sizeToUse, colorToUse);
    openCart();
    feedback('success', 'success');
  };

  return (
    <motion.div
      className="glass-card group relative flex flex-col overflow-hidden rounded-2xl bg-white"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Image Gallery Container */}
      <Link href={`/product/${product.slug}`} className="relative block aspect-[4/5] w-full overflow-hidden bg-sky-50">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentImageIdx}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <Image
              src={images[currentImageIdx]}
              alt={product.name}
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </motion.div>
        </AnimatePresence>

        {/* Gallery Controls (on hover) */}
        {hasMultipleImages && (
          <div
            className={`absolute inset-0 flex items-center justify-between px-2 transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <button
              onClick={prevImage}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-slate-800 shadow-sm backdrop-blur-md transition-colors hover:bg-white"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={nextImage}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-slate-800 shadow-sm backdrop-blur-md transition-colors hover:bg-white"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-2">
          {product.sale_price && (
            <span className="badge badge-danger">
              Sale
            </span>
          )}
          {product.featured && (
            <span className="badge badge-primary">Featured</span>
          )}
        </div>
      </Link>

      {/* Product Content */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-1 flex items-start justify-between gap-2">
          <Link href={`/product/${product.slug}`} className="group-hover:text-sky-600 transition-colors">
            <h3 className="font-display text-[1.05rem] font-bold tracking-tight text-slate-900 line-clamp-1">
              {product.name}
            </h3>
          </Link>
          <div className="flex shrink-0 flex-col items-end">
            <span className="font-display text-lg font-bold text-slate-900">
              {formatPrice(product.sale_price || product.price)}
            </span>
            {product.sale_price && (
              <span className="text-xs font-medium text-slate-400 line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
        </div>

        <p className="mb-4 text-sm font-medium text-slate-500 line-clamp-1">
          {product.category?.name || product.category_id || 'Style'} • {product.gender}
        </p>

        {/* Size Selection */}
        {product.sizes?.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1.5">
              {product.sizes.slice(0, 5).map((size: string) => (
                <button
                  key={size}
                  onClick={(e) => { e.preventDefault(); setSelectedSize(size); feedback('light'); }}
                  className={`flex h-8 min-w-[2rem] items-center justify-center rounded-md border text-xs font-semibold uppercase transition-all ${
                    selectedSize === size
                      ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-[0_0_0_1px_rgba(14,165,233,1)]'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300'
                  }`}
                >
                  {size}
                </button>
              ))}
              {product.sizes.length > 5 && (
                <span className="flex h-8 items-center px-1 text-xs text-slate-500">+{product.sizes.length - 5}</span>
              )}
            </div>
          </div>
        )}

        <div className="mt-auto pt-2">
          <HapticButton 
            className="w-full" 
            variant="primary" 
            onClick={handleAddToCart}
            disabled={product.stock === 0}
          >
            {product.stock === 0 ? (
              <span className="opacity-75">Out of Stock</span>
            ) : (
              <>
                <ShoppingBag size={16} /> Add to Cart
              </>
            )}
          </HapticButton>
        </div>
      </div>
    </motion.div>
  );
}
