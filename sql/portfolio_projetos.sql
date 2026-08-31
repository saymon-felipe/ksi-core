-- Execute este arquivo uma vez no banco de produção antes de publicar a nova API.
-- A carga inicial só ocorre se ainda não houver projetos cadastrados.
CREATE TABLE IF NOT EXISTS `portfolio_projetos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) NOT NULL,
  `categoria` varchar(120) NOT NULL,
  `descricao` text NOT NULL,
  `imagem_url` varchar(1000) NOT NULL,
  `imagem_key` varchar(1000) DEFAULT NULL,
  `link` varchar(1000) DEFAULT NULL,
  `tags` longtext NOT NULL,
  `publicado` tinyint(1) NOT NULL DEFAULT 1,
  `ordem` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_portfolio_publicado_ordem` (`publicado`, `ordem`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

INSERT INTO `portfolio_projetos` (`titulo`, `categoria`, `descricao`, `imagem_url`, `link`, `tags`, `publicado`, `ordem`)
SELECT * FROM (
  SELECT
    'Solutto' AS titulo,
    'Sistemas & ERPs' AS categoria,
    'Sistema ERP integrado de alta complexidade para gestão completa de operações e franquias.' AS descricao,
    'https://kineticsolutions.s3.sa-east-1.amazonaws.com/solutto-thumb_otimizada.webp' AS imagem_url,
    'https://solutto.com.br' AS link,
    '["ERP Corporativo","Gestão Multiunidade","Cloud"]' AS tags,
    1 AS publicado,
    1 AS ordem
  UNION ALL SELECT 'Solutto - Educacional', 'Sistemas & ERPs', 'Portal do aluno e plataforma de gestão acadêmica e financeira para redes educacionais.', 'https://kineticsolutions.s3.sa-east-1.amazonaws.com/portal-aluno-thumb_otimizada.webp', 'https://solutto.com.br/segmento-franquia-educacional.aspx', '["Portal do Aluno","EdTech","Franquias"]', 1, 2
  UNION ALL SELECT 'Solutto - Educacional (V2)', 'Sistemas & ERPs', 'Interface modernizada e responsiva com foco na experiência do aluno e agilidade do corpo docente.', 'https://kineticsolutions.s3.sa-east-1.amazonaws.com/portal-aluno-2-thumb_otimizada.webp', 'https://solutto.com.br/segmento-franquia-educacional.aspx', '["UI/UX Redesign","Gestão Acadêmica","Dashboard"]', 1, 3
  UNION ALL SELECT 'Gourmetech', 'Sistemas & ERPs', 'Sistema ERP especializado em varejo alimentício e food service com controle de pedidos em tempo real.', 'https://kineticsolutions.s3.sa-east-1.amazonaws.com/gourmetech_otimizada.webp', NULL, '["Food Service","PDV & Estoque","Gestão Comercial"]', 1, 4
  UNION ALL SELECT 'BCD Aliança', 'Plataformas Web', 'Plataforma EAD robusta com streaming de aulas, emissão de certificados e painel do instrutor.', 'https://kineticsolutions.s3.sa-east-1.amazonaws.com/bcd-alianca-system_otimizada.webp', NULL, '["Plataforma EAD","LMS","Cursos Online"]', 1, 5
  UNION ALL SELECT 'Sistema AgendasPro', 'Sistemas & ERPs', 'Painel administrativo avançado para gestão multi-profissionais, automação de horários e métricas.', 'https://kineticsolutions.s3.sa-east-1.amazonaws.com/agendaspro-sistema_otimizada.webp', NULL, '["Painel Admin","Automação","Gestão de Clientes"]', 1, 6
  UNION ALL SELECT 'AgendasPro', 'Plataformas Web', 'Plataforma SaaS para agendamentos inteligentes e notificações automáticas para prestadores de serviços.', 'https://kineticsolutions.s3.sa-east-1.amazonaws.com/agendaspro_otimizada.webp', NULL, '["SaaS","Agendamento Online","Alta Conversão"]', 1, 7
  UNION ALL SELECT 'Sistema Kadem', 'Sistemas & ERPs', 'Dashboard corporativo voltado ao controle de produtividade, metas e fluxos de trabalho em equipe.', 'https://kineticsolutions.s3.sa-east-1.amazonaws.com/kadem-system_otimizada.webp', NULL, '["Produtividade","Workflow","Métricas de Equipe"]', 1, 8
  UNION ALL SELECT 'Kadem', 'Plataformas Web', 'Plataforma colaborativa para organização de projetos e aceleração de entregas empresariais.', 'https://kineticsolutions.s3.sa-east-1.amazonaws.com/kadem_otimizada.webp', NULL, '["Gestão de Projetos","Colaboração","Cloud"]', 1, 9
  UNION ALL SELECT 'Mokaly - Sistema', 'Sistemas & ERPs', 'Painel de controle analítico para configuração e monitoramento de eventos interativos.', 'https://kineticsolutions.s3.sa-east-1.amazonaws.com/sistema-mokaly-thumb_otimizada.webp', 'https://mokaly.com/', '["Painel Analítico","Live Analytics","Gamificação"]', 1, 10
  UNION ALL SELECT 'Mokaly', 'Plataformas Web', 'Plataforma interativa para engajamento de audiências em conferências e treinamentos corporativos.', 'https://kineticsolutions.s3.sa-east-1.amazonaws.com/mokaly-thumb_otimizada.webp', 'https://mokaly.com/', '["Engajamento","Interatividade","Web Platform"]', 1, 11
  UNION ALL SELECT 'Compra Rápida', 'Mobile Apps', 'Aplicativo mobile moderno para compras com leitor de código de barras, checkout ágil e delivery local.', 'https://kineticsolutions.s3.sa-east-1.amazonaws.com/compra-rapida_otimizada.webp', NULL, '["Mobile App","iOS & Android","E-commerce"]', 1, 12
  UNION ALL SELECT 'Mania Mania', 'Landing Pages & Sites', 'Vitrine virtual e catálogo digital interativo para indústria de doces, biscoitos e confeitaria.', 'https://kineticsolutions.s3.sa-east-1.amazonaws.com/mania-mania_otimizada.webp', NULL, '["Catálogo Digital","Vitrine Virtual","UI Comercial"]', 1, 13
  UNION ALL SELECT 'CDA E-sports', 'Plataformas Web', 'Portal institucional de alta performance para organização profissional de esportes eletrônicos.', 'https://kineticsolutions.s3.sa-east-1.amazonaws.com/cda-thumb_otimizada.webp', NULL, '["Gaming & E-sports","High Performance","Design Futurista"]', 1, 14
  UNION ALL SELECT 'Advocacia Geunon', 'Landing Pages & Sites', 'Site institucional corporativo para escritório de advocacia com foco em autoridade e captação de clientes.', 'https://kineticsolutions.s3.sa-east-1.amazonaws.com/advocacia-geunon_otimizada.webp', NULL, '["Site Institucional","Autoridade Jurídica","Responsivo"]', 1, 15
  UNION ALL SELECT 'Sonus Prime', 'Landing Pages & Sites', 'Site institucional moderno para agência de tecnologia e serviços digitais em nuvem.', 'https://kineticsolutions.s3.sa-east-1.amazonaws.com/sonus-prime_otimizada.webp', NULL, '["Agência Digital","Apresentação Corporativa","UI/UX"]', 1, 16
  UNION ALL SELECT 'A Última Passageira', 'Landing Pages & Sites', 'Landing page imersiva de alta conversão para divulgação e pré-venda de obra literária.', 'https://kineticsolutions.s3.sa-east-1.amazonaws.com/a-ultima-passageira_otimizada.webp', NULL, '["Landing Page","Lançamento","Foco em Conversão"]', 1, 17
) AS seed_projects
WHERE NOT EXISTS (SELECT 1 FROM `portfolio_projetos` LIMIT 1);
