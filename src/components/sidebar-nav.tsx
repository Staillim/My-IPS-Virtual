
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Calendar,
  FileText,
  Stethoscope,
  Users,
  Briefcase,
  Bell,
  HelpCircle,
  Settings,
  LogOut,
  User as UserIcon,
  Shield,
  BarChart3,
  Clock,
  FolderOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, useDoc, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { doc } from "firebase/firestore";

const patientNavLinks = [
  { href: "/dashboard", icon: Home, label: "Inicio" },
  { href: "/dashboard/citas", icon: Calendar, label: "Citas médicas" },
  { href: "/dashboard/historial", icon: Stethoscope, label: "Historial clínico" },
  { href: "/dashboard/formulas", icon: FileText, label: "Fórmulas médicas" },
  { href: "/dashboard/medicos", icon: Users, label: "Médicos disponibles" },
  { href: "/dashboard/servicios", icon: Briefcase, label: "Servicios médicos" },
  { href: "/dashboard/notificaciones", icon: Bell, label: "Notificaciones" },
];

const personalNavLinks = [
  { href: "/dashboard/personal", icon: Home, label: "Inicio" },
  { href: "/dashboard/personal/citas", icon: Calendar, label: "Mis Citas" },
  { href: "/dashboard/personal/pacientes", icon: Users, label: "Pacientes" },
  { href: "/dashboard/personal/formulas", icon: FileText, label: "Fórmulas" },
  { href: "/dashboard/personal/turnos", icon: Clock, label: "Mis Turnos" },
];

const adminNavLinks = [
  { href: "/dashboard/admin", icon: Shield, label: "Panel Principal" },
  { href: "/dashboard/admin/medicos", icon: Users, label: "Gestionar Médicos" },
  { href: "/dashboard/admin/pacientes", icon: Users, label: "Gestionar Pacientes" },
  { href: "/dashboard/admin/citas", icon: Calendar, label: "Gestionar Citas" },
  { href: "/dashboard/admin/turnos", icon: Clock, label: "Gestionar Turnos" },
  { href: "/dashboard/admin/formulas", icon: FileText, label: "Gestionar Fórmulas" },
  { href: "/dashboard/admin/servicios", icon: Briefcase, label: "Gestionar Servicios" },
  { href: "/dashboard/admin/estadisticas", icon: BarChart3, label: "Reportes y Estadísticas" },
];


const secondaryNavLinks = [
  { href: "/dashboard/perfil", icon: UserIcon, label: "Perfil" },
  { href: "/dashboard/ayuda", icon: HelpCircle, label: "Ayuda y soporte" },
];

export function SidebarNav({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();
  const auth = useAuth();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData } = useDoc(userDocRef);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/login");
      if (onLinkClick) {
        onLinkClick();
      }
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const renderLink = (link: { href: string; icon: React.ElementType; label: string }) => {
    const isActive = pathname === link.href;
    const Icon = link.icon;
    return (
      <Link
        key={link.href}
        href={link.href}
        onClick={onLinkClick}
        className={cn(
          "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <Icon className="mr-3 h-5 w-5" />
        <span>{link.label}</span>
      </Link>
    );
  };
  
  let mainNavLinks = patientNavLinks;
  if (userData?.role === 'ADMIN') {
    mainNavLinks = adminNavLinks;
  } else if (userData?.role !== 'PACIENTE') {
    mainNavLinks = personalNavLinks;
  }

  return (
    <div className="flex flex-col h-full">
        <nav className="flex-1 space-y-1">
            {mainNavLinks.map(renderLink)}
        </nav>
        <div className="mt-auto space-y-1">
            <div className="h-px bg-border my-4"></div>
            {secondaryNavLinks.map(renderLink)}
             <button
                onClick={handleSignOut}
                className={cn(
                "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors w-full",
                "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
            >
                <LogOut className="mr-3 h-5 w-5" />
                <span>Cerrar sesión</span>
            </button>
        </div>
    </div>
  );
}
