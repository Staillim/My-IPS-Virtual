"use client";

import { useMemo } from 'react';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { computeShiftStatus } from '@/lib/shifts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

function formatDisplayDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return format(d, 'dd/MM/yyyy', { locale: es });
}

function formatHour(hhmm: string) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'p.m.' : 'a.m.';
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${period}`;
}

function computeDurationHours(shift: any) {
  if (shift.durationHours) return shift.durationHours;
  const [sh, sm] = (shift.startTime || '00:00').split(':').map(Number);
  const [eh, em] = (shift.endTime || '00:00').split(':').map(Number);
  let start = sh * 60 + sm;
  let end = eh * 60 + em;
  if (end < start) end += 24 * 60; // spans midnight
  return ((end - start) / 60);
}

export default function PersonalTurnosPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  // Query sin orderBy para evitar necesidad de índice compuesto
  const shiftsQuery = useMemoFirebase(
    () => (firestore && user) ? query(
      collection(firestore, 'shifts'),
      where('doctorId', '==', user.uid)
    ) : null,
    [firestore, user]
  );

  const { data: shifts, isLoading } = useCollection(shiftsQuery);

  // Ordenar en el cliente para evitar índice compuesto
  const sortedShifts = useMemo(() => {
    if (!shifts) return [];
    return [...shifts].sort((a: any, b: any) => {
      const dateA = a.startDate || a.date || '';
      const dateB = b.startDate || b.date || '';
      return dateB.localeCompare(dateA); // desc
    });
  }, [shifts]);

  const enriched = useMemo(() => (sortedShifts || []).map((s: any) => ({
    ...s,
    status: computeShiftStatus({
      doctorId: s.doctorId,
      doctorName: s.doctorName,
      startDate: s.startDate || s.date,
      endDate: s.endDate || s.startDate || s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      type: s.type,
      durationHours: s.durationHours || computeDurationHours(s),
      nocturno: !!s.nocturno,
      recargoPercent: s.recargoPercent || 0,
      spansMidnight: !!s.spansMidnight || (s.endTime < s.startTime),
      status: s.status,
    } as any),
    duration: computeDurationHours(s),
  })), [sortedShifts]);

  const active = useMemo(() => enriched.find(e => e.status === 'activo'), [enriched]);
  const next = useMemo(() => enriched.filter(e => e.status === 'próximo').sort((a, b) => (a.startDate || a.date).localeCompare(b.startDate || b.date))[0], [enriched]);

  const now = new Date();
  const thisMonthKey = format(now, 'yyyy-MM');
  const monthHours = useMemo(() => enriched
    .filter(e => (e.startDate || e.date || '').startsWith(thisMonthKey))
    .reduce((acc, e) => acc + (e.duration || 0), 0), [enriched, thisMonthKey]);

  const monthNightHours = useMemo(() => enriched
    .filter(e => (e.startDate || e.date || '').startsWith(thisMonthKey) && e.nocturno)
    .reduce((acc, e) => acc + (e.duration || 0), 0), [enriched, thisMonthKey]);

  return (
    <>
      <Header />
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-headline">Mis Turnos</h1>
          <p className="text-muted-foreground">Consulta tu turno activo, próximos turnos y tu historial.</p>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Turno activo</CardTitle>
              <CardDescription>{active ? `${formatDisplayDate(active.startDate || active.date)} • ${formatHour(active.startTime)} - ${formatHour(active.endTime)}` : 'No hay un turno activo'}</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Próximo turno</CardTitle>
              <CardDescription>{next ? `${formatDisplayDate(next.startDate || next.date)} • ${formatHour(next.startTime)} - ${formatHour(next.endTime)}` : 'Sin próximos turnos'}</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Horas este mes</CardTitle>
              <CardDescription>{monthHours} h totales • {monthNightHours} h nocturnas</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Tabla de turnos */}
        <Card>
          <CardHeader>
            <CardTitle>Historial</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Observaciones</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Duración (h)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(isUserLoading || isLoading) && (
                  <TableRow><TableCell colSpan={7} className="text-center py-6 text-sm text-muted-foreground">Cargando...</TableCell></TableRow>
                )}
                {!(isUserLoading || isLoading) && enriched.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-6 text-sm text-muted-foreground">No tienes turnos registrados.</TableCell></TableRow>
                )}
                {enriched.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell>{formatDisplayDate(s.startDate || s.date)}</TableCell>
                    <TableCell>{formatHour(s.startTime)}</TableCell>
                    <TableCell>{formatHour(s.endTime)}</TableCell>
                    <TableCell>{s.type}</TableCell>
                    <TableCell className="max-w-xs truncate" title={s.observations}>{s.observations || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={s.status === 'activo' ? 'default' : s.status === 'próximo' ? 'secondary' : 'outline'}>
                        {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{s.duration}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
