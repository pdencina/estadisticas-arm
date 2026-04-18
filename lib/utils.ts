import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFecha(fecha: string) {
  return format(parseISO(fecha), "dd MMM yyyy", { locale: es });
}

export function formatNumero(n: number) {
  return n.toLocaleString("es-CL");
}

export function formatDelta(n: number) {
  if (n > 0) return `↑ ${formatNumero(n)}`;
  if (n < 0) return `↓ ${formatNumero(Math.abs(n))}`;
  return "= 0";
}

export function deltaClass(n: number) {
  if (n > 0) return "text-emerald-500";
  if (n < 0) return "text-red-500";
  return "text-gray-400";
}

export const TIPO_ENCUENTRO_LABELS: Record<string, string> = {
  domingo:          "Domingo",
  miercoles:        "Miércoles",
  jueves:           "Jueves",
  sabado:           "Sábado",
  prayer_room:      "Prayer Room",
  encuentro_global: "Encuentro Global",
  otro:             "Otro",
};

export const MODALIDAD_LABELS: Record<string, string> = {
  presencial: "Presencial",
  online:     "Online",
  hibrido:    "Híbrido",
};

export const ROL_LABELS: Record<string, string> = {
  admin_global:  "Admin Global",
  admin_campus:  "Adm. Campus",
  voluntario:    "Voluntario",
};

export const HORARIOS = [
  "9:00","11:00","13:00","17:00","17:30",
  "18:00","19:00","19:30","20:00",
];

export const TIPOS_ENCUENTRO = [
  { value: "domingo",          label: "Domingo"          },
  { value: "miercoles",        label: "Miércoles"        },
  { value: "jueves",           label: "Jueves"           },
  { value: "sabado",           label: "Sábado"           },
  { value: "prayer_room",      label: "Prayer Room"      },
  { value: "encuentro_global", label: "Encuentro Global" },
  { value: "otro",             label: "Otro"             },
];
