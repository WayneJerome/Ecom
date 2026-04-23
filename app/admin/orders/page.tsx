'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronDown, Eye } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatPrice, formatDate, getOrderStatusLabel } from '@/lib/utils';
import { feedback } from '@/lib/haptic';
import type { OrderStatus } from '@/types';

const STATUSES: OrderStatus[] = ['pending', 'confirmed', 'processing', 'in_transit', 'delivered', 'cancelled', 'failed'];

const statusColors: Record<string, string> = {
  pending: '#f59e0b', confirmed: '#0ea5e9', processing: '#3b82f6',
  in_transit: '#8b5cf6', delivered: '#10b981', cancelled: '#ef4444', failed: '#ef4444',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const supabase = createClient();

  useEffect(() => { loadOrders(); }, []);

  async function loadOrders() {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setOrders(data);
    setLoading(false);
  }

  async function updateStatus(orderId: string, newStatus: OrderStatus) {
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    // Insert tracking record
    await supabase.from('order_tracking').insert({
      order_id: orderId,
      status: newStatus,
      note: `Status updated to ${getOrderStatusLabel(newStatus)} by admin`,
    });
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    feedback('success', 'success');
  }

  const filtered = orders.filter((o) => {
    const matchSearch = !search || (o.paystack_ref || o.id).toLowerCase().includes(search.toLowerCase())
      || o.customer_email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 24, fontWeight: 800, color: '#0a1628' }}>Orders</h1>
        <p style={{ color: '#94b4cc', fontSize: 13 }}>{orders.length} total orders</p>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94b4cc' }} />
          <input className="input" placeholder="Search orders..." value={search}
            onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 40, borderRadius: 12 }} />
        </div>
        <select className="input" style={{ borderRadius: 12, width: 'auto', minWidth: 150 }}
          value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{getOrderStatusLabel(s)}</option>)}
        </select>
      </div>

      {/* Status Filter Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
        {['all', ...STATUSES].map((s) => {
          const count = s === 'all' ? orders.length : orders.filter((o) => o.status === s).length;
          return (
            <motion.button
              key={s}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setFilterStatus(s); feedback('light'); }}
              style={{
                padding: '6px 14px', borderRadius: 10,
                border: filterStatus === s ? '1.5px solid #0ea5e9' : '1.5px solid rgba(14,165,233,0.12)',
                background: filterStatus === s ? 'rgba(14,165,233,0.1)' : 'white',
                fontSize: 12, fontWeight: filterStatus === s ? 700 : 500,
                color: filterStatus === s ? '#0284c7' : '#5b7a99',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {s === 'all' ? 'All' : getOrderStatusLabel(s as OrderStatus)} ({count})
            </motion.button>
          );
        })}
      </div>

      {/* Table */}
      <div style={{
        borderRadius: 20, background: 'rgba(255,255,255,0.95)',
        border: '1.5px solid rgba(14,165,233,0.08)', overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: 40 }}><div className="skeleton" style={{ height: 200, borderRadius: 12 }} /></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(14,165,233,0.08)' }}>
                  {['Reference', 'Customer', 'Items', 'Total', 'Status', 'Date', 'Actions'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#94b4cc', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id} style={{ borderBottom: '1px solid rgba(14,165,233,0.04)' }}>
                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: '#0a1628' }}>
                      {(order.paystack_ref || order.id).slice(0, 12).toUpperCase()}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#0a1628' }}>{order.customer_email}</p>
                      <p style={{ fontSize: 11, color: '#94b4cc' }}>{order.customer_phone}</p>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: '#5b7a99' }}>
                      {order.items?.length || 0}
                    </td>
                    <td style={{ padding: '12px 14px', fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, color: '#0a1628' }}>
                      {formatPrice(order.total)}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {/* Status Dropdown */}
                      <div style={{ position: 'relative' }}>
                        <select
                          value={order.status}
                          onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                          style={{
                            appearance: 'none',
                            padding: '5px 28px 5px 10px',
                            borderRadius: 8, fontSize: 11, fontWeight: 700,
                            background: `${statusColors[order.status]}15`,
                            color: statusColors[order.status],
                            border: `1.5px solid ${statusColors[order.status]}30`,
                            cursor: 'pointer', outline: 'none',
                          }}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>{getOrderStatusLabel(s)}</option>
                          ))}
                        </select>
                        <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: statusColors[order.status] }} />
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#94b4cc' }}>
                      {formatDate(order.created_at)}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <a href={`/orders/${order.id}`} target="_blank" rel="noreferrer"
                        style={{
                          width: 30, height: 30, borderRadius: 8,
                          background: 'rgba(14,165,233,0.07)',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          color: '#5b7a99',
                        }}>
                        <Eye size={14} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
