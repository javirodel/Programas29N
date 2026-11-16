"use client";

import Link from "next/link";
import { Button, buttonClasses } from "@/modules/ui/components/Button";
import { Card } from "@/modules/ui/components/Card";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl py-16">
      <Card className="space-y-5 p-8 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-civic">Aviso</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          No se pudo cargar esta vista
        </h1>
        <p className="text-sm leading-relaxed text-ink-secondary sm:text-base">
          Se ha producido un error inesperado al cargar la información. Puedes reintentar o volver a
          la página principal.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Button variant="primary" size="md" onClick={reset}>
            Reintentar
          </Button>
          <Link href="/" className={buttonClasses({ variant: "secondary", size: "md" })}>
            Ir al inicio
          </Link>
        </div>
      </Card>
    </div>
  );
}
