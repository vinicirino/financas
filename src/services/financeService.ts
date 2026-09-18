import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
  Transaction, 
  InvestmentAsset, 
  DividendRecord, 
  MonthlyPerformanceRecord 
} from '../types';

export interface UserFinancialData {
  transactions: Transaction[];
  investments: InvestmentAsset[];
  dividends: DividendRecord[];
  monthlyPerformances: MonthlyPerformanceRecord[];
}

export const financeService = {
  /**
   * Fetches all financial entities for the authenticated user from Supabase.
   */
  async fetchUserData(userId: string): Promise<UserFinancialData> {
    if (!isSupabaseConfigured || !userId) {
      return {
        transactions: [],
        investments: [],
        dividends: [],
        monthlyPerformances: []
      };
    }

    const [txRes, invRes, divRes, perfRes] = await Promise.all([
      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false }),
      supabase
        .from('investment_assets')
        .select('*')
        .eq('user_id', userId)
        .order('ticker', { ascending: true }),
      supabase
        .from('dividend_records')
        .select('*')
        .eq('user_id', userId)
        .order('payment_date', { ascending: false }),
      supabase
        .from('monthly_performance_records')
        .select('*')
        .eq('user_id', userId)
        .order('month_key', { ascending: true })
    ]);

    if (txRes.error) throw new Error(`Erro ao carregar transações: ${txRes.error.message}`);
    if (invRes.error) throw new Error(`Erro ao carregar investimentos: ${invRes.error.message}`);
    if (divRes.error) throw new Error(`Erro ao carregar dividendos: ${divRes.error.message}`);
    if (perfRes.error) throw new Error(`Erro ao carregar histórico: ${perfRes.error.message}`);

    const transactions: Transaction[] = (txRes.data || []).map((row: any) => ({
      id: row.id,
      description: row.description,
      amount: Number(row.amount),
      type: row.type,
      category: row.category,
      date: row.date,
      status: row.status,
      paymentMethod: row.payment_method,
      notes: row.notes || undefined
    }));

    const investments: InvestmentAsset[] = (invRes.data || []).map((row: any) => ({
      id: row.id,
      ticker: row.ticker,
      name: row.name,
      assetClass: row.asset_class,
      quantity: Number(row.quantity),
      averagePrice: Number(row.average_price),
      currentPrice: Number(row.current_price),
      purchaseDate: row.purchase_date,
      broker: row.broker || undefined,
      targetAllocationPercent: row.target_allocation_percent ? Number(row.target_allocation_percent) : undefined
    }));

    const dividends: DividendRecord[] = (divRes.data || []).map((row: any) => ({
      id: row.id,
      assetId: row.asset_id,
      ticker: row.ticker,
      amount: Number(row.amount),
      paymentDate: row.payment_date,
      type: row.type
    }));

    const monthlyPerformances: MonthlyPerformanceRecord[] = (perfRes.data || []).map((row: any) => ({
      monthKey: row.month_key,
      monthLabel: row.month_label,
      startingPortfolioValue: Number(row.starting_portfolio_value),
      contributions: Number(row.contributions),
      withdrawals: Number(row.withdrawals),
      dividendsReceived: Number(row.dividends_received),
      capitalGains: Number(row.capital_gains),
      endingPortfolioValue: Number(row.ending_portfolio_value),
      netProfit: Number(row.net_profit),
      monthlyYieldPercent: Number(row.monthly_yield_percent),
      benchmarkCdiPercent: Number(row.benchmark_cdi_percent),
      benchmarkIbovPercent: Number(row.benchmark_ibov_percent),
      benchmarkIpcaPercent: Number(row.benchmark_ipca_percent)
    }));

    return {
      transactions,
      investments,
      dividends,
      monthlyPerformances
    };
  },

  // --------------------------------------------------------------------------
  // TRANSACTIONS
  // --------------------------------------------------------------------------
  async insertTransaction(userId: string, tx: Transaction): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('transactions').insert({
      id: tx.id,
      user_id: userId,
      description: tx.description,
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      date: tx.date,
      status: tx.status,
      payment_method: tx.paymentMethod,
      notes: tx.notes || null
    });
    if (error) throw new Error(`Falha ao salvar transação: ${error.message}`);
  },

  async updateTransaction(userId: string, tx: Transaction): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase
      .from('transactions')
      .update({
        description: tx.description,
        amount: tx.amount,
        type: tx.type,
        category: tx.category,
        date: tx.date,
        status: tx.status,
        payment_method: tx.paymentMethod,
        notes: tx.notes || null
      })
      .eq('id', tx.id)
      .eq('user_id', userId);
    if (error) throw new Error(`Falha ao atualizar transação: ${error.message}`);
  },

  async deleteTransaction(userId: string, id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw new Error(`Falha ao excluir transação: ${error.message}`);
  },

  // --------------------------------------------------------------------------
  // INVESTMENTS
  // --------------------------------------------------------------------------
  async insertInvestment(userId: string, asset: InvestmentAsset): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('investment_assets').insert({
      id: asset.id,
      user_id: userId,
      ticker: asset.ticker,
      name: asset.name,
      asset_class: asset.assetClass,
      quantity: asset.quantity,
      average_price: asset.averagePrice,
      current_price: asset.currentPrice,
      purchase_date: asset.purchaseDate,
      broker: asset.broker || null,
      target_allocation_percent: asset.targetAllocationPercent || null
    });
    if (error) throw new Error(`Falha ao salvar investimento: ${error.message}`);
  },

  async updateInvestment(userId: string, asset: InvestmentAsset): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase
      .from('investment_assets')
      .update({
        ticker: asset.ticker,
        name: asset.name,
        asset_class: asset.assetClass,
        quantity: asset.quantity,
        average_price: asset.averagePrice,
        current_price: asset.currentPrice,
        purchase_date: asset.purchaseDate,
        broker: asset.broker || null,
        target_allocation_percent: asset.targetAllocationPercent || null
      })
      .eq('id', asset.id)
      .eq('user_id', userId);
    if (error) throw new Error(`Falha ao atualizar investimento: ${error.message}`);
  },

  async updateAssetPrice(userId: string, id: string, newPrice: number): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase
      .from('investment_assets')
      .update({ current_price: newPrice })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw new Error(`Falha ao atualizar cotação: ${error.message}`);
  },

  async deleteInvestment(userId: string, id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase
      .from('investment_assets')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw new Error(`Falha ao excluir investimento: ${error.message}`);
  },

  // --------------------------------------------------------------------------
  // DIVIDENDS
  // --------------------------------------------------------------------------
  async insertDividend(userId: string, div: DividendRecord): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('dividend_records').insert({
      id: div.id,
      user_id: userId,
      asset_id: div.assetId,
      ticker: div.ticker,
      amount: div.amount,
      payment_date: div.paymentDate,
      type: div.type
    });
    if (error) throw new Error(`Falha ao salvar provento: ${error.message}`);
  },

  async deleteDividend(userId: string, id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase
      .from('dividend_records')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw new Error(`Falha ao excluir provento: ${error.message}`);
  },

  // --------------------------------------------------------------------------
  // DATABASE WIPE (CURRENT USER ONLY)
  // --------------------------------------------------------------------------
  async clearUserDatabase(userId: string): Promise<void> {
    if (!isSupabaseConfigured || !userId) return;

    const [tErr, iErr, dErr, pErr] = await Promise.all([
      supabase.from('transactions').delete().eq('user_id', userId),
      supabase.from('investment_assets').delete().eq('user_id', userId),
      supabase.from('dividend_records').delete().eq('user_id', userId),
      supabase.from('monthly_performance_records').delete().eq('user_id', userId)
    ]);

    if (tErr.error) throw new Error(`Erro ao limpar transações: ${tErr.error.message}`);
    if (iErr.error) throw new Error(`Erro ao limpar investimentos: ${iErr.error.message}`);
    if (dErr.error) throw new Error(`Erro ao limpar dividendos: ${dErr.error.message}`);
    if (pErr.error) throw new Error(`Erro ao limpar histórico: ${pErr.error.message}`);
  },

  // --------------------------------------------------------------------------
  // IMPORT & MIGRATION TO SUPABASE
  // --------------------------------------------------------------------------
  async upsertDataBatch(
    userId: string, 
    data: {
      transactions?: Transaction[];
      investments?: InvestmentAsset[];
      dividends?: DividendRecord[];
      monthlyPerformances?: MonthlyPerformanceRecord[];
    }
  ): Promise<{
    transactionsCount: number;
    investmentsCount: number;
    dividendsCount: number;
    performancesCount: number;
  }> {
    if (!isSupabaseConfigured || !userId) {
      throw new Error('Supabase não configurado ou usuário não autenticado.');
    }

    let txCount = 0;
    let invCount = 0;
    let divCount = 0;
    let perfCount = 0;

    // 1. Transactions upsert
    if (data.transactions && data.transactions.length > 0) {
      const rows = data.transactions.map(t => ({
        id: t.id,
        user_id: userId,
        description: t.description,
        amount: t.amount,
        type: t.type,
        category: t.category,
        date: t.date,
        status: t.status,
        payment_method: t.paymentMethod,
        notes: t.notes || null
      }));

      const { error } = await supabase.from('transactions').upsert(rows, { onConflict: 'id' });
      if (error) throw new Error(`Erro ao migrar transações: ${error.message}`);
      txCount = rows.length;
    }

    // 2. Investments upsert
    if (data.investments && data.investments.length > 0) {
      const rows = data.investments.map(inv => ({
        id: inv.id,
        user_id: userId,
        ticker: inv.ticker,
        name: inv.name,
        asset_class: inv.assetClass,
        quantity: inv.quantity,
        average_price: inv.averagePrice,
        current_price: inv.currentPrice,
        purchase_date: inv.purchaseDate,
        broker: inv.broker || null,
        target_allocation_percent: inv.targetAllocationPercent || null
      }));

      const { error } = await supabase.from('investment_assets').upsert(rows, { onConflict: 'id' });
      if (error) throw new Error(`Erro ao migrar investimentos: ${error.message}`);
      invCount = rows.length;
    }

    // 3. Dividends upsert
    if (data.dividends && data.dividends.length > 0) {
      const rows = data.dividends.map(d => ({
        id: d.id,
        user_id: userId,
        asset_id: d.assetId,
        ticker: d.ticker,
        amount: d.amount,
        payment_date: d.paymentDate,
        type: d.type
      }));

      const { error } = await supabase.from('dividend_records').upsert(rows, { onConflict: 'id' });
      if (error) throw new Error(`Erro ao migrar dividendos: ${error.message}`);
      divCount = rows.length;
    }

    // 4. Monthly performance upsert
    if (data.monthlyPerformances && data.monthlyPerformances.length > 0) {
      const rows = data.monthlyPerformances.map(p => ({
        user_id: userId,
        month_key: p.monthKey,
        month_label: p.monthLabel,
        starting_portfolio_value: p.startingPortfolioValue,
        contributions: p.contributions,
        withdrawals: p.withdrawals,
        dividends_received: p.dividendsReceived,
        capital_gains: p.capitalGains,
        ending_portfolio_value: p.endingPortfolioValue,
        net_profit: p.netProfit,
        monthly_yield_percent: p.monthlyYieldPercent,
        benchmark_cdi_percent: p.benchmarkCdiPercent,
        benchmark_ibov_percent: p.benchmarkIbovPercent,
        benchmark_ipca_percent: p.benchmarkIpcaPercent
      }));

      const { error } = await supabase
        .from('monthly_performance_records')
        .upsert(rows, { onConflict: 'user_id,month_key' });
      if (error) throw new Error(`Erro ao migrar histórico de desempenho: ${error.message}`);
      perfCount = rows.length;
    }

    return {
      transactionsCount: txCount,
      investmentsCount: invCount,
      dividendsCount: divCount,
      performancesCount: perfCount
    };
  }
};
