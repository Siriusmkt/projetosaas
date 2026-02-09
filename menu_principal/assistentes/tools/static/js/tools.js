// ===== VARIÁVEIS GLOBAIS =====
const N8N_BASE_URL = 'https://sdr.salesdever.io/webhook';
let tenantId = null;
let assistantId = null;
let toolsData = [];
let instancesData = [];
let selectedToolType = null;
let selectedContentType = null;
let editingToolId = null;
let toolToDelete = null;
let uploadedFileUrl = null;
let currentFileName = null;
let currentStep = 1;
let currentFilter = 'all';

function getQueryParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
}
function loadSelectedAssistente() {
    try {
        const raw = localStorage.getItem('sd_selected_assistente');
        return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
}
function resolveAssistantId() {
    return getQueryParam('assistente_id') || getQueryParam('assistant_id') ||
        (loadSelectedAssistente() && (loadSelectedAssistente().assistente_id || loadSelectedAssistente().id)) || null;
}

// ===== WEBHOOK N8N (registro na VAPI) =====
async function registerToolInVapi(payload) {
    try {
        const response = await fetch(`${N8N_BASE_URL}/adiciona-tool`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tenant_id: payload.tenant_id || tenantId,
                assistant_id: payload.assistant_id || assistantId,
                tool_name: payload.tool_name || '',
                tool_type: payload.tool_type || 'mensagem',
                prompt_instructions: payload.prompt_instructions || '',
                mensagem: payload.mensagem || '',
                file_url: payload.file_url || '',
                file_type: payload.file_type || '',
                instancia: payload.instancia || '',
            }),
        });
        if (!response.ok) {
            console.warn('n8n adiciona-tool:', response.status, await response.text());
            return null;
        }
        return await response.json();
    } catch (err) {
        console.warn('Erro ao chamar n8n adiciona-tool:', err);
        return null;
    }
}

async function callDesativarTool(payload) {
    try {
        const response = await fetch(`${N8N_BASE_URL}/desativar-tools`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            console.warn('n8n desativar-tools:', response.status);
            return false;
        }
        return true;
    } catch (err) {
        console.warn('Erro ao chamar n8n desativar-tools:', err);
        return false;
    }
}

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', async () => {
    tenantId = localStorage.getItem('tenant_id');
    assistantId = resolveAssistantId();

    if (!tenantId) {
        showToast('Tenant não identificado. Redirecionando...', 'error');
        setTimeout(() => { window.location.href = './setup-tenant.html'; }, 2000);
        return;
    }

    if (!assistantId) {
        showToast('Abra Gerenciar Tools a partir de um assistente (assistente_id na URL ou assistente selecionado).', 'error');
    }
    const sub = document.getElementById('assistantIdSubtitle');
    if (sub) sub.textContent = assistantId ? `Assistente: ${assistantId}` : 'Assistente não identificado — use ?assistente_id=... na URL ou selecione um assistente.';

    showLoading();
    try {
        await Promise.all([loadTools(), loadInstances()]);
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showToast('Erro ao carregar dados iniciais', 'error');
    } finally {
        hideLoading();
    }
});

