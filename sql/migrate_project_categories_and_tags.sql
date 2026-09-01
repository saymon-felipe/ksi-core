-- ==============================================================================
-- MIGRAÇÃO DE TAXONOMIAS: CATEGORIAS E TAGS DE PROJETOS KSI
-- Criação de tabelas, extração das categorias existentes e vinculação automática.
-- ==============================================================================

-- 1. Criação da tabela de categorias de projetos
CREATE TABLE IF NOT EXISTS `portfolio_categorias` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(120) NOT NULL,
  `slug` VARCHAR(120) NOT NULL UNIQUE,
  `descricao` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_portfolio_categoria_nome` (`nome`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Criação da tabela de tags padronizadas de projetos
CREATE TABLE IF NOT EXISTS `portfolio_tags` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `cor` VARCHAR(30) DEFAULT '#38bdf8',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_portfolio_tag_nome` (`nome`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Adiciona a coluna categoria_id na tabela portfolio_projetos se não existir
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'portfolio_projetos' 
  AND COLUMN_NAME = 'categoria_id';

SET @stmt = IF(@col_exists = 0, 'ALTER TABLE `portfolio_projetos` ADD COLUMN `categoria_id` INT(11) DEFAULT NULL AFTER `categoria`;', 'SELECT 1;');
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Migra todas as categorias distintas existentes nos projetos
INSERT INTO `portfolio_categorias` (`nome`, `slug`, `descricao`)
SELECT 
  TRIM(categoria) AS nome,
  LOWER(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(TRIM(categoria), ' & ', '-'),
              ' / ', '-'),
            ' ', '-'),
          'á', 'a'),
        'é', 'e'),
      'í', 'i'),
    'ó', 'o')
  ) AS slug,
  CONCAT('Categoria para projetos de ', TRIM(categoria)) AS descricao
FROM `portfolio_projetos`
WHERE `categoria` IS NOT NULL AND TRIM(`categoria`) != ''
GROUP BY TRIM(categoria)
ON DUPLICATE KEY UPDATE `nome` = VALUES(`nome`);

-- 5. Atualiza o relacionamento (categoria_id) sem conflito de collations
UPDATE `portfolio_projetos` p
JOIN `portfolio_categorias` c 
  ON p.categoria COLLATE utf8mb4_general_ci = c.nome COLLATE utf8mb4_general_ci
SET p.categoria_id = c.id;

-- 6. Criação de índice para otimização de busca por categoria
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists 
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'portfolio_projetos' 
  AND INDEX_NAME = 'idx_portfolio_categoria_id';

SET @stmt_idx = IF(@idx_exists = 0, 'ALTER TABLE `portfolio_projetos` ADD INDEX `idx_portfolio_categoria_id` (`categoria_id`);', 'SELECT 1;');
PREPARE stmt_idx FROM @stmt_idx;
EXECUTE stmt_idx;
DEALLOCATE PREPARE stmt_idx;