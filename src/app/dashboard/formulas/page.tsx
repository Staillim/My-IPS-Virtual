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
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Stethoscope,
  Calendar,
  Download,
  Search,
  Repeat,
  X,
  Pill,
  Clock,
  AlertCircle,
} from 'lucide-react';
import Image from 'next/image';
import { useCollection, useFirestore, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function FormulasPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  // Estados para los diálogos
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [renewalDialogOpen, setRenewalDialogOpen] = useState(false);
  const [selectedFormula, setSelectedFormula] = useState<any>(null);
  const [renewalReason, setRenewalReason] = useState('');
  const [isSubmittingRenewal, setIsSubmittingRenewal] = useState(false);

  // Obtener datos del usuario para el PDF
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData } = useDoc(userDocRef);

  const formulasQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'formulas'), where('patientId', '==', user.uid));
  }, [firestore, user]);

  const { data: formulas, isLoading: isLoadingFormulas } = useCollection(formulasQuery);

  // También buscar fórmulas con el campo antiguo userId (para compatibilidad)
  const legacyFormulasQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'formulas'), where('userId', '==', user.uid));
  }, [firestore, user]);

  const { data: legacyFormulas } = useCollection(legacyFormulasQuery);

  // Obtener solicitudes de renovación del paciente
  const renewalRequestsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'formulaRenewalRequests'), where('patientId', '==', user.uid));
  }, [firestore, user]);

  const { data: renewalRequests } = useCollection(renewalRequestsQuery);

  // Combinar ambas listas y eliminar duplicados
  const allFormulas = [...(formulas || []), ...(legacyFormulas || [])].filter(
    (formula, index, self) => index === self.findIndex((f) => f.id === formula.id)
  );

  // Ordenar fórmulas: más recientes primero
  const sortedFormulas = allFormulas.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB.getTime() - dateA.getTime(); // Descendente (más reciente primero)
  });

  // Función para verificar si una fórmula tiene una solicitud de renovación
  const getRenewalRequestForFormula = (formulaId: string) => {
    return renewalRequests?.find(req => req.formulaId === formulaId);
  };

  // Funciones para manejar los diálogos
  const handleOpenDetails = (formula: any) => {
    setSelectedFormula(formula);
    setDetailsDialogOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsDialogOpen(false);
    setSelectedFormula(null);
  };

  const handleOpenRenewal = (formula: any) => {
    setSelectedFormula(formula);
    setRenewalReason('');
    setRenewalDialogOpen(true);
  };

  const handleCloseRenewal = () => {
    setRenewalDialogOpen(false);
    setSelectedFormula(null);
    setRenewalReason('');
  };

  const handleSubmitRenewal = async () => {
    if (!renewalReason.trim() || !selectedFormula || !user || !firestore) {
      toast({
        title: 'Error',
        description: 'Por favor proporciona un motivo para la renovación.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmittingRenewal(true);

    try {
      // Crear solicitud de renovación en Firestore
      await addDoc(collection(firestore, 'formulaRenewalRequests'), {
        formulaId: selectedFormula.id,
        patientId: user.uid,
        patientName: userData?.displayName || `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || 'Paciente',
        doctorId: selectedFormula.doctorId,
        doctorName: selectedFormula.doctorName,
        originalDate: selectedFormula.date,
        medications: selectedFormula.medications,
        reason: renewalReason.trim(),
        status: 'pendiente',
        createdAt: serverTimestamp(),
      });

      // Crear notificación para el médico
      await addDoc(collection(firestore, 'notifications'), {
        userId: selectedFormula.doctorId,
        type: 'renewal_request',
        title: 'Nueva solicitud de renovación de fórmula',
        message: `${userData?.displayName || 'Un paciente'} ha solicitado renovar una fórmula médica.`,
        read: false,
        createdAt: serverTimestamp(),
        formulaId: selectedFormula.id,
      });

      toast({
        title: 'Solicitud enviada',
        description: 'Tu solicitud de renovación ha sido enviada al médico.',
      });

      handleCloseRenewal();
    } catch (error) {
      console.error('Error al enviar solicitud de renovación:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar la solicitud. Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingRenewal(false);
    }
  };

  // Función para generar PDF de fórmula médica
  const generateFormulaPDF = (formula: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Encabezado - Logo y título
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('FÓRMULA MÉDICA', pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('IPS Virtual - Sistema de Salud Digital', pageWidth / 2, 25, { align: 'center' });

    yPosition = 45;
    doc.setTextColor(0, 0, 0);

    // Fecha de emisión
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text(`Fecha de Emisión: ${format(new Date(formula.date), 'dd/MM/yyyy', { locale: es })}`, pageWidth - 14, yPosition, { align: 'right' });
    yPosition += 5;
    
    // Fecha de vencimiento
    if (formula.expirationDate) {
      const expirationDateObj = new Date(formula.expirationDate);
      const isExpired = expirationDateObj < new Date();
      
      if (isExpired) {
        doc.setTextColor(220, 38, 38); // Rojo
        doc.text(`⚠ VENCIDA: ${format(expirationDateObj, 'dd/MM/yyyy', { locale: es })}`, pageWidth - 14, yPosition, { align: 'right' });
      } else {
        doc.setTextColor(22, 163, 74); // Verde
        doc.text(`Válida hasta: ${format(expirationDateObj, 'dd/MM/yyyy', { locale: es })}`, pageWidth - 14, yPosition, { align: 'right' });
      }
      doc.setTextColor(0, 0, 0); // Volver a negro
    }
    yPosition += 10;

    // Información del paciente
    doc.setFillColor(240, 240, 240);
    doc.rect(14, yPosition, pageWidth - 28, 35, 'F');
    
    yPosition += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL PACIENTE', 18, yPosition);
    yPosition += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const patientName = userData?.displayName || formula.patientName || `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || 'No especificado';
    doc.text(`Nombre: ${patientName}`, 18, yPosition);
    yPosition += 6;
    
    if (userData?.documentType && userData?.documentNumber) {
      doc.text(`${userData.documentType}: ${userData.documentNumber}`, 18, yPosition);
      yPosition += 6;
    }
    
    if (userData?.age) {
      doc.text(`Edad: ${userData.age} años`, 18, yPosition);
    }
    
    if (userData?.bloodType) {
      doc.text(`Grupo Sanguíneo: ${userData.bloodType}`, pageWidth / 2 + 10, yPosition);
    }
    yPosition += 12;

    // Información del médico
    doc.setFillColor(240, 240, 240);
    doc.rect(14, yPosition, pageWidth - 28, 20, 'F');
    
    yPosition += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL MÉDICO', 18, yPosition);
    yPosition += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Médico: Dr. ${formula.doctorName}`, 18, yPosition);
    yPosition += 18;

    // Medicamentos recetados
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('MEDICAMENTOS RECETADOS', 14, yPosition);
    yPosition += 8;

    // Tabla de medicamentos
    const medicationsData = formula.medications.map((med: any, index: number) => [
      (index + 1).toString(),
      med.name,
      med.dosage
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['#', 'Medicamento', 'Dosis / Frecuencia']],
      body: medicationsData,
      styles: { 
        fontSize: 10,
        cellPadding: 5
      },
      headStyles: { 
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 70 },
        2: { cellWidth: 'auto' }
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Observaciones
    if (formula.observations && formula.observations.trim() !== '') {
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('OBSERVACIONES E INDICACIONES', 14, yPosition);
      yPosition += 7;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const observationsLines = doc.splitTextToSize(formula.observations, pageWidth - 28);
      doc.text(observationsLines, 14, yPosition);
      yPosition += observationsLines.length * 5 + 10;
    }

    // Advertencias legales
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    const warningText = 'ADVERTENCIA: Esta fórmula médica es de uso personal e intransferible. No automedicarse. Consulte a su médico en caso de reacciones adversas.';
    const warningLines = doc.splitTextToSize(warningText, pageWidth - 28);
    doc.text(warningLines, 14, yPosition);
    yPosition += warningLines.length * 4 + 10;

    // Firma del médico
    yPosition = pageHeight - 50;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    doc.line(pageWidth / 2 - 30, yPosition, pageWidth / 2 + 30, yPosition);
    yPosition += 5;
    doc.text(`Dr. ${formula.doctorName}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text('Firma Digital Autorizada', pageWidth / 2, yPosition, { align: 'center' });

    // Si hay firma digital como imagen, intentar agregarla
    if (formula.digitalSignature) {
      try {
        // Nota: Para agregar la imagen se necesitaría convertirla primero
        // Por ahora solo mostramos el texto de firma digital
      } catch (error) {
        console.log('No se pudo agregar la firma digital al PDF');
      }
    }

    // Pie de página con código único
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Documento generado el ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })} | Código: ${formula.id.substring(0, 8).toUpperCase()}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );

    // Guardar PDF
    const fileName = `Formula_Medica_${patientName.replace(/\s+/g, '_')}_${format(new Date(formula.date), 'ddMMyyyy')}.pdf`;
    doc.save(fileName);
  };

  // Función para generar PDF con todas las fórmulas
  const generateAllFormulasPDF = () => {
    if (!sortedFormulas || sortedFormulas.length === 0) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Portada
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('HISTORIAL DE', pageWidth / 2, 80, { align: 'center' });
    doc.text('FÓRMULAS MÉDICAS', pageWidth / 2, 95, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    const patientName = userData?.displayName || `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || 'Paciente';
    doc.text(patientName, pageWidth / 2, 120, { align: 'center' });
    
    doc.setFontSize(11);
    doc.text('IPS Virtual - Sistema de Salud Digital', pageWidth / 2, 140, { align: 'center' });
    doc.text(`Generado el ${format(new Date(), 'dd/MM/yyyy', { locale: es })}`, pageWidth / 2, 150, { align: 'center' });
    
    doc.setFontSize(16);
    doc.text(`Total de Fórmulas: ${sortedFormulas.length}`, pageWidth / 2, 180, { align: 'center' });

    // Iterar por cada fórmula
    sortedFormulas.forEach((formula, index) => {
      doc.addPage();
      let yPosition = 20;
      doc.setTextColor(0, 0, 0);

      // Encabezado de cada fórmula
      doc.setFillColor(41, 128, 185);
      doc.rect(0, 0, pageWidth, 30, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(`FÓRMULA MÉDICA #${index + 1}`, pageWidth / 2, 12, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha: ${format(new Date(formula.date), 'dd/MM/yyyy', { locale: es })}`, pageWidth / 2, 22, { align: 'center' });

      yPosition = 40;
      doc.setTextColor(0, 0, 0);

      // Información del médico
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Médico:', 14, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(`Dr. ${formula.doctorName}`, 40, yPosition);
      yPosition += 12;

      // Medicamentos
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('MEDICAMENTOS RECETADOS', 14, yPosition);
      yPosition += 8;

      const medicationsData = formula.medications.map((med: any, idx: number) => [
        (idx + 1).toString(),
        med.name,
        med.dosage
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['#', 'Medicamento', 'Dosis / Frecuencia']],
        body: medicationsData,
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 70 },
          2: { cellWidth: 'auto' }
        }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;

      // Observaciones
      if (formula.observations && formula.observations.trim() !== '') {
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('OBSERVACIONES', 14, yPosition);
        yPosition += 6;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const observationsLines = doc.splitTextToSize(formula.observations, pageWidth - 28);
        doc.text(observationsLines, 14, yPosition);
        yPosition += observationsLines.length * 4 + 8;
      }

      // Firma
      yPosition = pageHeight - 35;
      doc.setFontSize(9);
      doc.line(pageWidth / 2 - 25, yPosition, pageWidth / 2 + 25, yPosition);
      yPosition += 5;
      doc.text(`Dr. ${formula.doctorName}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 4;
      doc.setFont('helvetica', 'italic');
      doc.text('Firma Digital', pageWidth / 2, yPosition, { align: 'center' });
    });

    // Pie de página en todas las páginas
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      if (i > 1) { // No en la portada
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Página ${i - 1} de ${pageCount - 1} - ${patientName}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }
    }

    doc.save(`Historial_Formulas_${patientName.replace(/\s+/g, '_')}_${format(new Date(), 'ddMMyyyy')}.pdf`);
  };

  return (
    <>
      <Header />
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold font-headline">Fórmulas Médicas</h1>
            <p className="text-muted-foreground">
              Consulta el historial de tus fórmulas médicas.
            </p>
          </div>
          {sortedFormulas && sortedFormulas.length > 0 && (
            <Button onClick={generateAllFormulasPDF} size="default" className="gap-2">
              <Download className="h-4 w-4" />
              Descargar Todas ({sortedFormulas.length})
            </Button>
          )}
        </div>

        <div className="space-y-6">
          {isLoadingFormulas && (
             <div className="space-y-6">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
          )}
          {sortedFormulas?.map((formula) => (
            <Card key={formula.id} className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="border-b">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <FileText className="h-5 w-5 text-primary" />
                            Fórmula Médica
                        </CardTitle>
                        <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 mt-2">
                            <span className="flex items-center"><Stethoscope className="mr-2 h-4 w-4" /> {formula.doctorName}</span>
                            <span className="flex items-center"><Calendar className="mr-2 h-4 w-4" /> Emitida: {new Date(formula.date).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            {formula.expirationDate && (
                              <span className={`flex items-center ${formula.expirationDate < new Date().toISOString().split('T')[0] ? 'text-red-600 font-semibold' : 'text-green-600'}`}>
                                <Clock className="mr-2 h-4 w-4" /> Válida hasta: {new Date(formula.expirationDate).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                              </span>
                            )}
                        </CardDescription>
                    </div>
                    <Badge>Vigente</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Medicamentos Recetados:</h3>
                <ul className="space-y-2 list-disc pl-5 text-muted-foreground">
                  {formula.medications.map((med: any, index: number) => (
                    <li key={index}>
                      <span className="font-medium text-foreground">{med.name}</span> - {med.dosage}
                    </li>
                  ))}
                </ul>
                <h3 className="font-semibold mt-4 mb-2">Observaciones:</h3>
                <p className="text-muted-foreground text-sm">
                  {formula.observations}
                </p>
                {formula.digitalSignature && (
                  <div className="mt-6 flex flex-col items-center sm:items-end">
                      <p className="text-sm text-muted-foreground mb-2">Firma Digital:</p>
                      <div className="relative h-16 w-40">
                           <Image
                              src={formula.digitalSignature}
                              alt={`Firma de ${formula.doctorName}`}
                              width={160}
                              height={64}
                              style={{ objectFit: "contain" }}
                            />
                      </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2 justify-end bg-muted/30 p-4 border-t">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleOpenDetails(formula)}
                >
                  <Search className="mr-2 h-4 w-4" />
                  Ver Detalles
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => generateFormulaPDF(formula)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Descargar PDF
                </Button>
                {(() => {
                  const renewalRequest = getRenewalRequestForFormula(formula.id);
                  
                  if (renewalRequest?.status === 'pendiente') {
                    return (
                      <Button 
                        variant="secondary" 
                        size="sm"
                        disabled
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        Renovación Pendiente
                      </Button>
                    );
                  }
                  
                  if (renewalRequest?.status === 'rechazada') {
                    return (
                      <div className="flex flex-col gap-1">
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled
                          className="cursor-not-allowed opacity-60"
                        >
                          <X className="mr-2 h-4 w-4" />
                          No Necesaria
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                          Agenda una cita para evaluación
                        </p>
                      </div>
                    );
                  }
                  
                  if (renewalRequest?.status === 'aprobada') {
                    return (
                      <Button 
                        variant="secondary" 
                        size="sm"
                        disabled
                        className="opacity-60"
                      >
                        <Repeat className="mr-2 h-4 w-4" />
                        Ya Renovada
                      </Button>
                    );
                  }
                  
                  return (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleOpenRenewal(formula)}
                    >
                      <Repeat className="mr-2 h-4 w-4" />
                      Solicitar Renovación
                    </Button>
                  );
                })()}
              </CardFooter>
            </Card>
          ))}

          {!isLoadingFormulas && sortedFormulas?.length === 0 && (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No se encontraron fórmulas</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    No tienes fórmulas médicas registradas en tu historial.
                </p>
            </div>
          )}
        </div>

        {/* Diálogo Ver Detalles */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <FileText className="h-5 w-5 text-primary" />
                Detalles de la Fórmula Médica
              </DialogTitle>
              <DialogDescription>
                Información completa de la prescripción médica
              </DialogDescription>
            </DialogHeader>

            {selectedFormula && (
              <div className="space-y-6 py-4">
                {/* Información General */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <Label className="text-xs text-muted-foreground">Médico Prescriptor</Label>
                    <p className="font-medium flex items-center gap-2 mt-1">
                      <Stethoscope className="h-4 w-4 text-primary" />
                      Dr. {selectedFormula.doctorName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Fecha de Emisión</Label>
                    <p className="font-medium flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-primary" />
                      {format(new Date(selectedFormula.date), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                    </p>
                  </div>
                  {selectedFormula.expirationDate && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Fecha de Vencimiento</Label>
                      <p className={`font-medium flex items-center gap-2 mt-1 ${selectedFormula.expirationDate < new Date().toISOString().split('T')[0] ? 'text-red-600' : 'text-green-600'}`}>
                        <Clock className="h-4 w-4" />
                        {format(new Date(selectedFormula.expirationDate), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                      </p>
                    </div>
                  )}
                  <div>
                    <Label className="text-xs text-muted-foreground">Estado</Label>
                    <div className="mt-1">
                      <Badge className="bg-green-500 hover:bg-green-600">Vigente</Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Código de Fórmula</Label>
                    <p className="font-mono text-sm mt-1">{selectedFormula.id.substring(0, 12).toUpperCase()}</p>
                  </div>
                </div>

                {/* Medicamentos */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Pill className="h-5 w-5 text-primary" />
                    Medicamentos Recetados
                  </h3>
                  <div className="space-y-3">
                    {selectedFormula.medications.map((med: any, index: number) => (
                      <div key={index} className="p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="bg-primary/10 p-2 rounded-full">
                            <span className="font-bold text-primary">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-base">{med.name}</p>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{med.dosage}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Observaciones */}
                {selectedFormula.observations && selectedFormula.observations.trim() !== '' && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-primary" />
                      Observaciones e Indicaciones
                    </h3>
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-sm leading-relaxed whitespace-pre-line">
                        {selectedFormula.observations}
                      </p>
                    </div>
                  </div>
                )}

                {/* Firma Digital */}
                {selectedFormula.digitalSignature && (
                  <div className="border-t pt-6">
                    <Label className="text-sm text-muted-foreground mb-2 block">Firma Digital del Médico</Label>
                    <div className="flex justify-center">
                      <div className="relative h-20 w-48 border rounded-lg p-2 bg-white">
                        <Image
                          src={selectedFormula.digitalSignature}
                          alt={`Firma de ${selectedFormula.doctorName}`}
                          width={192}
                          height={80}
                          style={{ objectFit: "contain" }}
                        />
                      </div>
                    </div>
                    <p className="text-center text-xs text-muted-foreground mt-2">
                      Dr. {selectedFormula.doctorName} - Firma Autorizada
                    </p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleCloseDetails}>
                Cerrar
              </Button>
              {selectedFormula && (
                <Button onClick={() => {
                  generateFormulaPDF(selectedFormula);
                  handleCloseDetails();
                }}>
                  <Download className="mr-2 h-4 w-4" />
                  Descargar PDF
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo Solicitar Renovación */}
        <Dialog open={renewalDialogOpen} onOpenChange={setRenewalDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Repeat className="h-5 w-5 text-primary" />
                Solicitar Renovación de Fórmula
              </DialogTitle>
              <DialogDescription>
                Envía una solicitud al médico para renovar esta fórmula médica
              </DialogDescription>
            </DialogHeader>

            {selectedFormula && (
              <div className="space-y-4 py-4">
                {/* Información de la fórmula a renovar */}
                <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Stethoscope className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Médico:</span>
                    <span className="font-medium">Dr. {selectedFormula.doctorName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Fecha original:</span>
                    <span className="font-medium">
                      {format(new Date(selectedFormula.date), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                    </span>
                  </div>
                  <div className="mt-3">
                    <Label className="text-xs text-muted-foreground">Medicamentos</Label>
                    <ul className="mt-1 space-y-1">
                      {selectedFormula.medications.map((med: any, index: number) => (
                        <li key={index} className="text-sm flex items-center gap-2">
                          <Pill className="h-3 w-3 text-primary" />
                          <span className="font-medium">{med.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Motivo de renovación */}
                <div className="space-y-2">
                  <Label htmlFor="renewal-reason">
                    Motivo de la renovación <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="renewal-reason"
                    placeholder="Explica por qué necesitas renovar esta fórmula (ej: tratamiento continuo, medicamentos agotados, etc.)"
                    value={renewalReason}
                    onChange={(e) => setRenewalReason(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    El médico recibirá una notificación con tu solicitud y podrá aprobar o rechazar la renovación.
                  </p>
                </div>

                {/* Advertencia */}
                <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">Importante</p>
                    <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                      Esta es solo una solicitud. El médico evaluará si es apropiado renovar la fórmula y te notificará su decisión.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={handleCloseRenewal}
                disabled={isSubmittingRenewal}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmitRenewal}
                disabled={!renewalReason.trim() || isSubmittingRenewal}
              >
                {isSubmittingRenewal ? (
                  <>Enviando...</>
                ) : (
                  <>
                    <Repeat className="mr-2 h-4 w-4" />
                    Enviar Solicitud
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
