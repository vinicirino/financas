import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  Transaction, 
  InvestmentAsset, 
  DividendRecord, 
  MonthlyPerformanceRecord 
} from '../types';
import { financeService } from '../services/financeService';
import { useAuth } from './AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';

interface FinanceContextType {
  transactions: Transaction[];
  investments: InvestmentAsset[];
  dividends: DividendRecord[];
  monthlyPerformances: MonthlyPerformanceRecord[];
  selectedMonth: string; // "YYYY-MM"
  setSelectedMonth: (month: string) => void;
  
  // Loading and sync status
  isLoadingData: boolean;
  isSaving: boolean;
  syncError: string | null;
  clearSyncError: () => void;

  // Local-to-Cloud Migration
  hasLocalDataToMigrate: boolean;
  isMigratedToCloud: boolean;
  migrateLocalDataToCloud: () => Promise<{ success: boolean; message: string }>;

  // Transaction actions
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (tx: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  // Investment actions
  addInvestment: (asset: Omit<InvestmentAsset, 'id'>) => Promise<void>;
  updateInvestment: (asset: InvestmentAsset) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
  updateAssetPrice: (id: string, newPrice: number) => Promise<void>;
  
  // Dividend actions
  addDividend: (div: Omit<DividendRecord, 'id'>) => Promise<void>;
  deleteDividend: (id: string) => Promise<void>;

  // Backup & reset
  clearDatabase: () => Promise<void>;
  resetToDemoData: () => Promise<void>;
  exportDataJSON: () => void;
  importDataJSON: (jsonString: string) => Promise<boolean>;

  // Computed metrics
  metrics: {
    monthIncome: number;
    monthExpense: number;
    monthBalance: number;
    monthSavingsRate: number;
    totalInvested: number;
    currentPortfolioValue: number;
    totalProfitLoss: number;
    totalProfitLossPercent: number;
    currentMonthDividends: number;
    allTimeDividends: number;
    netWorth: number;
  };
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const LOCAL_STORAGE_KEYS = {
  TRANSACTIONS: 'financontrol_clean_v2_transactions',
  INVESTMENTS: 'financontrol_clean_v2_investments',
  DIVIDENDS: 'financontrol_clean_v2_dividends',
  PERFORMANCE: 'financontrol_clean_v2_performance',
  SELECTED_MONTH: 'financontrol_clean_v2_selected_month',
  MIGRATION_FLAG: 'financontrol_migrated_to_supabase_v1'
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [investments, setInvestments] = useState<InvestmentAsset[]>([]);
  const [dividends, setDividends] = useState<DividendRecord[]>([]);
  const [monthlyPerformances, setMonthlyPerformances] = useState<MonthlyPerformanceRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');

  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [hasLocalDataToMigrate, setHasLocalDataToMigrate] = useState<boolean>(false);
  const [isMigratedToCloud, setIsMigratedToCloud] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LOCAL_STORAGE_KEYS.MIGRATION_FLAG) === 'true';
    } catch {
      return false;
    }
  });

  // Check if there is existing local storage data that can be migrated to Supabase
  const checkLocalData = useCallback(() => {
    try {
      const localTx = localStorage.getItem(LOCAL_STORAGE_KEYS.TRANSACTIONS);
      const localInv = localStorage.getItem(LOCAL_STORAGE_KEYS.INVESTMENTS);
      const localDiv = localStorage.getItem(LOCAL_STORAGE_KEYS.DIVIDENDS);

      const parsedTx = localTx ? JSON.parse(localTx) : [];
      const parsedInv = localInv ? JSON.parse(localInv) : [];
      const parsedDiv = localDiv ? JSON.parse(localDiv) : [];

      const totalItems = (parsedTx.length || 0) + (parsedInv.length || 0) + (parsedDiv.length || 0);
      setHasLocalDataToMigrate(totalItems > 0);
    } catch {
      setHasLocalDataToMigrate(false);
    }
  }, []);

  useEffect(() => {
    checkLocalData();
  }, [checkLocalData]);

  // Load data from Supabase when user authenticates
  const loadSupabaseData = useCallback(async (userId: string) => {
    setIsLoadingData(true);
    setSyncError(null);

    try {
      const data = await financeService.fetchUserData(userId);
      setTransactions(data.transactions);
      setInvestments(data.investments);
      setDividends(data.dividends);
      setMonthlyPerformances(data.monthlyPerformances);
    } catch (err: any) {
      console.error('Erro ao carregar dados do Supabase:', err);
      setSyncError(err.message || 'Falha ao sincronizar dados com o Supabase.');

      // If network/offline or Supabase not ready, load from local storage as graceful fallback
      try {
        const localTx = localStorage.getItem(LOCAL_STORAGE_KEYS.TRANSACTIONS);
        const localInv = localStorage.getItem(LOCAL_STORAGE_KEYS.INVESTMENTS);
        const localDiv = localStorage.getItem(LOCAL_STORAGE_KEYS.DIVIDENDS);
        const localPerf = localStorage.getItem(LOCAL_STORAGE_KEYS.PERFORMANCE);

        if (localTx) setTransactions(JSON.parse(localTx));
        if (localInv) setInvestments(JSON.parse(localInv));
        if (localDiv) setDividends(JSON.parse(localDiv));
        if (localPerf) setMonthlyPerformances(JSON.parse(localPerf));
      } catch (fallbackErr) {
        console.warn('Fallback local storage load error:', fallbackErr);
      }
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && currentUser?.id) {
      loadSupabaseData(currentUser.id);
    } else {
      setTransactions([]);
      setInvestments([]);
      setDividends([]);
      setMonthlyPerformances([]);
      setIsLoadingData(false);
    }
  }, [isAuthenticated, currentUser?.id, loadSupabaseData]);

  const clearSyncError = () => setSyncError(null);

  // --------------------------------------------------------------------------
  // LOCAL TO SUPABASE MIGRATION ROUTINE
  // --------------------------------------------------------------------------
  const migrateLocalDataToCloud = async (): Promise<{ success: boolean; message: string }> => {
    if (!currentUser?.id) {
      return { success: false, message: 'Você precisa estar autenticado para migrar seus dados para a nuvem.' };
    }

    if (!isSupabaseConfigured) {
      return { success: false, message: 'Configuração do Supabase não encontrada. Preencha as credenciais no arquivo .env.' };
    }

    setIsSaving(true);
    setSyncError(null);

    try {
      const localTx = localStorage.getItem(LOCAL_STORAGE_KEYS.TRANSACTIONS);
      const localInv = localStorage.getItem(LOCAL_STORAGE_KEYS.INVESTMENTS);
      const localDiv = localStorage.getItem(LOCAL_STORAGE_KEYS.DIVIDENDS);
      const localPerf = localStorage.getItem(LOCAL_STORAGE_KEYS.PERFORMANCE);

      const parsedTx: Transaction[] = localTx ? JSON.parse(localTx) : [];
      const parsedInv: InvestmentAsset[] = localInv ? JSON.parse(localInv) : [];
      const parsedDiv: DividendRecord[] = localDiv ? JSON.parse(localDiv) : [];
      const parsedPerf: MonthlyPerformanceRecord[] = localPerf ? JSON.parse(localPerf) : [];

      const totalItems = parsedTx.length + parsedInv.length + parsedDiv.length + parsedPerf.length;

      if (totalItems === 0) {
        return { success: true, message: 'Nenhum dado local encontrado para migrar.' };
      }

      // Execute batch migration into Supabase PostgreSQL
      const counts = await financeService.upsertDataBatch(currentUser.id, {
        transactions: parsedTx,
        investments: parsedInv,
        dividends: parsedDiv,
        monthlyPerformances: parsedPerf
      });

      // Reload fresh data from Supabase to confirm
      await loadSupabaseData(currentUser.id);

      // Mark migration as successful in localStorage without deleting raw data
      localStorage.setItem(LOCAL_STORAGE_KEYS.MIGRATION_FLAG, 'true');
      setIsMigratedToCloud(true);
      setHasLocalDataToMigrate(false);

      const summary = `Migração concluída com sucesso! ${counts.transactionsCount} transações, ${counts.investmentsCount} investimentos, ${counts.dividendsCount} proventos e ${counts.performancesCount} meses de desempenho foram salvos no Supabase.`;
      return { success: true, message: summary };
    } catch (err: any) {
      console.error('Erro durante a migração para a nuvem:', err);
      const errorMsg = err.message || 'Falha ao migrar dados para o Supabase.';
      setSyncError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setIsSaving(false);
    }
  };

  // --------------------------------------------------------------------------
  // TRANSACTION ACTIONS
  // --------------------------------------------------------------------------
  const addTransaction = async (txData: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    };

    // Optimistic UI update
    setTransactions(prev => [newTx, ...prev]);

    if (currentUser?.id && isSupabaseConfigured) {
      setIsSaving(true);
      try {
        await financeService.insertTransaction(currentUser.id, newTx);
      } catch (err: any) {
        console.error('Erro ao salvar transação no Supabase:', err);
        setSyncError(err.message);
        // Rollback on error
        setTransactions(prev => prev.filter(t => t.id !== newTx.id));
      } finally {
        setIsSaving(false);
      }
    }
  };

  const updateTransaction = async (updatedTx: Transaction) => {
    const previous = [...transactions];
    setTransactions(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t));

    if (currentUser?.id && isSupabaseConfigured) {
      setIsSaving(true);
      try {
        await financeService.updateTransaction(currentUser.id, updatedTx);
      } catch (err: any) {
        console.error('Erro ao atualizar transação no Supabase:', err);
        setSyncError(err.message);
        setTransactions(previous);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const deleteTransaction = async (id: string) => {
    const previous = [...transactions];
    setTransactions(prev => prev.filter(t => t.id !== id));

    if (currentUser?.id && isSupabaseConfigured) {
      setIsSaving(true);
      try {
        await financeService.deleteTransaction(currentUser.id, id);
      } catch (err: any) {
        console.error('Erro ao excluir transação no Supabase:', err);
        setSyncError(err.message);
        setTransactions(previous);
      } finally {
        setIsSaving(false);
      }
    }
  };

  // --------------------------------------------------------------------------
  // INVESTMENT ACTIONS
  // --------------------------------------------------------------------------
  const addInvestment = async (assetData: Omit<InvestmentAsset, 'id'>) => {
    const newAsset: InvestmentAsset = {
      ...assetData,
      id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    };

    setInvestments(prev => [...prev, newAsset]);

    if (currentUser?.id && isSupabaseConfigured) {
      setIsSaving(true);
      try {
        await financeService.insertInvestment(currentUser.id, newAsset);
      } catch (err: any) {
        console.error('Erro ao salvar ativo no Supabase:', err);
        setSyncError(err.message);
        setInvestments(prev => prev.filter(a => a.id !== newAsset.id));
      } finally {
        setIsSaving(false);
      }
    }
  };

  const updateInvestment = async (updatedAsset: InvestmentAsset) => {
    const previous = [...investments];
    setInvestments(prev => prev.map(a => a.id === updatedAsset.id ? updatedAsset : a));

    if (currentUser?.id && isSupabaseConfigured) {
      setIsSaving(true);
      try {
        await financeService.updateInvestment(currentUser.id, updatedAsset);
      } catch (err: any) {
        console.error('Erro ao atualizar ativo no Supabase:', err);
        setSyncError(err.message);
        setInvestments(previous);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const deleteInvestment = async (id: string) => {
    const previous = [...investments];
    setInvestments(prev => prev.filter(a => a.id !== id));

    if (currentUser?.id && isSupabaseConfigured) {
      setIsSaving(true);
      try {
        await financeService.deleteInvestment(currentUser.id, id);
      } catch (err: any) {
        console.error('Erro ao excluir ativo no Supabase:', err);
        setSyncError(err.message);
        setInvestments(previous);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const updateAssetPrice = async (id: string, newPrice: number) => {
    const previous = [...investments];
    setInvestments(prev => prev.map(a => a.id === id ? { ...a, currentPrice: newPrice } : a));

    if (currentUser?.id && isSupabaseConfigured) {
      setIsSaving(true);
      try {
        await financeService.updateAssetPrice(currentUser.id, id, newPrice);
      } catch (err: any) {
        console.error('Erro ao atualizar cotação no Supabase:', err);
        setSyncError(err.message);
        setInvestments(previous);
      } finally {
        setIsSaving(false);
      }
    }
  };

  // --------------------------------------------------------------------------
  // DIVIDEND ACTIONS
  // --------------------------------------------------------------------------
  const addDividend = async (divData: Omit<DividendRecord, 'id'>) => {
    const newDiv: DividendRecord = {
      ...divData,
      id: `div-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    };

    setDividends(prev => [newDiv, ...prev]);

    if (currentUser?.id && isSupabaseConfigured) {
      setIsSaving(true);
      try {
        await financeService.insertDividend(currentUser.id, newDiv);
      } catch (err: any) {
        console.error('Erro ao salvar dividendo no Supabase:', err);
        setSyncError(err.message);
        setDividends(prev => prev.filter(d => d.id !== newDiv.id));
      } finally {
        setIsSaving(false);
      }
    }

    // Also record matching transaction
    await addTransaction({
      description: `Provento Recebido: ${newDiv.ticker} (${newDiv.type.toUpperCase()})`,
      amount: newDiv.amount,
      type: 'receita',
      category: 'Rendimentos / Investimentos',
      date: newDiv.paymentDate,
      status: 'pago',
      paymentMethod: 'transferencia',
      notes: `Lançado via carteira de proventos`
    });
  };

  const deleteDividend = async (id: string) => {
    const previous = [...dividends];
    setDividends(prev => prev.filter(d => d.id !== id));

    if (currentUser?.id && isSupabaseConfigured) {
      setIsSaving(true);
      try {
        await financeService.deleteDividend(currentUser.id, id);
      } catch (err: any) {
        console.error('Erro ao excluir dividendo no Supabase:', err);
        setSyncError(err.message);
        setDividends(previous);
      } finally {
        setIsSaving(false);
      }
    }
  };

  // --------------------------------------------------------------------------
  // DATABASE WIPE & BACKUP
  // --------------------------------------------------------------------------
  const clearDatabase = async () => {
    setTransactions([]);
    setInvestments([]);
    setDividends([]);
    setMonthlyPerformances([]);
    setSelectedMonth('2026-09');

    if (currentUser?.id && isSupabaseConfigured) {
      setIsSaving(true);
      try {
        await financeService.clearUserDatabase(currentUser.id);
      } catch (err: any) {
        console.error('Erro ao zerar banco no Supabase:', err);
        setSyncError(err.message);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const resetToDemoData = async () => {
    await clearDatabase();
  };

  const exportDataJSON = () => {
    const data = {
      version: '3.0-supabase',
      exportedBy: currentUser?.email || 'user',
      exportDate: new Date().toISOString(),
      transactions,
      investments,
      dividends,
      monthlyPerformances
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financontrol-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importDataJSON = async (jsonString: string): Promise<boolean> => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed.transactions) && !Array.isArray(parsed.investments)) {
        return false;
      }

      const txList: Transaction[] = Array.isArray(parsed.transactions) ? parsed.transactions : [];
      const invList: InvestmentAsset[] = Array.isArray(parsed.investments) ? parsed.investments : [];
      const divList: DividendRecord[] = Array.isArray(parsed.dividends) ? parsed.dividends : [];
      const perfList: MonthlyPerformanceRecord[] = Array.isArray(parsed.monthlyPerformances) ? parsed.monthlyPerformances : [];

      setTransactions(txList);
      setInvestments(invList);
      setDividends(divList);
      setMonthlyPerformances(perfList);

      if (currentUser?.id && isSupabaseConfigured) {
        setIsSaving(true);
        await financeService.upsertDataBatch(currentUser.id, {
          transactions: txList,
          investments: invList,
          dividends: divList,
          monthlyPerformances: perfList
        });
      }

      return true;
    } catch (err) {
      console.error('Erro ao importar JSON:', err);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // --------------------------------------------------------------------------
  // CALCULATED FINANCIAL METRICS
  // --------------------------------------------------------------------------
  const monthTransactions = transactions.filter(t => t.date.startsWith(selectedMonth));
  
  const monthIncome = monthTransactions
    .filter(t => t.type === 'receita')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthExpense = monthTransactions
    .filter(t => t.type === 'despesa')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthBalance = monthIncome - monthExpense;
  const monthSavingsRate = monthIncome > 0 ? ((monthIncome - monthExpense) / monthIncome) * 100 : 0;

  const totalInvested = investments.reduce((sum, inv) => sum + (inv.quantity * inv.averagePrice), 0);
  const currentPortfolioValue = investments.reduce((sum, inv) => sum + (inv.quantity * inv.currentPrice), 0);
  const totalProfitLoss = currentPortfolioValue - totalInvested;
  const totalProfitLossPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

  const currentMonthDividends = dividends
    .filter(d => d.paymentDate.startsWith(selectedMonth))
    .reduce((sum, d) => sum + d.amount, 0);

  const allTimeDividends = dividends.reduce((sum, d) => sum + d.amount, 0);

  const netWorth = currentPortfolioValue + Math.max(0, monthBalance);

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        investments,
        dividends,
        monthlyPerformances,
        selectedMonth,
        setSelectedMonth,
        isLoadingData,
        isSaving,
        syncError,
        clearSyncError,
        hasLocalDataToMigrate,
        isMigratedToCloud,
        migrateLocalDataToCloud,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addInvestment,
        updateInvestment,
        deleteInvestment,
        updateAssetPrice,
        addDividend,
        deleteDividend,
        clearDatabase,
        resetToDemoData,
        exportDataJSON,
        importDataJSON,
        metrics: {
          monthIncome,
          monthExpense,
          monthBalance,
          monthSavingsRate,
          totalInvested,
          currentPortfolioValue,
          totalProfitLoss,
          totalProfitLossPercent,
          currentMonthDividends,
          allTimeDividends,
          netWorth
        }
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
