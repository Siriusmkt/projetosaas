# Flow Editor — Blocos, Caminhos e Geração

Este documento explica como funcionam os **blocos**, a **lógica de caminhos (rotas)** e a **geração de blocos** no Flow Editor.

---

## 1. Tipos de blocos

No canvas (frontend) os blocos têm estes tipos:

| Tipo no canvas   | Nome na UI        | No banco (DB)     | Descrição |
|------------------|-------------------|-------------------|-----------|
| `primeira_mensagem` | Primeira mensagem | `primeira_mensagem` | Saudação inicial do agente |
| `texto`          | Mensagem          | `mensagem`        | Envia uma mensagem ao lead |
| `ramificacoes`   | Multi caminhos    | `caminhos`       | Divide o fluxo em vários caminhos (rotas) |
| `aguardar`       | Aguardar          | `aguardar`        | Espera resposta do lead (com timeout) |
| `encerrar`       | Encerrar          | `encerrar`        | Encerra a conversa |
| `tool`           | Ferramenta        | `ferramenta`     | Executa uma ferramenta (agendar, WhatsApp, etc.) |

- **Identificação:** cada bloco tem um `id` (ex.: `block_123_abc`) e, ao salvar, um `block_key` (ex.: `PM001`, `MSG002`, `CAM001`, `AG001`, `ENC001`, `FER001`).
- **Prefixos no banco:** `PM`, `MSG`, `CAM`, `AG`, `ENC`, `FER` (definidos em `flowDB.ts` → `BLOCK_KEY_PREFIXES`).

---

## 2. Estrutura de um bloco (FlowBlock)

Cada bloco no canvas é um `FlowBlock` com:

- **Comum a todos:** `id`, `type`, `content`, `nextBlock` (próximo bloco na sequência).
- **Apenas ramificações:** `analyzeVariable` (ex.: `{{ultima_resposta}}`), `routes` (lista de rotas), `fallback` (comportamento quando nenhuma rota casa).
- **Contexto de rota (quando o bloco está dentro de um caminho):** `parentRouterId`, `routeId`, `routePosition` (first/middle/last).
- **Ferramentas:** `toolType`, `toolConfig`.
- **Aguardar:** `timeout` (segundos).
- **Goto:** `gotoBlockId` para pular para um bloco específico (em rotas ou em blocos normais).

---

## 3. Caminhos (rotas) — bloco “Multi caminhos”

O bloco **Multi caminhos** (`ramificacoes` / `caminhos`) é o único que define **várias saídas** a partir de uma decisão.

### 3.1 Estrutura de uma rota (RouterRoute)

Cada caminho tem:

- `id` — identificador único da rota
- `label` — nome (ex.: “Sim”, “Não”, “Quero falar com humano”)
- `color` — cor (hex) para a linha no canvas
- `keywords` — palavras-chave que “ativam” esse caminho (ex.: sim, pode, claro)
- `response` — resposta automática quando o caminho é escolhido
- `destinationType` — o que fazer ao seguir esse caminho:
  - `continue` — seguir para o próximo bloco (cadeia da rota)
  - `end` — encerrar
  - `loop` — voltar (ex.: “não entendi, repita”)
  - `goto` — ir para um bloco específico (`gotoBlockId`)
- `gotoBlockId` — quando `destinationType === 'goto'`, ID ou block_key do bloco destino

### 3.2 Fallback

O **fallback** é uma “rota especial” quando **nenhuma** das rotas normais casa (ex.: resposta inesperada). Tem a mesma estrutura de destino (`destinationType`, `gotoBlockId`) e costuma usar `destinationType: 'loop'` para pedir que o usuário repita.

### 3.3 Regra importante: Multi caminhos só na raiz

- **Multi caminhos** não pode ser colocado **dentro** de uma rota de outro Multi caminhos; ele é sempre bloco de **raiz**.
- Na UI, ao adicionar ação **dentro** de uma rota, a opção “Multi caminhos” não aparece (`excludeBlockTypes={['ramificacoes']}` no picker).
- No banco e na carga, blocos do tipo `ramificacoes`/`caminhos` são normalizados para não terem `parentRouterId`/`routeId` (ficam sempre na raiz).

---

## 4. Como o fluxo é ligado (conectivos)

Há duas formas de “ligar” blocos:

### 4.1 Linha principal (raiz) — `nextBlock`

- Blocos **sem** `parentRouterId` pertencem à **linha principal** do fluxo.
- Cada um tem `nextBlock` = id ou block_key do **próximo** bloco na ordem principal.
- A ordem na raiz segue o `order_index` do banco; ao carregar, o `nextBlock` é preenchido entre blocos raiz consecutivos.

### 4.2 Dentro de um caminho (rota) — `parentRouterId` + `routeId` + `nextBlock`

- Cada **rota** de um Multi caminhos pode ter uma **sequência de blocos**.
- Esses blocos têm:
  - `parentRouterId` = id do bloco Multi caminhos
  - `routeId` = id da rota (ou `'fallback'`)
  - `nextBlock` = próximo bloco **nessa mesma rota**
