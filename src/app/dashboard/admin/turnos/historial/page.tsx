"use client";

import { useMemo } from 'react';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { computeShiftStatus } from '@/lib/shifts';

function formatDisplayDate(shift: any) {
  const base = shift.startDate || shift.date;
  const d = new Date(base + 'T00:00:00');
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
  const [sh, sm] = shift.startTime.split(':').map(Number);
  const [eh, em] = shift.endTime.split(':').map(Number);
  let start = sh * 60 + sm;
  let end = eh * 60 + em;
  if (end < start) end += 24 * 60; // spans midnight
  return ((end - start) / 60);
}

export default function ShiftHistoryPage() {
  const firestore = useFirestore();
  const shiftsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'shifts'), orderBy('startDate', 'desc')) : null, [firestore]);
  const { data: shifts, isLoading } = useCollection(shiftsQuery);

  const enriched = useMemo(() => (shifts || []).map((s: any) => ({
    ...s,
    duration: computeDurationHours(s),
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
  })), [shifts]);

  return (
    <>
      <Header />
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-headline">Historial de Turnos</h1>
          <p className="text-muted-foreground">Listado histórico de turnos asignados al personal médico.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Turnos Registrados</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hora de inicio</TableHead>
                  <TableHead>Hora de fin</TableHead>
                  <TableHead>Duración (h)</TableHead>
                  <TableHead>Área / Servicio</TableHead>
                  <TableHead>Observaciones</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow><TableCell colSpan={9} className="text-center py-6 text-sm text-muted-foreground">Cargando turnos...</TableCell></TableRow>
                )}
                {!isLoading && enriched.length === 0 && (
                  <TableRow><TableCell colSpan={9} className="text-center py-6 text-sm text-muted-foreground">No hay turnos registrados.</TableCell></TableRow>
                )}
                {enriched.map((shift: any) => (
                  <TableRow key={shift.id}>
                    <TableCell>{shift.doctorName}</TableCell>
                    <TableCell>{shift.doctorSpecialty || shift.doctorRole || '—'}</TableCell>
                    <TableCell>{formatDisplayDate(shift)}</TableCell>
                    <TableCell>{formatHour(shift.startTime)}</TableCell>
                    <TableCell>{formatHour(shift.endTime)}</TableCell>
                    <TableCell>{shift.duration}</TableCell>
                    <TableCell>{shift.area || '—'}</TableCell>
                    <TableCell className="max-w-xs truncate" title={shift.observations}>{shift.observations || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={shift.status === 'activo' ? 'default' : shift.status === 'próximo' ? 'secondary' : 'outline'}>
                        {shift.status.charAt(0).toUpperCase() + shift.status.slice(1)}
                      </Badge>
                    </TableCell>
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
