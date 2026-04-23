'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { useFilterStore } from '@/lib/filters';
import { feedback } from '@/lib/haptic';
import { HapticButton } from './HapticButton';
import type { Gender } from '@/types';

const GENDERS: { value: Gender | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'man', label: "Men's" },
  { value: 'woman', label: "Women's" },
  { value: 'unisex', label: 'Unisex' },
];

const SHOE_SIZES = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'];
const APPAREL_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

const COLOR_OPTIONS = [
  { name: 'Black', hex: '#1a1a1a' },
  { name: 'White', hex: '#f5f5f5' },
  { name: 'Red', hex: '#ef4444' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Navy', hex: '#1e3a5f' },
  { name: 'Grey', hex: '#9ca3af' },
  { name: 'Brown', hex: '#92400e' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Orange', hex: '#f97316' },
];

const SORT_OPTIONS: { value: 'newest' | 'price_asc' | 'price_desc' | 'popular'; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'popular', label: 'Most Popular' },
];

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeCategory?: string | null;
}

export function FilterSidebar({ isOpen, onClose, activeCategory }: FilterSidebarProps) {
  const {
    gender, sizes, colors, priceMin, priceMax, sortBy, category,
    setGender, toggleSize, toggleColor, setPriceRange, setSortBy, setCategory, resetFilters,
  } = useFilterStore();

  const sizeOptions = activeCategory === 'apparel' || category === 'apparel' ? APPAREL_SIZES : SHOE_SIZES;

  const handleReset = () => {
    resetFilters();
    if (activeCategory) setCategory(activeCategory);
    feedback('medium', 'pop');
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="filter-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isOpen ? 0 : '-100%',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 bottom-0 z-50 w-[320px] overflow-y-auto lg:static lg:z-auto lg:translate-x-0"
        style={{
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(24px)',
          borderRight: '1.5px solid rgba(14,165,233,0.12)',
          boxShadow: isOpen ? '8px 0 40px rgba(14,165,233,0.1)' : 'none',
        }}
      >
        <div style={{ padding: '24px 20px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg,#0ea5e9,#0284c7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <SlidersHorizontal size={18} color="#fff" />
              </div>
              <h3 style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 800, fontSize: 18, color: '#0a1628' }}>
                Filters
              </h3>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleReset}
                style={{ background: 'rgba(14,165,233,0.07)', border: 'none', borderRadius: 8, padding: 7, cursor: 'pointer', display: 'flex' }}
                title="Reset filters"
              >
                <RotateCcw size={15} color="#0ea5e9" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="lg:hidden"
                style={{ background: 'rgba(14,165,233,0.07)', border: 'none', borderRadius: 8, padding: 7, cursor: 'pointer', display: 'flex' }}
              >
                <X size={15} color="#0a1628" />
              </motion.button>
            </div>
          </div>

          {/* Category */}
          {!activeCategory && (
            <Section title="Category">
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { value: null, label: 'All' },
                  { value: 'shoes', label: 'Shoes' },
                  { value: 'apparel', label: 'Apparel' },
                ].map((cat) => (
                  <Chip
                    key={cat.label}
                    label={cat.label}
                    active={category === cat.value}
                    onClick={() => { setCategory(cat.value); feedback('light'); }}
                  />
                ))}
              </div>
            </Section>
          )}

          {/* Gender */}
          <Section title="Gender">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {GENDERS.map((g) => (
                <Chip
                  key={g.value}
                  label={g.label}
                  active={gender === g.value}
                  onClick={() => { setGender(g.value); feedback('light'); }}
                />
              ))}
            </div>
          </Section>

          {/* Sort */}
          <Section title="Sort By">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {SORT_OPTIONS.map((s) => (
                <motion.button
                  key={s.value}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setSortBy(s.value); feedback('light'); }}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: sortBy === s.value ? '1.5px solid #0ea5e9' : '1.5px solid transparent',
                    background: sortBy === s.value ? 'rgba(14,165,233,0.08)' : 'rgba(14,165,233,0.03)',
                    color: sortBy === s.value ? '#0284c7' : '#5b7a99',
                    fontSize: 13,
                    fontWeight: sortBy === s.value ? 700 : 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                >
                  {s.label}
                </motion.button>
              ))}
            </div>
          </Section>

          {/* Size */}
          <Section title="Size">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {sizeOptions.map((size) => (
                <Chip
                  key={size}
                  label={size}
                  active={sizes.includes(size)}
                  onClick={() => { toggleSize(size); feedback('light'); }}
                  small
                />
              ))}
            </div>
          </Section>

          {/* Colors */}
          <Section title="Colors">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {COLOR_OPTIONS.map((color) => (
                <motion.button
                  key={color.name}
                  whileTap={{ scale: 0.85 }}
                  onClick={() => { toggleColor(color.name); feedback('light'); }}
                  title={color.name}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: color.hex,
                    border: colors.includes(color.name)
                      ? '3px solid #0ea5e9'
                      : '2px solid rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    boxShadow: colors.includes(color.name) ? '0 0 0 2px #fff, 0 0 0 4px #0ea5e9' : 'none',
                    transition: 'all 0.15s',
                  }}
                />
              ))}
            </div>
          </Section>

          {/* Price Range */}
          <Section title={`Price: KES ${priceMin.toLocaleString()} — ${priceMax.toLocaleString()}`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="range"
                min={0}
                max={50000}
                step={500}
                value={priceMin}
                onChange={(e) => setPriceRange(Number(e.target.value), priceMax)}
                style={{ width: '100%', accentColor: '#0ea5e9' }}
              />
              <input
                type="range"
                min={0}
                max={100000}
                step={500}
                value={priceMax}
                onChange={(e) => setPriceRange(priceMin, Number(e.target.value))}
                style={{ width: '100%', accentColor: '#0ea5e9' }}
              />
            </div>
          </Section>

          {/* Apply (mobile) */}
          <div className="lg:hidden" style={{ marginTop: 20 }}>
            <HapticButton variant="primary" fullWidth onClick={onClose} haptic="success" sound="success">
              Apply Filters
            </HapticButton>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: '#94b4cc', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function Chip({ label, active, onClick, small }: { label: string; active: boolean; onClick: () => void; small?: boolean }) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      style={{
        padding: small ? '6px 10px' : '8px 14px',
        borderRadius: small ? 8 : 10,
        border: active ? '1.5px solid #0ea5e9' : '1.5px solid rgba(14,165,233,0.15)',
        background: active ? 'rgba(14,165,233,0.1)' : 'rgba(255,255,255,0.8)',
        color: active ? '#0284c7' : '#5b7a99',
        fontSize: small ? 12 : 13,
        fontWeight: active ? 700 : 500,
        cursor: 'pointer',
        transition: 'all 0.15s',
        minWidth: small ? 36 : undefined,
        textAlign: 'center',
      }}
    >
      {label}
    </motion.button>
  );
}
