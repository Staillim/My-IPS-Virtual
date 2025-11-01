'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import {
  Card,
  CardContent,
  CardDescription,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  MoreHorizontal,
  Search,
  Calendar as CalendarIcon,
  Video,
  FileText,
  XCircle,
  CalendarPlus,
  Info,
  CheckCircle,
  Plus,
  Trash2,
  Pill,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { es } from 'date-fns/locale';
import { useCollection, useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';


const getStatusVariant = (status: string) => {
  switch (status) {
    case 'confirmada':
      return 'default';
    case 'en curso':
      return 'secondary';
    case 'completada':
      return 'outline';
    case 'cancelada':
      return 'destructive';
    default:
      return 'outline';
  }
};


export default function PersonalCitasPage() {
  const [date, setDate] = useState<Date | undefined>();
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [diagnosis, setDiagnosis] = useState({ code: '', description: '', treatment: '' });
  const [includeFormula, setIncludeFormula] = useState(false);
  const [medications, setMedications] = useState<{name: string; dosage: string}[]>([]);
  const [newMedication, setNewMedication] = useState({ name: '', dosage: '' });
  const [formulaObservations, setFormulaObservations] = useState('');
  
  // Filtros para citas activas
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todas');
  const [dateFilter, setDateFilter] = useState<Date | undefined>();
  const [sortBy, setSortBy] = useState<'nearest' | 'date'>('nearest');
  
  // Filtros para citas completadas
  const [completedSearchTerm, setCompletedSearchTerm] = useState('');
  const [completedDateFilter, setCompletedDateFilter] = useState<Date | undefined>();
  const [showCompleted, setShowCompleted] = useState(false);
  
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

  const appointmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'appointments'), where('doctorId', '==', user.uid));
  }, [firestore, user]);

  const { data: appointments, isLoading: isLoadingAppointments } = useCollection(appointmentsQuery);

  // Función auxiliar para parsear fechas locales
  const parseLocalDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Función para obtener la próxima cita
  const getNextAppointment = () => {
    if (!appointments || appointments.length === 0) return null;
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const upcomingAppointments = appointments
      .filter(apt => {
        const aptDate = parseLocalDate(apt.date);
        return aptDate >= now && (apt.status === 'pendiente' || apt.status === 'confirmada');
      })
      .sort((a, b) => {
        const dateA = parseLocalDate(a.date);
        const dateB = parseLocalDate(b.date);
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime();
        }
        return a.time.localeCompare(b.time);
      });
    
    return upcomingAppointments[0] || null;
  };

  // Separar citas activas de completadas
  const activeAppointments = appointments?.filter(apt => 
    apt.status !== 'completada' && apt.status !== 'cancelada'
  ) || [];
  
  const completedAppointments = appointments?.filter(apt => 
    apt.status === 'completada' || apt.status === 'cancelada'
  ) || [];

  // Filtrar citas activas
  const filteredActiveAppointments = activeAppointments.filter((appointment) => {
    // Filtro por búsqueda de nombre de paciente
    if (searchTerm && !appointment.patientName?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Filtro por estado
    if (statusFilter !== 'todas' && appointment.status !== statusFilter) {
      return false;
    }
    
    // Filtro por fecha
    if (dateFilter) {
      const aptDate = parseLocalDate(appointment.date);
      const filterDate = new Date(dateFilter);
      filterDate.setHours(0, 0, 0, 0);
      aptDate.setHours(0, 0, 0, 0);
      
      if (aptDate.getTime() !== filterDate.getTime()) {
        return false;
      }
    }
    
    return true;
  }).sort((a, b) => {
    const dateA = parseLocalDate(a.date);
    const dateB = parseLocalDate(b.date);
    
    if (sortBy === 'nearest') {
      // Ordenar por fecha y hora más cercana (ascendente)
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      return a.time.localeCompare(b.time);
    } else {
      // Ordenar por fecha (descendente - más reciente primero)
      if (dateA.getTime() !== dateB.getTime()) {
        return dateB.getTime() - dateA.getTime();
      }
      return b.time.localeCompare(a.time);
    }
  });

  // Filtrar citas completadas
  const filteredCompletedAppointments = completedAppointments.filter((appointment) => {
    // Filtro por búsqueda de nombre de paciente
    if (completedSearchTerm && !appointment.patientName?.toLowerCase().includes(completedSearchTerm.toLowerCase())) {
      return false;
    }
    
    // Filtro por fecha
    if (completedDateFilter) {
      const aptDate = parseLocalDate(appointment.date);
      const filterDate = new Date(completedDateFilter);
      filterDate.setHours(0, 0, 0, 0);
      aptDate.setHours(0, 0, 0, 0);
      
      if (aptDate.getTime() !== filterDate.getTime()) {
        return false;
      }
    }
    
    return true;
  }).sort((a, b) => {
    // Ordenar por fecha descendente (más reciente primero)
    const dateA = parseLocalDate(a.date);
    const dateB = parseLocalDate(b.date);
    
    if (dateA.getTime() !== dateB.getTime()) {
      return dateB.getTime() - dateA.getTime();
    }
    return b.time.localeCompare(a.time);
  });

  const nextAppointment = getNextAppointment();

 if (isUserLoading || isUserDataLoading) {
    return (
      <>
        <Header />
        <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
            <Skeleton className="h-8 w-1/3 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-8" />
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-12 w-full" />
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                                <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                                <TableHead><Skeleton className="h-5 w-28" /></TableHead>
                                <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                                <TableHead className="text-right"><Skeleton className="h-5 w-16" /></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...Array(3)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
      </>
    )
  }

  if (!userData?.specialty) {
     return (
        <>
            <Header />
            <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
                 <div className="mb-8">
                    <h1 className="text-3xl font-bold font-headline">Gestión de Citas</h1>
                    <p className="text-muted-foreground">
                        Visualiza y administra todas las citas de tus pacientes.
                    </p>
                </div>
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>¡Acción Requerida!</AlertTitle>
                    <AlertDescription>
                        Para ver tus citas, primero debes seleccionar tu especialidad en tu perfil.
                        <Button asChild variant="link" className="p-1 h-auto">
                            <Link href="/dashboard/perfil">
                                Ir al perfil para configurarla.
                            </Link>
                        </Button>
                    </AlertDescription>
                </Alert>
            </div>
        </>
     )
  }

  const handleAcceptAppointment = async (appointmentId: string) => {
      if (!firestore || !user) return;
      
      try {
        // Buscar los datos de la cita para obtener el patientId
        const appointment = appointments?.find(a => a.id === appointmentId);
        if (!appointment || !appointment.patientId) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo encontrar la información de la cita.",
          });
          return;
        }

        const appointmentDocRef = doc(firestore, 'appointments', appointmentId);
        await updateDocumentNonBlocking(appointmentDocRef, { status: 'confirmada' });

        // Crear notificación para el paciente
        const notificationsCol = collection(firestore, 'notifications');
        await addDocumentNonBlocking(notificationsCol, {
          userId: appointment.patientId,
          type: 'appointment_confirmed',
          title: 'Cita Confirmada',
          message: `El Dr. ${user.displayName} ha aceptado tu cita para ${appointment.serviceName} el día ${format(parseLocalDate(appointment.date), "d 'de' MMMM", { locale: es })}.`,
          read: false,
          relatedId: appointmentId,
          createdAt: new Date(),
        });

        toast({
            title: "Cita Aceptada",
            description: `La cita ha sido aceptada exitosamente.`,
        });
      } catch (error) {
        console.error('Error al aceptar cita:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo aceptar la cita.",
        });
      }
  };

  const handleOpenCompleteDialog = (appointment: any) => {
    setSelectedAppointment(appointment);
    setDiagnosis({ code: '', description: '', treatment: '' });
    setIncludeFormula(false);
    setMedications([]);
    setNewMedication({ name: '', dosage: '' });
    setFormulaObservations('');
    setCompleteDialogOpen(true);
  };

  const handleAddMedication = () => {
    if (newMedication.name.trim() && newMedication.dosage.trim()) {
      setMedications([...medications, { name: newMedication.name, dosage: newMedication.dosage }]);
      setNewMedication({ name: '', dosage: '' });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Completa el nombre y la dosis del medicamento.",
      });
    }
  };

  const handleRemoveMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleCompleteConsultation = async () => {
    if (!firestore || !selectedAppointment || !user) return;

    if (!selectedAppointment.patientId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo identificar al paciente de esta cita.",
      });
      return;
    }

    if (!diagnosis.description.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debes ingresar al menos una descripción del diagnóstico.",
      });
      return;
    }

    if (includeFormula && medications.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Si deseas emitir una fórmula, debes agregar al menos un medicamento.",
      });
      return;
    }

    try {
      // 1. Actualizar la cita con el diagnóstico
      const appointmentDocRef = doc(firestore, 'appointments', selectedAppointment.id);
      await updateDocumentNonBlocking(appointmentDocRef, { 
        status: 'completada',
        diagnosis: {
          code: diagnosis.code,
          description: diagnosis.description,
          treatment: diagnosis.treatment,
          date: new Date().toISOString(),
        }
      });

      // 2. Crear notificación de diagnóstico listo
      const notificationsCol = collection(firestore, 'notifications');
      await addDocumentNonBlocking(notificationsCol, {
        userId: selectedAppointment.patientId,
        type: 'diagnosis_ready',
        title: 'Diagnóstico Completado',
        message: `El Dr. ${user.displayName} ha completado tu consulta y dejó el diagnóstico listo. Puedes revisarlo en tu historial clínico.`,
        read: false,
        relatedId: selectedAppointment.id,
        createdAt: new Date(),
      });

      // 3. Si se incluyó fórmula, crearla y notificar
      if (includeFormula && medications.length > 0) {
        const formulaData = {
          patientId: selectedAppointment.patientId,
          patientName: selectedAppointment.patientName,
          doctorId: user.uid,
          doctorName: user.displayName,
          date: new Date().toISOString().split('T')[0],
          medications: medications,
          observations: formulaObservations,
          status: 'activa',
          digitalSignature: user.photoURL,
          appointmentId: selectedAppointment.id, // Vincular con la cita
        };

        const formulasCol = collection(firestore, 'formulas');
        await addDocumentNonBlocking(formulasCol, formulaData);

        // Notificación de fórmula creada
        await addDocumentNonBlocking(notificationsCol, {
          userId: selectedAppointment.patientId,
          type: 'formula_created',
          title: 'Fórmula Médica Emitida',
          message: `El Dr. ${user.displayName} ha emitido una fórmula médica para ti con ${medications.length} medicamento(s). Revísala en la sección de fórmulas.`,
          read: false,
          relatedId: selectedAppointment.id,
          createdAt: new Date(),
        });
      }

      toast({
        title: "Consulta Completada",
        description: includeFormula 
          ? "El diagnóstico y la fórmula médica han sido registrados exitosamente."
          : "El diagnóstico ha sido registrado exitosamente.",
      });

      setCompleteDialogOpen(false);
      setSelectedAppointment(null);
      setDiagnosis({ code: '', description: '', treatment: '' });
      setIncludeFormula(false);
      setMedications([]);
      setNewMedication({ name: '', dosage: '' });
      setFormulaObservations('');
    } catch (error) {
      console.error('Error al completar consulta:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo completar la consulta.",
      });
    }
  };

  return (
    <>
      <Header />
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-headline">Gestión de Citas</h1>
          <p className="text-muted-foreground">
            Mostrando citas para la especialidad: <span className="font-semibold text-foreground">{userData.specialty}</span>.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filtros y Ordenamiento</CardTitle>
            <CardDescription>
              Busca, filtra y ordena las citas por fecha, paciente o estado.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative w-full sm:w-auto flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre de paciente..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={cn(
                    'w-full sm:w-[280px] justify-start text-left font-normal',
                    !dateFilter && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFilter ? (
                    format(dateFilter, 'PPP', { locale: es })
                  ) : (
                    <span>Selecciona una fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateFilter}
                  onSelect={setDateFilter}
                  initialFocus
                  locale={es}
                />
              </PopoverContent>
            </Popover>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="confirmada">Confirmada</SelectItem>
                <SelectItem value="en curso">En curso</SelectItem>
                <SelectItem value="completada">Completada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value: 'nearest' | 'date') => setSortBy(value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nearest">Más cercana</SelectItem>
                <SelectItem value="date">Por fecha</SelectItem>
              </SelectContent>
            </Select>
            {(searchTerm || dateFilter || statusFilter !== 'todas') && (
              <Button 
                variant="ghost" 
                onClick={() => {
                  setSearchTerm('');
                  setDateFilter(undefined);
                  setStatusFilter('todas');
                }}
              >
                Limpiar
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Próxima Cita */}
        {nextAppointment && (
          <Card className="mt-8 border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                Próxima Cita
              </CardTitle>
              <CardDescription>
                Tu siguiente cita programada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Paciente:</span>
                    <span className="font-semibold">{nextAppointment.patientName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Fecha:</span>
                    <span className="font-semibold">
                      {format(parseLocalDate(nextAppointment.date), "EEEE, d 'de' MMMM", { locale: es })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Hora:</span>
                    <span className="font-semibold">{nextAppointment.time}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Servicio:</span>
                    <span className="font-semibold">{nextAppointment.serviceName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Estado:</span>
                    <Badge variant={getStatusVariant(nextAppointment.status)}>
                      {nextAppointment.status}
                    </Badge>
                  </div>
                  {nextAppointment.reason && (
                    <div className="flex items-start gap-2 mt-2">
                      <span className="text-sm text-muted-foreground">Motivo:</span>
                      <span className="text-sm">{nextAppointment.reason}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Citas Activas</CardTitle>
                  <CardDescription>
                    Mostrando {filteredActiveAppointments.length} {filteredActiveAppointments.length === 1 ? 'cita' : 'citas'}
                    {' '}ordenadas por {sortBy === 'nearest' ? 'fecha más cercana' : 'fecha (más reciente primero)'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Fecha y Hora</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingAppointments && [...Array(3)].map((_, i) => (
                     <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))}
                  {!isLoadingAppointments && filteredActiveAppointments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No se encontraron citas activas con los filtros aplicados.
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredActiveAppointments?.map((appointment: any) => (
                    <TableRow key={appointment.id}>
                      <TableCell className="font-medium">
                        {appointment.patientName}
                      </TableCell>
                      <TableCell>
                        {format(parseLocalDate(appointment.date), 'PPP', {
                          locale: es,
                        })} {appointment.time}
                      </TableCell>
                      <TableCell>{appointment.serviceName}</TableCell>
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
                            <DropdownMenuItem onClick={() => handleAcceptAppointment(appointment.id)} disabled={appointment.status === 'completada'}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              {appointment.status === 'confirmada' ? 'Aceptada' : 'Aceptar Cita'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleOpenCompleteDialog(appointment)}
                              disabled={appointment.status === 'completada' || appointment.status === 'cancelada'}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              {appointment.status === 'completada' ? 'Completada' : 'Completar Consulta'}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Video className="mr-2 h-4 w-4" />
                              Iniciar consulta
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Info className="mr-2 h-4 w-4" />
                              Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <CalendarPlus className="mr-2 h-4 w-4" />
                              Reprogramar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancelar cita
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          {!isLoadingAppointments && appointments?.length === 0 && (
            <div className="text-center py-16 border-2 border-dashed rounded-lg mt-8">
              <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">
                No se encontraron citas
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Aún no tienes citas asignadas que coincidan con los filtros aplicados.
              </p>
            </div>
          )}
        </div>

        {/* Sección de Citas Completadas - Desplegable */}
        <Collapsible open={showCompleted} onOpenChange={setShowCompleted} className="mt-8">
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Citas Completadas
                      <Badge variant="secondary" className="ml-2">
                        {filteredCompletedAppointments.length}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Historial de citas completadas y canceladas
                    </CardDescription>
                  </div>
                  {showCompleted ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              {/* Filtros para citas completadas */}
              <CardContent className="border-t pt-4">
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre de paciente..."
                      className="pl-10"
                      value={completedSearchTerm}
                      onChange={(e) => setCompletedSearchTerm(e.target.value)}
                    />
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full sm:w-[280px] justify-start text-left font-normal',
                          !completedDateFilter && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {completedDateFilter ? (
                          format(completedDateFilter, 'PPP', { locale: es })
                        ) : (
                          <span>Filtrar por fecha</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={completedDateFilter}
                        onSelect={setCompletedDateFilter}
                        initialFocus
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                  {(completedSearchTerm || completedDateFilter) && (
                    <Button 
                      variant="ghost" 
                      onClick={() => {
                        setCompletedSearchTerm('');
                        setCompletedDateFilter(undefined);
                      }}
                    >
                      Limpiar
                    </Button>
                  )}
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Fecha y Hora</TableHead>
                      <TableHead>Servicio</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompletedAppointments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No se encontraron citas completadas con los filtros aplicados.
                        </TableCell>
                      </TableRow>
                    )}
                    {filteredCompletedAppointments.map((appointment: any) => (
                      <TableRow key={appointment.id}>
                        <TableCell className="font-medium">
                          {appointment.patientName}
                        </TableCell>
                        <TableCell>
                          {format(parseLocalDate(appointment.date), 'PPP', {
                            locale: es,
                          })}{' '}
                          a las {appointment.time}
                        </TableCell>
                        <TableCell>{appointment.serviceName}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(appointment.status)}>
                            {appointment.status}
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
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/historial?patientId=${appointment.patientId}`}>
                                  <FileText className="mr-2 h-4 w-4" />
                                  Ver historial médico
                                </Link>
                              </DropdownMenuItem>
                              {appointment.diagnosis && (
                                <DropdownMenuItem>
                                  <Info className="mr-2 h-4 w-4" />
                                  Ver diagnóstico
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
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Dialog para completar consulta con diagnóstico */}
        <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">Completar Consulta y Registrar Diagnóstico</DialogTitle>
              <DialogDescription>
                Completa los datos del diagnóstico para finalizar la consulta con {selectedAppointment?.patientName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Información de la consulta */}
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Paciente</p>
                    <p className="font-medium">{selectedAppointment?.patientName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Servicio</p>
                    <p className="font-medium">{selectedAppointment?.serviceName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Fecha</p>
                    <p className="font-medium">
                      {selectedAppointment?.date && format(parseLocalDate(selectedAppointment.date), 'PPP', { locale: es })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Hora</p>
                    <p className="font-medium">{selectedAppointment?.time}</p>
                  </div>
                </div>
              </div>

              {/* Formulario de diagnóstico */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="diagnosis-code">Código CIE-10 (Opcional)</Label>
                  <Input
                    id="diagnosis-code"
                    placeholder="Ej: J00 (Rinofaringitis aguda)"
                    value={diagnosis.code}
                    onChange={(e) => setDiagnosis({ ...diagnosis, code: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Código internacional de clasificación de enfermedades
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="diagnosis-description">Diagnóstico *</Label>
                  <Textarea
                    id="diagnosis-description"
                    placeholder="Descripción detallada del diagnóstico..."
                    rows={4}
                    value={diagnosis.description}
                    onChange={(e) => setDiagnosis({ ...diagnosis, description: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="diagnosis-treatment">Tratamiento Recomendado</Label>
                  <Textarea
                    id="diagnosis-treatment"
                    placeholder="Tratamiento, medicamentos, recomendaciones..."
                    rows={4}
                    value={diagnosis.treatment}
                    onChange={(e) => setDiagnosis({ ...diagnosis, treatment: e.target.value })}
                  />
                </div>
              </div>

              <Separator />

              {/* Sección de Fórmula Médica */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-formula" 
                    checked={includeFormula}
                    onCheckedChange={(checked) => setIncludeFormula(checked as boolean)}
                  />
                  <Label htmlFor="include-formula" className="text-base font-semibold flex items-center gap-2 cursor-pointer">
                    <Pill className="h-5 w-5 text-primary" />
                    Emitir Fórmula Médica con esta consulta
                  </Label>
                </div>

                {includeFormula && (
                  <div className="space-y-4 pl-7 border-l-2 border-primary/30">
                    {/* Lista de medicamentos */}
                    {medications.length > 0 && (
                      <div className="space-y-2">
                        <Label>Medicamentos Prescritos</Label>
                        {medications.map((med, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                            <div>
                              <p className="font-medium">{med.name}</p>
                              <p className="text-sm text-muted-foreground">Dosis: {med.dosage}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMedication(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Agregar nuevo medicamento */}
                    <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                      <Label className="text-sm font-semibold">Agregar Medicamento</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="med-name" className="text-xs">Nombre del Medicamento</Label>
                          <Input
                            id="med-name"
                            placeholder="Ej: Ibuprofeno 400mg"
                            value={newMedication.name}
                            onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="med-dosage" className="text-xs">Dosis / Frecuencia</Label>
                          <Input
                            id="med-dosage"
                            placeholder="Ej: 1 tableta cada 8 horas"
                            value={newMedication.dosage}
                            onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                          />
                        </div>
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={handleAddMedication}
                        className="w-full"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar Medicamento
                      </Button>
                    </div>

                    {/* Observaciones de la fórmula */}
                    <div className="space-y-2">
                      <Label htmlFor="formula-observations">Observaciones / Indicaciones Especiales</Label>
                      <Textarea
                        id="formula-observations"
                        placeholder="Indicaciones adicionales para la fórmula médica..."
                        rows={3}
                        value={formulaObservations}
                        onChange={(e) => setFormulaObservations(e.target.value)}
                      />
                    </div>

                    {medications.length === 0 && (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Información</AlertTitle>
                        <AlertDescription>
                          Agrega al menos un medicamento para emitir la fórmula médica.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCompleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCompleteConsultation}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Completar Consulta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
