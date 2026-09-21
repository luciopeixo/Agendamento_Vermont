-- ==============================================================================
-- VERMONT MINERAÇÃO - SCRIPT COMPLETO DE TABELAS, SEGURANÇA E REALTIME
-- Execute este script no SQL Editor do seu Dashboard Supabase
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABELA OFICIAL DE ENVELOPAMENTOS DE BLOCOS (envelopamentos)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.envelopamentos (
  id TEXT PRIMARY KEY,
  numero_bloco TEXT NOT NULL,
  cliente_nome TEXT,
  cliente_cnpj TEXT,
  material TEXT,
  pedreira_id TEXT,
  pedreira_nome TEXT,
  status TEXT DEFAULT 'pendente_envelopamento',
  responsavel_envelopamento TEXT,
  responsavel_liberacao TEXT,
  data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_envelopamento TIMESTAMP WITH TIME ZONE,
  data_liberacao TIMESTAMP WITH TIME ZONE,
  observacoes TEXT,
  agendamento_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Garantir colunas opcionais adicionais se a tabela já existir
ALTER TABLE public.envelopamentos ADD COLUMN IF NOT EXISTS peso_kg NUMERIC;
ALTER TABLE public.envelopamentos ADD COLUMN IF NOT EXISTS numero_romaneio TEXT;
ALTER TABLE public.envelopamentos ADD COLUMN IF NOT EXISTS data_romaneio TEXT;
ALTER TABLE public.envelopamentos ADD COLUMN IF NOT EXISTS valor_envelopamento NUMERIC;

-- Índices de performance para consultas e filtros instantâneos
CREATE INDEX IF NOT EXISTS idx_envelopamentos_bloco ON public.envelopamentos(numero_bloco);
CREATE INDEX IF NOT EXISTS idx_envelopamentos_status ON public.envelopamentos(status);
CREATE INDEX IF NOT EXISTS idx_envelopamentos_pedreira ON public.envelopamentos(pedreira_nome);
CREATE INDEX IF NOT EXISTS idx_envelopamentos_cliente ON public.envelopamentos(cliente_nome);
CREATE INDEX IF NOT EXISTS idx_envelopamentos_created_at ON public.envelopamentos(created_at DESC);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.envelopamentos ENABLE ROW LEVEL SECURITY;

DO $
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'envelopamentos' AND policyname = 'Permissao total envelopamentos'
  ) THEN
    CREATE POLICY "Permissao total envelopamentos" ON public.envelopamentos FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $;

-- Habilitar Realtime
DO $
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'envelopamentos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.envelopamentos;
  END IF;
END $;


-- ------------------------------------------------------------------------------
-- 2. TABELA DE HISTÓRICO DE AUDITORIA DE ENVELOPAMENTOS (envelopamentos_historico)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.envelopamentos_historico (
  id TEXT PRIMARY KEY,
  tipo_acao TEXT NOT NULL,
  numero_bloco TEXT,
  cliente_nome TEXT,
  material TEXT,
  pedreira_nome TEXT,
  numero_romaneio TEXT,
  status_anterior TEXT,
  status_novo TEXT,
  usuario_nome TEXT DEFAULT 'Equipe Vermont',
  detalhes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_envelopamentos_hist_bloco ON public.envelopamentos_historico(numero_bloco);
CREATE INDEX IF NOT EXISTS idx_envelopamentos_hist_data ON public.envelopamentos_historico(created_at DESC);

ALTER TABLE public.envelopamentos_historico ENABLE ROW LEVEL SECURITY;

DO $
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'envelopamentos_historico' AND policyname = 'Permissao total envelopamentos_historico'
  ) THEN
    CREATE POLICY "Permissao total envelopamentos_historico" ON public.envelopamentos_historico FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $;

DO $
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'envelopamentos_historico'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.envelopamentos_historico;
  END IF;
END $;


-- ------------------------------------------------------------------------------
-- 3. TABELA DE CLIENTES CADASTRADOS (clientes)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clientes (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  cnpj TEXT,
  telefone TEXT,
  email TEXT,
  cidade TEXT,
  uf TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clientes_nome ON public.clientes(nome);
CREATE INDEX IF NOT EXISTS idx_clientes_cnpj ON public.clientes(cnpj);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

DO $
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'clientes' AND policyname = 'Permissao total clientes'
  ) THEN
    CREATE POLICY "Permissao total clientes" ON public.clientes FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $;

DO $
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'clientes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.clientes;
  END IF;
END $;
