
'use client';

import { Header } from '@/components/header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  CalendarCheck,
  ClipboardList,
  PlusCircle,
  Video,
  ArrowRight,
  Users,
} from 'lucide-react';
import Link from 'next/link';

type Appointment = {
  time: string;
  patient: string;
  type: string;
  avatar: string;
};

const upcomingAppointments: Appointment[] = [];

export default function PersonalDashboardPage() {
  return (
    <>
      <Header />
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold font-headline mb-2">
              Bienvenido, Dr.
            </h1>
            <p className="text-muted-foreground">
              Aquí tienes un resumen de tu jornada y acceso rápido a tus
              herramientas.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Citas para Hoy</CardTitle>
              <CardDescription>
                Tienes {upcomingAppointments.length} citas programadas para el
                día de hoy.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingAppointments.length > 0 ? (
                  upcomingAppointments.map((cita, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={cita.avatar} />
                          <AvatarFallback>
                            {cita.patient.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{cita.patient}</p>
                          <p className="text-sm text-muted-foreground">
                            {cita.time} - Consulta {cita.type}
                          </p>
                        </div>
                      </div>
                      <Button variant="secondary" size="sm">
                        Iniciar Consulta
                        {cita.type === 'virtual' && (
                          <Video className="ml-2 h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No tienes citas programadas para hoy.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-2xl font-semibold font-headline mb-4">
              Acciones Rápidas
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <Link href="/dashboard/personal/citas">
                <Card className="h-full flex flex-col justify-between p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Gestionar Citas</h3>
                      <p className="text-sm text-muted-foreground">
                        Ver calendario completo.
                      </p>
                    </div>
                    <CalendarCheck className="h-8 w-8 text-muted-foreground" />
                  </div>
                </Card>
              </Link>
              <Link href="/dashboard/personal/pacientes">
                <Card className="h-full flex flex-col justify-between p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Pacientes</h3>
                      <p className="text-sm text-muted-foreground">
                        Buscar historiales clínicos.
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                </Card>
              </Link>
              <Card className="h-full flex flex-col justify-between p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Nueva Fórmula</h3>
                    <p className="text-sm text-muted-foreground">
                      Emitir una receta médica.
                    </p>
                  </div>
                  <PlusCircle className="h-8 w-8 text-muted-foreground" />
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
