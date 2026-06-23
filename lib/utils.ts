import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmt(n: number) {
  return n.toLocaleString("es-CL");
}

export function fmtFecha(fecha: string) {
  return format(parseISO(fecha), "dd-MM-yyyy", { locale: es });
}

export function fmtDelta(n: number) {
  if (n > 0) return `↑ ${fmt(n)}`;
  if (n < 0) return `↓ ${fmt(Math.abs(n))}`;
  return "— 0";
}

export function deltaColor(n: number) {
  if (n > 0) return "text-emerald-500";
  if (n < 0) return "text-red-500";
  return "text-gray-400";
}

export const TIPO_LABELS: Record<string, string> = {
  domingo:            "Domingo",
  miercoles:          "Miércoles Global",
  jueves:             "Jueves",
  sabado:             "Sábado",
  prayer_room:        "Prayer Room",
  encuentro_mujeres:  "Encuentro Mujeres",
  encuentro_jovenes:  "Encuentro Jóvenes",
  encuentro_hombres:  "Encuentro Hombres",
  encuentro_global:   "Encuentro Global",
  otro:               "Otro",
};

export const MODALIDAD_LABELS: Record<string, string> = {
  presencial: "Presencial",
  online:     "Online",
  hibrido:    "Híbrido",
};

export const ROL_LABELS: Record<string, string> = {
  admin_global: "Admin Global",
  admin_campus: "Adm. Campus",
  voluntario:   "Líder Voluntario",
};

export const ESTADO_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  enviado:   "Enviado",
  validado:  "Validado",
};

export const TIPOS_ENCUENTRO = [
  { value: "domingo",            label: "Domingo"            },
  { value: "miercoles",          label: "Miércoles Global"   },
  { value: "jueves",             label: "Jueves"             },
  { value: "sabado",             label: "Sábado"             },
  { value: "prayer_room",        label: "Prayer Room"        },
  { value: "encuentro_mujeres",  label: "Encuentro Mujeres"  },
  { value: "encuentro_jovenes",  label: "Encuentro Jóvenes"  },
  { value: "encuentro_hombres",  label: "Encuentro Hombres"  },
  { value: "otro",               label: "Otro"               },
];

export const HORARIOS = [
  "9:00","10:00","11:00","11:30","13:00",
  "17:00","17:30","18:00","19:00","19:30","20:00",
];

// Campus → color para gráficos
export const PAIS_COLOR: Record<string, string> = {
  Chile:     "#7F77DD",
  Uruguay:   "#1D9E75",
  Venezuela: "#D85A30",
  "EE.UU.":  "#534AB7",
  Argentina: "#0F6E56",
};

// Iniciales de nombre
export function initials(name: string) {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

// Semana actual (lunes→domingo)
export function semanaActual() {
  const hoy = new Date();
  const dia = hoy.getDay() || 7;
  const lunes = new Date(hoy); lunes.setDate(hoy.getDate() - dia + 1);
  const domingo = new Date(lunes); domingo.setDate(lunes.getDate() + 6);
  const lunesAnt = new Date(lunes); lunesAnt.setDate(lunes.getDate() - 7);
  const domAnt = new Date(lunesAnt); domAnt.setDate(lunesAnt.getDate() + 6);
  const f = (d: Date) => d.toISOString().split("T")[0];
  return { lA: f(lunes), dA: f(domingo), lAn: f(lunesAnt), dAn: f(domAnt) };
}

// Aliases para compatibilidad
export const formatNumero = fmt;
export const formatDelta = fmtDelta;
export const deltaClass = deltaColor;
export const formatFecha = fmtFecha;
export const TIPO_ENCUENTRO_LABELS = TIPO_LABELS;
