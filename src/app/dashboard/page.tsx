"use client";

import { useDoc, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import PatientDashboard from "@/components/dashboards/patient-dashboard";

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (userData) {
      if (userData.role === 'ADMIN') {
        router.push('/dashboard/admin');
      } else if (userData.role !== 'PACIENTE') {
        router.push('/dashboard/personal');
      }
    }
  }, [userData, router]);

  if (isUserLoading || isUserDataLoading) {
    return (
        <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
            <Skeleton className="h-8 w-1/2 mb-2" />
            <Skeleton className="h-4 w-3/4 mb-8" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
             <div>
                <Skeleton className="h-8 w-1/4 mb-4" />
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </div>
            </div>
        </div>
    );
  }

  if (userData?.role === 'PACIENTE') {
    return <PatientDashboard />;
  }

  return null; 
}
