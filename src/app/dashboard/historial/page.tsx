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
import { useEffect, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const [selectedDiagnosisForPDF, setSelectedDiagnosisForPDF] = useState<any>(null);

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
      where('patientId', '==', user.uid),
      where('status', '==', 'completada')
    );
  }, [firestore, user]);

  const { data: consultations, isLoading: isLoadingConsultations } = useCollection(consultationsQuery);

  // Ordenar consultas por fecha (más recientes primero)
  // Usar el campo date o createdAt dependiendo de lo que esté disponible
  const sortedConsultations = consultations?.slice().sort((a: any, b: any) => {
    const dateA = a.date || a.createdAt || '';
    const dateB = b.date || b.createdAt || '';
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  }) || [];

  // Extraer diagnósticos de las consultas completadas
  const diagnoses = sortedConsultations
    .filter((consultation: any) => {
      // Filtrar solo las que tengan diagnóstico con descripción
      return consultation.diagnosis && 
             consultation.diagnosis.description && 
             consultation.diagnosis.description.trim() !== '';
    })
    .map((consultation: any) => ({
      date: consultation.date || consultation.createdAt || new Date().toISOString(),
      diagnosis: consultation.diagnosis.description,
      doctor: consultation.doctorName || 'No especificado',
      code: consultation.diagnosis.code || '',
      appointmentId: consultation.id,
    }));

  // Debug: Log para verificar los datos
  useEffect(() => {
    console.log('=== DEBUG HISTORIAL ===');
    console.log('Total consultas:', consultations?.length || 0);
    console.log('Consultas completadas:', sortedConsultations.length);
    console.log('Diagnósticos extraídos:', diagnoses.length);
    if (sortedConsultations.length > 0) {
      console.log('Primeras 3 consultas:', sortedConsultations.slice(0, 3).map((c: any) => ({
        id: c.id,
        status: c.status,
        date: c.date,
        hasDiagnosis: !!c.diagnosis,
        diagnosis: c.diagnosis
      })));
    }
  }, [consultations, sortedConsultations, diagnoses]);

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
      doctor: c.doctorName || 'No especificado',
      specialty: c.serviceName || 'No especificado',
      date: c.date || c.createdAt,
      status: c.status,
    })),
    documents: [] as Document[]
  };

  // Función para generar PDF del resumen completo
  const generateFullPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Título
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('HISTORIAL CLÍNICO COMPLETO', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Información del paciente
    doc.setFontSize(14);
    doc.text('IPS Virtual', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Resumen del Paciente
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN DEL PACIENTE', 14, yPosition);
    yPosition += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre: ${clinicalHistory.patientSummary.name}`, 14, yPosition);
    yPosition += 6;
    doc.text(`Edad: ${clinicalHistory.patientSummary.age} años`, 14, yPosition);
    yPosition += 6;
    doc.text(`Grupo Sanguíneo: ${clinicalHistory.patientSummary.bloodType}`, 14, yPosition);
    yPosition += 6;
    doc.text(`Alergias: ${clinicalHistory.patientSummary.allergies}`, 14, yPosition);
    yPosition += 12;

    // Diagnósticos Recientes
    if (clinicalHistory.diagnoses.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('DIAGNÓSTICOS RECIENTES', 14, yPosition);
      yPosition += 7;

      clinicalHistory.diagnoses.forEach((diag: any) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`Fecha: ${format(new Date(diag.date), 'dd/MM/yyyy', { locale: es })}`, 14, yPosition);
        yPosition += 6;
        
        doc.setFont('helvetica', 'normal');
        if (diag.code) {
          doc.text(`Código CIE-10: ${diag.code}`, 14, yPosition);
          yPosition += 6;
        }
        doc.text(`Doctor: Dr. ${diag.doctor}`, 14, yPosition);
        yPosition += 6;
        
        const diagnosisLines = doc.splitTextToSize(`Diagnóstico: ${diag.diagnosis}`, pageWidth - 28);
        doc.text(diagnosisLines, 14, yPosition);
        yPosition += diagnosisLines.length * 6 + 6;
      });
    }

    // Consultas Anteriores
    if (clinicalHistory.consultations.length > 0) {
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }

      yPosition += 5;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('CONSULTAS ANTERIORES', 14, yPosition);
      yPosition += 7;

      const consultationsData = clinicalHistory.consultations.map((c: any) => [
        format(new Date(c.date), 'dd/MM/yyyy', { locale: es }),
        c.specialty,
        c.doctor,
        'Completada'
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Fecha', 'Especialidad', 'Doctor', 'Estado']],
        body: consultationsData,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      });
    }

    // Notas de Evolución
    if (sortedNotes.length > 0) {
      yPosition = (doc as any).lastAutoTable?.finalY || yPosition;
      yPosition += 10;

      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('NOTAS DE EVOLUCIÓN MÉDICA', 14, yPosition);
      yPosition += 7;

      sortedNotes.slice(0, 5).forEach((note: any) => {
        if (yPosition > 260) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${format(new Date(note.date), 'dd/MM/yyyy', { locale: es })} - Dr. ${note.doctorName}`, 14, yPosition);
        yPosition += 6;
        
        doc.setFont('helvetica', 'normal');
        const noteLines = doc.splitTextToSize(note.content, pageWidth - 28);
        doc.text(noteLines, 14, yPosition);
        yPosition += noteLines.length * 5 + 8;
      });
    }

    // Pie de página
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(
        `Página ${i} de ${pageCount} - Generado el ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    doc.save(`Historial_Completo_${clinicalHistory.patientSummary.name.replace(/\s+/g, '_')}_${format(new Date(), 'ddMMyyyy')}.pdf`);
  };

  // Función para generar PDF de un diagnóstico específico
  const generateDiagnosisPDF = (diagnosis: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Encabezado
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORME DE DIAGNÓSTICO', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('IPS Virtual', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Información del paciente
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL PACIENTE', 14, yPosition);
    yPosition += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre: ${clinicalHistory.patientSummary.name}`, 14, yPosition);
    yPosition += 6;
    doc.text(`Edad: ${clinicalHistory.patientSummary.age} años`, 14, yPosition);
    yPosition += 6;
    doc.text(`Grupo Sanguíneo: ${clinicalHistory.patientSummary.bloodType}`, 14, yPosition);
    yPosition += 6;
    doc.text(`Alergias: ${clinicalHistory.patientSummary.allergies}`, 14, yPosition);
    yPosition += 15;

    // Información del diagnóstico
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACIÓN DE LA CONSULTA', 14, yPosition);
    yPosition += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${format(new Date(diagnosis.date), 'dd/MM/yyyy', { locale: es })}`, 14, yPosition);
    yPosition += 6;
    doc.text(`Médico: Dr. ${diagnosis.doctor}`, 14, yPosition);
    yPosition += 6;
    
    if (diagnosis.code) {
      doc.text(`Código CIE-10: ${diagnosis.code}`, 14, yPosition);
      yPosition += 6;
    }
    yPosition += 8;

    // Diagnóstico
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DIAGNÓSTICO', 14, yPosition);
    yPosition += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const diagnosisLines = doc.splitTextToSize(diagnosis.diagnosis, pageWidth - 28);
    doc.text(diagnosisLines, 14, yPosition);
    yPosition += diagnosisLines.length * 6 + 15;

    // Buscar la consulta relacionada para más detalles
    const relatedConsultation = clinicalHistory.consultations.find((c: any) => c.id === diagnosis.appointmentId);
    if (relatedConsultation) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('DETALLES DE LA CONSULTA', 14, yPosition);
      yPosition += 7;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Especialidad: ${relatedConsultation.specialty}`, 14, yPosition);
      yPosition += 6;
      doc.text(`Estado: ${relatedConsultation.status}`, 14, yPosition);
      yPosition += 10;
    }

    // Firma digital (simulada)
    yPosition = doc.internal.pageSize.getHeight() - 40;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text('_____________________________', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;
    doc.text(`Dr. ${diagnosis.doctor}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
    doc.text('Firma Digital', pageWidth / 2, yPosition, { align: 'center' });

    // Pie de página
    doc.setFontSize(8);
    doc.text(
      `Generado el ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );

    doc.save(`Diagnostico_${format(new Date(diagnosis.date), 'ddMMyyyy')}_${clinicalHistory.patientSummary.name.replace(/\s+/g, '_')}.pdf`);
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Descargar PDF
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Opciones de Descarga</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={generateFullPDF}>
                <FileText className="mr-2 h-4 w-4" />
                Resumen Completo
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                Diagnósticos Recientes
              </DropdownMenuLabel>
              {clinicalHistory.diagnoses.length > 0 ? (
                clinicalHistory.diagnoses.slice(0, 5).map((diag: any, index: number) => (
                  <DropdownMenuItem 
                    key={index}
                    onClick={() => generateDiagnosisPDF(diag)}
                    className="text-sm"
                  >
                    <Stethoscope className="mr-2 h-3 w-3" />
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {format(new Date(diag.date), 'dd/MM/yyyy')}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        Dr. {diag.doctor}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                  No hay diagnósticos disponibles
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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
                          <div className="flex justify-between items-start gap-3">
                            <div className="space-y-1 flex-1">
                              <p className="text-sm">
                                <span className="font-semibold">{format(new Date(diag.date), 'PPP', { locale: es })}</span>
                              </p>
                              {diag.code && (
                                <Badge variant="outline" className="text-xs mr-2">
                                  CIE-10: {diag.code}
                                </Badge>
                              )}
                              <p className="text-sm text-muted-foreground">{diag.diagnosis}</p>
                              <p className="text-xs text-muted-foreground mt-1">Dr. {diag.doctor}</p>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => generateDiagnosisPDF(diag)}
                              className="shrink-0"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              PDF
                            </Button>
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
