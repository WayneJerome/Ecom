'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Save, Trash2, Tag, Bell, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import { feedback } from '@/lib/haptic';
import { HapticButton } from '@/components/shared/HapticButton';

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [offerForm, setOfferForm] = useState({ title: '', subtitle: '', image_url: '', cta_url: '/', cta_label: 'Shop Now', active: true });
  const [notifForm, setNotifForm] = useState({ title: '', body: '', type: 'promo' as const, action_url: '' });
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => { loadOffers(); }, []);

  async function loadOffers() {
    const { data } = await supabase.from('offers').select('*').order('sort_order', { ascending: true });
    if (data) setOffers(data);
    setLoading(false);
  }

  async function saveOffer() {
    setSaving(true);
    await supabase.from('offers').insert(offerForm);
    await loadOffers();
    setShowOfferModal(false);
    setOfferForm({ title: '', subtitle: '', image_url: '', cta_url: '/', cta_label: 'Shop Now', active: true });
    feedback('success', 'success');
    setSaving(false);
  }

  async function toggleOffer(id: string, active: boolean) {
    await supabase.from('offers').update({ active: !active }).eq('id', id);
    setOffers((prev) => prev.map((o) => o.id === id ? { ...o, active: !active } : o));
    feedback('light', 'pop');
  }

  async function deleteOffer(id: string) {
    if (!confirm('Delete offer?')) return;
    await supabase.from('offers').delete().eq('id', id);
    setOffers((prev) => prev.filter((o) => o.id !== id));
    feedback('medium', 'error');
  }

  async function sendNotification() {
    setSaving(true);
    // Broadcast (null user_id = visible to all)
    await supabase.from('notifications').insert({
      user_id: null,
      title: notifForm.title,
      body: notifForm.body,
      type: notifForm.type,
      action_url: notifForm.action_url || null,
    });
    setShowNotifModal(false);
    setNotifForm({ title: '', body: '', type: 'promo', action_url: '' });
    feedback('success', 'success');
    setSaving(false);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 24, fontWeight: 800, color: '#0a1628' }}>
            Offers & Notifications
          </h1>
          <p style={{ color: '#94b4cc', fontSize: 13 }}>Manage promotional banners and push notifications</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <HapticButton variant="secondary" onClick={() => { setShowNotifModal(true); feedback('light'); }}>
            <Bell size={15} /> Send Notification
          </HapticButton>
          <HapticButton variant="primary" onClick={() => { setShowOfferModal(true); feedback('light'); }}>
            <Plus size={15} /> New Offer
          </HapticButton>
        </div>
      </div>

      {/* Offers Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 20 }} />)}
        </div>
      ) : offers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Tag size={40} color="#94b4cc" style={{ margin: '0 auto 14px' }} />
          <p style={{ color: '#5b7a99' }}>No offers created yet</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {offers.map((offer, i) => (
            <motion.div key={offer.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              style={{
                padding: 20, borderRadius: 20,
                background: 'rgba(255,255,255,0.95)',
                border: `1.5px solid ${offer.active ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.15)'}`,
                opacity: offer.active ? 1 : 0.7,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 15, color: '#0a1628' }}>{offer.title}</p>
                  {offer.subtitle && <p style={{ fontSize: 12, color: '#5b7a99', marginTop: 2 }}>{offer.subtitle}</p>}
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, height: 'fit-content',
                  background: offer.active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  color: offer.active ? '#10b981' : '#ef4444',
                }}>
                  {offer.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p style={{ fontSize: 12, color: '#94b4cc', marginBottom: 14 }}>
                CTA: {offer.cta_label} → {offer.cta_url}
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => toggleOffer(offer.id, offer.active)}
                  style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(14,165,233,0.07)', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {offer.active ? <><EyeOff size={12} /> Hide</> : <><Eye size={12} /> Show</>}
                </motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => deleteOffer(offer.id)}
                  style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.07)', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Trash2 size={12} /> Delete
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Offer Modal */}
      <Modal open={showOfferModal} onClose={() => setShowOfferModal(false)} title="Create Offer">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Title" value={offerForm.title} onChange={(v) => setOfferForm({ ...offerForm, title: v })} />
          <Field label="Subtitle" value={offerForm.subtitle} onChange={(v) => setOfferForm({ ...offerForm, subtitle: v })} />
          <Field label="Image URL" value={offerForm.image_url} onChange={(v) => setOfferForm({ ...offerForm, image_url: v })} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="CTA URL" value={offerForm.cta_url} onChange={(v) => setOfferForm({ ...offerForm, cta_url: v })} />
            <Field label="CTA Label" value={offerForm.cta_label} onChange={(v) => setOfferForm({ ...offerForm, cta_label: v })} />
          </div>
          <HapticButton variant="primary" fullWidth onClick={saveOffer} loading={saving}>
            <Save size={16} /> Create Offer
          </HapticButton>
        </div>
      </Modal>

      {/* Notification Modal */}
      <Modal open={showNotifModal} onClose={() => setShowNotifModal(false)} title="Send Notification">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Title" value={notifForm.title} onChange={(v) => setNotifForm({ ...notifForm, title: v })} />
          <Field label="Body" value={notifForm.body} onChange={(v) => setNotifForm({ ...notifForm, body: v })} textarea />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#5b7a99', marginBottom: 6 }}>Type</label>
              <select className="input" style={{ borderRadius: 12 }} value={notifForm.type}
                onChange={(e) => setNotifForm({ ...notifForm, type: e.target.value as any })}>
                <option value="promo">Promo</option>
                <option value="system">System</option>
                <option value="order">Order</option>
              </select>
            </div>
            <Field label="Action URL" value={notifForm.action_url} onChange={(v) => setNotifForm({ ...notifForm, action_url: v })} />
          </div>
          <HapticButton variant="primary" fullWidth onClick={sendNotification} loading={saving}>
            <Bell size={16} /> Send to All Users
          </HapticButton>
        </div>
      </Modal>
    </div>
  );
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.6)', backdropFilter: 'blur(6px)', zIndex: 50 }} />
          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
            style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: 500, background: '#fff', borderRadius: 24, padding: 28, zIndex: 51, boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 800, fontSize: 20, color: '#0a1628' }}>{title}</h2>
              <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
                style={{ background: 'rgba(14,165,233,0.07)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer' }}>
                <X size={18} />
              </motion.button>
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Field({ label, value, onChange, textarea }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#5b7a99', marginBottom: 6 }}>{label}</label>
      {textarea ? (
        <textarea className="input" rows={3} value={value} onChange={(e) => onChange(e.target.value)} style={{ borderRadius: 12, resize: 'vertical' }} />
      ) : (
        <input className="input" value={value} onChange={(e) => onChange(e.target.value)} style={{ borderRadius: 12 }} />
      )}
    </div>
  );
}
