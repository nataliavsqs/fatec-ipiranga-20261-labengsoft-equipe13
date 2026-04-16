# 👤 Feature: Página de Perfil de Professor

## 📋 Visão Geral

Implementação completa da funcionalidade de **Edição de Perfil** para usuários do Brain Tutor, com foco especial em professores. A feature permite que usuários editem suas informações pessoais e profissionais de forma intuitiva e organizada.

## ✨ Funcionalidades Implementadas

### 1. Informações Básicas
- ✅ Upload e alteração de foto de perfil
- ✅ Nome completo editável
- ✅ Nome de exibição personalizado
- ✅ Email (não editável, apenas visualização)
- ✅ Telefone com formatação automática
- ✅ Data de nascimento

### 2. Perfil Profissional (Apenas Professores)
- ✅ Título profissional personalizável
- ✅ Matéria principal
- ✅ Descrição/Bio com contador de caracteres (até 1000)
- ✅ Seleção de especialidades (checkboxes visuais)
- ✅ Formação acadêmica
- ✅ Anos de experiência
- ✅ Valor por hora
- ✅ Localização
- ✅ Disponibilidade de horários
- ✅ Links externos (LinkedIn, GitHub, Portfólio, Outros)

### 3. Configurações da Conta
- ✅ Alteração de senha com validação
- ✅ Modal dedicado para mudança de senha
- ✅ Placeholder para notificações (futuro)
- ✅ Placeholder para privacidade (futuro)

## 🗂️ Estrutura de Arquivos

### Frontend
```
client/
├── pages/
│   └── profile.html          # Página principal de perfil
├── css/
│   └── profile.css           # Estilos específicos da página
└── js/
    └── profile.js            # Lógica da página de perfil
```

### Backend
```
server/
├── routes/
│   ├── users.js              # Atualizado com novos endpoints
│   └── specialties.js        # Nova rota para especialidades
└── config/
    └── migrations/
        └── 001_add_profile_fields.sql  # Migração do BD
```

## 🔧 Alterações no Banco de Dados

### Novas Colunas na Tabela `users`
- `display_name` - Nome de exibição público
- `birth_date` - Data de nascimento
- `bio` - Biografia/descrição
- `linkedin_url` - URL do LinkedIn
- `github_url` - URL do GitHub
- `portfolio_url` - URL do portfólio
- `other_links` - Outros links

### Novas Colunas na Tabela `teachers`
- `professional_title` - Título profissional
- `specialties` - Especialidades (JSON)
- `availability_schedule` - Horários disponíveis
- `is_verified` - Flag de verificação
- `years_teaching` - Anos ensinando

### Novas Tabelas
```sql
-- Especialidades disponíveis
CREATE TABLE specialties (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    slug VARCHAR(100),
    icon VARCHAR(50)
);

-- Relacionamento professor-especialidade
CREATE TABLE teacher_specialties (
    teacher_id INT,
    specialty_id INT,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id),
    FOREIGN KEY (specialty_id) REFERENCES specialties(id)
);

-- Log de alterações (auditoria)
CREATE TABLE profile_change_log (
    id INT PRIMARY KEY,
    user_id INT,
    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    changed_at TIMESTAMP
);
```

## 🔌 Novos Endpoints da API

### Profile Management
```http
PUT /api/users/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "João Silva Santos",
  "displayName": "João Silva",
  "phone": "(11) 99999-9999",
  "birthDate": "1990-01-15",
  "profileImage": "data:image/jpeg;base64,...",
  "bio": "Professor experiente...",
  "linkedinUrl": "https://linkedin.com/in/joao",
  "githubUrl": "https://github.com/joao",
  "portfolioUrl": "https://joao.dev",
  "teacherInfo": {
    "professionalTitle": "Professor de Matemática",
    "subject": "Matemática",
    "description": "...",
    "education": "Mestrado em Matemática - USP",
    "experienceYears": 5,
    "hourlyRate": 85.00,
    "location": "São Paulo, SP",
    "availability": "Segunda a sexta, 8h-18h"
  },
  "specialties": [1, 2, 4]
}
```

### Change Password
```http
PUT /api/users/change-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "currentPassword": "senhaAtual123",
  "newPassword": "novaSenha456"
}
```

### Specialties
```http
GET /api/specialties/list
# Lista todas as especialidades disponíveis

GET /api/specialties/teacher/:teacherId
# Lista especialidades de um professor específico
```

## 🎨 Design e UX

### Layout Responsivo
- **Desktop**: Layout de 2 colunas com formulários lado a lado
- **Tablet**: Layout adaptativo com grid responsivo
- **Mobile**: Formulários em coluna única

### Componentes Visuais
1. **Upload de Foto**: Overlay ao hover com botão de alteração
2. **Especialidades**: Grid de cards com checkboxes customizados
3. **Links Externos**: Inputs com ícones das plataformas
4. **Contador de Caracteres**: Feedback visual em tempo real
5. **Validação de Formulários**: Feedback imediato de erros

### Cores e Estilo
- Segue o design system existente do Brain Tutor
- Gradiente primary: `#667eea` → `#764ba2`
- Estados visuais claros (hover, focus, disabled)
- Animações suaves em transições

