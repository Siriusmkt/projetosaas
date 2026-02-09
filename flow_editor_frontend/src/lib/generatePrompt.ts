import type { PromptCompleto } from '@/types/prompt';

export function generatePrompt(data: PromptCompleto): string {
  const sections: string[] = [];
  
  const { identidade, institucional, regras, gatilhos, scripts, fluxo, faq, objecoes, conectivos, diferenciais, criterios, coleta, tom, pronuncia } = data;

  if (!identidade) {
    return '# Preencha a seção "Identidade da IA" para gerar o prompt';
  }

  // HEADER
  sections.push(`# PROMPT MASTER - ${identidade.nome_ia.toUpperCase()} IA
## IA DE PRÉ-VENDA RECEPTIVA | ${identidade.empresa_nome.toUpperCase()}

---`);

  // PAPEL DA IA
  sections.push(`## PAPEL DA IA

Você é **${identidade.nome_ia}**, ${identidade.funcao} da ${identidade.empresa_nome}.

**Sua função é:**
- Conversar de forma humana, natural e objetiva com leads que demonstraram interesse
- Identificar RAPIDAMENTE o contexto e tipo de necessidade
- Encerrar e direcionar IMEDIATAMENTE quando houver intenção de compra direta
- Qualificar de forma consultiva apenas quando for caso de projeto/consultoria

**Você não vende, não negocia, não passa preços, não coleta dados sensíveis.**

---`);

  // REGRAS
  const regrasAtivas = regras.filter(r => r.is_active);
  if (regrasAtivas.length > 0) {
    sections.push(`## REGRAS ABSOLUTAS (NÃO NEGOCIÁVEIS)

### **PROIBIÇÕES CRÍTICAS:**

${regrasAtivas.map((r, i) => `${i + 1}. **${r.regra_nome}**
   - ${r.regra_descricao || ''}`).join('\n\n')}

---`);
  }

  // INFORMAÇÕES INSTITUCIONAIS
  if (institucional) {
    const infoLines: string[] = [];
    if (institucional.cidade && institucional.estado) {
      infoLines.push(`- A ${identidade.empresa_nome_curto || identidade.empresa_nome} fica em ${institucional.cidade}, ${institucional.estado}`);
    }
    if (institucional.area_entrega) {
      infoLines.push(`- ${institucional.area_entrega}`);
    }
    if (institucional.nome_ceo) {
      infoLines.push(`- O CEO é ${institucional.nome_ceo}`);
    }
    infoLines.push(`- ${institucional.tipo_produto}`);
    if (institucional.diferenciais && institucional.diferenciais.length > 0) {
      infoLines.push(`- Nosso diferencial: ${institucional.diferenciais.join(', ')}`);
    }

    sections.push(`## INFORMAÇÕES INSTITUCIONAIS (USAR SOMENTE SE PERGUNTADO)

${infoLines.join('\n')}

**Responder sempre de forma curta e objetiva.**

---`);
  }

  // GATILHOS DE CONTEXTO
  const gatilhosConsultivos = gatilhos.filter(g => g.tipo === 'consultivo');
  const gatilhosSaida = gatilhos.filter(g => g.tipo === 'saida_rapida');
  
  if (gatilhos.length > 0) {
    sections.push(`## IDENTIFICAÇÃO DE CONTEXTO (CRÍTICO - FAZER LOGO NO INÍCIO)

### 🟢 **CONSULTIVO / PROJETO** (Seguir fluxo normal)

Frases como:
${gatilhosConsultivos.map(g => `- "${g.frase_gatilho}"`).join('\n')}

➡️ **Seguir fluxo de qualificação consultiva normal**

### 🔴 **COMPRA IMEDIATA / SAÍDA RÁPIDA** (GATILHO DE SAÍDA)

Se o cliente disser QUALQUER coisa parecida com:
${gatilhosSaida.map(g => `- "${g.frase_gatilho}"`).join('\n')}

⚠️ **PARE QUALQUER QUALIFICAÇÃO IMEDIATAMENTE**

---`);
  }

  // SCRIPTS OBRIGATÓRIOS
  const scriptSaida1 = scripts.find(s => s.script_key === 'saida_imediata_1');
  const scriptSaida2 = scripts.find(s => s.script_key === 'saida_imediata_2');
  
  if (scriptSaida1 && scriptSaida2) {
    sections.push(`## FRASE OBRIGATÓRIA - SAÍDA IMEDIATA

Use exatamente este padrão:

**"${scriptSaida1.conteudo}"**

**Aguarde confirmação do cliente**

Quando o cliente concordar:

**"${scriptSaida2.conteudo}"**

➡️ **ENCERRAR A CONVERSA IMEDIATAMENTE**

---`);
  }

  // Outros scripts
  const outrosScripts = scripts.filter(s => !s.script_key.startsWith('saida_imediata'));
  if (outrosScripts.length > 0) {
    sections.push(`## SCRIPTS ADICIONAIS

${outrosScripts.map(s => `### **${s.contexto}**
"${s.conteudo}"
${s.instrucao_uso ? `\n*Quando usar: ${s.instrucao_uso}*` : ''}`).join('\n\n')}

---`);
  }

  // FLUXO DE QUALIFICAÇÃO
  if (fluxo.length > 0) {
    sections.push(`## FLUXO RECEPTIVO - APENAS PARA CASOS CONSULTIVOS/PROJETO

${fluxo.sort((a, b) => a.etapa_numero - b.etapa_numero).map(f => `### **${f.etapa_numero}º PASSO - ${f.etapa_nome.toUpperCase()}**

${f.pergunta}

**Aguarde resposta completa**

${f.instrucoes_adicionais || ''}`).join('\n\n---\n\n')}

---`);
  }

  // FAQ
  if (faq.length > 0) {
    sections.push(`## RESPOSTAS PADRÃO PARA LIMITES

${faq.map(f => `### **${f.topico}**
"${f.resposta}"`).join('\n\n')}

---`);
  }

  // OBJEÇÕES
  if (objecoes.length > 0) {
    sections.push(`## TRATAMENTO DE OBJEÇÕES PRINCIPAIS

${objecoes.map(o => `### **"${o.objecao_gatilho}"**
${o.estrategia ? `*Estratégia: ${o.estrategia}*\n` : ''}"${o.resposta}"`).join('\n\n')}

---`);
  }

  // CONECTIVOS
  if (conectivos.length > 0) {
    const conectivosPorTipo = {
      validacao: conectivos.find(c => c.tipo === 'validacao'),
      concordancia: conectivos.find(c => c.tipo === 'concordancia'),
      transicao: conectivos.find(c => c.tipo === 'transicao'),
      empatia: conectivos.find(c => c.tipo === 'empatia'),
      explicacao: conectivos.find(c => c.tipo === 'explicacao'),
    };

    const expressoesValidacao = conectivosPorTipo.validacao?.expressoes.map(e => `"${e}"`).join(', ') || '"Entendi", "Faz sentido"';

    sections.push(`## EXPRESSÕES E CONECTIVOS

${conectivosPorTipo.validacao ? `**Validação Positiva:** ${conectivosPorTipo.validacao.expressoes.join(', ')}` : ''}
${conectivosPorTipo.concordancia ? `**Concordância:** ${conectivosPorTipo.concordancia.expressoes.join(', ')}` : ''}
${conectivosPorTipo.transicao ? `**Transição:** ${conectivosPorTipo.transicao.expressoes.join(', ')}` : ''}
${conectivosPorTipo.empatia ? `**Empatia:** ${conectivosPorTipo.empatia.expressoes.join(', ')}` : ''}
${conectivosPorTipo.explicacao ? `**Início de Explicação:** ${conectivosPorTipo.explicacao.expressoes.join(', ')}` : ''}

---`);
  }

  // DIFERENCIAIS POR DOR
  if (diferenciais.length > 0) {
    sections.push(`## ARGUMENTOS POR DOR DO CLIENTE

${diferenciais.map(d => `### **Quando mencionar: ${d.dor_mencionada}**
"${d.argumento}"`).join('\n\n')}

---`);
  }

  // TOM E DIRETRIZES
  if (tom) {
    const proporcaoFala = tom.proporcao_fala_escuta.split('/')[0] || '20';
    const proporcaoEscuta = tom.proporcao_fala_escuta.split('/')[1] || '80';
    
    sections.push(`## DIRETRIZES DE EXECUÇÃO

1. **Identificar contexto RAPIDAMENTE** (compra direta vs projeto consultivo)
2. **Escuta Ativa:** Fale ${proporcaoFala}%, escute ${proporcaoEscuta}%
3. **Uma Pergunta Por Vez:** JAMAIS faça múltiplas perguntas na mesma mensagem
4. **Confirmações Naturais:** Use expressões de validação
5. **Pausas Estratégicas:** Dê tempo para o cliente processar e responder
6. **Linguagem Simples:** Evite jargões técnicos desnecessários
7. **Respeite o Momento:** Nunca insista se não houver interesse real
${tom.posicionamento === 'consultivo' ? '8. **Consultiva Sempre:** Posicione-se como orientadora, não vendedora' : ''}
9. **Uma Despedida e Encerre:** Sem loops de despedida
${tom.usa_girias ? '10. **Use linguagem brasileira natural:** Gírias leves, tom conversacional' : ''}
${tom.instrucoes_adicionais ? `\n**Instruções Adicionais:** ${tom.instrucoes_adicionais}` : ''}

---`);
  }

  // CRITÉRIOS DE QUALIFICAÇÃO
  const criteriosQuente = criterios.filter(c => c.tipo_lead === 'quente' && c.is_active);
  const criteriosMorno = criterios.filter(c => c.tipo_lead === 'morno' && c.is_active);
  const criteriosFrio = criterios.filter(c => c.tipo_lead === 'frio' && c.is_active);
  
  if (criterios.length > 0) {
    sections.push(`## CRITÉRIOS DE QUALIFICAÇÃO

### **Lead QUENTE 🔥 (Direcionar para time humano):**
${criteriosQuente.map(c => `- ${c.criterio}`).join('\n')}

### **Lead MORNO 🌡️ (Educar e direcionar com cautela):**
${criteriosMorno.map(c => `- ${c.criterio}`).join('\n')}

### **Lead FRIO ❄️ (Agradecer e liberar):**
${criteriosFrio.map(c => `- ${c.criterio}`).join('\n')}

---`);
  }

  // CAMPOS A COLETAR
  if (coleta.length > 0) {
    sections.push(`## CAMPOS ESSENCIAIS A COLETAR

${coleta.sort((a, b) => a.ordem - b.ordem).map(c => `- ${c.campo_nome}${c.is_obrigatorio ? ' **(obrigatório)**' : ''}${c.campo_descricao ? ` - ${c.campo_descricao}` : ''}`).join('\n')}

---`);
  }

  // PRONÚNCIA (se houver)
  if (pronuncia.length > 0) {
    sections.push(`## INSTRUÇÕES DE PRONÚNCIA

**SEMPRE pronuncie números e símbolos por extenso:**

${pronuncia.map(p => `- ${p.simbolo} = "${p.pronuncia}"`).join('\n')}

---`);
  }

  // LEMBRETE FINAL
  const genero = identidade.genero === 'feminino' ? 'a' : identidade.genero === 'masculino' ? 'o' : 'e';
  sections.push(`## LEMBRE-SE SEMPRE:

- Você é **${identidade.nome_ia}**, ${identidade.funcao} da ${identidade.empresa_nome_curto || identidade.empresa_nome}
- **IDENTIFIQUE O CONTEXTO RAPIDAMENTE** (compra direta vs projeto)
- **USE O GATILHO DE SAÍDA** quando houver intenção de compra imediata
- **JAMAIS mencione preços, valores ou faixas de investimento**
- **SEMPRE use números por extenso**
- **UMA pergunta por vez** - aguarde resposta completa
- **Uma despedida e encerre** - sem loops
- **Seja natural e genuinamente curios${genero}** sobre o projeto do cliente
- **O lead já demonstrou interesse** - você precisa entender e qualificar

**Slogan interno:** "${identidade.empresa_nome_curto || identidade.empresa_nome} - Facilitar conexões certas!"`);

  return sections.join('\n\n');
}
