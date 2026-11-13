import { useCallback, useEffect, useState } from "react";
import PetFlowAudience from "./PetFlowAudience";
import PetFlowContacts from "./PetFlowContacts";
import PetFlowTelegramSetup from "./PetFlowTelegramSetup";
import PetFlowPaymentSetup from "./PetFlowPaymentSetup";

export type Lead = { id: string; date: string; nome: string; email: string; telefone: string; cidade: string; servico: string };

export default function PetFlowAdminPanel() {
  const [username, setUsername] = useState("orphew");
  const [password, setPassword] = useState("");
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [lifetime, setLifetime] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/leads", { credentials: "same-origin", cache: "no-store" });
      if (response.status === 401) { setLeads(null); return; }
      const data = await response.json();
      if (!response.ok) { setStatus(data.error || "Não foi possível carregar os pedidos."); return; }
      setLeads(data.leads || []); setStatus("");
    } catch { setStatus("Não foi possível carregar os pedidos."); }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    document.body.classList.toggle("petflow-dashboard-active", leads !== null);
    return () => document.body.classList.remove("petflow-dashboard-active");
  }, [leads]);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setStatus("");
    try {
      const response = await fetch("/api/admin/login", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
      const data = await response.json();
      if (!response.ok) { setStatus(data.error || "Acesso negado."); return; }
      setPassword(""); await load();
    } catch { setStatus("Não foi possível entrar agora."); }
    finally { setBusy(false); }
  }

  async function logout() { await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" }); setLeads(null); setPassword(""); }

  if (leads === null) return <main className="admin-shell"><section className="admin-card admin-login"><span className="kicker">CONTROLE VETFLOW</span><h1>Entrar na administração</h1><p>Área privada para acompanhar os pedidos de contato do PetCare.</p><form onSubmit={login}><label htmlFor="admin-user">Usuário</label><input id="admin-user" autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} required /><label htmlFor="admin-password">Senha</label><input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required /><button className="button gold" disabled={busy}>{busy ? "Entrando…" : "Entrar"}</button></form><p className="admin-status" role="status">{status}</p></section></main>;

  return <main className="admin-shell petflow-admin-dashboard">
    <div className="admin-topline"><div><span className="kicker">ÁREA PROTEGIDA · VETFLOW</span><h1>Administração</h1><p>Controle deste site e dos pré-cadastros PetCare. Visitantes sem cadastro são anônimos.</p></div><div className="petflow-top-actions"><a href="#audience" className="petflow-lifetime"><strong>{lifetime ?? "—"}</strong><span>Visitas desde o início</span></a><a href="#contacts" className="petflow-lifetime"><strong>{leads.length}</strong><span>Pré-cadastros</span></a><button type="button" onClick={logout}>Sair</button></div></div>
    <nav className="petflow-admin-nav" aria-label="Seções do controle"><a href="#audience">Visitantes</a><a href="#payments">Pagamentos</a><a href="#notifications">Avisos ao responsável</a><a href="#contacts">Pedidos de contato</a></nav>
    <PetFlowAudience onLifetimeChange={setLifetime} />
    <section id="payments" className="admin-card"><h2>Pagamentos dos serviços</h2><PetFlowPaymentSetup /></section>
    <section id="notifications" className="admin-card"><h2>Avisos ao responsável</h2><p>Os avisos de novos pré-cadastros do PetCare usam somente o bot ligado a este controle.</p><PetFlowTelegramSetup /></section>
    <PetFlowContacts leads={leads} refresh={load} status={status} />
    <p className="admin-footnote">O WhatsApp direto abre uma conversa e não gera pré-cadastro automático.</p>
  </main>;
}
