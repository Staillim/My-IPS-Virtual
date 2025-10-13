
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
import { Stethoscope, MapPin, Video, Search } from 'lucide-react';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

const cities = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla'];

export default function MedicosPage() {
  const firestore = useFirestore();

  const doctorsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), where('role', 'not-in', ['PACIENTE', 'ADMIN'])) : null, [firestore]);
  const { data: doctors, isLoading: isLoadingDoctors } = useCollection(doctorsQuery);

  const specialties = doctors 
    ? [...new Set(doctors.map((doc: any) => doc.specialty))].sort()
    : [];

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
            <CardTitle className="text-xl">Filtrar Médicos</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar por nombre</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input placeholder="Ej: Dr. Pérez" className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Especialidad</label>
              <Select>
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
              <Select>
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
              <Select>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoadingDoctors && [...Array(4)].map((_, i) => (
            <Card key={i} className="flex flex-col text-center items-center p-6 space-y-4">
              <Skeleton className="w-24 h-24 rounded-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full" />
            </Card>
          ))}
          {doctors?.map((doctor: any) => (
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