## 🔒 Segurança

### Validações Backend
- ✅ Token JWT obrigatório
- ✅ Validação de tipos de dados
- ✅ Sanitização de inputs
- ✅ Verificação de senha atual antes de alterar
- ✅ Hash bcrypt para senhas
- ✅ Limite de tamanho para uploads

### Validações Frontend
- ✅ Campos obrigatórios marcados
- ✅ Validação de formato de email
- ✅ Validação de senha (mínimo 6 caracteres)
- ✅ Confirmação de senha
- ✅ Limite de caracteres em textarea
- ✅ Validação de formato de telefone
- ✅ Validação de URLs em links externos

## 📱 Como Usar

### Para Acessar
1. Faça login na aplicação
2. Clique no avatar no canto superior direito
3. Selecione "Meu Perfil" no dropdown
4. Será redirecionado para `/pages/profile.html`

### Para Professores
1. Preencha as **Informações Básicas** (obrigatório)
2. Complete o **Perfil Profissional** com seus dados acadêmicos
3. Selecione suas **Especialidades** clicando nos cards
4. Adicione links para **redes profissionais**
5. Clique em **"Salvar Informações Profissionais"**

### Para Alterar Senha
1. Na seção "Configurações da Conta"
2. Clique no botão "Alterar" ao lado de "Alterar Senha"
3. Digite a senha atual e a nova senha
4. Confirme a nova senha
5. Clique em "Alterar Senha"

## 🧪 Testes

### Insomnia Collection
Importe o arquivo `insomnia-profile-endpoints.json` para testar os novos endpoints:

```bash
# Endpoints adicionados:
- PUT /api/users/change-password
- GET /api/specialties/list
- GET /api/specialties/teacher/:id
```

### Testes Manuais
1. **Upload de Foto**: Testar com diferentes formatos e tamanhos
2. **Validação de Campos**: Tentar enviar formulários incompletos
3. **Alteração de Senha**: Testar senha incorreta e senhas não coincidentes
4. **Especialidades**: Selecionar/desselecionar múltiplas opções
5. **Responsividade**: Testar em diferentes tamanhos de tela

## 🚀 Instalação e Setup

### 1. Executar Migração do Banco de Dados
```bash
# Conectar ao MySQL
mysql -u root -p brain_tutor

# Executar migração
SOURCE server/config/migrations/001_add_profile_fields.sql;
```

### 2. Reiniciar Servidor
```bash
npm start
```

### 3. Acessar Página de Perfil
```
http://localhost:3000/pages/profile.html
```

## 📊 Dados de Exemplo

### Especialidades Padrão
- 🧮 Exatas
- 📚 Humanas  
- 🗣️ Linguagens
- 💻 Tecnologia
- 🎨 Artes
- 🔬 Ciências
- 🏃 Esportes
- 🎵 Música

## 🐛 Tratamento de Erros

### Frontend
- Toast notifications para feedback ao usuário
- Validação em tempo real dos formulários
- Estados de loading durante requisições
- Mensagens de erro específicas por campo

### Backend
- Try-catch em todas as rotas
- Logs detalhados no console
- Transações de banco para consistência
- Códigos HTTP apropriados

## 🔄 Estados da Aplicação

### Loading States
- ✅ Carregamento inicial da página
- ✅ Botões com spinner durante submissão
- ✅ Feedback visual durante upload de foto

### Success States
- ✅ Toast de sucesso após salvar
- ✅ Dados atualizados no estado local
- ✅ Formulário permanece preenchido

### Error States
- ✅ Toast de erro com mensagem específica
- ✅ Campos com erro destacados
- ✅ Botões reabilitados após erro

## 📈 Próximas Melhorias

### Curto Prazo
- [ ] Sistema de notificações por email após alterações
- [ ] Histórico de alterações no perfil
- [ ] Preview de perfil público antes de salvar
- [ ] Crop e resize de imagem antes de upload

### Médio Prazo
- [ ] Verificação de perfil de professor
- [ ] Badge de perfil verificado
- [ ] Estatísticas de visualizações do perfil
- [ ] Integração com calendário para disponibilidade

### Longo Prazo
- [ ] Sistema de conquistas e badges
- [ ] Importação de dados do LinkedIn
- [ ] Vídeo de apresentação no perfil
- [ ] Portfólio de trabalhos/certificados

## 💡 Boas Práticas Implementadas

- ✅ Código modular e reutilizável
- ✅ Comentários e documentação inline
- ✅ Nomenclatura consistente
- ✅ Tratamento robusto de erros
- ✅ Validações client-side e server-side
- ✅ Feedback visual para todas as ações
- ✅ Acessibilidade (labels, ARIA, navegação por teclado)
- ✅ Performance otimizada (debounce, lazy loading)
- ✅ Segurança (sanitização, validação, HTTPS ready)

## 🎯 Métricas de Sucesso

### Performance
- Tempo de carregamento < 2s
- Resposta da API < 200ms
- Upload de imagem < 5s

### Usabilidade
- Taxa de conclusão de perfil > 80%
- Tempo médio de preenchimento < 5min
- Taxa de erro em formulários < 5%

---

**✨ Feature implementada com sucesso e pronta para uso!**