'use client';

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
import { Download, Calendar as CalendarIcon } from 'lucide-react';
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
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Pie, PieChart, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const monthlyAppointmentsData = [
  { month: 'Ene', atendidas: 0, canceladas: 0 },
  { month: 'Feb', atendidas: 0, canceladas: 0 },
  { month: 'Mar', atendidas: 0, canceladas: 0 },
  { month: 'Abr', atendidas: 0, canceladas: 0 },
  { month: 'May', atendidas: 0, canceladas: 0 },
  { month: 'Jun', atendidas: 0, canceladas: 0 },
];

const chartConfigAppointments = {
  atendidas: { label: 'Atendidas', color: 'hsl(var(--primary))' },
  canceladas: { label: 'Canceladas', color: 'hsl(var(--destructive))' },
};

const incomeByServiceData = [
    { name: 'Consulta General', value: 0, fill: 'var(--color-general)' },
    { name: 'Pediatría', value: 0, fill: 'var(--color-pediatria)' },
    { name: 'Psicología', value: 0, fill: 'var(--color-psicologia)' },
    { name: 'Certificados', value: 0, fill: 'var(--color-certificados)' },
];

const chartConfigIncome = {
    general: { label: 'C. General', color: 'hsl(var(--chart-1))' },
    pediatria: { label: 'Pediatría', color: 'hsl(var(--chart-2))' },
    psicologia: { label: 'Psicología', color: 'hsl(var(--chart-3))' },
    certificados: { label: 'Certificados', color: 'hsl(var(--chart-4))' },
};

const topDoctorsData: Array<{name: string; appointments: number; income: number}> = [];

export default function AdminEstadisticasPage() {
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
                <Select defaultValue="monthly">
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
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                </Button>
            </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
             <Card>
                <CardHeader className="pb-2">
                    <CardDescription>Citas Atendidas</CardDescription>
                    <CardTitle className="text-4xl">0</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-xs text-muted-foreground">Sin cambios</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardDescription>Ingresos Totales</CardDescription>
                    <CardTitle className="text-4xl">$0</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-xs text-muted-foreground">Sin cambios</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardDescription>Pacientes Nuevos</CardDescription>
                    <CardTitle className="text-4xl">0</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-xs text-muted-foreground">Sin cambios</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardDescription>Tasa de Cancelación</CardDescription>
                    <CardTitle className="text-4xl">0%</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-xs text-muted-foreground">Sin cambios</div>
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Rendimiento de Citas Mensuales</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                 <ChartContainer config={chartConfigAppointments} className="min-h-[250px] w-full">
                   <BarChart data={monthlyAppointmentsData}>
                    <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Bar dataKey="atendidas" fill="var(--color-atendidas)" radius={8} />
                    <Bar dataKey="canceladas" fill="var(--color-canceladas)" radius={8} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Ingresos por Servicio</CardTitle>
                    <CardDescription>Distribución de ingresos del último mes.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pb-0">
                    <ChartContainer config={chartConfigIncome} className="mx-auto aspect-square max-h-[250px]">
                        <PieChart>
                             <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                            <Pie data={incomeByServiceData} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>
                                {incomeByServiceData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ChartContainer>
                </CardContent>
                 <CardFooter className="flex-col gap-2 text-sm">
                    <div className="flex items-center gap-2 font-medium leading-none">
                        Mostrando ingresos totales del último mes.
                    </div>
                 </CardFooter>
            </Card>
        </div>

        <Card className="mt-6">
            <CardHeader>
                <CardTitle>Rendimiento por Médico</CardTitle>
                <CardDescription>Ranking de médicos por citas e ingresos generados este mes.</CardDescription>
            </CardHeader>
            <CardContent>
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
                                    No hay datos disponibles
                                </TableCell>
                            </TableRow>
                        ) : (
                            topDoctorsData.map((doctor, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={`/avatars/0${index+1}.png`} alt="Avatar" />
                                                <AvatarFallback>{doctor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                            </Avatar>
                                            <div className="font-medium">{doctor.name}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{doctor.appointments}</TableCell>
                                    <TableCell className="text-right">${new Intl.NumberFormat('es-CO').format(doctor.income)}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </>
  );
}