// ===== CARREGAR DADOS =====
async function loadTools() {
    try {
        const url = assistantId
            ? `/api/tools/${tenantId}?assistant_id=${encodeURIComponent(assistantId)}`
            : `/api/tools/${tenantId}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            let list = data.tools || [];
            if (assistantId) {
                list = list.filter(t => (t.assistant_id || t.assistente_id) === assistantId);
            }
            toolsData = list;
            renderToolsGrid();
            updateToolsCount();
        }
    } catch (error) {
        console.error('Erro ao carregar tools:', error);
        throw error;
    }
}

async function loadInstances() {
    try {
        const response = await fetch(`/api/instances/${tenantId}`);
        const data = await response.json();

        if (data.success) {
            instancesData = data.instances;
        }
    } catch (error) {
        console.error('Erro ao carregar instâncias:', error);
        throw error;
    }
}

// ===== NAVEGAÇÃO DE STEPS =====
function goToStep(step) {
    // Atualizar step atual
    currentStep = step;

    // Atualizar indicadores visuais
    document.querySelectorAll('.step').forEach((el, index) => {
        const stepNum = index + 1;
        el.classList.remove('active', 'completed');

        if (stepNum < currentStep) {
            el.classList.add('completed');
        } else if (stepNum === currentStep) {
            el.classList.add('active');
        }
    });

    // Mostrar conteúdo do step
    document.querySelectorAll('.step-content').forEach(el => {
        el.classList.remove('active');
    });

    const activeContent = document.querySelector(`.step-content[data-step="${step}"]`);
    if (activeContent) {
        activeContent.classList.add('active');
    }

    // Atualizar botões de navegação
    updateNavigationButtons();
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const saveBtn = document.getElementById('saveBtn');

    // Botão Voltar
    if (currentStep === 1) {
        prevBtn.style.display = 'none';
    } else {
        prevBtn.style.display = 'inline-flex';
    }

    // Botão Continuar / Salvar
    if (currentStep === 3) {
        nextBtn.style.display = 'none';
        saveBtn.style.display = 'inline-flex';
    } else {
        nextBtn.style.display = 'inline-flex';
        saveBtn.style.display = 'none';
    }
}

function nextStep() {
    // Validar step atual antes de avançar
    if (!validateCurrentStep()) {
        return;
    }

    if (currentStep < 3) {
        goToStep(currentStep + 1);
    }
}

function previousStep() {
    if (currentStep > 1) {
        goToStep(currentStep - 1);
    }
}

function validateCurrentStep() {
    if (currentStep === 1) {
        if (!selectedToolType) {
            showToast('Selecione um tipo de tool', 'error');
            return false;
        }
    }

    if (currentStep === 2) {
        if (selectedToolType === 'mensagem') {
            if (!selectedContentType) {
                showToast('Selecione o tipo de conteúdo', 'error');
                return false;
            }

            if (selectedContentType === 'texto') {
                const messageText = document.getElementById('messageText')?.value?.trim();
                if (!messageText) {
                    showToast('Digite a mensagem de texto', 'error');
                    return false;
                }
            } else {
                if (!uploadedFileUrl) {
                    showToast('Faça upload do arquivo', 'error');
                    return false;
                }
            }

            const instance = document.getElementById('instanceSelect')?.value;
            if (!instance) {
                showToast('Selecione uma instância WhatsApp', 'error');
                return false;
            }
        } else if (selectedToolType === 'documento') {
            if (!uploadedFileUrl) {
                showToast('Faça upload do documento', 'error');
                return false;
            }
        } else if (selectedToolType === 'agendamento') {
            const link = document.getElementById('agendamentoLink')?.value?.trim();
            if (!link) {
                showToast('Informe o link ou mensagem de agendamento', 'error');
                return false;
            }
        }
    }

    return true;
}

// ===== SELEÇÃO DE TIPO DE TOOL =====
function selectToolType(type) {
    selectedToolType = type;

    // Atualizar visual dos cards
    document.querySelectorAll('.tool-type-card').forEach(card => {
        card.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');

    // Renderizar configuração do step 2
    renderStep2Config(type);

    // Renderizar exemplos do step 3
    renderStep3Examples(type);

    // Avançar automaticamente após 300ms
    setTimeout(() => {
        goToStep(2);
    }, 300);
}

// ===== RENDERIZAR STEP 2 (CONFIGURAÇÃO) =====
function renderStep2Config(type) {
    const container = document.getElementById('configContent');

    if (type === 'mensagem') {
        container.innerHTML = `
            <h3 class="step-title">Configure a mensagem</h3>
            <p class="step-description">Escolha o tipo de conteúdo que será enviado</p>

            <div class="content-type-grid">
                <div class="content-type-btn" onclick="selectContentType('texto')">
                    <svg class="content-type-btn-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <span class="content-type-btn-label">Texto</span>
                </div>
                <div class="content-type-btn" onclick="selectContentType('audio')">
                    <svg class="content-type-btn-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 18V5l12-2v13"/>
                        <circle cx="6" cy="18" r="3"/>
                        <circle cx="18" cy="16" r="3"/>
                    </svg>
                    <span class="content-type-btn-label">Áudio</span>
                </div>
                <div class="content-type-btn" onclick="selectContentType('arquivo')">
                    <svg class="content-type-btn-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                    </svg>
                    <span class="content-type-btn-label">Arquivo</span>
                </div>
                <div class="content-type-btn" onclick="selectContentType('imagem')">
                    <svg class="content-type-btn-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <span class="content-type-btn-label">Imagem</span>
                </div>
                <div class="content-type-btn" onclick="selectContentType('video')">
                    <svg class="content-type-btn-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="23 7 16 12 23 17 23 7"/>
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                    </svg>
                    <span class="content-type-btn-label">Vídeo</span>
                </div>
            </div>

            <div id="contentArea" style="margin-top: 2rem;"></div>

            <div class="form-group" style="margin-top: 2rem;">
                <label for="instanceSelect">
                    <svg style="display: inline-block; vertical-align: middle; margin-right: 0.5rem;" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                        <line x1="12" y1="18" x2="12.01" y2="18"/>
                    </svg>
                    Instância WhatsApp
                </label>
                <select id="instanceSelect" class="form-select">
                    <option value="">Selecione a instância...</option>
                    ${instancesData.map(inst => `
                        <option value="${inst.instance_name}">
                            ${inst.instance_name} (${inst.phone_number})
                        </option>
                    `).join('')}
                </select>
            </div>
        `;
    } else if (type === 'agendamento') {
        container.innerHTML = `
            <h3 class="step-title">Link de agendamento</h3>
            <p class="step-description">Informe o link do calendário ou a mensagem de confirmação que será enviada ao lead</p>

            <div class="form-group">
                <label for="agendamentoLink">
                    <svg style="display: inline-block; vertical-align: middle; margin-right: 0.5rem;" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>
                    Link ou mensagem de agendamento
                </label>
                <input
                    type="text"
                    id="agendamentoLink"
                    class="form-input"
                    placeholder="Ex: https://calendly.com/sua-empresa ou mensagem de confirmação">
            </div>
        `;
    } else if (type === 'encerramento') {
        container.innerHTML = `
            <h3 class="step-title">Configuração de encerramento</h3>
            <p class="step-description">Esta tool permite que o assistente encerre conversas automaticamente</p>

            <div class="ai-examples">
                <h4>
                    <svg style="display: inline-block; vertical-align: middle; margin-right: 0.5rem;" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    Como funciona
                </h4>
                <ul>
                    <li>O assistente avalia a conversa em tempo real</li>
                    <li>Quando as condições são atendidas, a chamada é encerrada</li>
                    <li>Você definirá as condições no próximo passo</li>
                </ul>
            </div>
        `;
    } else if (type === 'documento') {
        container.innerHTML = `
            <h3 class="step-title">Adicione seu documento</h3>
            <p class="step-description">Faça upload do arquivo que a IA poderá consultar</p>

            <div class="file-upload-area" id="fileUploadArea">
                <input type="file" id="fileInput" accept=".pdf,.doc,.docx,.txt" style="display: none;">
                <svg class="file-upload-icon" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                <div class="file-upload-text">Clique ou arraste o arquivo aqui</div>
                <div class="file-upload-formats">Formatos: PDF, DOC, DOCX, TXT</div>
            </div>
            <div id="filePreview"></div>
        `;

        // Setup file upload
        setTimeout(() => setupFileUpload(), 100);
    }
}

// ===== SELEÇÃO DE TIPO DE CONTEÚDO =====
function selectContentType(type) {
    selectedContentType = type;

    // Atualizar visual dos botões
    document.querySelectorAll('.content-type-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');

    // Renderizar área de conteúdo
    const contentArea = document.getElementById('contentArea');

    if (type === 'texto') {
        contentArea.innerHTML = `
            <div class="form-group">
                <label for="messageText">
                    <svg style="display: inline-block; vertical-align: middle; margin-right: 0.5rem;" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    Mensagem de Texto
                </label>
                <textarea
                    id="messageText"
                    class="form-textarea"
                    rows="5"
                    placeholder="Digite a mensagem que será enviada..."></textarea>
                <div class="form-hint">
                    <span>💡 Dica:</span> Use variáveis como {nome}, {empresa} se necessário
                </div>
            </div>
        `;
    } else {
        const acceptTypes = {
            'audio': '.mp3,.ogg,.wav,.m4a,.aac',
            'arquivo': '.pdf,.doc,.docx,.xls,.xlsx',
            'imagem': '.jpg,.jpeg,.png,.gif,.webp,.avif',
            'video': '.mp4,.mov,.avi,.mkv'
        };

        const formatNames = {
            'audio': 'MP3, OGG, WAV, M4A, AAC',
            'arquivo': 'PDF, DOC, DOCX, XLS, XLSX',
            'imagem': 'JPG, PNG, GIF, WEBP, AVIF',
            'video': 'MP4, MOV, AVI, MKV'
        };

        const iconsSVG = {
            'audio': '<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
            'arquivo': '<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>',
            'imagem': '<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
            'video': '<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>'
        };

        contentArea.innerHTML = `
            <div class="form-group">
                <label>Arquivo ${type.charAt(0).toUpperCase() + type.slice(1)}</label>
                <div class="file-upload-area" id="fileUploadArea">
                    <input type="file" id="fileInput" accept="${acceptTypes[type]}" style="display: none;">
                    ${iconsSVG[type]}
                    <div class="file-upload-text">Clique ou arraste o arquivo aqui</div>
                    <div class="file-upload-formats">Formatos: ${formatNames[type]}</div>
                </div>
                <div id="filePreview"></div>
            </div>
        `;

        setTimeout(() => setupFileUpload(), 100);
    }
}

// ===== RENDERIZAR STEP 3 (EXEMPLOS) =====
function renderStep3Examples(type) {
    const container = document.getElementById('aiExamples');

    const examples = {
        'mensagem': {
            title: 'Exemplos de instruções',
            items: [
                'Enviar quando o lead pedir a proposta comercial',
                'Enviar após confirmar o interesse do lead',
                'Enviar quando o lead perguntar sobre preços',
                'Enviar ao final da conversa como material complementar'
            ]
        },
        'agendamento': {
            title: 'Exemplos de instruções',
            items: [
                'Use quando o lead aceitar agendar uma reunião',
                'Use quando o lead pedir o link da live ou do calendário',
                'Enviar link de agendamento após confirmar interesse',
                'Enviar quando o lead quiser marcar uma demonstração'
            ]
        },
        'encerramento': {
            title: 'Exemplos de instruções',
            items: [
                'Encerrar quando o lead disser que não tem interesse',
                'Encerrar após confirmar o agendamento da reunião',
                'Encerrar se o lead pedir para não ligar mais',
                'Encerrar quando todas as informações forem coletadas'
            ]
        },
        'documento': {
            title: 'Exemplos de instruções',
            items: [
                'Consultar quando o lead perguntar sobre preços',
                'Usar como base para responder dúvidas técnicas',
                'Referenciar quando perguntarem sobre funcionalidades',
                'Consultar para fornecer informações detalhadas'
            ]
        }
    };

    const example = examples[type];

    container.innerHTML = `
        <h4>${example.title}</h4>
        <ul>
            ${example.items.map(item => `<li>${item}</li>`).join('')}
        </ul>
    `;
}

// ===== FILE UPLOAD =====
function setupFileUpload() {
    const uploadArea = document.getElementById('fileUploadArea');
    const fileInput = document.getElementById('fileInput');

    if (!uploadArea || !fileInput) return;

    uploadArea.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleFileUpload(file);
    });

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) handleFileUpload(file);
    });
}

async function handleFileUpload(file) {
    showLoading();

    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('tenant_id', tenantId);

        const response = await fetch('/api/tools/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            uploadedFileUrl = data.file_url;
            currentFileName = data.file_name;
            showFilePreview(file.name, data.file_url, selectedContentType);
            showToast('Arquivo enviado com sucesso!', 'success');
        } else {
            showToast(data.detail || data.error || 'Erro ao fazer upload', 'error');
        }
    } catch (error) {
        console.error('Erro no upload:', error);
        showToast('Erro ao fazer upload do arquivo', 'error');
    } finally {
        hideLoading();
    }
}

function showFilePreview(fileName, fileUrl, contentType) {
    const preview = document.getElementById('filePreview');
    if (!preview) return;

    const isImage = (contentType === 'imagem' || (fileUrl && /\.(jpg|jpeg|png|gif|webp|avif)(\?|$)/i.test(fileUrl))) && fileUrl;
    const imgHtml = isImage
        ? `<div class="file-preview-image-wrap"><img src="${fileUrl}" alt="${escapeHtml(fileName)}" class="file-preview-img" onerror="this.style.display='none'"></div>`
        : '';

    preview.innerHTML = `
        <div class="file-preview">
            ${imgHtml}
            <div class="file-preview-info">
                <svg class="file-preview-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
                <span class="file-preview-name">${escapeHtml(fileName)}</span>
            </div>
            <button class="file-preview-remove" onclick="removeFile()">✕</button>
        </div>
    `;
}
function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
}

function removeFile() {
    uploadedFileUrl = null;
    currentFileName = null;
    const preview = document.getElementById('filePreview');
    if (preview) preview.innerHTML = '';
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.value = '';
}

// ===== SALVAR TOOL =====
async function saveTool() {
    const toolName = document.getElementById('toolName')?.value?.trim();
    const promptInstructions = document.getElementById('promptInstructions')?.value?.trim();

    if (!assistantId) {
        showToast('Abra esta página a partir de um assistente (assistente_id na URL ou selecione um assistente).', 'error');
        return;
    }
    if (!toolName) {
        showToast('Nome da tool é obrigatório', 'error');
        return;
    }
    if (!promptInstructions) {
        showToast('Instruções para a IA são obrigatórias', 'error');
        return;
    }

    showLoading();

    try {
        const payload = {
            tenant_id: tenantId,
            assistant_id: assistantId,
            tool_name: toolName,
            tool_type: selectedToolType,
            prompt_instructions: promptInstructions,
            is_active: true,
        };

        if (selectedToolType === 'mensagem') {
            const instance = document.getElementById('instanceSelect')?.value || '';
            payload.file_type = selectedContentType;
            payload.instancia = instance;
            if (selectedContentType === 'texto') {
                payload.mensagem = document.getElementById('messageText')?.value?.trim() || '';
                payload.file_url = null;
            } else {
                payload.mensagem = '';
                payload.file_url = uploadedFileUrl || null;
            }
        } else if (selectedToolType === 'agendamento') {
            payload.mensagem = document.getElementById('agendamentoLink')?.value?.trim() || '';
            payload.file_url = null;
            payload.file_type = null;
            payload.instancia = null;
        } else if (selectedToolType === 'documento') {
            payload.file_url = uploadedFileUrl || null;
            payload.file_type = getFileTypeFromUrl(uploadedFileUrl);
            payload.mensagem = null;
            payload.instancia = null;
        } else if (selectedToolType === 'encerramento') {
            payload.file_type = null;
            payload.file_url = null;
            payload.mensagem = null;
            payload.instancia = null;
        }

        const url = editingToolId ? `/api/tools/${editingToolId}` : '/api/tools';
        const method = editingToolId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.success) {
            const n8nPayload = {
                tenant_id: tenantId,
                assistant_id: assistantId,
                tool_name: toolName,
                tool_type: selectedToolType === 'documento' ? 'mensagem' : selectedToolType,
                prompt_instructions: promptInstructions || '',
                mensagem: payload.mensagem || '',
                file_url: payload.file_url || '',
                file_type: payload.file_type || '',
                instancia: payload.instancia || '',
            };
            await registerToolInVapi(n8nPayload);

            showToast(
                editingToolId ? 'Tool atualizada!' : 'Tool criada com sucesso!',
                'success'
            );
            resetForm();
            await loadTools();
        } else {
            showToast(data.detail || 'Erro ao salvar tool', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar:', error);
        showToast('Erro ao salvar tool', 'error');
    } finally {
        hideLoading();
    }
}

function getFileTypeFromUrl(url) {
    if (!url) return null;
    const extension = url.split('.').pop().toLowerCase();
    const typeMap = {
        'pdf': 'pdf',
        'doc': 'doc',
        'docx': 'doc',
        'txt': 'txt'
    };
    return typeMap[extension] || 'arquivo';
}

// ===== RENDERIZAÇÃO =====
function updateToolsCount() {
    const countElement = document.getElementById('toolsCount');
    const count = toolsData.length;
    countElement.textContent = count;
}

function renderToolsGrid() {
    const grid = document.getElementById('toolsGrid');

    // Filtrar tools
    let filteredTools = toolsData;
    if (currentFilter !== 'all') {
        filteredTools = toolsData.filter(tool => tool.tool_type === currentFilter);
    }

    if (filteredTools.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <p>Nenhuma tool encontrada</p>
                <small>Crie sua primeira tool usando o formulário acima</small>
            </div>
        `;
        return;
    }

    grid.innerHTML = filteredTools.map(tool => createToolCard(tool)).join('');
}

