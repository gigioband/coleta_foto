# ⚡ DEPLOY RÁPIDO - 5 MINUTOS

## 🎯 **OBJETIVO:**
Colocar o app Planurbi no ar em https://gigioband.github.io/coleta_foto/

---

## 📦 **PASSO 1: EXTRAIR ARQUIVOS**

1. Baixar o arquivo: `planurbi-coleta-app.zip`
2. Extrair tudo para uma pasta
3. ✅ Você terá esta estrutura:

```
planurbi-coleta-app/
├── index.html
├── manifest.json
├── README.md
├── SETUP_GOOGLE_CLOUD.md
├── DEPLOY_RAPIDO.md (este arquivo)
├── assets/
│   ├── logo.png
│   └── paleta.jpg
├── css/
│   └── styles.css
├── data/
│   └── imoveis.json
└── js/
    ├── app.js
    └── config.js
```

---

## 🔐 **PASSO 2: CONFIGURAR GOOGLE CLOUD** (15 min)

📖 **Abrir e seguir:** `SETUP_GOOGLE_CLOUD.md`

Resumo:
1. Criar projeto no Google Cloud Console
2. Ativar Google Drive API
3. Criar credenciais OAuth 2.0
4. Copiar **Client ID**
5. Criar pasta no Google Drive
6. Copiar **Folder ID**

---

## ⚙️ **PASSO 3: EDITAR CONFIG.JS** (1 min)

Abrir: `js/config.js`

Substituir:
```javascript
GOOGLE_CLIENT_ID: 'SEU_CLIENT_ID_AQUI.apps.googleusercontent.com',
DRIVE_FOLDER_ID: 'SEU_FOLDER_ID_AQUI',
```

Por:
```javascript
GOOGLE_CLIENT_ID: 'COLAR_CLIENT_ID_DO_GOOGLE_CLOUD',
DRIVE_FOLDER_ID: 'COLAR_FOLDER_ID_DO_DRIVE',
```

**SALVAR O ARQUIVO!**

---

## 📤 **PASSO 4: FAZER DEPLOY NO GITHUB** (3 min)

### Opção A: GitHub Web (Mais Fácil)

1. Ir para: https://github.com/gigioband/coleta_foto
2. Clicar em "Add file" → "Upload files"
3. Arrastar TODOS os arquivos da pasta `planurbi-coleta-app`
4. Commit message: `App Planurbi - Deploy inicial`
5. Clicar em "Commit changes"
6. ✅ Pronto!

### Opção B: Git Command Line

```bash
cd planurbi-coleta-app

# Inicializar git se necessário
git init
git remote add origin https://github.com/gigioband/coleta_foto.git

# Adicionar arquivos
git add .
git commit -m "App Planurbi - Deploy inicial"

# Push para GitHub
git push -u origin main
```

---

## ✅ **PASSO 5: ATIVAR GITHUB PAGES** (1 min)

1. Ir para: https://github.com/gigioband/coleta_foto
2. Clicar em "Settings"
3. No menu lateral, clicar em "Pages"
4. Em "Source", selecionar:
   - Branch: `main`
   - Folder: `/ (root)`
5. Clicar em "Save"
6. Aguardar 1-2 minutos
7. ✅ App disponível em: https://gigioband.github.io/coleta_foto/

---

## 🧪 **PASSO 6: TESTAR** (5 min)

1. Abrir no celular: https://gigioband.github.io/coleta_foto/
2. Fazer login com Google
3. Permitir acesso câmera/localização
4. Selecionar 1 imóvel de teste
5. Tirar foto
6. Confirmar e enviar
7. Verificar no Google Drive se chegou
8. ✅ Se chegou: TUDO OK! 🎉

---

## 🐛 **PROBLEMAS COMUNS:**

### ❌ "redirect_uri_mismatch"
**Solução:** No Google Cloud Console:
- Verificar URIs autorizadas:
  - `https://gigioband.github.io`
  - `https://gigioband.github.io/coleta_foto`

### ❌ Página não carrega
**Solução:**
- Aguardar 2-3 minutos após ativar Pages
- Verificar se branch está como `main`
- Limpar cache do navegador (Ctrl+Shift+R)

### ❌ Foto não sobe para Drive
**Solução:**
- Verificar se config.js foi editado
- Verificar FOLDER_ID está correto
- Abrir console do navegador (F12) e ver erros

---

## 📱 **USAR NO CAMPO:**

1. Abrir: https://gigioband.github.io/coleta_foto/
2. Login Google (primeira vez)
3. Selecionar imóvel
4. Fotografar
5. Confirmar
6. ✅ Próximo!

**Tempo por foto:** 20-40 segundos  
**Total (19 fotos):** 10-15 minutos

---

## 🎉 **PRONTO!**

Seu app está no ar e funcionando!

**Links importantes:**
- 🌐 App: https://gigioband.github.io/coleta_foto/
- 📁 GitHub: https://github.com/gigioband/coleta_foto
- ☁️ Drive: [Sua pasta COLETA_CAMPO_2024]

**Dúvidas?**
- Ler `README.md` completo
- Ler `SETUP_GOOGLE_CLOUD.md` detalhado
- Executar `debugPlanurbi()` no console (F12)

**Boa coleta! 📸🚀**
