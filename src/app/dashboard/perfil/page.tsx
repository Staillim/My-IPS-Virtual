"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useEffect, useState, useRef } from "react";
import { AtSign, Phone, User, MapPin, Camera, Upload, Eye, File as FileIcon, Trash2, Award, Briefcase, Lock } from "lucide-react";
import { doc } from "firebase/firestore";
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import Link from 'next/link';

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { colombianData } from "@/lib/colombia-data";
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from "@/firebase";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from 'next/image';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const profileSchema = z.object({
  firstName: z.string().min(1, "El nombre es obligatorio"),
  lastName: z.string().min(1, "El apellido es obligatorio"),
  email: z.string().email("Dirección de correo electrónico no válida"),
  phoneNumber: z.string().min(1, "El número de teléfono es obligatorio"),
  departmentId: z.string().min(1, "El departamento es obligatorio"),
  cityId: z.string().min(1, "La ciudad es obligatoria"),
  address: z.string().optional(),
  age: z.string().optional(),
  bloodType: z.string().optional(),
  allergies: z.string().optional(),
  specialty: z.string().optional(),
  professionalRegistration: z.string().optional(),
  attentionMethods: z.array(z.string()).optional(),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(1, "La contraseña actual es obligatoria."),
    newPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres."),
    confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"]
});

