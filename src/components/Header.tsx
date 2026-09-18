import React, { useState } from 'react';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  PlusCircle, 
  Coins, 
  Calendar, 
  Settings, 
  Download, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Wallet,
  User as UserIcon,
  Lock,
  LogOut,
  Cloud
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatMonthYear, formatPercent } from '../utils/formatters';

interface HeaderProps {
  onOpenTransactionModal: () => void;
  onOpenInvestmentModal: () => void;
  onOpenDividendModal: () => void;
  onOpenSettingsModal: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenTransactionModal,
  onOpenInvestmentModal,
  onOpenDividendModal,
  onOpenSettingsModal,
  activeTab,
  setActiveTab,
}) => {
  const { selectedMonth, setSelectedMonth, metrics, isSaving } = useFinance();
  const { currentUser, lockScreen, logout, isCloudConnected } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Navigation between months
  const navigateMonth = (direction: number) => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    let year = parseInt(yearStr, 10);
    let month = parseInt(monthStr, 10) + direction;

    if (month > 12) {
      month = 1;
      year += 1;
    } else if (month < 1) {
      month = 12;
      year -= 1;
    }

    const newMonthStr = month.toString().padStart(2, '0');
    setSelectedMonth(`${year}-${newMonthStr}`);
  };

  const navItems = [
    { id: 'overview', label: 'Visão Geral' },
    { id: 'transactions', label: 'Receitas & Despesas' },
    { id: 'investments', label: 'Carteira de Investimentos' },
    { id: 'profitability', label: 'Relatórios de Rentabilidade' },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top Brand & Actions Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Month Picker */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                  FinanControl
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    Pro
                  </span>
                </h1>
                <p className="text-xs text-slate-700 font-medium">Controle Pessoal & Carteira de Investimentos</p>
              </div>
            </div>

            {/* Mobile Month Switcher */}
            <div className="flex md:hidden items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
              <button
                id="btn-prev-month-mobile"
                onClick={() => navigateMonth(-1)}
                className="p-1 text-slate-600 hover:text-slate-900 rounded"
                title="Mês anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-slate-800 px-2">
                {formatMonthYear(selectedMonth).split(' ')[0]}
              </span>
              <button
                id="btn-next-month-mobile"
                onClick={() => navigateMonth(1)}
                className="p-1 text-slate-600 hover:text-slate-900 rounded"
                title="Próximo mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Desktop Month Selector & Net Worth Metric */}
          <div className="flex items-center flex-wrap gap-3">
            {/* Desktop Month Switcher */}
            <div className="hidden md:flex items-center bg-slate-50 border border-slate-200/80 rounded-xl px-2 py-1 shadow-xs">
              <button
                id="btn-prev-month"
                onClick={() => navigateMonth(-1)}
                className="p-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors"
                title="Mês anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1.5 px-3 py-1">
                <Calendar className="w-4 h-4 text-slate-700" />
                <span className="text-sm font-semibold text-slate-800 tracking-tight">
                  {formatMonthYear(selectedMonth)}
                </span>
              </div>
              <button
                id="btn-next-month"
                onClick={() => navigateMonth(1)}
                className="p-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors"
                title="Próximo mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick KPI Badge */}
            <div className="hidden lg:flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5">
              <div>
                <span className="text-[11px] text-slate-700 font-medium block leading-none">Patrimônio Global</span>
                <span className="text-sm font-bold text-slate-900 font-mono">
                  {formatCurrency(metrics.netWorth)}
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div>
                <span className="text-[11px] text-slate-700 font-medium block leading-none">Rentab. Total</span>
                <span className={`text-sm font-bold font-mono ${metrics.totalProfitLoss >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {formatPercent(metrics.totalProfitLossPercent)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                id="btn-add-transaction"
                onClick={onOpenTransactionModal}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-xs transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Nova Transação</span>
              </button>

              <button
                id="btn-add-investment"
                onClick={onOpenInvestmentModal}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-xs transition-colors"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Novo Ativo</span>
              </button>

              <button
                id="btn-add-dividend"
                onClick={onOpenDividendModal}
                className="hidden sm:flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium px-2.5 py-2 rounded-xl border border-slate-300/80 transition-colors"
                title="Registrar Proventos ou Dividendos"
              >
                <Coins className="w-4 h-4 text-amber-500" />
                <span>Provento</span>
              </button>

              <button
                id="btn-open-settings"
                onClick={onOpenSettingsModal}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
                title="Configurações e Backup"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* User Profile & Auth dropdown */}
              {currentUser && (
                <div className="relative">
                  <button
                    id="btn-user-menu"
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 transition-colors cursor-pointer"
                    title={`Conectado como ${currentUser.name}`}
                  >
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-emerald-600 text-white flex items-center justify-center text-xs font-bold uppercase shadow-xs">
                      {currentUser.name ? currentUser.name.charAt(0) : 'U'}
                    </div>
                    <span className="text-xs font-medium text-slate-700 hidden sm:inline max-w-[100px] truncate">
                      {currentUser.name.split(' ')[0]}
                    </span>
                  </button>

                  {/* Dropdown Popover */}
                  {isUserMenuOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsUserMenuOpen(false)} 
                      />
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                        <div className="px-4 py-2.5 border-b border-slate-100">
                          <p className="text-xs font-bold text-slate-800 truncate">{currentUser.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${isCloudConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                              <span className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider">
                                {isCloudConnected ? 'Supabase Nuvem' : 'Local Fallback'}
                              </span>
                            </div>
                            {isSaving && (
                              <span className="text-[10px] font-medium text-indigo-600 flex items-center gap-1">
                                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                Sincronizando
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="p-1 space-y-0.5">
                          <button
                            id="btn-lock-screen"
                            type="button"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              lockScreen();
                            }}
                            className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer font-medium"
                          >
                            <Lock className="w-3.5 h-3.5 text-amber-500" />
                            <span>Bloquear Tela (Pedir Senha)</span>
                          </button>

                          <button
                            id="btn-logout"
                            type="button"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              logout();
                            }}
                            className="w-full px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer font-medium"
                          >
                            <LogOut className="w-3.5 h-3.5 text-rose-500" />
                            <span>Encerrar Sessão (Logout)</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mt-3.5 pt-2 border-t border-slate-100 overflow-x-auto scrollbar-none">
          {navItems.map(item => (
            <button
              key={item.id}
              id={`tab-nav-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`px-3.5 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap rounded-lg transition-all ${
                activeTab === item.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
