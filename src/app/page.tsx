'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Stethoscope,
  FileText,
  Clock,
  Shield,
  Heart,
  Video,
  Smartphone,
  Users,
  CheckCircle,
  ArrowRight,
  Star,
  Zap,
  Lock,
  HeartPulse,
  Activity,
  Pill,
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <HeartPulse className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">IPS Virtual</h1>
                <p className="text-xs text-muted-foreground">Salud en Casa</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost">Iniciar Sesión</Button>
              </Link>
              <Link href="/signup">
                <Button>Registrarse</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          <div className="space-y-8">
            <div>
              <Badge variant="secondary" className="mb-4">
                <Zap className="mr-2 h-3 w-3" />
                Atención médica 24/7
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl mb-6">
                Tu salud al alcance de un{' '}
                <span className="text-primary">clic</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Consultas médicas virtuales, gestión de citas, recetas digitales y seguimiento de tu historial clínico. Todo desde la comodidad de tu hogar.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Comenzar Ahora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  <Video className="mr-2 h-5 w-5" />
                  Ver Demo
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-8 pt-4">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="h-8 w-8 rounded-full bg-primary/20 border-2 border-background" />
                  <div className="h-8 w-8 rounded-full bg-primary/30 border-2 border-background" />
                  <div className="h-8 w-8 rounded-full bg-primary/40 border-2 border-background" />
                </div>
                <div className="text-sm">
                  <div className="font-semibold">+5,000 pacientes</div>
                  <div className="text-muted-foreground">atendidos</div>
                </div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="text-sm">
                <div className="flex items-center gap-1 font-semibold">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  4.9/5.0
                </div>
                <div className="text-muted-foreground">Calificación</div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-3xl blur-3xl" />
            <Card className="relative border-2 shadow-2xl">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div>
                      <div className="font-semibold">Consulta Agendada</div>
                      <div className="text-sm text-muted-foreground">Dr. García - Cardiología</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                    <Pill className="h-8 w-8 text-blue-600" />
                    <div>
                      <div className="font-semibold">Fórmula Médica Lista</div>
                      <div className="text-sm text-muted-foreground">3 medicamentos prescritos</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-900">
                    <Activity className="h-8 w-8 text-purple-600" />
                    <div>
                      <div className="font-semibold">Historial Actualizado</div>
                      <div className="text-sm text-muted-foreground">Diagnóstico disponible</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Funcionalidades
          </Badge>
          <h2 className="text-3xl font-bold mb-4">Todo lo que necesitas en un solo lugar</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Gestiona tu salud de manera integral con nuestra plataforma completa
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Agendamiento de Citas</CardTitle>
              <CardDescription>
                Reserva citas con especialistas en minutos. Elige fecha, hora y tipo de consulta según tu conveniencia.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <Video className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Consultas Virtuales</CardTitle>
              <CardDescription>
                Consultas médicas por videollamada desde cualquier lugar. Atención profesional sin salir de casa.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Fórmulas Digitales</CardTitle>
              <CardDescription>
                Recibe tus recetas médicas de forma digital. Descarga, comparte o envía directamente a la farmacia.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <Stethoscope className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Historial Clínico</CardTitle>
              <CardDescription>
                Accede a tu historial médico completo. Diagnósticos, tratamientos y notas de evolución siempre disponibles.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Atención 24/7</CardTitle>
              <CardDescription>
                Servicio disponible todos los días. Agenda citas en cualquier momento y recibe atención cuando la necesites.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Múltiples Especialidades</CardTitle>
              <CardDescription>
                Acceso a diversos especialistas. Cardiología, medicina general, pediatría y más en una sola plataforma.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-secondary/50 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              Beneficios
            </Badge>
            <h2 className="text-3xl font-bold mb-4">¿Por qué elegir IPS Virtual?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Moderniza tu experiencia de atención médica con tecnología de vanguardia
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary mx-auto mb-4">
                <Smartphone className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Fácil de Usar</h3>
              <p className="text-muted-foreground">
                Interfaz intuitiva diseñada para todas las edades. No necesitas conocimientos técnicos.
              </p>
            </div>

            <div className="text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Seguro y Privado</h3>
              <p className="text-muted-foreground">
                Tus datos protegidos con encriptación de nivel bancario. Cumplimos con todas las normativas de salud.
              </p>
            </div>

            <div className="text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary mx-auto mb-4">
                <Zap className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Rápido y Eficiente</h3>
              <p className="text-muted-foreground">
                Agenda citas en segundos. Recibe atención médica sin largas esperas ni desplazamientos.
              </p>
            </div>

            <div className="text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary mx-auto mb-4">
                <Heart className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Atención Personalizada</h3>
              <p className="text-muted-foreground">
                Médicos dedicados que conocen tu historial. Seguimiento continuo de tu salud.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Proceso Simple
          </Badge>
          <h2 className="text-3xl font-bold mb-4">Comienza en 3 pasos</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tu salud está a solo unos clics de distancia
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="relative">
            <div className="absolute -top-4 -left-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
              1
            </div>
            <Card className="pt-8">
              <CardHeader>
                <CardTitle>Regístrate</CardTitle>
                <CardDescription className="text-base">
                  Crea tu cuenta en menos de 2 minutos. Solo necesitas tu información básica y listo.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="relative">
            <div className="absolute -top-4 -left-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
              2
            </div>
            <Card className="pt-8">
              <CardHeader>
                <CardTitle>Agenda tu Cita</CardTitle>
                <CardDescription className="text-base">
                  Elige el especialista, fecha y hora que mejor se ajuste a tu agenda. Confirmación inmediata.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="relative">
            <div className="absolute -top-4 -left-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
              3
            </div>
            <Card className="pt-8">
              <CardHeader>
                <CardTitle>Recibe Atención</CardTitle>
                <CardDescription className="text-base">
                  Conéctate a tu consulta virtual. Recibe diagnóstico, tratamiento y fórmulas médicas digitales.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            ¿Listo para cuidar tu salud de manera diferente?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Únete a miles de pacientes que ya confían en IPS Virtual para su atención médica
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Crear Cuenta Gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
                Ya tengo cuenta
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                  <HeartPulse className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-bold">IPS Virtual</h3>
                  <p className="text-xs text-muted-foreground">Salud en Casa</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Atención médica virtual de calidad para toda Colombia.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Servicios</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/signup" className="hover:text-foreground">Consultas Virtuales</Link></li>
                <li><Link href="/signup" className="hover:text-foreground">Especialidades</Link></li>
                <li><Link href="/signup" className="hover:text-foreground">Fórmulas Médicas</Link></li>
                <li><Link href="/signup" className="hover:text-foreground">Historial Clínico</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Sobre Nosotros</Link></li>
                <li><Link href="#" className="hover:text-foreground">Nuestros Médicos</Link></li>
                <li><Link href="#" className="hover:text-foreground">Blog</Link></li>
                <li><Link href="#" className="hover:text-foreground">Contacto</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Términos y Condiciones</Link></li>
                <li><Link href="#" className="hover:text-foreground">Política de Privacidad</Link></li>
                <li><Link href="#" className="hover:text-foreground">HIPAA Compliance</Link></li>
                <li><Link href="#" className="hover:text-foreground">Cookies</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-12 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} IPS Virtual – Salud en Casa. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
