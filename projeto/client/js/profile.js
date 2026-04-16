// Profile page management

let profileState = {
    user: null,
    specialties: [],
    selectedSpecialties: [],
    photoChanged: false,
    newPhotoData: null,
    listenersInitialized: false
};

// Initialize profile page
document.addEventListener('DOMContentLoaded', async function() {
    debugLog('Inicializando página de perfil...');
    
    // Verificar autenticação
    if (!UserManager.isLoggedIn()) {
        showToast('Você precisa estar logado para acessar esta página', APP_CONFIG.TOAST_TYPES.WARNING);
        window.location.href = '../index.html';
        return;
    }

    // Inicializa listeners de UI antes das chamadas assíncronas.
    // Assim o modal de senha continua funcional mesmo se o carregamento do perfil falhar.
    setupProfileEventListeners();
    
    try {
        // Carregar dados do perfil
        await loadProfileData();
        
        // Carregar especialidades
        await loadSpecialties();
        
        // Mostrar conteúdo
        DOMUtils.hide('loadingProfile');
        DOMUtils.show('profileContent');
        
        debugLog('Página de perfil inicializada com sucesso');
    } catch (error) {
        errorLog('Erro ao inicializar página de perfil:', error);
        showToast(
            'Erro ao carregar perfil. Tente recarregar a página.',
            APP_CONFIG.TOAST_TYPES.ERROR
        );
    }
});

// Carregar dados do perfil
async function loadProfileData() {
    try {
        const response = await ApiClient.get(APP_CONFIG.ENDPOINTS.USER_PROFILE);
        
        if (response.success) {
            profileState.user = response.data;
            populateProfileForm();
            debugLog('Dados do perfil carregados:', profileState.user);
        } else {
            throw new Error(response.message || 'Erro ao carregar perfil');
        }
    } catch (error) {
        errorLog('Erro ao carregar perfil:', error);
        throw error;
    }
}

// Preencher formulário com dados do perfil
function populateProfileForm() {
    const user = profileState.user;
    
    // Atualizar header
    const headerUserName = document.getElementById('headerUserName');
    const headerAvatar = document.getElementById('headerAvatar');
    
    if (headerUserName) {
        headerUserName.textContent = user.display_name || user.name;
    }
    
    if (headerAvatar) {
        headerAvatar.src = user.profile_image || '../assets/images/default-avatar.svg';
    }
    
    // Preencher informações pessoais
    document.getElementById('fullName').value = user.name || '';
    document.getElementById('displayName').value = user.display_name || user.name || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('phone').value = user.phone || '';
    document.getElementById('birthDate').value = user.birth_date || '';
    
    // Foto de perfil
    const profilePhoto = document.getElementById('profilePhoto');
    if (profilePhoto) {
        profilePhoto.src = user.profile_image || '../assets/images/default-avatar.svg';
    }
    
    // Se for professor, mostrar e preencher seção profissional
    if (user.user_type === APP_CONFIG.USER_TYPES.TEACHER) {
        const professionalSection = document.getElementById('professionalSection');
        if (professionalSection) {
            professionalSection.style.display = 'block';
        }
        
        // Preencher dados profissionais
        if (user.teacherInfo) {
            const info = user.teacherInfo;
            document.getElementById('professionalTitle').value = info.professional_title || '';
            document.getElementById('subject').value = info.subject || '';
            document.getElementById('bio').value = user.bio || '';
            document.getElementById('education').value = info.education || '';
            document.getElementById('experienceYears').value = info.experience_years || '';
            document.getElementById('hourlyRate').value = info.hourly_rate || '';
            document.getElementById('location').value = info.location || '';
            document.getElementById('availability').value = info.availability || '';
            
            // Atualizar contador de caracteres da bio
            updateCharCounter();
        }
        
        // Links externos
        document.getElementById('linkedinUrl').value = user.linkedin_url || '';
        document.getElementById('githubUrl').value = user.github_url || '';
        document.getElementById('portfolioUrl').value = user.portfolio_url || '';
        document.getElementById('otherLinks').value = user.other_links || '';
    }
}

