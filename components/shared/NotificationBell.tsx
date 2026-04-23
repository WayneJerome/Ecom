'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Package, Tag, Info, Bike } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@clerk/nextjs';
import { formatDate } from '@/lib/utils';
import { feedback } from '@/lib/haptic';
import type { Notification, NotificationType } from '@/types';

const typeIcon: Record<NotificationType, React.ReactNode> = {
  order: <Package size={15} />,
  promo: <Tag size={15} />,
  system: <Info size={15} />,
  delivery: <Bike size={15} />,
};

const typeColor: Record<NotificationType, string> = {
  order: '#0ea5e9',
  promo: '#8b5cf6',
  system: '#6b7280',
  delivery: '#10b981',
};

export function NotificationBell() {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    fetchNotifications();

    // Realtime subscription
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: user?.id ? `user_id=eq.${user.id}` : undefined,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev]);
          feedback('medium', 'pop');
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function fetchNotifications() {
    const query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(25);

    if (user?.id) {
      query.or(`user_id.eq.${user.id},user_id.is.null`);
    } else {
      query.is('user_id', null);
    }

    const { data } = await query;
    if (data) setNotifications(data);
  }

  async function markAllRead() {
    if (!user?.id) return;
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    feedback('light');
  }

  async function markRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  return (
    <div className="relative" ref={panelRef}>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          setOpen((v) => !v);
          feedback('light', 'click');
        }}
        style={{
          position: 'relative',
          background: 'rgba(255,255,255,0.75)',
          border: '1.5px solid rgba(14,165,233,0.2)',
          borderRadius: '12px',
          padding: '8px',
          cursor: 'pointer',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-label="Notifications"
      >
        <Bell size={20} color="#0a1628" />
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              background: 'linear-gradient(135deg,#0ea5e9,#0284c7)',
              color: '#fff',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              fontSize: '10px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid white',
            }}
          >
            {unread > 9 ? '9+' : unread}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 10px)',
              width: '360px',
              maxHeight: '460px',
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(24px)',
              border: '1.5px solid rgba(14,165,233,0.18)',
              borderRadius: '20px',
              boxShadow: '0 16px 56px rgba(14,165,233,0.18), 0 4px 16px rgba(0,0,0,0.06)',
              zIndex: 60,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(14,165,233,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '15px', color: '#0a1628' }}>Notifications</h3>
                {unread > 0 && (
                  <p style={{ fontSize: '12px', color: '#0ea5e9', fontWeight: 500, marginTop: 2 }}>{unread} unread</p>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {unread > 0 && (
                  <button onClick={markAllRead} style={{ fontSize: '11px', color: '#0ea5e9', fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none' }}>
                    Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5b7a99' }}>
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* List */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94b4cc' }}>
                  <Bell size={32} style={{ margin: '0 auto 10px', opacity: 0.4, display: 'block' }} />
                  <p style={{ fontSize: '13px', fontWeight: 500 }}>No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => markRead(n.id)}
                    style={{
                      padding: '14px 20px',
                      borderBottom: '1px solid rgba(14,165,233,0.07)',
                      cursor: 'pointer',
                      background: n.read ? 'transparent' : 'rgba(14,165,233,0.04)',
                      display: 'flex',
                      gap: 12,
                      alignItems: 'flex-start',
                      transition: 'background 0.2s',
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                      background: `${typeColor[n.type]}18`,
                      color: typeColor[n.type],
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {typeIcon[n.type]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: n.read ? 400 : 600, color: '#0a1628', lineHeight: 1.4 }}>
                        {n.title}
                      </p>
                      <p style={{ fontSize: '12px', color: '#5b7a99', marginTop: 3, lineHeight: 1.4 }}>{n.body}</p>
                      <p style={{ fontSize: '11px', color: '#94b4cc', marginTop: 4 }}>{formatDate(n.created_at)}</p>
                    </div>
                    {!n.read && (
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0ea5e9', flexShrink: 0, marginTop: 4 }} />
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
