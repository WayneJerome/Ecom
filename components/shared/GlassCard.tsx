'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  animate?: boolean;
  delay?: number;
  onClick?: () => void;
}

export function GlassCard({
  children,
  className,
  hover = true,
  padding = 'md',
  animate = false,
  delay = 0,
  onClick,
}: GlassCardProps) {
  const padClass = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }[padding];

  const Wrapper = animate ? motion.div : 'div';
  const animProps = animate
    ? {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.45, delay, ease: [0.4, 0, 0.2, 1] },
      }
    : {};

  return (
    <Wrapper
      {...(animProps as object)}
      className={cn(
        'glass-card',
        padClass,
        hover && 'transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </Wrapper>
  );
}