// Carregar especialidades disponíveis
async function loadSpecialties() {
    try {
        const response = await ApiClient.get('/specialties/list');
        
        if (response.success) {
            profileState.specialties = response.data;
            renderSpecialties();
            
            // Carregar especialidades selecionadas do professor
            if (profileState.user.user_type === APP_CONFIG.USER_TYPES.TEACHER) {
                await loadTeacherSpecialties();
            }
        }
    } catch (error) {
        errorLog('Erro ao carregar especialidades:', error);
        // Usar especialidades padrão
        profileState.specialties = [
            { id: 1, name: 'Exatas', slug: 'exatas', icon: 'fas fa-calculator' },
            { id: 2, name: 'Humanas', slug: 'humanas', icon: 'fas fa-book' },
            { id: 3, name: 'Linguagens', slug: 'linguagens', icon: 'fas fa-language' },
            { id: 4, name: 'Tecnologia', slug: 'tecnologia', icon: 'fas fa-laptop-code' }
        ];
        renderSpecialties();
    }
}

// Carregar especialidades do professor
async function loadTeacherSpecialties() {
    try {
        const response = await ApiClient.get('/teachers/specialties/mine');
        
        if (response.success) {
            profileState.selectedSpecialties = response.data.map(s => s.id);
            updateSpecialtiesUI();
        }
    } catch (error) {
        debugLog('Especialidades não carregadas:', error);
    }
}

// Renderizar especialidades
function renderSpecialties() {
    const grid = document.getElementById('specialtiesGrid');
    if (!grid) return;
    
    grid.innerHTML = profileState.specialties.map(specialty => `
        <div class="specialty-item">
            <input type="checkbox" 
                   id="specialty-${specialty.id}" 
                   value="${specialty.id}"
                   onchange="toggleSpecialty(${specialty.id})">
            <label for="specialty-${specialty.id}" class="specialty-label">
                <i class="${specialty.icon} specialty-icon"></i>
                <span class="specialty-name">${specialty.name}</span>
            </label>
        </div>
    `).join('');
}

// Atualizar UI das especialidades
function updateSpecialtiesUI() {
    profileState.selectedSpecialties.forEach(id => {
        const checkbox = document.getElementById(`specialty-${id}`);
        if (checkbox) {
            checkbox.checked = true;
        }
    });
}

// Alternar especialidade
function toggleSpecialty(specialtyId) {
    const index = profileState.selectedSpecialties.indexOf(specialtyId);
    
    if (index > -1) {
        profileState.selectedSpecialties.splice(index, 1);
    } else {
        profileState.selectedSpecialties.push(specialtyId);
    }
    
    debugLog('Especialidades selecionadas:', profileState.selectedSpecialties);
}

// Configurar event listeners
function setupProfileEventListeners() {
    if (profileState.listenersInitialized) {
        return;
    }
    profileState.listenersInitialized = true;

    // Form de informações pessoais
    const personalForm = document.getElementById('personalInfoForm');
    if (personalForm) {
        personalForm.addEventListener('submit', handlePersonalInfoSubmit);
    }
    
    // Form de informações profissionais
    const professionalForm = document.getElementById('professionalInfoForm');
    if (professionalForm) {
        professionalForm.addEventListener('submit', handleProfessionalInfoSubmit);
    }
    
    // Contador de caracteres da bio
    const bioField = document.getElementById('bio');
    if (bioField) {
        bioField.addEventListener('input', updateCharCounter);
    }
    
    // Formatação de telefone
    const phoneField = document.getElementById('phone');
    if (phoneField) {
        phoneField.addEventListener('input', formatPhoneNumber);
    }

    // Fluxo de troca de senha
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', showChangePasswordModal);
    }

    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', handleChangePassword);
    }

    const closeChangePasswordBtn = document.getElementById('closeChangePasswordBtn');
    if (closeChangePasswordBtn) {
        closeChangePasswordBtn.addEventListener('click', closeChangePasswordModal);
    }

    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeChangePasswordModal);
    }

    // Fechar modal de senha com tecla Esc
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeChangePasswordModal();
        }
    });
}

