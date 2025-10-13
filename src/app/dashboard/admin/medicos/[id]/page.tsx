
'use client';

import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function EditMedicoPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  return (
    <>
      <Header />
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
            <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/admin/medicos">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a Médicos
                </Link>
            </Button>
        </div>
        <h1 className="text-3xl font-bold font-headline">
          Editar Perfil del Médico
        </h1>
        <p className="text-muted-foreground">
          ID del Médico: {id}
        </p>
        <p className="mt-4">
            Aquí irá el formulario para editar la información del médico.
        </p>
      </div>
    </>
  );
}
