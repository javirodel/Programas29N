import Link from "next/link";
import { buttonClasses } from "@/modules/ui/components/Button";
import { Card } from "@/modules/ui/components/Card";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl py-16">
      <Card className="space-y-5 p-8 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-civic">Error 404</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          Página o programa no encontrado
        </h1>
        <p className="text-sm leading-relaxed text-ink-secondary sm:text-base">
          La ruta solicitada no existe o corresponde a una candidatura que no dispone de programa
          publicado en la plataforma.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link href="/" className={buttonClasses({ variant: "primary", size: "md" })}>
            Volver al inicio
          </Link>
          <Link href="/programas" className={buttonClasses({ variant: "secondary", size: "md" })}>
            Ver todos los programas
          </Link>
        </div>
      </Card>
    </div>
  );
}
