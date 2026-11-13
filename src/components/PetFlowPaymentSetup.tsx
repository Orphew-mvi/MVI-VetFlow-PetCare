import { useEffect, useState } from "react";

export default function PetFlowPaymentSetup() {
  const [token, setToken] = useState("");
  const [configured, setConfigured] = useState(false);
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/mercado-pago", { credentials: "same-origin", cache: "no-store" })
      .then(response => response.json())
      .then(result => { setConfigured(Boolean(result.configured)); setActive(Boolean(result.active)); })
      .catch(() => setMessage("Não foi possível verificar o pagamento."));
  }, []);

  async function send(action: "save" | "activate") {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/mercado-pago", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "save" ? { action, token } : { action }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível configurar.");
      setConfigured(Boolean(result.configured)); setActive(Boolean(result.active)); setToken("");
      setMessage(action === "save" ? "Chave guardada. Valide para ativar Pix e cartão." : "Pagamento por Pix e cartão ativado. Boleto excluído da preferência de pagamento.");
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Erro de configuração."); }
    finally { setBusy(false); }
  }

  return <div className="payment-setup">
    <p>Status: <strong>{active ? "Pix e cartão ativos" : configured ? "Chave guardada; falta validar" : "Aguardando chave de produção"}</strong></p>
    <p>O Mercado Pago ligado ao Wix não compartilha a chave com este checkout, que exclui boleto. Cole aqui o Access Token de produção. Ele é guardado nos segredos privados deste site e não aparece novamente.</p>
    <label htmlFor="petflow-mp-token">Access Token de produção</label>
    <input id="petflow-mp-token" type="password" autoComplete="off" value={token} onChange={event => setToken(event.target.value)} placeholder="APP_USR-…" />
    <div className="payment-setup-actions"><button type="button" disabled={busy || !token.trim()} onClick={() => void send("save")}>Guardar chave</button><button type="button" disabled={busy || !configured} onClick={() => void send("activate")}>Validar e ativar Pix/cartão</button></div>
    {message && <p role="status">{message}</p>}
  </div>;
}
