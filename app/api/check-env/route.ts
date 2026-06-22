import { NextResponse } from "next/server";

export async function GET() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  return NextResponse.json({
    url_set: !!url,
    url_preview: url ? url.substring(0, 30) + "..." : "NOT SET",
    service_key_set: !!serviceKey,
    service_key_length: serviceKey?.length ?? 0,
    service_key_starts: serviceKey ? serviceKey.substring(0, 20) + "..." : "NOT SET",
  });
}
