'use client';

import { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Bar, BarChart, XAxis, YAxis, Pie, PieChart, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { format, startOfMonth, endOfMonth, startOfYear, subMonths, startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

const chartConfigAppointments = {
  atendidas: { label: 'Atendidas', color: 'hsl(var(--primary))' },
  canceladas: { label: 'Canceladas', color: 'hsl(var(--destructive))' },
};

const chartConfigIncome = {
    general: { label: 'C. General', color: 'hsl(var(--chart-1))' },
    pediatria: { label: 'Pediatría', color: 'hsl(var(--chart-2))' },
    psicologia: { label: 'Psicología', color: 'hsl(var(--chart-3))' },
    certificados: { label: 'Certificados', color: 'hsl(var(--chart-4))' },
};

type PeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly';

export default function AdminEstadisticasPage() {
  const firestore = useFirestore();
  const [period, setPeriod] = useState<PeriodType>('monthly');

  // Calcular rango de fechas según el periodo
  const dateRange = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (period) {
      case 'daily':
        start = startOfDay(now);
        end = endOfDay(now);
        break;
      case 'weekly':
        start = startOfWeek(now, { locale: es });
        end = endOfWeek(now, { locale: es });
        break;
      case 'monthly':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'yearly':
        start = startOfYear(now);
        end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        break;
    }

    return { start, end };
  }, [period]);

  // Obtener todas las citas
  const appointmentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'appointments');
  }, [firestore]);

  const { data: allAppointments, isLoading: appointmentsLoading } = useCollection(appointmentsQuery);

  // Obtener todos los usuarios
  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);

  const { data: allUsers, isLoading: usersLoading } = useCollection(usersQuery);

  // Obtener todos los servicios
  const servicesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'services');
  }, [firestore]);

  const { data: allServices, isLoading: servicesLoading } = useCollection(servicesQuery);

  // Filtrar citas por periodo
  const filteredAppointments = useMemo(() => {
    if (!allAppointments) return [];
    
    return allAppointments.filter((apt: any) => {
      if (!apt.date) return false;
      const aptDate = new Date(apt.date);
      return aptDate >= dateRange.start && aptDate <= dateRange.end;
    });
  }, [allAppointments, dateRange]);

  // Calcular métricas principales
  const metrics = useMemo(() => {
    const completedAppointments = filteredAppointments.filter((apt: any) => 
      apt.status === 'completada'
    );
    const cancelledAppointments = filteredAppointments.filter((apt: any) => 
      apt.status === 'cancelada'
    );

    const totalIncome = completedAppointments.reduce((sum: number, apt: any) => {
      return sum + (apt.price || 0);
    }, 0);

    // Pacientes nuevos en el periodo
    const newPatients = allUsers?.filter((user: any) => {
      if (user.role !== 'PACIENTE') return false;
      if (!user.createdAt) return false;
      const createdDate = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
      return createdDate >= dateRange.start && createdDate <= dateRange.end;
    }).length || 0;

    const cancellationRate = filteredAppointments.length > 0
      ? ((cancelledAppointments.length / filteredAppointments.length) * 100).toFixed(1)
      : '0.0';

    return {
      completedCount: completedAppointments.length,
      totalIncome,
      newPatients,
      cancellationRate: parseFloat(cancellationRate),
      cancelledCount: cancelledAppointments.length
    };
  }, [filteredAppointments, allUsers, dateRange]);

  // Datos para gráfico de barras (últimos 6 meses)
  const monthlyAppointmentsData = useMemo(() => {
    if (!allAppointments) return [];

    const months = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const monthAppointments = allAppointments.filter((apt: any) => {
        if (!apt.date) return false;
        const aptDate = new Date(apt.date);
        return aptDate >= monthStart && aptDate <= monthEnd;
      });

      const atendidas = monthAppointments.filter((apt: any) => apt.status === 'completada').length;
      const canceladas = monthAppointments.filter((apt: any) => apt.status === 'cancelada').length;

      months.push({
        month: format(monthDate, 'MMM', { locale: es }),
        atendidas,
        canceladas
      });
    }

    return months;
  }, [allAppointments]);

  // Datos para gráfico de pastel (ingresos por servicio)
  const incomeByServiceData = useMemo(() => {
    if (!filteredAppointments || !allServices) return [];

    const serviceIncome: { [key: string]: number } = {};

    filteredAppointments.forEach((apt: any) => {
      if (apt.status === 'completada' && apt.serviceId) {
        serviceIncome[apt.serviceId] = (serviceIncome[apt.serviceId] || 0) + (apt.price || 0);
      }
    });

    const servicesMap = new Map(allServices.map((s: any) => [s.id, s]));
    
    const colors = [
      'hsl(var(--chart-1))',
      'hsl(var(--chart-2))',
      'hsl(var(--chart-3))',
      'hsl(var(--chart-4))',
      'hsl(var(--chart-5))'
    ];

    return Object.entries(serviceIncome)
      .map(([serviceId, value], index) => {
        const service = servicesMap.get(serviceId);
        return {
          name: service?.name || 'Desconocido',
          value,
          fill: colors[index % colors.length]
        };
      })
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filteredAppointments, allServices]);

  // Datos para tabla de médicos
  const topDoctorsData = useMemo(() => {
    if (!filteredAppointments || !allUsers) return [];

    const doctorStats: { [key: string]: { appointments: number; income: number; name: string } } = {};

    filteredAppointments.forEach((apt: any) => {
      if (apt.status === 'completada' && apt.doctorId) {
        if (!doctorStats[apt.doctorId]) {
          const doctor = allUsers.find((u: any) => u.id === apt.doctorId);
          doctorStats[apt.doctorId] = {
            appointments: 0,
            income: 0,
            name: apt.doctorName || doctor?.displayName || `${doctor?.firstName || ''} ${doctor?.lastName || ''}`.trim() || 'Desconocido'
          };
        }
        doctorStats[apt.doctorId].appointments += 1;
        doctorStats[apt.doctorId].income += apt.price || 0;
      }
    });

    return Object.entries(doctorStats)
      .map(([id, stats]) => ({
        id,
        ...stats
      }))
      .sort((a, b) => b.income - a.income)
      .slice(0, 10);
  }, [filteredAppointments, allUsers]);

  // Función para exportar datos
  const handleExport = async () => {
    try {
      const jsPDF = (await import('jspdf')).default;
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Título
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('REPORTE DE ESTADÍSTICAS', pageWidth / 2, 15, { align: 'center' });
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('IPS Virtual - Sistema de Salud Digital', pageWidth / 2, 25, { align: 'center' });

      // Información del periodo
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      const periodLabel = {
        daily: 'Hoy',
        weekly: 'Esta Semana',
        monthly: 'Este Mes',
        yearly: 'Este Año'
      }[period];
      doc.text(`Periodo: ${periodLabel}`, 14, 35);
      doc.text(`Generado: ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })}`, pageWidth - 14, 35, { align: 'right' });

      let yPosition = 50;

      // Métricas principales
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('MÉTRICAS PRINCIPALES', 14, yPosition);
      yPosition += 10;

      const metricsData = [
        ['Citas Atendidas', metrics.completedCount.toString()],
        ['Ingresos Totales', `$${new Intl.NumberFormat('es-CO').format(metrics.totalIncome)}`],
        ['Pacientes Nuevos', metrics.newPatients.toString()],
        ['Tasa de Cancelación', `${metrics.cancellationRate}%`]
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [['Métrica', 'Valor']],
        body: metricsData,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185] }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;

      // Rendimiento por médico
      if (topDoctorsData.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('RENDIMIENTO POR MÉDICO', 14, yPosition);
        yPosition += 10;

        const doctorsTableData = topDoctorsData.map((doctor: any) => [
          doctor.name,
          doctor.appointments.toString(),
          `$${new Intl.NumberFormat('es-CO').format(doctor.income)}`
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Médico', 'Citas', 'Ingresos']],
          body: doctorsTableData,
          styles: { fontSize: 10 },
          headStyles: { fillColor: [41, 128, 185] }
        });
      }

      doc.save(`reporte-estadisticas-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Error al generar PDF:', error);
    }
  };

  const loading = appointmentsLoading || usersLoading || servicesLoading;

  return (
    <>
      <Header />
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-start mb-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Reportes y Estadísticas</h1>
                <p className="text-muted-foreground">
                    Analiza el rendimiento de la plataforma con reportes detallados.
                </p>
            </div>
             <div className="flex items-center gap-2">
                <Select value={period} onValueChange={(value) => setPeriod(value as PeriodType)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filtrar por periodo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="daily">Hoy</SelectItem>
                        <SelectItem value="weekly">Esta Semana</SelectItem>
                        <SelectItem value="monthly">Este Mes</SelectItem>
                        <SelectItem value="yearly">Este Año</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="outline" onClick={handleExport} disabled={loading}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                </Button>
            </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
             <Card>
                <CardHeader className="pb-2">
                    <CardDescription>Citas Atendidas</CardDescription>
                    {loading ? (
                      <Skeleton className="h-10 w-20" />
                    ) : (
                      <CardTitle className="text-4xl">{metrics.completedCount}</CardTitle>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Minus className="h-3 w-3" />
                      Periodo seleccionado
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardDescription>Ingresos Totales</CardDescription>
                    {loading ? (
                      <Skeleton className="h-10 w-32" />
                    ) : (
                      <CardTitle className="text-4xl">${new Intl.NumberFormat('es-CO').format(metrics.totalIncome)}</CardTitle>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Minus className="h-3 w-3" />
                      Citas completadas
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardDescription>Pacientes Nuevos</CardDescription>
                    {loading ? (
                      <Skeleton className="h-10 w-16" />
                    ) : (
                      <CardTitle className="text-4xl">{metrics.newPatients}</CardTitle>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Minus className="h-3 w-3" />
                      Registrados en periodo
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardDescription>Tasa de Cancelación</CardDescription>
                    {loading ? (
                      <Skeleton className="h-10 w-24" />
                    ) : (
                      <CardTitle className="text-4xl">{metrics.cancellationRate}%</CardTitle>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      {metrics.cancellationRate > 20 ? (
                        <TrendingUp className="h-3 w-3 text-red-500" />
                      ) : metrics.cancellationRate > 10 ? (
                        <Minus className="h-3 w-3 text-yellow-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-green-500" />
                      )}
                      {metrics.cancelledCount} canceladas
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Rendimiento de Citas Mensuales</CardTitle>
                <CardDescription>Últimos 6 meses de actividad</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                {loading ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : (
                  <ChartContainer config={chartConfigAppointments} className="min-h-[250px] w-full">
                    <BarChart data={monthlyAppointmentsData}>
                      <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} />
                      <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                      <Bar dataKey="atendidas" fill="var(--color-atendidas)" radius={8} />
                      <Bar dataKey="canceladas" fill="var(--color-canceladas)" radius={8} />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Ingresos por Servicio</CardTitle>
                    <CardDescription>Distribución de ingresos del periodo.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pb-0">
                    {loading ? (
                      <Skeleton className="mx-auto aspect-square max-h-[250px] rounded-full" />
                    ) : incomeByServiceData.length === 0 ? (
                      <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                        No hay datos disponibles
                      </div>
                    ) : (
                      <>
                        <ChartContainer config={chartConfigIncome} className="mx-auto aspect-square max-h-[250px]">
                            <PieChart>
                                 <ChartTooltip 
                                   cursor={false} 
                                   content={<ChartTooltipContent 
                                     formatter={(value, name) => [
                                       `$${new Intl.NumberFormat('es-CO').format(value as number)}`,
                                       name as string
                                     ]}
                                   />} 
                                 />
                                <Pie data={incomeByServiceData} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>
                                    {incomeByServiceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ChartContainer>
                        <div className="mt-4 space-y-2">
                          {incomeByServiceData.map((entry, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: entry.fill }}
                                />
                                <span className="text-muted-foreground">{entry.name}</span>
                              </div>
                              <span className="font-medium">${new Intl.NumberFormat('es-CO').format(entry.value)}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                </CardContent>
                 <CardFooter className="flex-col gap-2 text-sm">
                    <div className="flex items-center gap-2 font-medium leading-none">
                        {incomeByServiceData.length > 0 ? (
                          `${incomeByServiceData.length} servicio${incomeByServiceData.length > 1 ? 's' : ''} generando ingresos`
                        ) : (
                          'Sin ingresos en el periodo'
                        )}
                    </div>
                 </CardFooter>
            </Card>
        </div>

        <Card className="mt-6">
            <CardHeader>
                <CardTitle>Rendimiento por Médico</CardTitle>
                <CardDescription>Ranking de médicos por citas e ingresos generados en el periodo seleccionado.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-14 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead className="w-[350px]">Médico</TableHead>
                              <TableHead>Citas Atendidas</TableHead>
                              <TableHead className="text-right">Ingresos Generados</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {topDoctorsData.length === 0 ? (
                              <TableRow>
                                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                      No hay datos disponibles para el periodo seleccionado
                                  </TableCell>
                              </TableRow>
                          ) : (
                              topDoctorsData.map((doctor, index) => (
                                  <TableRow key={doctor.id}>
                                      <TableCell>
                                          <div className="flex items-center gap-3">
                                              <Avatar className="h-9 w-9">
                                                  <AvatarImage src={`/avatars/0${(index % 5) + 1}.png`} alt="Avatar" />
                                                  <AvatarFallback>{doctor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                              </Avatar>
                                              <div>
                                                <div className="font-medium">{doctor.name}</div>
                                                {index === 0 && <div className="text-xs text-yellow-600">🏆 Top #1</div>}
                                              </div>
                                          </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="font-medium">{doctor.appointments}</div>
                                        <div className="text-xs text-muted-foreground">citas</div>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <div className="font-medium">${new Intl.NumberFormat('es-CO').format(doctor.income)}</div>
                                        <div className="text-xs text-muted-foreground">COP</div>
                                      </TableCell>
                                  </TableRow>
                              ))
                          )}
                      </TableBody>
                  </Table>
                )}
            </CardContent>
        </Card>
      </div>
    </>
  );
}
