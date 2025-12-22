// ===================================
// PLANURBI - App Principal (ATUALIZADO)
// Usando Google Identity Services (GIS)
// ===================================

// Estado Global
const AppState = {
    imoveis: [],
    imoveisFaltantes: [],
    imovelAtual: null,
    coletados: [],
    userLocation: null,
    capturedGPS: null, // GPS no momento da captura
    isAuthenticated: false,
    tokenClient: null,
    accessToken: null,
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
    
    // Inicializar Google Identity Services
    initGoogleIdentity();
    
    // Capturar GPS do usuário
    getUserLocation();
    
    // Carregar dados salvos (localStorage)
    loadSavedData();
    
    // Atualizar contador de FILE_IDs salvos
    const savedLinks = JSON.parse(localStorage.getItem('planurbi_file_ids') || '[]');
    updateFileIdsCounter(savedLinks.length);
});

// ===================================
// GOOGLE IDENTITY SERVICES (NOVO!)
// ===================================

function initGoogleIdentity() {
    // Carregar biblioteca Google Identity Services
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => {
        console.log('✅ Google Identity Services carregado');
        initTokenClient();
    };
    script.onerror = () => {
        console.error('❌ Erro ao carregar Google Identity Services');
        showToast('❌ Erro ao carregar autenticação Google', 'error');
        updateAuthStatus('error');
    };
    document.head.appendChild(script);
}

function initTokenClient() {
    try {
        AppState.tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: PLANURBI_CONFIG.GOOGLE_CLIENT_ID,
            scope: PLANURBI_CONFIG.GOOGLE_SCOPES,
            callback: async (response) => {
                if (response.error) {
                    console.error('❌ Erro OAuth:', response);
                    showToast('❌ Erro na autenticação', 'error');
                    updateAuthStatus('error');
                    return;
                }
                
                AppState.accessToken = response.access_token;
                AppState.isAuthenticated = true;
                console.log('✅ Token obtido com sucesso');
                updateAuthStatus('authenticated');
                updateStatusIndicator('online');
                
                // RECARREGAR IMÓVEIS APÓS AUTENTICAR PARA FILTRAR OS JÁ FOTOGRAFADOS
                if (AppState.imoveis.length > 0) {
                    await checkExistingPhotos();
                    AppState.imoveisFaltantes = AppState.imoveis.filter(im => 
                        !AppState.coletados.includes(im.inscricao)
                    );
                    populateDropdown();
                    updateProgress();
                    
                    const faltantes = AppState.imoveisFaltantes.length;
                    const total = AppState.imoveis.length;
                    showToast(`✅ Faltam ${faltantes} de ${total} imóveis`, 'info');
                }
            },
        });
        
        console.log('✅ Token Client inicializado');
        updateAuthStatus('not-authenticated');
        updateStatusIndicator('online');
        
    } catch (error) {
        console.error('❌ Erro ao inicializar Token Client:', error);
        showToast('❌ Erro na inicialização', 'error');
        updateAuthStatus('error');
    }
}

function requestAccessToken() {
    return new Promise((resolve, reject) => {
        if (!AppState.tokenClient) {
            reject(new Error('Token Client não inicializado'));
            return;
        }
        
        // Configurar callback temporário
        const originalCallback = AppState.tokenClient.callback;
        AppState.tokenClient.callback = (response) => {
            // Restaurar callback original
            AppState.tokenClient.callback = originalCallback;
            
            if (response.error) {
                reject(response);
                return;
            }
            
            AppState.accessToken = response.access_token;
            AppState.isAuthenticated = true;
            updateAuthStatus('authenticated');
            resolve(response.access_token);
        };
        
        // Solicitar token
        AppState.tokenClient.requestAccessToken({ prompt: '' });
    });
}

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
        
        console.log('✅ Imóveis carregados:', AppState.imoveis.length);
        
        // VERIFICAR QUAIS JÁ FORAM FOTOGRAFADOS NO DRIVE
        await checkExistingPhotos();
        
        AppState.imoveisFaltantes = AppState.imoveis.filter(im => 
            !AppState.coletados.includes(im.inscricao)
        );
        
        populateDropdown();
        updateProgress();
        
        hideLoading();
        
        const faltantes = AppState.imoveisFaltantes.length;
        const total = AppState.imoveis.length;
        showToast(`✅ Faltam ${faltantes} de ${total} imóveis`, 'success');
        
    } catch (error) {
        console.error('❌ Erro ao carregar imóveis:', error);
        hideLoading();
        showToast('❌ Erro ao carregar dados', 'error');
    }
}

