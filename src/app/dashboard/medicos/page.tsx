
'use client';

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Stethoscope, MapPin, Video, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useMemo } from 'react';

const cities = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla'];

export default function MedicosPage() {
  const firestore = useFirestore();
  
  // Estados para los filtros
  const [searchName, setSearchName] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('todas');
  const [selectedCity, setSelectedCity] = useState('todas');
  const [selectedConsultationType, setSelectedConsultationType] = useState('cualquiera');

  const doctorsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), where('role', 'not-in', ['PACIENTE', 'ADMIN'])) : null, [firestore]);
  const { data: doctors, isLoading: isLoadingDoctors } = useCollection(doctorsQuery);

  const specialties = doctors 
    ? [...new Set(doctors.map((doc: any) => doc.specialty))].filter(Boolean).sort()
    : [];

  // Filtrar médicos según los criterios seleccionados
  const filteredDoctors = useMemo(() => {
    if (!doctors) return [];

    return doctors.filter((doctor: any) => {
      // Filtro por nombre
      if (searchName.trim() !== '') {
        const searchLower = searchName.toLowerCase();
        const fullName = doctor.displayName?.toLowerCase() || '';
        if (!fullName.includes(searchLower)) {
          return false;
        }
      }

      // Filtro por especialidad
      if (selectedSpecialty !== 'todas' && doctor.specialty !== selectedSpecialty) {
        return false;
      }

      // Filtro por ciudad
      if (selectedCity !== 'todas' && doctor.city !== selectedCity) {
        return false;
      }

      // Filtro por tipo de consulta (si el doctor tiene esta información)
      if (selectedConsultationType !== 'cualquiera') {
        // Asumiendo que el doctor tiene un campo que indica qué tipos de consulta ofrece
        if (selectedConsultationType === 'virtual' && !doctor.offersVirtual) {
          return false;
        }
        if (selectedConsultationType === 'presencial' && !doctor.offersInPerson) {
          return false;
        }
      }

      return true;
    });
  }, [doctors, searchName, selectedSpecialty, selectedCity, selectedConsultationType]);

  // Función para limpiar filtros
  const clearFilters = () => {
    setSearchName('');
    setSelectedSpecialty('todas');
    setSelectedCity('todas');
    setSelectedConsultationType('cualquiera');
  };

  return (
    <>
      <Header />
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-headline">Médicos Disponibles</h1>
          <p className="text-muted-foreground">
            Encuentra y agenda una cita con el especialista que necesitas.
          </p>
        </div>

        <Card className="mb-8 shadow-sm">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Filtrar Médicos</CardTitle>
              {(searchName || selectedSpecialty !== 'todas' || selectedCity !== 'todas' || selectedConsultationType !== 'cualquiera') && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Limpiar Filtros
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar por nombre</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="Ej: Dr. Pérez" 
                  className="pl-10" 
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Especialidad</label>
              <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                <SelectTrigger>
                  <Stethoscope className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {specialties.map((spec: any) => (
                    <SelectItem key={spec} value={spec}>
                      {spec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ciudad</label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger>
                  <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Medio de Atención</label>
              <Select value={selectedConsultationType} onValueChange={setSelectedConsultationType}>
                <SelectTrigger>
                  <Video className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Cualquiera" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cualquiera">Cualquiera</SelectItem>
                  <SelectItem value="virtual">Virtual</SelectItem>
                  <SelectItem value="presencial">Presencial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Mostrar filtros activos */}
        {(searchName || selectedSpecialty !== 'todas' || selectedCity !== 'todas' || selectedConsultationType !== 'cualquiera') && (
          <div className="mb-6 flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-muted-foreground">Filtros activos:</span>
            {searchName && (
              <Badge variant="secondary" className="gap-1">
                Nombre: "{searchName}"
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => setSearchName('')}
                />
              </Badge>
            )}
            {selectedSpecialty !== 'todas' && (
              <Badge variant="secondary" className="gap-1">
                {selectedSpecialty}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => setSelectedSpecialty('todas')}
                />
              </Badge>
            )}
            {selectedCity !== 'todas' && (
              <Badge variant="secondary" className="gap-1">
                {selectedCity}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => setSelectedCity('todas')}
                />
              </Badge>
            )}
            {selectedConsultationType !== 'cualquiera' && (
              <Badge variant="secondary" className="gap-1">
                {selectedConsultationType === 'virtual' ? 'Virtual' : 'Presencial'}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => setSelectedConsultationType('cualquiera')}
                />
              </Badge>
            )}
          </div>
        )}

        <div className="mb-4 flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {isLoadingDoctors 
              ? 'Cargando médicos...' 
              : `Mostrando ${filteredDoctors.length} de ${doctors?.length || 0} médicos`
            }
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoadingDoctors && [...Array(4)].map((_, i) => (
            <Card key={i} className="flex flex-col text-center items-center p-6 space-y-4">
              <Skeleton className="w-24 h-24 rounded-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full" />
            </Card>
          ))}
          
          {!isLoadingDoctors && filteredDoctors.length === 0 && (
            <div className="col-span-full text-center py-16 border-2 border-dashed rounded-lg">
              <Stethoscope className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No se encontraron médicos</h3>
              <p className="text-sm text-muted-foreground mb-4">
                No hay médicos que coincidan con los filtros seleccionados.
              </p>
              {(searchName || selectedSpecialty !== 'todas' || selectedCity !== 'todas' || selectedConsultationType !== 'cualquiera') && (
                <Button variant="outline" onClick={clearFilters}>
                  Limpiar Filtros
                </Button>
              )}
            </div>
          )}
          
          {!isLoadingDoctors && filteredDoctors.map((doctor: any) => (
            <Card
              key={doctor.id}
              className="flex flex-col text-center items-center hover:shadow-xl transition-shadow"
            >
              <CardHeader className="p-6">
                <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-primary/20">
                  <AvatarImage
                    src={doctor.photoURL}
                    alt={`Foto de ${doctor.displayName}`}
                  />
                  <AvatarFallback>{doctor.displayName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <CardTitle>{doctor.displayName}</CardTitle>
                <CardDescription>{doctor.specialty}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">
                  {doctor.city && <span className="block mb-1">📍 {doctor.city}</span>}
                  Disponible para consultas virtuales y presenciales.
                </p>
              </CardContent>
              <CardFooter className="w-full p-4">
                <Button asChild className="w-full">
                  <Link href="/dashboard/citas">Agendar Cita</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
