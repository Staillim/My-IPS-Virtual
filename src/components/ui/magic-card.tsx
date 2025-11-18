"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface MagicCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'gradient-1' | 'gradient-2' | 'gradient-3' | 'gradient-4' | 'light';
  withOrbs?: boolean;
  withParticles?: boolean;
  withShimmer?: boolean;
  withBorder?: boolean;
}

export function MagicCard({
  children,
  className,
  variant = 'light',
  withOrbs = true,
  withParticles = true,
  withShimmer = true,
  withBorder = false,
}: MagicCardProps) {
  const gradientClasses = {
    'gradient-1': 'gradient-blue-1',
    'gradient-2': 'gradient-blue-2',
    'gradient-3': 'gradient-blue-3',
    'gradient-4': 'gradient-blue-4',
    'light': 'gradient-blue-light',
  };

  return (
    <div
      className={cn(
        'magic-card group',
        withShimmer && 'shimmer-effect',
        withBorder && 'animated-border',
        className
      )}
    >
      {/* Orbes flotantes */}
      {withOrbs && (
        <>
          <div className="floating-orb orb-1" />
          <div className="floating-orb orb-2" />
        </>
      )}

      {/* Partículas */}
      {withParticles && (
        <>
          <div className="particle" style={{ top: '20%', left: '30%', animationDelay: '0s' }} />
          <div className="particle" style={{ top: '40%', left: '60%', animationDelay: '0.5s' }} />
          <div className="particle" style={{ top: '60%', left: '20%', animationDelay: '1s' }} />
          <div className="particle" style={{ top: '80%', left: '70%', animationDelay: '1.5s' }} />
          <div className="particle" style={{ top: '30%', left: '80%', animationDelay: '2s' }} />
        </>
      )}

      {/* Contenido de la tarjeta */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

interface MagicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
}

export function MagicButton({
  children,
  className,
  variant = 'primary',
  ...props
}: MagicButtonProps) {
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-blue-100 hover:bg-blue-200 text-blue-900',
    outline: 'border-2 border-blue-600 hover:bg-blue-50 text-blue-600',
  };

  return (
    <button
      className={cn(
        'magic-button px-6 py-3 rounded-lg font-semibold',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  withGlow?: boolean;
}

export function GradientText({ children, className, withGlow = false }: GradientTextProps) {
  return (
    <span
      className={cn(
        'bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 bg-clip-text text-transparent font-bold',
        withGlow && 'text-glow',
        className
      )}
    >
      {children}
    </span>
  );
}

interface FloatingElementProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function FloatingElement({ children, className, delay = 0 }: FloatingElementProps) {
  return (
    <div
      className={cn('animate-float', className)}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}
