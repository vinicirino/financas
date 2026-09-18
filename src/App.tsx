import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import { Header } from './components/Header';
import { OverviewTab } from './components/OverviewTab';
import { TransactionsTab } from './components/TransactionsTab';
import { InvestmentsTab } from './components/InvestmentsTab';
import { ProfitabilityReportTab } from './components/ProfitabilityReportTab';
import { TransactionModal } from './components/TransactionModal';
import { InvestmentModal } from './components/InvestmentModal';
import { DividendModal } from './components/DividendModal';
import { SettingsModal } from './components/SettingsModal';
import { Transaction, InvestmentAsset } from './types';

function MainLayout() {
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Modal states
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<InvestmentAsset | null>(null);

  const [isDividendModalOpen, setIsDividendModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const { 
    selectedMonth, 
    addTransaction, 
    updateTransaction, 
    addInvestment, 
    updateInvestment,
    addDividend 
  } = useFinance();

  // Handlers
  const handleOpenNewTransaction = () => {
    setEditingTransaction(null);
    setIsTransactionModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsTransactionModalOpen(true);
  };

  const handleSaveTransaction = (txData: any) => {
    if (txData.id) {
      updateTransaction(txData as Transaction);
    } else {
      addTransaction(txData);
    }
  };

  const handleOpenNewInvestment = () => {
    setEditingAsset(null);
    setIsInvestmentModalOpen(true);
  };

  const handleEditAsset = (asset: InvestmentAsset) => {
    setEditingAsset(asset);
    setIsInvestmentModalOpen(true);
  };

  const handleSaveInvestment = (assetData: any) => {
    if (assetData.id) {
      updateInvestment(assetData as InvestmentAsset);
    } else {
      addInvestment(assetData);
    }
  };

  const handleSaveDividend = (divData: any) => {
    addDividend(divData);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenTransactionModal={handleOpenNewTransaction}
        onOpenInvestmentModal={handleOpenNewInvestment}
        onOpenDividendModal={() => setIsDividendModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'overview' && (
          <OverviewTab
            onNavigateToTab={setActiveTab}
            onOpenTransactionModal={handleOpenNewTransaction}
            onOpenInvestmentModal={handleOpenNewInvestment}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsTab
            onOpenAddModal={handleOpenNewTransaction}
            onEditTransaction={handleEditTransaction}
          />
        )}

        {activeTab === 'investments' && (
          <InvestmentsTab
            onOpenAddAssetModal={handleOpenNewInvestment}
            onEditAsset={handleEditAsset}
            onOpenDividendModal={() => setIsDividendModalOpen(true)}
          />
        )}

        {activeTab === 'profitability' && (
          <ProfitabilityReportTab />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-4 mt-auto print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-700">
          <div>
            <span className="font-semibold text-slate-800">FinanControl Pro</span> — Gestão de Finanças Pessoais & Investimentos
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="hover:text-slate-900 transition-colors"
            >
              Backup & Configurações
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('profitability')}
              className="hover:text-slate-900 transition-colors"
            >
              Relatório de Rentabilidade
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        transactionToEdit={editingTransaction}
        defaultMonth={selectedMonth}
      />

      <InvestmentModal
        isOpen={isInvestmentModalOpen}
        onClose={() => {
          setIsInvestmentModalOpen(false);
          setEditingAsset(null);
        }}
        onSave={handleSaveInvestment}
        assetToEdit={editingAsset}
      />

      <DividendModal
        isOpen={isDividendModalOpen}
        onClose={() => setIsDividendModalOpen(false)}
        onSave={handleSaveDividend}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-400">Conectando à nuvem...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return <MainLayout />;
}

export default function App() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <AppContent />
      </FinanceProvider>
    </AuthProvider>
  );
}

