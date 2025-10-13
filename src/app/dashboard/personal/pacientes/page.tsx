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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Search, FileText, PlusCircle, Upload, CalendarPlus } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const PatientHistoryDialog = ({ patient }: { patient: any }) => {
    const [newNote, setNewNote] = useState('');
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();

    // Cargar notas de evolución del paciente
    const notesQuery = useMemoFirebase(() => 
        firestore && patient?.id ? query(
            collection(firestore, 'evolution_notes'), 
            where('patientId', '==', patient.id)
        ) : null, 
        [firestore, patient?.id]
    );
    const { data: evolutionNotes, isLoading: isLoadingNotes } = useCollection(notesQuery);

    // Ordenar notas por fecha en el cliente (más recientes primero)
    const sortedNotes = evolutionNotes?.slice().sort((a: any, b: any) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    }) || [];

    const handleSaveNote = async () => {
        if (!newNote.trim() || !user) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Debes escribir una nota antes de guardar.",
            });
            return;
        }

        const noteData = {
            patientId: patient.id,
            patientName: patient.displayName,
            doctorId: user.uid,
            doctorName: user.displayName,
            content: newNote.trim(),
            date: new Date().toISOString(),
        };

        try {
            const notesCol = collection(firestore, 'evolution_notes');
            await addDocumentNonBlocking(notesCol, noteData);
            
            // Crear notificación para el paciente
            const notificationsCol = collection(firestore, 'notifications');
            await addDocumentNonBlocking(notificationsCol, {
                userId: patient.id,
                type: 'note_added',
                title: 'Nueva Nota de Evolución',
                message: `El Dr. ${user.displayName} ha agregado una nueva nota de evolución a tu historial clínico.`,
                read: false,
                relatedId: patient.id,
                createdAt: new Date(),
            });
            
            toast({
                title: 'Nota Guardada',
                description: 'La nota de evolución ha sido registrada exitosamente.',
            });
            setNewNote('');
        } catch (error) {
            console.error('Error al guardar nota:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo guardar la nota.",
            });
        }
    };

    return (
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-16 w-16">
                <AvatarImage src={patient.photoURL} />
                <AvatarFallback>
                {patient.displayName?.charAt(0) || 'P'}
                </AvatarFallback>
            </Avatar>
            <div>
                <DialogTitle className="text-2xl">
                {patient.displayName}
                </DialogTitle>
                <DialogDescription>
                 {patient.email}
                </DialogDescription>
            </div>
        </div>
      </DialogHeader>
      <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-6">
        <div>
            <h3 className="text-lg font-semibold mb-2">
                Notas de Evolución
            </h3>
            <div className="space-y-4">
                {isLoadingNotes && [...Array(2)].map((_, i) => (
                    <div key={i} className="p-3 bg-muted/50 rounded-lg border">
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-3 w-full mb-1" />
                        <Skeleton className="h-3 w-2/3" />
                    </div>
                ))}
                {!isLoadingNotes && sortedNotes.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded-lg">
                        No hay notas de evolución registradas para este paciente.
                    </p>
                )}
                {sortedNotes.map((note: any) => (
                    <div
                        key={note.id}
                        className="p-3 bg-muted/50 rounded-lg border text-sm"
                    >
                        <p className="font-semibold">{format(new Date(note.date), 'PPP', { locale: es })}</p>
                        <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{note.content}</p>
                        <p className="text-xs text-right text-muted-foreground mt-1">
                        - {note.doctorName}
                        </p>
                    </div>
                ))}
            </div>
            <Card className="mt-4">
                <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <PlusCircle className="h-5 w-5" /> Agregar Nueva Nota de Evolución
                </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                <Textarea 
                    placeholder="Escribe la nueva nota médica aquí..." 
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={4}
                />
                <div className="flex justify-end">
                    <Button onClick={handleSaveNote}>Guardar Nota</Button>
                </div>
                </CardContent>
            </Card>
        </div>

        <div>
            <h3 className="text-lg font-semibold mb-2">
                Documentos Adjuntos
            </h3>
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted p-6 text-center">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                    Arrastra y suelta archivos o haz clic para subirlos.
                </p>
                <Button asChild variant="outline" size="sm">
                    <label htmlFor="file-upload">
                    Seleccionar Archivo
                    <input id="file-upload" type="file" className="sr-only" />
                    </label>
                </Button>
            </div>
        </div>
      </div>
    </DialogContent>
)};



export default function PacientesPage() {
  const firestore = useFirestore();

  const patientsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), where('role', '==', 'PACIENTE')) : null, [firestore]);
  const { data: patients, isLoading: isLoadingPatients } = useCollection(patientsQuery);

  return (
    <>
      <Header />
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-headline">
            Gestión de Pacientes
          </h1>
          <p className="text-muted-foreground">
            Busca y accede a las historias clínicas de tus pacientes.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar paciente por nombre o documento..."
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingPatients && [...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-40" />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-9 w-28" />
                        <Skeleton className="h-9 w-36" />
                    </div>
                </div>
            ))}
            {patients?.map((patient: any) => (
              <Dialog key={patient.id}>
                <div
                    className="flex items-center justify-between p-4 rounded-lg border"
                >
                    <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={patient.photoURL} />
                            <AvatarFallback>{patient.displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{patient.displayName}</p>
                            <p className="text-sm text-muted-foreground">
                            {patient.email}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                <FileText className="mr-2 h-4 w-4" />
                                Ver Historia
                            </Button>
                        </DialogTrigger>
                        <Button asChild variant="secondary" size="sm">
                          <Link href="/dashboard/personal/citas">
                            <CalendarPlus className="mr-2 h-4 w-4" />
                            Programar Cita
                          </Link>
                        </Button>
                    </div>
                </div>
                <PatientHistoryDialog patient={patient} />
              </Dialog>
            ))}
             {!isLoadingPatients && patients?.length === 0 && (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">No se encontraron pacientes</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Aún no hay pacientes registrados en el sistema.
                    </p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
