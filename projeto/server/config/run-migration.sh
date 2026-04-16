#!/bin/bash

# Script para executar migração do banco de dados
# Brain Tutor - Profile Feature

echo "🚀 Brain Tutor - Executando Migração do Banco de Dados"
echo "=================================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se MySQL está instalado
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}❌ MySQL não está instalado ou não está no PATH${NC}"
    exit 1
fi

# Configurações do banco de dados (pode sobrescrever com variáveis de ambiente)
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_NAME=${DB_NAME:-brain_tutor}
DB_USER=${DB_USER:-root}

echo -e "${YELLOW}📊 Configurações:${NC}"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# Solicitar senha do MySQL
echo -e "${YELLOW}🔐 Digite a senha do MySQL para o usuário $DB_USER:${NC}"
read -s DB_PASSWORD
echo ""

# Teste de conexão
echo -e "${YELLOW}🔍 Testando conexão com o banco de dados...${NC}"
if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME;" 2>/dev/null; then
    echo -e "${GREEN}✅ Conexão bem-sucedida!${NC}"
else
    echo -e "${RED}❌ Erro ao conectar com o banco de dados${NC}"
    echo -e "${RED}   Verifique as credenciais e se o banco '$DB_NAME' existe${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📝 Executando migração 001_add_profile_fields.sql...${NC}"

# Executar migração
if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$(dirname "$0")/migrations/001_add_profile_fields.sql" 2>/dev/null; then
    echo -e "${GREEN}✅ Migração executada com sucesso!${NC}"
else
    echo -e "${RED}❌ Erro ao executar migração${NC}"
    echo -e "${YELLOW}   A migração pode já ter sido executada anteriormente${NC}"
    echo -e "${YELLOW}   Ou pode haver erro no arquivo SQL${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Migração concluída!${NC}"
echo ""
echo -e "${YELLOW}📋 Próximos passos:${NC}"
echo "  1. Reinicie o servidor Node.js: npm start"
echo "  2. Acesse a página de perfil: http://localhost:3000/pages/profile.html"
echo "  3. Teste as novas funcionalidades"
echo ""
echo -e "${GREEN}✨ Tudo pronto para usar a nova feature de Perfil!${NC}"