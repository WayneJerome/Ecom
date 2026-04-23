'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit3, Trash2, Eye, EyeOff, X, Save,
  Upload, Package
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatPrice, slugify } from '@/lib/utils';
import { feedback } from '@/lib/haptic';
import { HapticButton } from '@/components/shared/HapticButton';
import type { Product, ProductColor, Gender } from '@/types';

const EMPTY_PRODUCT: {
  name: string; slug: string; description: string; category_id: string;
  price: number; sale_price: number | null;
  images: string[]; gender: Gender;
  sizes: string[]; colors: ProductColor[];
  stock: number; published: boolean; featured: boolean;
} = {
  name: '', slug: '', description: '', category_id: '',
  price: 0, sale_price: null,
  images: [], gender: 'unisex',
  sizes: [], colors: [],
  stock: 0, published: false, featured: false,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => { loadProducts(); loadCategories(); }, []);

  async function loadProducts() {
    const { data } = await supabase
      .from('products')
      .select('*, categories(name, slug)')
      .order('created_at', { ascending: false });
    if (data) setProducts(data as unknown as Product[]);
    setLoading(false);
  }

  async function loadCategories() {
    const { data } = await supabase.from('categories').select('*');
    if (data) setCategories(data);
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_PRODUCT);
    setShowModal(true);
    feedback('light');
  }

  function openEdit(product: Product) {
    setEditing(product);
    setForm({
      name: product.name, slug: product.slug,
      description: product.description || '',
      category_id: product.category_id || '',
      price: product.price, sale_price: product.sale_price,
      images: product.images || [], gender: product.gender,
      sizes: product.sizes || [], colors: product.colors || [],
      stock: product.stock, published: product.published,
      featured: product.featured || false,
    });
    setShowModal(true);
    feedback('light');
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        ...form, slug: form.slug || slugify(form.name),
      };
      if (editing) {
        await supabase.from('products').update(payload).eq('id', editing.id);
      } else {
        await supabase.from('products').insert(payload);
      }
      await loadProducts();
      setShowModal(false);
      feedback('success', 'success');
    } catch {
      feedback('error', 'error');
    }
    setSaving(false);
  }

  async function togglePublish(product: Product) {
    await supabase.from('products').update({ published: !product.published }).eq('id', product.id);
    setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, published: !p.published } : p));
    feedback('light', 'pop');
  }

  async function deleteProduct(id: string) {
    if (!confirm('Delete this product?')) return;
    await supabase.from('products').delete().eq('id', id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    feedback('medium', 'error');
  }

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 24, fontWeight: 800, color: '#0a1628' }}>Products</h1>
          <p style={{ color: '#94b4cc', fontSize: 13 }}>{products.length} products</p>
        </div>
        <HapticButton variant="primary" onClick={openCreate}>
          <Plus size={16} /> Add Product
        </HapticButton>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 400, marginBottom: 20 }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94b4cc' }} />
        <input className="input" placeholder="Search products..." value={search}
          onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 40, borderRadius: 12 }} />
      </div>

      {/* Table */}
      <div style={{
        borderRadius: 20, background: 'rgba(255,255,255,0.95)',
        border: '1.5px solid rgba(14,165,233,0.08)',
        overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(14,165,233,0.08)' }}>
                  {['Product', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94b4cc', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr key={product.id} style={{ borderBottom: '1px solid rgba(14,165,233,0.04)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', background: '#f0f9ff', flexShrink: 0, position: 'relative' }}>
                          {product.images?.[0] ? (
                            <Image src={product.images[0]} alt="" fill className="object-cover" sizes="44px" />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Package size={18} color="#94b4cc" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: 14, color: '#0a1628' }}>{product.name}</p>
                          <p style={{ fontSize: 11, color: '#94b4cc' }}>{product.gender}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#5b7a99' }}>
                      {(product as any).categories?.name || '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, color: '#0a1628' }}>
                        {formatPrice(product.sale_price || product.price)}
                      </span>
                      {product.sale_price && (
                        <span style={{ fontSize: 11, color: '#94b4cc', textDecoration: 'line-through', marginLeft: 6 }}>
                          {formatPrice(product.price)}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: product.stock <= 5 ? '#ef4444' : '#0a1628' }}>
                      {product.stock}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8,
                        background: product.published ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                        color: product.published ? '#10b981' : '#f59e0b',
                      }}>
                        {product.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <IconBtn onClick={() => togglePublish(product)} title={product.published ? 'Unpublish' : 'Publish'}>
                          {product.published ? <EyeOff size={14} /> : <Eye size={14} />}
                        </IconBtn>
                        <IconBtn onClick={() => openEdit(product)} title="Edit">
                          <Edit3 size={14} />
                        </IconBtn>
                        <IconBtn onClick={() => deleteProduct(product.id)} title="Delete" danger>
                          <Trash2 size={14} />
                        </IconBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.6)', backdropFilter: 'blur(6px)', zIndex: 50 }}
            />
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30 }}
              style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: '90%', maxWidth: 600, maxHeight: '85vh', overflowY: 'auto',
                background: '#fff', borderRadius: 24, padding: 28, zIndex: 51,
                border: '1.5px solid rgba(14,165,233,0.1)',
                boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 800, fontSize: 20, color: '#0a1628' }}>
                  {editing ? 'Edit Product' : 'New Product'}
                </h2>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowModal(false)}
                  style={{ background: 'rgba(14,165,233,0.07)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer' }}>
                  <X size={18} />
                </motion.button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v, slug: slugify(v) })} />
                <Field label="Slug" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} />
                <Field label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} textarea />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#5b7a99', marginBottom: 6 }}>Category</label>
                    <select className="input" style={{ borderRadius: 12 }}
                      value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                      <option value="">Select...</option>
                      {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#5b7a99', marginBottom: 6 }}>Gender</label>
                    <select className="input" style={{ borderRadius: 12 }}
                      value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as any })}>
                      <option value="unisex">Unisex</option>
                      <option value="man">Men&apos;s</option>
                      <option value="woman">Women&apos;s</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                  <Field label="Price (KES)" type="number" value={form.price.toString()} onChange={(v) => setForm({ ...form, price: Number(v) })} />
                  <Field label="Sale Price" type="number" value={form.sale_price?.toString() || ''} onChange={(v) => setForm({ ...form, sale_price: v ? Number(v) : null })} />
                  <Field label="Stock" type="number" value={form.stock.toString()} onChange={(v) => setForm({ ...form, stock: Number(v) })} />
                </div>

                <Field label="Sizes (comma separated)" value={form.sizes.join(', ')}
                  onChange={(v) => setForm({ ...form, sizes: v.split(',').map((s) => s.trim()).filter(Boolean) })} />

                <Field label="Image URLs (one per line)" value={form.images.join('\n')}
                  onChange={(v) => setForm({ ...form, images: v.split('\n').map((s) => s.trim()).filter(Boolean) })} textarea />

                <div style={{ display: 'flex', gap: 14 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.published}
                      onChange={(e) => setForm({ ...form, published: e.target.checked })} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0a1628' }}>Published</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.featured}
                      onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0a1628' }}>Featured</span>
                  </label>
                </div>

                <HapticButton variant="primary" fullWidth onClick={handleSave} loading={saving} haptic="success" sound="success">
                  <Save size={16} /> {editing ? 'Update Product' : 'Create Product'}
                </HapticButton>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', textarea }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; textarea?: boolean;
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#5b7a99', marginBottom: 6 }}>{label}</label>
      {textarea ? (
        <textarea className="input" rows={3} value={value} onChange={(e) => onChange(e.target.value)}
          style={{ borderRadius: 12, resize: 'vertical' }} />
      ) : (
        <input className="input" type={type} value={value} onChange={(e) => onChange(e.target.value)}
          style={{ borderRadius: 12 }} />
      )}
    </div>
  );
}

function IconBtn({ onClick, title, children, danger }: {
  onClick: () => void; title: string; children: React.ReactNode; danger?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={onClick}
      title={title}
      style={{
        width: 30, height: 30, borderRadius: 8,
        background: danger ? 'rgba(239,68,68,0.07)' : 'rgba(14,165,233,0.07)',
        border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: danger ? '#ef4444' : '#5b7a99',
      }}
    >
      {children}
    </motion.button>
  );
}
