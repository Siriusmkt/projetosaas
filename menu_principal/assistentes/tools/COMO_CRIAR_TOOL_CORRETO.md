# Como criar Tool no Gerenciar Tools e dar certo

## 1. Abrir Gerenciar Tools com o assistente certo

A tool fica vinculada a um **assistente** e a um **tenant**. Por isso você precisa abrir a tela **já no contexto desse assistente**.

### Opção A – Pelo Flow Editor (recomendado)
1. Abra o **Flow Editor** do assistente (URL com `assistente_id` ou assistente selecionado no menu).
2. No topo, clique em **Gerenciar Tools**.
3. A URL deve ficar assim: `/tools?assistente_id=XXXXXXXX&tenant_id=YYYYYY`.
4. O iframe carrega o Gerenciar Tools já com esse assistente e tenant — a nova tool será salva com o `assistant_id` correto.

### Opção B – Pelo menu do assistente (SaaS antigo)
1. Entre no menu do assistente e abra **Gerenciar Tools**.
2. Ou acesse direto: `/tools/gerenciar-tools?assistente_id=SEU_ASSISTENTE_ID`
3. Tenha `tenant_id` no localStorage ou na URL (ex.: `&tenant_id=...`).

Se abrir Gerenciar Tools **sem** `assistente_id` (ex.: só `/tools` sem query), a criação vai dar erro **"assistant_id é obrigatório"** ou a tool ficará órfã.

---

## 2. Criar a tool passo a passo

1. **Tipo**  
   Escolha: Mensagem, Agendamento, Encerramento ou Documento.

2. **Configuração (conforme o tipo)**
   - **Mensagem (texto):** escreva o texto e escolha a **Instância WhatsApp**.
   - **Mensagem (imagem/áudio/vídeo/arquivo):** faça o **upload** do arquivo e escolha a **Instância WhatsApp**.
   - **Agendamento:** preencha o link ou mensagem de agendamento.
   - **Documento:** faça o **upload** do arquivo (PDF, DOC, etc.).
   - **Encerramento:** não precisa de arquivo; só as instruções no passo 3.

3. **Instruções para a IA**
   - **Nome da tool:** ex. "Enviar Proposta", "Enviar Imagem do Produto".
   - **Instruções:** quando a IA deve usar essa tool (ex.: "Use quando o lead pedir a proposta comercial").

4. Clique em **Salvar Tool**.

---

## 3. O que acontece quando você salva

- A tool é salva na tabela **vapi_tools** (Supabase) com `assistant_id` e `tenant_id`.
- Se você estiver na página **Gerenciar Tools do menu** (`/tools/gerenciar-tools`), após salvar o front chama o webhook **adiciona-tool** (n8n), que pode registrar/atualizar a tool na VAPI.
- O **rapid-processor** usa as tools do fluxo (blocos tipo ferramenta) para montar o prompt (ex.: "# Use a tool [nome]#"). Por isso, depois de criar a tool você pode rodar o rapid-processor para o `flow_id` desse assistente.

---

## 4. Para a IA conseguir chamar a tool na VAPI

Na VAPI, o **assistente** precisa ter as **tools** vinculadas em `toolIds`.  
Se você criou as 7 tools genéricas (Enviar_Texto, Enviar_Imagem, etc.) na VAPI e configurou o `server.url` de cada uma, o assistente precisa ter esses IDs em `toolIds`.  
Caso contrário, a IA não "vê" a tool e pode dar "No result returned" ou não chamar.

- **Conferir:**  
  `GET https://api.vapi.ai/assistant/SEU_ASSISTANT_ID` e ver o campo `toolIds`.
- **Corrigir:**  
  Fazer **PATCH** no assistant com a lista completa de `toolIds` (incluindo as 7: Enviar_Texto, Enviar_Audio, Enviar_Imagem, Enviar_Video, Enviar_Arquivo, Encerramento, Consultar_Documento).

---

## 5. Checklist rápido

- [ ] Abrir Gerenciar Tools **com** `assistente_id` (e de preferência `tenant_id`) na URL.
- [ ] Preencher tipo, configuração (e upload quando for o caso) e instruções.
- [ ] Salvar e ver a tool na lista.
- [ ] (Opcional) Rodar rapid-processor para o `flow_id` do assistente se quiser o prompt atualizado com as tools.
- [ ] Na VAPI, assistente com as tools certas em `toolIds` (e cada tool com `server.url` configurado).

Assim, criar no Gerenciar Tools está "certo" e tende a dar certo de ponta a ponta (banco → n8n/VAPI → prompt → IA).

---

## 6. Onde fica a Primeira Mensagem (saudação)?

A **primeira mensagem** (texto que o assistente fala ao iniciar a ligação) **não faz parte do fluxo de blocos**. Ela fica na tabela **`assistentes`** (coluna **`first_message`**) e é editada em **Configurações globais** no Flow Editor.

- No Flow Editor: abra **Config. global** (botão no topo) → na seção **Primeira mensagem (saudação)** edite o texto e clique em **Salvar**.
- Via API: `GET /api/assistants/{id}/first-message` para ler; `PATCH /api/assistants/{id}/first-message` com `{"first_message":"..."}` para gravar.
