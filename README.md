# MVI VetFlow | PetCare | Pet Connecta

Site e catálogo de serviços veterinários criado por Francesco Carboni como projeto de estudo e aplicação prática no DevClub.

**Site publicado:** https://www.mvipetcare.net/

## O que o projeto faz

- Apresenta os serviços para pets e animais de criação em páginas adaptadas a celular, tablet e computador.
- Mostra um catálogo com valores, imagens e carrinho de serviços.
- Reúne pedido de atendimento e pré-cadastro.
- Oferece uma área administrativa privada para acompanhar contatos e sessões de visita, sem incluir dados de clientes neste repositório.

## Tecnologias

Astro, React, TypeScript, CSS e Wix Headless. O catálogo, os formulários, o pagamento e os segredos pertencem ao site Wix vinculado; este repositório contém o código e os recursos visuais, sem as credenciais de produção.

## Executar localmente

Requer Node.js e acesso de desenvolvimento ao site Wix correspondente.

```powershell
npm ci
npm run dev
```

O servidor local pode exigir autenticação Wix. Para gerar a versão de produção, use `npm run build`. A publicação no Wix e a atualização deste repositório são operações separadas.

## Organização

- `src/`: páginas, componentes, estilos e rotas de servidor.
- `public/`: imagens, vídeos e outros recursos públicos usados pelo site.
- `GOVERNANCA.md`: diretrizes visuais e de apresentação.

## Privacidade

Chaves do Mercado Pago, senhas, tokens do Telegram e dados de clientes ficam fora do GitHub. Arquivos `.env*`, saídas de build e arquivos temporários não devem ser enviados. O código acessa os segredos pelo serviço seguro do Wix.

**Produção:** MVI Tech | *Orphew* ©
