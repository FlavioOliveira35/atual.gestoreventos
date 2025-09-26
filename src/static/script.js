// Configurações globais
const API_BASE_URL = '/api/eventos';
let currentEventId = null;
let currentCommentingEventId = null;
let currentPage = 1;
const EVENTS_PER_PAGE = 100;
let totalEvents = 0;

// Elementos DOM
let elements = {};

function initializeDOMElements() {
    elements = {
        loading: document.getElementById('loading'),
        emptyState: document.getElementById('emptyState'),
        eventsTable: document.getElementById('eventsTable'),
        eventsTableBody: document.getElementById('eventsTableBody'),
        modalOverlay: document.getElementById('modalOverlay'),
        modalTitle: document.getElementById('modalTitle'),
        eventoForm: document.getElementById('eventoForm'),
        btnNovo: document.getElementById('btnNovo'),
        btnSalvar: document.getElementById('btnSalvar'),
        btnCancelar: document.getElementById('btnCancelar'),
        modalClose: document.getElementById('modalClose'),
        commentModalOverlay: document.getElementById('commentModalOverlay'),
        commentModalTitle: document.getElementById('commentModalTitle'),
        commentModalClose: document.getElementById('commentModalClose'),
        commentHistory: document.getElementById('commentHistory'),
        commentForm: document.getElementById('commentForm'),
        newCommentText: document.getElementById('newCommentText'),
        statusFilterBtn: document.getElementById('statusFilterBtn'),
        statusFilterPopover: document.getElementById('statusFilterPopover'),
        statusCheckboxes: document.getElementById('statusCheckboxes'),
        stateCheckboxes: document.getElementById('stateCheckboxes'), // Adicionado
        statusApplyBtn: document.getElementById('statusApplyBtn'),
        searchFilter: document.getElementById('searchFilter'),
        btnLimparFiltros: document.getElementById('btnLimparFiltros'),
        toastContainer: document.getElementById('toastContainer'),
        citySelect: document.getElementById('city_id'),
        ardSelect: document.getElementById('ard_id'),
        paginationContainer: document.getElementById('pagination-container'),
        btnFiltroAvancado: document.getElementById('btnFiltroAvancado'),
        advancedFilterModalOverlay: document.getElementById('advancedFilterModalOverlay'),
        advancedFilterModalClose: document.getElementById('advancedFilterModalClose'),
        advancedFilterForm: document.getElementById('advancedFilterForm'),
        btnLimparFiltroAvancado: document.getElementById('btnLimparFiltroAvancado'),
        btnAplicarFiltroAvancado: document.getElementById('btnAplicarFiltroAvancado'),
        btnHeaderBaixarExcel: document.getElementById('btnHeaderBaixarExcel'),
        filtersToggle: document.getElementById('filters-toggle'),
        filtersSection: document.querySelector('.filters-section'),
        btnStats: document.getElementById('btnStats'),
        statsModalOverlay: document.getElementById('statsModalOverlay'),
        statsModalClose: document.getElementById('statsModalClose'),
        statsModalBody: document.getElementById('statsModalBody'),
        statsModalCloseBtn: document.getElementById('statsModalCloseBtn'),
    };
}

const STATUS_OPTIONS = ['Aberto', 'Pendente', 'Preventiva', 'Tratando', 'Encerramento', 'Encerrado', 'Cancelado'];

async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('token');
    const headers = { ...options.headers };
    if (options.body && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
        return;
    }
    return response;
}

document.addEventListener('DOMContentLoaded', function() {
    initializeDOMElements();
    initializeApp();
    setupEventListeners();
});

document.addEventListener('loginSuccess', () => {
    loadStoredFilters();
    initializeFilterCollapseState();
    loadEventos();
});