- A **primeira** conexão da rota é: saída do Multi caminhos (por rota/fallback) → primeiro bloco da rota (`gotoBlockId` da rota ou do fallback).
- As conexões entre blocos dentro da mesma rota são só via `nextBlock`.

### 4.3 Resumo visual

```
[Primeira mensagem] → nextBlock → [Mensagem] → nextBlock → [Multi caminhos]
                                                                  │
                    ┌─────────────────────────────┬───────────────┼───────────────┐
                    │ Rota 1 (ex.: Sim)            │ Rota 2 (Não) │ Fallback      │
                    │ gotoBlockId → [Bloco A]      │ gotoBlockId → [Bloco B]      │
                    │   → nextBlock → [Bloco A2]   │   → nextBlock → [Bloco B2]   │
                    └─────────────────────────────┘ └─────────────┘ (ex.: loop)   │
```

- **PermanentConnections:** desenha linhas para `nextBlock` e `gotoBlockId` (exceto as que já são desenhadas pelo sistema de rotas).
- **RoutePathsRenderer:** desenha o bloco Multi caminhos, cada rota com sua cor, os blocos dentro de cada rota e os botões de “adicionar bloco” / “conectar” em cada caminho.

---

## 5. Banco de dados (persistência)

### 5.1 Bloco no banco (FlowBlockDB)

- `block_type`: uma de `primeira_mensagem`, `mensagem`, `caminhos`, `aguardar`, `encerrar`, `ferramenta`.
- `block_key`: ex. `PM001`, `CAM001`.
- `next_block_key`: próximo na sequência (raiz ou dentro da rota).
- `routes_data`: array de rotas (só para `caminhos`), cada uma com:
  - `route_key`, `label`, `ordem`, `cor`, `keywords`, `response`
  - `destination_type`: `continuar` | `encerrar` | `loop`
  - `destination_block_key`: primeiro bloco desse caminho (pode ser null)
  - `is_fallback`: true para a rota de fallback
- `route_context`: só para blocos **que estão dentro de uma rota** (nunca para `caminhos`):
  - `parent_router_block_key`, `route_key`, `route_position` (first/middle/last)

### 5.2 Conversão Canvas ↔ Banco

- **Canvas → Banco (`canvasBlockToDBBlock`):**
  - `routes` + `fallback` → `routes_data`
  - `gotoBlockId` (e nextBlock) viram `destination_block_key` / `next_block_key` em **block_key**
  - Se o bloco está dentro de rota (e não é `ramificacoes`), grava `route_context`.

- **Banco → Canvas (`dbBlocksToCanvasBlock` + `dbBlocksToCanvasBlocks`):**
  - `routes_data` → `routes` e `fallback` com `destinationType` e `gotoBlockId` (em id ou block_key).
  - `route_context` → `parentRouterId`, `routeId`, `routePosition`.
  - Depois há **normalização**: (1) aplicar destinos diretos das rotas nos blocos; (2) propagar `parentRouterId`/`routeId` ao longo da cadeia `nextBlock` de cada rota; (3) garantir que todo bloco `ramificacoes` fique sem parent/route (sempre raiz); (4) preencher `nextBlock` na raiz e dentro de cada rota.

---

## 6. Geração de blocos (IA / API)

A **geração automática** de blocos é feita pelo hook `useBlockGenerator`:

1. **Entrada:** texto do **prompt master** (descrição do fluxo desejado).
2. **Chamada:** `POST` para a Edge Function de chat (Supabase), com `action: 'generate-blocks'` e `promptMaster`.
3. **Resposta da API:** lista de blocos com `blockKey`, `type`, `content`, `routes` (com `routeKey`, `label`, `keywords`, `response`, `destinationBlockKey`, `isFallback`), `nextBlockKey`, etc.
4. **Conversão no frontend:**
   - Cria um `id` por bloco e um mapa `blockKey → id`.
   - Converte tipo da API para tipo do canvas (ex.: `multi_condicional` → `ramificacoes`, `ferramenta` → `tool`).
   - Monta `FlowBlock`: `routes` com cores (ROUTER_COLORS), `destinationType: 'goto'` quando há `destinationBlockKey`, e `fallback` a partir da rota com `isFallback`.
   - Resolve referências (`destinationBlockKey`, `nextBlockKey`) para os novos `id`s.

Os blocos gerados são então colocados no editor (substituindo ou acrescentando ao fluxo, conforme a lógica da página que chama `generateBlocks`).

---

## 7. Onde está no código

