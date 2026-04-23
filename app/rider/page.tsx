'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  DollarSign, Package, MapPin, TrendingUp, Clock, Check,
  ChevronRight, Bike, Wallet, ArrowUpRight, Navigation
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { createClient } from '@/lib/supabase/client';
import { formatPrice, formatDate, getOrderStatusLabel } from '@/lib/utils';
import { feedback } from '@/lib/haptic';
import { HapticButton } from '@/components/shared/HapticButton';
import type { OrderStatus } from '@/types';

const statusColors: Record<string, string> = {
  pending: '#f59e0b', confirmed: '#0ea5e9', processing: '#3b82f6',
  in_transit: '#8b5cf6', delivered: '#10b981', cancelled: '#ef4444', failed: '#ef4444',
};

export default function RiderDashboard() {
  const { user } = useUser();
  const [riderProfile, setRiderProfile] = useState<any>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [broadcasting, setBroadcasting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (user?.id) loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function loadDashboard() {
    try {
      // Get rider profile
      const { data: profile } = await supabase
        .from('rider_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (profile) {
        setRiderProfile(profile);

        // Get assigned deliveries
        const { data: orders } = await supabase
          .from('orders')
          .select('*')
          .eq('rider_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(20);
        if (orders) setDeliveries(orders);

        // Get earnings
        const { data: earningsData } = await supabase
          .from('rider_earnings')
          .select('*')
          .eq('rider_id', profile.id)
          .order('created_at', { ascending: false });
        if (earningsData) setEarnings(earningsData);
      }
    } catch { /* fallback */ }
    setLoading(false);
  }

  // Broadcast GPS location
  async function broadcastLocation() {
    if (!riderProfile || !navigator.geolocation) return;
    setBroadcasting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        // Update rider profile position
        await supabase
          .from('rider_profiles')
          .update({ current_lat: latitude, current_lng: longitude })
          .eq('id', riderProfile.id);

        // Insert tracking for active in_transit orders
        const activeDelivery = deliveries.find((d) => d.status === 'in_transit');
        if (activeDelivery) {
          await supabase.from('order_tracking').insert({
            order_id: activeDelivery.id,
            status: 'in_transit',
            note: 'GPS location update',
            lat: latitude,
            lng: longitude,
          });
        }
        feedback('success', 'success');
        setBroadcasting(false);
      },
      () => { setBroadcasting(false); feedback('error', 'error'); },
      { enableHighAccuracy: true },
    );
  }

  // Deploy STK Push for delivery payment
  async function deploySTKPush(orderId: string) {
    feedback('light', 'pop');
    try {
      const order = deliveries.find((d) => d.id === orderId);
      if (!order) return;
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: order.items || [],
          customer: { email: order.customer_email, phone: order.customer_phone, full_name: '' },
          delivery_address: order.delivery_address || {},
          subtotal: order.subtotal, delivery_fee: order.delivery_fee, total: order.total,
          reference: `RD-${orderId.slice(0, 8)}`,
          payment_method: 'mpesa',
        }),
      });
      if (res.ok) feedback('success', 'success');
    } catch {
      feedback('error', 'error');
    }
  }

  const totalEarnings = earnings.reduce((s, e) => s + (e.amount || 0), 0);
  const pendingPayouts = earnings.filter((e) => e.payout_status === 'pending').reduce((s, e) => s + e.amount, 0);
  const completedDeliveries = deliveries.filter((d) => d.status === 'delivered').length;
  const activeDeliveries = deliveries.filter((d) => d.status === 'in_transit' || d.status === 'processing');

  if (loading) {
    return (
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>
        <div className="skeleton" style={{ height: 60, borderRadius: 16, marginBottom: 20 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 130, borderRadius: 20 }} />)}
        </div>
        <div className="skeleton" style={{ height: 300, borderRadius: 20 }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 24px 80px' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 24px rgba(14,165,233,0.35)',
          }}>
            <Bike size={26} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 24, fontWeight: 800, color: '#0a1628' }}>
              Rider Dashboard
            </h1>
            <p style={{ color: '#94b4cc', fontSize: 13 }}>
              {user?.firstName || 'Rider'} • {riderProfile?.vehicle_type || 'motorcycle'}
            </p>
          </div>
        </div>
        <HapticButton variant="primary" onClick={broadcastLocation} loading={broadcasting}>
          <Navigation size={16} /> Broadcast Location
        </HapticButton>
      </motion.div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Earnings', value: formatPrice(totalEarnings), icon: <DollarSign size={22} />, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
          { label: 'Pending Payout', value: formatPrice(pendingPayouts), icon: <Wallet size={22} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
          { label: 'Completed', value: completedDeliveries.toString(), icon: <Check size={22} />, color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' },
          { label: 'Active', value: activeDeliveries.length.toString(), icon: <Package size={22} />, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            style={{
              padding: 20, borderRadius: 20,
              background: 'rgba(255,255,255,0.95)',
              border: '1.5px solid rgba(14,165,233,0.08)',
            }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: stat.bg, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              {stat.icon}
            </div>
            <p style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 22, fontWeight: 800, color: '#0a1628' }}>{stat.value}</p>
            <p style={{ fontSize: 12, color: '#94b4cc', fontWeight: 500 }}>{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Earnings Chart (Simplified Bar Chart) */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        style={{
          padding: 24, borderRadius: 20, marginBottom: 24,
          background: 'rgba(255,255,255,0.95)',
          border: '1.5px solid rgba(14,165,233,0.08)',
        }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: 16, color: '#0a1628' }}>
            Earnings Over Time
          </h3>
          <span style={{ fontSize: 12, color: '#0ea5e9', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <TrendingUp size={14} /> Last 7 days
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140, padding: '0 8px' }}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
            const height = Math.random() * 100 + 20;
            return (
              <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height }}
                  transition={{ duration: 0.6, delay: i * 0.08, ease: [0.4, 0, 0.2, 1] }}
                  style={{
                    width: '100%', borderRadius: 8,
                    background: i === 6 ? 'linear-gradient(180deg, #0ea5e9, #0284c7)' : 'rgba(14,165,233,0.15)',
                    minHeight: 8,
                  }}
                />
                <span style={{ fontSize: 10, color: '#94b4cc', fontWeight: 500 }}>{day}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Active Deliveries */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        style={{
          padding: 24, borderRadius: 20, marginBottom: 24,
          background: 'rgba(255,255,255,0.95)',
          border: '1.5px solid rgba(14,165,233,0.08)',
        }}>
        <h3 style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: 16, color: '#0a1628', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Package size={18} color="#0ea5e9" /> Assigned Deliveries
        </h3>
        {deliveries.length === 0 ? (
          <p style={{ color: '#94b4cc', textAlign: 'center', padding: 40 }}>No deliveries assigned yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {deliveries.slice(0, 10).map((d) => (
              <div key={d.id} style={{
                padding: '14px 16px', borderRadius: 14,
                background: d.status === 'in_transit' ? 'rgba(139,92,246,0.04)' : 'rgba(14,165,233,0.02)',
                border: `1px solid ${d.status === 'in_transit' ? 'rgba(139,92,246,0.15)' : 'rgba(14,165,233,0.06)'}`,
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: `${statusColors[d.status]}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: statusColors[d.status],
                }}>
                  {d.status === 'in_transit' ? <Navigation size={16} /> : <Package size={16} />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#0a1628' }}>
                    #{(d.paystack_ref || d.id).slice(0, 10).toUpperCase()}
                  </p>
                  <p style={{ fontSize: 11, color: '#94b4cc' }}>
                    {d.delivery_address?.city || 'Nairobi'} • {d.items?.length || 0} items
                  </p>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                  background: `${statusColors[d.status]}15`, color: statusColors[d.status],
                }}>
                  {getOrderStatusLabel(d.status)}
                </span>
                <p style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, color: '#0a1628', fontSize: 14 }}>
                  {formatPrice(d.total)}
                </p>
                {d.status === 'processing' && (
                  <HapticButton variant="primary" size="sm" onClick={() => deploySTKPush(d.id)}>
                    Pay
                  </HapticButton>
                )}
                <Link href={`/rider/deliveries/${d.id}`}>
                  <ChevronRight size={16} color="#94b4cc" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Earnings History */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        style={{
          padding: 24, borderRadius: 20,
          background: 'rgba(255,255,255,0.95)',
          border: '1.5px solid rgba(14,165,233,0.08)',
        }}>
        <h3 style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: 16, color: '#0a1628', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Wallet size={18} color="#10b981" /> Earnings History
        </h3>
        {earnings.length === 0 ? (
          <p style={{ color: '#94b4cc', textAlign: 'center', padding: 40 }}>No earnings yet — complete deliveries to start earning!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {earnings.map((e) => (
              <div key={e.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                borderRadius: 12, background: 'rgba(14,165,233,0.02)',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: e.payout_status === 'paid' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: e.payout_status === 'paid' ? '#10b981' : '#f59e0b',
                }}>
                  {e.payout_status === 'paid' ? <Check size={14} /> : <Clock size={14} />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0a1628' }}>
                    Delivery #{e.order_id?.slice(0, 8).toUpperCase()}
                  </p>
                  <p style={{ fontSize: 11, color: '#94b4cc' }}>{formatDate(e.created_at)}</p>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                  background: e.payout_status === 'paid' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                  color: e.payout_status === 'paid' ? '#10b981' : '#f59e0b',
                }}>
                  {e.payout_status}
                </span>
                <p style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 800, color: '#10b981' }}>
                  +{formatPrice(e.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
