# 🔐 SETUP GOOGLE CLOUD - PASSO A PASSO

Este guia te ajudará a configurar o Google Cloud para o app Planurbi.

---

## 📋 **O QUE VOCÊ VAI FAZER:**

1. Criar projeto no Google Cloud
2. Ativar Google Drive API
3. Criar credenciais OAuth 2.0
4. Criar pasta no Google Drive
5. Configurar o app

**Tempo estimado:** 15-20 minutos

---

## 1️⃣ **CRIAR PROJETO NO GOOGLE CLOUD**

### Passo 1: Acessar Google Cloud Console
👉 Ir para: https://console.cloud.google.com

### Passo 2: Criar Novo Projeto
1. Clicar em **"Selecionar projeto"** (topo da página)
2. Clicar em **"NOVO PROJETO"**
3. Nome do projeto: **"Planurbi Coleta Campo"**
4. Clicar em **"CRIAR"**
5. Aguardar criação (15-30 segundos)
6. ✅ Projeto criado!

---

## 2️⃣ **ATIVAR GOOGLE DRIVE API**

### Passo 1: Acessar Biblioteca de APIs
1. No menu lateral (☰), ir em: **"APIs e serviços"** → **"Biblioteca"**
2. Ou acessar: https://console.cloud.google.com/apis/library

### Passo 2: Buscar e Ativar
1. Buscar: **"Google Drive API"**
2. Clicar no resultado
3. Clicar em **"ATIVAR"**
4. Aguardar ativação
5. ✅ API ativada!

---

## 3️⃣ **CRIAR CREDENCIAIS OAuth 2.0**

### Passo 1: Configurar Tela de Consentimento
1. No menu lateral, ir em: **"APIs e serviços"** → **"Tela de consentimento OAuth"**
2. Escolher: **"Externo"**
3. Clicar em **"CRIAR"**

**Informações do app:**
- Nome do app: `Planurbi Coleta Campo`
- E-mail de suporte ao usuário: `seu@email.com`
- Logo do app: (pode pular)
- Domínio do app: `gigioband.github.io`
- E-mail do desenvolvedor: `seu@email.com`

4. Clicar em **"SALVAR E CONTINUAR"**

**Escopos:**
5. Clicar em **"ADICIONAR OU REMOVER ESCOPOS"**
6. Buscar: `drive.file`
7. Selecionar: `https://www.googleapis.com/auth/drive.file`
8. Clicar em **"ATUALIZAR"**
9. Clicar em **"SALVAR E CONTINUAR"**

**Usuários de teste:**
10. Clicar em **"+ ADICIONAR USUÁRIOS"**
11. Adicionar seu email (e de outros coletores)
12. Clicar em **"ADICIONAR"**
13. Clicar em **"SALVAR E CONTINUAR"**
14. Clicar em **"VOLTAR PARA O PAINEL"**
15. ✅ Tela de consentimento configurada!

### Passo 2: Criar Credenciais OAuth
1. No menu lateral, ir em: **"APIs e serviços"** → **"Credenciais"**
2. Clicar em **"+ CRIAR CREDENCIAIS"** (topo)
3. Selecionar: **"ID do cliente OAuth"**

**Configuração:**
- Tipo de aplicativo: **"Aplicativo da Web"**
- Nome: `Planurbi Web App`

**Origens JavaScript autorizadas:**
4. Clicar em **"+ ADICIONAR URI"**
5. Adicionar: `https://gigioband.github.io`

**URIs de redirecionamento autorizados:**
6. Clicar em **"+ ADICIONAR URI"**
7. Adicionar: `https://gigioband.github.io/coleta_foto`

8. Clicar em **"CRIAR"**

### Passo 3: Copiar Client ID
9. Aparecerá um popup com:
   - **ID do cliente:** `1234567890-abc123...apps.googleusercontent.com`
   - Código secreto do cliente: (não precisa)

10. **COPIAR O ID DO CLIENTE** (você vai precisar!)
11. ✅ Credenciais criadas!

---

## 4️⃣ **CRIAR PASTA NO GOOGLE DRIVE**

### Passo 1: Acessar Google Drive
👉 Ir para: https://drive.google.com

