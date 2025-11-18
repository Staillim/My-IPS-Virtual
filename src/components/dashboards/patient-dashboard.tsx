"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Stethoscope, FileText, Bell, Clock } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/header";
import { useUser, useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { collection, query, where, orderBy, limit } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function PatientDashboard() {
  const { user } = useUser();
  const firestore = useFirestore();

  // Query for upcoming appointments
  const upcomingAppointmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'appointments'),
      where('patientId', '==', user.uid),
      where('status', 'in', ['pendiente', 'confirmada']),
      limit(3)
    );
  }, [firestore, user]);

  const { data: upcomingAppointments, isLoading: isLoadingAppointments } = useCollection(upcomingAppointmentsQuery);

  // Query for unread notifications
  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'notifications'),
      where('userId', '==', user.uid),
      where('read', '==', false),
      limit(5)
    );
  }, [firestore, user]);

  const { data: unreadNotifications, isLoading: isLoadingNotifications } = useCollection(notificationsQuery);

  // Query for active formulas
  const activeFormulasQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'formulas'),
      where('patientId', '==', user.uid),
      where('status', '==', 'activa')
    );
  }, [firestore, user]);

  const { data: activeFormulas, isLoading: isLoadingFormulas } = useCollection(activeFormulasQuery);

  // También buscar fórmulas activas con el campo antiguo userId (para compatibilidad)
  const legacyActiveFormulasQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'formulas'),
      where('userId', '==', user.uid),
      where('status', '==', 'activa')
    );
  }, [firestore, user]);

  const { data: legacyActiveFormulas } = useCollection(legacyActiveFormulasQuery);

  // Combinar ambas listas y eliminar duplicados
  const allActiveFormulas = [...(activeFormulas || []), ...(legacyActiveFormulas || [])].filter(
    (formula, index, self) => index === self.findIndex((f) => f.id === formula.id)
  );

  const parseLocalDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Sort appointments by date
  const sortedAppointments = upcomingAppointments ? [...upcomingAppointments].sort((a, b) => {
    const dateA = parseLocalDate(a.date);
    const dateB = parseLocalDate(b.date);
    return dateA.getTime() - dateB.getTime();
  }) : [];

  const unreadCount = unreadNotifications?.length || 0;

  return (
    <>
    <Header />
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-bold font-headline mb-2">
            Bienvenido a IPS Virtual
          </h1>
          <p className="text-muted-foreground">
            Tu portal de salud digital. Administra tus citas y revisa tu historial fácilmente.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Próximas Citas Card */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">Próximas Citas</CardTitle>
              <Calendar className="h-6 w-6 text-primary" />
            </CardHeader>
            <CardContent>
              {isLoadingAppointments ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : sortedAppointments.length > 0 ? (
                <div className="space-y-3">
                  {sortedAppointments.slice(0, 2).map((appointment) => (
                    <div key={appointment.id} className="text-sm border-l-2 border-primary pl-3 py-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">
                          {format(parseLocalDate(appointment.date), "d 'de' MMMM", { locale: es })}
                        </span>
                        <Badge variant={appointment.status === 'confirmada' ? 'default' : 'secondary'} className="text-xs">
                          {appointment.status}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-xs">{appointment.doctorName}</p>
                      <p className="text-muted-foreground text-xs">{appointment.reason}</p>
                    </div>
                  ))}
                  {sortedAppointments.length > 2 && (
                    <Link href="/dashboard/citas">
                      <Button variant="link" size="sm" className="p-0 h-auto text-xs">
                        Ver todas las citas
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No tienes citas programadas.</p>
              )}
            </CardContent>
          </Card>

          {/* Notificaciones Card */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">Notificaciones</CardTitle>
              <div className="relative">
                <Bell className="h-6 w-6 text-primary" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                    {unreadCount}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingNotifications ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : unreadCount > 0 ? (
                <div className="space-y-2">
                  {unreadNotifications?.slice(0, 2).map((notification) => (
                    <div key={notification.id} className="text-sm border-l-2 border-blue-500 pl-3 py-1">
                      <p className="font-medium text-xs">{notification.title}</p>
                      <p className="text-muted-foreground text-xs line-clamp-2">{notification.message}</p>
                    </div>
                  ))}
                  <Link href="/dashboard/notificaciones">
                    <Button variant="link" size="sm" className="p-0 h-auto text-xs">
                      Ver todas ({unreadCount})
                    </Button>
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No hay notificaciones nuevas.</p>
              )}
            </CardContent>
          </Card>
          
          {/* Fórmulas Activas Card */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">Fórmulas Activas</CardTitle>
              <FileText className="h-6 w-6 text-primary" />
            </CardHeader>
            <CardContent>
              {isLoadingFormulas ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : allActiveFormulas && allActiveFormulas.length > 0 ? (
                <div className="space-y-3">
                  {allActiveFormulas.slice(0, 2).map((formula) => (
                    <div key={formula.id} className="text-sm border-l-2 border-green-500 pl-3 py-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">
                          {formula.doctorName || 'Médico'}
                        </span>
                        <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                          Activa
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {formula.medications?.length || 0} medicamento(s)
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Fecha: {formula.date ? format(new Date(formula.date), "d 'de' MMMM", { locale: es }) : 'N/A'}
                      </p>
                    </div>
                  ))}
                  {allActiveFormulas && allActiveFormulas.length > 2 && (
                    <Link href="/dashboard/formulas">
                      <Button variant="link" size="sm" className="p-0 h-auto text-xs">
                        Ver todas las fórmulas ({allActiveFormulas.length})
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No tienes fórmulas activas.</p>
              )}
            </CardContent>
          </Card>

        </div>

        <div>
          <h2 className="text-2xl font-semibold font-headline mb-4">Acciones Rápidas</h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <Link href="/dashboard/citas">
              <Card className="h-full flex flex-col justify-between p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold">Agendar Cita</h3>
                        <p className="text-sm text-muted-foreground">Encuentra un especialista.</p>
                    </div>
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
              </Card>
            </Link>
            <Link href="/dashboard/formulas">
              <Card className="h-full flex flex-col justify-between p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between">
                     <div>
                        <h3 className="font-semibold">Ver Fórmulas</h3>
                        <p className="text-sm text-muted-foreground">Consulta tus recetas médicas.</p>
                    </div>
                    <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
              </Card>
            </Link>
            <Link href="/dashboard/historial">
              <Card className="h-full flex flex-col justify-between p-4 hover:bg-accent/50 transition-colors">
                 <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold">Historial Clínico</h3>
                        <p className="text-sm text-muted-foreground">Revisa tu historial de salud.</p>
                    </div>
                    <Stethoscope className="h-8 w-8 text-muted-foreground" />
                </div>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
