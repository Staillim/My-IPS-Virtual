'use client';

import { Header } from '@/components/header';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Users,
  HeartPulse,
  Stethoscope,
  Paperclip,
  Download,
  ClipboardList,
} from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type Diagnosis = {
  date: string;
  diagnosis: string;
  doctor: string;
};

type Consultation = {
  id: string;
  doctor: string;
  specialty: string;
  date: string;
  status: string;
};

type Document = {
  name: string;
  date: string;
  url: string;
};

export default function HistorialPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

  // Cargar notas de evolución del paciente
  const notesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'evolution_notes'),
      where('patientId', '==', user.uid)
    );
  }, [firestore, user]);

  const { data: evolutionNotes, isLoading: isLoadingNotes } = useCollection(notesQuery);

  // Ordenar notas por fecha en el cliente (más recientes primero)
  const sortedNotes = evolutionNotes?.slice().sort((a: any, b: any) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  }) || [];

  // Cargar consultas completadas (appointments con status='completada')
  const consultationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'appointments'),
      where('userId', '==', user.uid),
      where('status', '==', 'completada')
    );
  }, [firestore, user]);

  const { data: consultations, isLoading: isLoadingConsultations } = useCollection(consultationsQuery);

  // Ordenar consultas por fecha (más recientes primero)
  const sortedConsultations = consultations?.slice().sort((a: any, b: any) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  }) || [];

  // Extraer diagnósticos de las consultas completadas
  const diagnoses = sortedConsultations
    .filter((consultation: any) => consultation.diagnosis)
    .map((consultation: any) => ({
      date: consultation.date,
      diagnosis: consultation.diagnosis.description,
      doctor: consultation.doctorName,
      code: consultation.diagnosis.code,
    }));

  const clinicalHistory = {
    patientSummary: {
      name: userData?.displayName || `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || 'Sin nombre',
      age: userData?.age || 0,
      bloodType: userData?.bloodType || 'No especificado',
      allergies: userData?.allergies || 'Ninguna registrada',
    },
    background: {
      personal: [] as string[],
      family: [] as string[],
    },
    diagnoses: diagnoses,
    consultations: sortedConsultations.map((c: any) => ({
      id: c.id,
      doctor: c.doctorName,
      specialty: c.serviceName,
      date: c.date,
      status: c.status,
    })),
    documents: [] as Document[]
  };

  if (isUserLoading || isUserDataLoading) {
    return (
      <>
        <Header />
        <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-4">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-10 w-48" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold font-headline">
              Historial Clínico
            </h1>
            <p className="text-muted-foreground">
              Resumen de tu información médica relevante.
            </p>
          </div>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Descargar Resumen en PDF
          </Button>
        </div>

        <Accordion type="multiple" defaultValue={['item-1', 'item-2', 'item-3', 'item-5']} className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-lg font-semibold">
              <div className="flex items-center gap-3">
                <HeartPulse className="h-5 w-5 text-primary" />
                Resumen del Paciente
              </div>
            </AccordionTrigger>
            <AccordionContent className="pl-4 border-l-2 border-primary/20">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm py-2">
                <div><p className="font-semibold">Nombre:</p><p className="text-muted-foreground">{clinicalHistory.patientSummary.name}</p></div>
                <div><p className="font-semibold">Edad:</p><p className="text-muted-foreground">{clinicalHistory.patientSummary.age} años</p></div>
                <div><p className="font-semibold">Grupo Sanguíneo:</p><p className="text-muted-foreground">{clinicalHistory.patientSummary.bloodType}</p></div>
                <div><p className="font-semibold">Alergias Conocidas:</p><p className="text-muted-foreground">{clinicalHistory.patientSummary.allergies}</p></div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger className="text-lg font-semibold">
               <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                Antecedentes
              </div>
            </AccordionTrigger>
            <AccordionContent className="pl-4 border-l-2 border-primary/20 space-y-4">
               <div>
                  <h4 className="font-semibold text-md mb-2">Antecedentes Personales</h4>
                   <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm">
                      {clinicalHistory.background.personal.length > 0 ? (
                        clinicalHistory.background.personal.map((item, index) => <li key={index}>{item}</li>)
                      ) : (
                        <li className="list-none">No hay antecedentes personales registrados.</li>
                      )}
                  </ul>
               </div>
               <div>
                  <h4 className="font-semibold text-md mb-2">Antecedentes Familiares</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm">
                     {clinicalHistory.background.family.length > 0 ? (
                       clinicalHistory.background.family.map((item, index) => <li key={index}>{item}</li>)
                     ) : (
                       <li className="list-none">No hay antecedentes familiares registrados.</li>
                     )}
                  </ul>
               </div>
            </AccordionContent>
          </AccordionItem>
          
           <AccordionItem value="item-3">
            <AccordionTrigger className="text-lg font-semibold">
               <div className="flex items-center gap-3">
                <Stethoscope className="h-5 w-5 text-primary" />
                Diagnósticos y Consultas
              </div>
            </AccordionTrigger>
            <AccordionContent className="pl-4 border-l-2 border-primary/20 space-y-6">
                <div>
                  <h4 className="font-semibold text-md mb-3">Diagnósticos Recientes</h4>
                  <div className="space-y-2">
                    {isLoadingConsultations && [...Array(2)].map((_, i) => (
                      <div key={i} className="p-3 bg-muted/40 rounded-md space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-32 ml-auto" />
                      </div>
                    ))}
                    {!isLoadingConsultations && clinicalHistory.diagnoses.length > 0 ? (
                      clinicalHistory.diagnoses.map((diag, index) => (
                        <div key={index} className="p-3 bg-muted/40 rounded-md border border-muted space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <p className="text-sm">
                                <span className="font-semibold">{format(new Date(diag.date), 'PPP', { locale: es })}</span>
                              </p>
                              {diag.code && (
                                <Badge variant="outline" className="text-xs mr-2">
                                  CIE-10: {diag.code}
                                </Badge>
                              )}
                              <p className="text-sm text-muted-foreground">{diag.diagnosis}</p>
                            </div>
                            <p className="text-xs text-muted-foreground whitespace-nowrap">Dr. {diag.doctor}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      !isLoadingConsultations && (
                        <p className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded-lg">
                          No hay diagnósticos registrados.
                        </p>
                      )
                    )}
                  </div>
                </div>
                 <div>
                  <h4 className="font-semibold text-md mb-3">Consultas Anteriores</h4>
                   <div className="space-y-2">
                    {isLoadingConsultations && [...Array(2)].map((_, i) => (
                      <div key={i} className="p-2 hover:bg-muted/40 rounded-md space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    ))}
                    {!isLoadingConsultations && clinicalHistory.consultations.length > 0 ? (
                      clinicalHistory.consultations.map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-sm p-3 hover:bg-muted/40 rounded-md border">
                          <div>
                            <p><span className="font-medium">{format(new Date(item.date), 'PPP', { locale: es })}:</span> <span className="text-muted-foreground">Consulta de {item.specialty}</span></p>
                            <p className="text-xs text-muted-foreground mt-1">con {item.doctor}</p>
                          </div>
                          <Badge variant="default">Completada</Badge>
                        </div>
                      ))
                    ) : (
                      !isLoadingConsultations && (
                        <p className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded-lg">
                          No hay consultas anteriores.
                        </p>
                      )
                    )}
                  </div>
                </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5">
            <AccordionTrigger className="text-lg font-semibold">
               <div className="flex items-center gap-3">
                <ClipboardList className="h-5 w-5 text-primary" />
                Notas de Evolución Médica
              </div>
            </AccordionTrigger>
            <AccordionContent className="pl-4 border-l-2 border-primary/20 space-y-3 pt-4">
              {isLoadingNotes && [...Array(2)].map((_, i) => (
                <div key={i} className="p-4 bg-muted/40 rounded-lg space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-24 ml-auto" />
                </div>
              ))}
              {!isLoadingNotes && sortedNotes && sortedNotes.length > 0 ? (
                sortedNotes.map((note: any) => (
                  <div key={note.id} className="p-4 bg-muted/40 rounded-lg border border-muted">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-semibold text-sm">
                        {format(new Date(note.date), 'PPP', { locale: es })}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        Dr. {note.doctorName}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </div>
                ))
              ) : (
                !isLoadingNotes && (
                  <p className="text-sm text-muted-foreground text-center py-8 border-2 border-dashed rounded-lg">
                    No hay notas de evolución registradas en tu historial médico.
                  </p>
                )
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger className="text-lg font-semibold">
               <div className="flex items-center gap-3">
                <Paperclip className="h-5 w-5 text-primary" />
                Documentos y Estudios Anexos
              </div>
            </AccordionTrigger>
            <AccordionContent className="pl-4 border-l-2 border-primary/20 space-y-2 pt-4">
               {clinicalHistory.documents.length > 0 ? (
                 clinicalHistory.documents.map((doc, index) => (
                   <Link href={doc.url} key={index} target="_blank" rel="noopener noreferrer" className="flex justify-between items-center text-sm p-3 bg-card hover:bg-muted/50 rounded-lg border transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground"/>
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">Subido el: {doc.date}</p>
                        </div>
                      </div>
                      <Download className="h-5 w-5 text-muted-foreground"/>
                  </Link>
                 ))
               ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No hay documentos adjuntos.</p>
               )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </>
  );
}
