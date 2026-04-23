'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Menu, X, Search, User, Heart, ChevronDown
} from 'lucide-react';
import { useUser, SignInButton, UserButton } from '@clerk/nextjs';
import { useCartStore } from '@/lib/cart';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { feedback } from '@/lib/haptic';

const NAV_LINKS = [
  {
    label: 'Shop',
    href: '/shop',
    sub: [
      { label: 'All Products', href: '/shop' },
      { label: 'New Arrivals', href: '/shop?sort=newest' },
      { label: 'Sale', href: '/shop?sale=true' },
    ],
  },
  {
    label: 'Shoes',
    href: '/category/shoes',
    sub: [
      { label: 'Men\'s Shoes', href: '/category/shoes?gender=man' },
      { label: 'Women\'s Shoes', href: '/category/shoes?gender=woman' },
      { label: 'Unisex', href: '/category/shoes?gender=unisex' },
    ],
  },
  {
    label: 'Apparel',
    href: '/category/apparel',
    sub: [
      { label: 'Men\'s Apparel', href: '/category/apparel?gender=man' },
      { label: 'Women\'s Apparel', href: '/category/apparel?gender=woman' },
      { label: 'Unisex', href: '/category/apparel?gender=unisex' },
    ],
  },
];

export function Navbar() {
  const { user } = useUser();
  const { totalItems, openCart } = useCartStore();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 20); }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const items = totalItems();

  return (
    <>
      {/* Announcement Bar */}
      <div className="announcement-bar">
        <p>🚀 Free delivery on orders above KES 3,000 — Shop Now!</p>
      </div>

      <motion.header
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 'var(--z-nav)' as never,
          background: scrolled
            ? 'rgba(255,255,255,0.92)'
            : 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: scrolled
            ? '1px solid rgba(14,165,233,0.2)'
            : '1px solid transparent',
          boxShadow: scrolled
            ? '0 4px 24px rgba(14,165,233,0.1)'
            : 'none',
          transition: 'all 0.35s ease',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <nav style={{ height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>

            {/* Logo */}
            <Link href="/" style={{ textDecoration: 'none' }} onClick={() => feedback('light')}>
              <motion.div whileHover={{ scale: 1.02 }} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'linear-gradient(135deg,#0ea5e9,#0284c7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(14,165,233,0.35)',
                }}>
                  <span style={{ color: '#fff', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 18 }}>V</span>
                </div>
                <span style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontWeight: 800,
                  fontSize: 20,
                  color: '#0a1628',
                  letterSpacing: '-0.04em',
                }}>
                  Vee <span style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Lifestyle</span>
                </span>
              </motion.div>
            </Link>

            {/* Desktop Nav Links */}
            <ul style={{ display: 'flex', alignItems: 'center', gap: 4, listStyle: 'none', margin: 0, padding: 0 }}
              className="hidden md:flex">
              {NAV_LINKS.map((link) => (
                <li
                  key={link.label}
                  style={{ position: 'relative' }}
                  onMouseEnter={() => setActiveDropdown(link.label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    href={link.href}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '8px 14px',
                      borderRadius: 10,
                      color: '#0a1628',
                      fontSize: '14px',
                      fontWeight: 600,
                      textDecoration: 'none',
                      transition: 'background 0.2s, color 0.2s',
                    }}
                    onClick={() => feedback('light')}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(14,165,233,0.08)';
                      (e.currentTarget as HTMLAnchorElement).style.color = '#0ea5e9';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                      (e.currentTarget as HTMLAnchorElement).style.color = '#0a1628';
                    }}
                  >
                    {link.label}
                    <ChevronDown size={13} style={{ transition: 'transform 0.2s', transform: activeDropdown === link.label ? 'rotate(180deg)' : 'rotate(0)' }} />
                  </Link>

                  {/* Dropdown */}
                  <AnimatePresence>
                    {activeDropdown === link.label && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.97 }}
                        transition={{ duration: 0.18 }}
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 8px)',
                          left: 0,
                          background: 'rgba(255,255,255,0.97)',
                          backdropFilter: 'blur(24px)',
                          border: '1.5px solid rgba(14,165,233,0.15)',
                          borderRadius: 14,
                          padding: '8px',
                          minWidth: 180,
                          boxShadow: '0 16px 40px rgba(14,165,233,0.15)',
                          zIndex: 50,
                        }}
                      >
                        {link.sub.map((sub) => (
                          <Link
                            key={sub.label}
                            href={sub.href}
                            onClick={() => { setActiveDropdown(null); feedback('light'); }}
                            style={{
                              display: 'block',
                              padding: '9px 14px',
                              borderRadius: 9,
                              fontSize: '13px',
                              fontWeight: 500,
                              color: '#0a1628',
                              textDecoration: 'none',
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(14,165,233,0.08)';
                              (e.currentTarget as HTMLAnchorElement).style.color = '#0ea5e9';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                              (e.currentTarget as HTMLAnchorElement).style.color = '#0a1628';
                            }}
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              ))}
            </ul>

            {/* Right Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* Search */}
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => { setSearchOpen(true); feedback('light'); }}
                style={{ background: 'rgba(14,165,233,0.07)', border: 'none', borderRadius: 10, padding: 9, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                aria-label="Search"
              >
                <Search size={18} color="#0a1628" />
              </motion.button>

              {/* Wishlist (if signed in) */}
              {user && (
                <Link href="/wishlist" onClick={() => feedback('light')} style={{ background: 'rgba(14,165,233,0.07)', border: 'none', borderRadius: 10, padding: 9, display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                  <Heart size={18} color="#0a1628" />
                </Link>
              )}

              {/* Notifications */}
              <NotificationBell />

              {/* Cart */}
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => { openCart(); feedback('light', 'pop'); }}
                style={{
                  position: 'relative',
                  background: 'linear-gradient(135deg,#0ea5e9,#0284c7)',
                  border: 'none',
                  borderRadius: 12,
                  padding: '9px 13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 4px 16px rgba(14,165,233,0.3)',
                }}
                aria-label="Cart"
              >
                <ShoppingBag size={18} color="#fff" />
                {items > 0 && (
                  <motion.span
                    key={items}
                    initial={{ scale: 0.6 }}
                    animate={{ scale: 1 }}
                    style={{
                      background: '#fff',
                      color: '#0284c7',
                      fontSize: '11px',
                      fontWeight: 800,
                      minWidth: 18,
                      height: 18,
                      borderRadius: 9,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingInline: 4,
                    }}
                  >
                    {items}
                  </motion.span>
                )}
              </motion.button>

              {/* Auth */}
              {user ? (
                <UserButton afterSignOutUrl="/" appearance={{
                  elements: {
                    avatarBox: { width: 36, height: 36, borderRadius: 10, border: '2px solid rgba(14,165,233,0.3)' }
                  }
                }} />
              ) : (
                <SignInButton mode="modal">
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => feedback('light')}
                    style={{
                      background: 'rgba(14,165,233,0.08)',
                      border: '1.5px solid rgba(14,165,233,0.2)',
                      borderRadius: 10,
                      padding: '7px 14px',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#0ea5e9',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}
                  >
                    <User size={14} />
                    Sign In
                  </motion.button>
                </SignInButton>
              )}

              {/* Mobile Menu Toggle */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="md:hidden"
                onClick={() => { setMobileOpen((v) => !v); feedback('light'); }}
                style={{ background: 'rgba(14,165,233,0.07)', border: 'none', borderRadius: 10, padding: 9, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                aria-label="Menu"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </motion.button>
            </div>
          </nav>
        </div>

        {/* Search Overlay */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ borderTop: '1px solid rgba(14,165,233,0.12)', padding: '12px 24px', background: 'rgba(255,255,255,0.97)' }}
            >
              <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', gap: 10 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94b4cc' }} />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search shoes, apparel..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        window.location.href = `/shop?search=${encodeURIComponent(searchQuery.trim())}`;
                        setSearchOpen(false);
                      }
                    }}
                    className="input"
                    style={{ paddingLeft: 42, borderRadius: 12 }}
                  />
                </div>
                <button onClick={() => setSearchOpen(false)} className="btn btn-ghost" style={{ padding: '0 16px' }}>Close</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Nav */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden"
              style={{ borderTop: '1px solid rgba(14,165,233,0.12)', background: 'rgba(255,255,255,0.97)', padding: '16px 24px 24px' }}
            >
              {NAV_LINKS.map((link) => (
                <div key={link.label} style={{ marginBottom: 8 }}>
                  <Link
                    href={link.href}
                    onClick={() => { setMobileOpen(false); feedback('light'); }}
                    style={{ display: 'block', padding: '12px 16px', borderRadius: 12, color: '#0a1628', fontWeight: 700, fontSize: 15, textDecoration: 'none', background: 'rgba(14,165,233,0.05)' }}
                  >
                    {link.label}
                  </Link>
                  <div style={{ paddingLeft: 16, paddingTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {link.sub.map((sub) => (
                      <Link
                        key={sub.label}
                        href={sub.href}
                        onClick={() => { setMobileOpen(false); feedback('light'); }}
                        style={{ display: 'block', padding: '8px 16px', borderRadius: 9, color: '#5b7a99', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}
