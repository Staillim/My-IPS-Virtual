
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
  PlusCircle,
  Edit,
  ToggleLeft,
  ToggleRight,
  Briefcase,
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
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
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

export default function AdminServiciosPage() {
  const [open, setOpen] = useState(false);
  const [newService, setNewService] = useState({ name: '', price: '', duration: '' });

  const firestore = useFirestore();
  const { toast } = useToast();

  const servicesCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, 'services') : null, [firestore]);
  const { data: services, isLoading: isLoadingServices } = useCollection(servicesCollectionRef);
  
  const handleRegisterService = () => {
    if (!newService.name || !newService.price || !newService.duration) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Todos los campos son obligatorios."
      });
      return;
    }
    
    const serviceData = {
        name: newService.name,
        price: Number(newService.price),
        duration: Number(newService.duration),
        status: 'activo',
    };

    const servicesCol = collection(firestore, 'services');
    addDocumentNonBlocking(servicesCol, serviceData);

    toast({
      title: "Servicio Registrado",
      description: `El servicio "${newService.name}" ha sido creado.`
    });

    setOpen(false);
    setNewService({ name: '', price: '', duration: '' });
  };


  return (
    <>
      <Header />
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold font-headline">Gestionar Servicios</h1>
            <p className="text-muted-foreground">
              Administra los servicios médicos, precios y duraciones.
            </p>
          </div>
           <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Registrar Nuevo Servicio
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Briefcase />
                  Nuevo Servicio Médico
                </DialogTitle>
                <DialogDescription>
                  Completa los datos para registrar un nuevo servicio.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="service-name">Nombre del Servicio</Label>
                  <Input id="service-name" placeholder="Ej: Consulta Dermatológica" value={newService.name} onChange={e => setNewService(p => ({...p, name: e.target.value}))}/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="service-price">Precio (COP)</Label>
                        <Input id="service-price" type="number" placeholder="Ej: 80000" value={newService.price} onChange={e => setNewService(p => ({...p, price: e.target.value}))}/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="service-duration">Duración (min)</Label>
                        <Input id="service-duration" type="number" placeholder="Ej: 45" value={newService.duration} onChange={e => setNewService(p => ({...p, duration: e.target.value}))} />
                    </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                   <Button type="button" variant="secondary">Cancelar</Button>
                </DialogClose>
                <Button type="submit" onClick={handleRegisterService}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Registrar Servicio
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Listado de Servicios</CardTitle>
            <CardDescription>Visualiza y administra los servicios ofrecidos.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre del Servicio</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Duración</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingServices && [...Array(3)].map((_, i) => (
                     <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                ))}
                {services?.map((service: any) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">
                        {service.name}
                    </TableCell>
                    <TableCell>${new Intl.NumberFormat('es-CO').format(service.price)}</TableCell>
                    <TableCell>{service.duration} min.</TableCell>
                    <TableCell>
                       <Badge variant={getStatusVariant(service.status || 'activo')}>
                        {service.status ? (service.status.charAt(0).toUpperCase() + service.status.slice(1)) : 'Activo'}
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
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar servicio
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                           <DropdownMenuItem className={service.status === 'activo' ? 'text-destructive focus:text-destructive' : ''}>
                           {service.status === 'activo' ? <ToggleLeft className="mr-2 h-4 w-4" /> : <ToggleRight className="mr-2 h-4 w-4" />}
                            {service.status === 'activo' ? 'Desactivar' : 'Activar'}
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
