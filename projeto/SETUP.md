# 🚀 Guia de Configuração - Brain Tutor

Este guia irá te ajudar a configurar e executar a aplicação Brain Tutor em seu ambiente local.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 16 ou superior) - [Download](https://nodejs.org/)
- **MySQL** (versão 8.0 ou superior) - [Download](https://dev.mysql.com/downloads/)
- **Docker** e **Docker Compose** (opcional, mas recomendado) - [Download](https://www.docker.com/)
- **Git** - [Download](https://git-scm.com/)

## 🛠️ Instalação

### Opção 1: Executar com Docker (Recomendado)

1. **Clone o repositório:**
```bash
git clone https://github.com/seu-usuario/brain-tutor.git
cd brain-tutor
```

2. **Execute com Docker Compose:**
```bash
docker-compose up -d
```

3. **Aguarde a inicialização** (pode levar alguns minutos na primeira vez)

4. **Acesse a aplicação:**
   - Frontend: http://localhost:3000
   - API: http://localhost:3001
   - Health Check: http://localhost:3001/health

### Opção 2: Instalação Manual

1. **Clone o repositório:**
```bash
git clone https://github.com/seu-usuario/brain-tutor.git
cd brain-tutor
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure o banco de dados MySQL:**

```sql
-- Conecte-se ao MySQL como root
mysql -u root -p

-- Crie o banco de dados
CREATE DATABASE brain_tutor;

-- Crie um usuário específico (opcional, mas recomendado)
CREATE USER 'braintutor'@'localhost' IDENTIFIED BY 'braintutor123';
GRANT ALL PRIVILEGES ON brain_tutor.* TO 'braintutor'@'localhost';
FLUSH PRIVILEGES;

-- Execute o script de inicialização
USE brain_tutor;
SOURCE server/config/init.sql;
```

4. **Configure as variáveis de ambiente:**
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env com suas configurações
# Especialmente: DB_HOST, DB_USER, DB_PASSWORD, EMAIL_*
```

5. **Inicie o servidor:**
```bash
npm start
```

6. **Sirva os arquivos do frontend:**

Para desenvolvimento, você pode usar qualquer servidor HTTP simples:

```bash
# Usando Python 3
cd client
python -m http.server 3000

# Ou usando Node.js (instale globalmente: npm install -g http-server)
cd client
http-server -p 3000

# Ou usando PHP
cd client
php -S localhost:3000
```

## ⚙️ Configuração

### Variáveis de Ambiente

Edite o arquivo `.env` com suas configurações:

```env
# Configurações do Servidor
PORT=3001
NODE_ENV=development

# Configurações do Banco de Dados
DB_HOST=localhost
DB_PORT=3306
DB_NAME=brain_tutor
DB_USER=braintutor
DB_PASSWORD=braintutor123

# JWT Secret (use uma chave forte em produção)
JWT_SECRET=sua_chave_jwt_super_segura_aqui

# Configurações de Email (recomendado: Mailtrap para desenvolvimento)
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=seu_usuario_mailtrap
EMAIL_PASS=sua_senha_mailtrap

# URLs da aplicação
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001
```

### Configuração de Email

Para desenvolvimento, recomendamos usar [Mailtrap](https://mailtrap.io/):

1. Crie uma conta gratuita no Mailtrap
2. Crie um inbox
3. Copie as credenciais SMTP para o arquivo `.env`

Para produção, você pode usar serviços como:
- **Gmail** (com App Password)
- **SendGrid**
- **Amazon SES**
- **Mailgun**

## 🧪 Testando a API

### Com Insomnia

1. **Importe a collection:**
   - Abra o Insomnia
   - Clique em "Import/Export" → "Import Data"
   - Selecione o arquivo `insomnia-collection.json`

2. **Configure o environment:**
   - `base_url`: http://localhost:3001 (ou sua URL da API)
   - `auth_token`: (será preenchido após o login)

3. **Teste os endpoints:**
   - Comece com "Register User" ou "Register Teacher"
   - Depois faça "Login" para obter o token
   - Copie o token da resposta e cole na variável `auth_token`
   - Agora pode testar os endpoints autenticados

### Usuários de Exemplo

Após executar o script de inicialização, você terá estes usuários:

**Professor - Samira Alves:**
- Email: `samira@email.com`
- Senha: `password` (hash bcrypt no banco)
- Matéria: Matemática
- Valor: R$ 90,00/hora

**Estudante - João Silva:**
- Email: `joao@email.com`  
- Senha: `password` (hash bcrypt no banco)

> **Nota:** Para criar novos usuários, use os endpoints de registro ou atualize as senhas no banco de dados.

## 🔧 Comandos Úteis

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm start

# Executar com nodemon (reinicia automaticamente)
npm run dev

# Executar testes (quando implementados)
npm test

# Docker - construir e executar
docker-compose up --build

# Docker - executar em background
docker-compose up -d

# Docker - parar containers
docker-compose down

# Docker - ver logs
docker-compose logs -f

# Docker - reconstruir apenas o app
docker-compose up --build app
```

## 📊 Estrutura do Banco de Dados

```sql
-- Principais tabelas
users          # Dados básicos dos usuários
teachers       # Dados específicos dos professores  
students       # Dados específicos dos estudantes
sessions       # Aulas agendadas/realizadas
reviews        # Avaliações dos professores
```

## 🌐 URLs da Aplicação

**Desenvolvimento:**
- Frontend: http://localhost:3000
- API: http://localhost:3001
- Health Check: http://localhost:3001/health

**Docker:**
- Frontend: http://localhost:3000 (Nginx)
- API: http://localhost:3001 (Node.js)
- MySQL: localhost:3306

## 🔍 Solução de Problemas

### Erro de Conexão com Banco de Dados

```bash
# Verifique se o MySQL está rodando
sudo systemctl status mysql

# Ou se estiver usando Docker
docker-compose ps

# Teste a conexão manualmente
mysql -h localhost -u braintutor -p brain_tutor
```

### Porta já em uso

```bash
# Encontrar processo usando a porta
lsof -i :3001
lsof -i :3000

# Matar processo se necessário
kill -9 PID_DO_PROCESSO
```

### Problemas com CORS

Se estiver com problemas de CORS, verifique:
1. Se o `FRONTEND_URL` está correto no `.env`
2. Se o servidor está configurado corretamente para aceitar requisições do frontend

### Email não está funcionando

1. Verifique as configurações de SMTP no `.env`
2. Para desenvolvimento, use Mailtrap ou similar
3. Para Gmail, use App Passwords em vez da senha normal

## 📱 Recursos Implementados

✅ **Autenticação completa**
- Registro de usuários (estudante/professor)
- Login/logout
- Recuperação de senha por email
- Validação JWT

✅ **Gestão de professores**
- Listagem com filtros e busca
- Paginação
- Detalhes do professor
- Sistema de avaliações

✅ **Interface responsiva**
- Design moderno e intuitivo
- Compatível com desktop e mobile
- Modais e componentes interativos

✅ **API RESTful**
- Endpoints organizados
- Validações robustas
- Tratamento de erros

## 🚧 Próximos Passos

- [ ] Sistema de agendamento completo
- [ ] Dashboard para professores e estudantes
- [ ] Chat entre usuários
- [ ] Sistema de pagamentos
- [ ] Notificações push
- [ ] Upload de arquivos/fotos
- [ ] Relatórios e analytics

## 📞 Suporte

Se encontrar problemas:

1. Verifique este guia de setup
2. Consulte os logs da aplicação
3. Teste com a collection do Insomnia
4. Abra uma issue no GitHub

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

---

**Desenvolvido com ❤️ para revolucionar a educação particular**