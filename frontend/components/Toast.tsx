"use client";

import { useEffect, useRef } from "react";
import { CheckCircle2, X } from "lucide-react";

interface ToastProps {
  mensaje: string;
  onClose: () => void;
}

/** Notificación ligera de confirmación, visible incluso sobre los modales. */
export default function Toast({ mensaje, onClose }: ToastProps) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const temporizador = setTimeout(() => onCloseRef.current(), 4500);
    return () => clearTimeout(temporizador);
  }, [mensaje]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[200] flex max-w-sm items-start gap-3 rounded-xl border border-gold/50 bg-card/95 px-4 py-3 shadow-gold backdrop-blur-xl"
    >
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold-light" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">Correo enviado</p>
        <p className="mt-0.5 break-all text-sm text-muted">{mensaje}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar notificación"
        className="rounded-md p-1 text-muted transition hover:bg-line/60 hover:text-ink"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
