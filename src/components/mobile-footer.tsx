
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, FileText, Stethoscope, User, Users, Shield, BarChart3, Clock, Briefcase, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

const patientNavLinks = [
  { href: "/dashboard", icon: Home, label: "Inicio" },
  { href: "/dashboard/citas", icon: Calendar, label: "Citas" },
  { href: "/dashboard/formulas", icon: FileText, label: "Fórmulas" },
  { href: "/dashboard/historial", icon: Stethoscope, label: "Historial" },
  { href: "/dashboard/perfil", icon: User, label: "Perfil" },
];

const personalNavLinks = [
  { href: "/dashboard/personal", icon: Home, label: "Inicio" },
  { href: "/dashboard/personal/citas", icon: Calendar, label: "Citas" },
  { href: "/dashboard/personal/pacientes", icon: Users, label: "Pacientes" },
  { href: "/dashboard/personal/formulas", icon: FileText, label: "Fórmulas" },
  { href: "/dashboard/perfil", icon: User, label: "Perfil" },
];

const adminNavLinks = [
  { href: "/dashboard/admin", icon: Shield, label: "Panel" },
  { href: "/dashboard/admin/medicos", icon: Users, label: "Médicos" },
  { href: "/dashboard/admin/citas", icon: Calendar, label: "Citas" },
  { href: "/dashboard/admin/servicios", icon: Briefcase, label: "Servicios" },
  { href: "/dashboard/admin/estadisticas", icon: BarChart3, label: "Estadísticas" },
];


export function MobileFooter() {
  const pathname = usePathname();
  const { user } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData } = useDoc(userDocRef);

  let navLinks = patientNavLinks;
  if (userData?.role === 'ADMIN') {
    navLinks = adminNavLinks;
  } else if (userData?.role !== 'PACIENTE') {
    navLinks = personalNavLinks;
  }

  // Admin has different number of links, adjust grid cols
  const gridColsClass = `grid-cols-${navLinks.length}`;

  return (
    <footer className="fixed bottom-0 left-0 right-0 md:hidden bg-card border-t shadow-lg z-50">
      <nav className={`grid ${gridColsClass} h-16`}>
        {navLinks.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center w-full transition-colors text-xs font-medium",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </footer>
  );
}
