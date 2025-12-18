// ===================================
// PLANURBI - Configuração
// ===================================

// IMPORTANTE: Configure estas variáveis antes de usar o app

const CONFIG = {
    // Google Drive API
    // Instruções de setup em: SETUP_GOOGLE_CLOUD.md
    GOOGLE_CLIENT_ID: '634169970002-3poa2g6damuf90o7aagr3tnmuq8sap2d.apps.googleusercontent.com',
    GOOGLE_API_KEY: 'SEU_API_KEY_AQUI', // Opcional
    GOOGLE_SCOPES: 'https://www.googleapis.com/auth/drive.file',
    
    // Google Drive Folder ID
    // Crie uma pasta no Google Drive e copie o ID da URL
    // Exemplo: https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i0j
    // O ID é: 1a2b3c4d5e6f7g8h9i0j
    DRIVE_FOLDER_ID: '1pwX_8x0-ud94loc2_DlcUxZhJsTAYGcq',
    
    // Configurações do App
    APP_NAME: 'Planurbi Coleta Campo',
    APP_VERSION: '1.0.0',
    
    // Configurações de Foto
    PHOTO_QUALITY: 0.92, // 0.0 a 1.0 (0.92 = alta qualidade)
    PHOTO_MAX_WIDTH: 1920, // pixels
    PHOTO_MAX_HEIGHT: 1080, // pixels
    
    // GPS
    GPS_HIGH_ACCURACY: true,
    GPS_TIMEOUT: 10000, // 10 segundos
    GPS_MAX_AGE: 0, // Sempre capturar nova localização
    
    // UI
    TOAST_DURATION: 4000, // 4 segundos
    AUTO_NEXT_DELAY: 2000, // 2 segundos antes de ir pro próximo
};

// Verificar se está configurado
function checkConfig() {
    if (CONFIG.GOOGLE_CLIENT_ID === 'SEU_CLIENT_ID_AQUI.apps.googleusercontent.com') {
        console.warn('⚠️ Google Client ID não configurado!');
        console.warn('📖 Veja SETUP_GOOGLE_CLOUD.md para instruções');
        return false;
    }
    
    if (CONFIG.DRIVE_FOLDER_ID === 'SEU_FOLDER_ID_AQUI') {
        console.warn('⚠️ Drive Folder ID não configurado!');
        console.warn('📖 Veja SETUP_GOOGLE_CLOUD.md para instruções');
        return false;
    }
    
    return true;
}

// Exportar configuração
window.PLANURBI_CONFIG = CONFIG;
window.checkPlanurbiConfig = checkConfig;