function createToolCard(tool) {
    const icon = getToolIcon(tool.tool_type);
    const statusIcon = tool.is_active
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>'
        : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
    const statusClass = tool.is_active ? 'active' : 'inactive';

    return `
        <div class="tool-card">
            <div class="tool-card-header">
                <div class="tool-icon">${icon}</div>
                <div class="tool-status ${statusClass}">${statusIcon}</div>
            </div>

            <h3 class="tool-name">${tool.tool_name}</h3>

            <div class="tool-meta">
                <div class="tool-meta-item">
                    <span class="tool-meta-label">Tipo:</span>
                    <span>${getToolTypeName(tool.tool_type)}</span>
                </div>
                ${tool.file_type ? `
                    <div class="tool-meta-item">
                        <span class="tool-meta-label">Conteúdo:</span>
                        <span>${getFileTypeName(tool.file_type)}</span>
                    </div>
                ` : ''}
                ${tool.instancia ? `
                    <div class="tool-meta-item">
                        <span class="tool-meta-label">Instância:</span>
                        <span>${tool.instancia}</span>
                    </div>
                ` : ''}
            </div>

            <div class="tool-instructions">
                ${tool.prompt_instructions || 'Sem instruções'}
            </div>

            <div class="tool-card-actions">
                <button class="btn-icon" onclick="editTool('${tool.id}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Editar
                </button>
                <button class="btn-icon delete" onclick="showDeleteModal('${tool.id}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    Excluir
                </button>
            </div>
        </div>
    `;
}

