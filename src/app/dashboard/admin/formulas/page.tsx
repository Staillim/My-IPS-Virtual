'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

const getStatusVariant = (status: string) => {
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

export default function AdminFormulasPage() {
  const [date, setDate] = useState<Date | undefined>();
  const firestore = useFirestore();

  const formulasCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, 'formulas') : null, [firestore]);
  const { data: formulas, isLoading: isLoadingFormulas } = useCollection(formulasCollectionRef);

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
                  className={cn('justify-start text-left font-normal', !date && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP', { locale: es }) : <span>Filtrar por fecha</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={setDate} initialFocus locale={es} /></PopoverContent>
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
                          <DropdownMenuItem><FileText className="mr-2 h-4 w-4" />Ver Detalles</DropdownMenuItem>
                          <DropdownMenuItem><Download className="mr-2 h-4 w-4" />Descargar PDF</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive"><XCircle className="mr-2 h-4 w-4" />Anular Fórmula</DropdownMenuItem>
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
    </>
  );
}
