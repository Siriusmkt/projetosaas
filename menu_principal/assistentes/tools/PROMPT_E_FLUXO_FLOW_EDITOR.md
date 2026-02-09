# Prompt e fluxo no Flow Editor — guia completo

Este documento descreve **exatamente** como um prompt de IA deve ser estruturado para funcionar com o Flow Editor: tipos de bloco, chaves (`block_key`), rotas (`routes_data`), e o formato de texto que o parser entende. Use-o para adaptar todos os fluxos existentes.

---

## 1. Visão geral

- **Primeira mensagem (saudação)** não faz parte do fluxo de blocos: fica em **Configurações globais** (tabela `assistentes.first_message`). Não use bloco de abertura no canvas para isso.
- O **fluxo** é uma sequência de **blocos** guardados em `flow_blocks`, ordenados por `order_index`.
- Cada bloco tem um **block_key** único (ex.: MSG001, CAM001). A sequência é ligada por **next_block_key** (e, nos blocos de caminhos, por **routes_data** com `destination_block_key`).
- As **rotas** de um bloco de ramificações ficam no próprio bloco, no campo **routes_data** (JSONB). Não dependa da tabela legada `flow_routes` para fluxos novos.

---

## 2. Tipos de bloco (canvas ↔ banco)

| Canvas (Flow Editor) | Banco (`block_type`) | Prefixo `block_key` | Descrição |
|----------------------|----------------------|----------------------|-----------|
| `primeira_mensagem`  | `primeira_mensagem`  | PM                   | Saudação (hoje preferível em Config. global; no fluxo é legado) |
| `texto`              | `mensagem`           | MSG                  | Fala um texto fixo. |
| `ramificacoes`       | `caminhos`           | CAM                  | Escolha entre vários caminhos (rotas). |
| `aguardar`           | `aguardar`           | AG                   | Escuta o lead e opcionalmente salva resposta. |
| `encerrar`           | `encerrar`           | ENC                  | Encerra a conversa (com ou sem fala final). |
| `tool`               | `ferramenta`         | FER ou TOOL          | Chama uma ferramenta (ex.: enviar WhatsApp). |

- **FER001, FER002, TOOL001, …** são **sempre** tratados como ferramenta, mesmo que `block_type` no banco esteja errado.
- Blocos de **config** (identidade, personalidade) usam `order_index` negativo e chaves como IDENT001, PERS001 (não fazem parte do fluxo visual de conversa).

---

## 3. Formato do `block_key`

- **Padrão:** `{PREFIXO}{NÚMERO com 3 dígitos}`.
- Exemplos: `PM001`, `MSG002`, `CAM001`, `AG001`, `ENC001`, `FER001`, `TOOL001`.
- O parser também reconhece blocos pelo texto entre colchetes, ex.: `[MSG001]`, `[AG002]`.

---

## 4. Sequência entre blocos: `next_block_key`

- **next_block_key:** indica o próximo bloco na **linha principal** (ou dentro da mesma rota).
- Deve ser o **block_key** do próximo bloco (ex.: `MSG002`), não o UUID.
- O último bloco de uma cadeia pode ter `next_block_key` null.
- Para **blocos dentro de uma rota** de ramificações, a cadeia é definida por `next_block_key` entre os blocos daquela rota; o vínculo à rota é feito por **route_context** (ver abaixo).

---

## 5. Bloco de ramificações (caminhos) e rotas

### 5.1 Estrutura no banco: `routes_data`

Cada bloco de tipo `caminhos` tem um array **routes_data** com objetos no formato:

```json
{
  "route_key": "CAM001_route_1",
  "label": "Confirmou que é ele",
  "ordem": 1,
  "cor": "#22c55e",
  "keywords": ["sim", "pode", "confirmo"],
  "response": "Ótimo! Vamos continuar.",
  "destination_type": "continuar",
  "destination_block_key": "MSG002",
  "max_loop_attempts": 2,
  "is_fallback": false
}
```

