'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
  DropdownMenuLabel,
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
  PlusCircle,
  XCircle,
  FileText,
  Calendar as CalendarIcon,
  AlertTriangle,
  Check,
  CalendarClock,
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
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'confirmada':
      return 'default';
    case 'en curso':
      return 'secondary';
    case 'completada':
      return 'outline';
    case 'expirada':
      return 'secondary';
    case 'cancelada':
      return 'destructive';
    default:
      return 'outline';
  }
};

export default function AdminCitasPage() {
  const [date, setDate] = useState<Date | undefined>();
  const [open, setOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [appointmentToCancel, setAppointmentToCancel] = useState<any>(null);
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<any>(null);
  const [newDate, setNewDate] = useState<Date | undefined>();
  const [newTime, setNewTime] = useState<string>('');

  const firestore = useFirestore();
  const { toast } = useToast();

  // Fetch all appointments
  const appointmentsCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, 'appointments') : null, [firestore]);
  const { data: appointments, isLoading: isLoadingAppointments } = useCollection(appointmentsCollectionRef);

  // Ordenar citas: pendientes primero, luego por fecha
  const sortedAppointments = appointments?.slice().sort((a, b) => {
    // Orden de prioridad de estados
    const statusPriority: { [key: string]: number } = {
      'pendiente': 1,
      'confirmada': 2,
      'en curso': 3,
      'completada': 4,
      'expirada': 5,
      'cancelada': 6,
    };

    const priorityA = statusPriority[a.status || 'pendiente'] || 999;
    const priorityB = statusPriority[b.status || 'pendiente'] || 999;

    // Si tienen diferente prioridad, ordenar por prioridad
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // Si tienen la misma prioridad, ordenar por fecha (más reciente primero)
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Fetch doctors (users with a role other than PACIENTE or ADMIN)
  const doctorsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), where('role', 'not-in', ['PACIENTE', 'ADMIN'])) : null, [firestore]);
  const { data: doctors, isLoading: isLoadingDoctors } = useCollection(doctorsQuery);
  
  // Fetch patients
  const patientsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), where('role', '==', 'PACIENTE')) : null, [firestore]);
  const { data: patients, isLoading: isLoadingPatients } = useCollection(patientsQuery);

  // Fetch services
  const servicesCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, 'services') : null, [firestore]);
  const { data: services, isLoading: isLoadingServices } = useCollection(servicesCollectionRef);
  
  // State for the new appointment form
  const [newAppointment, setNewAppointment] = useState({
    patientId: '',
    doctorId: '',
    serviceId: '',
  });

  // Helper function to parse date string as local date
  const parseLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Efecto para finalizar citas vencidas automáticamente
  useEffect(() => {
    if (!firestore || !appointments) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Inicio del día actual

    appointments.forEach((appointment: any) => {
      // Solo procesar citas que no están completadas, canceladas o ya expiradas
      if (appointment.status === 'completada' || 
          appointment.status === 'cancelada' || 
          appointment.status === 'expirada') {
        return;
      }

      const appointmentDate = parseLocalDate(appointment.date);
      appointmentDate.setHours(0, 0, 0, 0);

      // Si la fecha de la cita es anterior a hoy, marcarla como expirada
      if (appointmentDate < today) {
        const appointmentDocRef = doc(firestore, 'appointments', appointment.id);
        
        updateDocumentNonBlocking(appointmentDocRef, {
          status: 'expirada',
          expiredAt: new Date(),
          expiredReason: 'Cita vencida - no se completó en la fecha programada',
        });

        console.log(`Cita ${appointment.id} marcada como expirada (fecha: ${appointment.date})`);
      }
    });
  }, [appointments, firestore]);

  const handleCreateAppointment = () => {
      const patient = patients?.find(p => p.id === newAppointment.patientId);
      const doctor = doctors?.find(d => d.id === newAppointment.doctorId);
      const service = services?.find(s => s.id === newAppointment.serviceId);

      if (!patient || !doctor || !service || !date) {
           toast({
                variant: "destructive",
                title: "Error",
                description: "Por favor, completa todos los campos del formulario.",
            });
            return;
      }

      const appointmentData = {
          patientId: patient.id,
          patientName: patient.displayName,
          doctorId: doctor.id,
          doctorName: doctor.displayName,
          serviceId: service.id,
          serviceName: service.name,
          date: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`,
          time: '09:00', // Example time, should be selectable
          status: 'confirmada',
          price: service.price,
          consultationType: 'presencial' // Example type
      };

      if (firestore) {
        const appointmentsCol = collection(firestore, 'appointments');
        addDocumentNonBlocking(appointmentsCol, appointmentData);
      }
      

      toast({
          title: "Cita Creada",
          description: `La cita para ${patient.displayName} ha sido creada exitosamente.`,
      });

      setOpen(false);
      setNewAppointment({ patientId: '', doctorId: '', serviceId: '' });
  }

  const handleCancelAppointment = async () => {
      if (!firestore || !appointmentToCancel) return;

      try {
          const appointmentDocRef = doc(firestore, 'appointments', appointmentToCancel.id);
          
          // Actualizar la cita con estado cancelada, motivo y registro de auditoría
          await updateDocumentNonBlocking(appointmentDocRef, { 
              status: 'cancelada',
              cancellationReason: cancelReason,
              cancelledBy: 'admin',
              cancelledAt: new Date(),
          });

          // Crear notificación para el paciente
          const notificationsCol = collection(firestore, 'notifications');
          await addDocumentNonBlocking(notificationsCol, {
              userId: appointmentToCancel.patientId,
              type: 'appointment_cancelled',
              title: 'Cita Cancelada',
              message: `Tu cita del ${format(parseLocalDate(appointmentToCancel.date), "d 'de' MMMM", { locale: es })} a las ${appointmentToCancel.time} ha sido cancelada por la administración.${cancelReason ? ` Motivo: ${cancelReason}` : ''}`,
              relatedId: appointmentToCancel.id,
              read: false,
              createdAt: new Date(),
          });

          // Crear notificación para el médico
          await addDocumentNonBlocking(notificationsCol, {
              userId: appointmentToCancel.doctorId,
              type: 'appointment_cancelled',
              title: 'Cita Cancelada',
              message: `La cita con ${appointmentToCancel.patientName} del ${format(parseLocalDate(appointmentToCancel.date), "d 'de' MMMM", { locale: es })} a las ${appointmentToCancel.time} ha sido cancelada por la administración.${cancelReason ? ` Motivo: ${cancelReason}` : ''}`,
              relatedId: appointmentToCancel.id,
              read: false,
              createdAt: new Date(),
          });

          toast({
              title: "Cita Cancelada",
              description: `La cita ha sido cancelada exitosamente. Se ha notificado al paciente y al médico.`,
          });

          setCancelDialogOpen(false);
          setAppointmentToCancel(null);
          setCancelReason('');
          setDetailsDialogOpen(false);
      } catch (error) {
          console.error('Error cancelling appointment:', error);
          toast({
              variant: "destructive",
              title: "Error",
              description: "No se pudo cancelar la cita. Intenta nuevamente.",
          });
      }
  };

  const handleOpenCancelDialog = (appointment: any) => {
      setAppointmentToCancel(appointment);
      setCancelDialogOpen(true);
  };

  const handleViewDetails = (appointment: any) => {
    setSelectedAppointment(appointment);
    setDetailsDialogOpen(true);
  };

  const handleAcceptAppointment = async (appointment: any) => {
    if (!firestore) return;

    try {
      const appointmentDocRef = doc(firestore, 'appointments', appointment.id);
      
      // Actualizar el estado de la cita a confirmada
      await updateDocumentNonBlocking(appointmentDocRef, { 
        status: 'confirmada',
        confirmedBy: 'admin',
        confirmedAt: new Date(),
      });

      // Crear notificación para el paciente
      const notificationsCol = collection(firestore, 'notifications');
      await addDocumentNonBlocking(notificationsCol, {
        userId: appointment.patientId,
        type: 'appointment_confirmed',
        title: 'Cita Confirmada',
        message: `Tu cita del ${format(parseLocalDate(appointment.date), "d 'de' MMMM", { locale: es })} a las ${appointment.time} con ${appointment.doctorName} ha sido confirmada.`,
        relatedId: appointment.id,
        read: false,
        createdAt: new Date(),
      });

      // Crear notificación para el médico
      await addDocumentNonBlocking(notificationsCol, {
        userId: appointment.doctorId,
        type: 'appointment_confirmed',
        title: 'Cita Confirmada',
        message: `La cita con ${appointment.patientName} del ${format(parseLocalDate(appointment.date), "d 'de' MMMM", { locale: es })} a las ${appointment.time} ha sido confirmada.`,
        relatedId: appointment.id,
        read: false,
        createdAt: new Date(),
      });

      toast({
        title: "Cita Confirmada",
        description: `La cita ha sido confirmada exitosamente. Se ha notificado al paciente y al médico.`,
      });
    } catch (error) {
      console.error('Error accepting appointment:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo confirmar la cita. Intenta nuevamente.",
      });
    }
  };

  const handleOpenRescheduleDialog = (appointment: any) => {
    setAppointmentToReschedule(appointment);
    setNewDate(parseLocalDate(appointment.date));
    setNewTime(appointment.time);
    setRescheduleDialogOpen(true);
  };

  const handleRescheduleAppointment = async () => {
    if (!firestore || !appointmentToReschedule || !newDate || !newTime) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor, selecciona una nueva fecha y hora.",
      });
      return;
    }

    try {
      const appointmentDocRef = doc(firestore, 'appointments', appointmentToReschedule.id);
      
      const oldDate = format(parseLocalDate(appointmentToReschedule.date), "d 'de' MMMM", { locale: es });
      const oldTime = appointmentToReschedule.time;
      
      const formattedNewDate = `${newDate.getFullYear()}-${(newDate.getMonth() + 1).toString().padStart(2, '0')}-${newDate.getDate().toString().padStart(2, '0')}`;
      const newDateFormatted = format(newDate, "d 'de' MMMM", { locale: es });

      // Actualizar la cita con nueva fecha y hora
      await updateDocumentNonBlocking(appointmentDocRef, { 
        date: formattedNewDate,
        time: newTime,
        rescheduledBy: 'admin',
        rescheduledAt: new Date(),
        previousDate: appointmentToReschedule.date,
        previousTime: appointmentToReschedule.time,
      });

      // Crear notificación para el paciente
      const notificationsCol = collection(firestore, 'notifications');
      console.log('Creando notificación para paciente:', appointmentToReschedule.patientId);
      await addDocumentNonBlocking(notificationsCol, {
        userId: appointmentToReschedule.patientId,
        type: 'appointment_rescheduled',
        title: 'Cita Reprogramada',
        message: `Tu cita ha sido reprogramada. Fecha anterior: ${oldDate} a las ${oldTime}. Nueva fecha: ${newDateFormatted} a las ${newTime}.`,
        relatedId: appointmentToReschedule.id,
        read: false,
        createdAt: new Date(),
      });

      // Crear notificación para el médico
      console.log('Creando notificación para médico:', appointmentToReschedule.doctorId);
      await addDocumentNonBlocking(notificationsCol, {
        userId: appointmentToReschedule.doctorId,
        type: 'appointment_rescheduled',
        title: 'Cita Reprogramada',
        message: `La cita con ${appointmentToReschedule.patientName} ha sido reprogramada. Fecha anterior: ${oldDate} a las ${oldTime}. Nueva fecha: ${newDateFormatted} a las ${newTime}.`,
        relatedId: appointmentToReschedule.id,
        read: false,
        createdAt: new Date(),
      });

      console.log('Notificaciones creadas exitosamente');

      toast({
        title: "Cita Reprogramada",
        description: `La cita ha sido reprogramada exitosamente. Se ha notificado al paciente y al médico.`,
      });

      setRescheduleDialogOpen(false);
      setAppointmentToReschedule(null);
      setNewDate(undefined);
      setNewTime('');
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo reprogramar la cita. Intenta nuevamente.",
      });
    }
  };

  return (
    <>
      <Header />
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold font-headline">Gestión de Citas</h1>
            <p className="text-muted-foreground">
              Supervisa, crea y administra todas las citas del sistema.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Crear Cita Manual
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Registrar Nueva Cita</DialogTitle>
                <DialogDescription>
                  Completa los datos para agendar una nueva cita.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="patient-select">Paciente</Label>
                     <Select onValueChange={(value) => setNewAppointment(prev => ({...prev, patientId: value}))} disabled={isLoadingPatients}>
                        <SelectTrigger id="patient-select">
                            <SelectValue placeholder="Seleccionar paciente" />
                        </SelectTrigger>
                        <SelectContent>
                            {patients?.map(p => <SelectItem key={p.id} value={p.id}>{p.displayName}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="doctor-select">Médico</Label>
                     <Select onValueChange={(value) => setNewAppointment(prev => ({...prev, doctorId: value}))} disabled={isLoadingDoctors}>
                        <SelectTrigger id="doctor-select">
                            <SelectValue placeholder="Seleccionar médico" />
                        </SelectTrigger>
                        <SelectContent>
                            {doctors?.map(d => <SelectItem key={d.id} value={d.id}>{d.displayName}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="service-select">Servicio</Label>
                    <Select onValueChange={(value) => setNewAppointment(prev => ({...prev, serviceId: value}))} disabled={isLoadingServices}>
                        <SelectTrigger id="service-select">
                            <SelectValue placeholder="Seleccionar servicio" />
                        </SelectTrigger>
                        <SelectContent>
                            {services?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label>Fecha</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground')}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, 'PPP', { locale: es }) : <span>Seleccionar fecha</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={setDate} initialFocus locale={es} /></PopoverContent>
                    </Popover>
                 </div>
              </div>
               <DialogFooter>
                <DialogClose asChild>
                   <Button type="button" variant="secondary">Cancelar</Button>
                </DialogClose>
                <Button type="submit" onClick={handleCreateAppointment}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Crear Cita
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filtros de Búsqueda</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Input placeholder="Buscar por paciente..." className="lg:col-span-2" />
            <Select disabled={isLoadingDoctors}>
              <SelectTrigger><SelectValue placeholder="Filtrar por médico" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los médicos</SelectItem>
                {doctors?.map(d => <SelectItem key={d.id} value={d.id}>{d.displayName}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger><SelectValue placeholder="Filtrar por estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="confirmada">Confirmada</SelectItem>
              </SelectContent>
            </Select>
             <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={cn('justify-start text-left font-normal', !date && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP', { locale: es }) : <span>Filtrar por fecha</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={setDate} initialFocus locale={es} /></PopoverContent>
            </Popover>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Médico</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Fecha y Hora</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingAppointments && [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                ))}
                {sortedAppointments?.map((appointment: any) => (
                  <TableRow key={appointment.id}>
                    <TableCell className="font-medium">{appointment.patientName}</TableCell>
                    <TableCell>{appointment.doctorName}</TableCell>
                    <TableCell>{appointment.serviceName}</TableCell>
                    <TableCell>{format(parseLocalDate(appointment.date), 'PPP', { locale: es })} {appointment.time}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(appointment.status || 'pendiente')}>
                        {appointment.status ? (appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)) : 'Pendiente'}
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
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewDetails(appointment)}>
                            <FileText className="mr-2 h-4 w-4" />Ver Detalles
                          </DropdownMenuItem>
                          {appointment.status === 'pendiente' && (
                            <>
                              <DropdownMenuItem onClick={() => handleAcceptAppointment(appointment)}>
                                <Check className="mr-2 h-4 w-4" />Aceptar Cita
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenRescheduleDialog(appointment)}>
                                <CalendarClock className="mr-2 h-4 w-4" />Reprogramar
                              </DropdownMenuItem>
                            </>
                          )}
                          {appointment.status !== 'cancelada' && appointment.status !== 'completada' && appointment.status !== 'expirada' && (
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleOpenCancelDialog(appointment)}
                            >
                              <XCircle className="mr-2 h-4 w-4" />Cancelar Cita
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
           { !isLoadingAppointments && sortedAppointments?.length === 0 && (
                <CardFooter className="py-8 justify-center">
                    <p className="text-muted-foreground">No hay citas registradas en el sistema.</p>
                </CardFooter>
            )}
        </Card>

        {/* Dialog para ver detalles de la cita */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalles de la Cita</DialogTitle>
              <DialogDescription>
                Información completa sobre la cita médica
              </DialogDescription>
            </DialogHeader>

            {selectedAppointment && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Paciente</p>
                    <p className="font-medium">{selectedAppointment.patientName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Médico</p>
                    <p className="font-medium">{selectedAppointment.doctorName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Servicio</p>
                    <p className="font-medium">{selectedAppointment.serviceName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Fecha</p>
                    <p className="font-medium">
                      {format(parseLocalDate(selectedAppointment.date), 'PPP', { locale: es })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Hora</p>
                    <p className="font-medium">{selectedAppointment.time}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Estado</p>
                    <Badge variant={getStatusVariant(selectedAppointment.status)}>
                      {selectedAppointment.status?.charAt(0).toUpperCase() + selectedAppointment.status?.slice(1)}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Tipo de Consulta</p>
                    <p className="font-medium">{selectedAppointment.consultationType || 'Presencial'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Precio</p>
                    <p className="font-medium">${new Intl.NumberFormat('es-CO').format(selectedAppointment.price || 0)}</p>
                  </div>
                </div>

                {selectedAppointment.reason && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Motivo de Consulta</p>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm">{selectedAppointment.reason}</p>
                    </div>
                  </div>
                )}

                {selectedAppointment.diagnosis && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Diagnóstico</p>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{selectedAppointment.diagnosis.description}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
                Cerrar
              </Button>
              {selectedAppointment?.status !== 'cancelada' && selectedAppointment?.status !== 'completada' && selectedAppointment?.status !== 'expirada' && (
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    handleOpenCancelDialog(selectedAppointment);
                    setDetailsDialogOpen(false);
                  }}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancelar Cita
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* AlertDialog para confirmar cancelación de cita */}
        <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                ¿Cancelar esta cita?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción cancelará la cita y notificará tanto al paciente como al médico.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {appointmentToCancel && (
              <div className="space-y-4 py-4">
                <div className="rounded-lg bg-muted p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-semibold">Paciente:</span>
                      <p>{appointmentToCancel.patientName}</p>
                    </div>
                    <div>
                      <span className="font-semibold">Médico:</span>
                      <p>{appointmentToCancel.doctorName}</p>
                    </div>
                    <div>
                      <span className="font-semibold">Servicio:</span>
                      <p>{appointmentToCancel.serviceName}</p>
                    </div>
                    <div>
                      <span className="font-semibold">Fecha:</span>
                      <p>{format(parseLocalDate(appointmentToCancel.date), 'PPP', { locale: es })} - {appointmentToCancel.time}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cancel-reason">
                    Motivo de cancelación (opcional)
                  </Label>
                  <Textarea
                    id="cancel-reason"
                    placeholder="Ej: El médico no está disponible, cambio de horario, solicitud del paciente..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Este motivo se incluirá en la notificación enviada al paciente y al médico.
                  </p>
                </div>
              </div>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setCancelReason('');
                setAppointmentToCancel(null);
              }}>
                No, mantener cita
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelAppointment}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Sí, cancelar cita
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog para reprogramar cita */}
        <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Reprogramar Cita</DialogTitle>
              <DialogDescription>
                Selecciona una nueva fecha y hora para la cita.
              </DialogDescription>
            </DialogHeader>

            {appointmentToReschedule && (
              <div className="space-y-4 py-4">
                <div className="rounded-lg bg-muted p-4 space-y-2">
                  <p className="font-semibold text-sm">Información de la Cita</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Paciente:</span>
                      <p className="font-medium">{appointmentToReschedule.patientName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Médico:</span>
                      <p className="font-medium">{appointmentToReschedule.doctorName}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Servicio:</span>
                      <p className="font-medium">{appointmentToReschedule.serviceName}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Fecha actual:</span>
                      <p className="font-medium">
                        {format(parseLocalDate(appointmentToReschedule.date), 'PPP', { locale: es })} - {appointmentToReschedule.time}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nueva Fecha</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className={cn('w-full justify-start text-left font-normal', !newDate && 'text-muted-foreground')}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newDate ? format(newDate, 'PPP', { locale: es }) : <span>Seleccionar nueva fecha</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar 
                          mode="single" 
                          selected={newDate} 
                          onSelect={setNewDate} 
                          initialFocus 
                          locale={es}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-time">Nueva Hora</Label>
                    <Select value={newTime} onValueChange={setNewTime}>
                      <SelectTrigger id="new-time">
                        <SelectValue placeholder="Seleccionar hora" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="08:00">08:00</SelectItem>
                        <SelectItem value="09:00">09:00</SelectItem>
                        <SelectItem value="10:00">10:00</SelectItem>
                        <SelectItem value="11:00">11:00</SelectItem>
                        <SelectItem value="14:00">14:00</SelectItem>
                        <SelectItem value="15:00">15:00</SelectItem>
                        <SelectItem value="16:00">16:00</SelectItem>
                        <SelectItem value="17:00">17:00</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={() => {
                    setAppointmentToReschedule(null);
                    setNewDate(undefined);
                    setNewTime('');
                  }}
                >
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" onClick={handleRescheduleAppointment}>
                <CalendarClock className="mr-2 h-4 w-4" />
                Reprogramar Cita
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
