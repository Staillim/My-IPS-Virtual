
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
import {
  Search,
  Download,
  FileText,
  User,
  Stethoscope,
  Paperclip,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const mockPatientHistory = {
  patientSummary: {
    id: '',
    name: '',
    email: '',
    age: 0,
    bloodType: '',
    allergies: '',
  },
  diagnoses: [],
  consultations: [],
  formulas: [],
  documents: []
};


export default function AdminReportesPage() {
    const [selectedHistory, setSelectedHistory] = useState<any>(null);

  return (
    <>
      <Header />
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-headline">Historias Clínicas y Reportes</h1>
          <p className="text-muted-foreground">
            Consulta y exporta la información clínica de los pacientes.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                 <Card>
                    <CardHeader>
                        <CardTitle>Búsqueda de Pacientes</CardTitle>
                        <CardDescription>Busca por nombre, documento o médico.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input placeholder="Buscar paciente..." className="pl-10" />
                        </div>
                         <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input placeholder="Buscar por médico tratante..." className="pl-10" />
                        </div>
                        <Button className="w-full" onClick={() => setSelectedHistory(mockPatientHistory)}>Buscar</Button>
                    </CardContent>
                </Card>
                
            </div>

            <div className="lg:col-span-2">
                {selectedHistory ? (
                     <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-2xl">{selectedHistory.patientSummary.name}</CardTitle>
                                    <CardDescription>ID: {selectedHistory.patientSummary.id} | Edad: {selectedHistory.patientSummary.age} años</CardDescription>
                                </div>
                                <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Exportar PDF</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                             <Accordion type="multiple" defaultValue={['item-1', 'item-2', 'item-3']} className="w-full">
                                <AccordionItem value="item-1">
                                    <AccordionTrigger><div className="flex items-center gap-2"><User className="h-4 w-4" /> Datos Generales</div></AccordionTrigger>
                                    <AccordionContent>
                                        <div className="grid grid-cols-2 gap-4 text-sm py-2">
                                            <div><p className="font-semibold">Email:</p><p className="text-muted-foreground">{selectedHistory.patientSummary.email}</p></div>
                                            <div><p className="font-semibold">Alergias:</p><p className="text-muted-foreground">{selectedHistory.patientSummary.allergies}</p></div>
                                            <div><p className="font-semibold">Grupo Sanguíneo:</p><p className="text-muted-foreground">{selectedHistory.patientSummary.bloodType}</p></div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                                 <AccordionItem value="item-2">
                                    <AccordionTrigger><div className="flex items-center gap-2"><Stethoscope className="h-4 w-4" /> Consultas y Diagnósticos</div></AccordionTrigger>
                                    <AccordionContent>
                                        <h4 className="font-semibold text-md mb-2">Diagnósticos</h4>
                                        {selectedHistory.diagnoses.map((diag: any, index: number) => (
                                        <div key={index} className="flex justify-between items-center text-sm p-2 bg-muted/40 rounded-md mb-2">
                                            <p><span className="font-medium">{diag.date}:</span> <span className="text-muted-foreground">{diag.diagnosis}</span></p>
                                            <p className="text-xs text-muted-foreground">Dr. {diag.doctor}</p>
                                        </div>
                                        ))}
                                        <h4 className="font-semibold text-md mt-4 mb-2">Consultas</h4>
                                        {selectedHistory.consultations.map((item: any) => (
                                            <div key={item.id} className="flex justify-between items-center text-sm p-2 hover:bg-muted/40 rounded-md">
                                                <p><span className="font-medium">{item.date}:</span> <span className="text-muted-foreground">{item.specialty} con {item.doctor}</span></p>
                                                <Badge variant={item.status === 'finalizada' ? 'secondary' : 'default'}>{item.status}</Badge>
                                            </div>
                                        ))}
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-3">
                                    <AccordionTrigger><div className="flex items-center gap-2"><FileText className="h-4 w-4" /> Fórmulas Médicas</div></AccordionTrigger>
                                    <AccordionContent>
                                        {selectedHistory.formulas.map((formula: any, index: number) => (
                                            <div key={index} className="flex justify-between items-center text-sm p-2 hover:bg-muted/40 rounded-md">
                                                <p><span className="font-medium">Fórmula del {formula.date}</span></p>
                                                <p className="text-xs text-muted-foreground">Emitida por: {formula.doctor}</p>
                                            </div>
                                        ))}
                                    </AccordionContent>
                                </AccordionItem>
                                 <AccordionItem value="item-4">
                                    <AccordionTrigger><div className="flex items-center gap-2"><Paperclip className="h-4 w-4" /> Documentos Adjuntos</div></AccordionTrigger>
                                    <AccordionContent>
                                        {selectedHistory.documents.map((doc: any, index: number) => (
                                            <Link href={doc.url} key={index} target="_blank" rel="noopener noreferrer" className="flex justify-between items-center text-sm p-3 bg-card hover:bg-muted/50 rounded-lg border transition-colors cursor-pointer">
                                                <p className="font-medium">{doc.name}</p>
                                                <Download className="h-5 w-5 text-muted-foreground"/>
                                            </Link>
                                        ))}
                                        {selectedHistory.documents.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No hay documentos.</p>}
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-lg h-full">
                        <Search className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold">Realiza una búsqueda</h3>
                        <p className="text-muted-foreground">
                            Utiliza el panel de búsqueda para encontrar y mostrar la historia clínica de un paciente.
                        </p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </>
  );
}
