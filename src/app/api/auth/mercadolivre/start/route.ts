import { NextResponse } from "next/server";
import { ML_REDIRECT_URI } from "@/infrastructure/integrations/mercadolivre-auth";

export const dynamic = "force-dynamic";

export function GET() {
  const clientId = process.env.ML_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: "ML_CLIENT_ID ausente" }, { status: 500 });
  const url = new URL("https://auth.mercadolivre.com.br/authorization");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", ML_REDIRECT_URI);
  return NextResponse.redirect(url.toString());
}