function setupEventListeners() {
    elements.btnNovo.addEventListener('click', () => openModal());
    elements.btnCancelar.addEventListener('click', () => closeModal());
    elements.modalClose.addEventListener('click', () => closeModal());
    elements.eventoForm.addEventListener('submit', handleFormSubmit);
    elements.modalOverlay.addEventListener('click', (e) => {
        if (e.target === elements.modalOverlay) closeModal();
    });

    elements.btnLimparFiltros.addEventListener('click', clearFilters);
    elements.statusFilterBtn.addEventListener('click', () => toggleStatusPopover());
    elements.statusApplyBtn.addEventListener('click', () => {
        applyFilters();
        toggleStatusPopover(false);
    });
    elements.searchFilter.addEventListener('input', debounce(applyFilters, 300));

    // Adiciona event listeners para os checkboxes de estado
    if (elements.stateCheckboxes) {
        elements.stateCheckboxes.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', () => applyFilters());
        });
    }

    document.addEventListener('click', (e) => {
        if (elements.statusFilterPopover && !elements.statusFilterPopover.contains(e.target) && !elements.statusFilterBtn.contains(e.target)) {
            toggleStatusPopover(false);
        }
    });

    elements.btnFiltroAvancado.addEventListener('click', openAdvancedFilterModal);
    elements.advancedFilterModalClose.addEventListener('click', closeAdvancedFilterModal);
    elements.advancedFilterModalOverlay.addEventListener('click', (e) => {
        if (e.target === elements.advancedFilterModalOverlay) closeAdvancedFilterModal();
    });

    // Event Listeners para o Modal de Estatísticas
    elements.btnStats.addEventListener('click', openStatsModal);
    elements.statsModalClose.addEventListener('click', closeStatsModal);
    elements.statsModalCloseBtn.addEventListener('click', closeStatsModal);
    elements.statsModalOverlay.addEventListener('click', (e) => {
        if (e.target === elements.statsModalOverlay) closeStatsModal();
    });

    elements.btnAplicarFiltroAvancado.addEventListener('click', () => {
        applyFilters();
        closeAdvancedFilterModal();
        elements.btnHeaderBaixarExcel.classList.remove('hidden');
    });

    elements.btnLimparFiltroAvancado.addEventListener('click', () => {
        elements.advancedFilterForm.reset();
        applyFilters();
        closeAdvancedFilterModal();
    });
    elements.btnHeaderBaixarExcel.addEventListener('click', handleExportToExcel);

    elements.filtersToggle.addEventListener('click', toggleFilterCollapse);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (elements.modalOverlay.classList.contains('active')) closeModal();
            if (elements.advancedFilterModalOverlay.classList.contains('active')) closeAdvancedFilterModal();
        }
    });

    elements.citySelect.addEventListener('change', (e) => {
        const cityId = e.target.value;
        loadArdsForSelect(cityId);
    });

    document.getElementById('status').addEventListener('change', (e) => {
        const dataEncerramentoInput = document.getElementById('data_encerramento');
        if (e.target.value === 'Encerrado') {
            dataEncerramentoInput.disabled = false;
            dataEncerramentoInput.required = true;
        } else {
            dataEncerramentoInput.disabled = true;
            dataEncerramentoInput.required = false;
            dataEncerramentoInput.value = '';
        }
    });

    elements.commentModalClose.addEventListener('click', () => closeCommentModal());
    elements.commentModalOverlay.addEventListener('click', (e) => {
        if (e.target === elements.commentModalOverlay) closeCommentModal();
    });
    elements.commentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleCommentSubmit();
    });
}

function initializeApp() {
    displayUserInfo();
    updateViewState('loading');
}

function displayUserInfo() {
    const userInfo = document.getElementById('userInfo');
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.username) {
        userInfo.innerHTML = `Usuário: <strong>${user.username}</strong>`;

        // Oculta o botão "Novo Evento" se o usuário for somente leitura
        if (user.is_readonly) {
            elements.btnNovo.style.display = 'none';
        } else {
            elements.btnNovo.style.display = 'inline-block';
        }
    } else {
        userInfo.style.display = 'none';
        elements.btnNovo.style.display = 'none'; // Oculta se não houver usuário
    }
}