function getToolIcon(type) {
    const icons = {
        'mensagem': `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>`,
        'agendamento': `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>`,
        'encerramento': `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/>
            <line x1="12" y1="2" x2="12" y2="12"/>
        </svg>`,
        'documento': `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>`
    };
    return icons[type] || `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
    </svg>`;
}

function getToolTypeName(type) {
    const names = { 'mensagem': 'Mensagem', 'agendamento': 'Agendamento', 'encerramento': 'Encerramento', 'documento': 'Documento' };
    return names[type] || type;
}

function getFileTypeName(type) {
    const names = {
        'texto': 'Texto', 'audio': 'Áudio', 'arquivo': 'Arquivo',
        'imagem': 'Imagem', 'video': 'Vídeo', 'pdf': 'PDF', 'doc': 'Documento'
    };
    return names[type] || type;
}

// ===== FILTROS =====
function filterTools(filter) {
    currentFilter = filter;

    // Atualizar tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.currentTarget.classList.add('active');

    renderToolsGrid();
}

// ===== TOGGLE CREATE SECTION =====
function toggleCreateSection() {
    const card = document.getElementById('createFormCard');
    const btn = document.getElementById('collapseBtn');

    card.classList.toggle('collapsed');

    if (card.classList.contains('collapsed')) {
        btn.innerHTML = '<span>Expandir</span> ▲';
    } else {
        btn.innerHTML = '<span>Minimizar</span> ▼';
    }
}

