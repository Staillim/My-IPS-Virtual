'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  MoreHorizontal,
  Calendar as CalendarIcon,
  FileText,
  Download,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function FormulasPage() {
  const [patientSearch, setPatientSearch] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);

  // Dialog states
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [selectedFormula, setSelectedFormula] = useState<any>(null);
  const [voidReason, setVoidReason] = useState('');

  const { toast } = useToast();
  const firestore = useFirestore();

  const formulasCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, 'formulas') : null, [firestore]);
  const { data: formulas, isLoading: isLoadingFormulas } = useCollection(formulasCollectionRef);

  // Auto-expirar fórmulas vencidas
  useEffect(() => {
    if (!formulas || !firestore) return;

    const checkExpiredFormulas = async () => {
      const today = new Date().toISOString().split('T')[0];
      
      for (const formula of formulas) {
        if (formula.status === 'activa' && formula.expirationDate && formula.expirationDate < today) {
          try {
            const formulaRef = doc(firestore, 'formulas', formula.id);
            await updateDocumentNonBlocking(formulaRef, {
              status: 'vencida',
              expiredAt: new Date().toISOString(),
            });
          } catch (error) {
            console.error('Error al actualizar fórmula vencida:', error);
          }
        }
      }
    };

    checkExpiredFormulas();
  }, [formulas, firestore]);

  const getStatusVariant = (
    status: string
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'activa':
        return 'default';
      case 'vencida':
        return 'secondary';
      case 'anulada':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // View details handler
  const handleViewDetails = (formula: any) => {
    setSelectedFormula(formula);
    setDetailsDialogOpen(true);
  };

  // Download PDF handler
  const handleDownloadPDF = async (formula: any) => {
    try {
      toast({
        title: "Generando PDF",
        description: "El PDF se descargará en breve...",
      });

      // Import jsPDF and autoTable dynamically
      const jsPDF = (await import('jspdf')).default;
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(18);
      doc.text('Fórmula Médica', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`Fecha de Emisión: ${formula.date}`, 20, 35);
      if (formula.expirationDate) {
        doc.text(`Válida hasta: ${format(new Date(formula.expirationDate), 'PPP', { locale: es })}`, 20, 42);
        doc.text(`Estado: ${formula.status.toUpperCase()}`, 20, 49);
      } else {
        doc.text(`Estado: ${formula.status.toUpperCase()}`, 20, 42);
      }
      
      const startY = formula.expirationDate ? 62 : 55;
      
      // Patient and Doctor info
      doc.setFontSize(14);
      doc.text('Información del Paciente', 20, startY);
      doc.setFontSize(11);
      doc.text(`Nombre: ${formula.patientName}`, 20, startY + 7);
      doc.text(`Documento: ${formula.patientDocument || 'N/A'}`, 20, startY + 14);
      
      doc.setFontSize(14);
      doc.text('Médico Emisor', 20, startY + 27);
      doc.setFontSize(11);
      doc.text(`Nombre: ${formula.doctorName}`, 20, startY + 34);
      doc.text(`Especialidad: ${formula.doctorSpecialty || 'N/A'}`, 20, startY + 41);
      doc.text(`Registro Médico: ${formula.doctorLicense || 'N/A'}`, 20, startY + 48);
      
      // Medications table
      const tableStartY = startY + 61;
      if (formula.medications && formula.medications.length > 0) {
        doc.setFontSize(14);
        doc.text('Medicamentos Prescritos', 20, tableStartY);
        
        const tableData = formula.medications.map((med: any) => [
          med.name || 'N/A',
          med.dosage || 'N/A',
          med.frequency || 'N/A',
          med.duration || 'N/A'
        ]);
        
        autoTable(doc, {
          startY: tableStartY + 6,
          head: [['Medicamento', 'Dosis', 'Frecuencia', 'Duración']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [66, 139, 202] }
        });
      }
      
      // Observations
      const finalY = (doc as any).lastAutoTable?.finalY || tableStartY + 6;
      if (formula.observations) {
        doc.setFontSize(14);
        doc.text('Observaciones', 20, finalY + 15);
        doc.setFontSize(11);
        const splitText = doc.splitTextToSize(formula.observations, 170);
        doc.text(splitText, 20, finalY + 22);
      }
      
      // Footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(9);
      doc.text('IPS Virtual - Sistema de Gestión Médica', 105, pageHeight - 15, { align: 'center' });
      doc.text(`Generado el ${format(new Date(), 'PPP', { locale: es })}`, 105, pageHeight - 10, { align: 'center' });
      
      // Download
      doc.save(`formula_${formula.patientName.replace(/\s+/g, '_')}_${formula.date}.pdf`);
      
      toast({
        title: "PDF descargado",
        description: "La fórmula se ha descargado exitosamente.",
      });
    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el PDF. Intente nuevamente.",
        variant: "destructive",
      });
    }
  };

  // Void formula handler
  const handleOpenVoidDialog = (formula: any) => {
    setSelectedFormula(formula);
    setVoidDialogOpen(true);
  };

  const handleVoidFormula = async () => {
    if (!selectedFormula || !firestore) return;

    try {
      const formulaRef = doc(firestore, 'formulas', selectedFormula.id);
      
      await updateDocumentNonBlocking(formulaRef, {
        status: 'anulada',
        voidedAt: new Date().toISOString(),
        voidReason: voidReason || 'Sin razón especificada',
      });

      // Create notification for patient
      if (selectedFormula.patientId) {
        const notificationsRef = collection(firestore, 'notifications');
        await addDocumentNonBlocking(notificationsRef, {
          userId: selectedFormula.patientId,
          title: 'Fórmula anulada',
          message: `Su fórmula médica del ${selectedFormula.date} ha sido anulada. ${voidReason ? `Razón: ${voidReason}` : ''}`,
          type: 'formula',
          read: false,
          createdAt: new Date().toISOString(),
        });
      }

      toast({
        title: "Fórmula anulada",
        description: "La fórmula ha sido anulada exitosamente.",
      });

      setVoidDialogOpen(false);
      setVoidReason('');
      setSelectedFormula(null);
    } catch (error) {
      console.error('Error al anular fórmula:', error);
      toast({
        title: "Error",
        description: "No se pudo anular la fórmula. Intente nuevamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Header />
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold font-headline">Gestión de Fórmulas</h1>
            <p className="text-muted-foreground">
              Supervisa y administra todas las fórmulas médicas del sistema.
            </p>
          </div>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filtros de Búsqueda</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Input placeholder="Buscar por paciente..." className="lg:col-span-2" />
            <Select>
              <SelectTrigger><SelectValue placeholder="Filtrar por médico" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los médicos</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger><SelectValue placeholder="Filtrar por estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="activa">Activa</SelectItem>
                <SelectItem value="vencida">Vencida</SelectItem>
                <SelectItem value="anulada">Anulada</SelectItem>
              </SelectContent>
            </Select>
             <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={cn('justify-start text-left font-normal', !dateFilter && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFilter ? format(dateFilter, 'PPP', { locale: es }) : <span>Filtrar por fecha</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dateFilter} onSelect={setDateFilter} initialFocus locale={es} /></PopoverContent>
            </Popover>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Médico Emisor</TableHead>
                  <TableHead>Fecha de Emisión</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingFormulas && [...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                ))}
                {formulas?.map((formula: any) => (
                  <TableRow key={formula.id}>
                    <TableCell className="font-medium">{formula.patientName}</TableCell>
                    <TableCell>{formula.doctorName}</TableCell>
                    <TableCell>{format(new Date(formula.date), 'PPP', { locale: es })}</TableCell>
                    <TableCell>
                      {formula.expirationDate ? (
                        <span className={formula.expirationDate < new Date().toISOString().split('T')[0] ? 'text-red-600 font-medium' : ''}>
                          {format(new Date(formula.expirationDate), 'PPP', { locale: es })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Sin especificar</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(formula.status || 'activa')}>
                        {formula.status ? (formula.status.charAt(0).toUpperCase() + formula.status.slice(1)) : 'Activa'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewDetails(formula)}><FileText className="mr-2 h-4 w-4" />Ver Detalles</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadPDF(formula)}><Download className="mr-2 h-4 w-4" />Descargar PDF</DropdownMenuItem>
                          {formula.status !== 'anulada' && (
                            <DropdownMenuItem 
                              onClick={() => handleOpenVoidDialog(formula)}
                              className="text-destructive focus:text-destructive"
                            >
                              <XCircle className="mr-2 h-4 w-4" />Anular Fórmula
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
           { !isLoadingFormulas && formulas?.length === 0 && (
                <CardFooter className="py-8 justify-center">
                    <p className="text-muted-foreground">No hay fórmulas registradas en el sistema.</p>
                </CardFooter>
            )}
        </Card>
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de la Fórmula Médica</DialogTitle>
            <DialogDescription>
              Información completa de la prescripción médica
            </DialogDescription>
          </DialogHeader>
          {selectedFormula && (
            <div className="space-y-4">
              {/* Patient Information */}
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">Información del Paciente</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-medium">Nombre:</span> {selectedFormula.patientName}</div>
                  <div><span className="font-medium">Documento:</span> {selectedFormula.patientDocument || 'N/A'}</div>
                </div>
              </div>

              {/* Doctor Information */}
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">Médico Emisor</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-medium">Nombre:</span> {selectedFormula.doctorName}</div>
                  <div><span className="font-medium">Especialidad:</span> {selectedFormula.doctorSpecialty || 'N/A'}</div>
                  <div><span className="font-medium">Registro:</span> {selectedFormula.doctorLicense || 'N/A'}</div>
                </div>
              </div>

              {/* Formula Information */}
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">Información de la Fórmula</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-medium">Fecha de Emisión:</span> {format(new Date(selectedFormula.date), 'PPP', { locale: es })}</div>
                  {selectedFormula.expirationDate && (
                    <div>
                      <span className="font-medium">Fecha de Vencimiento:</span>{' '}
                      <span className={selectedFormula.expirationDate < new Date().toISOString().split('T')[0] ? 'text-red-600 font-semibold' : 'text-green-600'}>
                        {format(new Date(selectedFormula.expirationDate), 'PPP', { locale: es })}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Estado: </span>
                    <Badge variant={getStatusVariant(selectedFormula.status || 'activa')}>
                      {selectedFormula.status ? (selectedFormula.status.charAt(0).toUpperCase() + selectedFormula.status.slice(1)) : 'Activa'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Medications */}
              {selectedFormula.medications && selectedFormula.medications.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">Medicamentos Prescritos</h3>
                  <div className="space-y-3">
                    {selectedFormula.medications.map((med: any, index: number) => (
                      <Card key={index}>
                        <CardContent className="p-3">
                          <div className="font-medium mb-1">{med.name || 'Medicamento sin nombre'}</div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div><span className="font-medium">Dosis:</span> {med.dosage || 'N/A'}</div>
                            <div><span className="font-medium">Frecuencia:</span> {med.frequency || 'N/A'}</div>
                            <div><span className="font-medium">Duración:</span> {med.duration || 'N/A'}</div>
                            {med.instructions && <div><span className="font-medium">Instrucciones:</span> {med.instructions}</div>}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Observations */}
              {selectedFormula.observations && (
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">Observaciones</h3>
                  <p className="text-sm bg-muted p-3 rounded-md">{selectedFormula.observations}</p>
                </div>
              )}

              {/* Void Information */}
              {selectedFormula.status === 'anulada' && selectedFormula.voidReason && (
                <div>
                  <h3 className="font-semibold text-sm text-destructive mb-2">Información de Anulación</h3>
                  <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-md">
                    <div className="text-sm space-y-1">
                      <div><span className="font-medium">Razón:</span> {selectedFormula.voidReason}</div>
                      {selectedFormula.voidedAt && (
                        <div><span className="font-medium">Fecha de anulación:</span> {format(new Date(selectedFormula.voidedAt), 'PPP', { locale: es })}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cerrar</Button>
            </DialogClose>
            {selectedFormula && (
              <Button onClick={() => handleDownloadPDF(selectedFormula)}>
                <Download className="mr-2 h-4 w-4" />
                Descargar PDF
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Void Formula Dialog */}
      <AlertDialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              ¿Anular esta fórmula?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción marcará la fórmula como anulada. El paciente será notificado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="void-reason">Razón de anulación (opcional)</Label>
            <Textarea
              id="void-reason"
              placeholder="Indique el motivo de la anulación..."
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setVoidReason('')}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleVoidFormula}
              className="bg-destructive hover:bg-destructive/90"
            >
              Anular Fórmula
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
