import React, { useMemo } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  TrendingUp, 
  PiggyBank, 
  CheckCircle2, 
  Clock, 
  PieChart as PieIcon, 
  BarChart3,
  Coins,
  ChevronRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { 
  formatCurrency, 
  formatPercent, 
  formatDate, 
  formatMonthYear, 
  formatMonthShort, 
  ASSET_CLASS_LABELS 
} from '../utils/formatters';

interface OverviewTabProps {
  onNavigateToTab: (tab: string) => void;
  onOpenTransactionModal: () => void;
  onOpenInvestmentModal: () => void;
  onApplySavings?: (amount: number) => void;
}

const CATEGORY_COLORS = [
  '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', 
  '#6366f1', '#14b8a6', '#f97316', '#64748b', '#84cc16'
];

export const OverviewTab: React.FC<OverviewTabProps> = ({
  onNavigateToTab,
  onOpenTransactionModal,
  onOpenInvestmentModal,
  onApplySavings,
}) => {
  const { transactions, investments, selectedMonth, metrics, monthlyPerformances } = useFinance();

  // Filter transactions for current selected month
  const currentMonthTransactions = useMemo(() => {
    return transactions.filter(t => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // Expenses by Category calculation
  const expenseByCategory = useMemo(() => {
    const expenses = currentMonthTransactions.filter(t => t.type === 'despesa');
    const categoryTotals: Record<string, number> = {};
    expenses.forEach(tx => {
      categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
    });

    const totalExpenseAmount = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

    return Object.entries(categoryTotals)
      .map(([name, value], index) => ({
        name,
        value,
        percentage: totalExpenseAmount > 0 ? (value / totalExpenseAmount) * 100 : 0,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);
  }, [currentMonthTransactions]);

  // Cashflow historical data for the last 6 distinct months
  const cashflowHistory = useMemo(() => {
    // Collect all months present in transactions
    const monthsSet = new Set<string>();
    transactions.forEach(t => {
      const ym = t.date.slice(0, 7);
      monthsSet.add(ym);
    });
    // Ensure selectedMonth is included
    monthsSet.add(selectedMonth);

    const sortedMonths = Array.from(monthsSet).sort().slice(-6);

    return sortedMonths.map(mKey => {
      const monthTxs = transactions.filter(t => t.date.startsWith(mKey));
      const receitas = monthTxs.filter(t => t.type === 'receita').reduce((sum, t) => sum + t.amount, 0);
      const despesas = monthTxs.filter(t => t.type === 'despesa').reduce((sum, t) => sum + t.amount, 0);
      const saldo = receitas - despesas;
      return {
        month: formatMonthShort(mKey),
        rawMonth: mKey,
        Receitas: receitas,
        Despesas: despesas,
        Saldo: saldo
      };
    });
  }, [transactions, selectedMonth]);

  // Portfolio allocation by asset class
  const portfolioAllocation = useMemo(() => {
    const classTotals: Record<string, number> = {};
    investments.forEach(inv => {
      const val = inv.quantity * inv.currentPrice;
      classTotals[inv.assetClass] = (classTotals[inv.assetClass] || 0) + val;
    });

    const totalVal = Object.values(classTotals).reduce((a, b) => a + b, 0);

    return Object.entries(classTotals).map(([key, value]) => {
      const meta = ASSET_CLASS_LABELS[key] || { label: key, color: '#94a3b8' };
      return {
        key,
        name: meta.label,
        value,
        percentage: totalVal > 0 ? (value / totalVal) * 100 : 0,
        color: meta.color
      };
    }).sort((a, b) => b.value - a.value);
  }, [investments]);

  // Pending payments in current month
  const pendingTransactions = useMemo(() => {
    return currentMonthTransactions
      .filter(t => t.status === 'pendente')
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [currentMonthTransactions]);

  // Top performing investments
  const topInvestments = useMemo(() => {
    return [...investments]
      .map(inv => {
        const invested = inv.quantity * inv.averagePrice;
        const current = inv.quantity * inv.currentPrice;
        const profit = current - invested;
        const profitPct = invested > 0 ? (profit / invested) * 100 : 0;
        return {
          ...inv,
          invested,
          current,
          profit,
          profitPct
        };
      })
      .sort((a, b) => b.profitPct - a.profitPct)
      .slice(0, 4);
  }, [investments]);

  return (
    <div className="space-y-6 pb-12">
      {/* 4 Core KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Receitas Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Receitas do Mês</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {formatCurrency(metrics.monthIncome)}
            </h2>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-700">
              <span className="text-emerald-700 font-medium">Entradas confirmadas</span>
              <span>em {formatMonthShort(selectedMonth)}</span>
            </div>
          </div>
        </div>

        {/* Despesas Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Despesas do Mês</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {formatCurrency(metrics.monthExpense)}
            </h2>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-700">
              <span className="text-rose-700 font-medium">Saídas totais</span>
              <span>(pagas e pendentes)</span>
            </div>
          </div>
        </div>

        {/* Saldo Líquido & Taxa de Poupança */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Saldo Líquido</span>
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <PiggyBank className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h2 className={`text-2xl font-bold font-mono tracking-tight ${metrics.monthBalance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                {formatCurrency(metrics.monthBalance)}
              </h2>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-700">
                <span className="font-semibold text-emerald-700">
                  {metrics.monthSavingsRate.toFixed(1)}% poupado
                </span>
                <span>da renda total</span>
              </div>
            </div>
          </div>

          {onApplySavings && metrics.monthBalance > 0 && (
            <button
              type="button"
              onClick={() => onApplySavings(metrics.monthBalance)}
              className="mt-3 w-full py-1.5 px-2.5 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-800 border border-emerald-200/80 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Transferir / aplicar este saldo na poupança"
            >
              <PiggyBank className="w-3.5 h-3.5 text-emerald-600" />
              <span>Guardar Saldo na Poupança</span>
            </button>
          )}
        </div>

        {/* Carteira de Investimentos */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Investimentos Atuais</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {formatCurrency(metrics.currentPortfolioValue)}
            </h2>
            <div className="mt-1 flex items-center gap-1.5 text-xs">
              <span className={`font-semibold ${metrics.totalProfitLoss >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {formatPercent(metrics.totalProfitLossPercent)} ({formatCurrency(metrics.totalProfitLoss)})
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Row of Primary Intuitive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Gráfico 1: Fluxo de Caixa Mensal (BarChart 7 colunas) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                Fluxo de Caixa Mensal
              </h2>
              <p className="text-xs text-slate-700">Comparativo histórico de Receitas vs Despesas (Últimos meses)</p>
            </div>
            <button
              onClick={() => onNavigateToTab('transactions')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              Ver todas
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashflowHistory} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis 
                  dataKey="month" 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`} 
                  tickLine={false}
                />
                <Tooltip 
                  formatter={(value: any) => [formatCurrency(Number(value)), '']}
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderRadius: '12px', 
                    border: 'none', 
                    color: '#fff',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px', paddingTop: '4px' }}
                />
                <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="Despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Despesas por Categoria (Donut Chart 5 colunas) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-rose-500" />
                Despesas por Categoria
              </h2>
              <p className="text-xs text-slate-700">Distribuição em {formatMonthYear(selectedMonth)}</p>
            </div>
          </div>

          {expenseByCategory.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 items-center mt-2">
              <div className="h-48 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseByCategory}
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {expenseByCategory.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: any) => [formatCurrency(Number(val)), 'Gasto']}
                      contentStyle={{ 
                        backgroundColor: '#0f172a', 
                        borderRadius: '8px', 
                        border: 'none', 
                        color: '#fff',
                        fontSize: '11px' 
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category Breakdown Mini List */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
                {expenseByCategory.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="font-medium text-slate-700 truncate">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-slate-900 font-mono font-semibold">{formatCurrency(item.value)}</span>
                      <span className="text-slate-700 text-[11px]">({item.percentage.toFixed(0)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-56 flex flex-col items-center justify-center text-center p-4">
              <p className="text-xs text-slate-700">Nenhuma despesa registrada neste mês.</p>
              <button
                onClick={onOpenTransactionModal}
                className="mt-3 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                + Adicionar Despesa
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Row 2: Carteira Alocação & Alertas / Ações Rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Gráfico 3: Alocação da Carteira de Investimentos (6 colunas) */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Coins className="w-5 h-5 text-teal-600" />
                Alocação da Carteira de Investimentos
              </h2>
              <p className="text-xs text-slate-700">Distribuição patrimonial por classe de ativos</p>
            </div>
            <button
              onClick={() => onNavigateToTab('investments')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-800 flex items-center gap-1"
            >
              Ver Carteira
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={portfolioAllocation}
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {portfolioAllocation.map((entry, idx) => (
                      <Cell key={`cell-alloc-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: any) => [formatCurrency(Number(val)), 'Posição']}
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderRadius: '8px', 
                      border: 'none', 
                      color: '#fff', 
                      fontSize: '11px' 
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 text-xs">
              {portfolioAllocation.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="font-medium text-slate-700 truncate">{item.name}</span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(item.value)}</span>
                    <span className="block text-[11px] text-slate-700">{item.percentage.toFixed(1)}% da carteira</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bloco de Ações e Destaques: Próximos Vencimentos & Top Ativos (6 colunas) */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Vencimentos & Contas Pendentes
              </h2>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/70">
                {pendingTransactions.length} pendente(s)
              </span>
            </div>

            {pendingTransactions.length > 0 ? (
              <div className="space-y-2 mt-3">
                {pendingTransactions.slice(0, 3).map(tx => (
                  <div 
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div>
                      <div className="font-semibold text-xs text-slate-800">{tx.description}</div>
                      <div className="text-[11px] text-slate-700 flex items-center gap-2 mt-0.5">
                        <span>Vencimento: {formatDate(tx.date)}</span>
                        <span>•</span>
                        <span>{tx.category}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold font-mono text-rose-600">
                        {formatCurrency(tx.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-emerald-900">Tudo em dia!</div>
                  <div className="text-[11px] text-emerald-700">Não há contas ou recebimentos pendentes registrados para este mês.</div>
                </div>
              </div>
            )}

            {/* Top Ativos em Destaque */}
            <div className="mt-5">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Top Ativos em Valorização
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {topInvestments.slice(0, 2).map(inv => (
                  <div key={inv.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800">{inv.ticker}</span>
                      <span className={`text-[11px] font-bold font-mono ${inv.profitPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatPercent(inv.profitPct)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-700 mt-1 truncate">{inv.name}</div>
                    <div className="text-xs font-semibold text-slate-700 mt-1 font-mono">
                      {formatCurrency(inv.current)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-700">Relatório de rentabilidade pronto</span>
            <button
              onClick={() => onNavigateToTab('profitability')}
              className="font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              Consultar Rentabilidade Mensal
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
