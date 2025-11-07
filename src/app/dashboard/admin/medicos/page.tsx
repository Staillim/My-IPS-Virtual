
'use client';

import { useMemo, useState } from 'react';
import { Header } from '@/components/header';
import {
  Card,
  CardContent,
  CardHeader,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  MoreHorizontal,
  Search,
  PlusCircle,
  UserPlus,
  Edit,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { SHIFT_TEMPLATES, ShiftTemplateKey, computeShiftStatus, createShiftDocFromTemplate } from '@/lib/shifts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'activo':
      return 'default';
    case 'inactivo':
      return 'secondary';
    default:
      return 'outline';
  }
};

export default function AdminMedicosPage() {
  const [open, setOpen] = useState(false);
  const [newDoctor, setNewDoctor] = useState({ fullName: '', email: '', specialty: '' });
  const [assignForDoctorId, setAssignForDoctorId] = useState<string | null>(null);
  const [assignTemplate, setAssignTemplate] = useState<'' | ShiftTemplateKey>('');
  const [assignDate, setAssignDate] = useState<Date | undefined>();
  const [assignArea, setAssignArea] = useState<string>('');
  const [assignObs, setAssignObs] = useState<string>('');
  
  const firestore = useFirestore();
  const { toast } = useToast();

  const medicosQuery = useMemoFirebase(() => 
    firestore 
      ? query(collection(firestore, 'users'), where('role', 'not-in', ['PACIENTE', 'ADMIN'])) 
      : null, 
    [firestore]
  );
  const { data: medicos, isLoading: isLoadingMedicos } = useCollection(medicosQuery);

  // Fetch all shifts (kept simple; optimize with range queries later if needed)
  const shiftsRef = useMemoFirebase(() => firestore ? collection(firestore, 'shifts') : null, [firestore]);
  const { data: shifts } = useCollection(shiftsRef);

  const activeShiftByDoctor = useMemo(() => {
    const map = new Map<string, any>();
    shifts?.forEach((s: any) => {
      const status = computeShiftStatus({
        doctorId: s.doctorId,
        doctorName: s.doctorName,
        startDate: s.startDate || s.date,
        endDate: s.endDate || s.startDate || s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        type: s.type,
        durationHours: s.durationHours || 0,
        nocturno: !!s.nocturno,
        recargoPercent: s.recargoPercent || 0,
        spansMidnight: !!s.spansMidnight || (s.endTime < s.startTime),
        status: s.status,
      } as any);
      if (status === 'activo') {
        map.set(s.doctorId, s);
      }
    });
    return map;
  }, [shifts]);

  const handleRegisterDoctor = () => {
    if (!newDoctor.fullName || !newDoctor.email || !newDoctor.specialty) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor, completa todos los campos."
      });
      return;
    }
    
    // NOTE: This only creates a user document. In a real app, you'd also need
    // to create an auth user (e.g., via a Cloud Function) and send them an email.
    const [firstName, ...lastName] = newDoctor.fullName.split(' ');
    const doctorData = {
        firstName,
        lastName: lastName.join(' '),
        displayName: newDoctor.fullName,
        email: newDoctor.email,
        specialty: newDoctor.specialty,
        role: newDoctor.specialty === 'Certificador médico' ? 'CERTIFICADOR' : 'PERSONAL', // Example role logic
        status: 'activo',
    };

    const usersCol = collection(firestore, 'users');
    addDocumentNonBlocking(usersCol, doctorData);

    toast({
        title: "Médico Registrado",
        description: `${newDoctor.fullName} ha sido añadido. Se le enviará un correo para establecer su contraseña.`
    });

    setOpen(false);
    setNewDoctor({ fullName: '', email: '', specialty: '' });
  }

  return (
    <>
      <Header />
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold font-headline">Gestionar Médicos</h1>
            <p className="text-muted-foreground">
              Administra el personal médico, sus roles y su estado en el sistema.
            </p>
          </div>
           <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Registrar Nuevo Médico
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus />
                  Nuevo Registro de Médico
                </DialogTitle>
                <DialogDescription>
                  Completa los datos para registrar un nuevo profesional. Se le enviará un correo para establecer su contraseña.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="fullname" className="text-right">
                    Nombre
                  </Label>
                  <Input id="fullname" placeholder="Nombre completo del médico" className="col-span-3" value={newDoctor.fullName} onChange={(e) => setNewDoctor(prev => ({...prev, fullName: e.target.value}))}/>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input id="email" type="email" placeholder="correo@profesional.com" className="col-span-3" value={newDoctor.email} onChange={(e) => setNewDoctor(prev => ({...prev, email: e.target.value}))}/>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="specialty" className="text-right">
                    Especialidad
                  </Label>
                   <Select onValueChange={(value) => setNewDoctor(prev => ({...prev, specialty: value}))}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecciona una especialidad" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Médico general">Médico general</SelectItem>
                        <SelectItem value="Pediatra">Pediatra</SelectItem>
                        <SelectItem value="Psicólogo">Psicólogo</SelectItem>
                        <SelectItem value="Cardiología">Cardiología</SelectItem>
                        <SelectItem value="Dermatología">Dermatología</SelectItem>
                        <SelectItem value="Certificador médico">Certificador médico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                   <Button type="button" variant="secondary">Cancelar</Button>
                </DialogClose>
                <Button type="submit" onClick={handleRegisterDoctor}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Registrar Médico
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
             <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o especialidad..."
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Especialidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingMedicos && [...Array(4)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><div className="space-y-2"><Skeleton className="h-5 w-40" /><Skeleton className="h-3 w-48" /></div></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                ))}
                {medicos?.map((medico: any) => (
                  <TableRow key={medico.id}>
                    <TableCell className="font-medium">
                        <div>{medico.displayName}</div>
                        <div className="text-sm text-muted-foreground">{medico.email}</div>
                    </TableCell>
                    <TableCell>{medico.specialty}</TableCell>
                    <TableCell>
                      {activeShiftByDoctor.has(medico.id) ? (
                        <Badge variant={getStatusVariant('activo')}>En turno</Badge>
                      ) : (
                        <Badge variant={getStatusVariant('inactivo')}>Fuera de turno</Badge>
                      )}
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
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/admin/medicos/${medico.id}`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar perfil
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                           {activeShiftByDoctor.has(medico.id) ? (
                             <DropdownMenuItem
                               className="text-destructive focus:text-destructive"
                               onClick={() => {
                                 const s = activeShiftByDoctor.get(medico.id);
                                 if (!firestore || !s) return;
                                 const ref = doc(firestore, 'shifts', s.id);
                                 updateDocumentNonBlocking(ref, { status: 'finalizado' });
                                 toast({ title: 'Turno finalizado', description: `Se finalizó el turno actual de ${medico.displayName}.` });
                               }}
                             >
                               <ToggleLeft className="mr-2 h-4 w-4" /> Finalizar turno actual
                             </DropdownMenuItem>
                           ) : (
                             <DropdownMenuItem onClick={() => setAssignForDoctorId(medico.id)}>
                               <ToggleRight className="mr-2 h-4 w-4" /> Asignar turno
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
        </Card>

        {/* Dialogo Asignar turno rápido */}
  <Dialog open={!!assignForDoctorId} onOpenChange={(o) => !o && (setAssignForDoctorId(null), setAssignTemplate(''), setAssignDate(undefined), setAssignArea(''), setAssignObs(''))}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Asignar turno</DialogTitle>
              <DialogDescription>Selecciona tipo y fecha para asignar un turno al médico.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Tipo de turno</Label>
                <Select onValueChange={(v: ShiftTemplateKey) => setAssignTemplate(v)}>
                  <SelectTrigger>
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
                <Label>Fecha</Label>
                <Input type="date" value={assignDate ? format(assignDate, 'yyyy-MM-dd') : ''} onChange={(e) => setAssignDate(e.target.value ? new Date(e.target.value + 'T00:00:00') : undefined)} />
              </div>
              <div className="space-y-2">
                <Label>Área / Servicio</Label>
                <Select onValueChange={(v) => setAssignArea(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar área" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Urgencias">Urgencias</SelectItem>
                    <SelectItem value="Consulta Externa">Consulta Externa</SelectItem>
                    <SelectItem value="Pediatría">Pediatría</SelectItem>
                    <SelectItem value="Medicina General">Medicina General</SelectItem>
                    <SelectItem value="Cardiología">Cardiología</SelectItem>
                    <SelectItem value="Dermatología">Dermatología</SelectItem>
                    <SelectItem value="Psicología">Psicología</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Input placeholder="Ej: Turno diurno completo" value={assignObs} onChange={(e) => setAssignObs(e.target.value)} />
              </div>
              {assignTemplate && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Inicio</Label>
                    <Input disabled value={SHIFT_TEMPLATES[assignTemplate].startTime} />
                  </div>
                  <div className="space-y-1">
                    <Label>Fin</Label>
                    <Input disabled value={SHIFT_TEMPLATES[assignTemplate].endTime} />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">Cancelar</Button>
              </DialogClose>
              <Button
                onClick={() => {
                  const doctor = medicos?.find((m: any) => m.id === assignForDoctorId);
                  if (!doctor || !assignTemplate || !assignDate || !assignArea || !firestore) {
                    toast({ variant: 'destructive', title: 'Faltan datos', description: 'Selecciona tipo, fecha y área.' });
                    return;
                  }
                  const docToAdd = createShiftDocFromTemplate(assignTemplate, { id: doctor.id, displayName: doctor.displayName }, assignDate);
                  const colRef = collection(firestore, 'shifts');
                  addDocumentNonBlocking(colRef, {
                    ...docToAdd,
                    date: docToAdd.startDate,
                    area: assignArea,
                    observations: assignObs,
                    doctorRole: doctor.role,
                    doctorSpecialty: doctor.specialty,
                  });
                  toast({ title: 'Turno asignado', description: `Asignado ${docToAdd.type} a ${doctor.displayName}.` });
                  setAssignForDoctorId(null);
                  setAssignTemplate('');
                  setAssignDate(undefined);
                  setAssignArea('');
                  setAssignObs('');
                }}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Asignar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
