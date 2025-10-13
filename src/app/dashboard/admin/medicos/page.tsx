
'use client';

import { useState } from 'react';
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
import { collection, query, where } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
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
  
  const firestore = useFirestore();
  const { toast } = useToast();

  const medicosQuery = useMemoFirebase(() => 
    firestore 
      ? query(collection(firestore, 'users'), where('role', 'not-in', ['PACIENTE', 'ADMIN'])) 
      : null, 
    [firestore]
  );
  const { data: medicos, isLoading: isLoadingMedicos } = useCollection(medicosQuery);

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
                       <Badge variant={getStatusVariant(medico.status || 'activo')}>
                        {medico.status ? (medico.status.charAt(0).toUpperCase() + medico.status.slice(1)) : 'Activo'}
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
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/admin/medicos/${medico.id}`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar perfil
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                           <DropdownMenuItem className={medico.status === 'activo' ? 'text-destructive focus:text-destructive' : ''}>
                           {medico.status === 'activo' ? <ToggleLeft className="mr-2 h-4 w-4" /> : <ToggleRight className="mr-2 h-4 w-4" />}
                            {medico.status === 'activo' ? 'Desactivar' : 'Activar'}
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
      </div>
    </>
  );
}
