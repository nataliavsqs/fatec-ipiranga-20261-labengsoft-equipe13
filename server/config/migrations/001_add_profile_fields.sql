-- Adicionar novos campos para perfil de professor
-- Executar após init.sql

-- Adicionar campos na tabela users
ALTER TABLE users 
ADD COLUMN display_name VARCHAR(255) AFTER name,
ADD COLUMN birth_date DATE AFTER phone,
ADD COLUMN bio TEXT AFTER profile_image,
ADD COLUMN linkedin_url VARCHAR(500) AFTER bio,
ADD COLUMN github_url VARCHAR(500) AFTER linkedin_url,
ADD COLUMN portfolio_url VARCHAR(500) AFTER github_url,
ADD COLUMN other_links TEXT AFTER portfolio_url;

-- Expandir campo para suportar imagens em base64 (Data URL)
ALTER TABLE users
MODIFY COLUMN profile_image LONGTEXT;

-- Adicionar campos na tabela teachers
ALTER TABLE teachers
ADD COLUMN professional_title VARCHAR(255) AFTER subject,
ADD COLUMN specialties TEXT AFTER description,
ADD COLUMN availability_schedule TEXT AFTER availability,
ADD COLUMN is_verified BOOLEAN DEFAULT FALSE AFTER is_active,
ADD COLUMN years_teaching INT DEFAULT 0 AFTER experience_years;

-- Criar tabela para especialidades (categorias)
CREATE TABLE IF NOT EXISTS specialties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de relacionamento many-to-many para teacher_specialties
CREATE TABLE IF NOT EXISTS teacher_specialties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    specialty_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (specialty_id) REFERENCES specialties(id) ON DELETE CASCADE,
    UNIQUE KEY unique_teacher_specialty (teacher_id, specialty_id)
);

-- Inserir especialidades padrão
INSERT INTO specialties (name, slug, icon) VALUES
('Exatas', 'exatas', 'fas fa-calculator'),
('Humanas', 'humanas', 'fas fa-book'),
('Linguagens', 'linguagens', 'fas fa-language'),
('Tecnologia', 'tecnologia', 'fas fa-laptop-code'),
('Artes', 'artes', 'fas fa-palette'),
('Ciências', 'ciencias', 'fas fa-flask'),
('Esportes', 'esportes', 'fas fa-running'),
('Música', 'musica', 'fas fa-music');

-- Criar tabela para histórico de alterações de perfil (auditoria)
CREATE TABLE IF NOT EXISTS profile_change_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_changes (user_id, changed_at)
);

-- Atualizar dados existentes com valores padrão
UPDATE users SET display_name = name WHERE display_name IS NULL;
UPDATE teachers SET professional_title = CONCAT('Professor(a) de ', subject) WHERE professional_title IS NULL;

-- Criar índices para melhor performance
CREATE INDEX idx_users_display_name ON users(display_name);
CREATE INDEX idx_teachers_professional_title ON teachers(professional_title);
CREATE INDEX idx_teachers_verified ON teachers(is_verified);

COMMIT;