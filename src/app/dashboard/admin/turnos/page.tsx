
'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  MoreHorizontal,
  Calendar as CalendarIcon,
  PlusCircle,
  Edit,
  Trash2
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';
import { SHIFT_TEMPLATES, ShiftTemplateKey, createShiftDocFromTemplate, computeShiftStatus } from '@/lib/shifts';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'activo':
      return 'default';
    case 'próximo':
      return 'secondary';
    case 'finalizado':
        return 'outline';
    default:
      return 'outline';
  }
};

export default function AdminTurnosPage() {
  const [date, setDate] = useState<Date | undefined>();
  const [filterDate, setFilterDate] = useState<Date | undefined>();
  const [open, setOpen] = useState(false);
  const [newShift, setNewShift] = useState<{ doctorId: string; templateKey: '' | ShiftTemplateKey; observations: string;}>( { doctorId: '', templateKey: '', observations: ''});
  
  const firestore = useFirestore();
  const { toast } = useToast();

  const doctorsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), where('role', 'not-in', ['PACIENTE', 'ADMIN'])) : null, [firestore]);
  const { data: doctors, isLoading: isLoadingDoctors } = useCollection(doctorsQuery);
  
  const shiftsCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, 'shifts') : null, [firestore]);
  const { data: shifts, isLoading: isLoadingShifts } = useCollection(shiftsCollectionRef);

  const parseDateString = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const effectiveStatus = (shift: any) => {
    // Backwards compatibility: older docs may have 'date' instead of startDate/endDate
    const startDate = shift.startDate || shift.date;
    const endDate = shift.endDate || shift.startDate || shift.date;
    const shiftDoc = {
      doctorId: shift.doctorId,
      doctorName: shift.doctorName,
      startDate,
      endDate,
      startTime: shift.startTime,
      endTime: shift.endTime,
      type: shift.type,
      durationHours: shift.durationHours || 0,
      nocturno: !!shift.nocturno,
      recargoPercent: shift.recargoPercent || 0,
      spansMidnight: !!shift.spansMidnight || (shift.endTime < shift.startTime),
      status: shift.status,
    } as any;
    return computeShiftStatus(shiftDoc);
  };

  const formatDisplayDate = (shift: any) => {
    const base = shift.startDate || shift.date;
    const d = new Date(base + 'T00:00:00');
    return format(d, 'dd/MM/yyyy', { locale: es });
  };

  const formatHour = (hhmm: string) => {
    if (!hhmm) return '';
    const [h, m] = hhmm.split(':').map(Number);
    const period = h >= 12 ? 'p.m.' : 'a.m.';
    const hour12 = ((h + 11) % 12) + 1;
    return `${hour12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${period}`;
  };

  const computeDurationHours = (shift: any) => {
    if (shift.durationHours) return shift.durationHours;
    const [sh, sm] = (shift.startTime || '00:00').split(':').map(Number);
    const [eh, em] = (shift.endTime || '00:00').split(':').map(Number);
    let start = sh * 60 + sm;
    let end = eh * 60 + em;
    if (end < start) end += 24 * 60; // spans midnight
    return ((end - start) / 60);
  };
  
  const handleAssignShift = () => {
    const doctor = doctors?.find(d => d.id === newShift.doctorId);
    if (!doctor || !newShift.templateKey || !date) {
      toast({ variant: 'destructive', title: 'Error', description: 'Completa médico, tipo y fecha.' });
      return;
    }
    const shiftDoc = createShiftDocFromTemplate(newShift.templateKey, doctor, date);
    if (firestore) {
      const shiftsCol = collection(firestore, 'shifts');
      addDocumentNonBlocking(shiftsCol, {
        ...shiftDoc,
        // legacy fields for backward compatibility
        date: shiftDoc.startDate, // keep original 'date'
        status: shiftDoc.status,
        durationHours: shiftDoc.durationHours,
        nocturno: shiftDoc.nocturno,
        recargoPercent: shiftDoc.recargoPercent,
        spansMidnight: shiftDoc.spansMidnight,
        observations: newShift.observations,
        doctorRole: doctor.role,
        doctorSpecialty: doctor.specialty,
      });
    }
    toast({ title: 'Turno asignado', description: `Se creó turno ${shiftDoc.type} para ${doctor.displayName}.` });
    setOpen(false);
    setNewShift({ doctorId: '', templateKey: '', observations: '' });
    setDate(undefined);
  };

  const handleFinalizeShift = (shift: any) => {
    if (!firestore) return;
    const ref = doc(firestore, 'shifts', shift.id);
    updateDocumentNonBlocking(ref, { status: 'finalizado' });
    toast({ title: 'Turno finalizado', description: `Turno de ${shift.doctorName} marcado como finalizado.` });
  };

  const handleDeleteShift = (shift: any) => {
    if (!firestore) return;
    const ref = doc(firestore, 'shifts', shift.id);
    deleteDocumentNonBlocking(ref);
    toast({ title: 'Turno eliminado', description: `Turno de ${shift.doctorName} eliminado.` });
  };

  return (
    <>
      <Header />
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold font-headline">Gestión de Turnos</h1>
            <p className="text-muted-foreground">
              Asigna y administra los turnos del personal médico.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <a href="/dashboard/admin/turnos/historial">Ver Historial</a>
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Asignar Nuevo Turno
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Asignar Turno</DialogTitle>
                <DialogDescription>
                  Completa los datos para asignar un nuevo turno a un médico.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="doctor-select">Médico</Label>
                     <Select onValueChange={value => setNewShift(p => ({ ...p, doctorId: value}))} disabled={isLoadingDoctors}>
                        <SelectTrigger id="doctor-select">
                            <SelectValue placeholder="Seleccionar médico" />
                        </SelectTrigger>
                        <SelectContent>
                            {doctors?.map(doc => (
                                <SelectItem key={doc.id} value={doc.id}>{doc.displayName}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="shift-type">Tipo de Turno</Label>
                      <Select onValueChange={(value: ShiftTemplateKey) => setNewShift(p => ({ ...p, templateKey: value }))}>
                        <SelectTrigger id="shift-type">
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(SHIFT_TEMPLATES).map(t => (
                            <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                </div>
                  <div className="space-y-2">
                    <Label htmlFor="observaciones">Observaciones (opcional)</Label>
                    <Input id="observaciones" placeholder="Notas adicionales sobre el turno (opcional)" value={newShift.observations} onChange={e => setNewShift(p => ({ ...p, observations: e.target.value }))} />
                  </div>
                 <div className="space-y-2">
                    <Label>Fecha del Turno</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={'outline'}
                          className={cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground')}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, 'PPP', { locale: es }) : <span>Seleccionar fecha</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={setDate} initialFocus locale={es} /></PopoverContent>
                    </Popover>
                 </div>
                {newShift.templateKey && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Hora Inicio</Label>
                      <Input disabled value={SHIFT_TEMPLATES[newShift.templateKey].startTime} />
                    </div>
                    <div className="space-y-2">
                      <Label>Hora Fin</Label>
                      <Input disabled value={SHIFT_TEMPLATES[newShift.templateKey].endTime} />
                    </div>
                  </div>
                )}
              </div>
               <DialogFooter>
                <DialogClose asChild>
                   <Button type="button" variant="secondary">Cancelar</Button>
                </DialogClose>
                <Button type="submit" onClick={handleAssignShift}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Asignar Turno
                </Button>
              </DialogFooter>
            </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="gestionar" className="space-y-6">
          <TabsList>
            <TabsTrigger value="gestionar">Gestionar</TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="gestionar" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select disabled={isLoadingDoctors}>
              <SelectTrigger><SelectValue placeholder="Filtrar por médico" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los médicos</SelectItem>
                 {doctors?.map(doc => (
                    <SelectItem key={doc.id} value={doc.id}>{doc.displayName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
             <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={cn('w-full justify-start text-left font-normal', !filterDate && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filterDate ? format(filterDate, 'PPP', { locale: es }) : <span>Filtrar por fecha</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={filterDate} onSelect={setFilterDate} initialFocus locale={es} /></PopoverContent>
            </Popover>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Médico</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Horario</TableHead>
                  <TableHead>Tipo de Turno</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingShifts && [...Array(4)].map((_, i) => (
                     <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                ))}
                {shifts?.map((shift: any) => (
                  <TableRow key={shift.id}>
                    <TableCell className="font-medium">{shift.doctorName}</TableCell>
                    <TableCell>{format(parseDateString(shift.startDate || shift.date), 'PPP', { locale: es })}</TableCell>
                    <TableCell>{shift.startTime} - {shift.endTime}</TableCell>
                    <TableCell>{shift.type}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(effectiveStatus(shift))}>
                        {effectiveStatus(shift).charAt(0).toUpperCase() + effectiveStatus(shift).slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleFinalizeShift(shift)} disabled={effectiveStatus(shift) !== 'activo'}>
                            <Edit className="mr-2 h-4 w-4" />Finalizar Turno
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteShift(shift)} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />Eliminar Turno
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
           <CardFooter className="py-4 text-sm text-muted-foreground">
             Mostrando {shifts?.length ?? 0} de {shifts?.length ?? 0} turnos.
          </CardFooter>
        </Card>
          </TabsContent>

          <TabsContent value="historial">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Turnos</CardTitle>
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
                      <TableHead>Observaciones</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingShifts && (
                      <TableRow><TableCell colSpan={8} className="text-center py-6 text-sm text-muted-foreground">Cargando turnos...</TableCell></TableRow>
                    )}
                    {!isLoadingShifts && (shifts?.length ?? 0) === 0 && (
                      <TableRow><TableCell colSpan={8} className="text-center py-6 text-sm text-muted-foreground">No hay turnos registrados.</TableCell></TableRow>
                    )}
                    {[...(shifts || [])]
                      .sort((a: any, b: any) => {
                        const ad = (a.startDate || a.date) ?? '';
                        const bd = (b.startDate || b.date) ?? '';
                        return bd.localeCompare(ad);
                      })
                      .map((shift: any) => {
                        const status = effectiveStatus(shift);
                        const dur = computeDurationHours(shift);
                        return (
                          <TableRow key={shift.id}>
                            <TableCell>{shift.doctorName}</TableCell>
                            <TableCell>{shift.doctorSpecialty || shift.doctorRole || '—'}</TableCell>
                            <TableCell>{formatDisplayDate(shift)}</TableCell>
                            <TableCell>{formatHour(shift.startTime)}</TableCell>
                            <TableCell>{formatHour(shift.endTime)}</TableCell>
                            <TableCell>{dur}</TableCell>
                            <TableCell className="max-w-xs truncate" title={shift.observations}>{shift.observations || '—'}</TableCell>
                            <TableCell>
                              <Badge variant={status === 'activo' ? 'default' : status === 'próximo' ? 'secondary' : 'outline'}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