// ===================================
// VERIFICAR FOTOS JÁ EXISTENTES NO DRIVE
// ===================================

async function checkExistingPhotos() {
    try {
        console.log('🔍 Verificando fotos já existentes no Drive...');
        
        // Se não está autenticado, não consegue verificar
        if (!AppState.isAuthenticated || !AppState.accessToken) {
            console.log('⚠️ Não autenticado, pulando verificação');
            return;
        }
        
        // Listar arquivos na pasta do Drive
        const query = `'${PLANURBI_CONFIG.DRIVE_FOLDER_ID}' in parents and trashed=false`;
        const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)&pageSize=1000`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${AppState.accessToken}`
            }
        });
        
        if (!response.ok) {
            console.warn('⚠️ Erro ao listar arquivos do Drive');
            return;
        }
        
        const result = await response.json();
        const files = result.files || [];
        
        console.log(`✅ Encontrados ${files.length} arquivos no Drive`);
        
        // Extrair matrículas dos nomes dos arquivos
        files.forEach(file => {
            const fileName = file.name;
            // Remove extensão .jpg e extrai matrícula ou inscrição
            const fileNameWithoutExt = fileName.replace(/\.(jpg|jpeg|png)$/i, '');
            
            // Tentar encontrar imóvel por matrícula ou inscrição
            const imovel = AppState.imoveis.find(im => 
                im.matricula === fileNameWithoutExt || 
                im.inscricao === fileNameWithoutExt
            );
            
            if (imovel && !AppState.coletados.includes(imovel.inscricao)) {
                AppState.coletados.push(imovel.inscricao);
                console.log(`  ✅ Já fotografado: ${fileNameWithoutExt}`);
            }
        });
        
        console.log(`✅ Total de imóveis já coletados: ${AppState.coletados.length}`);
        
    } catch (error) {
        console.warn('⚠️ Erro ao verificar fotos existentes:', error);
        // Não bloqueia o app se der erro
    }
}

function populateDropdown() {
    const select = document.getElementById('imovelSelect');
    
    select.innerHTML = '<option value="">Selecione um imóvel...</option>';
    
    // ORDENAR POR QUADRA!
    const imoveisOrdenados = AppState.imoveisFaltantes.sort((a, b) => {
        return a.quadra.localeCompare(b.quadra);
    });
    
    imoveisOrdenados.forEach(imovel => {
        const option = document.createElement('option');
        option.value = imovel.inscricao;
        // MOSTRAR SÓ MATRÍCULA!
        option.textContent = imovel.matricula || imovel.inscricao;
        select.appendChild(option);
    });
    
    updateStatusIndicator('online');
}

// ===================================
// ATUALIZAR LISTA DE IMÓVEIS
// ===================================

async function refreshImoveis() {
    try {
        showLoading('Atualizando lista...');
        
        if (!AppState.isAuthenticated || !AppState.accessToken) {
            showToast('⚠️ Faça login primeiro para ver atualizações', 'warning');
            hideLoading();
            return;
        }
        
        await checkExistingPhotos();
        
        AppState.imoveisFaltantes = AppState.imoveis.filter(im => 
            !AppState.coletados.includes(im.inscricao)
        );
        
        populateDropdown();
        updateProgress();
        
        hideLoading();
        
        const faltantes = AppState.imoveisFaltantes.length;
        const total = AppState.imoveis.length;
        showToast(`✅ Atualizado! Faltam ${faltantes} de ${total}`, 'success');
        
    } catch (error) {
        console.error('❌ Erro ao atualizar:', error);
        hideLoading();
        showToast('❌ Erro ao atualizar lista', 'error');
    }
}

// Expor função globalmente para botão no HTML
window.refreshImoveis = refreshImoveis;

// ===================================
// SALVAR FILE_IDs (NOVO!)
// ===================================

