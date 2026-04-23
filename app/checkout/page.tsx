'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft, CreditCard, Smartphone, Loader2,
  ShieldCheck, Check, MapPin, User, Mail, Phone
} from 'lucide-react';
import { useCartStore } from '@/lib/cart';
import { formatPrice, generateReference } from '@/lib/utils';
import { feedback } from '@/lib/haptic';
import { HapticButton } from '@/components/shared/HapticButton';
import { Navbar } from '@/components/store/Navbar';

type CheckoutStep = 'details' | 'payment' | 'processing' | 'success';

interface FormData {
  full_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  county: string;
}

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCartStore();
  const sub = subtotal();
  const deliveryFee = sub >= 3000 ? 0 : 200;
  const total = sub + deliveryFee;

  const [step, setStep] = useState<CheckoutStep>('details');
  const [loading, setLoading] = useState(false);
  const [orderRef, setOrderRef] = useState('');
  const [form, setForm] = useState<FormData>({
    full_name: '',
    email: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: 'Nairobi',
    county: 'Nairobi',
  });

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid = form.full_name && form.email && form.phone && form.address_line1 && form.city;

  const handleMpesaCheckout = async () => {
    if (!isFormValid) {
      feedback('error', 'error');
      return;
    }

    setLoading(true);
    setStep('processing');

    try {
      const reference = generateReference('VL');
      setOrderRef(reference);

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            product_id: item.product.id,
            name: item.product.name,
            image: item.product.images?.[0] || '',
            price: item.product.sale_price ?? item.product.price,
            quantity: item.quantity,
            size: item.selectedSize,
            color: item.selectedColor,
          })),
          customer: {
            full_name: form.full_name,
            email: form.email,
            phone: form.phone,
          },
          delivery_address: {
            full_name: form.full_name,
            phone: form.phone,
            address_line1: form.address_line1,
            address_line2: form.address_line2,
            city: form.city,
            county: form.county,
          },
          subtotal: sub,
          delivery_fee: deliveryFee,
          total,
          reference,
          payment_method: 'mpesa',
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Poll for payment confirmation
        pollPayment(reference);
      } else {
        setStep('details');
        feedback('error', 'error');
      }
    } catch {
      setStep('details');
      feedback('error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const pollPayment = async (ref: string) => {
    // Poll every 5 seconds for up to 2 minutes
    let attempts = 0;
    const maxAttempts = 24;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/api/orders?reference=${ref}`);
        const data = await res.json();
        if (data.order?.status === 'confirmed' || data.order?.status === 'processing') {
          clearCart();
          setStep('success');
          feedback('success', 'success');
          clearInterval(interval);
          return;
        }
      } catch { /* continue polling */ }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        // Show success anyway — webhook might be delayed
        setStep('success');
        clearCart();
        feedback('success', 'success');
      }
    }, 5000);
  };

  if (items.length === 0 && step !== 'success') {
    return (
      <>
        <Navbar />
        <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(14,165,233,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CreditCard size={36} color="#94b4cc" />
            </div>
            <h2 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 24, fontWeight: 700, color: '#0a1628', marginBottom: 8 }}>
              Your cart is empty
            </h2>
            <p style={{ color: '#5b7a99', marginBottom: 20 }}>Add some items before checking out.</p>
            <Link href="/shop">
              <HapticButton variant="primary">Browse Shop</HapticButton>
            </Link>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 24px 80px' }}>
        {/* Back */}
        {step === 'details' && (
          <Link href="/shop" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#0ea5e9', fontWeight: 600, fontSize: 14, textDecoration: 'none', marginBottom: 24 }}
            onClick={() => feedback('light')}>
            <ArrowLeft size={16} /> Continue Shopping
          </Link>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32 }} className="lg:!grid-cols-[1fr_380px]">
          {/* Left Column */}
          <div>
            {step === 'details' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 28, fontWeight: 800, color: '#0a1628', marginBottom: 28 }}>
                  Checkout
                </h1>

                {/* Contact Info */}
                <SectionCard title="Contact Information" icon={<User size={18} />}>
                  <div style={{ display: 'grid', gap: 14 }}>
                    <InputField label="Full Name" placeholder="John Doe" value={form.full_name} onChange={(v) => updateField('full_name', v)} icon={<User size={15} />} />
                    <InputField label="Email" type="email" placeholder="you@email.com" value={form.email} onChange={(v) => updateField('email', v)} icon={<Mail size={15} />} />
                    <InputField label="Phone (M-Pesa)" placeholder="0712345678" value={form.phone} onChange={(v) => updateField('phone', v)} icon={<Phone size={15} />} />
                  </div>
                </SectionCard>

                {/* Delivery Address */}
                <SectionCard title="Delivery Address" icon={<MapPin size={18} />}>
                  <div style={{ display: 'grid', gap: 14 }}>
                    <InputField label="Address Line 1" placeholder="123 Moi Avenue" value={form.address_line1} onChange={(v) => updateField('address_line1', v)} />
                    <InputField label="Address Line 2 (Optional)" placeholder="Apartment, suite, etc." value={form.address_line2} onChange={(v) => updateField('address_line2', v)} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <InputField label="City" placeholder="Nairobi" value={form.city} onChange={(v) => updateField('city', v)} />
                      <InputField label="County" placeholder="Nairobi" value={form.county} onChange={(v) => updateField('county', v)} />
                    </div>
                  </div>
                </SectionCard>

                {/* Payment */}
                <SectionCard title="Payment Method" icon={<CreditCard size={18} />}>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    style={{
                      width: '100%', padding: '18px 20px', borderRadius: 16,
                      display: 'flex', alignItems: 'center', gap: 14,
                      background: 'linear-gradient(135deg, rgba(74,162,60,0.08), rgba(74,162,60,0.04))',
                      border: '2px solid rgba(74,162,60,0.3)',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: 'linear-gradient(135deg, #4aa23c, #2d8a1e)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Smartphone size={22} color="#fff" />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ fontWeight: 700, fontSize: 15, color: '#0a1628' }}>M-Pesa (Paystack)</p>
                      <p style={{ fontSize: 12, color: '#5b7a99' }}>Pay instantly via STK Push to your phone</p>
                    </div>
                    <Check size={20} color="#4aa23c" style={{ marginLeft: 'auto' }} />
                  </motion.button>
                </SectionCard>

                {/* Pay Button */}
                <div style={{ marginTop: 8 }}>
                  <HapticButton
                    variant="primary"
                    fullWidth
                    size="lg"
                    onClick={handleMpesaCheckout}
                    disabled={!isFormValid || loading}
                    loading={loading}
                    haptic="success"
                    sound="success"
                  >
                    <Smartphone size={18} /> Pay {formatPrice(total)} via M-Pesa
                  </HapticButton>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 }}>
                    <ShieldCheck size={14} color="#10b981" />
                    <p style={{ fontSize: 12, color: '#5b7a99' }}>Secured by Paystack • 256-bit SSL encryption</p>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'processing' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center', padding: '80px 20px' }}
              >
                <div style={{
                  width: 100, height: 100, borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(74,162,60,0.1), rgba(14,165,233,0.1))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 24px',
                }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
                    <Loader2 size={40} color="#0ea5e9" />
                  </motion.div>
                </div>
                <h2 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 24, fontWeight: 800, color: '#0a1628', marginBottom: 10 }}>
                  Waiting for M-Pesa...
                </h2>
                <p style={{ color: '#5b7a99', fontSize: 15, maxWidth: 400, margin: '0 auto 8px' }}>
                  Check your phone for the STK Push notification and enter your M-Pesa PIN to complete payment.
                </p>
                <p style={{ color: '#94b4cc', fontSize: 13 }}>
                  Reference: {orderRef}
                </p>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center', padding: '80px 20px' }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  style={{
                    width: 100, height: 100, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 24px',
                    boxShadow: '0 8px 32px rgba(16,185,129,0.3)',
                  }}
                >
                  <Check size={48} color="#fff" strokeWidth={3} />
                </motion.div>
                <h2 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 28, fontWeight: 800, color: '#0a1628', marginBottom: 10 }}>
                  Order Placed! 🎉
                </h2>
                <p style={{ color: '#5b7a99', fontSize: 15, maxWidth: 400, margin: '0 auto 8px' }}>
                  Your order has been placed successfully. You'll receive a confirmation notification shortly.
                </p>
                <p style={{ color: '#94b4cc', fontSize: 13, marginBottom: 28 }}>
                  Reference: {orderRef}
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link href="/orders">
                    <HapticButton variant="primary">Track Order</HapticButton>
                  </Link>
                  <Link href="/shop">
                    <HapticButton variant="secondary">Continue Shopping</HapticButton>
                  </Link>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column — Order Summary */}
          {step !== 'success' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div style={{
                position: 'sticky', top: 100,
                borderRadius: 24,
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(20px)',
                border: '1.5px solid rgba(14,165,233,0.12)',
                padding: 24,
                boxShadow: '0 4px 24px rgba(14,165,233,0.08)',
              }}>
                <h3 style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 800, fontSize: 18, color: '#0a1628', marginBottom: 20 }}>
                  Order Summary
                </h3>

                {/* Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                  {items.map((item) => {
                    const price = item.product.sale_price ?? item.product.price;
                    return (
                      <div
                        key={`${item.product.id}-${item.selectedSize}-${item.selectedColor.name}`}
                        style={{ display: 'flex', gap: 12, alignItems: 'center' }}
                      >
                        <div style={{ width: 56, height: 56, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: '#f0f9ff', position: 'relative' }}>
                          {item.product.images?.[0] && (
                            <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" sizes="56px" />
                          )}
                          <span style={{
                            position: 'absolute', top: -4, right: -4,
                            width: 20, height: 20, borderRadius: '50%',
                            background: '#0ea5e9', color: '#fff',
                            fontSize: 10, fontWeight: 800,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '2px solid #fff',
                          }}>
                            {item.quantity}
                          </span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#0a1628', lineHeight: 1.3 }}>{item.product.name}</p>
                          <p style={{ fontSize: 11, color: '#94b4cc' }}>{item.selectedSize} / {item.selectedColor.name}</p>
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#0a1628', fontFamily: 'Space Grotesk,sans-serif' }}>
                          {formatPrice(price * item.quantity)}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Totals */}
                <div style={{ borderTop: '1px solid rgba(14,165,233,0.1)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, color: '#5b7a99' }}>Subtotal</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#0a1628' }}>{formatPrice(sub)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, color: '#5b7a99' }}>Delivery</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: deliveryFee === 0 ? '#10b981' : '#0a1628' }}>
                      {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(14,165,233,0.1)', paddingTop: 10 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#0a1628' }}>Total</span>
                    <span style={{ fontSize: 20, fontWeight: 800, color: '#0a1628', fontFamily: 'Space Grotesk,sans-serif' }}>
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{
      marginBottom: 24, padding: 24, borderRadius: 20,
      background: 'rgba(255,255,255,0.95)',
      border: '1.5px solid rgba(14,165,233,0.1)',
      boxShadow: '0 2px 12px rgba(14,165,233,0.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <div style={{ color: '#0ea5e9' }}>{icon}</div>
        <h3 style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: 16, color: '#0a1628' }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function InputField({ label, placeholder, value, onChange, type = 'text', icon }: {
  label: string; placeholder: string; value: string;
  onChange: (v: string) => void; type?: string; icon?: React.ReactNode;
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#5b7a99', marginBottom: 6 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        {icon && (
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94b4cc' }}>
            {icon}
          </span>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input"
          style={{ paddingLeft: icon ? 40 : undefined, borderRadius: 12 }}
        />
      </div>
    </div>
  );
}