// ===== DELETAR TOOL =====
function showDeleteModal(toolId) {
    toolToDelete = toolId;
    document.getElementById('confirmModal').classList.add('active');
}

function closeModal() {
    document.getElementById('confirmModal').classList.remove('active');
    toolToDelete = null;
}

async function confirmDelete() {
    if (!toolToDelete) return;

    const tool = toolsData.find(t => t.id === toolToDelete);
    closeModal();
    showLoading();

    try {
        if (tool) {
            const desativarPayload = {
                id: tool.id,
                tenant_id: tenantId,
                assistant_id: tool.assistant_id || tool.assistente_id || assistantId,
                tool_type: tool.tool_type,
                tool_name: tool.tool_name,
            };
            await callDesativarTool(desativarPayload);
        }

        const response = await fetch(`/api/tools/${toolToDelete}?tenant_id=${tenantId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            showToast('Tool excluída com sucesso!', 'success');
            await loadTools();
        } else {
            showToast(data.detail || 'Erro ao excluir tool', 'error');
        }
    } catch (error) {
        console.error('Erro ao excluir:', error);
        showToast('Erro ao excluir tool', 'error');
    } finally {
        hideLoading();
        toolToDelete = null;
    }
}

// ===== RESET FORM =====
function cancelForm() {
    resetForm();
}

function resetForm() {
    selectedToolType = null;
    selectedContentType = null;
    editingToolId = null;
    uploadedFileUrl = null;
    currentFileName = null;
    currentStep = 1;

    // Resetar visual
    document.querySelectorAll('.tool-type-card').forEach(card => {
        card.classList.remove('selected');
    });

    // Voltar ao step 1
    goToStep(1);

    // Limpar inputs
    const toolName = document.getElementById('toolName');
    const promptInstructions = document.getElementById('promptInstructions');
    if (toolName) toolName.value = '';
    if (promptInstructions) promptInstructions.value = '';

    // Scroll para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== EDITAR TOOL =====
function editTool(toolId) {
    const tool = toolsData.find(t => t.id === toolId);
    if (!tool) return;

    editingToolId = toolId;
    selectedToolType = tool.tool_type;

    // Expandir formulário se estiver colapsado
    const card = document.getElementById('createFormCard');
    if (card.classList.contains('collapsed')) {
        toggleCreateSection();
    }

    // Selecionar tipo
    const typeCard = document.querySelector(`.tool-type-card[onclick*="${tool.tool_type}"]`);
    if (typeCard) {
        typeCard.classList.add('selected');
    }

    // Renderizar steps
    renderStep2Config(tool.tool_type);
    renderStep3Examples(tool.tool_type);

    // Ir para o step 3 (final)
    setTimeout(() => {
        goToStep(3);

        // Preencher campos
        document.getElementById('toolName').value = tool.tool_name;
        document.getElementById('promptInstructions').value = tool.prompt_instructions || '';

        if (tool.tool_type === 'mensagem') {
            selectedContentType = tool.file_type;

            // Voltar para step 2 para configurar
            setTimeout(() => {
                const contentBtn = document.querySelector(`.content-type-btn[onclick*="${tool.file_type}"]`);
                if (contentBtn) {
                    contentBtn.click();
                }

                if (tool.instancia) {
                    const select = document.getElementById('instanceSelect');
                    if (select) select.value = tool.instancia;
                }

                setTimeout(() => {
                    if (tool.file_type === 'texto' && tool.url_or_message) {
                        const textArea = document.getElementById('messageText');
                        if (textArea) textArea.value = tool.url_or_message;
                    } else if (tool.file_url) {
                        uploadedFileUrl = tool.file_url;
                        showFilePreview(tool.file_url.split('/').pop(), tool.file_url);
                    }

                    goToStep(3);
                }, 200);
            }, 200);
        } else if (tool.tool_type === 'agendamento') {
            const linkEl = document.getElementById('agendamentoLink');
            if (linkEl) linkEl.value = tool.mensagem || tool.url_or_message || '';
        } else if (tool.tool_type === 'documento' && tool.file_url) {
            uploadedFileUrl = tool.file_url;
            setTimeout(() => {
                showFilePreview(tool.file_url.split('/').pop(), tool.file_url);
            }, 200);
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
}

// ===== UI HELPERS =====
function showLoading() {
    document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('active');
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = toast.querySelector('.toast-message');
    const toastIcon = toast.querySelector('.toast-icon');

    if (toastMessage) toastMessage.textContent = message;
    toast.className = `toast ${type} show`;

    // Atualizar ícone baseado no tipo
    if (toastIcon) {
        if (type === 'error') {
            toastIcon.innerHTML = '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>';
        } else if (type === 'info') {
            toastIcon.innerHTML = '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>';
        } else {
            toastIcon.innerHTML = '<polyline points="20 6 9 17 4 12"/>';
        }
    }

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

