import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createAdminClient();
  const PAGE = 1000;

  // Fetch all encounters to extract unique predicadores, lideres, admins
  const predicadores = new Set<string>();
  const lideres = new Set<string>();
  const admins = new Set<string>();

  let offset = 0;
  while (true) {
    const { data } = await supabase
      .from("encuentros")
      .select("predicador, lideres_voluntarios, admins_campus")
      .range(offset, offset + PAGE - 1);
    if (!data || data.length === 0) break;

    for (const row of data) {
      if (row.predicador) {
        row.predicador.split(",").forEach((p: string) => {
          const t = p.trim();
          if (t && t.length > 1) predicadores.add(t);
        });
      }
      if (row.lideres_voluntarios) {
        row.lideres_voluntarios.split(/[,&\/]/).forEach((p: string) => {
          const t = p.trim();
          if (t && t.length > 1) lideres.add(t);
        });
      }
      if (row.admins_campus) {
        row.admins_campus.split(/[,&\/]/).forEach((p: string) => {
          const t = p.trim();
          if (t && t.length > 1) admins.add(t);
        });
      }
    }

    if (data.length < PAGE) break;
    offset += PAGE;
  }

  return NextResponse.json({
    predicadores: Array.from(predicadores).sort(),
    lideres: Array.from(lideres).sort(),
    admins: Array.from(admins).sort(),
  });
}
