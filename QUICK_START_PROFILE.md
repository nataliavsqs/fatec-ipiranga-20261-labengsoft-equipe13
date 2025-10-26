# 🚀 Guia Rápido - Feature de Perfil

## ⚡ Instalação Rápida

### Opção 1: Com Docker (Recomendado)

```bash
# 1. Parar containers existentes (se houver)
docker-compose down

# 2. Reconstruir e iniciar com as novas alterações
docker-compose up --build -d

# 3. Aguardar inicialização (30-60 segundos)
docker-compose logs -f app

# 4. Acessar
# Frontend: http://localhost:3000
# Perfil: http://localhost:3000/pages/profile.html
```

**✅ Pronto! A migração do banco será executada automaticamente.**

### Opção 2: Instalação Manual

```bash
# 1. Executar migração do banco de dados
cd server/config
./run-migration.sh
# Digite a senha do MySQL quando solicitado

# 2. Reiniciar servidor
npm start

# 3. Acessar
# Frontend: http://localhost:3000
# Perfil: http://localhost:3000/pages/profile.html
```

## 🎯 Como Usar

### 1. Acessar Página de Perfil

```
1. Faça login na aplicação
2. Clique no seu avatar (canto superior direito)
3. Selecione "Meu Perfil"
```

### 2. Editar Informações Pessoais

```
✏️ Informações Básicas:
- Clique na foto para alterar
- Preencha nome completo e nome de exibição
- Adicione telefone e data de nascimento
- Clique em "Salvar Alterações Pessoais"
```

### 3. Completar Perfil Profissional (Professores)

```
💼 Perfil Profissional:
- Defina seu título profissional
- Descreva sua experiência
- Selecione especialidades (clique nos cards)
- Configure valor por hora
- Adicione links profissionais
- Clique em "Salvar Informações Profissionais"
```

### 4. Alterar Senha

```
🔐 Configurações:
- Clique em "Alterar" na seção de senha
- Digite senha atual e nova senha
- Confirme nova senha
- Clique em "Alterar Senha"
```

## 📝 Checklist de Implementação

- [x] Banco de dados atualizado
- [x] Endpoints de API criados
- [x] Interface de usuário implementada
- [x] Validações front e back-end
- [x] Sistema de especialidades
- [x] Upload de foto de perfil
- [x] Alteração de senha
- [x] Docker configurado
- [x] Insomnia collection atualizada
- [x] Documentação completa

## 🧪 Testes Rápidos

### Teste 1: Visualizar Perfil
```bash
# API - Obter perfil
curl -X GET http://localhost:3001/api/users/profile \
  -H "Authorization: Bearer SEU_TOKEN"
```

### Teste 2: Atualizar Perfil
```bash
# API - Atualizar dados
curl -X PUT http://localhost:3001/api/users/profile \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva Atualizado",
    "displayName": "João Silva",
    "phone": "(11) 99999-9999"
  }'
```

### Teste 3: Listar Especialidades
```bash
# API - Listar especialidades
curl -X GET http://localhost:3001/api/specialties/list
```

## 🐛 Solução de Problemas

### Erro: "Tabela não existe"
```bash
# Execute a migração manualmente
mysql -u root -p brain_tutor < server/config/migrations/001_add_profile_fields.sql
```

### Erro: "Endpoint não encontrado"
```bash
# Reinicie o servidor
npm start
```

### Erro: "Token inválido"
```bash
# Faça login novamente para obter novo token
# POST /api/auth/login
```

## 📦 Arquivos Principais

```
brain-tutor/
├── client/pages/profile.html       # Interface do perfil
├── client/css/profile.css          # Estilos do perfil
├── client/js/profile.js            # Lógica do perfil
├── server/routes/users.js          # API atualizada
├── server/routes/specialties.js    # API de especialidades
└── server/config/migrations/       # Migração do BD
    └── 001_add_profile_fields.sql
```

## 🎨 Preview das Funcionalidades

### Upload de Foto
- Hover na foto mostra botão "Alterar imagem"
- Aceita JPG, PNG (máximo 2MB)
- Preview instantâneo

### Especialidades
- Cards visuais interativos
- Múltipla seleção
- Ícones para cada categoria

### Formulários
- Validação em tempo real
- Feedback visual de erros
- Salvamento independente (pessoal/profissional)

### Links Externos
- Campos com ícones das plataformas
- Validação de URL
- Opcional

## ⚙️ Variáveis de Ambiente

Se necessário, configure no arquivo `.env`:

```env
# Já existentes - não mexer
PORT=3001
DB_HOST=localhost
DB_NAME=brain_tutor
JWT_SECRET=seu_secret

# Não requer novas variáveis para esta feature
```

## 📞 Suporte

### Problemas Comuns

**Q: Foto não está sendo salva**
A: Verifique o tamanho (máx 2MB) e formato (JPG/PNG)

**Q: Especialidades não aparecem**
A: Execute a migração do banco de dados

**Q: Erro ao salvar perfil**
A: Verifique se está logado e token é válido

**Q: Docker não inicia**
A: `docker-compose down && docker-compose up --build`

## 🎉 Funcionalidades Adicionadas

✅ **Interface de Perfil Completa**
- Seção de informações pessoais
- Seção profissional para professores
- Configurações de conta

✅ **Sistema de Especialidades**
- 8 categorias padrão
- Seleção múltipla
- Ícones personalizados

✅ **Upload de Imagem**
- Drag & drop ready
- Validação de tipo e tamanho
- Preview instantâneo

✅ **Segurança**
- Alteração de senha segura
- Validações robustas
- JWT protegido

✅ **Links Profissionais**
- LinkedIn, GitHub, Portfólio
- Validação de URLs
- Ícones das plataformas

---

**🎊 Feature totalmente funcional e pronta para uso!**

Para documentação detalhada, consulte: `PROFILE_FEATURE.md`