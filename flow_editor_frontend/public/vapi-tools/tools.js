// ===== VARIÁVEIS GLOBAIS =====
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

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', async () => {
    tenantId = getQueryParam('tenant_id') || localStorage.getItem('tenant_id');
    assistantId = getQueryParam('assistente_id') || getQueryParam('assistant_id') || (loadSelectedAssistente() && (loadSelectedAssistente().assistente_id || loadSelectedAssistente().id)) || null;
    if (tenantId && getQueryParam('tenant_id')) localStorage.setItem('tenant_id', tenantId);

    if (!tenantId) {
        showToast('Tenant não identificado. Redirecionando...', 'error');
        setTimeout(() => {
            window.location.href = '/vapi-tools/setup-tenant.html';
        }, 800);
        return;
    }

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
        const response = await fetch(`/api/tools/${tenantId}`);
        const data = await response.json();

        if (data.success) {
            toolsData = data.tools;
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
    currentStep = step;

    document.querySelectorAll('.step').forEach((el, index) => {
        const stepNum = index + 1;
        el.classList.remove('active', 'completed');

        if (stepNum < currentStep) {
            el.classList.add('completed');
        } else if (stepNum === currentStep) {
            el.classList.add('active');
        }
    });

    document.querySelectorAll('.step-content').forEach(el => {
        el.classList.remove('active');
    });

    const activeContent = document.querySelector(`.step-content[data-step="${step}"]`);
    if (activeContent) {
        activeContent.classList.add('active');
    }

    updateNavigationButtons();
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const saveBtn = document.getElementById('saveBtn');

    if (currentStep === 1) {
        prevBtn.style.display = 'none';
    } else {
        prevBtn.style.display = 'inline-flex';
    }

    if (currentStep === 3) {
        nextBtn.style.display = 'none';
        saveBtn.style.display = 'inline-flex';
    } else {
        nextBtn.style.display = 'inline-flex';
        saveBtn.style.display = 'none';
    }
}

function nextStep() {
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
        }
    }

    return true;
}

