import {
  FileText,
  LayoutDashboard,
  Palmtree,
  UsersRound,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  sublabel: string;
  description: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    sublabel: "Inicio",
    description: "Resumen ejecutivo",
    icon: LayoutDashboard,
  },
  {
    href: "/personal",
    label: "Personal",
    sublabel: "Empleados",
    description: "Gestión de empleados",
    icon: UsersRound,
  },
  {
    href: "/nomina",
    label: "Nómina y Pagos",
    sublabel: "Procesos quincenales",
    description: "Procesamiento y pagos",
    icon: WalletCards,
  },
  {
    href: "/vacaciones",
    label: "Vacaciones y Bono Vacacional",
    sublabel: "Solicitudes y planificación",
    description: "Vacaciones y bono vacacional",
    icon: Palmtree,
  },
  {
    href: "/liquidaciones",
    label: "Liquidaciones",
    sublabel: "Finiquitos",
    description: "Finiquitos y prestaciones",
    icon: FileText,
  },
];

export function getNavItem(pathname: string): NavItem {
  return navItems.find((item) => item.href === pathname) ?? navItems[0];
}
