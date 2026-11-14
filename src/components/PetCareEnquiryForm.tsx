import { useState } from "react";
import { useWixForm, FORM_ERROR } from "../hooks/forms/useWixForm";
import type { FormDto } from "../wix/forms/types";
import { normalizePetCarePhone, validPetCarePhone } from "../lib/petcare-phone";
import { normalizePetCareEmail, normalizePetCareText } from "../lib/petcare-contact";

const FORM_ID = "b61d8f4f-b91a-4d58-966f-add9875ed345";

export default function PetCareEnquiryForm({ initialForm }: { initialForm?: FormDto }) {
  const form = useWixForm(FORM_ID, { initialForm });
  const [phoneError, setPhoneError] = useState("");
  const [phoneInput, setPhoneInput] = useState("");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const phone = form.form?.fields.find(field => field.control === "phone");
    if (phone && !validPetCarePhone(String(form.values[phone.target] ?? ""))) {
      setPhoneError("Informe o DDD e o número completo. Se estiver fora do Brasil, comece com + e o DDI.");
      document.getElementById(`petcare-${phone.target}`)?.focus();
      return;
    }
    setPhoneError("");
    form.setValues(previous => ({
      ...previous,
      nome: normalizePetCareText(String(previous.nome ?? ""), 160),
      email: normalizePetCareEmail(String(previous.email ?? "")),
      cidade: normalizePetCareText(String(previous.cidade ?? ""), 160),
    }));
    void form.submit(event);
  }

  if (form.outcome) {
    return <div className="enquiry-success" role="status"><strong>Pedido recebido.</strong><p>{form.outcome.message || "Entraremos em contato pelos dados informados para confirmar disponibilidade e próximos passos."}</p><button type="button" onClick={() => { form.reset(); form.setValues({}); setPhoneInput(""); setPhoneError(""); }}>Enviar outro pedido</button></div>;
  }
  if (!form.form) {
    return <p className="enquiry-status" role="status">{form.errors[FORM_ERROR] || "Carregando o pré-cadastro…"}</p>;
  }
  if (form.closed) {
    return <p className="enquiry-status" role="status">{form.form.disabledMessage || "O pré-cadastro está indisponível no momento. Entre em contato pelo WhatsApp."}</p>;
  }

  return <form className="enquiry-form" autoComplete="off" noValidate onSubmit={submit}>
    <div className="enquiry-fields">
      {form.form.fields.map(field => <div className="enquiry-field" key={field.target}>
        <label htmlFor={`petcare-${field.target}`}>{field.label}{field.required && <span aria-hidden="true"> *</span>}</label>
        {field.control === "select" ? <select id={`petcare-${field.target}`} autoComplete="off" {...form.bind(field.target)}><option value="">Selecione</option>{field.choices.map(choice => <option key={choice.value} value={choice.value}>{choice.label}</option>)}</select>
          : field.control === "textarea" ? <textarea id={`petcare-${field.target}`} autoComplete="off" maxLength={field.validation.maxLength ?? 2000} {...form.bind(field.target)} />
          : field.control === "phone" ? <input id={`petcare-${field.target}`} type="tel" inputMode="tel" autoComplete="off" maxLength={24} placeholder="(41) 99999-9999" {...form.bind(field.target)} value={phoneInput} onChange={event => { const raw = event.target.value; setPhoneInput(raw); form.setValues(previous => ({ ...previous, [field.target]: normalizePetCarePhone(raw) })); setPhoneError(""); }} onBlur={() => { form.validate(field.target); if (!validPetCarePhone(String(form.values[field.target] ?? ""))) setPhoneError("Informe o DDD e o número completo. Se estiver fora do Brasil, comece com + e o DDI."); }} />
          : <input id={`petcare-${field.target}`} type={field.control === "email" ? "email" : "text"} autoComplete="off" maxLength={field.validation.maxLength ?? (field.control === "email" ? 254 : 160)} {...form.bind(field.target)} />}
        {field.control === "phone" && <small className="enquiry-phone-hint"><span>Brasil: DDD + número, sem +55.</span><span>Exterior: comece com +DDI + número.</span></small>}
        {field.description && <small>{field.description}</small>}
        {(field.control === "phone" ? phoneError || form.errors[field.target] : form.errors[field.target]) && <small className="enquiry-error" id={`err-${field.target}`}>{field.control === "phone" ? phoneError || "Informe o DDD e o número completo, ou use + e DDI para outro país." : form.errors[field.target]}</small>}
      </div>)}
    </div>
    <p className="enquiry-privacy">Usaremos nome, contato, cidade e assunto apenas para responder ao pedido. Não informe dados clínicos ou informações sensíveis neste formulário. O envio não confirma agendamento.</p>
    {form.errors[FORM_ERROR] && <p className="enquiry-error" role="alert">{form.errors[FORM_ERROR]}</p>}
    <button className="button gold" type="submit" disabled={form.loading}>{form.loading ? "Enviando…" : form.form.submitText || "Enviar pré-cadastro"}</button>
  </form>;
}
