
'use client';

import { useState, useMemo } from 'react';
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
  Calendar as CalendarIcon,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  User,
  Trash2,
  CheckCircle,
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
import { format, addDays, startOfWeek, endOfWeek, isSameDay, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'activo':
      return 'bg-green-100 border-green-300 text-green-800';
    case 'próximo':
      return 'bg-blue-100 border-blue-300 text-blue-800';
    case 'finalizado':
      return 'bg-gray-100 border-gray-300 text-gray-600';
    default:
      return 'bg-gray-100 border-gray-300 text-gray-600';
  }
};

export default function AdminTurnosPage() {
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [date, setDate] = useState<Date | undefined>();
  const [open, setOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [newShift, setNewShift] = useState<{ doctorId: string; templateKey: '' | ShiftTemplateKey; observations: string;}>( { doctorId: '', templateKey: '', observations: ''});
  
  const firestore = useFirestore();
  const { toast } = useToast();

  const doctorsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), where('role', 'not-in', ['PACIENTE', 'ADMIN'])) : null, [firestore]);
  const { data: doctors, isLoading: isLoadingDoctors } = useCollection(doctorsQuery);
  
  const shiftsCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, 'shifts') : null, [firestore]);
  const { data: shifts, isLoading: isLoadingShifts } = useCollection(shiftsCollectionRef);

  // Calcular inicio y fin de la semana actual
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Lunes
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 }); // Domingo
  
  // Generar array de días de la semana
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStart, i));
    }
    return days;
  }, [weekStart]);

  const parseDateString = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const effectiveStatus = (shift: any) => {
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

  // Obtener turnos para un día específico
  const getShiftsForDay = (day: Date) => {
    if (!shifts) return [];
    return shifts.filter((shift: any) => {
      const shiftDate = parseDateString(shift.startDate || shift.date);
      return isSameDay(shiftDate, day);
    });
  };

  // Obtener iniciales del médico
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
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

  const handleViewShift = (shift: any) => {
    setSelectedShift(shift);
    setDetailsDialogOpen(true);
  };

  return (
    <>
      <Header />
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold font-headline">Calendario de Turnos</h1>
            <p className="text-muted-foreground">
              Vista semanal de los turnos asignados al personal médico
            </p>
          </div>
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

        {/* Navegación de semanas y meses */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentWeek(subMonths(currentWeek, 1))}
                  title="Mes anterior"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                  title="Semana anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-center flex-1">
                <h2 className="text-lg font-semibold">
                  {format(weekStart, "'Semana del' d", { locale: es })} - {format(weekEnd, "d 'de' MMMM, yyyy", { locale: es })}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentWeek(new Date())}
                  className="mt-1 text-xs"
                >
                  Hoy
                </Button>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                  title="Semana siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentWeek(addMonths(currentWeek, 1))}
                  title="Mes siguiente"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Calendario Semanal */}
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, index) => {
            const dayShifts = getShiftsForDay(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <Card 
                key={index} 
                className={cn(
                  "min-h-[300px]",
                  isToday && "ring-2 ring-primary"
                )}
              >
                <CardHeader className="p-3">
                  <CardTitle className="text-sm font-medium">
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-muted-foreground uppercase">
                        {format(day, 'EEEE', { locale: es })}
                      </span>
                      <span className={cn(
                        "text-2xl font-bold mt-1",
                        isToday && "text-primary"
                      )}>
                        {format(day, 'd')}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(day, 'MMM', { locale: es })}
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 space-y-2">
                  {isLoadingShifts ? (
                    <Skeleton className="h-20 w-full" />
                  ) : dayShifts.length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted-foreground">
                      Sin turnos
                    </div>
                  ) : (
                    dayShifts.map((shift: any) => {
                      const status = effectiveStatus(shift);
                      return (
                        <div
                          key={shift.id}
                          onClick={() => handleViewShift(shift)}
                          className={cn(
                            "p-2 rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-md",
                            getStatusColor(status)
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarFallback className="text-xs">
                                {getInitials(shift.doctorName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold truncate">
                                {shift.doctorName}
                              </p>
                              <div className="flex items-center gap-1 mt-1">
                                <Clock className="h-3 w-3" />
                                <span className="text-xs">
                                  {shift.startTime}
                                </span>
                              </div>
                              <p className="text-xs font-medium mt-1">
                                {shift.type}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Dialog de detalles del turno */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Detalles del Turno</DialogTitle>
            </DialogHeader>
            {selectedShift && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {getInitials(selectedShift.doctorName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{selectedShift.doctorName}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedShift.doctorSpecialty || selectedShift.doctorRole || 'Médico'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Fecha</p>
                    <p className="font-medium">
                      {format(parseDateString(selectedShift.startDate || selectedShift.date), 'PPP', { locale: es })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Tipo</p>
                    <p className="font-medium">{selectedShift.type}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Hora Inicio</p>
                    <p className="font-medium">{selectedShift.startTime}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Hora Fin</p>
                    <p className="font-medium">{selectedShift.endTime}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Estado</p>
                    <Badge variant={getStatusVariant(effectiveStatus(selectedShift))}>
                      {effectiveStatus(selectedShift).charAt(0).toUpperCase() + effectiveStatus(selectedShift).slice(1)}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Duración</p>
                    <p className="font-medium">{selectedShift.durationHours || 8}h</p>
                  </div>
                </div>

                {selectedShift.observations && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Observaciones</p>
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm">{selectedShift.observations}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  {effectiveStatus(selectedShift) === 'activo' && (
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        handleFinalizeShift(selectedShift);
                        setDetailsDialogOpen(false);
                      }}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Finalizar Turno
                    </Button>
                  )}
                  <Button 
                    variant="destructive" 
                    className="flex-1"
                    onClick={() => {
                      handleDeleteShift(selectedShift);
                      setDetailsDialogOpen(false);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </Button>
                </div>
              </div>
            )}
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">Cerrar</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
