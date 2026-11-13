import { submissions } from "@wix/forms";
import { notifyNewLead } from "../../../../lib/petflow-telegram";

const FORM_ID = "b61d8f4f-b91a-4d58-966f-add9875ed345";

export default submissions.onSubmissionCreated(async event => {
  const submission = event.entity;
  if (submission?.formId !== FORM_ID) return;
  const values = submission.submissions || {};
  await notifyNewLead({
    nome: String(values.nome || ""), email: String(values.email || ""),
    telefone: String(values.telefone || ""), cidade: String(values.cidade || ""),
    servico: String(values.servico || "")
  });
});
