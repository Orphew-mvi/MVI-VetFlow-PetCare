import type { APIRoute } from "astro";
import { ADMIN_COOKIE } from "../../../lib/petflow-admin-auth";

export const POST: APIRoute = async ({ request, cookies }) => {
  if (request.headers.get("origin") !== "https://www.mvipetcare.net") return new Response(null, { status: 403 });
  cookies.delete(ADMIN_COOKIE, { path: "/" });
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
};
