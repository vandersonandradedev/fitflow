import { NextResponse, type NextRequest } from "next/server";

/**
 * Barreira grossa e barata (Edge): sem cookie de sessão, nem chega às rotas privadas.
 * NÃO é a autorização: ela acontece no servidor via `getTenantContext` (valida assinatura, vínculo,
 * tenant e revogação). Um cookie forjado passa por aqui e é rejeitado lá.
 */
const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];

export function middleware(request: NextRequest) {
  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));
  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/coach/:path*", "/student/:path*"] };
