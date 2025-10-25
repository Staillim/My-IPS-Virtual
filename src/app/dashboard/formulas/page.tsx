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
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function FormulasPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

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

  return (
    <>
      <Header />
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-headline">Fórmulas Médicas</h1>
          <p className="text-muted-foreground">
            Consulta el historial de tus fórmulas médicas.
          </p>
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
                <Button variant="outline">
                  <Search className="mr-2" />
                  Ver Detalles
                </Button>
                <Button variant="outline">
                  <Download className="mr-2" />
                  Descargar PDF
                </Button>
                <Button>
                  <Repeat className="mr-2" />
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
