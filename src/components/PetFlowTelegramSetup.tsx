import { useEffect, useState } from "react";

type BotState = { configured: boolean; connected: boolean; username?: string; error?: string };

export default function PetFlowTelegramSetup() {
  const [bot, setBot] = useState<BotState | null>(null);
  const [token, setToken] = useState("");
  const [code, setCode] = useState("");
  const [link, setLink] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { fetch("/api/admin/telegram", { credentials: "same-origin", cache: "no-store" }).then(res => res.json()).then(setBot).catch(() => setStatus("Não foi possível consultar o bot.")); }, []);

  async function act(action: string, values: object = {}) {
    setBusy(true); setStatus("");
    try {
      const res = await fetch("/api/admin/telegram", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...values }) });
      const data = await res.json();
      if (!res.ok) { setStatus(data.error || "Não foi possível concluir."); return; }
      if (action === "save-token") { setToken(""); setBot(data); setStatus(`Bot @${data.username} validado. Agora conecte sua conversa privada.`); }
      if (action === "pair") { setCode(data.code); setLink(data.link); setStatus("Abra o bot e toque em Iniciar. Depois volte e clique em Confirmar conexão."); }
      if (action === "connect") { setBot(data); setCode(""); setLink(""); setStatus("Telegram VetFlow conectado. Uma mensagem de confirmação foi enviada."); }
    } catch { setStatus("Não foi possível acessar o Telegram agora."); }
    finally { setBusy(false); }
  }

  async function sendTest() {
    setBusy(true); setStatus("Consultando visitas e enviando o teste…");
    try {
      const response = await fetch("/api/admin/telegram-test", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" } });
      const data = await response.json();
      setStatus(response.ok ? `Teste enviado para o bot: ${data.total} visitas em ${data.date}.` : data.error || "Não foi possível enviar o teste.");
    } catch { setStatus("Não foi possível enviar o teste agora."); }
    finally { setBusy(false); }
  }

  return <section className="admin-card"><h2>Telegram · VetFlow</h2><p>Bot informado: <strong>@jarvis_telegram_mvi_bot</strong>. O token é enviado apenas para o servidor e guardado como segredo no Wix.</p>
    {bot?.connected ? <div><p className="admin-status">Conectado com @{bot.username}. Novos pré-cadastros serão enviados para sua conversa privada.</p><button type="button" disabled={busy} onClick={() => void sendTest()}>Enviar resumo de teste agora</button></div> : <>
      {!bot?.configured ? <form onSubmit={event => { event.preventDefault(); void act("save-token", { token }); }}><label htmlFor="petflow-bot-token">Token do bot VetFlow</label><input id="petflow-bot-token" type="password" autoComplete="off" value={token} onChange={event => setToken(event.target.value)} placeholder="Cole o token gerado pelo BotFather" required /><button className="button gold" disabled={busy}>Validar bot</button></form> : <p>Bot validado: @{bot.username}</p>}
      {bot?.configured && !bot.connected && <div><button type="button" className="button gold" disabled={busy} onClick={() => void act("pair")}>Mostrar link de conexão</button>{link && <div className="petflow-telegram-pair"><p><a href={link} target="_blank" rel="noopener noreferrer">Abrir @{bot.username} no Telegram</a> e tocar em <strong>Iniciar</strong>.</p><p>Se o aplicativo abrir sem enviar o comando, copie e envie na conversa:</p><label htmlFor="petflow-start-command">Comando de conexão</label><input id="petflow-start-command" type="text" readOnly value={`/start ${code}`} onFocus={event => event.currentTarget.select()} /><button type="button" onClick={() => void navigator.clipboard.writeText(`/start ${code}`)}>Copiar comando</button><p><button type="button" disabled={busy} onClick={() => void act("connect", { code })}>Já toquei em Iniciar · confirmar</button></p></div>}</div>}
    </>}
    {status && <p className="admin-status" role="status">{status}</p>}
    {bot?.error && <p className="admin-status" role="alert">{bot.error}</p>}
  </section>;
}
