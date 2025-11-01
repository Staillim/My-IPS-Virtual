'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Video,
  Clock,
  User,
  Stethoscope,
  MoreVertical,
  FileText,
  Calendar as CalendarIcon,
  Pill,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Header } from '@/components/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function CitasPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [consultationType, setConsultationType] = useState<string | null>(null);
  const [appointmentReason, setAppointmentReason] = useState<string>('');
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [rescheduleResponseDialogOpen, setRescheduleResponseDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  // Fetch Services
  const servicesCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, 'services') : null, [firestore]);
  const { data: allServices, isLoading: isLoadingServices } = useCollection(servicesCollectionRef);

  // Filter only active services for patients
  const services = allServices?.filter(service => service.status === 'activo' || !service.status);

  // Fetch Doctors
  const doctorsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), where('role', 'not-in', ['PACIENTE', 'ADMIN'])) : null, [firestore]);
  const { data: doctors, isLoading: isLoadingDoctors } = useCollection(doctorsQuery);

  // Fetch User's Appointments
  const appointmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'appointments'), where('patientId', '==', user.uid));
  }, [firestore, user]);
  const { data: appointments, isLoading: isLoadingAppointments } = useCollection(appointmentsQuery);

  // Fetch formula associated with selected appointment
  const formulaQuery = useMemoFirebase(() => {
    if (!firestore || !selectedAppointment?.id) return null;
    return query(
      collection(firestore, 'formulas'),
      where('appointmentId', '==', selectedAppointment.id)
    );
  }, [firestore, selectedAppointment?.id]);
  const { data: formulas } = useCollection(formulaQuery);
  const associatedFormula = formulas && formulas.length > 0 ? formulas[0] : null;

  // Filter doctors by selected service specialty
  const filteredDoctors = doctors?.filter(doctor => {
    if (!selectedService) return true; // Show all if no service selected
    
    // Handle both old format (single specialty string) and new format (array of specialties)
    const serviceSpecialties = selectedService.specialties || (selectedService.specialty ? [selectedService.specialty] : []);
    
    if (serviceSpecialties.length === 0) return true; // Show all if no specialties defined
    
    // Match doctor's specialty with any of the service's required specialties (case insensitive)
    return serviceSpecialties.some((specialty: string) => 
      doctor.specialty?.toLowerCase().trim() === specialty.toLowerCase().trim()
    );
  });

  // Reset doctor selection when service changes
  useEffect(() => {
    if (selectedService && selectedDoctor) {
      const isDoctorValid = filteredDoctors?.some(d => d.id === selectedDoctor.id);
      if (!isDoctorValid) {
        setSelectedDoctor(null);
      }
    }
  }, [selectedService, selectedDoctor, filteredDoctors]);

  // Helper function to parse date string as local date
  const parseLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingAppointments = appointments?.filter(a => {
    const appointmentDate = parseLocalDate(a.date);
    appointmentDate.setHours(0, 0, 0, 0);
    return appointmentDate >= today && a.status === 'confirmada';
  }) || [];
  
  const pastAppointments = appointments?.filter(a => {
    const appointmentDate = parseLocalDate(a.date);
    appointmentDate.setHours(0, 0, 0, 0);
    return appointmentDate < today || a.status !== 'confirmada';
  }) || [];

  const handleBookAppointment = () => {
    if (!user || !selectedService || !selectedDoctor || !date || !selectedTime || !consultationType) {
        toast({
            variant: "destructive",
            title: "Faltan datos",
            description: "Por favor completa todos los campos para agendar la cita.",
        });
        return;
    }

    const appointmentData = {
        patientId: user.uid,
        doctorId: selectedDoctor.id,
        serviceId: selectedService.id,
        date: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`,
        time: selectedTime,
        consultationType: consultationType,
        price: selectedService.price,
        status: 'pendiente',
        patientName: user.displayName,
        doctorName: selectedDoctor.displayName,
        serviceName: selectedService.name,
        ...(appointmentReason.trim() && { reason: appointmentReason.trim() }),
    };
    
    if (firestore) {
      const appointmentsCol = collection(firestore, 'appointments');
      addDocumentNonBlocking(appointmentsCol, appointmentData);
    }
    

    toast({
        title: "Cita Solicitada",
        description: "Tu solicitud de cita ha sido enviada. Recibirás una notificación cuando sea confirmada.",
    });

    // Reset form
    setSelectedService(null);
    setSelectedDoctor(null);
    setSelectedTime(null);
    setConsultationType(null);
    setAppointmentReason('');
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

  const handleViewDetails = (appointment: any) => {
    setSelectedAppointment(appointment);
    setDetailsDialogOpen(true);
  };

  const handleOpenRescheduleResponse = (appointment: any) => {
    setSelectedAppointment(appointment);
    setRescheduleResponseDialogOpen(true);
  };

  const handleAcceptReschedule = async () => {
    if (!firestore || !selectedAppointment?.id || !selectedAppointment.rescheduleRequest) return;

    try {
      const appointmentDocRef = doc(firestore, 'appointments', selectedAppointment.id);
      const { newDate, newTime } = selectedAppointment.rescheduleRequest;

      // Actualizar la cita con la nueva fecha/hora y eliminar la solicitud de reprogramación
      await updateDocumentNonBlocking(appointmentDocRef, {
        date: newDate,
        time: newTime,
        rescheduleRequest: null,
        status: 'confirmada',
      });

      // Crear notificación para el médico
      const notificationsCol = collection(firestore, 'notifications');
      await addDocumentNonBlocking(notificationsCol, {
        userId: selectedAppointment.doctorId,
        type: 'reschedule_accepted',
        title: 'Reprogramación Aceptada',
        message: `${selectedAppointment.patientName} ha aceptado la reprogramación para el ${format(parseLocalDate(newDate), "d 'de' MMMM", { locale: es })} a las ${newTime}`,
        relatedId: selectedAppointment.id,
        read: false,
        createdAt: new Date(),
      });

      toast({
        title: "Reprogramación Aceptada",
        description: `Tu cita ha sido reprogramada para el ${format(parseLocalDate(newDate), "d 'de' MMMM", { locale: es })} a las ${newTime}`,
      });

      setRescheduleResponseDialogOpen(false);
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Error accepting reschedule:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo aceptar la reprogramación. Intenta nuevamente.",
      });
    }
  };

  const handleCancelReschedule = async () => {
    if (!firestore || !selectedAppointment?.id) return;

    try {
      const appointmentDocRef = doc(firestore, 'appointments', selectedAppointment.id);

      // Cancelar la cita y eliminar la solicitud de reprogramación
      await updateDocumentNonBlocking(appointmentDocRef, {
        status: 'cancelada',
        rescheduleRequest: null,
      });

      // Crear notificación para el médico
      const notificationsCol = collection(firestore, 'notifications');
      await addDocumentNonBlocking(notificationsCol, {
        userId: selectedAppointment.doctorId,
        type: 'appointment_cancelled',
        title: 'Cita Cancelada por Paciente',
        message: `${selectedAppointment.patientName} ha cancelado la cita debido a la solicitud de reprogramación.`,
        relatedId: selectedAppointment.id,
        read: false,
        createdAt: new Date(),
      });

      toast({
        title: "Cita Cancelada",
        description: "Has cancelado la cita. El médico ha sido notificado.",
      });

      setRescheduleResponseDialogOpen(false);
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cancelar la cita. Intenta nuevamente.",
      });
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'confirmada':
        return 'default';
      case 'finalizada':
        return 'secondary';
      case 'cancelada':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const AppointmentCard = ({ appointment }: { appointment: any }) => {
    const doctor = doctors?.find(d => d.id === appointment.doctorId);
    const isCompleted = appointment.status === 'completada';
    const hasDiagnosis = appointment.diagnosis && appointment.diagnosis.description;
    const hasRescheduleRequest = appointment.rescheduleRequest && appointment.rescheduleRequest.requestedBy === 'doctor';
    
    return (
      <div className="space-y-2">
        {/* Alerta de Reprogramación */}
        {hasRescheduleRequest && (
          <div className="bg-blue-50 dark:bg-blue-950 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                    ⚠️ El médico no puede atender en la fecha original
                  </h4>
                </div>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                  El Dr. {appointment.doctorName} ha propuesto una nueva fecha para tu cita:
                </p>
                <div className="bg-white dark:bg-gray-900 rounded-md p-3 mb-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Nueva fecha:</span>
                      <p className="font-medium">
                        {format(parseLocalDate(appointment.rescheduleRequest.newDate), "d 'de' MMMM, yyyy", { locale: es })}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Nueva hora:</span>
                      <p className="font-medium">{appointment.rescheduleRequest.newTime}</p>
                    </div>
                  </div>
                  {appointment.rescheduleRequest.reason && (
                    <div className="mt-2 pt-2 border-t">
                      <span className="text-muted-foreground text-sm">Motivo:</span>
                      <p className="text-sm mt-1">{appointment.rescheduleRequest.reason}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button 
                size="sm" 
                onClick={() => handleOpenRescheduleResponse(appointment)}
                className="flex-1"
              >
                Responder
              </Button>
            </div>
          </div>
        )}

        {/* Card de la Cita */}
        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div className="flex items-center gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={doctor?.photoURL} />
              <AvatarFallback>{doctor?.displayName?.charAt(0) || 'D'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{appointment.doctorName}</p>
              <p className="text-sm text-muted-foreground">{appointment.serviceName}</p>
              <p className="text-sm text-muted-foreground">{parseLocalDate(appointment.date).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })} a las {appointment.time}</p>
              {isCompleted && hasDiagnosis && (
                <p className="text-xs text-primary mt-1 flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Diagnóstico disponible
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
              <Badge variant={getStatusVariant(appointment.status || 'pendiente')}>{appointment.status || 'Pendiente'}</Badge>
              {isCompleted && hasDiagnosis && (
                  <Button variant="outline" size="sm" onClick={() => handleViewDetails(appointment)}>
                      <FileText className="mr-2 h-4 w-4" />
                      Ver Detalles
                  </Button>
              )}
              {appointment.status === 'pendiente' && (
                  <Button variant="destructive" size="sm" onClick={() => handleCancelAppointment(appointment.id)}>
                      Cancelar Cita
                  </Button>
              )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Header />
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-headline">Citas Médicas</h1>
          <p className="text-muted-foreground">
            Agenda y administra tus consultas médicas.
          </p>
        </div>

        <Tabs defaultValue="agendar">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="agendar">Agendar Cita</TabsTrigger>
            <TabsTrigger value="mis-citas">Mis Citas</TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="agendar">
            <Card>
              <CardHeader>
                <CardTitle>Agendar Nueva Cita</CardTitle>
                <CardDescription>
                  Selecciona el servicio, médico, medio, fecha y hora.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Servicio</label>
                  <Select onValueChange={(value) => setSelectedService(services?.find(s => s.id === value))} disabled={isLoadingServices}>
                    <SelectTrigger>
                      <Stethoscope className="mr-2 h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Selecciona un servicio" />
                    </SelectTrigger>
                    <SelectContent>
                      {services?.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Médico</label>
                  <Select 
                    value={selectedDoctor?.id} 
                    onValueChange={(value) => setSelectedDoctor(filteredDoctors?.find(d => d.id === value))} 
                    disabled={isLoadingDoctors || !selectedService}
                  >
                    <SelectTrigger>
                       <User className="mr-2 h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder={
                        !selectedService 
                          ? "Primero selecciona un servicio" 
                          : (() => {
                              const serviceSpecialties = selectedService.specialties || (selectedService.specialty ? [selectedService.specialty] : []);
                              if (serviceSpecialties.length === 0) return "Este servicio no tiene especialidades definidas";
                              if (filteredDoctors && filteredDoctors.length === 0) {
                                return `No hay médicos con las especialidades requeridas`;
                              }
                              return "Selecciona un médico";
                            })()
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredDoctors?.map((doctor) => (
                         <SelectItem key={doctor.id} value={doctor.id}>
                          {doctor.displayName} ({doctor.specialty})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedService && (() => {
                    const serviceSpecialties = selectedService.specialties || (selectedService.specialty ? [selectedService.specialty] : []);
                    if (serviceSpecialties.length > 0 && filteredDoctors && filteredDoctors.length === 0) {
                      return (
                        <p className="text-xs text-muted-foreground">
                          No hay médicos con las especialidades requeridas ({serviceSpecialties.join(', ')}). 
                          Por favor contacta al administrador.
                        </p>
                      );
                    }
                    if (serviceSpecialties.length === 0) {
                      return (
                        <p className="text-xs text-amber-600">
                          Este servicio no tiene especialidades definidas. Contacta al administrador para configurarlo.
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Medio de Consulta</label>
                  <Select onValueChange={setConsultationType}>
                    <SelectTrigger>
                      <Video className="mr-2 h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Selecciona el medio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="virtual">Virtual</SelectItem>
                      <SelectItem value="presencial">Presencial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Fecha</label>
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            className="rounded-md border"
                            disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
                        />
                    </div>
                    <div className="space-y-2">
                         <label className="text-sm font-medium">Hora</label>
                         <div className="grid grid-cols-2 gap-2">
                            {['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'].map(time => (
                                <Button key={time} variant={selectedTime === time ? "default" : "outline"} onClick={() => setSelectedTime(time)}>
                                    <Clock className="mr-2 h-4 w-4" />
                                    {time}
                                </Button>
                            ))}
                         </div>
                    </div>
                </div>
                
                {/* Campo de motivo de consulta */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Motivo de Consulta (Opcional)</label>
                  <Textarea 
                    placeholder="Describe brevemente tus síntomas o el motivo de tu consulta..."
                    value={appointmentReason}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAppointmentReason(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Proporciona información sobre tus síntomas para ayudar al médico a prepararse mejor para tu consulta.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                 <div className="text-lg font-bold">
                    <span className="text-muted-foreground text-sm font-medium">Precio: </span>
                    {selectedService ? `$${new Intl.NumberFormat('es-CO').format(selectedService.price)}` : '$0'}
                 </div>
                <Button onClick={handleBookAppointment}>Confirmar Cita</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="mis-citas">
             <Card>
                <CardHeader>
                    <CardTitle>Mis Próximas Citas</CardTitle>
                    <CardDescription>Listado de tus citas agendadas.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoadingAppointments && <div className="space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>}
                    {!isLoadingAppointments && upcomingAppointments.map(appointment => (
                        <AppointmentCard key={appointment.id} appointment={appointment} />
                    ))}
                    {!isLoadingAppointments && upcomingAppointments.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">No tienes citas próximas.</p>
                    )}
                </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="historial">
            <Card>
                <CardHeader>
                    <CardTitle>Historial de Citas</CardTitle>
                    <CardDescription>Revisa tus citas pasadas.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     {isLoadingAppointments && <div className="space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>}
                     {!isLoadingAppointments && pastAppointments.map(appointment => (
                        <AppointmentCard key={appointment.id} appointment={appointment} />
                    ))}
                    {!isLoadingAppointments && pastAppointments.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">No tienes citas en tu historial.</p>
                    )}
                </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        {/* Dialog para responder a solicitud de reprogramación */}
        <Dialog open={rescheduleResponseDialogOpen} onOpenChange={setRescheduleResponseDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Solicitud de Reprogramación</DialogTitle>
              <DialogDescription>
                El médico no puede atender en la fecha original y ha propuesto una nueva fecha
              </DialogDescription>
            </DialogHeader>

            {selectedAppointment?.rescheduleRequest && (
              <div className="space-y-4">
                {/* Fecha/Hora Actual */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium text-sm mb-3 text-muted-foreground">Fecha Original (No Disponible)</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {format(parseLocalDate(selectedAppointment.date), "d 'de' MMMM, yyyy", { locale: es })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedAppointment.time}</span>
                    </div>
                  </div>
                </div>

                {/* Nueva Fecha/Hora Propuesta */}
                <div className="bg-primary/5 rounded-lg p-4 border-2 border-primary/20">
                  <h4 className="font-medium text-sm mb-3">Nueva Fecha Propuesta</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        {format(parseLocalDate(selectedAppointment.rescheduleRequest.newDate), "d 'de' MMMM, yyyy", { locale: es })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{selectedAppointment.rescheduleRequest.newTime}</span>
                    </div>
                  </div>
                  
                  {selectedAppointment.rescheduleRequest.reason && (
                    <div className="mt-3 pt-3 border-t border-primary/20">
                      <p className="text-xs text-muted-foreground mb-1">Motivo:</p>
                      <p className="text-sm">{selectedAppointment.rescheduleRequest.reason}</p>
                    </div>
                  )}
                </div>

                {/* Botones de Acción */}
                <div className="space-y-3 pt-2">
                  <div className="bg-muted/30 rounded-lg p-3 text-sm text-center">
                    <p className="font-medium">¿Qué deseas hacer?</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Elige aceptar la nueva fecha o cancelar completamente la cita
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="h-auto py-4 flex-col gap-2 border-2 hover:border-destructive hover:bg-destructive/10"
                      onClick={handleCancelReschedule}
                    >
                      <XCircle className="h-5 w-5 text-destructive" />
                      <div className="text-center">
                        <div className="font-semibold text-destructive">Cancelar</div>
                        <div className="text-xs text-muted-foreground">No puedo en ninguna fecha</div>
                      </div>
                    </Button>
                    
                    <Button
                      className="h-auto py-4 flex-col gap-2 bg-primary hover:bg-primary/90"
                      onClick={handleAcceptReschedule}
                    >
                      <CheckCircle className="h-5 w-5" />
                      <div className="text-center">
                        <div className="font-semibold">Aceptar</div>
                        <div className="text-xs opacity-90">Me sirve la nueva fecha</div>
                      </div>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog para ver detalles de consulta completada */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">Detalles de la Consulta</DialogTitle>
              <DialogDescription>
                Información completa sobre tu consulta médica
              </DialogDescription>
            </DialogHeader>

            {selectedAppointment && (
              <div className="space-y-6">
                {/* Información de la consulta */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Información de la Consulta</h3>
                  <div className="grid grid-cols-2 gap-4">
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
                        {selectedAppointment.status}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Tipo</p>
                      <p className="font-medium">{selectedAppointment.consultationType || 'Presencial'}</p>
                    </div>
                  </div>
                </div>

                {/* Diagnóstico */}
                {selectedAppointment.diagnosis && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">Diagnóstico Médico</h3>
                    
                    {selectedAppointment.diagnosis.code && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Código CIE-10</p>
                        <Badge variant="outline" className="text-sm">
                          {selectedAppointment.diagnosis.code}
                        </Badge>
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Diagnóstico</p>
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">
                          {selectedAppointment.diagnosis.description}
                        </p>
                      </div>
                    </div>

                    {selectedAppointment.diagnosis.treatment && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Tratamiento Recomendado</p>
                        <div className="bg-muted p-4 rounded-lg">
                          <p className="text-sm whitespace-pre-wrap">
                            {selectedAppointment.diagnosis.treatment}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Fecha del diagnóstico</p>
                      <p className="text-sm">
                        {format(new Date(selectedAppointment.diagnosis.date), 'PPP - p', { locale: es })}
                      </p>
                    </div>
                  </div>
                )}

                {/* Fórmula Médica */}
                {associatedFormula && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2 flex items-center gap-2">
                      <Pill className="h-5 w-5 text-primary" />
                      Fórmula Médica Prescrita
                    </h3>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">Estado de la fórmula</p>
                        <Badge variant={associatedFormula.status === 'activa' ? 'default' : 'outline'}>
                          {associatedFormula.status}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-semibold">Medicamentos Prescritos</p>
                        <div className="space-y-2">
                          {associatedFormula.medications?.map((med: any, index: number) => (
                            <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-semibold text-blue-900">{med.name}</p>
                                  <p className="text-sm text-blue-700 mt-1">
                                    <span className="font-medium">Dosis:</span> {med.dosage}
                                  </p>
                                </div>
                                <Badge variant="outline" className="bg-white">
                                  #{index + 1}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {associatedFormula.observations && (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold">Observaciones / Indicaciones Especiales</p>
                          <div className="bg-muted p-4 rounded-lg">
                            <p className="text-sm whitespace-pre-wrap">
                              {associatedFormula.observations}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Fecha de emisión</p>
                        <p className="text-sm">
                          {format(new Date(associatedFormula.date), 'PPP', { locale: es })}
                        </p>
                      </div>

                      {associatedFormula.digitalSignature && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Fórmula firmada digitalmente por {associatedFormula.doctorName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Notas adicionales */}
                {selectedAppointment.notes && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg border-b pb-2">Notas</h3>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{selectedAppointment.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
                Cerrar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
