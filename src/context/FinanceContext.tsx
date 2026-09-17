import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Transaction, 
  InvestmentAsset, 
  DividendRecord, 
  MonthlyPerformanceRecord 
} from '../types';
import { 
  INITIAL_TRANSACTIONS, 
  INITIAL_INVESTMENTS, 
  INITIAL_DIVIDENDS, 
  INITIAL_MONTHLY_PERFORMANCE 
} from '../data/initialData';

interface FinanceContextType {
  transactions: Transaction[];
  investments: InvestmentAsset[];
  dividends: DividendRecord[];
  monthlyPerformances: MonthlyPerformanceRecord[];
  selectedMonth: string; // "YYYY-MM"
  setSelectedMonth: (month: string) => void;
  
  // Transaction actions
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  updateTransaction: (tx: Transaction) => void;
  deleteTransaction: (id: string) => void;
  
  // Investment actions
  addInvestment: (asset: Omit<InvestmentAsset, 'id'>) => void;
  updateInvestment: (asset: InvestmentAsset) => void;
  deleteInvestment: (id: string) => void;
  updateAssetPrice: (id: string, newPrice: number) => void;
  
  // Dividend actions
  addDividend: (div: Omit<DividendRecord, 'id'>) => void;
  deleteDividend: (id: string) => void;

  // Backup & reset
  resetToDemoData: () => void;
  exportDataJSON: () => void;
  importDataJSON: (jsonString: string) => boolean;

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

const STORAGE_KEYS = {
  TRANSACTIONS: 'financontrol_transactions_v1',
  INVESTMENTS: 'financontrol_investments_v1',
  DIVIDENDS: 'financontrol_dividends_v1',
  PERFORMANCE: 'financontrol_performance_v1',
  SELECTED_MONTH: 'financontrol_selected_month_v1'
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [investments, setInvestments] = useState<InvestmentAsset[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INVESTMENTS);
      return saved ? JSON.parse(saved) : INITIAL_INVESTMENTS;
    } catch {
      return INITIAL_INVESTMENTS;
    }
  });

  const [dividends, setDividends] = useState<DividendRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DIVIDENDS);
      return saved ? JSON.parse(saved) : INITIAL_DIVIDENDS;
    } catch {
      return INITIAL_DIVIDENDS;
    }
  });

  const [monthlyPerformances, setMonthlyPerformances] = useState<MonthlyPerformanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PERFORMANCE);
      return saved ? JSON.parse(saved) : INITIAL_MONTHLY_PERFORMANCE;
    } catch {
      return INITIAL_MONTHLY_PERFORMANCE;
    }
  });

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_MONTH);
      return saved || '2026-09';
    } catch {
      return '2026-09';
    }
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.error('Error saving transactions', e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.INVESTMENTS, JSON.stringify(investments));
    } catch (e) {
      console.error('Error saving investments', e);
    }
  }, [investments]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DIVIDENDS, JSON.stringify(dividends));
    } catch (e) {
      console.error('Error saving dividends', e);
    }
  }, [dividends]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PERFORMANCE, JSON.stringify(monthlyPerformances));
    } catch (e) {
      console.error('Error saving performance', e);
    }
  }, [monthlyPerformances]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SELECTED_MONTH, selectedMonth);
    } catch (e) {
      console.error('Error saving selectedMonth', e);
    }
  }, [selectedMonth]);

  // Transaction Handlers
  const addTransaction = (txData: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  const updateTransaction = (updatedTx: Transaction) => {
    setTransactions(prev => prev.map(tx => tx.id === updatedTx.id ? updatedTx : tx));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(tx => tx.id !== id));
  };

  // Investment Handlers
  const addInvestment = (assetData: Omit<InvestmentAsset, 'id'>) => {
    const newAsset: InvestmentAsset = {
      ...assetData,
      id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    };
    setInvestments(prev => [...prev, newAsset]);
  };

  const updateInvestment = (updatedAsset: InvestmentAsset) => {
    setInvestments(prev => prev.map(asset => asset.id === updatedAsset.id ? updatedAsset : asset));
  };

  const deleteInvestment = (id: string) => {
    setInvestments(prev => prev.filter(asset => asset.id !== id));
  };

  const updateAssetPrice = (id: string, newPrice: number) => {
    setInvestments(prev => prev.map(asset => {
      if (asset.id === id) {
        return { ...asset, currentPrice: newPrice };
      }
      return asset;
    }));
  };

  // Dividend Handlers
  const addDividend = (divData: Omit<DividendRecord, 'id'>) => {
    const newDiv: DividendRecord = {
      ...divData,
      id: `div-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    };
    setDividends(prev => [newDiv, ...prev]);

    // Also optionally record a matching revenue transaction in the selected month for convenience
    addTransaction({
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

  const deleteDividend = (id: string) => {
    setDividends(prev => prev.filter(div => div.id !== id));
  };

  // Reset & Backup
  const resetToDemoData = () => {
    setTransactions(INITIAL_TRANSACTIONS);
    setInvestments(INITIAL_INVESTMENTS);
    setDividends(INITIAL_DIVIDENDS);
    setMonthlyPerformances(INITIAL_MONTHLY_PERFORMANCE);
    setSelectedMonth('2026-09');
    localStorage.clear();
  };

  const exportDataJSON = () => {
    const data = {
      version: '1.0',
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

  const importDataJSON = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed.transactions) && Array.isArray(parsed.investments)) {
        setTransactions(parsed.transactions);
        setInvestments(parsed.investments);
        if (Array.isArray(parsed.dividends)) setDividends(parsed.dividends);
        if (Array.isArray(parsed.monthlyPerformances)) setMonthlyPerformances(parsed.monthlyPerformances);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Calculate Metrics
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
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addInvestment,
        updateInvestment,
        deleteInvestment,
        updateAssetPrice,
        addDividend,
        deleteDividend,
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