// ===== SELEÇÃO DE TIPO DE TOOL =====
function selectToolType(type) {
    selectedToolType = type;

    document.querySelectorAll('.tool-type-card').forEach(card => {
        card.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');

    renderStep2Config(type);
    renderStep3Examples(type);

    setTimeout(() => {
        goToStep(2);
    }, 300);
}

// ===== RENDER STEP 2 CONFIG =====
function renderStep2Config(type) {
    const configContent = document.getElementById('configContent');

    if (type === 'mensagem') {
        configContent.innerHTML = `
            <h3 class="step-title">Configure sua mensagem</h3>
            <p class="step-description">Escolha o tipo de conteúdo e configure os detalhes</p>

            <div class="form-group">
                <label>Tipo de conteúdo</label>
                <div class="tool-type-grid" style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));">
                    <div class="tool-type-card" onclick="selectContentType('texto')">
                        <h4>Texto</h4>
                        <p>Mensagem de texto simples</p>
                    </div>
                    <div class="tool-type-card" onclick="selectContentType('audio')">
                        <h4>Áudio</h4>
                        <p>Mensagem de voz</p>
                    </div>
                    <div class="tool-type-card" onclick="selectContentType('imagem')">
                        <h4>Imagem</h4>
                        <p>Foto ou imagem</p>
                    </div>
                    <div class="tool-type-card" onclick="selectContentType('video')">
                        <h4>Vídeo</h4>
                        <p>Arquivo de vídeo</p>
                    </div>
                    <div class="tool-type-card" onclick="selectContentType('arquivo')">
                        <h4>Arquivo</h4>
                        <p>Documento ou arquivo</p>
                    </div>
                </div>
            </div>

            <div id="contentConfig"></div>

            <div class="form-group">
                <label for="instanceSelect">Instância WhatsApp</label>
                <select id="instanceSelect" class="form-select">
                    <option value="">Selecione uma instância</option>
                    ${instancesData.map(inst => `
                        <option value="${inst.instance_name}">${inst.instance_name} (${inst.phone_number || 'Sem número'})</option>
                    `).join('')}
                </select>
            </div>
        `;
    } else if (type === 'encerramento') {
        configContent.innerHTML = `
            <h3 class="step-title">Configurar Encerramento</h3>
            <p class="step-description">Defina como a conversa deve ser encerrada</p>

            <div class="form-group">
                <label for="endMessage">Mensagem de encerramento</label>
                <textarea id="endMessage" class="form-textarea" rows="4" placeholder="Ex: Foi um prazer ajudar! Se precisar de algo mais, estou à disposição."></textarea>
            </div>
        `;
    } else if (type === 'documento') {
        configContent.innerHTML = `
            <h3 class="step-title">Configurar Documento</h3>
            <p class="step-description">Faça upload do documento que a IA poderá consultar</p>

            <div class="form-group">
                <label>Upload do Documento</label>
                <div class="upload-area" onclick="document.getElementById('fileInput').click()">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <p>Clique para selecionar arquivo</p>
                    <span>PDF, DOC, DOCX, TXT</span>
                </div>
                <input type="file" id="fileInput" style="display: none;" accept=".pdf,.doc,.docx,.txt" onchange="handleFileUpload(event)">
                <div id="uploadStatus"></div>
            </div>
        `;
    }
}

// ===== SELEÇÃO DE CONTEÚDO =====
function selectContentType(type) {
    selectedContentType = type;
    
    document.querySelectorAll('#configContent .tool-type-card').forEach(card => {
        card.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');

    renderContentConfig(type);
}

function renderContentConfig(type) {
    const contentConfig = document.getElementById('contentConfig');
    
    if (type === 'texto') {
        contentConfig.innerHTML = `
            <div class="form-group">
                <label for="messageText">Mensagem de texto</label>
                <textarea id="messageText" class="form-textarea" rows="4" placeholder="Digite a mensagem que será enviada..."></textarea>
            </div>
        `;
    } else {
        contentConfig.innerHTML = `
            <div class="form-group">
                <label>Upload do arquivo</label>
                <div class="upload-area" onclick="document.getElementById('fileInput').click()">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <p>Clique para selecionar arquivo</p>
                    <span>${getFileTypeDescription(type)}</span>
                </div>
                <input type="file" id="fileInput" style="display: none;" accept="${getFileAccept(type)}" onchange="handleFileUpload(event)">
                <div id="uploadStatus"></div>
            </div>
        `;
    }
}

function getFileTypeDescription(type) {
    const descriptions = {
        audio: 'MP3, WAV, OGG',
        imagem: 'JPG, PNG, WEBP',
        video: 'MP4',
        arquivo: 'PDF, DOC, XLS'
    };
    return descriptions[type] || 'Arquivo';
}

function getFileAccept(type) {
    const accepts = {
        audio: 'audio/*',
        imagem: 'image/*',
        video: 'video/mp4',
        arquivo: '.pdf,.doc,.docx,.xls,.xlsx'
    };
    return accepts[type] || '*';
}

// ===== UPLOAD DE ARQUIVO =====
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

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
            showUploadSuccess(data.file_name);
        } else {
            throw new Error(data.detail || 'Erro no upload');
        }
    } catch (error) {
        console.error('Erro no upload:', error);
        showToast('Erro ao fazer upload', 'error');
    } finally {
        hideLoading();
    }
}

function showUploadSuccess(fileName) {
    const uploadStatus = document.getElementById('uploadStatus');
    if (uploadStatus) {
        uploadStatus.innerHTML = `
            <div class="upload-success">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>${fileName} enviado com sucesso</span>
            </div>
        `;
    }
}

// ===== RENDER STEP 3 EXAMPLES =====
function renderStep3Examples(type) {
    const examples = {
        mensagem: [
            '"Envie a proposta quando o cliente pedir detalhes do preço"',
            '"Use esta ferramenta para mandar o catálogo completo"',
        ],
        encerramento: [
            '"Encerre quando o cliente não demonstrar interesse"',
            '"Finalize após confirmar o agendamento"',
        ],
        documento: [
            '"Use este documento para responder dúvidas técnicas"',
            '"Consulte este material quando o cliente pedir especificações"',
        ]
    };

    const aiExamples = document.getElementById('aiExamples');
    if (aiExamples) {
        aiExamples.innerHTML = `
            <div class="examples-card">
                <h4>Exemplos de instruções:</h4>
                <ul>
                    ${examples[type]?.map(ex => `<li>${ex}</li>`).join('') || ''}
                </ul>
            </div>
        `;
    }
}

// ===== SALVAR TOOL =====
async function saveTool() {
    if (!validateCurrentStep()) return;

    const toolName = document.getElementById('toolName')?.value?.trim();
    const promptInstructions = document.getElementById('promptInstructions')?.value?.trim();

    if (!toolName) {
        showToast('Nome da tool é obrigatório', 'error');
        return;
    }

    if (!promptInstructions) {
        showToast('Instruções para IA são obrigatórias', 'error');
        return;
    }
    if (!assistantId) {
        showToast('Abra Gerenciar Tools a partir do Flow Editor com um assistente selecionado (ou use o link do menu do assistente).', 'error');
        return;
    }

    const toolData = {
        tenant_id: tenantId,
        assistant_id: assistantId,
        tool_name: toolName,
        tool_type: selectedToolType,
        prompt_instructions: promptInstructions,
    };

    if (selectedToolType === 'mensagem') {
        toolData.file_type = selectedContentType;
        toolData.instancia = document.getElementById('instanceSelect')?.value;
        
        if (selectedContentType === 'texto') {
            toolData.mensagem = document.getElementById('messageText')?.value?.trim();
        } else {
            toolData.file_url = uploadedFileUrl;
        }
    } else if (selectedToolType === 'encerramento') {
        toolData.mensagem = document.getElementById('endMessage')?.value?.trim();
    } else if (selectedToolType === 'documento') {
        toolData.file_url = uploadedFileUrl;
        toolData.file_type = getFileTypeFromUrl(uploadedFileUrl);
    }

    showLoading();
    try {
        const response = await fetch('/api/tools', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(toolData)
        });

        const data = await response.json();

        if (data.success) {
            showToast('Tool criada com sucesso!', 'success');
            resetForm();
            await loadTools();
        } else {
            throw new Error(data.detail || 'Erro ao criar tool');
        }
    } catch (error) {
        console.error('Erro ao salvar tool:', error);
        showToast('Erro ao criar tool', 'error');
    } finally {
        hideLoading();
    }
}

