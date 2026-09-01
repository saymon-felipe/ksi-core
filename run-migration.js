const mysql = require('mysql');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de nodemon.json se existirem
let envConfig = {};
try {
  const nodemonJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'nodemon.json'), 'utf8'));
  if (nodemonJson.env) {
    envConfig = nodemonJson.env;
  }
} catch (e) {
  console.log('Nodemon config não carregado:', e.message);
}

const pool = mysql.createPool({
  user: process.env.MYSQL_USER || envConfig.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || envConfig.MYSQL_PASSWORD || 'root',
  database: process.env.MYSQL_DATABASE || envConfig.MYSQL_DATABASE || 'ksi_db',
  host: process.env.MYSQL_HOST || envConfig.MYSQL_HOST || 'localhost',
  port: process.env.MYSQL_PORT || envConfig.MYSQL_PORT || 3306,
  connectionLimit: 4,
  multipleStatements: true,
  timezone: '-03:00'
});

const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
};

async function run() {
  console.log('--- INICIANDO MIGRAÇÃO DE CATEGORIAS E PROJETOS ---');
  try {
    // 1. Criar tabela de categorias se não existir
    console.log('1. Criando tabela portfolio_categorias...');
    await query(`
      CREATE TABLE IF NOT EXISTS portfolio_categorias (
        id INT(11) NOT NULL AUTO_INCREMENT,
        nome VARCHAR(120) NOT NULL,
        slug VARCHAR(120) NOT NULL UNIQUE,
        descricao TEXT DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_portfolio_categoria_nome (nome)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Criar tabela de tags se não existir
    console.log('2. Criando tabela portfolio_tags...');
    await query(`
      CREATE TABLE IF NOT EXISTS portfolio_tags (
        id INT(11) NOT NULL AUTO_INCREMENT,
        nome VARCHAR(100) NOT NULL,
        slug VARCHAR(100) NOT NULL UNIQUE,
        cor VARCHAR(30) DEFAULT '#38bdf8',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_portfolio_tag_nome (nome)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. Verificar coluna categoria_id na tabela portfolio_projetos
    console.log('3. Verificando coluna categoria_id em portfolio_projetos...');
    const columns = await query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'portfolio_projetos' 
        AND COLUMN_NAME = 'categoria_id';
    `);

    if (columns.length === 0) {
      console.log('   Adicionando coluna categoria_id em portfolio_projetos...');
      await query(`
        ALTER TABLE portfolio_projetos 
        ADD COLUMN categoria_id INT(11) DEFAULT NULL AFTER categoria;
      `);
    }

    // 4. Buscar todas as categorias distintas existentes hoje em portfolio_projetos
    console.log('4. Extraindo categorias existentes dos projetos...');
    const existingCats = await query(`
      SELECT DISTINCT TRIM(categoria) AS nome 
      FROM portfolio_projetos 
      WHERE categoria IS NOT NULL AND TRIM(categoria) != '';
    `);

    console.log('   Categorias encontradas:', existingCats.map(c => c.nome));

    const slugify = (text) => {
      return text
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    };

    // 5. Inserir as categorias distintas na tabela portfolio_categorias
    for (const cat of existingCats) {
      const catName = cat.nome;
      const catSlug = slugify(catName);
      await query(`
        INSERT INTO portfolio_categorias (nome, slug)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE nome = VALUES(nome);
      `, [catName, catSlug]);
    }

    // 6. Atualizar a vinculação (categoria_id) nos projetos
    console.log('5. Atualizando vinculação de categoria_id nos projetos...');
    await query(`
      UPDATE portfolio_projetos p
      JOIN portfolio_categorias c ON p.categoria COLLATE utf8mb4_general_ci = c.nome COLLATE utf8mb4_general_ci
      SET p.categoria_id = c.id;
    `);

    // 7. Seed de tags comuns encontradas nos projetos
    console.log('6. Sincronizando tags dos projetos...');
    const projects = await query(`SELECT tags FROM portfolio_projetos WHERE tags IS NOT NULL`);
    const allTags = new Set();
    for (const p of projects) {
      try {
        const parsed = typeof p.tags === 'string' && p.tags.startsWith('[') ? JSON.parse(p.tags) : p.tags.split(',');
        if (Array.isArray(parsed)) {
          parsed.forEach(t => {
            const clean = String(t).trim();
            if (clean) allTags.add(clean);
          });
        }
      } catch (_) {}
    }

    const defaultTagColors = {
      'React': '#38bdf8',
      'TypeScript': '#3b82f6',
      'Node.js': '#22c55e',
      'Next.js': '#ffffff',
      'Python': '#eab308',
      'AWS': '#f97316',
      'TailwindCSS': '#06b6d4',
      'Docker': '#0ea5e9',
      'PostgreSQL': '#6366f1',
      'GraphQL': '#ec4899',
      'UI/UX': '#a855f7',
      'Mobile': '#10b981',
      'SaaS': '#14b8a6',
      'Cloud': '#38bdf8',
      'EdTech': '#ec4899',
      'ERP Corporativo': '#3b82f6',
      'Food Service': '#f97316',
      'Gaming & E-sports': '#a855f7'
    };

    for (const tagName of allTags) {
      const tagSlug = slugify(tagName);
      const color = defaultTagColors[tagName] || '#38bdf8';
      await query(`
        INSERT INTO portfolio_tags (nome, slug, cor)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE nome = VALUES(nome);
      `, [tagName, tagSlug, color]);
    }

    // 8. Relatório final de verificação
    console.log('\n--- RELATÓRIO DE MIGRAÇÃO CONCLUÍDA COM SUCESSO ---');
    const totalCats = await query(`SELECT id, nome, slug FROM portfolio_categorias ORDER BY id`);
    console.log('Categorias cadastradas no banco:');
    console.table(totalCats);

    const totalTags = await query(`SELECT id, nome, slug, cor FROM portfolio_tags ORDER BY id LIMIT 15`);
    console.log('Amostra de Tags cadastradas no banco:');
    console.table(totalTags);

    const linkedProjects = await query(`
      SELECT p.id, p.titulo, p.categoria, p.categoria_id, c.nome AS categoria_nome_vinculada
      FROM portfolio_projetos p
      LEFT JOIN portfolio_categorias c ON p.categoria_id = c.id
      ORDER BY p.id
    `);
    console.log('Projetos vinculados às novas categorias:');
    console.table(linkedProjects);

    pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Erro na migração:', error);
    pool.end();
    process.exit(1);
  }
}

run();