function saveFileIdToLocalStorage(imovel, fileId) {
    try {
        // Carregar lista existente
        const savedLinks = JSON.parse(localStorage.getItem('planurbi_file_ids') || '[]');
        
        // Gerar URLs
        const urlView = `https://drive.google.com/file/d/${fileId}/view`;
        const urlDownload = `https://drive.google.com/uc?id=${fileId}&export=download`;
        const urlThumbnail = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
        
        // Adicionar novo registro
        const registro = {
            matricula: imovel.matricula || '',
            inscricao: imovel.inscricao,
            bairro: imovel.bairro,
            quadra: imovel.quadra || '',
            logradouro: imovel.logradouro || '',
            tipo: imovel.tipo || '',
            
            // GPS CADASTRAL
            gps_cadastral: {
                latitude: imovel.latitude,
                longitude: imovel.longitude,
                fonte: 'Cadastro Municipal'
            },
            
            // GPS CAPTURADO (NOVO!)
            gps_capturado: AppState.capturedGPS ? {
                latitude: AppState.capturedGPS.latitude,
                longitude: AppState.capturedGPS.longitude,
                precisao_metros: AppState.capturedGPS.precisao_metros,
                altitude: AppState.capturedGPS.altitude,
                distancia_cadastral_metros: AppState.capturedGPS.distancia_cadastral_metros,
                timestamp: AppState.capturedGPS.timestamp
            } : null,
            
            // FOTO
            file_id: fileId,
            url_view: urlView,
            url_download: urlDownload,
            url_thumbnail: urlThumbnail,
            
            // TIMESTAMP GERAL
            timestamp: new Date().toISOString()
        };
        
        savedLinks.push(registro);
        
        // Salvar de volta
        localStorage.setItem('planurbi_file_ids', JSON.stringify(savedLinks));
        
        console.log('💾 FILE_ID salvo:', fileId);
        if (AppState.capturedGPS) {
            console.log('📍 GPS salvo:', AppState.capturedGPS);
        }
        
        // Limpar GPS capturado
        AppState.capturedGPS = null;
        
        // Atualizar contador na UI
        updateFileIdsCounter(savedLinks.length);
        
    } catch (error) {
        console.error('❌ Erro ao salvar FILE_ID:', error);
    }
}

function updateFileIdsCounter(count) {
    // Atualizar contador de FILE_IDs salvos (se existir elemento na UI)
    const counterElement = document.getElementById('fileIdsCounter');
    if (counterElement) {
        counterElement.textContent = `${count} link${count !== 1 ? 's' : ''} salvo${count !== 1 ? 's' : ''}`;
    }
}

