import { useWixForm, FORM_ERROR } from "../hooks/forms/useWixForm";
import type { FormDto } from "../wix/forms/types";

const FORM_ID = "b61d8f4f-b91a-4d58-966f-add9875ed345";

export default function PetCareEnquiryForm({ initialForm }: { initialForm?: FormDto }) {
  const form = useWixForm(FORM_ID, { initialForm });

  if (form.outcome) {
    return <div className="enquiry-success" role="status"><strong>Pedido recebido.</strong><p>{form.outcome.message || "Entraremos em contato pelos dados informados para confirmar disponibilidade e próximos passos."}</p><button type="button" onClick={form.reset}>Enviar outro pedido</button></div>;
  }
  if (!form.form) {
    return <p className="enquiry-status" role="status">{form.errors[FORM_ERROR] || "Carregando o pré-cadastro…"}</p>;
  }
  if (form.closed) {
    return <p className="enquiry-status" role="status">{form.form.disabledMessage || "O pré-cadastro está indisponível no momento. Entre em contato pelo WhatsApp."}</p>;
  }

  return <form className="enquiry-form" noValidate onSubmit={event => { void form.submit(event); }}>
    <div className="enquiry-fields">
      {form.form.fields.map(field => <div className="enquiry-field" key={field.target}>
        <label htmlFor={`petcare-${field.target}`}>{field.label}{field.required && <span aria-hidden="true"> *</span>}</label>
        {field.control === "select" ? <select id={`petcare-${field.target}`} {...form.bind(field.target)}><option value="">Selecione</option>{field.choices.map(choice => <option key={choice.value} value={choice.value}>{choice.label}</option>)}</select>
          : field.control === "textarea" ? <textarea id={`petcare-${field.target}`} {...form.bind(field.target)} />
          : <input id={`petcare-${field.target}`} type={field.control === "email" ? "email" : field.control === "phone" ? "tel" : "text"} autoComplete={field.control === "email" ? "email" : field.control === "phone" ? "tel" : field.target === "nome" ? "name" : "address-level2"} {...form.bind(field.target)} />}
        {field.description && <small>{field.description}</small>}
        {form.errors[field.target] && <small className="enquiry-error" id={`err-${field.target}`}>{form.errors[field.target]}</small>}
      </div>)}
    </div>
    <p className="enquiry-privacy">Usaremos nome, contato, cidade e assunto apenas para responder ao pedido. Não informe dados clínicos ou informações sensíveis neste formulário. O envio não confirma agendamento.</p>
    {form.errors[FORM_ERROR] && <p className="enquiry-error" role="alert">{form.errors[FORM_ERROR]}</p>}
    <button className="button gold" type="submit" disabled={form.loading}>{form.loading ? "Enviando…" : form.form.submitText || "Enviar pré-cadastro"}</button>
  </form>;
}