- **route_key:** identificador único da rota. Padrão: `{block_key}_route_{n}` para rotas normais e `{block_key}_fallback` para fallback.
- **label:** nome do caminho (ex.: "Sim", "Não", "Confirmou que é ele").
- **ordem:** ordem de exibição/avaliação (fallback costuma ter ordem alta, ex.: 999).
- **keywords:** palavras/frases que ativam essa rota (usadas pela IA para decidir o caminho).
- **response:** texto que a IA fala ao entrar nessa rota (opcional).
- **destination_type:** `continuar` | `encerrar` | `loop`.
  - **continuar:** segue para o bloco em `destination_block_key` (ou próximo na linha).
  - **encerrar:** encerra a conversa.
  - **loop:** volta a um bloco (ex.: repete pergunta), podendo usar `max_loop_attempts`.
- **destination_block_key:** `block_key` do bloco de destino (obrigatório para continuar/goto/loop com destino fixo).
- **is_fallback:** `true` para “Quando nenhuma condição for atendida”.

### 5.2 Vinculação de blocos à rota: `route_context`

Blocos que **pertencem a uma rota** (não à linha principal) têm **route_context**:

```json
{
  "parent_router_block_key": "CAM001",
  "route_key": "CAM001_route_1",
  "route_position": "first"
}
```

- **parent_router_block_key:** `block_key` do bloco de ramificações pai.
- **route_key:** mesma chave que em `routes_data` (ex.: `CAM001_route_1` ou `CAM001_fallback`).
- **route_position:** `first` | `middle` | `last` (posição na cadeia da rota).

Isso define quais blocos fazem parte de qual caminho e em que ordem.

---

## 6. Formato de prompt que o parser entende (Apply Prompt / importação)

O parser usa **apenas** o trecho após **`## FLUXO DA CONVERSA`**. Tudo antes disso é contexto (Prompt Master) e não gera blocos de fluxo.

### 6.1 Títulos de seção (###)

Cada bloco é detectado por um título em markdown:

| Tipo de bloco     | Título esperado                          |
|-------------------|------------------------------------------|
| Primeira mensagem | `### ABERTURA DA LIGACAO` ou "Ao iniciar a ligacao" |
| Mensagem          | `### MENSAGEM [MSG001]`                  |
| Aguardar          | `### AGUARDAR [AG001]`                   |
| Caminhos          | `### CAMINHOS [CAM001]`                  |
| Encerrar          | `### ENCERRAR [ENC001]` ou `### ENCERRAR [ENC001]: finalizar` |
| Ferramenta        | (geralmente criada no canvas; no prompt pode aparecer como FERRAMENTA [FER001]) |

O **block_key** pode ser extraído do título (ex.: [MSG001]) ou gerado pelo prefixo do tipo (PM, MSG, AG, CAM, ENC).

### 6.2 Conteúdo por tipo

- **ABERTURA / Primeira mensagem**  
  Texto entre aspas após **"Ao iniciar a ligacao, fale:"** ou **"Fale:"**.  
  Ex.: `**Ao iniciar a ligacao, fale:**` seguido de `"Olá! Como posso ajudar?"`

- **MENSAGEM**  
  Texto entre aspas após **"Fale:"**.  
  Ex.: `**Fale:**` e `"Isso é uma mensagem fixa."`

- **AGUARDAR**  
  Descrição após **"Escute"** ou **"Salvar"**. Opcional: `Salvar resposta do lead em: \`{{nome_var}}\``.

- **CAMINHOS**  
  **Analisando:** `{{ultima_resposta}}` (ou outra variável).  
  Rotas com subseções:
  - **#### +** (ou **#### x**) + label para rotas normais.
  - **#### ?** ou texto "fallback" / "Não entendi" para fallback.
  - Em cada rota: **Quando o lead disser:** `palavra1`, `palavra2`.
  - **Fale:** `"resposta"`.
  - **Depois:** Continue para [BLOCK_KEY] / Encerre / Volte para [BLOCK_KEY].

- **ENCERRAR**  
  **Fale antes de encerrar:** `"Mensagem de despedida."`

- **Depois (próximo bloco)**  
  Em qualquer bloco: `**Depois:** Va para [BLOCK_KEY]` para definir `next_block_key`.

### 6.3 Exemplo mínimo de fluxo em texto (para aplicar no Flow)

