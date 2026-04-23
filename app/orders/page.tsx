'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Package, ChevronRight, Clock, Truck, Check, XCircle, AlertTriangle } from 'lucide-react';
import { formatPrice, formatDate, getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils';
import { feedback } from '@/lib/haptic';
import { Navbar } from '@/components/store/Navbar';
import type { Order, OrderStatus } from '@/types';

const STATUS_ICONS: Record<OrderStatus, React.ReactNode> = {
  pending: <Clock size={16} />,
  confirmed: <Check size={16} />,
  processing: <Package size={16} />,
  in_transit: <Truck size={16} />,
  delivered: <Check size={16} />,
  cancelled: <XCircle size={16} />,
  failed: <AlertTriangle size={16} />,
};

const STATUS_BG: Record<OrderStatus, string> = {
  pending: 'rgba(245,158,11,0.1)',
  confirmed: 'rgba(14,165,233,0.1)',
  processing: 'rgba(59,130,246,0.1)',
  in_transit: 'rgba(139,92,246,0.1)',
  delivered: 'rgba(16,185,129,0.1)',
  cancelled: 'rgba(239,68,68,0.1)',
  failed: 'rgba(239,68,68,0.1)',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/orders');
        const data = await res.json();
        setOrders(data.orders || []);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '24px 24px 80px' }}>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 28, fontWeight: 800, color: '#0a1628', marginBottom: 8 }}
        >
          My Orders
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          style={{ color: '#5b7a99', fontSize: 15, marginBottom: 32 }}
        >
          Track and manage your purchases
        </motion.p>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 110, borderRadius: 20 }} />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', padding: '80px 20px' }}
          >
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(14,165,233,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Package size={36} color="#94b4cc" />
            </div>
            <h3 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 20, fontWeight: 700, color: '#0a1628', marginBottom: 8 }}>
              No orders yet
            </h3>
            <p style={{ color: '#5b7a99', marginBottom: 20 }}>Your order history will appear here.</p>
            <Link href="/shop">
              <button className="btn btn-primary" onClick={() => feedback('light')}>Start Shopping</button>
            </Link>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {orders.map((order, idx) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link
                  href={`/orders/${order.id}`}
                  onClick={() => feedback('light')}
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <div style={{
                    padding: '18px 20px',
                    borderRadius: 20,
                    background: 'rgba(255,255,255,0.95)',
                    border: '1.5px solid rgba(14,165,233,0.1)',
                    boxShadow: '0 2px 12px rgba(14,165,233,0.05)',
                    display: 'flex', alignItems: 'center', gap: 16,
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                  }}>
                    {/* Status Badge */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                      background: STATUS_BG[order.status],
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span className={getOrderStatusColor(order.status)}>{STATUS_ICONS[order.status]}</span>
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#0a1628' }}>
                          {order.paystack_ref || order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                          background: STATUS_BG[order.status],
                        }} className={getOrderStatusColor(order.status)}>
                          {getOrderStatusLabel(order.status)}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: '#94b4cc' }}>
                        {order.items?.length || 0} items • {formatDate(order.created_at)}
                      </p>
                    </div>

                    {/* Price */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 800, fontSize: 16, color: '#0a1628' }}>
                        {formatPrice(order.total)}
                      </p>
                    </div>

                    <ChevronRight size={18} color="#94b4cc" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
