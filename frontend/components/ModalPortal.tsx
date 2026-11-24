"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Renderiza modales y notificaciones directamente en `document.body`.
 * Así evitan el contexto de apilamiento del contenido principal (`z-10`)
 * y siempre quedan por encima del Sidebar (`z-50`).
 */
export default function ModalPortal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(children, document.body);
}
