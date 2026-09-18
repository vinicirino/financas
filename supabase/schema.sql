-- ==============================================================================
-- FINANCONTROL PRO - SUPABASE POSTGRESQL SCHEMA & ROW LEVEL SECURITY (RLS)
-- ==============================================================================
-- Execute este script no SQL Editor do seu projeto Supabase para criar todas as
-- tabelas, índices, triggers de perfil e políticas de segurança RLS.
-- ==============================================================================

-- 1. Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABELAS PÚBLICAS
-- ==============================================================================

-- 2.1. Tabela de Perfis de Usuário (vinculada a auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

COMMENT ON TABLE public.profiles IS 'Perfil adicional dos usuários cadastrados via Supabase Auth';

-- 2.2. Tabela de Transações Financeiras (Receitas e Despesas)
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('receita', 'despesa')),
  category TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pago', 'pendente')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('pix', 'cartao_credito', 'debito', 'boleto', 'dinheiro', 'transferencia')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

COMMENT ON TABLE public.transactions IS 'Lançamentos financeiros de receitas e despesas por usuário';

-- 2.3. Tabela de Ativos de Investimento da Carteira
CREATE TABLE IF NOT EXISTS public.investment_assets (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  name TEXT NOT NULL,
  asset_class TEXT NOT NULL CHECK (asset_class IN ('renda_fixa', 'acoes', 'fiis', 'cripto', 'internacional', 'outros')),
  quantity NUMERIC(16, 6) NOT NULL DEFAULT 0,
  average_price NUMERIC(14, 4) NOT NULL DEFAULT 0,
  current_price NUMERIC(14, 4) NOT NULL DEFAULT 0,
  purchase_date DATE NOT NULL,
  broker TEXT,
  target_allocation_percent NUMERIC(5, 2),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

COMMENT ON TABLE public.investment_assets IS 'Ativos mantidos na carteira de investimentos';

-- 2.4. Tabela de Proventos e Dividendos Recebidos
CREATE TABLE IF NOT EXISTS public.dividend_records (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id TEXT NOT NULL,
  ticker TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL,
  payment_date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('dividendo', 'jcp', 'rendimento', 'juros')),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

COMMENT ON TABLE public.dividend_records IS 'Histórico de proventos recebidos (dividendos, JCP, rendimentos)';

-- 2.5. Tabela de Fechamentos e Desempenho Mensal
CREATE TABLE IF NOT EXISTS public.monthly_performance_records (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_key TEXT NOT NULL, -- Ex: "2026-09"
  month_label TEXT NOT NULL, -- Ex: "Set/2026"
  starting_portfolio_value NUMERIC(14, 2) NOT NULL DEFAULT 0,
  contributions NUMERIC(14, 2) NOT NULL DEFAULT 0,
  withdrawals NUMERIC(14, 2) NOT NULL DEFAULT 0,
  dividends_received NUMERIC(14, 2) NOT NULL DEFAULT 0,
  capital_gains NUMERIC(14, 2) NOT NULL DEFAULT 0,
  ending_portfolio_value NUMERIC(14, 2) NOT NULL DEFAULT 0,
  net_profit NUMERIC(14, 2) NOT NULL DEFAULT 0,
  monthly_yield_percent NUMERIC(8, 4) NOT NULL DEFAULT 0,
  benchmark_cdi_percent NUMERIC(8, 4) NOT NULL DEFAULT 0,
  benchmark_ibov_percent NUMERIC(8, 4) NOT NULL DEFAULT 0,
  benchmark_ipca_percent NUMERIC(8, 4) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT uq_monthly_perf_user_month UNIQUE (user_id, month_key)
);

COMMENT ON TABLE public.monthly_performance_records IS 'Histórico consolidado de rentabilidade mês a mês';

-- ==============================================================================
-- 3. ÍNDICES PARA ALTA PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON public.investment_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_dividends_user_id ON public.dividend_records(user_id);
CREATE INDEX IF NOT EXISTS idx_dividends_payment_date ON public.dividend_records(user_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_monthly_perf_user_id ON public.monthly_performance_records(user_id);

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) - SEGURANÇA TOTAL POR USUÁRIO
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dividend_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_performance_records ENABLE ROW LEVEL SECURITY;

-- 4.1. Policies para Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- 4.2. Policies para Transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
CREATE POLICY "Users can insert own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
CREATE POLICY "Users can update own transactions" ON public.transactions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;
CREATE POLICY "Users can delete own transactions" ON public.transactions
  FOR DELETE USING (auth.uid() = user_id);

-- 4.3. Policies para Investment Assets
DROP POLICY IF EXISTS "Users can view own investments" ON public.investment_assets;
CREATE POLICY "Users can view own investments" ON public.investment_assets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own investments" ON public.investment_assets;
CREATE POLICY "Users can insert own investments" ON public.investment_assets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own investments" ON public.investment_assets;
CREATE POLICY "Users can update own investments" ON public.investment_assets
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own investments" ON public.investment_assets;
CREATE POLICY "Users can delete own investments" ON public.investment_assets
  FOR DELETE USING (auth.uid() = user_id);

-- 4.4. Policies para Dividend Records
DROP POLICY IF EXISTS "Users can view own dividends" ON public.dividend_records;
CREATE POLICY "Users can view own dividends" ON public.dividend_records
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own dividends" ON public.dividend_records;
CREATE POLICY "Users can insert own dividends" ON public.dividend_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own dividends" ON public.dividend_records;
CREATE POLICY "Users can update own dividends" ON public.dividend_records
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own dividends" ON public.dividend_records;
CREATE POLICY "Users can delete own dividends" ON public.dividend_records
  FOR DELETE USING (auth.uid() = user_id);

-- 4.5. Policies para Monthly Performance Records
DROP POLICY IF EXISTS "Users can view own monthly performance" ON public.monthly_performance_records;
CREATE POLICY "Users can view own monthly performance" ON public.monthly_performance_records
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own monthly performance" ON public.monthly_performance_records;
CREATE POLICY "Users can insert own monthly performance" ON public.monthly_performance_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own monthly performance" ON public.monthly_performance_records;
CREATE POLICY "Users can update own monthly performance" ON public.monthly_performance_records
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own monthly performance" ON public.monthly_performance_records;
CREATE POLICY "Users can delete own monthly performance" ON public.monthly_performance_records
  FOR DELETE USING (auth.uid() = user_id);

-- ==============================================================================
-- 5. TRIGGER AUTOMÁTICO PARA CRIAÇÃO DE PERFIL NO SIGNUP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 6. FUNÇÃO RPC PARA EXCLUSÃO DE CONTA PELO PRÓPRIO USUÁRIO (OPCIONAL)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
