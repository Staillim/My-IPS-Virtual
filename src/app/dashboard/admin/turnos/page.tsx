
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
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
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
  const [newShift, setNewShift] = useState({ doctorId: '', type: '', startTime: '', endTime: ''});
  
  const firestore = useFirestore();
  const { toast } = useToast();

  const doctorsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), where('role', 'not-in', ['PACIENTE', 'ADMIN'])) : null, [firestore]);
  const { data: doctors, isLoading: isLoadingDoctors } = useCollection(doctorsQuery);
  
  const shiftsCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, 'shifts') : null, [firestore]);
  const { data: shifts, isLoading: isLoadingShifts } = useCollection(shiftsCollectionRef);

  const parseDateString = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    // Month is 0-indexed in JavaScript Date constructor
    return new Date(year, month - 1, day);
  }
  
  const handleAssignShift = () => {
      const doctor = doctors?.find(d => d.id === newShift.doctorId);
      if (!doctor || !newShift.type || !date || !newShift.startTime || !newShift.endTime) {
          toast({ variant: 'destructive', title: 'Error', description: 'Por favor, completa todos los campos.' });
          return;
      }

      const shiftData = {
          doctorId: doctor.id,
          doctorName: doctor.displayName,
          date: format(date, 'yyyy-MM-dd'),
          startTime: newShift.startTime,
          endTime: newShift.endTime,
          type: newShift.type,
          status: 'próximo', // Default status
      };
      if (firestore) {
        const shiftsCol = collection(firestore, 'shifts');
        addDocumentNonBlocking(shiftsCol, shiftData);
      }
      

      toast({ title: 'Turno Asignado', description: `Se ha asignado un turno a ${doctor.displayName}.` });
      setOpen(false);
      setNewShift({ doctorId: '', type: '', startTime: '', endTime: ''});
      setDate(undefined);
  }

  return (
    <>
      <Header />
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold font-headline">Gestión de Turnos</h1>
            <p className="text-muted-foreground">
              Asigna y administra los turnos del personal médico.
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
                    <Select onValueChange={value => setNewShift(p => ({ ...p, type: value}))}>
                        <SelectTrigger id="shift-type">
                            <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="6 horas">6 horas</SelectItem>
                            <SelectItem value="12 horas">12 horas</SelectItem>
                            <SelectItem value="24 horas">24 horas</SelectItem>
                        </SelectContent>
                    </Select>
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
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="start-time">Hora Inicio</Label>
                        <Input id="start-time" type="time" value={newShift.startTime} onChange={e => setNewShift(p => ({...p, startTime: e.target.value}))}/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="end-time">Hora Fin</Label>
                        <Input id="end-time" type="time" value={newShift.endTime} onChange={e => setNewShift(p => ({...p, endTime: e.target.value}))}/>
                    </div>
                 </div>
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

        <Card className="mb-8">
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
                    <TableCell>{format(parseDateString(shift.date), 'PPP', { locale: es })}</TableCell>
                    <TableCell>{shift.startTime} - {shift.endTime}</TableCell>
                    <TableCell>{shift.type}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(shift.status || 'pendiente')}>
                        {shift.status ? (shift.status.charAt(0).toUpperCase() + shift.status.slice(1)) : 'Pendiente'}
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
                          <DropdownMenuItem><Edit className="mr-2 h-4 w-4" />Editar Turno</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Cancelar Turno</DropdownMenuItem>
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
      </div>
    </>
  );
}
