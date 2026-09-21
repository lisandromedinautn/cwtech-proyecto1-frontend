import {
  Layers,
  ShoppingBag,
  Tag,
  Users,
  ShoppingCart,
  FileText,
  ClipboardList,
  PackageCheck,
  Upload,
  Warehouse,
  PackageMinus,
  DollarSign,
  MapPin,
  Building,
  Banknote,
  Archive,
  CreditCard,
  Receipt,
  Landmark,
  Home,
  Smartphone,
  Bell,
  MessageSquare,
  Boxes,
} from "lucide-react";
import { Rol } from "../../interfaces/generales/interfaces-generales";

export interface MenuItem {
  icon: React.FC<{ className?: string }>;
  label: string;
  path: string;
  subMenu?: MenuItem[];
  visibleOnMobile?: boolean;
  roles?: number[];
}

export const menuItems: MenuItem[] = [
  {
    icon: Home,
    label: "Inicio",
    path: "/admin",
  },

  {
    icon: ShoppingBag,
    label: "Gestión Productos",
    path: "",
    subMenu: [
      {
        icon: ShoppingBag,
        label: "Producto",
        path: "producto",
        subMenu: [
          { icon: DollarSign, label: "Cambio de Precios Masivo", path: "cambio-precios-masivo" },
        ],
        roles: [Rol.ADMINISTRADOR, Rol.VENDEDOR, Rol.REPARTIDOR, Rol.REPOSITOR, Rol.ROOT],
      },
      {
        icon: DollarSign,
        label: "Configuración",
        path: "",
        subMenu: [
          { icon: Tag, label: "Marca", path: "marca" },
          { icon: Layers, label: "Líneas", path: "linea" },
          { icon: Boxes, label: "SuperLíneas", path: "superlinea" },
        ],
        roles: [Rol.ADMINISTRADOR, Rol.ROOT],
      },
    ],
    roles: [Rol.ADMINISTRADOR, Rol.VENDEDOR, Rol.REPARTIDOR, Rol.REPOSITOR, Rol.ROOT],
  },

  {
    icon: Building,
    label: "Organización",
    path: "",
    subMenu: [
      {
        icon: Users,
        label: "Cliente",
        path: "cliente",
        roles: [Rol.ADMINISTRADOR, Rol.VENDEDOR, Rol.REPARTIDOR, Rol.COBRADOR, Rol.ROOT],
      },
      { icon: Users, label: "Proveedor", path: "proveedor", roles: [Rol.ADMINISTRADOR, Rol.ROOT] },
      { icon: Users, label: "Personal", path: "personal", visibleOnMobile: false, roles: [Rol.ADMINISTRADOR, Rol.ROOT] },
    ],
    roles: [Rol.ADMINISTRADOR, Rol.VENDEDOR, Rol.REPARTIDOR, Rol.COBRADOR, Rol.ROOT],
  },
];