function exportFileIds() {
    try {
        const savedLinks = JSON.parse(localStorage.getItem('planurbi_file_ids') || '[]');
        
        if (savedLinks.length === 0) {
            showToast('⚠️ Nenhum FILE_ID salvo ainda', 'warning');
            return;
        }
        
        // Criar objeto JSON para exportar
        const exportData = {
            data_coleta: new Date().toISOString(),
            total_fotos: savedLinks.length,
            bairro: savedLinks[0]?.bairro || 'ALTAVISTA',
            fotos: savedLinks
        };
        
        // Criar blob e download
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `planurbi_links_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast(`✅ ${savedLinks.length} links exportados!`, 'success');
        
    } catch (error) {
        console.error('❌ Erro ao exportar:', error);
        showToast('❌ Erro ao exportar links', 'error');
    }
}

function clearFileIds() {
    if (confirm('⚠️ Tem certeza que deseja limpar todos os FILE_IDs salvos?')) {
        localStorage.removeItem('planurbi_file_ids');
        updateFileIdsCounter(0);
        showToast('✅ FILE_IDs limpos', 'success');
    }
}

// Expor funções globalmente
window.exportFileIds = exportFileIds;
window.clearFileIds = clearFileIds;

// ===================================
// GPS CAPTURADO (NOVO!)
// ===================================

async function captureGPSLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('GPS não suportado'));
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const gpsData = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    precisao_metros: Math.round(position.coords.accuracy),
                    altitude: position.coords.altitude ? Math.round(position.coords.altitude) : null,
                    timestamp: new Date(position.timestamp).toISOString()
                };
                
                // Calcular distância do GPS cadastral
                if (AppState.imovelAtual) {
                    const distancia = calculateGPSDistance(
                        gpsData.latitude,
                        gpsData.longitude,
                        AppState.imovelAtual.latitude,
                        AppState.imovelAtual.longitude
                    );
                    gpsData.distancia_cadastral_metros = Math.round(distancia);
                }
                
                resolve(gpsData);
            },
            (error) => {
                reject(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
}

function calculateGPSDistance(lat1, lon1, lat2, lon2) {
    // Fórmula de Haversine para calcular distância entre dois pontos GPS
    const R = 6371e3; // Raio da Terra em metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c; // Distância em metros
}

function showGPSInfo(gpsData) {
    // Mostrar info GPS na UI (se elemento existir)
    const gpsInfo = document.getElementById('gpsInfo');
    if (!gpsInfo) return;
    
    let html = `
        <div style="font-size: 12px; margin-top: 10px; padding: 10px; background: #e8f5e9; border-radius: 5px; border: 1px solid #4caf50;">
            <strong>📍 GPS Capturado:</strong><br>
            Lat: ${gpsData.latitude.toFixed(8)}<br>
            Lng: ${gpsData.longitude.toFixed(8)}<br>
            Precisão: ${gpsData.precisao_metros}m
    `;
    
    if (gpsData.altitude) {
        html += `<br>Altitude: ${gpsData.altitude}m`;
    }
    
    if (gpsData.distancia_cadastral_metros !== undefined) {
        const cor = gpsData.distancia_cadastral_metros > 50 ? 'red' : 
                    gpsData.distancia_cadastral_metros > 20 ? 'orange' : 'green';
        html += `<br>Dist. cadastral: <span style="color: ${cor}; font-weight: bold;">${gpsData.distancia_cadastral_metros}m</span>`;
        
        // Alertas
        if (gpsData.distancia_cadastral_metros > 50) {
            html += '<br><span style="color: red;">⚠️ Distância alta!</span>';
        }
    }
    
    if (gpsData.precisao_metros > 20) {
        html += '<br><span style="color: orange;">⚠️ GPS impreciso</span>';
    }
    
    html += '</div>';
    gpsInfo.innerHTML = html;
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
    
    const imovel = AppState.imoveis.find(im => im.inscricao === inscricao);
    if (!imovel) {
        showToast('❌ Imóvel não encontrado', 'error');
        return;
    }
    
    AppState.imovelAtual = imovel;
    showImovelDetails(imovel);
    document.getElementById('cameraSection').style.display = 'block';
    
    setTimeout(() => {
        document.getElementById('cameraSection').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }, 300);
}

function showImovelDetails(imovel) {
    document.getElementById('detailBairro').textContent = imovel.bairro || 'N/A';
    document.getElementById('detailQuadra').textContent = imovel.quadra || 'N/A';
    document.getElementById('detailTipo').textContent = imovel.tipo || 'N/A';
    document.getElementById('detailLogradouro').textContent = imovel.logradouro || 'N/A';
    
    if (imovel.latitude && imovel.longitude) {
        const gpsText = `${imovel.latitude.toFixed(6)}, ${imovel.longitude.toFixed(6)}`;
        document.getElementById('gpsImovel').textContent = gpsText;
        document.getElementById('gpsSection').style.display = 'block';
        calculateDistance(imovel);
    } else {
        document.getElementById('gpsSection').style.display = 'none';
    }
    
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
    const R = 6371;
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
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment',
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            }
        });
        
        AppState.videoStream = stream;
        
        const video = document.getElementById('videoElement');
        video.srcObject = stream;
        
        document.getElementById('cameraContainer').style.display = 'block';
        document.getElementById('btnCamera').style.display = 'none';
        document.getElementById('btnCapture').style.display = 'block';
        
        showToast('📷 Câmera ativa', 'success');
        
    } catch (error) {
        console.error('❌ Erro ao acessar câmera:', error);
        showToast('❌ Erro ao acessar câmera', 'error');
    }
}

async function capturePhoto() {
    const video = document.getElementById('videoElement');
    const canvas = document.getElementById('canvasElement');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // CAPTURAR GPS NO MOMENTO DA FOTO (NOVO!)
    showToast('📍 Capturando GPS...', 'info');
    try {
        const gpsData = await captureGPSLocation();
        AppState.capturedGPS = gpsData;
        console.log('✅ GPS capturado:', gpsData);
        showGPSInfo(gpsData);
        
        // Alertas
        if (gpsData.precisao_metros > 20) {
            showToast('⚠️ GPS com baixa precisão!', 'warning');
        }
        if (gpsData.distancia_cadastral_metros > 50) {
            showToast('⚠️ Distância alta do cadastral!', 'warning');
        }
        
    } catch (error) {
        console.error('❌ Erro ao capturar GPS:', error);
        AppState.capturedGPS = null;
        showToast('⚠️ GPS não capturado (continue assim mesmo)', 'warning');
    }
    
    canvas.toBlob((blob) => {
        AppState.photoBlob = blob;
        
        const photoURL = URL.createObjectURL(blob);
        document.getElementById('photoImage').src = photoURL;
        
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
    
    // Verificar/solicitar autenticação
    if (!AppState.isAuthenticated || !AppState.accessToken) {
        try {
            showLoading('🔐 Autenticando...');
            await requestAccessToken();
            hideLoading();
        } catch (error) {
            console.error('❌ Erro na autenticação:', error);
            hideLoading();
            showToast('❌ Falha na autenticação. Tente novamente.', 'error');
            return;
        }
    }
    
    // Upload para Google Drive
    await uploadToGoogleDrive();
}

// ===================================
// GOOGLE DRIVE UPLOAD (ATUALIZADO)
// ===================================

async function uploadToGoogleDrive() {
    if (!AppState.photoBlob || !AppState.imovelAtual) return;
    
    try {
        showLoading('Enviando para Google Drive...');
        
        // USAR MATRÍCULA NO NOME DO ARQUIVO!
        const fileName = `${AppState.imovelAtual.matricula || AppState.imovelAtual.inscricao}.jpg`;
        
        const metadata = {
            name: fileName,
            mimeType: 'image/jpeg',
            parents: [PLANURBI_CONFIG.DRIVE_FOLDER_ID]
        };
        
        const formData = new FormData();
        formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        formData.append('file', AppState.photoBlob);
        
        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AppState.accessToken}`
            },
            body: formData
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Upload falhou: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('✅ Upload concluído:', result);
        
        // ===================================
        // SALVAR FILE_ID NO LOCALSTORAGE! (NOVO!)
        // ===================================
        saveFileIdToLocalStorage(AppState.imovelAtual, result.id);
        
        hideLoading();
        markAsCollected(AppState.imovelAtual.inscricao);
        resetPhotoUI();
        
        setTimeout(() => {
            nextImovel();
        }, PLANURBI_CONFIG.AUTO_NEXT_DELAY);
        
    } catch (error) {
        console.error('❌ Erro no upload:', error);
        hideLoading();
        
        // Se erro de auth, limpar token e tentar de novo
        if (error.message && error.message.includes('401')) {
            AppState.isAuthenticated = false;
            AppState.accessToken = null;
            showToast('❌ Sessão expirada. Clique novamente em Confirmar.', 'warning');
        } else {
            showToast('❌ Erro ao enviar foto', 'error');
        }
    }
}

