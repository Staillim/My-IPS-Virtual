"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AtSign, Lock, Phone, User, MapPin, ExternalLink, Shield } from "lucide-react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Logo } from "@/components/logo";
import { colombianData } from "@/lib/colombia-data";
import { useAuth, useFirestore } from "@/firebase";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";

const formSchema = z
  .object({
    firstName: z.string().min(1, "El nombre es obligatorio"),
    lastName: z.string().min(1, "El apellido es obligatorio"),
    email: z.string().email("Dirección de correo electrónico no válida"),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string(),
    phone: z.string().min(1, "El número de teléfono es obligatorio"),
    departmentId: z.string().min(1, "El departamento es obligatorio"),
    cityId: z.string().min(1, "La ciudad es obligatoria"),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "Debes aceptar los términos y condiciones para continuar",
    }),
    acceptDataTreatment: z.boolean().refine((val) => val === true, {
      message: "Debes autorizar el tratamiento de datos personales",
    }),
    acceptSensitiveData: z.boolean().refine((val) => val === true, {
      message: "Debes autorizar el tratamiento de datos sensibles de salud",
    }),
    acceptPromotions: z.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export default function SignUpPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      departmentId: "",
      cityId: "",
      acceptTerms: false,
      acceptDataTreatment: false,
      acceptSensitiveData: false,
      acceptPromotions: false,
    },
  });

  const selectedDepartment = form.watch("departmentId");

  useEffect(() => {
    if (selectedDepartment) {
        const department = colombianData.find(
            (d) => d.id === selectedDepartment
        );
        const cityOptions = department ? department.cities.map(city => ({ id: city, name: city })).sort((a, b) => a.name.localeCompare(b.name)) : [];
        setCities(cityOptions);
        form.setValue("cityId", "");
    } else {
        setCities([]);
    }
  }, [selectedDepartment, form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const user = userCredential.user;
      
      const displayName = `${values.firstName} ${values.lastName}`.trim();
      await updateProfile(user, { displayName });

      const userDocRef = doc(firestore, "users", user.uid);
      const userData = {
        id: user.uid,
        firstName: values.firstName,
        lastName: values.lastName,
        displayName: displayName,
        email: values.email,
        phoneNumber: values.phone,
        departmentId: values.departmentId,
        cityId: values.cityId,
        role: "PACIENTE",
        privacyConsent: {
          acceptedTerms: values.acceptTerms,
          acceptedDataTreatment: values.acceptDataTreatment,
          acceptedSensitiveData: values.acceptSensitiveData,
          acceptedPromotions: values.acceptPromotions || false,
          consentDate: new Date().toISOString(),
          ipAddress: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
        },
      };
      setDocumentNonBlocking(userDocRef, userData, { merge: true });

      const roleDocRef = doc(firestore, "paciente_roles", user.uid);
      setDocumentNonBlocking(roleDocRef, { userId: user.uid }, { merge: true });

      toast({
        title: "¡Cuenta Creada!",
        description: "Tu cuenta ha sido creada exitosamente.",
      });

      router.push("/dashboard");
    } catch (error: any) {
      console.error("Error al crear la cuenta:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Ocurrió un error al crear la cuenta.",
      });
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="inline-block mx-auto">
            <Logo />
          </div>
          <CardTitle className="text-3xl font-bold">Crear una Cuenta</CardTitle>
          <CardDescription>
            ¡Únete a nuestra comunidad! Es rápido y fácil.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <FormControl>
                          <Input placeholder="John" className="pl-10" {...field} />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido</FormLabel>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <FormControl>
                          <Input placeholder="Doe" className="pl-10" {...field} />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <FormControl>
                        <Input type="email" placeholder="tu.email@ejemplo.com" className="pl-10" {...field} />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <FormControl>
                          <Input type="password" placeholder="••••••••" className="pl-10" {...field} />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Contraseña</FormLabel>
                       <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <FormControl>
                          <Input type="password" placeholder="••••••••" className="pl-10" {...field} />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
               <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Teléfono</FormLabel>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <FormControl>
                          <Input type="tel" placeholder="300 123 4567" className="pl-10" {...field} />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departamento</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Selecciona un departamento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <ScrollArea className="h-72">
                            {colombianData.map((d) => (
                              <SelectItem key={d.id} value={d.id}>
                                {d.department}
                              </SelectItem>
                            ))}
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ciudad</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={cities.length === 0}>
                        <FormControl>
                           <SelectTrigger>
                            <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Selecciona una ciudad" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           <ScrollArea className="h-72">
                            {cities.map((city) => (
                              <SelectItem key={city.id} value={city.id}>
                                {city.name}
                              </SelectItem>
                            ))}
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Sección de Términos y Condiciones */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Shield className="h-4 w-4" />
                  <span>Autorizaciones Legales</span>
                </div>

                {/* Aceptación de Términos y Condiciones */}
                <FormField
                  control={form.control}
                  name="acceptTerms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-xs font-normal cursor-pointer">
                          Acepto los{" "}
                          <Link 
                            href="/terminos-condiciones" 
                            target="_blank"
                            className="text-primary hover:underline font-semibold inline-flex items-center gap-1"
                          >
                            Términos y Condiciones
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                          {" "}<span className="text-destructive">*</span>
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                {/* Autorización de Tratamiento de Datos Personales */}
                <FormField
                  control={form.control}
                  name="acceptDataTreatment"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-xs font-normal cursor-pointer">
                          Autorizo el tratamiento de mis datos personales según Ley 1581/2012 para servicios de salud, gestión administrativa y comunicaciones
                          {" "}<span className="text-destructive">*</span>
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                {/* Autorización de Datos Sensibles de Salud */}
                <FormField
                  control={form.control}
                  name="acceptSensitiveData"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-xs font-normal cursor-pointer">
                          Autorizo el tratamiento de mis datos sensibles de salud (historia clínica, diagnósticos) para finalidades asistenciales y administrativas
                          {" "}<span className="text-destructive">*</span>
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                {/* Comunicaciones Promocionales (Opcional) */}
                <FormField
                  control={form.control}
                  name="acceptPromotions"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-xs font-normal cursor-pointer text-muted-foreground">
                          (Opcional) Acepto recibir promociones y novedades
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <p className="text-xs text-muted-foreground italic pt-2">
                  <span className="text-destructive">*</span> Obligatorio. Derechos ARCO: datospersonales@ipsvirtual.com.co
                </p>
              </div>

              <Button type="submit" className="w-full !mt-8 bg-accent text-accent-foreground hover:bg-accent/90" disabled={form.formState.isSubmitting}>
                Crear Cuenta
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-center block">
          <p className="text-sm text-muted-foreground">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Inicia Sesión
            </Link>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
