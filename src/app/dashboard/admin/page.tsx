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
} from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const chartData = [
  { month: 'Ene', revenue: 0 },
  { month: 'Feb', revenue: 0 },
  { month: 'Mar', revenue: 0 },
  { month: 'Abr', revenue: 0 },
  { month: 'May', revenue: 0 },
  { month: 'Jun', revenue: 0 },
];

const chartConfig = {
  revenue: {
    label: 'Ingresos',
    color: 'hsl(var(--primary))',
  },
};


export default function AdminDashboardPage() {
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
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Sin cambios</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pacientes Registrados</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Sin cambios</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Citas Hoy</CardTitle>
                <CalendarCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Sin citas pendientes</p>
              </CardContent>
            </Card>
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos (Mes)</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$0</div>
                <p className="text-xs text-muted-foreground">Sin cambios</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Rendimiento de Ingresos Mensuales</CardTitle>
                 <CardDescription>Resumen de los últimos 6 meses.</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                 <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                  <BarChart accessibilityLayer data={chartData}>
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      tickFormatter={(value) => value.slice(0, 3)}
                    />
                    <YAxis
                       tickLine={false}
                       axisLine={false}
                       tickFormatter={(value) => `$${value / 1000}k`}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent />}
                    />
                    <Bar dataKey="revenue" fill="var(--color-revenue)" radius={8} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No hay actividad reciente</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
