'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Package, Clock, Check, Truck, MapPin,
  XCircle, AlertTriangle, Phone, Mail
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatPrice, formatDate, getOrderStatusLabel } from '@/lib/utils';
import { feedback } from '@/lib/haptic';
import { Navbar } from '@/components/store/Navbar';
import { MapView } from '@/components/shared/MapView';
import type { Order, OrderTracking, OrderStatus } from '@/types';

const STATUS_STEPS: OrderStatus[] = ['pending', 'confirmed', 'processing', 'in_transit', 'delivered'];

const STATUS_CONFIG: Record<OrderStatus, { icon: React.ReactNode; color: string; bg: string }> = {
  pending: { icon: <Clock size={18} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  confirmed: { icon: <Check size={18} />, color: '#0ea5e9', bg: 'rgba(14,165,233,0.12)' },
  processing: { icon: <Package size={18} />, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  in_transit: { icon: <Truck size={18} />, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  delivered: { icon: <Check size={18} />, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  cancelled: { icon: <XCircle size={18} />, color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  failed: { icon: <AlertTriangle size={18} />, color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState<OrderTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [riderLocation, setRiderLocation] = useState<{ lat: number; lng: number } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadOrder();
    // Subscribe to realtime updates
    const channel = supabase
      .channel(`order-${id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'order_tracking',
        filter: `order_id=eq.${id}`,
      }, (payload) => {
        if (payload.new) {
          const newTrack = payload.new as OrderTracking;
          setTracking((prev) => [newTrack, ...prev]);
          if (newTrack.lat && newTrack.lng) {
            setRiderLocation({ lat: newTrack.lat, lng: newTrack.lng });
          }
          feedback('medium', 'pop');
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadOrder() {
    try {
      const { data: orderData } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (orderData) setOrder(orderData as unknown as Order);

      const { data: trackingData } = await supabase
        .from('order_tracking')
        .select('*')
        .eq('order_id', id)
        .order('created_at', { ascending: false });

      if (trackingData) {
        setTracking(trackingData as OrderTracking[]);
        const latest = trackingData.find((t: any) => t.lat && t.lng);
        if (latest) setRiderLocation({ lat: (latest as any).lat, lng: (latest as any).lng });
      }
    } catch { /* fallback */ }
    setLoading(false);
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
          <div className="skeleton" style={{ height: 32, width: '40%', borderRadius: 12, marginBottom: 20 }} />
          <div className="skeleton" style={{ height: 200, borderRadius: 20, marginBottom: 16 }} />
          <div className="skeleton" style={{ height: 300, borderRadius: 20 }} />
        </div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Navbar />
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
          <Package size={48} color="#94b4cc" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 24, fontWeight: 700, color: '#0a1628' }}>
            Order not found
          </h2>
          <Link href="/orders" style={{ color: '#0ea5e9', fontWeight: 600, marginTop: 16, display: 'inline-block' }}>
            ← Back to Orders
          </Link>
        </div>
      </>
    );
  }

  const currentStepIdx = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === 'cancelled' || order.status === 'failed';

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '24px 24px 80px' }}>
        {/* Back */}
        <Link href="/orders" onClick={() => feedback('light')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#0ea5e9', fontWeight: 600, fontSize: 14, textDecoration: 'none', marginBottom: 24 }}>
          <ArrowLeft size={16} /> Back to Orders
        </Link>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
            <div>
              <h1 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 24, fontWeight: 800, color: '#0a1628' }}>
                Order #{(order.paystack_ref || order.id).slice(0, 12).toUpperCase()}
              </h1>
              <p style={{ color: '#94b4cc', fontSize: 13, marginTop: 4 }}>Placed {formatDate(order.created_at)}</p>
            </div>
            <div style={{
              padding: '8px 16px', borderRadius: 12,
              background: STATUS_CONFIG[order.status].bg,
              color: STATUS_CONFIG[order.status].color,
              fontSize: 14, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {STATUS_CONFIG[order.status].icon}
              {getOrderStatusLabel(order.status)}
            </div>
          </div>
        </motion.div>

        {/* Status Timeline */}
        {!isCancelled && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              padding: 24, borderRadius: 20,
              background: 'rgba(255,255,255,0.95)',
              border: '1.5px solid rgba(14,165,233,0.1)',
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
              {/* Progress Line */}
              <div style={{
                position: 'absolute', top: 18, left: 18, right: 18, height: 3,
                background: 'rgba(14,165,233,0.1)', borderRadius: 2, zIndex: 0,
              }}>
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: `${(currentStepIdx / (STATUS_STEPS.length - 1)) * 100}%` }}
                  transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                  style={{
                    height: '100%', borderRadius: 2,
                    background: 'linear-gradient(90deg, #0ea5e9, #0284c7)',
                  }}
                />
              </div>

              {STATUS_STEPS.map((status, i) => {
                const isActive = i <= currentStepIdx;
                const isCurrent = i === currentStepIdx;
                return (
                  <div key={status} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 1 }}>
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: isCurrent ? 1.1 : 1 }}
                      style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: isActive ? 'linear-gradient(135deg, #0ea5e9, #0284c7)' : 'rgba(14,165,233,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: isActive ? '#fff' : '#94b4cc',
                        boxShadow: isCurrent ? '0 0 0 4px rgba(14,165,233,0.2)' : 'none',
                        transition: 'all 0.3s',
                      }}
                    >
                      {STATUS_CONFIG[status].icon}
                    </motion.div>
                    <p style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, color: isActive ? '#0a1628' : '#94b4cc', textAlign: 'center', maxWidth: 60 }}>
                      {getOrderStatusLabel(status)}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Live Map for in_transit */}
        {order.status === 'in_transit' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{ marginBottom: 20 }}
          >
            <div style={{
              padding: 4, borderRadius: 24,
              background: 'rgba(255,255,255,0.95)',
              border: '1.5px solid rgba(14,165,233,0.1)',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '14px 20px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', animation: 'pulse-ring 2s infinite' }} />
                <p style={{ fontSize: 14, fontWeight: 700, color: '#0a1628' }}>📍 Live Tracking</p>
              </div>
              <MapView
                center={riderLocation ? [riderLocation.lat, riderLocation.lng] : [-1.2921, 36.8219]}
                zoom={15}
                height="300px"
                markers={[
                  ...(riderLocation ? [{ id: 'rider', lat: riderLocation.lat, lng: riderLocation.lng, label: 'Rider', type: 'rider' as const }] : []),
                  ...(order.delivery_address?.lat ? [{ id: 'dest', lat: order.delivery_address.lat, lng: order.delivery_address.lng!, label: 'Delivery', type: 'destination' as const }] : []),
                ]}
              />
            </div>
          </motion.div>
        )}

        {/* Order Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            padding: 24, borderRadius: 20,
            background: 'rgba(255,255,255,0.95)',
            border: '1.5px solid rgba(14,165,233,0.1)',
            marginBottom: 20,
          }}
        >
          <h3 style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: 16, color: '#0a1628', marginBottom: 16 }}>
            Items ({order.items?.length || 0})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {order.items?.map((item: any, i: number) => (
              <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: 12, overflow: 'hidden', background: '#f0f9ff', flexShrink: 0, position: 'relative' }}>
                  {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" sizes="56px" />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#0a1628' }}>{item.name}</p>
                  <p style={{ fontSize: 12, color: '#94b4cc' }}>
                    {item.size} • {item.color?.name} • Qty: {item.quantity}
                  </p>
                </div>
                <p style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, color: '#0a1628' }}>
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div style={{ borderTop: '1px solid rgba(14,165,233,0.1)', marginTop: 16, paddingTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: '#5b7a99', fontSize: 14 }}>Subtotal</span>
              <span style={{ fontWeight: 600, color: '#0a1628' }}>{formatPrice(order.subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: '#5b7a99', fontSize: 14 }}>Delivery</span>
              <span style={{ fontWeight: 600, color: order.delivery_fee === 0 ? '#10b981' : '#0a1628' }}>
                {order.delivery_fee === 0 ? 'FREE' : formatPrice(order.delivery_fee)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(14,165,233,0.1)', paddingTop: 10, marginTop: 6 }}>
              <span style={{ fontWeight: 700, color: '#0a1628', fontSize: 16 }}>Total</span>
              <span style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 800, color: '#0a1628', fontSize: 18 }}>{formatPrice(order.total)}</span>
            </div>
          </div>
        </motion.div>

        {/* Delivery Address */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          style={{
            padding: 24, borderRadius: 20,
            background: 'rgba(255,255,255,0.95)',
            border: '1.5px solid rgba(14,165,233,0.1)',
            marginBottom: 20,
          }}
        >
          <h3 style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: 16, color: '#0a1628', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={18} color="#0ea5e9" /> Delivery Address
          </h3>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#0a1628' }}>{order.delivery_address?.full_name}</p>
          <p style={{ fontSize: 13, color: '#5b7a99', marginTop: 4 }}>{order.delivery_address?.address_line1}</p>
          {order.delivery_address?.address_line2 && <p style={{ fontSize: 13, color: '#5b7a99' }}>{order.delivery_address?.address_line2}</p>}
          <p style={{ fontSize: 13, color: '#5b7a99' }}>
            {order.delivery_address?.city}, {order.delivery_address?.county}
          </p>
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            <span style={{ fontSize: 12, color: '#5b7a99', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Phone size={12} /> {order.delivery_address?.phone}
            </span>
            <span style={{ fontSize: 12, color: '#5b7a99', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Mail size={12} /> {order.customer_email}
            </span>
          </div>
        </motion.div>

        {/* Tracking History */}
        {tracking.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              padding: 24, borderRadius: 20,
              background: 'rgba(255,255,255,0.95)',
              border: '1.5px solid rgba(14,165,233,0.1)',
            }}
          >
            <h3 style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: 16, color: '#0a1628', marginBottom: 16 }}>
              Tracking History
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {tracking.map((t, i) => (
                <div key={t.id} style={{ display: 'flex', gap: 14, paddingBottom: i < tracking.length - 1 ? 16 : 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: i === 0 ? '#0ea5e9' : '#e2e8f0',
                      flexShrink: 0,
                    }} />
                    {i < tracking.length - 1 && <div style={{ width: 2, flex: 1, background: '#e2e8f0', marginTop: 4 }} />}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: i === 0 ? '#0a1628' : '#5b7a99' }}>
                      {getOrderStatusLabel(t.status)}
                    </p>
                    {t.note && <p style={{ fontSize: 12, color: '#94b4cc', marginTop: 2 }}>{t.note}</p>}
                    <p style={{ fontSize: 11, color: '#94b4cc', marginTop: 2 }}>{formatDate(t.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </>
  );
}
