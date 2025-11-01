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
} from 'lucide-react';
import Image from 'next/image';
import { useCollection, useFirestore, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function FormulasPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

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

  // Combinar ambas listas y eliminar duplicados
  const allFormulas = [...(formulas || []), ...(legacyFormulas || [])].filter(
    (formula, index, self) => index === self.findIndex((f) => f.id === formula.id)
  );

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
    if (!allFormulas || allFormulas.length === 0) return;

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
    doc.text(`Total de Fórmulas: ${allFormulas.length}`, pageWidth / 2, 180, { align: 'center' });

    // Iterar por cada fórmula
    allFormulas.forEach((formula, index) => {
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
          {allFormulas && allFormulas.length > 0 && (
            <Button onClick={generateAllFormulasPDF} size="default" className="gap-2">
              <Download className="h-4 w-4" />
              Descargar Todas ({allFormulas.length})
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
          {allFormulas?.map((formula) => (
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
                            <span className="flex items-center"><Calendar className="mr-2 h-4 w-4" /> {new Date(formula.date).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
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
                <Button variant="outline" size="sm">
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
                <Button variant="outline" size="sm">
                  <Repeat className="mr-2 h-4 w-4" />
                  Solicitar Renovación
                </Button>
              </CardFooter>
            </Card>
          ))}

          {!isLoadingFormulas && allFormulas?.length === 0 && (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No se encontraron fórmulas</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    No tienes fórmulas médicas registradas en tu historial.
                </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