function getFilterParams() {
    const params = new URLSearchParams();
    const selectedStatuses = getSelectedStatuses();
    if (selectedStatuses.length > 0) {
        params.append('status', selectedStatuses.join(','));
    }
    const searchFilter = elements.searchFilter.value.trim();
    if (searchFilter) {
        params.append('search', searchFilter);
    }
    const data_inicio = document.getElementById('data_inicio').value;
    const data_fim = document.getElementById('data_fim').value;
    const data_encerramento_inicio = document.getElementById('data_encerramento_inicio').value;
    const data_encerramento_fim = document.getElementById('data_encerramento_fim').value;
    if (data_inicio) params.append('data_inicio', data_inicio);
    if (data_fim) params.append('data_fim', data_fim);
    if (data_encerramento_inicio) params.append('data_encerramento_inicio', data_encerramento_inicio);
    if (data_encerramento_fim) params.append('data_encerramento_fim', data_encerramento_fim);

    const selectedStates = getSelectedStates();
    if (selectedStates.length > 0) {
        params.append('states', selectedStates.join(','));
    }

    params.append('_', new Date().getTime());
    return params;
}

async function loadStats() {
    const statsBody = elements.statsModalBody;
    statsBody.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Carregando...</div>';

    try {
        const params = getFilterParams();
        const url = `/api/eventos/stats?${params.toString()}`;
        const response = await fetchWithAuth(url);

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        const stats = await response.json();

        statsBody.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-card-header">Encerrado (Hoje)</div>
                    <div class="stat-card-value">${stats.encerrado_hoje ?? '0'}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-header">Pendente</div>
                    <div class="stat-card-value">${stats.pendente ?? '0'}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-header">Aberto</div>
                    <div class="stat-card-value">${stats.aberto ?? '0'}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-header">Tratando</div>
                    <div class="stat-card-value">${stats.tratando ?? '0'}</div>
                </div>
                 <div class="stat-card">
                    <div class="stat-card-header">Encerramento</div>
                    <div class="stat-card-value">${stats.encerramento ?? '0'}</div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        statsBody.innerHTML = `<p class="error-message">Não foi possível carregar as estatísticas.</p>`;
    }
}

function openStatsModal() {
    elements.statsModalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    loadStats(); // Carrega as estatísticas ao abrir o modal
}

