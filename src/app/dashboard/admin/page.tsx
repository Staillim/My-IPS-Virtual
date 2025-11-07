'use client';

import { Header } from '@/components/header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Users,
  UserPlus,
  CalendarCheck,
  CalendarX,
  DollarSign,
  ShieldAlert,
  FileText,
  Activity,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { format, startOfMonth, endOfMonth, subMonths, isToday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const chartConfig = {
  revenue: {
    label: 'Ingresos',
    color: 'hsl(var(--primary))',
  },
  appointments: {
    label: 'Citas',
    color: 'hsl(var(--muted-foreground))',
  },
};

// Función auxiliar para parsear fechas en formato YYYY-MM-DD
const parseLocalDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export default function AdminDashboardPage() {
  const firestore = useFirestore();

  // Queries para obtener datos
  const usersQuery = useMemoFirebase(() => 
    firestore ? collection(firestore, 'users') : null, 
    [firestore]
  );
  const { data: users, isLoading: isLoadingUsers } = useCollection(usersQuery);

  const appointmentsQuery = useMemoFirebase(() => 
    firestore ? collection(firestore, 'appointments') : null, 
    [firestore]
  );
  const { data: appointments, isLoading: isLoadingAppointments } = useCollection(appointmentsQuery);

  const formulasQuery = useMemoFirebase(() => 
    firestore ? collection(firestore, 'formulas') : null, 
    [firestore]
  );
  const { data: formulas, isLoading: isLoadingFormulas } = useCollection(formulasQuery);

  const servicesQuery = useMemoFirebase(() => 
    firestore ? collection(firestore, 'services') : null, 
    [firestore]
  );
  const { data: services } = useCollection(servicesQuery);

  // Calcular estadísticas
  const stats = {
    medicos: users?.filter(u => u.role === 'PERSONAL').length || 0,
    pacientes: users?.filter(u => u.role === 'PACIENTE').length || 0,
    citasHoy: appointments?.filter(apt => {
      try {
        const aptDate = parseLocalDate(apt.date);
        return isToday(aptDate);
      } catch {
        return false;
      }
    }).length || 0,
    citasTotales: appointments?.length || 0,
    formulasMes: formulas?.filter(f => {
      try {
        const formDate = new Date(f.date);
        const now = new Date();
        return formDate.getMonth() === now.getMonth() && 
               formDate.getFullYear() === now.getFullYear();
      } catch {
        return false;
      }
    }).length || 0,
  };

  // Calcular datos del gráfico (últimos 6 meses)
  const getChartData = () => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      // Filtrar citas completadas del mes y sumar sus precios reales
      const monthAppointments = appointments?.filter(apt => {
        try {
          const aptDate = parseLocalDate(apt.date);
          return aptDate >= monthStart && aptDate <= monthEnd && apt.status === 'completada';
        } catch {
          return false;
        }
      }) || [];

      // Calcular ingresos reales sumando el precio de cada cita
      const monthRevenue = monthAppointments.reduce((total, apt) => {
        return total + (apt.price || 0);
      }, 0);

      data.push({
        month: format(date, 'MMM', { locale: es }),
        revenue: monthRevenue,
        appointments: monthAppointments.length,
      });
    }
    return data;
  };

  const chartData = getChartData();

  // Calcular ingresos del mes actual
  const currentMonthRevenue = chartData[chartData.length - 1]?.revenue || 0;

  // Actividad reciente (últimas 5 acciones)
  const recentActivity = [
    ...(appointments?.slice(-5).reverse().map(apt => ({
      type: 'appointment',
      title: 'Nueva cita agendada',
      description: `${apt.patientName} con ${apt.doctorName}`,
      time: apt.date,
      status: apt.status,
    })) || []),
  ].slice(0, 5);

  const isLoading = isLoadingUsers || isLoadingAppointments || isLoadingFormulas;
  return (
    <>
      <Header />
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold font-headline mb-2">
              Panel de Administrador
            </h1>
            <p className="text-muted-foreground">
              Vista general del sistema y métricas clave.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Médicos Activos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats.medicos}</div>
                    <p className="text-xs text-muted-foreground">
                      Personal médico registrado
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pacientes Registrados</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats.pacientes}</div>
                    <p className="text-xs text-muted-foreground">
                      Usuarios pacientes
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Citas Hoy</CardTitle>
                <CalendarCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats.citasHoy}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.citasTotales} citas totales
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos (Mes)</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      ${new Intl.NumberFormat('es-CO').format(currentMonthRevenue)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stats.formulasMes} fórmulas emitidas
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Ingresos por Citas Completadas</CardTitle>
                 <CardDescription>
                   Últimos 6 meses - Basado en el precio real de cada servicio
                 </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                {isLoading ? (
                  <Skeleton className="h-[200px] w-full" />
                ) : (
                  <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                    <BarChart accessibilityLayer data={chartData}>
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tickFormatter={(value) => value}
                      />
                      <YAxis
                         tickLine={false}
                         axisLine={false}
                         tickFormatter={(value) => {
                           if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                           if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
                           return `$${value}`;
                         }}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={({ active, payload }) => {
                          if (!active || !payload || !payload.length) return null;
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                              <div className="grid gap-2">
                                <div className="flex flex-col">
                                  <span className="text-[0.70rem] uppercase text-muted-foreground">
                                    {data.month}
                                  </span>
                                  <span className="font-bold text-muted-foreground">
                                    Ingresos: ${new Intl.NumberFormat('es-CO').format(data.revenue)}
                                  </span>
                                  <span className="text-[0.70rem] text-muted-foreground">
                                    {data.appointments} citas completadas
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="revenue" fill="var(--color-revenue)" radius={8} />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Actividad Reciente
                </CardTitle>
                <CardDescription>Últimas acciones en el sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                    </div>
                  ))
                ) : recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <CalendarCheck className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant={
                              activity.status === 'confirmada' ? 'default' :
                              activity.status === 'completada' ? 'secondary' :
                              activity.status === 'cancelada' ? 'destructive' :
                              'outline'
                            }
                            className="text-xs"
                          >
                            {activity.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {activity.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay actividad reciente</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
