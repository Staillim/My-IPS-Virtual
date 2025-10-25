
'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  MoreHorizontal,
  Search,
  PlusCircle,
  FileText,
  Download,
  XCircle,
  FilePlus,
  Send,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'activa':
      return 'default';
    case 'vencida':
      return 'outline';
    case 'anulada':
      return 'destructive';
    default:
      return 'secondary';
  }
};

export default function PersonalFormulasPage() {
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedFormulaId, setSelectedFormulaId] = useState<string | null>(null);
  const [newFormula, setNewFormula] = useState({ patientId: '', medicationName: '', dosage: '', observations: '' });
  const [medications, setMedications] = useState<{name: string; dosage: string}[]>([]);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');

  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const formulasQuery = useMemoFirebase(() => user ? query(collection(firestore, 'formulas'), where('doctorId', '==', user.uid)) : null, [user, firestore]);
  const { data: formulas, isLoading: isLoadingFormulas } = useCollection(formulasQuery);

  // Obtener todos los pacientes
  const patientsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), where('role', '==', 'PACIENTE')) : null, [firestore]);
  const { data: allPatients, isLoading: isLoadingPatients } = useCollection(patientsQuery);

  // Get unique patient IDs from recent formulas for the "Recent Patients" section
  const recentPatientIds = [...new Set(formulas?.map(f => f.patientId || f.userId) || [])].slice(0, 5);
  const recentPatients = allPatients?.filter(p => recentPatientIds.includes(p.id)) || [];  // Filtrar pacientes por búsqueda
  const filteredPatients = allPatients?.filter(patient => 
    patient.displayName?.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
    patient.email?.toLowerCase().includes(patientSearchTerm.toLowerCase())
  ) || [];

  const selectedPatient = allPatients?.find(p => p.id === newFormula.patientId);

  const handleAddMedication = () => {
    if (newFormula.medicationName && newFormula.dosage) {
        setMedications([...medications, { name: newFormula.medicationName, dosage: newFormula.dosage }]);
        setNewFormula(prev => ({...prev, medicationName: '', dosage: ''}));
    }
  }

  const handleCreateFormula = () => {
    const patient = allPatients?.find(p => p.id === newFormula.patientId);

    if (!user || !patient || medications.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debes seleccionar un paciente y añadir al menos un medicamento.",
      });
      return;
    }

    const formulaData = {
      patientId: patient.id,
      patientName: patient.displayName,
      doctorId: user.uid,
      doctorName: user.displayName,
      date: new Date().toISOString().split('T')[0],
      medications: medications,
      observations: newFormula.observations,
      status: 'activa',
      digitalSignature: user.photoURL, // Or a more secure signature
    };

    const formulasCol = collection(firestore, 'formulas');
    addDocumentNonBlocking(formulasCol, formulaData);

    // Crear notificación para el paciente
    const notificationsCol = collection(firestore, 'notifications');
    addDocumentNonBlocking(notificationsCol, {
      userId: patient.id,
      type: 'formula_created',
      title: 'Fórmula Médica Emitida',
      message: `El Dr. ${user.displayName} ha emitido una fórmula médica para ti con ${medications.length} medicamento(s). Revísala en la sección de fórmulas.`,
      read: false,
      createdAt: new Date(),
    });

    toast({ title: 'Fórmula Creada', description: 'La receta ha sido enviada al paciente.' });
    setOpen(false);
    setNewFormula({ patientId: '', medicationName: '', dosage: '', observations: '' });
    setMedications([]);
    setPatientSearchTerm('');
  };

  const handleViewDetails = (formulaId: string) => {
    setSelectedFormulaId(formulaId);
    setDetailsOpen(true);
  };

  const handleCancelFormula = async (formulaId: string) => {
    if (!firestore) return;
    
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const formulaRef = doc(firestore, 'formulas', formulaId);
      await updateDoc(formulaRef, { status: 'anulada' });
      
      toast({
        title: 'Fórmula Anulada',
        description: 'La fórmula ha sido anulada exitosamente.',
      });
    } catch (error) {
      console.error('Error al anular fórmula:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo anular la fórmula.',
      });
    }
  };

  const handleDownloadPDF = (formula: any) => {
    // Por ahora solo mostramos un mensaje, luego se puede implementar la generación del PDF
    toast({
      title: 'Descargar PDF',
      description: 'Funcionalidad de descarga en desarrollo.',
    });
  };

  const handleResendToPatient = (formula: any) => {
    // Funcionalidad para reenviar al paciente
    toast({
      title: 'Fórmula Reenviada',
      description: `La fórmula ha sido reenviada a ${formula.patientName}.`,
    });
  };

  const selectedFormulaDetails = formulas?.find(f => f.id === selectedFormulaId);

  return (
    <>
      <Header />
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold font-headline">
              Gestión de Fórmulas
            </h1>
            <p className="text-muted-foreground">
              Crea y administra las recetas médicas de tus pacientes.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Crear Nueva Fórmula
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-2xl">
                  <FilePlus className="h-6 w-6 text-blue-600" />
                  Emitir Nueva Fórmula Médica
                </DialogTitle>
                <DialogDescription>
                  Completa los campos para generar una nueva receta. La firma se agregará automáticamente.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* Sección: Selección de Paciente */}
                <div className="space-y-3">
                  <Label htmlFor="patient-search" className="text-base font-semibold">
                    Seleccionar Paciente
                  </Label>
                  
                  {/* Buscador */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="patient-search"
                      placeholder="Buscar por nombre o correo..."
                      className="pl-10"
                      value={patientSearchTerm}
                      onChange={(e) => setPatientSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Paciente seleccionado */}
                  {selectedPatient && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <Avatar className="h-12 w-12 border-2 border-blue-300">
                        <AvatarImage src={selectedPatient.photoURL} alt={selectedPatient.displayName} />
                        <AvatarFallback className="bg-blue-200 text-blue-700 font-semibold">
                          {selectedPatient.displayName?.charAt(0) || 'P'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900">Paciente seleccionado:</p>
                        <p className="text-sm font-semibold text-blue-700">{selectedPatient.displayName}</p>
                        <p className="text-xs text-blue-600">{selectedPatient.email}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setNewFormula(prev => ({ ...prev, patientId: '' }))}
                        className="h-8 w-8 hover:bg-red-100 shrink-0"
                        title="Deseleccionar paciente"
                      >
                        <XCircle className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  )}

                  {/* Lista de pacientes recientes */}
                  {!patientSearchTerm && recentPatients.length > 0 && !selectedPatient && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Pacientes recientes:</p>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {recentPatients.map((patient) => (
                          <button
                            key={patient.id}
                            type="button"
                            onClick={() => setNewFormula(prev => ({ ...prev, patientId: patient.id }))}
                            className="w-full flex items-center gap-3 text-left p-3 rounded-lg border hover:bg-blue-50 hover:border-blue-300 transition-colors"
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={patient.photoURL} alt={patient.displayName} />
                              <AvatarFallback className="bg-blue-100 text-blue-700">
                                {patient.displayName?.charAt(0) || 'P'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{patient.displayName}</p>
                              <p className="text-xs text-muted-foreground">{patient.email}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lista de pacientes filtrados */}
                  {patientSearchTerm && filteredPatients.length > 0 && (
                    <div className="space-y-1 max-h-60 overflow-y-auto border rounded-lg p-2">
                      {filteredPatients.map((patient) => (
                        <button
                          key={patient.id}
                          type="button"
                          onClick={() => {
                            setNewFormula(prev => ({ ...prev, patientId: patient.id }));
                            setPatientSearchTerm('');
                          }}
                          className="w-full flex items-center gap-3 text-left p-3 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={patient.photoURL} alt={patient.displayName} />
                            <AvatarFallback className="bg-blue-100 text-blue-700">
                              {patient.displayName?.charAt(0) || 'P'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{patient.displayName}</p>
                            <p className="text-xs text-muted-foreground">{patient.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {patientSearchTerm && filteredPatients.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No se encontraron pacientes con ese criterio.
                    </p>
                  )}
                </div>

                <div className="border-t pt-6" />

                {/* Sección: Medicamentos */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Medicamentos Recetados</Label>
                  
                  {/* Lista de medicamentos agregados */}
                  {medications.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {medications.map((med, index) => (
                        <div key={index} className="flex justify-between items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-blue-900">{med.name}</p>
                            <p className="text-xs text-blue-700 mt-1">{med.dosage}</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setMedications(meds => meds.filter((_, i) => i !== index))}
                            className="h-8 w-8 hover:bg-red-100"
                          >
                            <XCircle className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Formulario para agregar medicamento */}
                  <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                    <div className="space-y-2">
                      <Label htmlFor="medication-name" className="text-sm">
                        Nombre del Medicamento
                      </Label>
                      <Input
                        id="medication-name"
                        placeholder="Ej: Acetaminofén 500mg"
                        value={newFormula.medicationName}
                        onChange={e => setNewFormula(p => ({...p, medicationName: e.target.value}))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="medication-dosage" className="text-sm">
                        Dosis e Indicaciones
                      </Label>
                      <Textarea
                        id="medication-dosage"
                        placeholder="Ej: 1 tableta cada 8 horas por 3 días"
                        rows={2}
                        value={newFormula.dosage}
                        onChange={e => setNewFormula(p => ({...p, dosage: e.target.value}))}
                      />
                    </div>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleAddMedication}
                      className="w-full"
                      disabled={!newFormula.medicationName || !newFormula.dosage}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" /> Agregar Medicamento
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-6" />

                {/* Sección: Observaciones */}
                <div className="space-y-2">
                  <Label htmlFor="observations" className="text-base font-semibold">
                    Observaciones Generales
                  </Label>
                  <Textarea
                    id="observations"
                    placeholder="Indicaciones adicionales para el paciente (dieta, actividades, precauciones, etc.)"
                    rows={4}
                    value={newFormula.observations}
                    onChange={e => setNewFormula(p => ({...p, observations: e.target.value}))}
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button 
                  type="submit" 
                  onClick={handleCreateFormula}
                  disabled={!newFormula.patientId || medications.length === 0}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  Guardar y Enviar Fórmula
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por paciente o fórmula..."
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Fecha Emisión</TableHead>
                  <TableHead>Medicamentos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingFormulas && [...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                ))}
                {formulas?.map((formula: any) => (
                  <TableRow key={formula.id}>
                    <TableCell className="font-medium">
                      {formula.patientName}
                    </TableCell>
                    <TableCell>{format(new Date(formula.date), 'PPP')}</TableCell>
                    <TableCell>
                      {formula.medications[0].name}
                      {formula.medications.length > 1 &&
                        ` (+${formula.medications.length - 1})`}
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
                          <DropdownMenuItem onClick={() => handleViewDetails(formula.id)}>
                            <FileText className="mr-2 h-4 w-4" />
                            Ver detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadPDF(formula)}>
                            <Download className="mr-2 h-4 w-4" />
                            Descargar PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResendToPatient(formula)}>
                            <Send className="mr-2 h-4 w-4" />
                            Reenviar a paciente
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleCancelFormula(formula.id)}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Anular fórmula
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
           <CardFooter className="py-4 text-sm text-muted-foreground">
             Mostrando {formulas?.length ?? 0} de {formulas?.length ?? 0} fórmulas.
          </CardFooter>
        </Card>

        {/* Dialog para ver detalles de la fórmula */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Detalles de la Fórmula Médica</DialogTitle>
              <DialogDescription>
                Información completa de la receta médica
              </DialogDescription>
            </DialogHeader>
            
            {selectedFormulaDetails && (
              <div className="space-y-6">
                {/* Información del Paciente */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg border-b pb-2">Información del Paciente</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Nombre</p>
                      <p className="font-medium">{selectedFormulaDetails.patientName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Estado</p>
                      <Badge variant={getStatusVariant(selectedFormulaDetails.status || 'activa')}>
                        {selectedFormulaDetails.status ? (selectedFormulaDetails.status.charAt(0).toUpperCase() + selectedFormulaDetails.status.slice(1)) : 'Activa'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Información del Médico */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg border-b pb-2">Información del Médico</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Médico</p>
                      <p className="font-medium">{selectedFormulaDetails.doctorName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha de Emisión</p>
                      <p className="font-medium">{format(new Date(selectedFormulaDetails.date), 'PPP')}</p>
                    </div>
                  </div>
                </div>

                {/* Medicamentos Prescritos */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg border-b pb-2">Medicamentos Prescritos</h3>
                  <div className="space-y-3">
                    {selectedFormulaDetails.medications?.map((med: any, index: number) => (
                      <Card key={index} className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-lg">{med.name}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              <span className="font-medium">Dosis:</span> {med.dosage}
                            </p>
                          </div>
                          <Badge variant="outline">{index + 1}</Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Observaciones */}
                {selectedFormulaDetails.observations && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg border-b pb-2">Observaciones Médicas</h3>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{selectedFormulaDetails.observations}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                Cerrar
              </Button>
              {selectedFormulaDetails && (
                <>
                  <Button 
                    variant="default" 
                    onClick={() => {
                      handleDownloadPDF(selectedFormulaDetails);
                      setDetailsOpen(false);
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Descargar PDF
                  </Button>
                  {selectedFormulaDetails.status !== 'anulada' && (
                    <Button 
                      variant="destructive" 
                      onClick={() => {
                        handleCancelFormula(selectedFormulaDetails.id);
                        setDetailsOpen(false);
                      }}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Anular Fórmula
                    </Button>
                  )}
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
