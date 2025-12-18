// ===================================
// PLANURBI - App Principal
// ===================================

// Estado Global
const AppState = {
    imoveis: [],
    imoveisFaltantes: [],
    imovelAtual: null,
    coletados: [],
    userLocation: null,
    isAuthenticated: false,
    gapiReady: false,
    videoStream: null,
    photoBlob: null
};

// ===================================
// INICIALIZAÇÃO
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 Planurbi Coleta Campo v' + PLANURBI_CONFIG.APP_VERSION);
    
    // Verificar configuração
    if (!checkPlanurbiConfig()) {
        showToast('⚠️ App não configurado! Veja console.', 'warning');
    }
    
    // Carregar dados
    loadImoveis();
    
    // Inicializar Google API
    initGoogleAPI();
    
    // Capturar GPS do usuário
    getUserLocation();
    
    // Carregar dados salvos (localStorage)
    loadSavedData();
});

// ===================================
// CARREGAR IMÓVEIS
// ===================================

async function loadImoveis() {
    try {
        showLoading('Carregando imóveis...');
        
        const response = await fetch('data/imoveis.json');
        if (!response.ok) throw new Error('Erro ao carregar JSON');
        
        const data = await response.json();
        AppState.imoveis = data;
        AppState.imoveisFaltantes = data.filter(im => 
            !AppState.coletados.includes(im.inscricao)
        );
        
        console.log('✅ Imóveis carregados:', AppState.imoveis.length);
        
        populateDropdown();
        updateProgress();
        
        hideLoading();
        showToast(`✅ ${AppState.imoveis.length} imóveis carregados`, 'success');
        
    } catch (error) {
        console.error('❌ Erro ao carregar imóveis:', error);
        hideLoading();
        showToast('❌ Erro ao carregar dados', 'error');
    }
}

function populateDropdown() {
    const select = document.getElementById('imovelSelect');
    
    select.innerHTML = '<option value="">Selecione um imóvel...</option>';
    
    AppState.imoveisFaltantes.forEach(imovel => {
        const option = document.createElement('option');
        option.value = imovel.inscricao;
        option.textContent = `${imovel.inscricao} - ${imovel.bairro}`;
        select.appendChild(option);
    });
    
    // Atualizar status
    updateStatusIndicator('online');
}

// ===================================
// SELEÇÃO DE IMÓVEL
// ===================================

function selectImovel() {
    const select = document.getElementById('imovelSelect');
    const inscricao = select.value;
    
    if (!inscricao) {
        document.getElementById('imovelDetails').style.display = 'none';
        document.getElementById('cameraSection').style.display = 'none';
        AppState.imovelAtual = null;
        return;
    }
    
    // Encontrar imóvel
    const imovel = AppState.imoveis.find(im => im.inscricao === inscricao);
    if (!imovel) {
        showToast('❌ Imóvel não encontrado', 'error');
        return;
    }
    
    AppState.imovelAtual = imovel;
    
    // Mostrar detalhes
    showImovelDetails(imovel);
    
    // Mostrar seção de câmera
    document.getElementById('cameraSection').style.display = 'block';
    
    // Scroll suave
    setTimeout(() => {
        document.getElementById('cameraSection').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }, 300);
}

function showImovelDetails(imovel) {
    // Preencher detalhes
    document.getElementById('detailBairro').textContent = imovel.bairro || 'N/A';
    document.getElementById('detailQuadra').textContent = imovel.quadra || 'N/A';
    document.getElementById('detailTipo').textContent = imovel.tipo || 'N/A';
    document.getElementById('detailLogradouro').textContent = imovel.logradouro || 'N/A';
    
    // Mostrar GPS
    if (imovel.latitude && imovel.longitude) {
        const gpsText = `${imovel.latitude.toFixed(6)}, ${imovel.longitude.toFixed(6)}`;
        document.getElementById('gpsImovel').textContent = gpsText;
        document.getElementById('gpsSection').style.display = 'block';
        
        // Calcular distância
        calculateDistance(imovel);
    } else {
        document.getElementById('gpsSection').style.display = 'none';
    }
    
    // Atualizar GPS atual
    if (AppState.userLocation) {
        const userGpsText = `${AppState.userLocation.latitude.toFixed(6)}, ${AppState.userLocation.longitude.toFixed(6)}`;
        document.getElementById('gpsAtual').textContent = userGpsText;
    }
    
    document.getElementById('imovelDetails').style.display = 'block';
}

// ===================================
// GPS E LOCALIZAÇÃO
// ===================================

