# 📱 PLANURBI - Sistema de Coleta Campo

Sistema web profissional para coleta de fotos de imóveis em campo com integração ao Google Drive.

![Planurbi Logo](assets/logo.png)

---

## ✨ **CARACTERÍSTICAS**

- 📱 **Interface profissional** com identidade visual Planurbi
- 📷 **Câmera nativa** integrada no app
- 📍 **GPS automático** com cálculo de distância
- ☁️ **Upload automático** para Google Drive
- 📊 **Acompanhamento em tempo real** do progresso
- 💾 **Funciona offline** (salva localmente e sincroniza depois)
- 🎯 **Nome automático** dos arquivos (inscricao.jpg)
- ✅ **19 imóveis** nos bairros: Recanto, Praia Bonita, Arquipélago do Sol

---

## 🚀 **TECNOLOGIAS**

- HTML5 + CSS3 + JavaScript puro (sem frameworks pesados)
- Camera API (acesso à câmera do dispositivo)
- Geolocation API (GPS)
- Google Drive API v3 (armazenamento)
- GitHub Pages (hospedagem gratuita)
- PWA ready (pode ser instalado como app)

---

## 📋 **ESTRUTURA DO PROJETO**

```
planurbi-coleta-app/
├── index.html              # App principal
├── manifest.json           # PWA manifest
├── SETUP_GOOGLE_CLOUD.md  # Guia de configuração (LEIA PRIMEIRO!)
├── README.md               # Este arquivo
├── assets/
│   ├── logo.png            # Logo Planurbi
│   └── paleta.jpg          # Paleta de cores
├── css/
│   └── styles.css          # Estilos com cores Planurbi
├── js/
│   ├── config.js           # Configurações (EDITE AQUI!)
│   └── app.js              # Lógica principal
└── data/
    └── imoveis.json        # Lista dos 19 imóveis (GPS corrigido)
```

---

## ⚙️ **SETUP RÁPIDO**

### 1. Configurar Google Cloud (15 min)
📖 **Siga o guia:** `SETUP_GOOGLE_CLOUD.md`

Você vai:
- Criar projeto no Google Cloud
- Ativar Google Drive API
- Criar credenciais OAuth 2.0
- Criar pasta no Google Drive
- Copiar Client ID e Folder ID

### 2. Configurar o App (2 min)
Editar `js/config.js`:
```javascript
GOOGLE_CLIENT_ID: 'COLE_SEU_CLIENT_ID_AQUI',
DRIVE_FOLDER_ID: 'COLE_SEU_FOLDER_ID_AQUI',
```

### 3. Deploy no GitHub Pages (5 min)
```bash
git add .
git commit -m "App Planurbi pronto"
git push origin main
```

Acessar: https://gigioband.github.io/coleta_foto/

---

## 📱 **COMO USAR NO CAMPO**

### 1. Abrir App
- Acessar URL no celular/tablet
- Fazer login com Google (primeira vez apenas)
- Permitir acesso à câmera e localização

### 2. Selecionar Imóvel
- Escolher inscrição no dropdown
- Ver detalhes e localização GPS
- Distância até o imóvel aparece automaticamente

### 3. Fotografar
- Clicar em "📷 FOTOGRAFAR"
- Câmera abre automaticamente (câmera traseira)
- Tirar foto
- Confirmar ou refazer

### 4. Upload Automático
- Foto enviada para Google Drive
- Nome: inscricao.jpg
- Progresso atualizado
- Próximo imóvel selecionado automaticamente

---

## 🎨 **DESIGN PLANURBI**

### Paleta de Cores:
- **Verde Escuro:** #00362D (principal)
- **Verde Médio:** #79928F (secundário)
- **Azul Claro:** #9EBAF2 (destaque)
- **Bege:** #E8D4B9 (fundos)
- **Cinza:** #B8BCBD (textos secundários)

### Componentes:
- Header com logo e status
- Cards com bordas arredondadas
- Botões com gradientes
- Progresso visual
- Toasts para notificações
- Loading overlays

---

## 📊 **DADOS DOS IMÓVEIS**

### Estatísticas:
- **Total:** 19 imóveis sem foto
- **Recanto:** 8 imóveis
- **Praia Bonita:** 8 imóveis
- **Arquipélago do Sol:** 3 imóveis

