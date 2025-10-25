
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { X } from 'lucide-react';

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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [newService, setNewService] = useState({ name: '', price: '', duration: '', specialties: [] as string[] });

  const firestore = useFirestore();
  const { toast } = useToast();

  const servicesCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, 'services') : null, [firestore]);
  const { data: services, isLoading: isLoadingServices } = useCollection(servicesCollectionRef);
  
  // Fetch Doctors/Medical Staff to get specialties
  const doctorsQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'users'), where('role', 'in', ['PERSONAL', 'ADMIN'])) : null, 
    [firestore]
  );
  const { data: doctors, isLoading: isLoadingDoctors } = useCollection(doctorsQuery);
  
  // Get unique specialties from doctors
  const availableSpecialties = doctors
    ?.map(doctor => doctor.specialty)
    .filter((specialty, index, self) => 
      specialty && specialty.trim() !== '' && self.indexOf(specialty) === index
    )
    .sort() || [];
  
  const handleRegisterService = () => {
    if (!newService.name || !newService.price || !newService.duration || newService.specialties.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Todos los campos son obligatorios. Debes seleccionar al menos una especialidad."
      });
      return;
    }
    
    const serviceData = {
        name: newService.name,
        price: Number(newService.price),
        duration: Number(newService.duration),
        specialties: newService.specialties,
        status: 'activo',
    };

    const servicesCol = collection(firestore, 'services');
    addDocumentNonBlocking(servicesCol, serviceData);

    toast({
      title: "Servicio Registrado",
      description: `El servicio "${newService.name}" ha sido creado.`
    });

    setOpen(false);
    setNewService({ name: '', price: '', duration: '', specialties: [] });
  };

  const handleEditService = () => {
    if (!editingService || !editingService.name || !editingService.price || !editingService.duration || !editingService.specialties || editingService.specialties.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Todos los campos son obligatorios. Debes seleccionar al menos una especialidad."
      });
      return;
    }

    const serviceDocRef = doc(firestore, 'services', editingService.id);
    updateDocumentNonBlocking(serviceDocRef, {
      name: editingService.name,
      price: Number(editingService.price),
      duration: Number(editingService.duration),
      specialties: editingService.specialties,
    });

    toast({
      title: "Servicio Actualizado",
      description: `El servicio "${editingService.name}" ha sido actualizado.`
    });

    setEditDialogOpen(false);
    setEditingService(null);
  };

  const handleToggleStatus = (service: any) => {
    const newStatus = service.status === 'activo' ? 'inactivo' : 'activo';
    const serviceDocRef = doc(firestore, 'services', service.id);
    
    updateDocumentNonBlocking(serviceDocRef, { status: newStatus });

    toast({
      title: newStatus === 'activo' ? "Servicio Activado" : "Servicio Desactivado",
      description: `El servicio "${service.name}" ahora está ${newStatus}.`
    });
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
                <div className="space-y-2">
                  <Label htmlFor="service-specialty">Especialidades Médicas Requeridas</Label>
                  <div className="border rounded-md p-4 space-y-2 max-h-48 overflow-y-auto">
                    {isLoadingDoctors && (
                      <p className="text-sm text-muted-foreground">Cargando especialidades...</p>
                    )}
                    {!isLoadingDoctors && availableSpecialties.length === 0 && (
                      <p className="text-sm text-muted-foreground">No hay médicos con especialidad registrados</p>
                    )}
                    {availableSpecialties.map((specialty) => (
                      <div key={specialty} className="flex items-center space-x-2">
                        <Checkbox
                          id={`specialty-${specialty}`}
                          checked={newService.specialties.includes(specialty)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setNewService(p => ({...p, specialties: [...p.specialties, specialty]}));
                            } else {
                              setNewService(p => ({...p, specialties: p.specialties.filter(s => s !== specialty)}));
                            }
                          }}
                        />
                        <label
                          htmlFor={`specialty-${specialty}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {specialty}
                        </label>
                      </div>
                    ))}
                  </div>
                  {newService.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {newService.specialties.map((specialty) => (
                        <Badge key={specialty} variant="secondary" className="gap-1">
                          {specialty}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => setNewService(p => ({...p, specialties: p.specialties.filter(s => s !== specialty)}))}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Selecciona las especialidades de los médicos capacitados para dar este servicio
                  </p>
                  {availableSpecialties.length === 0 && !isLoadingDoctors && (
                    <p className="text-xs text-amber-600">
                      No hay médicos con especialidad registrados. Primero registra médicos con su especialidad.
                    </p>
                  )}
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

        {/* Dialog para Editar Servicio */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit />
                Editar Servicio
              </DialogTitle>
              <DialogDescription>
                Modifica los datos del servicio médico.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-service-name">Nombre del Servicio</Label>
                <Input 
                  id="edit-service-name" 
                  placeholder="Ej: Consulta Dermatológica" 
                  value={editingService?.name || ''} 
                  onChange={e => setEditingService((p: any) => ({...p, name: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-service-specialty">Especialidades Médicas Requeridas</Label>
                <div className="border rounded-md p-4 space-y-2 max-h-48 overflow-y-auto">
                  {isLoadingDoctors && (
                    <p className="text-sm text-muted-foreground">Cargando especialidades...</p>
                  )}
                  {!isLoadingDoctors && availableSpecialties.length === 0 && (
                    <p className="text-sm text-muted-foreground">No hay médicos con especialidad registrados</p>
                  )}
                  {availableSpecialties.map((specialty) => (
                    <div key={specialty} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-specialty-${specialty}`}
                        checked={editingService?.specialties?.includes(specialty) || false}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEditingService((p: any) => ({...p, specialties: [...(p.specialties || []), specialty]}));
                          } else {
                            setEditingService((p: any) => ({...p, specialties: (p.specialties || []).filter((s: string) => s !== specialty)}));
                          }
                        }}
                      />
                      <label
                        htmlFor={`edit-specialty-${specialty}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {specialty}
                      </label>
                    </div>
                  ))}
                </div>
                {editingService?.specialties && editingService.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {editingService.specialties.map((specialty: string) => (
                      <Badge key={specialty} variant="secondary" className="gap-1">
                        {specialty}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => setEditingService((p: any) => ({...p, specialties: p.specialties.filter((s: string) => s !== specialty)}))}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Selecciona las especialidades de los médicos capacitados para dar este servicio
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-service-price">Precio (COP)</Label>
                  <Input 
                    id="edit-service-price" 
                    type="number" 
                    placeholder="Ej: 80000" 
                    value={editingService?.price || ''} 
                    onChange={e => setEditingService((p: any) => ({...p, price: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-service-duration">Duración (min)</Label>
                  <Input 
                    id="edit-service-duration" 
                    type="number" 
                    placeholder="Ej: 45" 
                    value={editingService?.duration || ''} 
                    onChange={e => setEditingService((p: any) => ({...p, duration: e.target.value}))} 
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancelar</Button>
              </DialogClose>
              <Button type="submit" onClick={handleEditService}>
                <Edit className="mr-2 h-4 w-4" />
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
                  <TableHead>Especialidades</TableHead>
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
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
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
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {service.specialties && service.specialties.length > 0 ? (
                          service.specialties.map((specialty: string) => (
                            <Badge key={specialty} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))
                        ) : service.specialty ? (
                          <Badge variant="outline" className="text-xs">{service.specialty}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">No especificada</span>
                        )}
                      </div>
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
                          <DropdownMenuItem onClick={() => {
                            // Convert old specialty format to new specialties array format
                            const serviceToEdit = {
                              ...service,
                              specialties: service.specialties || (service.specialty ? [service.specialty] : [])
                            };
                            setEditingService(serviceToEdit);
                            setEditDialogOpen(true);
                          }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar servicio
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                           <DropdownMenuItem 
                             className={service.status === 'activo' ? 'text-destructive focus:text-destructive' : ''}
                             onClick={() => handleToggleStatus(service)}
                           >
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
