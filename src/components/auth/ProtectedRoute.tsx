'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('PACIENTE' | 'PERSONAL' | 'ADMIN')[];
  requireAuth?: boolean;
}

export function ProtectedRoute({ 
  children, 
  allowedRoles, 
  requireAuth = true 
}: ProtectedRouteProps) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

  useEffect(() => {
    // Si no está cargando y no hay usuario, redirigir al login
    if (!isUserLoading && !user && requireAuth) {
      router.push('/login');
    }
  }, [user, isUserLoading, requireAuth, router]);

  useEffect(() => {
    // Si se cargó el usuario y hay roles permitidos, verificar
    if (userData && allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(userData.role)) {
        // Redirigir según el rol
        if (userData.role === 'ADMIN') {
          router.push('/dashboard/admin');
        } else if (userData.role === 'PERSONAL') {
          router.push('/dashboard/personal');
        } else {
          router.push('/dashboard');
        }
      }
    }
  }, [userData, allowedRoles, router]);

  // Mostrar loading mientras se verifica la autenticación
  if (isUserLoading || isUserDataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    );
  }

  // Si requiere auth y no hay usuario, no mostrar nada (está redirigiendo)
  if (requireAuth && !user) {
    return null;
  }

  // Si hay roles permitidos y el usuario no tiene el rol correcto, no mostrar nada
  if (userData && allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(userData.role)) {
    return null;
  }

  // Todo OK, mostrar el contenido
  return <>{children}</>;
}