export default function ProfilePage() {
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadedDocument, setUploadedDocument] = useState<{name: string; data: string; type: string} | null>(null);
  const [professionalDocument, setProfessionalDocument] = useState<{name: string; data: string; type: string} | null>(null);


  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      departmentId: "",
      cityId: "",
      address: "",
      age: "",
      bloodType: "",
      allergies: "",
      specialty: "",
      professionalRegistration: "",
      attentionMethods: [],
    },
  });
  
   const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    }
  });

  useEffect(() => {
    if (userData) {
      form.reset({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phoneNumber: userData.phoneNumber || '',
        departmentId: userData.departmentId || '',
        cityId: userData.cityId || '',
        address: userData.address || '',
        age: userData.age || '',
        bloodType: userData.bloodType || '',
        allergies: userData.allergies || '',
        specialty: userData.specialty || "",
        professionalRegistration: userData.professionalRegistration || "",
        attentionMethods: userData.attentionMethods || [],
      });
      if(userData.photoURL) {
        setAvatarPreview(userData.photoURL);
      }
      if(userData.document) {
        setUploadedDocument(userData.document);
      }
       if(userData.professionalDocument) {
        setProfessionalDocument(userData.professionalDocument);
      }
    }
  }, [userData, form]);

  const selectedDepartment = form.watch("departmentId");

  useEffect(() => {
    if (selectedDepartment) {
      const department = colombianData.find(
        (d) => d.id === selectedDepartment
      );
      const cityOptions = department ? department.cities.map(city => ({ id: city, name: city })).sort((a, b) => a.name.localeCompare(b.name)) : [];
      setCities(cityOptions);

      const currentCityId = form.getValues("cityId");
      if (department && !department.cities.includes(currentCityId)) {
          form.setValue("cityId", "");
      }
    } else {
        setCities([]);
    }
  }, [selectedDepartment, form]);

  
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setAvatarPreview(base64String);
      try {
        if (userDocRef) {
            setDocumentNonBlocking(userDocRef, { photoURL: base64String }, { merge: true });
        }
        toast({
          title: "Foto de perfil actualizada",
          description: "Tu nueva foto de perfil ha sido guardada.",
        });
      } catch (error) {
        console.error("Error updating profile picture:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo actualizar la foto de perfil.",
        });
      }
    };
    reader.readAsDataURL(file);
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'personal' | 'professional') => {
    const file = event.target.files?.[0];
    if (!file || !userDocRef) return;

    setIsUploading(true);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const docData = { name: file.name, data: base64String, type: file.type };
      
      if(type === 'personal') {
        setUploadedDocument(docData);
        setDocumentNonBlocking(userDocRef, { document: docData }, { merge: true });
      } else {
        setProfessionalDocument(docData);
        setDocumentNonBlocking(userDocRef, { professionalDocument: docData }, { merge: true });
      }
      
      setIsUploading(false);
      toast({
        title: 'Documento Subido',
        description: `${file.name} se ha subido correctamente.`,
      });
    };
    reader.onerror = () => {
        console.error('Error al leer el archivo');
        setIsUploading(false);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No se pudo leer el archivo.',
        });
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteDocument = (type: 'personal' | 'professional') => {
    if(!userDocRef) return;
    if(type === 'personal') {
        setDocumentNonBlocking(userDocRef, { document: null }, { merge: true });
        setUploadedDocument(null);
    } else {
        setDocumentNonBlocking(userDocRef, { professionalDocument: null }, { merge: true });
        setProfessionalDocument(null);
    }
    toast({
        title: 'Documento Eliminado',
        description: 'El documento ha sido eliminado.',
      });
  }

  function onSubmit(values: z.infer<typeof profileSchema>) {
    if (!userDocRef) return;
    
    const dataToUpdate = {
        ...values,
        displayName: `${values.firstName} ${values.lastName}`.trim(),
    };

    if(auth.currentUser) {
        updateProfile(auth.currentUser, {
            displayName: dataToUpdate.displayName
        });
    }

    setDocumentNonBlocking(userDocRef, dataToUpdate, { merge: true });
    
    toast({
      title: "Perfil Actualizado",
      description: "Tu información ha sido guardada exitosamente.",
    });
  }
  
  async function onPasswordSubmit(values: z.infer<typeof passwordSchema>) {
    if(!user || !user.email) return;

    try {
        const credential = EmailAuthProvider.credential(user.email, values.currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, values.newPassword);

        toast({
            title: "Contraseña Actualizada",
            description: "Tu contraseña ha sido cambiada exitosamente.",
        });
        passwordForm.reset();
    } catch (error: any) {
         toast({
            variant: "destructive",
            title: "Error",
            description: "La contraseña actual es incorrecta o ha ocurrido un error.",
        });
    }
  }


  const isPersonalRole = userData?.role !== "PACIENTE" && userData?.role !== "ADMIN";
  const attentionMethods = [
    { id: 'chat', label: 'Chat' },
    { id: 'call', label: 'Llamada' },
    { id: 'video', label: 'Videollamada' },
  ];

  if (isUserLoading || isUserDataLoading) {
    return (
      <>
        <Header />
        <div className="container mx-auto py-10">
            <div className="mx-auto max-w-2xl">
                <Skeleton className="h-8 w-1/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-8" />
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                     <div className="flex justify-end">
                        <Skeleton className="h-10 w-32" />
                    </div>
                </div>
            </div>
        </div>
        </>
    )
  }

  return (
    <>
      <Header />
      <div className="container mx-auto py-10">
        <div className="mx-auto max-w-2xl space-y-8">
          <div>
            <h1 className="text-3xl font-bold font-headline mb-2">Mi Perfil</h1>
            <p className="text-muted-foreground mb-8">
              Ve y administra tu información personal y profesional.
            </p>
          </div>

          <div className="flex flex-col items-center space-y-4 mb-8">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarPreview || undefined} alt="Foto de perfil" />
                <AvatarFallback>
                  <User className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                size="icon"
                className="absolute bottom-0 right-0 rounded-full"
                onClick={handleAvatarClick}
              >
                <Camera className="h-4 w-4" />
                <span className="sr-only">Cambiar foto de perfil</span>
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/png, image/jpeg, image/gif"
              />
            </div>
            <div className="text-center">
                <h2 className="text-2xl font-bold">{user?.displayName || `${form.getValues('firstName')} ${form.getValues('lastName')}`}</h2>
                <p className="text-muted-foreground">{user?.email}</p>
                 {isPersonalRole && <Badge className="mt-2">{userData?.specialty || "Sin especialidad"}</Badge>}
            </div>
          </div>


          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Datos Personales
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
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
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
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
                            <Input type="email" className="pl-10" {...field} readOnly />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Teléfono</FormLabel>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <FormControl>
                            <Input type="tel" className="pl-10" {...field} />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Edad</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="Ej: 34" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bloodType"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Grupo Sanguíneo</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="grid grid-cols-4 gap-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="A+" id="a-pos" />
                                <Label htmlFor="a-pos" className="cursor-pointer">A+</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="A-" id="a-neg" />
                                <Label htmlFor="a-neg" className="cursor-pointer">A-</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="B+" id="b-pos" />
                                <Label htmlFor="b-pos" className="cursor-pointer">B+</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="B-" id="b-neg" />
                                <Label htmlFor="b-neg" className="cursor-pointer">B-</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="AB+" id="ab-pos" />
                                <Label htmlFor="ab-pos" className="cursor-pointer">AB+</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="AB-" id="ab-neg" />
                                <Label htmlFor="ab-neg" className="cursor-pointer">AB-</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="O+" id="o-pos" />
                                <Label htmlFor="o-pos" className="cursor-pointer">O+</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="O-" id="o-neg" />
                                <Label htmlFor="o-neg" className="cursor-pointer">O-</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="allergies"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Alergias Conocidas</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Penicilina" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="departmentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Departamento</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value || ""} 
                            defaultValue={field.value}
                          >
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
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ""}
                            defaultValue={field.value}
                            disabled={cities.length === 0}
                          >
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
                  
                  {/* Campo de Dirección */}
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dirección</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ej: Calle 123 #45-67, Apto 101" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
            </Card>

            {isPersonalRole && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Briefcase className="h-5 w-5" />
                           Datos Profesionales
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         <FormField
                            control={form.control}
                            name="specialty"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                <FormLabel>Categoría o Especialidad</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                      onValueChange={field.onChange}
                                      value={field.value}
                                      className="flex flex-col space-y-2"
                                    >
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Médico general" id="medico-general" />
                                        <Label htmlFor="medico-general" className="cursor-pointer font-normal">Médico general</Label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Pediatra" id="pediatra" />
                                        <Label htmlFor="pediatra" className="cursor-pointer font-normal">Pediatra</Label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Psicólogo" id="psicologo" />
                                        <Label htmlFor="psicologo" className="cursor-pointer font-normal">Psicólogo</Label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Certificador médico" id="certificador" />
                                        <Label htmlFor="certificador" className="cursor-pointer font-normal">Certificador médico</Label>
                                      </div>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="professionalRegistration"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Número de Registro Profesional</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ej: 123456789" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="attentionMethods"
                            render={() => (
                                <FormItem>
                                <FormLabel>Medios de Atención Disponibles</FormLabel>
                                <div className="space-y-2">
                                {attentionMethods.map((item) => (
                                    <FormField
                                    key={item.id}
                                    control={form.control}
                                    name="attentionMethods"
                                    render={({ field }) => {
                                        return (
                                        <FormItem
                                            key={item.id}
                                            className="flex flex-row items-start space-x-3 space-y-0"
                                        >
                                            <FormControl>
                                            <Checkbox
                                                checked={field.value?.includes(item.id)}
                                                onCheckedChange={(checked) => {
                                                return checked
                                                    ? field.onChange([...(field.value ?? []), item.id])
                                                    : field.onChange(
                                                        field.value?.filter(
                                                        (value) => value !== item.id
                                                        )
                                                    )
                                                }}
                                            />
                                            </FormControl>
                                            <FormLabel className="font-normal">
                                            {item.label}
                                            </FormLabel>
                                        </FormItem>
                                        )
                                    }}
                                    />
                                ))}
                                </div>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
            )}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                  disabled={form.formState.isSubmitting}
                >
                  Actualizar Perfil
                </Button>
              </div>
            </form>
          </Form>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Mis Documentos
              </CardTitle>
              <CardDescription>
                Sube y administra documentos importantes como tu documento de identidad.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {uploadedDocument ? (
                 <div className="space-y-4">
                  <div className="rounded-lg border bg-muted/20 p-4">
                    {uploadedDocument.type.startsWith('image/') ? (
                      <div className="relative w-full h-96">
                        <Image
                          src={uploadedDocument.data}
                          alt={`Vista previa de ${uploadedDocument.name}`}
                          layout="fill"
                          objectFit="contain"
                          className="rounded-md"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-4">
                         <FileIcon className="h-16 w-16 text-muted-foreground mb-4" />
                         <p className="font-semibold">{uploadedDocument.name}</p>
                         <p className="text-sm text-muted-foreground mb-4">No se puede previsualizar este tipo de archivo.</p>
                         <Button asChild>
                            <Link href={uploadedDocument.data} target="_blank" rel="noopener noreferrer">
                                <Eye className="mr-2 h-4 w-4" /> Ver Documento
                            </Link>
                         </Button>
                      </div>
                    )}
                  </div>
                   <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                        <FileIcon className="h-6 w-6 text-muted-foreground" />
                        <span className="text-sm font-medium truncate max-w-xs">{uploadedDocument.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={uploadedDocument.data} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-5 w-5" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteDocument('personal')}>
                          <Trash2 className="h-5 w-5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-muted p-8 text-center">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No has subido ningún documento.
                  </p>
                  <Button asChild variant="outline">
                    <label htmlFor="file-upload-personal">
                      {isUploading ? 'Procesando...' : 'Seleccionar Archivo'}
                      <input
                        id="file-upload-personal"
                        name="file-upload-personal"
                        type="file"
                        className="sr-only"
                        onChange={(e) => handleFileUpload(e, 'personal')}
                        disabled={isUploading}
                        accept="image/png, image/jpeg, application/pdf"
                      />
                    </label>
                  </Button>
                </div>
              )}
               <p className="text-xs text-muted-foreground mt-2">
                Archivos permitidos: PDF, PNG, JPG. Tamaño máximo: 5MB.
              </p>
            </CardContent>
          </Card>

          {isPersonalRole && (
             <Card>
                <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Certificación Profesional
                </CardTitle>
                <CardDescription>
                    Sube tu título o tarjeta profesional para completar tu perfil.
                </CardDescription>
                </CardHeader>
                <CardContent>
                {professionalDocument ? (
                 <div className="space-y-4">
                  <div className="rounded-lg border bg-muted/20 p-4">
                    {professionalDocument.type.startsWith('image/') ? (
                      <div className="relative w-full h-96">
                        <Image
                          src={professionalDocument.data}
                          alt={`Vista previa de ${professionalDocument.name}`}
                          layout="fill"
                          objectFit="contain"
                          className="rounded-md"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-4">
                         <FileIcon className="h-16 w-16 text-muted-foreground mb-4" />
                         <p className="font-semibold">{professionalDocument.name}</p>
                         <p className="text-sm text-muted-foreground mb-4">No se puede previsualizar este tipo de archivo.</p>
                         <Button asChild>
                            <Link href={professionalDocument.data} target="_blank" rel="noopener noreferrer">
                                <Eye className="mr-2 h-4 w-4" /> Ver Documento
                            </Link>
                         </Button>
                      </div>
                    )}
                  </div>
                   <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                        <FileIcon className="h-6 w-6 text-muted-foreground" />
                        <span className="text-sm font-medium truncate max-w-xs">{professionalDocument.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={professionalDocument.data} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-5 w-5" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteDocument('professional')}>
                          <Trash2 className="h-5 w-5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-muted p-8 text-center">
                        <Upload className="h-10 w-10 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                            Aún no has subido tu certificación profesional.
                        </p>
                        <Button asChild variant="outline">
                            <label htmlFor="file-upload-professional">
                            {isUploading ? 'Procesando...' : 'Seleccionar Archivo'}
                            <input
                                id="file-upload-professional"
                                name="file-upload-professional"
                                type="file"
                                className="sr-only"
                                onChange={(e) => handleFileUpload(e, 'professional')}
                                disabled={isUploading}
                                accept="image/png, image/jpeg, application/pdf"
                            />
                            </label>
                        </Button>
                    </div>
                 )}
                 <p className="text-xs text-muted-foreground mt-2">
                    Archivos permitidos: PDF, PNG, JPG. Tamaño máximo: 5MB.
                </p>
                </CardContent>
            </Card>
          )}
          
            <Card>
                <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Seguridad
                </CardTitle>
                <CardDescription>
                    Administra la seguridad de tu cuenta.
                </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                            <FormField
                                control={passwordForm.control}
                                name="currentPassword"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Contraseña Actual</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={passwordForm.control}
                                name="newPassword"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Nueva Contraseña</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={passwordForm.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <div className="flex justify-end">
                                <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                                    Cambiar Contraseña
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>

        </div>
      </div>
    </>
  );
}
