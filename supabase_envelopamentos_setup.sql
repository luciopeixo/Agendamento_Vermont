-- ==============================================================================
-- VERMONT MINERAÇÃO - SCRIPT DE CRIAÇÃO DE TABELAS DE ENVELOPAMENTO & CLIENTES
-- Execute este script no SQL Editor do seu Dashboard Supabase
-- ==============================================================================

-- 1. Tabela Oficial de Envelopamentos de Blocos
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

-- Índices para buscas ultrarrápidas
CREATE INDEX IF NOT EXISTS idx_envelopamentos_bloco ON public.envelopamentos(numero_bloco);
CREATE INDEX IF NOT EXISTS idx_envelopamentos_status ON public.envelopamentos(status);
CREATE INDEX IF NOT EXISTS idx_envelopamentos_pedreira ON public.envelopamentos(pedreira_nome);

-- Habilitar RLS e Políticas de Acesso
ALTER TABLE public.envelopamentos ENABLE ROW LEVEL SECURITY;

DO $
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'envelopamentos' AND policyname = 'Permissao total envelopamentos'
  ) THEN
    CREATE POLICY "Permissao total envelopamentos" ON public.envelopamentos FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $;

-- Habilitar Realtime para a tabela envelopamentos
ALTER PUBLICATION supabase_realtime ADD TABLE public.envelopamentos;


-- 2. Tabela de Clientes Cadastrados
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

ALTER PUBLICATION supabase_realtime ADD TABLE public.clientes;
