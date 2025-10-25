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
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Stethoscope, Clock, BadgeCheck } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

const serviceIcons: { [key: string]: React.ElementType } = {
  'Consulta General': Stethoscope,
  'Consulta Pediátrica': Stethoscope,
  'Consulta Cardiológica': Stethoscope,
  'Consulta Dermatológica': Stethoscope,
  'Certificado Médico': BadgeCheck,
  'Psicología': Stethoscope
};

export default function ServiciosPage() {

  const firestore = useFirestore();
  const servicesCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, 'services') : null, [firestore]);
  const { data: allServices, isLoading: isLoadingServices } = useCollection(servicesCollectionRef);

  // Filter only active services for patients
  const services = allServices?.filter(service => service.status === 'activo' || !service.status);


  return (
    <>
      <Header />
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold font-headline">
            Catálogo de Servicios Médicos
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-2">
            Explora los servicios que ofrecemos, pensados para cubrir todas tus
            necesidades de salud.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoadingServices && [...Array(3)].map((_, i) => (
             <Card key={i} className="flex flex-col">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className='space-y-2'>
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
                <CardFooter className="flex justify-between items-center bg-muted/30 p-4 border-t">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-10 w-24" />
                </CardFooter>
            </Card>
          ))}
          {services?.map((service: any) => {
            const Icon = serviceIcons[service.name] || Stethoscope;
            return (
              <Card
                key={service.id}
                className="flex flex-col hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{service.name}</CardTitle>
                      <CardDescription>
                        Atención médica especializada.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Obtén atención de calidad con nuestros especialistas. Este
                    servicio está diseñado para ofrecerte un diagnóstico preciso y
                    un plan de tratamiento adecuado.
                  </p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="mr-2 h-4 w-4" />
                    <span>Duración estimada: {service.duration} minutos</span>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center bg-muted/30 p-4 border-t">
                  <p className="text-lg font-bold text-primary">
                    ${new Intl.NumberFormat('es-CO').format(service.price)}
                  </p>
                  <Button asChild>
                    <Link href="/dashboard/citas">Agendar</Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}