function getUserLocation() {
    if (!navigator.geolocation) {
        console.warn('⚠️ Geolocalização não suportada');
        return;
    }
    
    const options = {
        enableHighAccuracy: PLANURBI_CONFIG.GPS_HIGH_ACCURACY,
        timeout: PLANURBI_CONFIG.GPS_TIMEOUT,
        maximumAge: PLANURBI_CONFIG.GPS_MAX_AGE
    };
    
    navigator.geolocation.watchPosition(
        (position) => {
            AppState.userLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
            };
            
            // Atualizar UI
            if (AppState.imovelAtual) {
                const userGpsText = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
                document.getElementById('gpsAtual').textContent = userGpsText;
                calculateDistance(AppState.imovelAtual);
            }
        },
        (error) => {
            console.warn('⚠️ Erro GPS:', error.message);
            document.getElementById('gpsAtual').textContent = 'Erro ao capturar GPS';
        },
        options
    );
}

function calculateDistance(imovel) {
    if (!AppState.userLocation || !imovel.latitude || !imovel.longitude) {
        document.getElementById('gpsDistancia').textContent = 'N/A';
        return;
    }
    
    const distance = getDistanceFromLatLon(
        AppState.userLocation.latitude,
        AppState.userLocation.longitude,
        imovel.latitude,
        imovel.longitude
    );
    
    let distText;
    if (distance < 1) {
        distText = `${Math.round(distance * 1000)}m`;
    } else {
        distText = `${distance.toFixed(2)}km`;
    }
    
    document.getElementById('gpsDistancia').textContent = distText;
}

function getDistanceFromLatLon(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raio da Terra em km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function deg2rad(deg) {
    return deg * (Math.PI/180);
}

function openMaps() {
    if (!AppState.imovelAtual) return;
    
    const { latitude, longitude } = AppState.imovelAtual;
    if (!latitude || !longitude) {
        showToast('⚠️ GPS não disponível', 'warning');
        return;
    }
    
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    window.open(url, '_blank');
}

// ===================================
// CÂMERA
// ===================================

async function startCamera() {
    if (!AppState.imovelAtual) {
        showToast('⚠️ Selecione um imóvel primeiro', 'warning');
        return;
    }
    
    try {
        // Solicitar acesso à câmera
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment', // Câmera traseira
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            }
        });
        
        AppState.videoStream = stream;
        
        // Configurar video element
        const video = document.getElementById('videoElement');
        video.srcObject = stream;
        
        // Mostrar câmera
        document.getElementById('cameraContainer').style.display = 'block';
        document.getElementById('btnCamera').style.display = 'none';
        document.getElementById('btnCapture').style.display = 'block';
        
        showToast('📷 Câmera ativa', 'success');
        
    } catch (error) {
        console.error('❌ Erro ao acessar câmera:', error);
        showToast('❌ Erro ao acessar câmera', 'error');
    }
}

function capturePhoto() {
    const video = document.getElementById('videoElement');
    const canvas = document.getElementById('canvasElement');
    
    // Configurar canvas com dimensões do vídeo
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Desenhar frame no canvas
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Converter para blob
    canvas.toBlob((blob) => {
        AppState.photoBlob = blob;
        
        // Mostrar preview
        const photoURL = URL.createObjectURL(blob);
        document.getElementById('photoImage').src = photoURL;
        
        // Atualizar UI
        stopCamera();
        document.getElementById('photoPreview').style.display = 'block';
        document.getElementById('cameraActions').style.display = 'none';
        
        showToast('📸 Foto capturada!', 'success');
        
    }, 'image/jpeg', PLANURBI_CONFIG.PHOTO_QUALITY);
}

function stopCamera() {
    if (AppState.videoStream) {
        AppState.videoStream.getTracks().forEach(track => track.stop());
        AppState.videoStream = null;
    }
    
    document.getElementById('cameraContainer').style.display = 'none';
}

function retakePhoto() {
    AppState.photoBlob = null;
    document.getElementById('photoPreview').style.display = 'none';
    document.getElementById('cameraActions').style.display = 'block';
    document.getElementById('btnCamera').style.display = 'block';
    document.getElementById('btnCapture').style.display = 'none';
}

async function confirmPhoto() {
    if (!AppState.photoBlob || !AppState.imovelAtual) {
        showToast('❌ Erro: dados incompletos', 'error');
        return;
    }
    
    // Verificar autenticação
    if (!AppState.isAuthenticated) {
        showToast('🔐 Autenticando no Google Drive...', 'warning');
        await authenticateGoogle();
        
        if (!AppState.isAuthenticated) {
            showToast('❌ Falha na autenticação', 'error');
            return;
        }
    }
    
    // Upload para Google Drive
    await uploadToGoogleDrive();
}

