'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Navigation, Phone, MapPin, Package,
  Check, Clock, Loader2
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { createClient } from '@/lib/supabase/client';
import { formatPrice, formatDate, getOrderStatusLabel } from '@/lib/utils';
import { feedback } from '@/lib/haptic';
import { HapticButton } from '@/components/shared/HapticButton';
import { MapView } from '@/components/shared/MapView';

export default function RiderDeliveryPage() {
  const { id } = useParams();
  const { user } = useUser();
  const [order, setOrder] = useState<any>(null);
  const [tracking, setTracking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [gpsActive, setGpsActive] = useState(false);
  const [riderPos, setRiderPos] = useState<{ lat: number; lng: number } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadDelivery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadDelivery() {
    const { data: orderData } = await supabase.from('orders').select('*').eq('id', id).single();
    if (orderData) setOrder(orderData);

    const { data: trackingData } = await supabase
      .from('order_tracking')
      .select('*')
      .eq('order_id', id)
      .order('created_at', { ascending: false });
    if (trackingData) {
      setTracking(trackingData);
      const latest = trackingData.find((t: any) => t.lat && t.lng);
      if (latest) setRiderPos({ lat: latest.lat, lng: latest.lng });
    }
    setLoading(false);
  }

  // Auto GPS broadcast
  const startGPSTracking = useCallback(() => {
    if (!navigator.geolocation) return;
    setGpsActive(true);
    feedback('success', 'success');

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setRiderPos({ lat: latitude, lng: longitude });

        // Update rider profile
        if (user?.id) {
          const { data: profile } = await supabase
            .from('rider_profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

          if (profile) {
            await supabase.from('rider_profiles')
              .update({ current_lat: latitude, current_lng: longitude })
              .eq('id', profile.id);
          }
        }

        // Insert tracking point
        await supabase.from('order_tracking').insert({
          order_id: id,
          status: 'in_transit',
          note: 'Live GPS tracking update',
          lat: latitude,
          lng: longitude,
        });
      },
      (err) => { console.error('GPS error:', err); },
      { enableHighAccuracy: true, maximumAge: 5000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [id, user?.id, supabase]);

  async function markDelivered() {
    await supabase.from('orders').update({ status: 'delivered' }).eq('id', id);
    await supabase.from('order_tracking').insert({
      order_id: id,
      status: 'delivered',
      note: 'Order marked as delivered by rider',
      lat: riderPos?.lat,
      lng: riderPos?.lng,
    });
    setOrder((prev: any) => prev ? { ...prev, status: 'delivered' } : prev);
    setGpsActive(false);
    feedback('success', 'success');
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
        <div className="skeleton" style={{ height: 400, borderRadius: 24 }} />
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <p style={{ color: '#5b7a99' }}>Delivery not found</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 24px 80px' }}>
      <Link href="/rider" onClick={() => feedback('light')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#0ea5e9', fontWeight: 600, fontSize: 14, textDecoration: 'none', marginBottom: 24 }}>
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 22, fontWeight: 800, color: '#0a1628' }}>
              Delivery #{(order.paystack_ref || order.id).slice(0, 12).toUpperCase()}
            </h1>
            <p style={{ color: '#94b4cc', fontSize: 13 }}>
              {getOrderStatusLabel(order.status)} • {formatDate(order.created_at)}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {order.status === 'in_transit' && !gpsActive && (
              <HapticButton variant="primary" onClick={startGPSTracking}>
                <Navigation size={15} /> Start GPS Tracking
              </HapticButton>
            )}
            {gpsActive && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 12, background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: 12, fontWeight: 700 }}>
                <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                </motion.div>
                GPS Active
              </div>
            )}
            {order.status === 'in_transit' && (
              <HapticButton variant="dark" onClick={markDelivered} haptic="success" sound="success">
                <Check size={15} /> Mark Delivered
              </HapticButton>
            )}
          </div>
        </div>

        {/* Map */}
        <div style={{
          padding: 4, borderRadius: 24, marginBottom: 20,
          background: 'rgba(255,255,255,0.95)',
          border: '1.5px solid rgba(14,165,233,0.1)',
          overflow: 'hidden',
        }}>
          <MapView
            center={riderPos ? [riderPos.lat, riderPos.lng] : [-1.2921, 36.8219]}
            zoom={15}
            height="350px"
            markers={[
              ...(riderPos ? [{ id: 'rider', lat: riderPos.lat, lng: riderPos.lng, label: 'You (Rider)', type: 'rider' as const }] : []),
              ...(order.delivery_address?.lat ? [{
                id: 'dest', lat: order.delivery_address.lat, lng: order.delivery_address.lng,
                label: order.delivery_address.full_name || 'Drop-off', type: 'destination' as const,
              }] : []),
            ]}
            routePoints={
              riderPos && order.delivery_address?.lat
                ? [[riderPos.lat, riderPos.lng], [order.delivery_address.lat, order.delivery_address.lng]]
                : []
            }
          />
        </div>

        {/* Delivery Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div style={{
            padding: 20, borderRadius: 20,
            background: 'rgba(255,255,255,0.95)',
            border: '1.5px solid rgba(14,165,233,0.08)',
          }}>
            <h4 style={{ fontWeight: 700, fontSize: 14, color: '#0a1628', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={15} color="#0ea5e9" /> Drop-off
            </h4>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#0a1628' }}>{order.delivery_address?.full_name}</p>
            <p style={{ fontSize: 13, color: '#5b7a99', marginTop: 4 }}>{order.delivery_address?.address_line1}</p>
            <p style={{ fontSize: 13, color: '#5b7a99' }}>{order.delivery_address?.city}</p>
            <a href={`tel:${order.delivery_address?.phone}`} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10,
              padding: '8px 14px', borderRadius: 10,
              background: 'rgba(14,165,233,0.07)', color: '#0ea5e9',
              fontWeight: 600, fontSize: 13, textDecoration: 'none',
            }}>
              <Phone size={14} /> Call Customer
            </a>
          </div>

          <div style={{
            padding: 20, borderRadius: 20,
            background: 'rgba(255,255,255,0.95)',
            border: '1.5px solid rgba(14,165,233,0.08)',
          }}>
            <h4 style={{ fontWeight: 700, fontSize: 14, color: '#0a1628', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Package size={15} color="#0ea5e9" /> Order Info
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#5b7a99' }}>Items</span>
                <span style={{ fontWeight: 600, color: '#0a1628' }}>{order.items?.length || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#5b7a99' }}>Amount</span>
                <span style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, color: '#0a1628' }}>{formatPrice(order.total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#5b7a99' }}>Status</span>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                  background: order.status === 'delivered' ? 'rgba(16,185,129,0.1)' : 'rgba(139,92,246,0.1)',
                  color: order.status === 'delivered' ? '#10b981' : '#8b5cf6',
                }}>
                  {getOrderStatusLabel(order.status)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
