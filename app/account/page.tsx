'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useUser, useClerk } from '@clerk/nextjs';
import {
  Package, Heart, MapPin, LogOut, User, Settings,
  ChevronRight, ShieldCheck
} from 'lucide-react';
import { Navbar } from '@/components/store/Navbar';
import { feedback } from '@/lib/haptic';
import { getInitials } from '@/lib/utils';

export default function AccountPage() {
  const { user } = useUser();
  const { signOut } = useClerk();

  if (!user) return null;

  const menuItems = [
    { icon: <Package size={20} />, label: 'My Orders', desc: 'View order history & tracking', href: '/orders', color: '#0ea5e9' },
    { icon: <Heart size={20} />, label: 'Wishlist', desc: 'Saved items for later', href: '/wishlist', color: '#ef4444' },
    { icon: <MapPin size={20} />, label: 'Addresses', desc: 'Manage delivery addresses', href: '#', color: '#10b981' },
    { icon: <Settings size={20} />, label: 'Settings', desc: 'Account preferences', href: '#', color: '#8b5cf6' },
  ];

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 700, margin: '0 auto', padding: '24px 24px 80px' }}>
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: 28, borderRadius: 24,
            background: 'linear-gradient(135deg, rgba(14,165,233,0.08), rgba(59,130,246,0.06))',
            border: '1.5px solid rgba(14,165,233,0.12)',
            display: 'flex', alignItems: 'center', gap: 20,
            marginBottom: 28,
          }}
        >
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 24,
            fontFamily: 'Space Grotesk, sans-serif',
            boxShadow: '0 8px 28px rgba(14,165,233,0.35)',
          }}>
            {user.imageUrl ? (
              <img src={user.imageUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: 20, objectFit: 'cover' }} />
            ) : (
              getInitials(user.fullName || 'U')
            )}
          </div>
          <div>
            <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 24, fontWeight: 800, color: '#0a1628', marginBottom: 4 }}>
              {user.fullName || 'User'}
            </h1>
            <p style={{ color: '#5b7a99', fontSize: 14 }}>
              {user.primaryEmailAddress?.emailAddress}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <ShieldCheck size={14} color="#10b981" />
              <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>Verified Account</span>
            </div>
          </div>
        </motion.div>

        {/* Menu Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {menuItems.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <Link
                href={item.href}
                onClick={() => feedback('light')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '18px 20px', borderRadius: 18, textDecoration: 'none',
                  background: 'rgba(255,255,255,0.95)',
                  border: '1.5px solid rgba(14,165,233,0.08)',
                  boxShadow: '0 2px 8px rgba(14,165,233,0.04)',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: `${item.color}12`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: item.color,
                }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: 15, color: '#0a1628' }}>{item.label}</p>
                  <p style={{ fontSize: 13, color: '#94b4cc' }}>{item.desc}</p>
                </div>
                <ChevronRight size={18} color="#94b4cc" />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Sign Out */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { signOut(); feedback('light'); }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            width: '100%', marginTop: 28, padding: '16px 20px',
            borderRadius: 16, background: 'rgba(239,68,68,0.06)',
            border: '1.5px solid rgba(239,68,68,0.15)',
            color: '#ef4444', fontSize: 15, fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <LogOut size={18} /> Sign Out
        </motion.button>
      </main>
    </>
  );
}