// CONTINUA NA PARTE 2...

// ===================================
// GOOGLE DRIVE API
// ===================================

function initGoogleAPI() {
    // Carregar biblioteca do Google
    gapi.load('client:auth2', initClient);
}

function initClient() {
    gapi.client.init({
        apiKey: PLANURBI_CONFIG.GOOGLE_API_KEY,
        clientId: PLANURBI_CONFIG.GOOGLE_CLIENT_ID,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        scope: PLANURBI_CONFIG.GOOGLE_SCOPES
    }).then(() => {
        console.log('✅ Google API inicializada');
        AppState.gapiReady = true;
        
        // Verificar se já está autenticado
        const authInstance = gapi.auth2.getAuthInstance();
        AppState.isAuthenticated = authInstance.isSignedIn.get();
        
        if (AppState.isAuthenticated) {
            updateAuthStatus('authenticated');
        } else {
            updateAuthStatus('not-authenticated');
        }
        
    }).catch(error => {
        console.error('❌ Erro ao inicializar Google API:', error);
        updateAuthStatus('error');
    });
}

async function authenticateGoogle() {
    if (!AppState.gapiReady) {
        showToast('⚠️ Google API não está pronta', 'warning');
        return false;
    }
    
    try {
        showLoading('Autenticando...');
        
        const authInstance = gapi.auth2.getAuthInstance();
        await authInstance.signIn();
        
        AppState.isAuthenticated = true;
        updateAuthStatus('authenticated');
        
        hideLoading();
        showToast('✅ Autenticado com sucesso!', 'success');
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro na autenticação:', error);
        hideLoading();
        showToast('❌ Erro na autenticação', 'error');
        return false;
    }
}

async function uploadToGoogleDrive() {
    if (!AppState.photoBlob || !AppState.imovelAtual) return;
    
    try {
        showLoading('Enviando para Google Drive...');
        
        // Nome do arquivo: inscricao.jpg
        const fileName = `${AppState.imovelAtual.inscricao}.jpg`;
        
        // Metadata
        const metadata = {
            name: fileName,
            mimeType: 'image/jpeg',
            parents: [PLANURBI_CONFIG.DRIVE_FOLDER_ID]
        };
        
        // Criar FormData
        const formData = new FormData();
        formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        formData.append('file', AppState.photoBlob);
        
        // Upload
        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + gapi.auth.getToken().access_token
            },
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Erro no upload: ' + response.statusText);
        }
        
        const result = await response.json();
        console.log('✅ Upload concluído:', result);
        
        hideLoading();
        
        // Marcar como coletado
        markAsCollected(AppState.imovelAtual.inscricao);
        
        // Resetar UI
        resetPhotoUI();
        
        // Próximo imóvel
        setTimeout(() => {
            nextImovel();
        }, PLANURBI_CONFIG.AUTO_NEXT_DELAY);
        
    } catch (error) {
        console.error('❌ Erro no upload:', error);
        hideLoading();
        showToast('❌ Erro ao enviar foto', 'error');
    }
}

// ===================================
// PROGRESSO E STATUS
// ===================================

function markAsCollected(inscricao) {
    // Adicionar aos coletados
    if (!AppState.coletados.includes(inscricao)) {
        AppState.coletados.push(inscricao);
    }
    
    // Atualizar lista de faltantes
    AppState.imoveisFaltantes = AppState.imoveis.filter(im => 
        !AppState.coletados.includes(im.inscricao)
    );
    
    // Salvar no localStorage
    saveToLocalStorage();
    
    // Adicionar ao histórico recente
    addToRecent(inscricao);
    
    // Atualizar UI
    populateDropdown();
    updateProgress();
    
    showToast(`✅ ${inscricao} coletado!`, 'success');
}

function updateProgress() {
    const total = AppState.imoveis.length;
    const coletados = AppState.coletados.length;
    const percentual = total > 0 ? Math.round((coletados / total) * 100) : 0;
    
    // Atualizar elementos
    document.getElementById('progressCount').textContent = `${coletados}/${total}`;
    document.getElementById('progressFill').style.width = `${percentual}%`;
    document.getElementById('progressText').textContent = `${percentual}% concluído`;
    
    // Mostrar seção de progresso
    document.getElementById('progressSection').style.display = 'block';
    
    // Mostrar seção de recentes se houver
    if (coletados > 0) {
        document.getElementById('recentSection').style.display = 'block';
    }
}