### Informações Incluídas:
- Inscrição imobiliária
- Bairro
- Quadra
- Logradouro
- Tipo (Edificação/Terreno)
- Latitude e Longitude (CORRIGIDAS!)

**Coordenadas GPS:**
✅ Lat/Long trocados e corrigidos
✅ Vírgula convertida para ponto
✅ 100% com GPS válido
✅ URLs Google Maps funcionais

---

## 🔧 **FUNCIONALIDADES TÉCNICAS**

### Camera API
- Acesso à câmera traseira
- Captura em alta resolução (1920x1080)
- Qualidade 92% (ajustável)
- Preview antes de enviar

### Geolocation API
- GPS de alta precisão
- Atualização contínua
- Cálculo de distância
- Link para Google Maps

### Google Drive API
- Upload multipart
- Nome automático (inscricao.jpg)
- Organização em pasta
- Retry automático se falhar

### LocalStorage
- Salva progresso localmente
- Persiste entre sessões
- Sincroniza com Drive
- Histórico de coletas

---

## 📱 **COMPATIBILIDADE**

### Navegadores:
- ✅ Chrome (Android/Desktop)
- ✅ Safari (iOS/Desktop)
- ✅ Firefox
- ✅ Edge

### Dispositivos:
- ✅ Smartphones (Android/iOS)
- ✅ Tablets
- ✅ Desktop (para testes)

### Requisitos:
- Câmera
- GPS
- Internet (para upload)
- Navegador moderno

---

## 🐛 **DEBUG**

### Console do Navegador (F12):
```javascript
// Ver estado completo do app
debugPlanurbi()

// Ver imóveis carregados
AppState.imoveis

// Ver progresso
AppState.coletados
```

### Problemas Comuns:

**Câmera não abre:**
- Verificar permissões do navegador
- Usar HTTPS (GitHub Pages já é)

**GPS não funciona:**
- Verificar permissões de localização
- Usar HTTPS

**Upload falha:**
- Verificar autenticação Google
- Ver console para erros
- Verificar DRIVE_FOLDER_ID

**Foto não aparece no Drive:**
- Verificar pasta correta
- Verificar permissões
- Aguardar alguns segundos

---

## 📈 **MÉTRICAS DE SUCESSO**

### Tempo Estimado:
- **Setup inicial:** 20 minutos
- **Por foto:** 20-40 segundos
- **Total (19 fotos):** 10-15 minutos em campo

### Qualidade:
- Fotos em alta resolução
- GPS preciso (3-10m)
- Nome organizado
- 100% rastreável

---

## 🔐 **SEGURANÇA E PRIVACIDADE**

- ✅ OAuth 2.0 (autenticação Google)
- ✅ Apenas você acessa seus dados
- ✅ Fotos no SEU Google Drive
- ✅ Sem servidor intermediário
- ✅ Código aberto (pode auditar)

---

## 📝 **LICENÇA**

Este projeto foi desenvolvido exclusivamente para Planurbi.

**© 2024 Planurbi - Todos os direitos reservados**

---

## 👥 **CRÉDITOS**

**Desenvolvido por:** Claude (Anthropic)  
**Para:** Planurbi - Sistema de Coleta Campo  
**Data:** Dezembro 2024  
**Versão:** 1.0.0  

---

## 📞 **SUPORTE**

### Antes de começar:
1. ✅ Ler `SETUP_GOOGLE_CLOUD.md` completamente
2. ✅ Testar com 1-2 imóveis primeiro
3. ✅ Verificar se fotos chegam no Drive

### Se tiver problemas:
1. Abrir console do navegador (F12)
2. Executar `debugPlanurbi()`
3. Verificar configurações em `js/config.js`
4. Revisar `SETUP_GOOGLE_CLOUD.md`

---

## 🎉 **PRONTO PARA USAR!**

O app está 100% funcional e pronto para validação em campo!

**Próximos passos:**
1. ✅ Configurar Google Cloud
2. ✅ Editar config.js
3. ✅ Deploy no GitHub
4. ✅ Testar com 2-3 imóveis
5. ✅ Usar em campo para os 19 imóveis

**Boa coleta! 📸🚀**
