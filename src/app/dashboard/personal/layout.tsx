'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function PersonalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['PERSONAL', 'ADMIN']}>
      {children}
    </ProtectedRoute>
  );
}