// ===== EDITAR TOOL =====
function editTool(toolId) {
    const tool = toolsData.find(t => t.id === toolId);
    if (!tool) return;

    editingToolId = toolId;
    selectedToolType = tool.tool_type;

    document.getElementById('toolName').value = tool.tool_name || '';
    document.getElementById('promptInstructions').value = tool.prompt_instructions || '';

    if (tool.tool_type === 'mensagem') {
        selectedContentType = tool.file_type;
        uploadedFileUrl = tool.file_url;
        if (tool.mensagem) {
            const messageText = document.getElementById('messageText');
            if (messageText) messageText.value = tool.mensagem;
        }
    }

    goToStep(3);
    showToast('Editando tool', 'info');
}

// ===== DELETAR TOOL =====
function deleteTool(toolId) {
    toolToDelete = toolId;
    document.getElementById('deleteModal').style.display = 'flex';
}

function closeDeleteModal() {
    toolToDelete = null;
    document.getElementById('deleteModal').style.display = 'none';
}

async function confirmDelete() {
    if (!toolToDelete) return;

    showLoading();
    try {
        const response = await fetch(`/api/tools/${toolToDelete}?tenant_id=${tenantId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            showToast('Tool removida', 'success');
            await loadTools();
        } else {
            throw new Error(data.detail || 'Erro ao deletar tool');
        }
    } catch (error) {
        console.error('Erro ao deletar tool:', error);
        showToast('Erro ao deletar tool', 'error');
    } finally {
        hideLoading();
        closeDeleteModal();
    }
}

// ===== FILTROS =====
function filterTools(filter) {
    currentFilter = filter;
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    event.currentTarget.classList.add('active');
    renderToolsGrid();
}

function renderToolsGrid() {
    const toolsGrid = document.getElementById('toolsGrid');
    if (!toolsGrid) return;

    let filteredTools = toolsData;
    if (currentFilter !== 'all') {
        filteredTools = toolsData.filter(tool => tool.tool_type === currentFilter);
    }

    if (filteredTools.length === 0) {
        toolsGrid.innerHTML = `
            <div class="empty-state">
                <p>Nenhuma tool encontrada</p>
            </div>
        `;
        return;
    }

    toolsGrid.innerHTML = filteredTools.map(tool => `
        <div class="tool-card">
            <div class="tool-header">
                <div class="tool-info">
                    <h3>${tool.tool_name}</h3>
                    <span class="tool-type">${tool.tool_type}</span>
                </div>
                <div class="tool-actions">
                    <button class="action-btn" onclick="editTool('${tool.id}')">
                        ✏️
                    </button>
                    <button class="action-btn" onclick="deleteTool('${tool.id}')">
                        🗑️
                    </button>
                </div>
            </div>
            <div class="tool-details">
                <p><strong>Instruções:</strong> ${tool.prompt_instructions || 'Sem instruções'}</p>
                ${tool.mensagem ? `<p><strong>Mensagem:</strong> ${tool.mensagem}</p>` : ''}
                ${tool.file_url ? `<p><strong>Arquivo:</strong> ${tool.file_url}</p>` : ''}
            </div>
        </div>
    `).join('');
}

function updateToolsCount() {
    const count = toolsData.filter(t => t.is_active).length;
    document.getElementById('toolsCount').textContent = count;
}

// ===== UTILITÁRIOS =====
function toggleCreateSection() {
    const formCard = document.getElementById('createFormCard');
    const collapseBtn = document.getElementById('collapseBtn');
    
    if (formCard.style.display === 'none') {
        formCard.style.display = 'block';
        collapseBtn.querySelector('span').textContent = 'Minimizar';
    } else {
        formCard.style.display = 'none';
        collapseBtn.querySelector('span').textContent = 'Expandir';
    }
}

function resetForm() {
    selectedToolType = null;
    selectedContentType = null;
    uploadedFileUrl = null;
    currentFileName = null;
    editingToolId = null;
    currentStep = 1;

    document.querySelectorAll('.tool-type-card').forEach(card => {
        card.classList.remove('selected');
    });

    document.getElementById('toolName').value = '';
    document.getElementById('promptInstructions').value = '';
    document.getElementById('configContent').innerHTML = '';
    document.getElementById('aiExamples').innerHTML = '';

    goToStep(1);
}

function cancelForm() {
    resetForm();
}

function getFileTypeFromUrl(url) {
    if (!url) return null;
    const ext = url.split('.').pop().toLowerCase();
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) return ext;
    return null;
}

function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.display = 'block';
    toast.style.borderColor = type === 'error' ? '#ef4444' : '#10b981';

    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}