function addToRecent(inscricao) {
    const recentList = document.getElementById('recentList');
    
    // Se está vazio, limpar
    if (recentList.querySelector('.empty-state')) {
        recentList.innerHTML = '';
    }
    
    // Criar item
    const item = document.createElement('div');
    item.className = 'recent-item';
    item.innerHTML = `
        <span class="recent-inscricao">${inscricao}</span>
        <span class="recent-time">agora</span>
    `;
    
    // Adicionar no topo
    recentList.insertBefore(item, recentList.firstChild);
    
    // Manter apenas últimos 5
    while (recentList.children.length > 5) {
        recentList.removeChild(recentList.lastChild);
    }
}

function nextImovel() {
    if (AppState.imoveisFaltantes.length === 0) {
        showToast('🎉 Todos os imóveis coletados!', 'success');
        return;
    }
    
    // Selecionar próximo
    const select = document.getElementById('imovelSelect');
    select.selectedIndex = 1; // Primeiro imóvel da lista
    selectImovel();
    
    // Scroll para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetPhotoUI() {
    AppState.photoBlob = null;
    AppState.imovelAtual = null;
    
    document.getElementById('photoPreview').style.display = 'none';
    document.getElementById('cameraActions').style.display = 'block';
    document.getElementById('btnCamera').style.display = 'block';
    document.getElementById('btnCapture').style.display = 'none';
    document.getElementById('cameraSection').style.display = 'none';
    document.getElementById('imovelDetails').style.display = 'none';
    
    const select = document.getElementById('imovelSelect');
    select.value = '';
}

// ===================================
// LOCAL STORAGE
// ===================================

function saveToLocalStorage() {
    try {
        localStorage.setItem('planurbi_coletados', JSON.stringify(AppState.coletados));
        localStorage.setItem('planurbi_last_update', new Date().toISOString());
    } catch (error) {
        console.warn('⚠️ Erro ao salvar no localStorage:', error);
    }
}

function loadSavedData() {
    try {
        const saved = localStorage.getItem('planurbi_coletados');
        if (saved) {
            AppState.coletados = JSON.parse(saved);
            console.log('✅ Dados carregados do localStorage:', AppState.coletados.length);
        }
    } catch (error) {
        console.warn('⚠️ Erro ao carregar do localStorage:', error);
    }
}

// ===================================
// UI HELPERS
// ===================================

function showLoading(text = 'Carregando...') {
    document.getElementById('loadingText').textContent = text;
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    }[type] || 'ℹ️';
    
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Remover após duração
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            container.removeChild(toast);
        }, 300);
    }, PLANURBI_CONFIG.TOAST_DURATION);
}

function updateStatusIndicator(status) {
    const statusText = document.getElementById('statusText');
    const statusDot = document.querySelector('.status-dot');
    
    const statusMap = {
        'online': { text: 'Online', color: '#28A745' },
        'offline': { text: 'Offline', color: '#DC3545' },
        'loading': { text: 'Carregando...', color: '#FFC107' }
    };
    
    const config = statusMap[status] || statusMap['online'];
    
    statusText.textContent = config.text;
    statusDot.style.backgroundColor = config.color;
}

function updateAuthStatus(status) {
    const authSpan = document.getElementById('footerAuth');
    
    const statusMap = {
        'authenticated': '🔓 Autenticado',
        'not-authenticated': '🔐 Não autenticado',
        'error': '❌ Erro de autenticação'
    };
    
    authSpan.textContent = statusMap[status] || statusMap['not-authenticated'];
}

// ===================================
// UTILITÁRIOS
// ===================================

// Prevenir zoom duplo-toque em iOS
document.addEventListener('dblclick', (e) => {
    e.preventDefault();
}, { passive: false });

// Logging para debug
window.debugPlanurbi = () => {
    console.log('=== PLANURBI DEBUG ===');
    console.log('Config:', PLANURBI_CONFIG);
    console.log('State:', AppState);
    console.log('Imóveis:', AppState.imoveis.length);
    console.log('Faltantes:', AppState.imoveisFaltantes.length);
    console.log('Coletados:', AppState.coletados.length);
    console.log('Autenticado:', AppState.isAuthenticated);
    console.log('GAPI Ready:', AppState.gapiReady);
    console.log('====================');
};

console.log('✅ App Planurbi carregado! Use debugPlanurbi() para debug.');
