'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, RefreshCw, DollarSign, Truck, Globe, Mail, Phone } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { feedback } from '@/lib/haptic';
import { HapticButton } from '@/components/shared/HapticButton';

export default function AdminSettingsPage() {
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});
  const [deliverySettings, setDeliverySettings] = useState<any>({
    base_rate: 200, per_km_rate: 20, max_distance_km: 50,
    rider_base_pay: 150, rider_per_km_pay: 15,
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [{ data: site }, { data: delivery }] = await Promise.all([
      supabase.from('site_settings').select('*'),
      supabase.from('delivery_settings').select('*').single(),
    ]);
    if (site) {
      const map: Record<string, string> = {};
      site.forEach((s: any) => { map[s.key] = s.value; });
      setSiteSettings(map);
    }
    if (delivery) setDeliverySettings(delivery);
    setLoading(false);
  }

  async function saveSiteSettings() {
    setSaving(true);
    for (const [key, value] of Object.entries(siteSettings)) {
      await supabase.from('site_settings').update({ value }).eq('key', key);
    }
    feedback('success', 'success');
    setSaving(false);
  }

  async function saveDeliverySettings() {
    setSaving(true);
    const { id, ...payload } = deliverySettings;
    await supabase.from('delivery_settings').update(payload).eq('id', id);
    feedback('success', 'success');
    setSaving(false);
  }

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: 300, borderRadius: 20, marginBottom: 20 }} />
        <div className="skeleton" style={{ height: 300, borderRadius: 20 }} />
      </div>
    );
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 24, fontWeight: 800, color: '#0a1628' }}>Settings</h1>
        <p style={{ color: '#94b4cc', fontSize: 13 }}>Configure store, pricing, and delivery variables</p>
      </motion.div>

      {/* Site Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: 24, borderRadius: 20, marginBottom: 20,
          background: 'rgba(255,255,255,0.95)',
          border: '1.5px solid rgba(14,165,233,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Globe size={20} color="#0ea5e9" />
          <h3 style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: 17, color: '#0a1628' }}>
            Store Settings
          </h3>
        </div>
        <div style={{ display: 'grid', gap: 14 }}>
          {[
            { key: 'hero_title', label: 'Hero Title', icon: <Globe size={14} /> },
            { key: 'hero_subtitle', label: 'Hero Subtitle' },
            { key: 'announcement', label: 'Announcement Bar' },
            { key: 'store_email', label: 'Store Email', icon: <Mail size={14} /> },
            { key: 'store_phone', label: 'Store Phone', icon: <Phone size={14} /> },
          ].map((field) => (
            <div key={field.key}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#5b7a99', marginBottom: 6 }}>
                {field.label}
              </label>
              <input
                className="input"
                style={{ borderRadius: 12 }}
                value={siteSettings[field.key] || ''}
                onChange={(e) => setSiteSettings({ ...siteSettings, [field.key]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16 }}>
          <HapticButton variant="primary" onClick={saveSiteSettings} loading={saving} haptic="success" sound="success">
            <Save size={16} /> Save Store Settings
          </HapticButton>
        </div>
      </motion.div>

      {/* Delivery Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          padding: 24, borderRadius: 20,
          background: 'rgba(255,255,255,0.95)',
          border: '1.5px solid rgba(14,165,233,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Truck size={20} color="#0ea5e9" />
          <h3 style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: 17, color: '#0a1628' }}>
            Delivery & Rider Pay Variables
          </h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          {[
            { key: 'base_rate', label: 'Delivery Base Rate (KES)' },
            { key: 'per_km_rate', label: 'Delivery Per KM (KES)' },
            { key: 'max_distance_km', label: 'Max Distance (KM)' },
            { key: 'rider_base_pay', label: 'Rider Base Pay (KES)' },
            { key: 'rider_per_km_pay', label: 'Rider Per KM Pay (KES)' },
          ].map((field) => (
            <div key={field.key}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#5b7a99', marginBottom: 6 }}>
                {field.label}
              </label>
              <input
                className="input"
                type="number"
                style={{ borderRadius: 12 }}
                value={deliverySettings[field.key] || 0}
                onChange={(e) => setDeliverySettings({ ...deliverySettings, [field.key]: Number(e.target.value) })}
              />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16 }}>
          <HapticButton variant="primary" onClick={saveDeliverySettings} loading={saving} haptic="success" sound="success">
            <Save size={16} /> Save Delivery Settings
          </HapticButton>
        </div>
      </motion.div>
    </div>
  );
}