### Passo 2: Criar Pasta
1. Clicar em **"+ Novo"** → **"Nova pasta"**
2. Nome: **"COLETA_CAMPO_2024"**
3. Clicar em **"CRIAR"**

### Passo 3: Copiar ID da Pasta
4. Abrir a pasta criada (duplo clique)
5. Olhar a URL no navegador:
   ```
   https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i0j
   ```
6. **COPIAR O ID:** `1a2b3c4d5e6f7g8h9i0j`
   (É a parte após `/folders/`)

7. ✅ Pasta criada e ID copiado!

---

## 5️⃣ **CONFIGURAR O APP**

### Passo 1: Editar config.js
1. Abrir o arquivo: `js/config.js`
2. Localizar a linha:
   ```javascript
   GOOGLE_CLIENT_ID: 'SEU_CLIENT_ID_AQUI.apps.googleusercontent.com',
   ```
3. **SUBSTITUIR** por:
   ```javascript
   GOOGLE_CLIENT_ID: 'COLE_O_CLIENT_ID_AQUI',
   ```

4. Localizar a linha:
   ```javascript
   DRIVE_FOLDER_ID: 'SEU_FOLDER_ID_AQUI',
   ```
5. **SUBSTITUIR** por:
   ```javascript
   DRIVE_FOLDER_ID: 'COLE_O_FOLDER_ID_AQUI',
   ```

### Exemplo final:
```javascript
const CONFIG = {
    GOOGLE_CLIENT_ID: '1234567890-abc123def456.apps.googleusercontent.com',
    DRIVE_FOLDER_ID: '1a2b3c4d5e6f7g8h9i0j',
    // ... resto das configurações
};
```

6. **SALVAR** o arquivo
7. ✅ App configurado!

---

## 6️⃣ **FAZER DEPLOY NO GITHUB PAGES**

### Passo 1: Subir Arquivos
1. Fazer commit de todos os arquivos:
   ```bash
   git add .
   git commit -m "Setup inicial do app Planurbi"
   git push origin main
   ```

### Passo 2: Verificar GitHub Pages
1. Ir no repositório: https://github.com/gigioband/coleta_foto
2. Ir em **Settings** → **Pages**
3. Verificar se está ativo em: `gigioband.github.io/coleta_foto/`

### Passo 3: Testar
4. Acessar: https://gigioband.github.io/coleta_foto/
5. ✅ App online!

---

## ✅ **CHECKLIST FINAL**

Antes de usar em campo, verificar:

- [ ] Google Cloud projeto criado
- [ ] Google Drive API ativada
- [ ] OAuth 2.0 configurado
- [ ] Pasta no Drive criada
- [ ] Client ID copiado e colado no config.js
- [ ] Folder ID copiado e colado no config.js
- [ ] Arquivo config.js salvo
- [ ] Deploy no GitHub Pages feito
- [ ] App acessível na URL
- [ ] Testado login no Google
- [ ] Testado tirar foto
- [ ] Testado upload (1 foto de teste)
- [ ] Foto apareceu no Drive na pasta correta
- [ ] Nome do arquivo correto (inscricao.jpg)

---

## 🚨 **PROBLEMAS COMUNS**

### Erro: "redirect_uri_mismatch"
**Solução:** Verificar se as URIs no Google Cloud batem exatamente:
- `https://gigioband.github.io`
- `https://gigioband.github.io/coleta_foto`

### Erro: "Access blocked"
**Solução:** Adicionar seu email como "usuário de teste" na tela de consentimento

### Erro: "Folder not found"
**Solução:** Verificar se o DRIVE_FOLDER_ID está correto

### Foto não aparece no Drive
**Solução:** 
1. Verificar pasta no Drive
2. Ver console do navegador (F12) para erros
3. Verificar permissões da pasta

---

## 📞 **SUPORTE**

Se tiver problemas:
1. Verificar console do navegador (F12)
2. Executar `debugPlanurbi()` no console
3. Verificar passo a passo deste guia

---

## 🎉 **PRONTO!**

App configurado e pronto para usar!

**Próximos passos:**
1. Testar com 1-2 imóveis
2. Verificar se fotos chegam no Drive
3. Usar em campo para os 19 imóveis

Boa coleta! 📸🚀
