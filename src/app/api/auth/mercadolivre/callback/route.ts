import { NextResponse } from "next/server";
import { trocarCodePorToken } from "@/infrastructure/integrations/mercadolivre-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  if (!code) return NextResponse.redirect(`${origin}/admin?ml=erro`);
  try {
    await trocarCodePorToken(code);
    return NextResponse.redirect(`${origin}/admin?ml=conectado`);
  } catch (e) {
    return NextResponse.redirect(`${origin}/admin?ml=erro&msg=${encodeURIComponent((e as Error).message)}`);
  }
}
