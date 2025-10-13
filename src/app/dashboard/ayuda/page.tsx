'use client';

import { Header } from '@/components/header';

export default function AyudaPage() {
  return (
    <>
      <Header />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold">Ayuda y Soporte</h1>
        <p className="text-muted-foreground">Aquí encontrarás ayuda.</p>
      </div>
    </>
  );
}