```text
## FLUXO DA CONVERSA

### MENSAGEM [MSG001]

**Fale:**

"Olá! Tudo bem?"

**Depois:** Va para [AG001]

### AGUARDAR [AG001]

**Escute a resposta do lead.**

**Depois:** Va para [CAM001]

### CAMINHOS [CAM001]

**Analisando:** `{{ultima_resposta}}`

#### + Sim
**Quando o lead disser:** `sim`, `quero`
**Fale:** "Ótimo!"
**Depois:** Continue para [MSG002]

#### x Não
**Quando o lead disser:** `não`
**Fale:** "Sem problemas."
**Depois:** Encerre

#### ? Não entendi
**Quando nenhuma condicao acima for atendida**
**Fale:** "Pode repetir?"
**Depois:** Volte para [AG001]

### MENSAGEM [MSG002]

**Fale:**

"Obrigada. Até mais!"

**Depois:** Va para [ENC001]

### ENCERRAR [ENC001]: finalizar

**Fale antes de encerrar:**

"Tenha um ótimo dia!"
```

---

## 7. Canal (voz vs WhatsApp)

- Cada bloco pode ter **canal:** `voz` | `whatsapp` | null.
- `null` em blocos de config (order_index &lt; 0); nos demais indica “ambos” ou herda do fluxo.
- Ao salvar por canal, apenas blocos do canal selecionado (ou sem canal) entram na persistência.

---

## 8. Checklist para adaptar fluxos existentes

1. **Primeira mensagem**  
   - Remover bloco de “Primeira mensagem” do canvas se ainda existir.  
   - Configurar a saudação em **Config. global** (Primeira mensagem).

2. **block_key**  
   - Garantir que todo bloco tem `block_key` no padrão PM/MSG/AG/CAM/ENC/FER (ou TOOL).  
   - Sem espaços, sem caracteres especiais; número com 3 dígitos (ex.: MSG001).

3. **next_block_key**  
   - Preencher com o **block_key** do próximo bloco (não UUID).  
   - Último bloco de cada cadeia: null.

4. **Ramificações**  
   - Rotas apenas em **routes_data** do bloco `caminhos`.  
   - Cada rota: `route_key`, `label`, `ordem`, `keywords`, `response`, `destination_type`, `destination_block_key`, `is_fallback`.  
   - Fallback com `route_key` `{block_key}_fallback` e `is_fallback: true`.

5. **route_context**  
   - Todo bloco que pertence a uma rota (não à linha principal) com `parent_router_block_key`, `route_key` e `route_position` corretos.

6. **Ferramentas**  
   - Blocos de tool com `block_key` FER* ou TOOL* e `block_type` `ferramenta`; conteúdo ou `tool_config` preenchido conforme a tool.

7. **Prompt Master**  
   - Manter contexto geral (identidade, personalidade, etc.) **antes** de `## FLUXO DA CONVERSA`.  
   - O parser só gera blocos a partir de `## FLUXO DA CONVERSA` com os títulos e formatos acima.

---

## 9. Resumo das chaves e valores exatos

| Conceito            | Valores / formato                                      |
|---------------------|--------------------------------------------------------|
| Tipos no banco      | `primeira_mensagem`, `mensagem`, `caminhos`, `aguardar`, `encerrar`, `ferramenta` |
| Tipos no canvas     | `primeira_mensagem`, `texto`, `ramificacoes`, `aguardar`, `encerrar`, `tool` |
| Prefixos block_key  | PM, MSG, CAM, AG, ENC, FER, TOOL                       |
| destination_type (banco) | `continuar`, `encerrar`, `loop`                  |
| destinationType (canvas) | `continue`, `end`, `loop`, `goto`                |
| route_key           | `{block_key}_route_{n}` ou `{block_key}_fallback`      |
| Título fluxo no prompt | `## FLUXO DA CONVERSA` (obrigatório para o parser) |
| Config da saudação  | Config. global (assistentes.first_message), não no fluxo |

Seguindo este guia, os fluxos ficam alinhados ao Flow Editor e ao parser de prompt, e você pode adaptar todos os fluxos existentes de forma consistente.
