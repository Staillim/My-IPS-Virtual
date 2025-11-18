'use client';

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
  User,
  Calendar,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

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


export default function AdminPacientesPage() {
  const firestore = useFirestore();

  const patientsQuery = useMemoFirebase(() => 
    firestore 
      ? query(collection(firestore, 'users'), where('role', '==', 'PACIENTE')) 
      : null, 
    [firestore]
  );
  const { data: patients, isLoading: isLoadingPatients } = useCollection(patientsQuery);

  return (
    <>
      <Header />
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold font-headline">Gestionar Pacientes</h1>
            <p className="text-muted-foreground">
              Administra los usuarios, sus perfiles y su estado en el sistema.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="p-4 border-b">
             <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o email..."
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Fecha de Registro</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingPatients && [...Array(4)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><div className="space-y-2"><Skeleton className="h-5 w-40" /><Skeleton className="h-3 w-48" /></div></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                ))}
                {patients?.map((patient: any) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">
                        <div>{patient.displayName}</div>
                        <div className="text-sm text-muted-foreground">{patient.email}</div>
                    </TableCell>
                    <TableCell>{patient.createdAt ? format(patient.createdAt.toDate(), 'PPP') : 'N/A'}</TableCell>
                    <TableCell>
                       <Badge variant={getStatusVariant(patient.status || 'activo')}>
                        {(patient.status || 'activo').charAt(0).toUpperCase() + (patient.status || 'activo').slice(1)}
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
                            {/* Este enlace eventualmente llevará a un perfil detallado */}
                            <Link href="#"> 
                                <User className="mr-2 h-4 w-4" />
                                Ver perfil
                            </Link>
                          </DropdownMenuItem>
                           <DropdownMenuItem asChild>
                             {/* Este enlace eventualmente llevará al historial de citas del paciente */}
                            <Link href="#">
                                <Calendar className="mr-2 h-4 w-4" />
                                Ver citas
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                           <DropdownMenuItem className={patient.status === 'activo' ? 'text-destructive focus:text-destructive' : ''}>
                           {patient.status === 'activo' ? <ToggleLeft className="mr-2 h-4 w-4" /> : <ToggleRight className="mr-2 h-4 w-4" />}
                            {patient.status === 'activo' ? 'Desactivar' : 'Activar'}
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