function closeStatsModal() {
    elements.statsModalOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

async function loadEventos(page = 1) {
    currentPage = page;
    updateViewState('loading');
    try {
        const params = getFilterParams();
        params.append('page', currentPage);
        params.append('per_page', EVENTS_PER_PAGE);
        const url = `${API_BASE_URL}?${params.toString()}`;
        const response = await fetchWithAuth(url);
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        const data = await response.json();
        totalEvents = data.total;

        if (data.eventos.length > 0) {
            renderEventos(data.eventos);
            updateViewState('data');
        } else {
            updateViewState('empty');
        }
        renderPagination(data);
        saveFiltersToStorage();
    } catch (error) {
        updateViewState('empty');
        showToast('Erro ao carregar eventos', error.message, 'error');
    }
}

function applyFilters() {
    loadEventos(1);
    loadStats(); // Adicionado para atualizar as estatísticas
}

function renderEventos(eventos) {
    const tbody = elements.eventsTableBody;
    tbody.innerHTML = '';
    eventos.forEach(evento => tbody.appendChild(createEventRow(evento)));
    tbody.classList.add('fade-in');
}

function renderPagination({ total, pages, current_page }) {
    const paginationContainer = elements.paginationContainer;
    paginationContainer.innerHTML = '';
    if (pages <= 1) return;

    const prevButton = document.createElement('button');
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevButton.className = 'pagination-btn';
    prevButton.disabled = current_page === 1;
    prevButton.onclick = () => loadEventos(current_page - 1);
    paginationContainer.appendChild(prevButton);

    let startPage, endPage;
    if (pages <= 5) {
        startPage = 1;
        endPage = pages;
    } else {
        if (current_page <= 3) {
            startPage = 1;
            endPage = 5;
        } else if (current_page + 2 >= pages) {
            startPage = pages - 4;
            endPage = pages;
        } else {
            startPage = current_page - 2;
            endPage = current_page + 2;
        }
    }

    if (startPage > 1) {
        const firstButton = document.createElement('button');
        firstButton.textContent = '1';
        firstButton.className = 'pagination-btn';
        firstButton.onclick = () => loadEventos(1);
        paginationContainer.appendChild(firstButton);
        if (startPage > 2) {
            const dots = document.createElement('span');
            dots.textContent = '...';
            dots.className = 'pagination-info';
            paginationContainer.appendChild(dots);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.className = `pagination-btn ${i === current_page ? 'active' : ''}`;
        pageButton.onclick = () => loadEventos(i);
        paginationContainer.appendChild(pageButton);
    }

    if (endPage < pages) {
        if (endPage < pages - 1) {
            const dots = document.createElement('span');
            dots.textContent = '...';
            dots.className = 'pagination-info';
            paginationContainer.appendChild(dots);
        }
        const lastButton = document.createElement('button');
        lastButton.textContent = pages;
        lastButton.className = 'pagination-btn';
        lastButton.onclick = () => loadEventos(pages);
        paginationContainer.appendChild(lastButton);
    }

    const nextButton = document.createElement('button');
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextButton.className = 'pagination-btn';
    nextButton.disabled = current_page === pages;
    nextButton.onclick = () => loadEventos(current_page + 1);
    paginationContainer.appendChild(nextButton);
}


function createEventRow(evento) {
    const row = document.createElement('tr');
    const user = JSON.parse(localStorage.getItem('user'));
    const isReadOnly = user ? user.is_readonly : false;

    let actionButtons = '';
    if (isReadOnly) {
        actionButtons = `
            <button class="btn ${evento.has_comments ? 'btn-comment' : 'btn-comment-inactive'}" onclick="openCommentModal(${evento.id}, event)" title="Comentários"><i class="fas fa-comments"></i></button>
        `;
    } else {
        actionButtons = `
            <button class="btn btn-edit" onclick="editEvento(${evento.id}, event)" title="Editar"><i class="fas fa-edit"></i></button>
            <button class="btn btn-danger" onclick="deleteEvento(${evento.id}, '${evento.oc}', event)" title="Excluir"><i class="fas fa-trash"></i></button>
            <button class="btn ${evento.has_comments ? 'btn-comment' : 'btn-comment-inactive'}" onclick="openCommentModal(${evento.id}, event)" title="Comentários"><i class="fas fa-comments"></i></button>
            <button class="btn btn-send-email" onclick="sendManualEmail(${evento.id}, event)" title="Enviar E-mail"><i class="fas fa-paper-plane"></i></button>
        `;
    }

    row.innerHTML = `
        <td title="${evento.data}">${formatDateTime(evento.data)}</td>
        <td title="${evento.oc}"><strong>${evento.oc}</strong></td>
        <td title="${evento.status}">${createStatusBadge(evento.status)}</td>
        <td title="${evento.city_name || ''}">${evento.city_name || '-'}</td>
        <td title="${evento.ard_name || ''}">${evento.ard_name || '-'}</td>
        <td title="${evento.sp || ''}">${evento.sp || '-'}</td>
        <td title="${evento.caixa || ''}">${evento.caixa || '-'}</td>
        <td title="${evento.pon || ''}">${evento.pon || '-'}</td>
        <td title="${evento.solicitante_name || ''}">${evento.solicitante_name || '-'}</td>
        <td title="${evento.ta || ''}">${evento.ta || '-'}</td>
        <td title="${evento.afetacao || ''}">${evento.afetacao || '-'}</td>
        <td title="${evento.equipe_name || ''}">${evento.equipe_name || '-'}</td>
        <td title="${evento.rede || ''}">${evento.rede || '-'}</td>
        <td><div class="table-actions">${actionButtons}</div></td>
    `;
    return row;
}

function createStatusBadge(status) {
    const statusClass = `status-${status.toLowerCase().replace('ã', 'a')}`;
    const icons = {
        'Aberto': 'fas fa-folder-open', 'Pendente': 'fas fa-clock', 'Preventiva': 'fas fa-shield-alt',
        'Tratando': 'fas fa-cog', 'Encerramento': 'fas fa-flag', 'Encerrado': 'fas fa-check-circle',
        'Cancelado': 'fas fa-times-circle'
    };
    return `<span class="status-badge ${statusClass}"><i class="${icons[status] || 'fas fa-info-circle'}"></i> ${status}</span>`;
}

async function openModal(evento = null) {
    currentEventId = evento ? evento.id : null;
    
    const cityPromise = loadCitiesForSelect(evento ? evento.city_id : null);
    const solicitantePromise = loadSolicitantesForSelect(evento ? evento.solicitante_id : null);
    const equipePromise = loadEquipesForSelect(evento ? evento.equipe_id : null);

    await cityPromise;
    const ardPromise = loadArdsForSelect(evento ? evento.city_id : null, evento ? evento.ard_id : null);

    await Promise.all([solicitantePromise, equipePromise, ardPromise]);

    if (evento) {
        elements.modalTitle.innerHTML = '<i class="fas fa-edit"></i> Editar Evento';
        elements.btnSalvar.innerHTML = '<i class="fas fa-save"></i> Atualizar';
        fillForm(evento);
    } else {
        elements.modalTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Novo Evento';
        elements.btnSalvar.innerHTML = '<i class="fas fa-save"></i> Salvar';
        elements.eventoForm.reset();
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        document.getElementById('data').value = now.toISOString().slice(0, 16);
    }
    
    elements.modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('data').focus(), 300);
}

function closeModal() {
    elements.modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
    currentEventId = null;
    elements.eventoForm.reset();
}

function openAdvancedFilterModal() {
    elements.advancedFilterModalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAdvancedFilterModal() {
    elements.advancedFilterModalOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

function fillForm(evento) {
    const dataInput = document.getElementById('data');
    if (evento.data) {
        const date = new Date(evento.data);
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        dataInput.value = date.toISOString().slice(0, 16);
    }
    document.getElementById('oc').value = evento.oc;
    document.getElementById('status').value = evento.status;
    document.getElementById('city_id').value = evento.city_id || '';
    document.getElementById('solicitante_id').value = evento.solicitante_id || '';
    document.getElementById('equipe_id').value = evento.equipe_id || '';
    document.getElementById('ard_id').value = evento.ard_id || '';
    document.getElementById('sp').value = evento.sp || '';
    document.getElementById('caixa').value = evento.caixa || '';
    document.getElementById('ta').value = evento.ta || '';
    document.getElementById('afetacao').value = evento.afetacao || '';
    document.getElementById('rede').value = evento.rede || '';
    document.getElementById('pon').value = evento.pon || '';
    document.getElementById('ospregional').value = evento.ospregional || '';

    const dataEncerramentoInput = document.getElementById('data_encerramento');
    if (evento.data_encerramento) {
        const date = new Date(evento.data_encerramento);
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        dataEncerramentoInput.value = date.toISOString().slice(0, 16);
        dataEncerramentoInput.disabled = false;
        dataEncerramentoInput.required = true;
    } else {
        dataEncerramentoInput.value = '';
        dataEncerramentoInput.disabled = true;
        dataEncerramentoInput.required = false;
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const formData = new FormData(elements.eventoForm);
    const eventoData = Object.fromEntries(formData.entries());

    ['city_id', 'ard_id', 'solicitante_id', 'equipe_id'].forEach(key => {
        if (eventoData[key]) eventoData[key] = parseInt(eventoData[key], 10);
        else delete eventoData[key];
    });
    
    if (!eventoData.data || !eventoData.oc || !eventoData.solicitante_id) {
        showToast('Erro de validação', 'Preencha todos os campos obrigatórios (*)', 'error');
        return;
    }
    
    try {
        elements.btnSalvar.disabled = true;
        elements.btnSalvar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        const url = currentEventId ? `${API_BASE_URL}/${currentEventId}` : API_BASE_URL;
        const method = currentEventId ? 'PUT' : 'POST';

        const response = await fetchWithAuth(url, {
            method: method,
            body: JSON.stringify(eventoData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
        }

        showToast('Sucesso', `Evento ${currentEventId ? 'atualizado' : 'criado'} com sucesso!`, 'success');

        closeModal();
        loadEventos(currentEventId ? currentPage : 1);

    } catch (error) {
        console.error('Erro ao salvar evento:', error);
        showToast('Erro ao salvar', error.message, 'error');
    } finally {
        elements.btnSalvar.disabled = false;
        elements.btnSalvar.innerHTML = currentEventId ? '<i class="fas fa-save"></i> Atualizar' : '<i class="fas fa-save"></i> Salvar';
    }
}

async function editEvento(id, event) {
    event.stopPropagation();
    updateViewState('loading');
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/${id}`);
        if (!response.ok) throw new Error('Evento não encontrado para edição.');
        const evento = await response.json();
        openModal(evento);
    } catch (error) {
        showToast('Erro', error.message, 'error');
    } finally {
        updateViewState('data'); // Assume we go back to the data view
    }
}

async function deleteEvento(id, oc, event) {
    event.stopPropagation();
    if (!confirm(`Tem certeza que deseja excluir o evento "${oc}"?`)) return;
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
        }
        showToast('Sucesso', 'Evento excluído com sucesso!', 'success');

        const newTotal = totalEvents - 1;
        const totalPages = Math.ceil(newTotal / EVENTS_PER_PAGE);
        if (currentPage > totalPages) {
            currentPage = totalPages > 0 ? totalPages : 1;
        }
        loadEventos(currentPage);

    } catch (error) {
        console.error('Erro ao deletar evento:', error);
        showToast('Erro ao excluir', error.message, 'error');
    }
}

async function handleExportToExcel() {
    const button = elements.btnHeaderBaixarExcel;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';

    try {
        const params = getFilterParams();
        const response = await fetchWithAuth(`/api/eventos/export?${params.toString()}`);

        if (!response.ok) {
            throw new Error('Falha ao gerar o arquivo Excel.');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'eventos_export.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();

        showToast('Sucesso', 'O download do arquivo Excel foi iniciado.', 'success');

    } catch (error) {
        console.error('Erro ao exportar para Excel:', error);
        showToast('Erro', error.message, 'error');
    } finally {
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-file-excel"></i> Exportar';
    }
}

// --- Funções de Filtro ---

function initializeFilterCollapseState() {
    const isCollapsed = localStorage.getItem('filtersCollapsed') === 'true';
    if (isCollapsed) {
        elements.filtersSection.classList.add('collapsed');
    }
}

function toggleFilterCollapse() {
    const isCollapsed = elements.filtersSection.classList.toggle('collapsed');
    localStorage.setItem('filtersCollapsed', isCollapsed);
}

function clearFilters() {
    elements.searchFilter.value = '';
    const statusCheckboxes = elements.statusCheckboxes.querySelectorAll('input[type="checkbox"]');
    statusCheckboxes.forEach(cb => cb.checked = true);

    if (elements.stateCheckboxes) {
        const stateCheckboxes = elements.stateCheckboxes.querySelectorAll('input[type="checkbox"]');
        stateCheckboxes.forEach(cb => cb.checked = false); // Desmarcar os estados
    }

    elements.advancedFilterForm.reset();
    elements.btnHeaderBaixarExcel.classList.add('hidden');
    applyFilters();
    updateStatusFilterButtonText();
}

function saveFiltersToStorage() {
    const filters = {
        status: getSelectedStatuses(),
        search: elements.searchFilter.value.trim(),
        data_inicio: document.getElementById('data_inicio').value,
        data_fim: document.getElementById('data_fim').value,
        data_encerramento_inicio: document.getElementById('data_encerramento_inicio').value,
        data_encerramento_fim: document.getElementById('data_encerramento_fim').value,
    };
    localStorage.setItem('filter_preferences', JSON.stringify(filters));
}

function loadStoredFilters() {
    const filters = JSON.parse(localStorage.getItem('filter_preferences')) || {};

    elements.statusCheckboxes.innerHTML = STATUS_OPTIONS.map(status => `
        <div class="checkbox-group">
            <input type="checkbox" id="status_${status}" value="${status}" ${(filters.status && !filters.status.includes(status)) ? '' : 'checked'}>
            <label for="status_${status}">${status}</label>
        </div>
    `).join('');

    if (filters.search) {
        elements.searchFilter.value = filters.search;
    }
    if (filters.data_inicio) document.getElementById('data_inicio').value = filters.data_inicio;
    if (filters.data_fim) document.getElementById('data_fim').value = filters.data_fim;
    if (filters.data_encerramento_inicio) document.getElementById('data_encerramento_inicio').value = filters.data_encerramento_inicio;
    if (filters.data_encerramento_fim) document.getElementById('data_encerramento_fim').value = filters.data_encerramento_fim;

    updateStatusFilterButtonText();
}

function toggleStatusPopover(forceState) {
    elements.statusFilterPopover.classList.toggle('active', forceState);
}

function getSelectedStatuses() {
    const checkboxes = elements.statusCheckboxes.querySelectorAll('input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

function getSelectedStates() {
    if (!elements.stateCheckboxes) return [];
    const checkboxes = elements.stateCheckboxes.querySelectorAll('input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

function updateStatusFilterButtonText() {
    const selectedCount = getSelectedStatuses().length;
    const btnText = elements.statusFilterBtn.querySelector('span');
    if (selectedCount === 0) btnText.textContent = 'Nenhum status';
    else if (selectedCount === STATUS_OPTIONS.length) btnText.textContent = 'Todos os status';
    else btnText.textContent = `${selectedCount} status selecionado(s)`;
}

// --- Funções Auxiliares de UI ---
function updateViewState(state) {
    if (state === 'loading') {
        elements.loading.style.display = 'flex';
        elements.eventsTable.style.display = 'none';
        elements.emptyState.style.display = 'none';
        elements.paginationContainer.style.display = 'none';
    } else if (state === 'empty') {
        elements.loading.style.display = 'none';
        elements.eventsTable.style.display = 'none';
        elements.emptyState.style.display = 'flex';
        elements.paginationContainer.style.display = 'none';
    } else if (state === 'data') {
        elements.loading.style.display = 'none';
        elements.eventsTable.style.display = 'table';
        elements.emptyState.style.display = 'none';
        elements.paginationContainer.style.display = 'flex';
    }
}

function showToast(title, message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><div class="toast-content"><div class="toast-title">${title}</div><div class="toast-message">${message}</div></div>`;
    elements.toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// --- Funções de Carregamento para Selects ---
async function populateSelect(selectElement, endpoint, placeholder, selectedId = null) {
    try {
        const response = await fetchWithAuth(endpoint);
        if (!response.ok) throw new Error(`Não foi possível carregar dados de ${endpoint}`);
        const items = await response.json();
        selectElement.innerHTML = `<option value="">${placeholder}</option>`;
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item.name;
            selectElement.appendChild(option);
        });
        if (selectedId) {
            selectElement.value = selectedId;
        }
    } catch (error) {
        console.error(error);
        showToast('Erro', error.message, 'error');
    }
}

const loadCitiesForSelect = (selectedId) => populateSelect(document.getElementById('city_id'), '/api/cities', 'Selecione uma cidade', selectedId);
const loadSolicitantesForSelect = (selectedId) => populateSelect(document.getElementById('solicitante_id'), '/api/solicitantes', 'Selecione um solicitante', selectedId);
const loadEquipesForSelect = (selectedId) => populateSelect(document.getElementById('equipe_id'), '/api/equipes', 'Selecione uma equipe', selectedId);
const loadArdsForSelect = (cityId, selectedId) => {
    const ardSelect = document.getElementById('ard_id');
    if (!cityId) {
        ardSelect.innerHTML = '<option value="">Selecione uma cidade primeiro</option>';
        return;
    }
    populateSelect(ardSelect, `/api/ards?city_id=${cityId}`, 'Selecione um ARD', selectedId);
};

// --- Funções Auxiliares Gerais ---
function formatDateTime(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (error) {
        return dateString;
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => { clearTimeout(timeout); func(...args); };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

window.editEvento = editEvento;
window.deleteEvento = deleteEvento;
window.openCommentModal = openCommentModal;
window.sendManualEmail = sendManualEmail;

async function sendManualEmail(eventoId, event) {
    event.stopPropagation();
    if (!confirm('Tem certeza que deseja enviar um e-mail de alerta para este evento?')) return;

    try {
        const response = await fetchWithAuth(`/api/eventos/${eventoId}/send_email`, { method: 'POST' });
        if (response.ok) {
            showToast('Sucesso', 'E-mail de alerta enviado com sucesso!', 'success');
        } else {
            const error = await response.json();
            showToast('Erro', error.error || 'Falha ao enviar e-mail.', 'error');
        }
    } catch (error) {
        console.error('Erro ao enviar e-mail manual:', error);
        showToast('Erro', 'Ocorreu um erro ao enviar o e-mail.', 'error');
    }
}

// --- Funções de Comentário ---
async function openCommentModal(eventoId, event) {
    event.stopPropagation();
    currentCommentingEventId = eventoId;

    try {
        const eventoResponse = await fetchWithAuth(`${API_BASE_URL}/${eventoId}`);
        if (!eventoResponse.ok) throw new Error('Evento não encontrado');
        const evento = await eventoResponse.json();
        elements.commentModalTitle.innerHTML = `<i class="fas fa-comments"></i> Comentários do Evento: <strong>${evento.oc}</strong>`;
    } catch (error) {
        elements.commentModalTitle.innerHTML = `<i class="fas fa-comments"></i> Comentários`;
        showToast('Erro', 'Não foi possível carregar o nome do evento.', 'error');
    }

    elements.commentHistory.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Carregando...</div>';
    elements.commentModalOverlay.classList.add('active');

    try {
        const response = await fetchWithAuth(`/api/eventos/${eventoId}/comentarios`);
        if (!response.ok) throw new Error('Não foi possível carregar os comentários.');
        const comentarios = await response.json();
        renderComments(comentarios);
    } catch (error) {
        elements.commentHistory.innerHTML = `<p class="error-message">${error.message}</p>`;
        showToast('Erro', error.message, 'error');
    }
}

function closeCommentModal() {
    elements.commentModalOverlay.classList.remove('active');
    elements.commentForm.reset();
    currentCommentingEventId = null;
}

function renderComments(comentarios) {
    if (comentarios.length === 0) {
        elements.commentHistory.innerHTML = '<p class="empty-comment">Nenhum comentário ainda.</p>';
        return;
    }
    elements.commentHistory.innerHTML = comentarios.map(c => `
        <div class="comment-item">
            <div class="comment-header">
                <span class="comment-user"><i class="fas fa-user"></i> ${c.user_name}</span>
                <span class="comment-date"><i class="fas fa-clock"></i> ${formatDateTime(c.created_at)}</span>
            </div>
            <div class="comment-body">
                ${c.text.replace(/\n/g, '<br>')}
            </div>
        </div>
    `).join('');
}

async function handleCommentSubmit() {
    const text = elements.newCommentText.value.trim();
    if (!text || !currentCommentingEventId) return;

    const submitButton = elements.commentForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

    try {
        const response = await fetchWithAuth(`/api/eventos/${currentCommentingEventId}/comentarios`, {
            method: 'POST',
            body: JSON.stringify({ text })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Não foi possível salvar o comentário.');
        }
        const novoComentario = await response.json();

        const noCommentsMessage = elements.commentHistory.querySelector('.empty-comment');
        if (noCommentsMessage) {
            elements.commentHistory.innerHTML = '';
        }
        const commentItemHTML = `
            <div class="comment-item">
                <div class="comment-header">
                    <span class="comment-user"><i class="fas fa-user"></i> ${novoComentario.user_name}</span>
                    <span class="comment-date"><i class="fas fa-clock"></i> ${formatDateTime(novoComentario.created_at)}</span>
                </div>
                <div class="comment-body">
                    ${novoComentario.text.replace(/\n/g, '<br>')}
                </div>
            </div>
        `;
        elements.commentHistory.insertAdjacentHTML('afterbegin', commentItemHTML);

        elements.commentForm.reset();
        showToast('Sucesso', 'Comentário adicionado!', 'success');
    } catch (error) {
        showToast('Erro', error.message, 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar';
    }
}
