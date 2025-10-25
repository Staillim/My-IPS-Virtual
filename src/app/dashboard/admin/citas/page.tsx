'use client';

import { useState } from 'react';
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
  CalendarPlus,
  Calendar as CalendarIcon,
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
    case 'finalizada':
      return 'outline';
    case 'cancelada':
      return 'destructive';
    default:
      return 'outline';
  }
};

export default function AdminCitasPage() {
  const [date, setDate] = useState<Date | undefined>();
  const [open, setOpen] = useState(false);

  const firestore = useFirestore();
  const { toast } = useToast();

  // Fetch all appointments
  const appointmentsCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, 'appointments') : null, [firestore]);
  const { data: appointments, isLoading: isLoadingAppointments } = useCollection(appointmentsCollectionRef);

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

  // Helper function to parse date string as local date
  const parseLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const handleAcceptAppointment = (appointmentId: string) => {
      if (firestore) {
          const appointmentDocRef = doc(firestore, 'appointments', appointmentId);
          updateDocumentNonBlocking(appointmentDocRef, { status: 'accepted' });

          toast({
              title: "Cita Aceptada",
              description: `La cita con ID ${appointmentId} ha sido aceptada exitosamente.`,
          });
      }
  };

  const handleCancelAppointment = (appointmentId: string) => {
      if (firestore) {
          const appointmentDocRef = doc(firestore, 'appointments', appointmentId);
          updateDocumentNonBlocking(appointmentDocRef, { status: 'cancelada' });

          toast({
              title: "Cita Cancelada",
              description: `La cita con ID ${appointmentId} ha sido cancelada exitosamente.`,
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
                  <CalendarPlus className="mr-2 h-4 w-4" />
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
                {appointments?.map((appointment: any) => (
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
                          <DropdownMenuItem><FileText className="mr-2 h-4 w-4" />Ver Detalles</DropdownMenuItem>
                          <DropdownMenuItem><CalendarPlus className="mr-2 h-4 w-4" />Reprogramar</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive"><XCircle className="mr-2 h-4 w-4" />Cancelar Cita</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
           { !isLoadingAppointments && appointments?.length === 0 && (
                <CardFooter className="py-8 justify-center">
                    <p className="text-muted-foreground">No hay citas registradas en el sistema.</p>
                </CardFooter>
            )}
        </Card>

        <div className="grid gap-4">
          {appointments?.map((appointment) => (
            <div key={appointment.id} className="flex justify-between items-center p-4 border rounded">
              <div>
                <p><strong>Paciente:</strong> {appointment.patientName}</p>
                <p><strong>Médico:</strong> {appointment.doctorName}</p>
                <p><strong>Fecha:</strong> {appointment.date}</p>
                <p><strong>Estado:</strong> {appointment.status}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleAcceptAppointment(appointment.id)} disabled={appointment.status === 'confirmada'}>
                  {appointment.status === 'confirmada' ? 'Aceptada' : 'Aceptar Cita'}
                </Button>
                <Button variant="destructive" onClick={() => handleCancelAppointment(appointment.id)}>
                  Cancelar Cita
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