| Conceito              | Arquivo(s) |
|-----------------------|------------|
| Tipos de bloco, rotas, fallback | `src/types/flow.ts` |
| Tipos e mapeamento DB, block_key, route_context | `src/types/flowDB.ts` |
| Conversão DB ↔ Canvas, normalização de rotas | `src/types/flowDB.ts` (`dbBlocksToCanvasBlocks`, `canvasBlockToDBBlock`) |
| Geração por IA        | `src/hooks/useBlockGenerator.ts` |
| Lista de ações (tipos de bloco na UI) | `src/components/flow/AgentActionPicker.tsx` |
| Conexões nextBlock / gotoBlockId | `src/components/flow/PermanentConnections.tsx` |
| Desenho das rotas e blocos dentro delas | `src/components/flow/RoutePathsRenderer.tsx` |
| Canvas principal, raiz e Multi caminhos | `src/components/flow/FlowCanvas.tsx` |
| Nó do bloco Multi caminhos | `src/components/flow/MultiConditionalNode.tsx` |

Com isso você tem uma visão completa dos blocos, da lógica de caminhos e da geração no Flow Editor.

---

## 8. Parser de prompt: quais marcadores ele lê? É flexível?

Existem **dois** parsers que transformam texto em blocos:

### 8.1 Parser Python (backend) — flexível

**Arquivo:** `saas_server/saas_tools/services/prompt_parser.py`  
**Uso:** “Aplicar prompt”, importação de fluxo a partir do `prompt_base` (texto após `## FLUXO DA CONVERSA`).

- **Divisão em seções:** o texto é dividido por **`\n###`** (uma ou mais `#` após quebra de linha). Ou seja, tanto `###` quanto `####` criam nova seção. O formato exato do título não é fixo.
- **Detecção do tipo de bloco:** por **palavras-chave no texto da seção** (não por um padrão rígido “### MENSAGEM [MSG001]”):
  - **Primeira mensagem:** `ABERTURA` ou `Ao iniciar a ligacao` no título/seção.
  - **Mensagem:** `MENSAGEM` ou `[MSG` no título/seção.
  - **Aguardar:** `AGUARDAR` ou `[AG` no título/seção.
  - **Caminhos:** `CAMINHOS` ou `[CAM` no título/seção.
  - **Encerrar:** `ENCERRAR` ou `[ENC` no título/seção.
- **Block key:** primeiro tenta extrair com o regex **`\[([A-Z]{2,3}\d+)\]`** (ex.: `[MSG001]`, `[CAM002]`). Se não achar, gera pelo tipo (ex.: MSG001, AG001).

**Conclusão:** mudar de `### MENSAGEM [MSG001]` para outro formato **não quebra** o parser Python, desde que:
- as seções continuem separadas por `###` (ou `####`);
- na seção da mensagem exista a palavra **MENSAGEM** ou a substring **`[MSG`** (ou o bloco tenha `[MSG001]` e o tipo seja inferido pelo prefixo do key);
- o `block_key` apareça em colchetes `[MSG001]` em algum lugar da seção, ou o parser consiga gerar (ex.: MSG001) pelo tipo.

Exemplos que **continuam funcionando** com o parser Python:
- `### MENSAGEM [MSG001]`
- `### [MSG001] MENSAGEM`
- `### BLOCO MENSAGEM [MSG001]`
- `### MSG001 - Mensagem`

Exemplo que **não** seria reconhecido como mensagem: título só `### BLOCO TEXTO [MSG001]` (falta a palavra MENSAGEM ou `[MSG`). Nesse caso seria preciso adicionar no código um sinônimo (ex.: `TEXTO`) em `prompt_parser.py` na detecção de tipo.

### 8.2 Parser TypeScript (Edge Function) — rígido

**Arquivo:** `flow_editor_frontend/supabase/functions/agent-chat/index.ts`  
**Uso:** geração de blocos por IA (action `generate-blocks`).

- Usa **regex fixos** por tipo, por exemplo:
  - Mensagem: `###\s*MENSAGEM\s*\[([A-Z]+\d+)\]\s*\n\n\*\*Fale:\*\*\s*\n*"([^"]+)"...`
  - Aguardar: `###\s*AGUARDAR\s*\[([A-Z]+\d+)\]\s*\n\n\*\*Escute...`
  - etc.
- Ou seja, espera **exatamente** o formato com `### MENSAGEM [MSG001]`, `**Fale:**`, aspas, `**Depois:** Va para [BLOCK_KEY]`, etc.

**Conclusão:** se você mudar o formato do prompt (ex.: de `### MENSAGEM [MSG001]` para `### BLOCO_MSG [MSG001]`), a **geração por IA** (Edge Function) pode deixar de reconhecer os blocos, a menos que esses regex sejam atualizados no `agent-chat/index.ts`.

### 8.3 Resumo

| Onde o texto é parseado | Parser   | Flexível? | Mudar formato (ex.: ### MENSAGEM [MSG001]) |
|--------------------------|----------|-----------|--------------------------------------------|
| Aplicar prompt / importar do prompt_base (backend) | Python   | Sim       | Pode mudar; basta manter palavras-chave (MENSAGEM ou [MSG) e `###` para seções. |
| Gerar blocos por IA (Edge Function)                | TypeScript | Não     | Quebra se o formato sair do esperado; é preciso alterar os regex em `agent-chat/index.ts`. |
