import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { InformeSemanal } from "@/types";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: informe } = await supabase
    .from("informes_semanales")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!informe) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const inf = informe as InformeSemanal;

  // Build CSV
  const lines: string[] = [];
  lines.push("ARM Estadísticas - Informe Semanal");
  lines.push(`Semana ${inf.semana_numero} - ${inf.semana_inicio} al ${inf.semana_fin}`);
  lines.push("");
  lines.push("RESUMEN GENERAL");
  lines.push(`Total asistentes,${inf.total_general}`);
  lines.push(`En auditorio,${inf.total_auditorio}`);
  lines.push(`Aceptaron a Jesús,${inf.total_paj}`);
  lines.push(`Contador de almas,${inf.contador_almas}`);
  lines.push("");

  if (inf.datos_por_campus && inf.datos_por_campus.length > 0) {
    lines.push("DESGLOSE POR CAMPUS");
    lines.push("Campus,Total General,Auditorio,PAJ,Diferencia General,Diferencia Auditorio,Diferencia PAJ");
    for (const c of inf.datos_por_campus) {
      lines.push(`${c.campus_nombre},${c.total_general},${c.total_auditorio},${c.total_paj},${c.diferencia_general},${c.diferencia_auditorio},${c.diferencia_paj}`);
    }
  }

  const csv = lines.join("\n");
  const filename = `informe-semana-${inf.semana_numero}-${inf.anio}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
