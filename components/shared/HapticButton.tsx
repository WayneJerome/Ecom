'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { feedback } from '@/lib/haptic';
import { cn } from '@/lib/utils';

interface HapticButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'dark' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  haptic?: 'light' | 'medium' | 'heavy' | 'success' | 'error';
  sound?: 'click' | 'success' | 'error' | 'pop';
  loading?: boolean;
  fullWidth?: boolean;
}

export function HapticButton({
  variant = 'primary',
  size = 'md',
  haptic = 'light',
  sound = 'click',
  loading = false,
  fullWidth = false,
  className,
  children,
  onClick,
  disabled,
  ...props
}: HapticButtonProps) {
  const variantClass = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    dark: 'btn-dark',
    danger: 'btn-danger',
  }[variant];

  const sizeClass = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
    icon: 'btn-icon',
  }[size];

  return (
    <motion.button
      whileTap={{ scale: disabled || loading ? 1 : 0.96 }}
      whileHover={{ scale: disabled || loading ? 1 : 1.015 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(
        'btn',
        variantClass,
        sizeClass,
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      onClick={(e) => {
        if (!disabled && !loading) {
          feedback(haptic, sound);
          onClick?.(e);
        }
      }}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <LoadingSpinner />
          {children as React.ReactNode}
        </span>
      ) : (
        children as React.ReactNode
      )}
    </motion.button>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}
