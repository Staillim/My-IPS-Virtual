
'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CalendarCheck,
  Clock,
  PlusCircle,
  Video,
  Users,
  Bell,
  CheckCircle,
  XCircle,
  Calendar as CalendarIcon,
  Stethoscope,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { format, isToday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'confirmada':
      return 'default';
    case 'pendiente':
      return 'secondary';
    case 'en curso':
      return 'secondary';
    case 'completada':
      return 'outline';
    case 'cancelada':
      return 'destructive';
    default:
      return 'outline';
  }
};

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'appointment_confirmed':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'appointment_cancelled':
      return <XCircle className="h-4 w-4 text-red-600" />;
    case 'new_appointment':
      return <CalendarIcon className="h-4 w-4 text-blue-600" />;
    case 'appointment_rescheduled':
      return <Clock className="h-4 w-4 text-orange-600" />;
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
};

export default function PersonalDashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // Helper function to parse date string as local date
  const parseLocalDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Query para citas del doctor
  const appointmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'appointments'),
      where('doctorId', '==', user.uid)
    );
  }, [firestore, user]);

  const { data: appointments, isLoading: isLoadingAppointments } = useCollection(appointmentsQuery);

  // Debug: Ver qué citas hay
  useEffect(() => {
    console.log('🔍 Debug Info:');
    console.log('- User:', user?.displayName, user?.uid);
    console.log('- isLoadingAppointments:', isLoadingAppointments);
    console.log('- appointments:', appointments);
    console.log('- appointments length:', appointments?.length || 0);
    
    if (appointments && appointments.length > 0) {
      console.log('📅 Total appointments:', appointments.length);
      console.log('📅 Sample appointment:', appointments[0]);
      appointments.forEach(apt => {
        const aptDate = parseLocalDate(apt.date);
        console.log(`Cita: ${apt.patientName} - Fecha: ${apt.date} - isToday: ${isToday(aptDate)} - Status: ${apt.status}`);
      });
    } else {
      console.log('❌ No appointments found or still loading');
    }
  }, [appointments, isLoadingAppointments, user]);

  // Query para notificaciones recientes (sin orderBy para evitar índice compuesto)
  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'notifications'),
      where('userId', '==', user.uid),
      limit(10)
    );
  }, [firestore, user]);

  const { data: notificationsData, isLoading: isLoadingNotifications } = useCollection(notificationsQuery);

  // Ordenar notificaciones en el cliente
  const notifications = notificationsData?.sort((a, b) => {
    if (!a.createdAt || !b.createdAt) return 0;
    return b.createdAt.toMillis() - a.createdAt.toMillis();
  }) || [];

  // Debug: Ver la fecha actual del sistema
  console.log('🕐 Fecha actual del sistema:', new Date());
  console.log('🕐 Fecha formateada:', format(new Date(), 'yyyy-MM-dd'));

  // Debug: Mostrar TODAS las citas con sus detalles
  console.log('📋 TODAS LAS CITAS:', appointments?.length || 0);
  appointments?.forEach((apt, index) => {
    console.log(`  ${index + 1}. Fecha: ${apt.date} | Status: ${apt.status} | Paciente: ${apt.patientName}`);
  });

  // Filtrar citas de hoy - TODAS las citas de hoy, sin importar el estado
  const todayAppointments = appointments?.filter((apt) => {
    try {
      const aptDate = parseLocalDate(apt.date);
      const isTodayResult = isToday(aptDate);
      console.log(`🔍 Checking: ${apt.date} -> ${aptDate} -> isToday: ${isTodayResult} -> Status: ${apt.status}`);
      
      return isTodayResult; // Solo filtrar por fecha, no por status
    } catch (error) {
      console.error('❌ Error parsing date:', apt.date, error);
      return false;
    }
  }).sort((a, b) => a.time.localeCompare(b.time)) || [];

  console.log('📊 todayAppointments filtradas:', todayAppointments.length);
  console.log('📊 Citas de hoy encontradas:', todayAppointments.map(apt => `${apt.date} - ${apt.status} - ${apt.patientName}`));

  // Estadísticas del día - ahora cuentan TODAS las citas de hoy
  const todayStats = {
    total: todayAppointments.length,
    pendientes: todayAppointments.filter(apt => apt.status === 'pendiente').length,
    confirmadas: todayAppointments.filter(apt => apt.status === 'confirmada').length,
    completadas: todayAppointments.filter(apt => apt.status === 'completada').length,
  };

  console.log('📊 todayStats:', todayStats);

  // Debug: Contar citas confirmadas en TODAS las citas (no solo hoy)
  const todasConfirmadas = appointments?.filter(apt => apt.status === 'confirmada') || [];
  console.log('✅ TODAS las citas confirmadas (cualquier fecha):', todasConfirmadas.length);
  todasConfirmadas.forEach(apt => {
    console.log(`   - ${apt.date} | ${apt.time} | ${apt.patientName}`);
  });

  // Estadísticas generales (todas las citas, no solo hoy)
  const generalStats = {
    total: appointments?.length || 0,
    pendientes: appointments?.filter(apt => apt.status === 'pendiente').length || 0,
    confirmadas: appointments?.filter(apt => apt.status === 'confirmada').length || 0,
    completadas: appointments?.filter(apt => apt.status === 'completada').length || 0,
  };

  console.log('📊 generalStats (todas las citas):', generalStats);

  if (isUserLoading) {
    return (
      <>
        <Header />
        <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96 mb-8" />
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold font-headline mb-2">
              Bienvenido, Dr. {user?.displayName || 'Doctor'}
            </h1>
            <p className="text-muted-foreground">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>

          {/* Estadísticas del día */}
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Citas
                </CardTitle>
                <CalendarCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{generalStats.total}</div>
                <p className="text-xs text-muted-foreground">
                  Todas las citas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pendientes
                </CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{generalStats.pendientes}</div>
                <p className="text-xs text-muted-foreground">
                  Por confirmar
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Confirmadas
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{generalStats.confirmadas}</div>
                <p className="text-xs text-muted-foreground">
                  Listas para atender
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Completadas
                </CardTitle>
                <Stethoscope className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{generalStats.completadas}</div>
                <p className="text-xs text-muted-foreground">
                  Atendidas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Citas para Hoy */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Citas para Hoy</CardTitle>
                  <CardDescription>
                    Tienes {todayAppointments.length} {todayAppointments.length === 1 ? 'cita programada' : 'citas programadas'} para hoy.
                  </CardDescription>
                </div>
                <Link href="/dashboard/personal/citas">
                  <Button variant="outline" size="sm">
                    Ver todas
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoadingAppointments ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </div>
                      <Skeleton className="h-9 w-32" />
                    </div>
                  ))
                ) : todayAppointments.length > 0 ? (
                  todayAppointments.map((cita) => (
                    <div
                      key={cita.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {cita.patientName?.charAt(0) || 'P'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{cita.patientName}</p>
                            <Badge variant={getStatusVariant(cita.status)} className="text-xs">
                              {cita.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {cita.time} - {cita.serviceName}
                          </p>
                          {cita.reason && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Motivo: {cita.reason}
                            </p>
                          )}
                        </div>
                      </div>
                      <Link href={`/dashboard/personal/citas`}>
                        <Button variant="secondary" size="sm">
                          Ver detalles
                        </Button>
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <CalendarCheck className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground font-medium">
                      No tienes citas programadas para hoy
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Disfruta tu día libre o revisa las citas de otros días
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Notificaciones Recientes */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notificaciones
                  </CardTitle>
                  <Link href="/dashboard/notificaciones">
                    <Button variant="ghost" size="sm">
                      Ver todas
                    </Button>
                  </Link>
                </div>
                <CardDescription>
                  Actualizaciones recientes de tu agenda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {isLoadingNotifications ? (
                    [...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
                        <Skeleton className="h-4 w-4 mt-0.5" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))
                  ) : notifications && notifications.length > 0 ? (
                    notifications.slice(0, 5).map((notif) => (
                      <div
                        key={notif.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${
                          notif.read ? 'bg-background' : 'bg-primary/5 border-primary/20'
                        }`}
                      >
                        <div className="mt-0.5">
                          {getNotificationIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{notif.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notif.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {notif.createdAt && format(notif.createdAt.toDate(), "d MMM 'a las' HH:mm", { locale: es })}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Bell className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                      <p className="text-sm text-muted-foreground">
                        No tienes notificaciones recientes
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Acciones Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
                <CardDescription>
                  Acceso directo a herramientas frecuentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  <Link href="/dashboard/personal/citas">
                    <Card className="p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CalendarCheck className="h-8 w-8 text-primary" />
                          <div>
                            <h3 className="font-semibold">Gestionar Citas</h3>
                            <p className="text-sm text-muted-foreground">
                              Ver calendario completo
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>

                  <Link href="/dashboard/personal/pacientes">
                    <Card className="p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Users className="h-8 w-8 text-primary" />
                          <div>
                            <h3 className="font-semibold">Pacientes</h3>
                            <p className="text-sm text-muted-foreground">
                              Buscar historiales clínicos
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>

                  <Link href="/dashboard/personal/formulas">
                    <Card className="p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <PlusCircle className="h-8 w-8 text-primary" />
                          <div>
                            <h3 className="font-semibold">Nueva Fórmula</h3>
                            <p className="text-sm text-muted-foreground">
                              Emitir una receta médica
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
