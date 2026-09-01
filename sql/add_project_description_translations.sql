-- Adds optional localized project descriptions without changing existing projects.
-- Safe to run repeatedly on MySQL and MariaDB.

SET @schema_name = DATABASE();

SET @has_description_en = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'portfolio_projetos'
    AND COLUMN_NAME = 'descricao_en'
);
SET @statement = IF(
  @has_description_en = 0,
  'ALTER TABLE portfolio_projetos ADD COLUMN descricao_en TEXT NULL AFTER descricao',
  'SELECT ''descricao_en already exists'' AS migration_status'
);
PREPARE migration_statement FROM @statement;
EXECUTE migration_statement;
DEALLOCATE PREPARE migration_statement;

SET @has_description_es = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'portfolio_projetos'
    AND COLUMN_NAME = 'descricao_es'
);
SET @statement = IF(
  @has_description_es = 0,
  'ALTER TABLE portfolio_projetos ADD COLUMN descricao_es TEXT NULL AFTER descricao_en',
  'SELECT ''descricao_es already exists'' AS migration_status'
);
PREPARE migration_statement FROM @statement;
EXECUTE migration_statement;
DEALLOCATE PREPARE migration_statement;

-- Populate the translations for the original project catalog. Existing translated
-- descriptions are preserved, so this section is also safe to run repeatedly.
UPDATE portfolio_projetos AS project
JOIN (
  SELECT 'Solutto' AS title, 'High-complexity integrated ERP system for complete operations and franchise management.' AS description_en, 'Sistema ERP integrado de alta complejidad para la gestión completa de operaciones y franquicias.' AS description_es
  UNION ALL SELECT 'Solutto - Educacional', 'Student portal and academic and financial management platform for education networks.', 'Portal del estudiante y plataforma de gestión académica y financiera para redes educativas.'
  UNION ALL SELECT 'Solutto - Educacional (V2)', 'Modernized, responsive interface focused on student experience and faculty efficiency.', 'Interfaz modernizada y responsiva enfocada en la experiencia del estudiante y la agilidad del cuerpo docente.'
  UNION ALL SELECT 'Gourmetech', 'ERP system for food retail and food service with real-time order control.', 'Sistema ERP especializado en comercio alimentario y food service con control de pedidos en tiempo real.'
  UNION ALL SELECT 'BCD Aliança', 'Robust online learning platform with lesson streaming, certificates, and an instructor dashboard.', 'Plataforma de educación en línea robusta con streaming de clases, emisión de certificados y panel del instructor.'
  UNION ALL SELECT 'Sistema AgendasPro', 'Advanced administrative dashboard for multi-professional management, scheduling automation, and metrics.', 'Panel administrativo avanzado para la gestión de múltiples profesionales, automatización de agendas y métricas.'
  UNION ALL SELECT 'AgendasPro', 'SaaS platform for intelligent scheduling and automatic notifications for service providers.', 'Plataforma SaaS para agendas inteligentes y notificaciones automáticas para proveedores de servicios.'
  UNION ALL SELECT 'Sistema Kadem', 'Corporate dashboard for tracking productivity, goals, and team workflows.', 'Dashboard corporativo orientado al control de productividad, metas y flujos de trabajo en equipo.'
  UNION ALL SELECT 'Kadem', 'Collaborative platform for organizing projects and accelerating business delivery.', 'Plataforma colaborativa para organizar proyectos y acelerar las entregas empresariales.'
  UNION ALL SELECT 'Mokaly - Sistema', 'Analytical control panel for configuring and monitoring interactive events.', 'Panel de control analítico para configurar y monitorear eventos interactivos.'
  UNION ALL SELECT 'Mokaly', 'Interactive platform for audience engagement at conferences and corporate training sessions.', 'Plataforma interactiva para el compromiso de audiencias en conferencias y capacitaciones corporativas.'
  UNION ALL SELECT 'Compra Rápida', 'Modern mobile shopping app with barcode scanning, fast checkout, and local delivery.', 'Aplicación móvil moderna para compras con lector de códigos de barras, pago ágil y entrega local.'
  UNION ALL SELECT 'Mania Mania', 'Interactive virtual storefront and digital catalog for the candy, cookie, and confectionery industry.', 'Vitrina virtual y catálogo digital interactivo para la industria de dulces, galletas y confitería.'
  UNION ALL SELECT 'CDA E-sports', 'High-performance institutional portal for a professional esports organization.', 'Portal institucional de alto rendimiento para una organización profesional de deportes electrónicos.'
  UNION ALL SELECT 'Advocacia Geunon', 'Corporate institutional website for a law firm, focused on authority and client acquisition.', 'Sitio institucional corporativo para un bufete de abogados, enfocado en autoridad y captación de clientes.'
  UNION ALL SELECT 'Sonus Prime', 'Modern institutional website for a technology agency and cloud-based digital services.', 'Sitio institucional moderno para una agencia de tecnología y servicios digitales en la nube.'
  UNION ALL SELECT 'A Última Passageira', 'Immersive, high-conversion landing page for promoting and pre-selling a literary work.', 'Landing page inmersiva y de alta conversión para la divulgación y preventa de una obra literaria.'
) AS translations ON translations.title = project.titulo
SET project.descricao_en = COALESCE(NULLIF(project.descricao_en, ''), translations.description_en),
    project.descricao_es = COALESCE(NULLIF(project.descricao_es, ''), translations.description_es)
WHERE project.id > 0;
