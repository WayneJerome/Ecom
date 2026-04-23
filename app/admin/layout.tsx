'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingCart, Users, Settings,
  Tag, Bell, ChevronLeft, LogOut, Bike
} from 'lucide-react';
import { useUser, useClerk } from '@clerk/nextjs';
import { feedback } from '@/lib/haptic';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/riders', label: 'Riders', icon: Bike },
  { href: '/admin/offers', label: 'Offers', icon: Tag },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f4f8' }}>
      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: 'fixed', left: 0, top: 0, bottom: 0,
          background: 'linear-gradient(180deg, #0c1a2e 0%, #0f2847 100%)',
          display: 'flex', flexDirection: 'column',
          zIndex: 40, overflow: 'hidden',
          boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
        }}
      >
        {/* Logo */}
        <div style={{
          padding: collapsed ? '20px 16px' : '20px 20px',
          borderBottom: '1px solid rgba(14,165,233,0.15)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg,#0ea5e9,#0284c7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(14,165,233,0.4)',
          }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 16 }}>V</span>
          </div>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 800, fontSize: 17, color: '#fff', letterSpacing: '-0.03em' }}
            >
              Admin
            </motion.span>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => feedback('light')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: collapsed ? '12px 14px' : '11px 16px',
                  borderRadius: 12, textDecoration: 'none',
                  background: isActive ? 'rgba(14,165,233,0.15)' : 'transparent',
                  color: isActive ? '#38bdf8' : 'rgba(255,255,255,0.55)',
                  fontWeight: isActive ? 700 : 500, fontSize: 14,
                  transition: 'all 0.2s', justifyContent: collapsed ? 'center' : undefined,
                  position: 'relative',
                }}
              >
                {isActive && !collapsed && (
                  <motion.div layoutId="admin-active"
                    style={{
                      position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                      width: 3, height: 20, borderRadius: 2,
                      background: '#0ea5e9',
                    }}
                  />
                )}
                <Icon size={20} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(14,165,233,0.15)' }}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : undefined,
              gap: 10, width: '100%', padding: '10px 14px', borderRadius: 10,
              background: 'rgba(255,255,255,0.05)', border: 'none',
              color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 13,
            }}
          >
            <ChevronLeft size={18} style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0)', transition: '0.3s' }} />
            {!collapsed && 'Collapse'}
          </button>
          <button
            onClick={() => { signOut(); feedback('light'); }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : undefined,
              gap: 10, width: '100%', padding: '10px 14px', borderRadius: 10, marginTop: 4,
              background: 'none', border: 'none',
              color: 'rgba(239,68,68,0.7)', cursor: 'pointer', fontSize: 13,
            }}
          >
            <LogOut size={18} />
            {!collapsed && 'Sign Out'}
          </button>
        </div>
      </motion.aside>

      {/* Content */}
      <motion.div
        animate={{ marginLeft: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        style={{ flex: 1, padding: 24, minWidth: 0 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
