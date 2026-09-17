import React, { useMemo, useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Printer, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  Award, 
  Percent, 
  Coins, 
  HelpCircle,
  FileText,
  Download,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { ForecastReport } from './ForecastReport';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { 
  formatCurrency, 
  formatPercent, 
  formatMonthYear, 
  formatMonthShort, 
  ASSET_CLASS_LABELS 
} from '../utils/formatters';

export const ProfitabilityReportTab: React.FC = () => {
  const { 
    monthlyPerformances, 
    selectedMonth, 
    setSelectedMonth, 
    investments, 
    dividends, 
    metrics 
  } = useFinance();

  const [reportSubTab, setReportSubTab] = useState<'historico' | 'previsoes'>('historico');

  // Find record for current selected month, or fallback to latest
  const currentMonthReport = useMemo(() => {
    const found = monthlyPerformances.find(p => p.monthKey === selectedMonth);
    if (found) return found;
    return monthlyPerformances[monthlyPerformances.length - 1];
  }, [monthlyPerformances, selectedMonth]);

  // Annual cumulative calculations
  const annualSummary = useMemo(() => {
    let totalDividends = 0;
    let totalCapitalGains = 0;
    let totalContributions = 0;
    let cumulativeReturn = 1;
    let cumulativeCDI = 1;
    let cumulativeIbov = 1;
    let cumulativeIpca = 1;

    monthlyPerformances.forEach(p => {
      totalDividends += p.dividendsReceived;
      totalCapitalGains += p.capitalGains;
      totalContributions += p.contributions;
      cumulativeReturn *= (1 + p.monthlyYieldPercent / 100);
      cumulativeCDI *= (1 + p.benchmarkCdiPercent / 100);
      cumulativeIbov *= (1 + p.benchmarkIbovPercent / 100);
      cumulativeIpca *= (1 + p.benchmarkIpcaPercent / 100);
    });

    const totalYieldPercent = (cumulativeReturn - 1) * 100;
    const totalCdiPercent = (cumulativeCDI - 1) * 100;
    const totalIbovPercent = (cumulativeIbov - 1) * 100;
    const totalIpcaPercent = (cumulativeIpca - 1) * 100;
    const totalNetProfit = totalDividends + totalCapitalGains;
    const alphaVsCdi = totalYieldPercent - totalCdiPercent;
    const percentOfCdi = totalCdiPercent > 0 ? (totalYieldPercent / totalCdiPercent) * 100 : 0;

    return {
      totalDividends,
      totalCapitalGains,
      totalContributions,
      totalNetProfit,
      totalYieldPercent,
      totalCdiPercent,
      totalIbovPercent,
      totalIpcaPercent,
      alphaVsCdi,
      percentOfCdi,
      monthsCount: monthlyPerformances.length
    };
  }, [monthlyPerformances]);

  // Chart data for monthly comparison
  const chartData = useMemo(() => {
    return monthlyPerformances.map(p => ({
      month: p.monthLabel,
      rawMonth: p.monthKey,
      'Rentabilidade Carteira (%)': p.monthlyYieldPercent,
      'CDI Benchmark (%)': p.benchmarkCdiPercent,
      'Ibovespa (%)': p.benchmarkIbovPercent,
      'Proventos (R$)': p.dividendsReceived,
      'Lucro Líquido (R$)': p.netProfit
    }));
  }, [monthlyPerformances]);

  // Breakdown by asset in current portfolio
  const assetPerformance = useMemo(() => {
    return investments.map(inv => {
      const invested = inv.quantity * inv.averagePrice;
      const current = inv.quantity * inv.currentPrice;
      const gain = current - invested;
      const gainPct = invested > 0 ? (gain / invested) * 100 : 0;
      
      const assetDivs = dividends
        .filter(d => d.assetId === inv.id || d.ticker.toLowerCase() === inv.ticker.toLowerCase())
        .reduce((sum, d) => sum + d.amount, 0);

      const totalReturn = gain + assetDivs;
      const totalReturnPct = invested > 0 ? (totalReturn / invested) * 100 : 0;

      return {
        ...inv,
        invested,
        current,
        gain,
        gainPct,
        assetDivs,
        totalReturn,
        totalReturnPct
      };
    }).sort((a, b) => b.totalReturnPct - a.totalReturnPct);
  }, [investments, dividends]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12 print:space-y-4 print:pb-0">
      
      {/* Header Bar with Subtab Navigation & Print */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Relatórios Financeiros & Rentabilidade
            </h2>
          </div>
          <p className="text-xs text-slate-700">
            Análise consolidada de rentabilidade mensal, comparação com benchmarks e projeções para os próximos 10 anos.
          </p>

          {/* Sub-tabs Switcher */}
          <div className="flex items-center gap-2 mt-4">
            <button
              id="subtab-report-historico"
              onClick={() => setReportSubTab('historico')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                reportSubTab === 'historico'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Rentabilidade Histórica (Mês a Mês)</span>
            </button>

            <button
              id="subtab-report-previsoes"
              onClick={() => setReportSubTab('previsoes')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                reportSubTab === 'previsoes'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-indigo-600 hover:bg-slate-200/80'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Previsões (Próximos 10 Anos)</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                reportSubTab === 'previsoes' ? 'bg-indigo-700 text-white' : 'bg-amber-100 text-amber-800'
              }`}>
                Projeção
              </span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Month selector specifically for report when in historico mode */}
          {reportSubTab === 'historico' && (
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <span>Mês:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              >
                {monthlyPerformances.map(p => (
                  <option key={p.monthKey} value={p.monthKey}>{p.monthLabel} ({formatMonthYear(p.monthKey)})</option>
                ))}
              </select>
            </div>
          )}

          <button
            id="btn-print-report"
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Salvar PDF</span>
          </button>
        </div>
      </div>

      {/* Render Forecast Tab if active */}
      {reportSubTab === 'previsoes' && (
        <ForecastReport />
      )}

      {/* Render Historical Monthly Tab if active */}
      {reportSubTab === 'historico' && (
        <>
          {/* Print only banner title */}
          <div className="hidden print:block border-b border-slate-300 pb-4 mb-4">
            <h1 className="text-2xl font-bold text-slate-900">FinanControl Pro - Relatório de Rentabilidade Mensal</h1>
            <p className="text-xs text-slate-700 mt-1">
              Posição referente a {formatMonthYear(selectedMonth)} • Gerado automaticamente
            </p>
          </div>

          {/* Top Annual & Monthly Executive Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Rentabilidade Acumulada 2026 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Rentabilidade Ano</span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold">2026</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-700">
              {formatPercent(annualSummary.totalYieldPercent)}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-700">
            <span className="font-semibold text-indigo-700 font-mono">
              {annualSummary.percentOfCdi.toFixed(0)}% do CDI
            </span>
            <span className="ml-1">no acumulado</span>
          </div>
        </div>

        {/* Rentabilidade do Mês Selecionado */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Mês Atual ({formatMonthShort(selectedMonth)})</span>
            <span className={`w-2.5 h-2.5 rounded-full ${currentMonthReport.monthlyYieldPercent >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono ${currentMonthReport.monthlyYieldPercent >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatPercent(currentMonthReport.monthlyYieldPercent)}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-700">
            <span>CDI: {formatPercent(currentMonthReport.benchmarkCdiPercent, false)}</span>
            <span className="mx-1">•</span>
            <span className={currentMonthReport.monthlyYieldPercent >= currentMonthReport.benchmarkCdiPercent ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}>
              Alpha: {formatPercent(currentMonthReport.monthlyYieldPercent - currentMonthReport.benchmarkCdiPercent)}
            </span>
          </div>
        </div>

        {/* Proventos Recebidos no Ano */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Proventos no Ano</span>
            <Coins className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-700">
            {formatCurrency(annualSummary.totalDividends)}
          </div>
          <div className="mt-1 text-xs text-slate-700">
            <span>Mês selecionado: </span>
            <span className="font-semibold text-slate-900 font-mono">
              {formatCurrency(currentMonthReport.dividendsReceived)}
            </span>
          </div>
        </div>

        {/* Lucro Líquido Acumulado */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Lucro Líquido Carteira</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900">
            {formatCurrency(annualSummary.totalNetProfit)}
          </div>
          <div className="mt-1 text-xs text-slate-700">
            <span>Valorização + Dividendos</span>
          </div>
        </div>

      </div>

      {/* Highlight Box: Detalhamento do Mês Selecionado */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Demonstrativo Mensal Consolidado
            </span>
            <h2 className="text-xl font-bold tracking-tight text-white mt-0.5">
              {formatMonthYear(selectedMonth)}
            </h2>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="bg-white/10 rounded-xl px-3 py-1.5 border border-white/10">
              <span className="text-slate-300 block text-[10px]">Patrimônio Inicial</span>
              <span className="font-mono font-bold text-white">{formatCurrency(currentMonthReport.startingPortfolioValue)}</span>
            </div>
            <div className="bg-white/10 rounded-xl px-3 py-1.5 border border-white/10">
              <span className="text-slate-300 block text-[10px]">Patrimônio Final</span>
              <span className="font-mono font-bold text-emerald-300">{formatCurrency(currentMonthReport.endingPortfolioValue)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-5">
          <div>
            <span className="text-[11px] text-slate-400 block">Aportes Líquidos</span>
            <span className="text-base font-bold font-mono text-white">
              {formatCurrency(currentMonthReport.contributions)}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Proventos (R$)</span>
            <span className="text-base font-bold font-mono text-amber-300">
              +{formatCurrency(currentMonthReport.dividendsReceived)}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Ganho de Capital</span>
            <span className={`text-base font-bold font-mono ${currentMonthReport.capitalGains >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
              {currentMonthReport.capitalGains >= 0 ? '+' : ''}{formatCurrency(currentMonthReport.capitalGains)}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Lucro Líquido Total</span>
            <span className={`text-base font-bold font-mono ${currentMonthReport.netProfit >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
              {formatCurrency(currentMonthReport.netProfit)}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Rentabilidade (%)</span>
            <span className="text-base font-bold font-mono text-emerald-400">
              {formatPercent(currentMonthReport.monthlyYieldPercent)}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Benchmark CDI</span>
            <span className="text-base font-bold font-mono text-slate-200">
              {formatPercent(currentMonthReport.benchmarkCdiPercent, false)}
            </span>
          </div>
        </div>
      </div>

      {/* Gráfico Intuitivo: Rentabilidade Mensal da Carteira vs CDI & Ibovespa */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs print:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              Comparativo de Rentabilidade Mensal vs Benchmarks
            </h2>
            <p className="text-xs text-slate-700">Desempenho da carteira de investimentos comparada ao CDI e Ibovespa em 2026</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-700">
              <span className="w-3 h-3 rounded bg-indigo-600 inline-block" /> Carteira (%)
            </span>
            <span className="flex items-center gap-1.5 text-slate-700">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> CDI (%)
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${v}%`} tickLine={false} />
              <Tooltip 
                formatter={(val: any, name: any) => [`${Number(val).toFixed(2)}%`, name]}
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  borderRadius: '12px', 
                  border: 'none', 
                  color: '#fff', 
                  fontSize: '12px' 
                }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="Rentabilidade Carteira (%)" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Line type="monotone" dataKey="CDI Benchmark (%)" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Ibovespa (%)" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabela Detalhada Histórica Mês a Mês */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden print:border print:shadow-none">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Histórico Completo de Rentabilidade Mês a Mês (2026)</h3>
          <span className="text-xs text-slate-700">Valores em Reais (R$) e Percentual (%)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Mês / Ano</th>
                <th className="py-3 px-4 text-right">Patr. Inicial</th>
                <th className="py-3 px-4 text-right">Aportes</th>
                <th className="py-3 px-4 text-right">Proventos</th>
                <th className="py-3 px-4 text-right">Ganho Capital</th>
                <th className="py-3 px-4 text-right">Lucro Líquido</th>
                <th className="py-3 px-4 text-right">Patr. Final</th>
                <th className="py-3 px-4 text-right font-bold text-slate-900">Rentab. (%)</th>
                <th className="py-3 px-4 text-right">CDI (%)</th>
                <th className="py-3 px-4 text-right">Alpha CDI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthlyPerformances.map(p => {
                const isCurrent = p.monthKey === selectedMonth;
                const alpha = p.monthlyYieldPercent - p.benchmarkCdiPercent;

                return (
                  <tr 
                    key={p.monthKey} 
                    className={`transition-colors cursor-pointer ${
                      isCurrent ? 'bg-indigo-50/60 font-medium' : 'hover:bg-slate-50'
                    }`}
                    onClick={() => setSelectedMonth(p.monthKey)}
                    title="Clique para selecionar este mês"
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {isCurrent && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
                        <span className="font-bold text-slate-900">{p.monthLabel}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">
                      {formatCurrency(p.startingPortfolioValue)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">
                      {formatCurrency(p.contributions)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-amber-700">
                      +{formatCurrency(p.dividendsReceived)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      <span className={p.capitalGains >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                        {formatCurrency(p.capitalGains)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold">
                      <span className={p.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                        {formatCurrency(p.netProfit)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(p.endingPortfolioValue)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      <span className={p.monthlyYieldPercent >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                        {formatPercent(p.monthlyYieldPercent)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">
                      {formatPercent(p.benchmarkCdiPercent, false)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold">
                      <span className={alpha >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                        {formatPercent(alpha)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold text-slate-900">
                <td className="py-3 px-4">Consolidado 2026</td>
                <td className="py-3 px-4 text-right font-mono">
                  {formatCurrency(monthlyPerformances[0]?.startingPortfolioValue || 0)}
                </td>
                <td className="py-3 px-4 text-right font-mono">
                  {formatCurrency(annualSummary.totalContributions)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-amber-700">
                  +{formatCurrency(annualSummary.totalDividends)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-emerald-700">
                  +{formatCurrency(annualSummary.totalCapitalGains)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-emerald-700">
                  +{formatCurrency(annualSummary.totalNetProfit)}
                </td>
                <td className="py-3 px-4 text-right font-mono">
                  {formatCurrency(metrics.currentPortfolioValue)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-emerald-700">
                  {formatPercent(annualSummary.totalYieldPercent)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-slate-700">
                  {formatPercent(annualSummary.totalCdiPercent, false)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-emerald-700">
                  {formatPercent(annualSummary.alphaVsCdi)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Detalhamento de Rentabilidade por Ativo da Carteira Atual */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Desempenho Individual por Ativo (Retorno Total)</h3>
          <p className="text-xs text-slate-700 mt-0.5">
            Considera valorização das cotas mais proventos recebidos desde a aquisição
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Ativo</th>
                <th className="py-3 px-4">Classe</th>
                <th className="py-3 px-4 text-right">Investido</th>
                <th className="py-3 px-4 text-right">Valor Atual</th>
                <th className="py-3 px-4 text-right">Ganho Cota</th>
                <th className="py-3 px-4 text-right">Proventos</th>
                <th className="py-3 px-4 text-right">Retorno Total R$</th>
                <th className="py-3 px-4 text-right">Rentabilidade Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assetPerformance.map(asset => {
                const meta = ASSET_CLASS_LABELS[asset.assetClass] || { label: asset.assetClass, color: '#64748b', bgLight: '#f1f5f9' };
                return (
                  <tr key={asset.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900">{asset.ticker}</span>
                      <span className="text-[11px] text-slate-700 block truncate max-w-xs">{asset.name}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span 
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ backgroundColor: meta.bgLight, color: meta.color }}
                      >
                        {meta.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">{formatCurrency(asset.invested)}</td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-900">{formatCurrency(asset.current)}</td>
                    <td className="py-3 px-4 text-right font-mono">
                      <span className={asset.gain >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                        {formatCurrency(asset.gain)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-amber-700">
                      {asset.assetDivs > 0 ? `+${formatCurrency(asset.assetDivs)}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      <span className={asset.totalReturn >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                        {formatCurrency(asset.totalReturn)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-sm">
                      <span className={asset.totalReturnPct >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                        {formatPercent(asset.totalReturnPct)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

    </div>
  );
};
