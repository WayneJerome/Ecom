'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, ShoppingCart, Package, Users, TrendingUp,
  TrendingDown, ArrowUpRight, Bike, Clock
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatPrice, formatDate } from '@/lib/utils';
import { GlassCard } from '@/components/shared/GlassCard';

interface StatCardData {
  label: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  color: string;
  bg: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0, totalOrders: 0, pendingOrders: 0, activeRiders: 0,
    revenueChange: 12.5, ordersChange: 8.3,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadDashboard() {
    try {
      // Fetch orders
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (orders) {
        const total = orders.reduce((s: number, o: any) => s + (o.total || 0), 0);
        const pending = orders.filter((o: any) => o.status === 'pending').length;
        setStats((prev) => ({
          ...prev,
          totalRevenue: total,
          totalOrders: orders.length,
          pendingOrders: pending,
        }));
        setRecentOrders(orders.slice(0, 5));
      }

      // Fetch active riders
      const { count } = await supabase
        .from('rider_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('active', true);
      if (count) setStats((prev) => ({ ...prev, activeRiders: count }));
    } catch { /* fallback */ }
    setLoading(false);
  }

  const statCards: StatCardData[] = [
    {
      label: 'Total Revenue', value: formatPrice(stats.totalRevenue),
      change: stats.revenueChange, icon: <DollarSign size={22} />,
      color: '#10b981', bg: 'rgba(16,185,129,0.1)',
    },
    {
      label: 'Total Orders', value: stats.totalOrders.toString(),
      change: stats.ordersChange, icon: <ShoppingCart size={22} />,
      color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)',
    },
    {
      label: 'Pending Orders', value: stats.pendingOrders.toString(),
      change: 0, icon: <Clock size={22} />,
      color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',
    },
    {
      label: 'Active Riders', value: stats.activeRiders.toString(),
      change: 0, icon: <Bike size={22} />,
      color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)',
    },
  ];

  const statusColors: Record<string, string> = {
    pending: '#f59e0b', confirmed: '#0ea5e9', processing: '#3b82f6',
    in_transit: '#8b5cf6', delivered: '#10b981', cancelled: '#ef4444', failed: '#ef4444',
  };

  return (
    <div>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 28, fontWeight: 800, color: '#0a1628' }}>
          Dashboard
        </h1>
        <p style={{ color: '#5b7a99', fontSize: 14, marginTop: 4 }}>
          Welcome back! Here's your store overview.
        </p>
      </motion.div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <div style={{
              padding: 22, borderRadius: 20,
              background: 'rgba(255,255,255,0.95)',
              border: '1.5px solid rgba(14,165,233,0.08)',
              boxShadow: '0 2px 16px rgba(14,165,233,0.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: stat.bg, color: stat.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {stat.icon}
                </div>
                {stat.change !== 0 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 2,
                    fontSize: 12, fontWeight: 700,
                    color: stat.change > 0 ? '#10b981' : '#ef4444',
                  }}>
                    {stat.change > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {Math.abs(stat.change)}%
                  </div>
                )}
              </div>
              <p style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 24, fontWeight: 800, color: '#0a1628', marginBottom: 4 }}>
                {loading ? '—' : stat.value}
              </p>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#94b4cc' }}>{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          padding: 24, borderRadius: 20,
          background: 'rgba(255,255,255,0.95)',
          border: '1.5px solid rgba(14,165,233,0.08)',
          boxShadow: '0 2px 16px rgba(14,165,233,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: 17, color: '#0a1628' }}>
            Recent Orders
          </h3>
          <a href="/admin/orders" style={{ fontSize: 13, fontWeight: 600, color: '#0ea5e9', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            View All <ArrowUpRight size={14} />
          </a>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 56, borderRadius: 12 }} />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <p style={{ color: '#94b4cc', textAlign: 'center', padding: 40 }}>No orders yet</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(14,165,233,0.08)' }}>
                  {['Reference', 'Customer', 'Amount', 'Status', 'Date'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#94b4cc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order: any) => (
                  <tr key={order.id} style={{ borderBottom: '1px solid rgba(14,165,233,0.05)' }}>
                    <td style={{ padding: '12px', fontSize: 14, fontWeight: 600, color: '#0a1628' }}>
                      {(order.paystack_ref || order.id).slice(0, 12).toUpperCase()}
                    </td>
                    <td style={{ padding: '12px', fontSize: 13, color: '#5b7a99' }}>
                      {order.customer_email}
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, color: '#0a1628' }}>
                      {formatPrice(order.total)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8,
                        background: `${statusColors[order.status] || '#6b7280'}18`,
                        color: statusColors[order.status] || '#6b7280',
                        textTransform: 'capitalize',
                      }}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: 12, color: '#94b4cc' }}>
                      {formatDate(order.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
