'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Hide splash screen after 2.5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2500);

    // Add scroll lock
    document.body.style.overflow = 'hidden';

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-3xl"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
            className="flex flex-col items-center"
          >
            <div className="relative mb-6 h-24 w-24 overflow-hidden rounded-3xl bg-gradient-to-br from-sky-400 to-sky-600 shadow-[0_0_40px_rgba(14,165,233,0.4)]">
              <div className="absolute inset-0 flex items-center justify-center text-5xl font-black text-white mix-blend-overlay">
                V
              </div>
              {/* Shine effect */}
              <motion.div
                initial={{ x: '-100%', y: '-100%' }}
                animate={{ x: '100%', y: '100%' }}
                transition={{ duration: 1.5, ease: 'easeInOut', delay: 0.5 }}
                className="absolute inset-0 bg-gradient-to-br from-transparent via-white/40 to-transparent"
              />
            </div>
            
            <motion.h1
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-center font-display text-3xl tracking-tight text-slate-900"
            >
              Vee Lifestyle
            </motion.h1>
            
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mt-2 text-center text-sm font-medium text-sky-600"
            >
              Premium Fashion. Unmatched Vibe.
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
