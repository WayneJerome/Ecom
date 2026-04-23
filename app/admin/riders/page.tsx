'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bike, Plus, X, Save, CheckCircle, XCircle, DollarSign,
  MapPin, Phone, Shield
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatPrice, formatDate, getInitials } from '@/lib/utils';
import { feedback } from '@/lib/haptic';
import { HapticButton } from '@/components/shared/HapticButton';

export default function AdminRidersPage() {
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', phone: '', vehicle_type: 'motorcycle', license_plate: '' });
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => { loadRiders(); }, []);

  async function loadRiders() {
    const { data } = await supabase
      .from('rider_profiles')
      .select('*, profiles(name, email, phone, avatar_url)')
      .order('created_at', { ascending: false });
    if (data) setRiders(data);
    setLoading(false);
  }

  async function toggleVerified(rider: any) {
    await supabase.from('rider_profiles').update({ verified: !rider.verified }).eq('id', rider.id);
    setRiders((prev) => prev.map((r) => r.id === rider.id ? { ...r, verified: !r.verified } : r));
    feedback('success', 'success');
  }

  async function toggleActive(rider: any) {
    await supabase.from('rider_profiles').update({ active: !rider.active }).eq('id', rider.id);
    setRiders((prev) => prev.map((r) => r.id === rider.id ? { ...r, active: !r.active } : r));
    feedback('light', 'pop');
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 24, fontWeight: 800, color: '#0a1628' }}>Riders</h1>
          <p style={{ color: '#94b4cc', fontSize: 13 }}>{riders.length} registered riders</p>
        </div>
        <HapticButton variant="primary" onClick={() => { setShowModal(true); feedback('light'); }}>
          <Plus size={16} /> Register Rider
        </HapticButton>
      </div>

      {/* Rider Cards */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 200, borderRadius: 20 }} />
          ))}
        </div>
      ) : riders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <Bike size={48} color="#94b4cc" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 20, fontWeight: 700, color: '#0a1628', marginBottom: 8 }}>
            No riders yet
          </h3>
          <p style={{ color: '#5b7a99' }}>Register riders to enable deliveries.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {riders.map((rider, i) => (
            <motion.div
              key={rider.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                padding: 22, borderRadius: 20,
                background: 'rgba(255,255,255,0.95)',
                border: '1.5px solid rgba(14,165,233,0.08)',
                boxShadow: '0 2px 12px rgba(14,165,233,0.05)',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 800, fontSize: 16,
                  boxShadow: '0 4px 16px rgba(14,165,233,0.3)',
                }}>
                  {getInitials(rider.profiles?.name || 'R')}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: 15, color: '#0a1628' }}>{rider.profiles?.name || 'Rider'}</p>
                  <p style={{ fontSize: 12, color: '#94b4cc' }}>{rider.profiles?.email}</p>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                    background: rider.verified ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                    color: rider.verified ? '#10b981' : '#f59e0b',
                  }}>
                    {rider.verified ? '✓ Verified' : 'Unverified'}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                    background: rider.active ? 'rgba(14,165,233,0.1)' : 'rgba(239,68,68,0.1)',
                    color: rider.active ? '#0ea5e9' : '#ef4444',
                  }}>
                    {rider.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                <InfoRow icon={<Bike size={13} />} label="Vehicle" value={rider.vehicle_type} />
                <InfoRow icon={<Shield size={13} />} label="Plate" value={rider.license_plate || '—'} />
                <InfoRow icon={<DollarSign size={13} />} label="Earnings" value={formatPrice(rider.earnings_total || 0)} />
                <InfoRow icon={<Phone size={13} />} label="Phone" value={rider.profiles?.phone || '—'} />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleVerified(rider)}
                  style={{
                    flex: 1, padding: '8px', borderRadius: 10,
                    background: rider.verified ? 'rgba(239,68,68,0.07)' : 'rgba(16,185,129,0.07)',
                    border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 600,
                    color: rider.verified ? '#ef4444' : '#10b981',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  }}
                >
                  {rider.verified ? <><XCircle size={13} /> Revoke</> : <><CheckCircle size={13} /> Verify</>}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleActive(rider)}
                  style={{
                    flex: 1, padding: '8px', borderRadius: 10,
                    background: rider.active ? 'rgba(245,158,11,0.07)' : 'rgba(14,165,233,0.07)',
                    border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 600,
                    color: rider.active ? '#f59e0b' : '#0ea5e9',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  }}
                >
                  {rider.active ? 'Deactivate' : 'Activate'}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ color: '#94b4cc' }}>{icon}</span>
      <span style={{ fontSize: 11, color: '#94b4cc' }}>{label}:</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#0a1628' }}>{value}</span>
    </div>
  );
}
