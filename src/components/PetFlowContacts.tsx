import { useMemo, useState } from "react";
import type { Lead } from "./PetFlowAdminPanel";

function downloadCsv(leads: Lead[]) {
  const clean = (value: unknown) => { const text = String(value ?? ""); return `"${(/^[=+\-@]/.test(text) ? "'" : "") + text.replaceAll('"', '""')}"`; };
  const rows = [["Recebido", "Nome", "E-mail", "Telefone", "Cidade", "Serviço"], ...leads.map(lead => [lead.date, lead.nome, lead.email, lead.telefone, lead.cidade, lead.servico])];
  const blob = new Blob(["\ufeff", rows.map(row => row.map(clean).join(";")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a"); link.href = url; link.download = "petflow-pre-cadastros.csv"; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function PetFlowContacts({ leads, refresh, status }: { leads: Lead[]; refresh: () => Promise<void>; status: string }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const visible = useMemo(() => leads.filter(lead => `${lead.nome} ${lead.email} ${lead.telefone} ${lead.cidade} ${lead.servico}`.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"))), [leads, search]);
  const pages = Math.max(1, Math.ceil(visible.length / 10));
  const current = Math.min(page, pages);
  const selected = leads.find(lead => lead.id === selectedId);
  return <section id="contacts" className="admin-card" aria-labelledby="contacts-title">
    <div className="admin-section-head"><div><span className="kicker">ÁREA PROTEGIDA</span><h2 id="contacts-title">Pedidos de contato</h2><p>Pré-cadastros enviados pelo formulário PetCare.</p></div><div className="petflow-contact-tools"><button type="button" onClick={() => void refresh()}>Atualizar</button><button type="button" onClick={() => downloadCsv(visible)}>Exportar CSV</button></div></div>
    <div className="petflow-lead-search"><label htmlFor="lead-search">Buscar por nome, contato, cidade ou serviço</label><input id="lead-search" type="search" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} /></div>
    {status && <p className="admin-status" role="status">{status}</p>}
    {visible.length ? <><div className="admin-table-wrap"><table><thead><tr><th>Recebido</th><th>Nome</th><th>Contato</th><th>Cidade</th><th>Serviço</th><th>Detalhes</th></tr></thead><tbody>{visible.slice((current - 1) * 10, current * 10).map(lead => <tr key={lead.id}><td>{lead.date ? new Date(lead.date).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—"}</td><td>{lead.nome || "—"}</td><td>{lead.email}<br />{lead.telefone}</td><td>{lead.cidade || "—"}</td><td>{lead.servico || "—"}</td><td><button type="button" onClick={() => setSelectedId(lead.id)}>Ver</button></td></tr>)}</tbody></table></div><div className="petflow-pagination"><button type="button" disabled={current <= 1} onClick={() => setPage(current - 1)}>Anterior</button><span>Página {current} de {pages}</span><button type="button" disabled={current >= pages} onClick={() => setPage(current + 1)}>Próxima</button></div>{selected && <section className="petflow-lead-detail" aria-labelledby="lead-detail-title"><div className="admin-section-head"><h3 id="lead-detail-title">Detalhes do pedido</h3><button type="button" onClick={() => setSelectedId(null)}>Fechar</button></div><dl><div><dt>Recebido</dt><dd>{selected.date ? new Date(selected.date).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—"}</dd></div><div><dt>Nome</dt><dd>{selected.nome || "—"}</dd></div><div><dt>Telefone</dt><dd>{selected.telefone || "—"}</dd></div><div><dt>E-mail</dt><dd>{selected.email || "—"}</dd></div><div><dt>Cidade</dt><dd>{selected.cidade || "—"}</dd></div><div><dt>Serviço</dt><dd>{selected.servico || "—"}</dd></div></dl></section>}</> : <p>{search ? "Nenhum pedido corresponde à busca." : "Nenhum pré-cadastro recebido ainda."}</p>}
  </section>;
}
