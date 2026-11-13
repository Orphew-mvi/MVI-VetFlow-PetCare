import type { APIRoute } from "astro";
import { auth } from "@wix/essentials";
import { submissions } from "@wix/forms";
import { ADMIN_COOKIE, checkSession } from "../../../lib/petflow-admin-auth";

const FORM_ID = "b61d8f4f-b91a-4d58-966f-add9875ed345";

export const GET: APIRoute = async ({ cookies }) => {
  const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
  try {
    if (!await checkSession(cookies.get(ADMIN_COOKIE)?.value)) return new Response(JSON.stringify({ error: "Não autenticado." }), { status: 401, headers });
    const query = auth.elevate(submissions.querySubmissionsByNamespace);
    const result = await query().eq("namespace", "wix.form_app.form").find();
    const items = Array.isArray(result) ? result : result.items ?? [];
    const leads = items.filter(item => item.formId === FORM_ID).map(item => ({
      id: item._id,
      date: item._createdDate,
      nome: item.submissions?.nome ?? "",
      email: item.submissions?.email ?? "",
      telefone: item.submissions?.telefone ?? "",
      cidade: item.submissions?.cidade ?? "",
      servico: item.submissions?.servico ?? ""
    }));
    return new Response(JSON.stringify({ leads }), { headers });
  } catch {
    return new Response(JSON.stringify({ error: "Não foi possível carregar os pré-cadastros." }), { status: 503, headers });
  }
};