// ===================================
// PROGRESSO E STATUS
// ===================================

function markAsCollected(inscricao) {
    if (!AppState.coletados.includes(inscricao)) {
        AppState.coletados.push(inscricao);
    }
    
    AppState.imoveisFaltantes = AppState.imoveis.filter(im => 
        !AppState.coletados.includes(im.inscricao)
    );
    
    saveToLocalStorage();
    addToRecent(inscricao);
    populateDropdown();
    updateProgress();
    
    showToast(`✅ ${inscricao} coletado!`, 'success');
}

function updateProgress() {
    const total = AppState.imoveis.length;
    const coletados = AppState.coletados.length;
    const percentual = total > 0 ? Math.round((coletados / total) * 100) : 0;
    
    document.getElementById('progressCount').textContent = `${coletados}/${total}`;
    document.getElementById('progressFill').style.width = `${percentual}%`;
    document.getElementById('progressText').textContent = `${percentual}% concluído`;
    
    document.getElementById('progressSection').style.display = 'block';
    
    if (coletados > 0) {
        document.getElementById('recentSection').style.display = 'block';
    }
}

function addToRecent(inscricao) {
    const recentList = document.getElementById('recentList');
    
    if (recentList.querySelector('.empty-state')) {
        recentList.innerHTML = '';
    }
    
    const item = document.createElement('div');
    item.className = 'recent-item';
    item.innerHTML = `
        <span class="recent-inscricao">${inscricao}</span>
        <span class="recent-time">agora</span>
    `;
    
    recentList.insertBefore(item, recentList.firstChild);
    
    while (recentList.children.length > 5) {
        recentList.removeChild(recentList.lastChild);
    }
}

function nextImovel() {
    if (AppState.imoveisFaltantes.length === 0) {
        showToast('🎉 Todos os imóveis coletados!', 'success');
        return;
    }
    
    const select = document.getElementById('imovelSelect');
    select.selectedIndex = 1;
    selectImovel();
    
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
        'not-authenticated': '🔐 Clique para autenticar',
        'error': '❌ Erro de autenticação'
    };
    
    authSpan.textContent = statusMap[status] || statusMap['not-authenticated'];
}

// ===================================
// UTILITÁRIOS
// ===================================

document.addEventListener('dblclick', (e) => {
    e.preventDefault();
}, { passive: false });

window.debugPlanurbi = () => {
    console.log('=== PLANURBI DEBUG ===');
    console.log('Config:', PLANURBI_CONFIG);
    console.log('State:', AppState);
    console.log('Imóveis:', AppState.imoveis.length);
    console.log('Faltantes:', AppState.imoveisFaltantes.length);
    console.log('Coletados:', AppState.coletados.length);
    console.log('Autenticado:', AppState.isAuthenticated);
    console.log('Token:', AppState.accessToken ? 'Presente' : 'Ausente');
    console.log('====================');
};

console.log('✅ App Planurbi carregado (Google Identity Services)! Use debugPlanurbi() para debug.');
