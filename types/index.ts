export type UserRole = "admin_global" | "admin_campus" | "voluntario";

export interface Campus {
  id: string;
  nombre: string;
  ciudad: string;
  pais: string;
  zona_horaria: string;
  activo: boolean;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  nombre: string;
  rol: UserRole;
  campus_id: string | null;
  campus?: Campus;
  activo: boolean;
  created_at: string;
}

export type TipoEncuentro =
  | "domingo" | "miercoles" | "jueves" | "sabado"
  | "prayer_room" | "encuentro_global" | "otro";

export type Modalidad = "presencial" | "online" | "hibrido";

export interface AsistenciaDetalle {
  auditorio: number;
  kids: number;
  tweens: number;
  sala_bebe: number;
  sala_sensorial: number;
  cambio: number;
}

export interface VoluntariosDetalle {
  servicio: number;
  tecnica: number;
  kids: number;
  tweens: number;
  worship: number;
  cocina: number;
  rrss: number;
  seguridad: number;
  sala_bebes: number;
  conexion: number;
  oracion: number;
  merch: number;
  amor_por_la_casa: number;
  sala_sensorial: number;
  punto_siembra: number;
  cambios: number;
}

export interface OnlineDetalle {
  acepto_jesus: number;
  espectadores_max: number;
}

export interface Encuentro {
  id: string;
  campus_id: string;
  campus?: Campus;
  fecha: string;
  tipo: TipoEncuentro;
  horario: string;
  modalidad: Modalidad;
  predicador: string | null;
  nombre_mensaje: string | null;
  total_general: number;
  acepto_jesus_presencial: number;
  asistencia: AsistenciaDetalle;
  voluntarios: VoluntariosDetalle;
  online: OnlineDetalle;
  lideres_voluntarios: string | null;
  admins_campus: string | null;
  reportado_por: string | null;
  estado: "borrador" | "enviado" | "validado";
  created_at: string;
  updated_at: string;
}

export interface InformeSemanal {
  id: string;
  semana_inicio: string;
  semana_fin: string;
  anio: number;
  semana_numero: number;
  total_general: number;
  total_auditorio: number;
  total_paj: number;
  contador_almas: number;
  datos_por_campus: CampusSemanaData[];
  generado_por: string | null;
  created_at: string;
}

export interface CampusSemanaData {
  campus_id: string;
  campus_nombre: string;
  total_general: number;
  total_auditorio: number;
  total_paj: number;
  diferencia_general: number;
  diferencia_auditorio: number;
  diferencia_paj: number;
}

export type NuevoEncuentroForm = Omit<
  Encuentro,
  "id" | "campus" | "reportado_por" | "estado" | "created_at" | "updated_at"
>;

export interface DashboardKPIs {
  semana_actual: {
    total_general: number;
    total_auditorio: number;
    total_paj: number;
  };
  semana_anterior: {
    total_general: number;
    total_auditorio: number;
    total_paj: number;
  };
  diferencias: {
    total_general: number;
    total_auditorio: number;
    total_paj: number;
  };
}

export type CampusConStats = Campus & {
  semana_actual: { total: number; aud: number; paj: number };
  semana_anterior: { total: number; aud: number; paj: number };
  diferencias: { total: number; aud: number; paj: number };
};
