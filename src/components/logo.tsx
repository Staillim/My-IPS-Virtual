import Link from "next/link";
import { HeartPulse } from "lucide-react";

export function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary flex-shrink-0">
        <HeartPulse className="h-6 w-6 text-primary-foreground" />
      </div>
      <div>
        <h1 className="text-lg font-bold text-foreground leading-tight">
          IPS Virtual
        </h1>
        <p className="text-xs text-muted-foreground leading-tight">Salud en Casa</p>
      </div>
    </Link>
  );
}
