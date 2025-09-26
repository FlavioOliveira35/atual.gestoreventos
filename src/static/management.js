document.addEventListener('DOMContentLoaded', function() {
    // Management Modal
    const btnManage = document.getElementById('btnManage');
    const manageModalOverlay = document.getElementById('manageModalOverlay');
    const manageModalClose = document.getElementById('manageModalClose');

    // --- Tabs ---
    const tabs = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    // --- User Elements ---
    const userModalOverlay = document.getElementById('userModalOverlay');
    const userModalClose = document.getElementById('userModalClose');
    const btnAddUser = document.getElementById('btnAddUser');
    const btnCancelUser = document.getElementById('btnCancelUser');
    const userForm = document.getElementById('userForm');
    const userModalTitle = document.getElementById('userModalTitle');
    const userIdField = document.getElementById('userId');
    const usernameField = document.getElementById('username');
    const userEmailField = document.getElementById('userEmail');
    const userPasswordField = document.getElementById('userPassword');
    const userCityCheckboxes = document.getElementById('userCityCheckboxes');
    const usersTableBody = document.getElementById('usersTableBody');

    // --- City Elements ---
    const addCityForm = document.getElementById('addCityForm');
    const newCityNameField = document.getElementById('newCityName');
    const citiesTableBody = document.getElementById('citiesTableBody');

    // --- ARD Elements ---
    const addArdForm = document.getElementById('addArdForm');
    const newArdNameField = document.getElementById('newArdName');
    const newArdCityIdField = document.getElementById('newArdCityId');
    const ardsTableBody = document.getElementById('ardsTableBody');

    // --- Solicitante Elements ---
    const addSolicitanteForm = document.getElementById('addSolicitanteForm');
    const newSolicitanteNameField = document.getElementById('newSolicitanteName');
    const solicitantesTableBody = document.getElementById('solicitantesTableBody');

    // --- Equipe Elements ---
    const addEquipeForm = document.getElementById('addEquipeForm');
    const newEquipeNameField = document.getElementById('newEquipeName');
    const equipesTableBody = document.getElementById('equipesTableBody');

    // --- Modal Control ---
    btnManage.addEventListener('click', openManageModal);
    manageModalClose.addEventListener('click', () => manageModalOverlay.classList.remove('active'));
    userModalClose.addEventListener('click', () => userModalOverlay.classList.remove('active'));
    btnCancelUser.addEventListener('click', () => userModalOverlay.classList.remove('active'));

    btnAddUser.addEventListener('click', async () => {
        userModalTitle.innerHTML = '<i class="fas fa-user-plus"></i> Adicionar Usuário';
        userForm.reset();
        userIdField.value = '';
        userPasswordField.required = true;
        await populateCityCheckboxes();
        userModalOverlay.classList.add('active');
    });

    function openManageModal() {
        manageModalOverlay.classList.add('active');
        // Carrega o conteúdo da aba ativa
        const activeTab = document.querySelector('.tab-link.active').dataset.tab;
        loadTabData(activeTab);
    }

    // --- Tab Control ---
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(item => item.classList.remove('active'));
            tab.classList.add('active');
            const targetId = tab.dataset.tab;
            const target = document.getElementById(targetId);
            tabContents.forEach(content => content.classList.remove('active'));
            target.classList.add('active');
            loadTabData(targetId);
        });
    });

    function loadTabData(tabId) {
        switch(tabId) {
            case 'usersTab':
                loadUsers();
                break;
            case 'citiesTab':
                loadCities();
                break;
            case 'ardsTab':
                loadArds();
                loadCitiesForArdForm();
                break;
            case 'solicitantesTab':
                loadSolicitantes();
                break;
            case 'equipesTab':
                loadEquipes();
                break;
            case 'notificationsTab':
                loadNotificationSettings();
                break;
        }
    }

    // --- Notification Management ---
    const afetacaoThresholdField = document.getElementById('afetacaoThreshold');
    const btnSaveThreshold = document.getElementById('btnSaveThreshold');
    const notificationCitySelect = document.getElementById('notificationCitySelect');
    const emailManagementSection = document.getElementById('email-management-section');
    const addEmailForm = document.getElementById('addEmailForm');
    const newEmailAddressField = document.getElementById('newEmailAddress');
    const emailRecipientsTableBody = document.getElementById('emailRecipientsTableBody');

    async function loadNotificationSettings() {
        // Load threshold
        try {
            const response = await fetchWithAuth('/api/notification/settings/threshold');
            const data = await response.json();
            afetacaoThresholdField.value = data.threshold;
        } catch (error) {
            console.error('Erro ao carregar limiar de afetação:', error);
        }

        // Load cities for select
        try {
            const response = await fetchWithAuth('/api/cities');
            const cities = await response.json();
            notificationCitySelect.innerHTML = '<option value="">Selecione uma Cidade</option>';
            cities.forEach(city => {
                const option = document.createElement('option');
                option.value = city.id;
                option.textContent = city.name;
                notificationCitySelect.appendChild(option);
            });
        } catch (error) {
            console.error('Erro ao carregar cidades para o select:', error);
        }
    }

    btnSaveThreshold.addEventListener('click', async () => {
        const threshold = afetacaoThresholdField.value;
        try {
            const response = await fetchWithAuth('/api/notification/settings/threshold', {
                method: 'POST',
                body: JSON.stringify({ threshold })
            });
            if (response.ok) {
                showToast('Sucesso', 'Limiar de afetação salvo com sucesso.', 'success');
            } else {
                showToast('Erro', 'Falha ao salvar o limiar.', 'error');
            }
        } catch (error) {
            console.error('Erro ao salvar o limiar:', error);
            showToast('Erro', 'Ocorreu um erro ao salvar.', 'error');
        }
    });

    notificationCitySelect.addEventListener('change', (e) => {
        const cityId = e.target.value;
        if (cityId) {
            emailManagementSection.style.display = 'block';
            loadEmailRecipients(cityId);
        } else {
            emailManagementSection.style.display = 'none';
        }
    });

    async function loadEmailRecipients(cityId) {
        try {
            const response = await fetchWithAuth(`/api/notification/recipients?city_id=${cityId}`);
            const recipients = await response.json();
            emailRecipientsTableBody.innerHTML = '';
            recipients.forEach(r => emailRecipientsTableBody.appendChild(renderRecipientRow(r)));
        } catch (error) {
            console.error('Erro ao carregar e-mails:', error);
        }
    }

    function renderRecipientRow(recipient) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${recipient.email}</td>
            <td class="table-actions">
                <button class="btn btn-danger btn-sm" data-id="${recipient.id}"><i class="fas fa-trash"></i> Deletar</button>
            </td>
        `;
        return row;
    }

    addEmailForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const cityId = notificationCitySelect.value;
        const email = newEmailAddressField.value;
        if (!cityId) return;

        try {
            const response = await fetchWithAuth('/api/notification/recipients', {
                method: 'POST',
                body: JSON.stringify({ email, city_id: cityId })
            });

            if (response.ok) {
                newEmailAddressField.value = '';
                loadEmailRecipients(cityId);
            } else {
                const error = await response.json();
                showToast('Erro', error.error || 'Falha ao adicionar e-mail.', 'error');
            }
        } catch (error) {
            console.error('Erro ao adicionar e-mail:', error);
        }
    });

    emailRecipientsTableBody.addEventListener('click', async (e) => {
        if (e.target.closest('.btn-danger')) {
            const button = e.target.closest('.btn-danger');
            const recipientId = button.dataset.id;
            const cityId = notificationCitySelect.value;

            if (confirm('Tem certeza que deseja remover este e-mail?')) {
                try {
                    const response = await fetchWithAuth(`/api/notification/recipients/${recipientId}`, { method: 'DELETE' });
                    if (response.ok) {
                        loadEmailRecipients(cityId);
                    } else {
                        showToast('Erro', 'Falha ao remover e-mail.', 'error');
                    }
                } catch (error) {
                    console.error('Erro ao remover e-mail:', error);
                }
            }
        }
    });


    // --- Generic CRUD Functions ---
    async function loadItems(endpoint, tableBody, renderFn) {
        try {
            const response = await fetchWithAuth(endpoint);
            const items = await response.json();
            tableBody.innerHTML = '';
            items.forEach(item => tableBody.appendChild(renderFn(item)));
        } catch (error) {
            console.error(`Erro ao carregar itens de ${endpoint}:`, error);
        }
    }

    async function addItem(endpoint, form, nameField, body) {
        try {
            const response = await fetchWithAuth(endpoint, {
                method: 'POST',
                body: JSON.stringify(body)
            });
            if (response.ok) {
                form.reset();
                return true;
            } else {
                const error = await response.json();
                alert(`Falha ao adicionar: ${error.error}`);
                return false;
            }
        } catch (error) {
            console.error(`Erro ao adicionar item em ${endpoint}:`, error);
            alert('Um erro ocorreu.');
            return false;
        }
    }

    async function deleteItem(endpoint, id, itemName) {
        if (confirm(`Tem certeza que deseja deletar este item: ${itemName}?`)) {
            try {
                await fetchWithAuth(`${endpoint}/${id}`, { method: 'DELETE' });
                return true;
            } catch (error) {
                console.error(`Erro ao deletar item em ${endpoint}/${id}:`, error);
                alert('Um erro ocorreu ao deletar.');
                return false;
            }
        }
        return false;
    }

    // --- User Management ---
    const loadUsers = () => loadItems('/api/users', usersTableBody, renderUserRow);
    function renderUserRow(user) {
        const row = document.createElement('tr');
        const cityNames = user.cities.map(c => c.name).join(', ') || 'Nenhuma';
        row.innerHTML = `
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${cityNames}</td>
            <td class="table-actions">
                <button class="btn btn-edit btn-sm" data-id="${user.id}"><i class="fas fa-edit"></i> Editar</button>
                <button class="btn btn-danger btn-sm" data-id="${user.id}"><i class="fas fa-trash"></i> Deletar</button>
            </td>
        `;
        return row;
    }
    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = userIdField.value;
        const url = id ? `/api/users/${id}` : '/api/users';
        const method = id ? 'PUT' : 'POST';
        const selectedCityIds = [...userCityCheckboxes.querySelectorAll('input:checked')].map(cb => cb.value);
        const data = {
            username: usernameField.value,
            email: userEmailField.value,
            city_ids: selectedCityIds
        };
        if (userPasswordField.value) data.password = userPasswordField.value;

        const response = await fetchWithAuth(url, { method, body: JSON.stringify(data) });
        if (response.ok) {
            userModalOverlay.classList.remove('active');
            loadUsers();
        } else {
            alert('Falha ao salvar usuário');
        }
    });
    usersTableBody.addEventListener('click', async (e) => {
        if (e.target.closest('.btn-edit')) {
            const id = e.target.closest('.btn-edit').dataset.id;
            const response = await fetchWithAuth(`/api/users/${id}`);
            const user = await response.json();
            userModalTitle.innerHTML = '<i class="fas fa-user-edit"></i> Editar Usuário';
            userIdField.value = user.id;
            usernameField.value = user.username;
            userEmailField.value = user.email;
            userPasswordField.required = false;
            userPasswordField.value = '';
            await populateCityCheckboxes(user.cities.map(c => c.id));
            userModalOverlay.classList.add('active');
        }
        if (e.target.closest('.btn-danger')) {
            const id = e.target.closest('.btn-danger').dataset.id;
            if (await deleteItem('/api/users', id, 'usuário')) loadUsers();
        }
    });
    async function populateCityCheckboxes(selectedCityIds = []) {
        const response = await fetchWithAuth('/api/cities');
        const cities = await response.json();
        userCityCheckboxes.innerHTML = '';
        if (cities.length === 0) {
            userCityCheckboxes.innerHTML = '<p>Nenhuma cidade cadastrada.</p>';
            return;
        }
        cities.forEach(city => {
            const isChecked = selectedCityIds.includes(city.id);
            const checkboxDiv = document.createElement('div');
            checkboxDiv.className = 'checkbox-group';
            checkboxDiv.innerHTML = `
                <input type="checkbox" id="city_${city.id}" value="${city.id}" ${isChecked ? 'checked' : ''}>
                <label for="city_${city.id}">${city.name}</label>
            `;
            userCityCheckboxes.appendChild(checkboxDiv);
        });
    }

    // --- City Management ---
    const loadCities = () => loadItems('/api/cities', citiesTableBody, renderCityRow);
    function renderCityRow(city) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${city.name}</td>
            <td class="table-actions">
                <button class="btn btn-danger btn-sm" data-id="${city.id}" data-name="${city.name}"><i class="fas fa-trash"></i> Deletar</button>
            </td>
        `;
        return row;
    }
    addCityForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = newCityNameField.value;
        if (await addItem('/api/cities', addCityForm, newCityNameField, { name })) {
            loadCities();
        }
    });
    citiesTableBody.addEventListener('click', async (e) => {
        if (e.target.closest('.btn-danger')) {
            const button = e.target.closest('.btn-danger');
            if (await deleteItem('/api/cities', button.dataset.id, button.dataset.name)) {
                loadCities();
            }
        }
    });

    // --- ARD Management ---
    const loadArds = () => loadItems('/api/ards', ardsTableBody, renderArdRow);
    function renderArdRow(ard) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${ard.name}</td>
            <td>${ard.city_name || 'N/A'}</td>
            <td class="table-actions">
                <button class="btn btn-danger btn-sm" data-id="${ard.id}" data-name="${ard.name}"><i class="fas fa-trash"></i> Deletar</button>
            </td>
        `;
        return row;
    }
    addArdForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = newArdNameField.value;
        const city_id = newArdCityIdField.value;
        if (await addItem('/api/ards', addArdForm, newArdNameField, { name, city_id })) {
            loadArds();
        }
    });
    ardsTableBody.addEventListener('click', async (e) => {
        if (e.target.closest('.btn-danger')) {
            const button = e.target.closest('.btn-danger');
            if (await deleteItem('/api/ards', button.dataset.id, button.dataset.name)) {
                loadArds();
            }
        }
    });
    async function loadCitiesForArdForm() {
        const response = await fetchWithAuth('/api/cities');
        const cities = await response.json();
        newArdCityIdField.innerHTML = '<option value="">Selecione a Cidade</option>';
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city.id;
            option.textContent = city.name;
            newArdCityIdField.appendChild(option);
        });
    }

    // --- Solicitante Management ---
    const loadSolicitantes = () => loadItems('/api/solicitantes', solicitantesTableBody, renderSolicitanteRow);
    function renderSolicitanteRow(solicitante) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${solicitante.name}</td>
            <td class="table-actions">
                <button class="btn btn-danger btn-sm" data-id="${solicitante.id}" data-name="${solicitante.name}"><i class="fas fa-trash"></i> Deletar</button>
            </td>
        `;
        return row;
    }
    addSolicitanteForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = newSolicitanteNameField.value;
        if (await addItem('/api/solicitantes', addSolicitanteForm, newSolicitanteNameField, { name })) {
            loadSolicitantes();
        }
    });
    solicitantesTableBody.addEventListener('click', async (e) => {
        if (e.target.closest('.btn-danger')) {
            const button = e.target.closest('.btn-danger');
            if (await deleteItem('/api/solicitantes', button.dataset.id, button.dataset.name)) {
                loadSolicitantes();
            }
        }
    });

    // --- Equipe Management ---
    const loadEquipes = () => loadItems('/api/equipes', equipesTableBody, renderEquipeRow);
    function renderEquipeRow(equipe) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${equipe.name}</td>
            <td class="table-actions">
                <button class="btn btn-danger btn-sm" data-id="${equipe.id}" data-name="${equipe.name}"><i class="fas fa-trash"></i> Deletar</button>
            </td>
        `;
        return row;
    }
    addEquipeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = newEquipeNameField.value;
        if (await addItem('/api/equipes', addEquipeForm, newEquipeNameField, { name })) {
            loadEquipes();
        }
    });
    equipesTableBody.addEventListener('click', async (e) => {
        if (e.target.closest('.btn-danger')) {
            const button = e.target.closest('.btn-danger');
            if (await deleteItem('/api/equipes', button.dataset.id, button.dataset.name)) {
                loadEquipes();
            }
        }
    });
});