// Atualizar contador de caracteres
function updateCharCounter() {
    const bioField = document.getElementById('bio');
    const charCount = document.getElementById('bioCharCount');
    
    if (bioField && charCount) {
        charCount.textContent = bioField.value.length;
        
        if (bioField.value.length > 950) {
            charCount.style.color = 'var(--warning-color)';
        } else if (bioField.value.length === 1000) {
            charCount.style.color = 'var(--danger-color)';
        } else {
            charCount.style.color = 'var(--gray-600)';
        }
    }
}

// Formatar número de telefone
function formatPhoneNumber(event) {
    let value = event.target.value.replace(/\D/g, '');
    
    if (value.length <= 11) {
        if (value.length <= 2) {
            event.target.value = value;
        } else if (value.length <= 7) {
            event.target.value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
        } else {
            event.target.value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`;
        }
    } else {
        event.target.value = event.target.value.slice(0, 15);
    }
}

// Handle personal info submit
async function handlePersonalInfoSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        // Validações
        const fullName = document.getElementById('fullName').value.trim();
        const displayName = document.getElementById('displayName').value.trim();
        
        if (!fullName || !displayName) {
            showToast('Nome completo e nome de exibição são obrigatórios', APP_CONFIG.TOAST_TYPES.ERROR);
            return;
        }
        
        // Desabilitar botão
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        
        // Preparar dados
        const data = {
            name: fullName,
            displayName: displayName,
            phone: document.getElementById('phone').value,
            birthDate: document.getElementById('birthDate').value
        };
        
        // Se houver foto nova, incluir
        if (profileState.photoChanged && profileState.newPhotoData) {
            data.profileImage = profileState.newPhotoData;
        }
        
        // Enviar requisição
        const response = await ApiClient.put(APP_CONFIG.ENDPOINTS.USER_PROFILE, data);
        
        if (response.success) {
            // Atualizar estado local
            profileState.user = { ...profileState.user, ...data };
            const currentUser = UserManager.get() || {};
            UserManager.set({
                ...currentUser,
                name: displayName,
                profileImage: data.profileImage || currentUser.profileImage || currentUser.profile_image || null,
                profile_image: data.profileImage || currentUser.profile_image || currentUser.profileImage || null
            });
            
            // Resetar estado da foto
            profileState.photoChanged = false;
            profileState.newPhotoData = null;
            
            showToast(
                'Informações pessoais atualizadas com sucesso!',
                APP_CONFIG.TOAST_TYPES.SUCCESS,
                'Perfil Atualizado'
            );
        } else {
            throw new Error(response.message || 'Erro ao atualizar perfil');
        }
        
    } catch (error) {
        errorLog('Erro ao atualizar informações pessoais:', error);
        showToast(
            error.message || 'Erro ao salvar informações. Tente novamente.',
            APP_CONFIG.TOAST_TYPES.ERROR
        );
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// Handle professional info submit
async function handleProfessionalInfoSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        // Validações
        const professionalTitle = document.getElementById('professionalTitle').value.trim();
        const subject = document.getElementById('subject').value.trim();
        const hourlyRate = parseFloat(document.getElementById('hourlyRate').value);
        
        if (!professionalTitle || !subject) {
            showToast('Título profissional e matéria são obrigatórios', APP_CONFIG.TOAST_TYPES.ERROR);
            return;
        }
        
        if (!hourlyRate || hourlyRate <= 0) {
            showToast('Valor por hora deve ser maior que zero', APP_CONFIG.TOAST_TYPES.ERROR);
            return;
        }
        
        // Desabilitar botão
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        
        // Preparar dados
        const data = {
            name: document.getElementById('fullName')?.value?.trim() || profileState.user?.name,
            displayName: document.getElementById('displayName')?.value?.trim() || profileState.user?.display_name || profileState.user?.name,
            phone: document.getElementById('phone')?.value || profileState.user?.phone || null,
            birthDate: document.getElementById('birthDate')?.value || profileState.user?.birth_date || null,
            bio: document.getElementById('bio').value,
            linkedinUrl: document.getElementById('linkedinUrl').value,
            githubUrl: document.getElementById('githubUrl').value,
            portfolioUrl: document.getElementById('portfolioUrl').value,
            otherLinks: document.getElementById('otherLinks').value,
            teacherInfo: {
                professionalTitle: professionalTitle,
                subject: subject,
                description: document.getElementById('bio').value,
                education: document.getElementById('education').value,
                experienceYears: parseInt(document.getElementById('experienceYears').value) || 0,
                hourlyRate: hourlyRate,
                location: document.getElementById('location').value,
                availability: document.getElementById('availability').value
            },
            specialties: profileState.selectedSpecialties
        };
        
        // Enviar requisição
        const response = await ApiClient.put(APP_CONFIG.ENDPOINTS.USER_PROFILE, data);
        
        if (response.success) {
            showToast(
                'Informações profissionais atualizadas com sucesso!',
                APP_CONFIG.TOAST_TYPES.SUCCESS,
                'Perfil Atualizado'
            );
        } else {
            throw new Error(response.message || 'Erro ao atualizar perfil');
        }
        
    } catch (error) {
        errorLog('Erro ao atualizar informações profissionais:', error);
        showToast(
            error.message || 'Erro ao salvar informações. Tente novamente.',
            APP_CONFIG.TOAST_TYPES.ERROR
        );
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// Trigger photo upload
function triggerPhotoUpload() {
    const photoInput = document.getElementById('photoInput');
    if (photoInput) {
        photoInput.click();
    }
}

// Upload constraints and optimization defaults
const PHOTO_MAX_INPUT_SIZE = 8 * 1024 * 1024; // 8MB
const PHOTO_MAX_OUTPUT_SIZE = 2 * 1024 * 1024; // 2MB
const PHOTO_PRIMARY_MAX_DIMENSION = 1024;
const PHOTO_PRIMARY_QUALITY = 0.82;
const PHOTO_FALLBACK_MAX_DIMENSION = 800;
const PHOTO_FALLBACK_QUALITY = 0.72;

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Não foi possível ler o arquivo da imagem'));
        reader.readAsDataURL(file);
    });
}

function loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Não foi possível processar a imagem selecionada'));
        img.src = dataUrl;
    });
}

function getDataUrlSizeBytes(dataUrl) {
    const base64Part = String(dataUrl).split(',')[1] || '';
    return Math.ceil((base64Part.length * 3) / 4);
}

async function resizeAndCompressImage(dataUrl, maxDimension, quality) {
    const image = await loadImage(dataUrl);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    let { width, height } = image;
    const largerSide = Math.max(width, height);

    if (largerSide > maxDimension) {
        const scale = maxDimension / largerSide;
        width = Math.round(width * scale);
        height = Math.round(height * scale);
    }

    canvas.width = width;
    canvas.height = height;
    context.drawImage(image, 0, 0, width, height);

    // JPEG reduz bastante payload de data URL para transporte via JSON
    return canvas.toDataURL('image/jpeg', quality);
}

// Handle photo upload
async function handlePhotoUpload(event) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
        showToast('Por favor, selecione uma imagem válida', APP_CONFIG.TOAST_TYPES.ERROR);
        return;
    }
    
    // Validar tamanho inicial do arquivo antes de processar
    if (file.size > PHOTO_MAX_INPUT_SIZE) {
        showToast('A imagem original deve ter no máximo 8MB', APP_CONFIG.TOAST_TYPES.ERROR);
        return;
    }

    try {
        const originalDataUrl = await readFileAsDataURL(file);
        let optimizedDataUrl = await resizeAndCompressImage(
            originalDataUrl,
            PHOTO_PRIMARY_MAX_DIMENSION,
            PHOTO_PRIMARY_QUALITY
        );

        if (getDataUrlSizeBytes(optimizedDataUrl) > PHOTO_MAX_OUTPUT_SIZE) {
            optimizedDataUrl = await resizeAndCompressImage(
                originalDataUrl,
                PHOTO_FALLBACK_MAX_DIMENSION,
                PHOTO_FALLBACK_QUALITY
            );
        }

        if (getDataUrlSizeBytes(optimizedDataUrl) > PHOTO_MAX_OUTPUT_SIZE) {
            showToast('Não foi possível otimizar a imagem para até 2MB. Escolha outra foto.', APP_CONFIG.TOAST_TYPES.ERROR);
            return;
        }

        const profilePhoto = document.getElementById('profilePhoto');
        if (profilePhoto) {
            profilePhoto.src = optimizedDataUrl;
        }
        
        // Salvar dados da foto
        profileState.photoChanged = true;
        profileState.newPhotoData = optimizedDataUrl;
        
        showToast(
            'Foto otimizada e selecionada! Clique em "Salvar Alterações Pessoais" para confirmar.',
            APP_CONFIG.TOAST_TYPES.INFO
        );
    } catch (error) {
        errorLog('Erro ao processar foto de perfil:', error);
        showToast('Erro ao processar imagem. Tente outra foto.', APP_CONFIG.TOAST_TYPES.ERROR);
    } finally {
        // Permite selecionar o mesmo arquivo novamente se necessário
        event.target.value = '';
    }
}

// Show change password modal
function showChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    const overlay = document.getElementById('modalOverlay');
    
    if (modal) {
        modal.classList.add('active');
        if (overlay) {
            overlay.classList.add('active');
        }
        document.body.style.overflow = 'hidden';
    }
}

// Close change password modal
function closeChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    const overlay = document.getElementById('modalOverlay');
    
    if (modal) {
        modal.classList.remove('active');
        if (overlay) {
            overlay.classList.remove('active');
        }
        document.body.style.overflow = '';
        
        // Limpar formulário
        const form = document.getElementById('changePasswordForm');
        if (form) {
            form.reset();
        }
    }
}

// Handle change password
async function handleChangePassword(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        const currentPassword = document.getElementById('currentPassword').value.trim();
        const newPassword = document.getElementById('newPassword').value.trim();
        const confirmNewPassword = document.getElementById('confirmNewPassword').value.trim();

        if (!currentPassword) {
            showToast('Informe sua senha atual', APP_CONFIG.TOAST_TYPES.ERROR);
            return;
        }
        
        // Validações
        if (newPassword !== confirmNewPassword) {
            showToast('As senhas não coincidem', APP_CONFIG.TOAST_TYPES.ERROR);
            return;
        }
        
        if (newPassword.length < 6) {
            showToast('A nova senha deve ter pelo menos 6 caracteres', APP_CONFIG.TOAST_TYPES.ERROR);
            return;
        }

        if (newPassword === currentPassword) {
            showToast('A nova senha deve ser diferente da senha atual', APP_CONFIG.TOAST_TYPES.ERROR);
            return;
        }
        
        // Desabilitar botão
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Alterando...';
        
        // Enviar requisição
        const response = await ApiClient.put(APP_CONFIG.ENDPOINTS.CHANGE_PASSWORD, {
            currentPassword,
            newPassword
        });
        
        if (response.success) {
            closeChangePasswordModal();
            showToast(
                'Senha alterada com sucesso!',
                APP_CONFIG.TOAST_TYPES.SUCCESS
            );
        } else {
            throw new Error(response.message || 'Erro ao alterar senha');
        }
        
    } catch (error) {
        errorLog('Erro ao alterar senha:', error);
        showToast(
            error.message || 'Erro ao alterar senha. Verifique a senha atual.',
            APP_CONFIG.TOAST_TYPES.ERROR
        );
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// Go back to previous page
function goBack() {
    if (document.referrer && document.referrer.includes(window.location.host)) {
        window.history.back();
    } else {
        window.location.href = '../index.html';
    }
}

// Exportar funções globais
window.triggerPhotoUpload = triggerPhotoUpload;
window.handlePhotoUpload = handlePhotoUpload;
window.toggleSpecialty = toggleSpecialty;
window.showChangePasswordModal = showChangePasswordModal;
window.closeChangePasswordModal = closeChangePasswordModal;
window.handleChangePassword = handleChangePassword;
window.goBack = goBack;