import React, { useMemo, useState } from 'react';
import { 
  TrendingUp, 
  Sparkles, 
  Coins, 
  Calendar, 
  Sliders, 
  ArrowUpRight, 
  ShieldCheck, 
  Flame, 
  Zap, 
  RotateCcw,
  Info,
  DollarSign
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatPercent } from '../utils/formatters';

interface YearProjection {
  yearNumber: number;
  yearLabel: string;
  startBalance: number;
  annualContribution: number;
  cumulativeContribution: number;
  annualInterest: number;
  cumulativeInterest: number;
  annualDividends: number;
  monthlyPassiveIncome: number;
  endBalance: number;
  interestSharePercent: number;
}

export const ForecastReport: React.FC = () => {
  const { monthlyPerformances, metrics, investments, transactions } = useFinance();

  // 1. Calculate statistical baseline from historical data
  const historicalBaseline = useMemo(() => {
    const validPerformances = monthlyPerformances.filter(p => p.startingPortfolioValue > 0 || p.endingPortfolioValue > 0);
    const monthsCount = validPerformances.length || 1;

    // Average monthly contribution in history
    const totalContributions = validPerformances.reduce((acc, p) => acc + (p.contributions > 0 ? p.contributions : 0), 0);
    let avgMonthlyContribution = totalContributions / monthsCount;

    // If historical performance contributions are 0, check transactions savings average
    if (avgMonthlyContribution <= 0) {
      const positiveSavings = transactions
        .filter(t => t.type === 'receita')
        .reduce((sum, t) => sum + t.amount, 0) - 
        transactions
        .filter(t => t.type === 'despesa')
        .reduce((sum, t) => sum + t.amount, 0);
      avgMonthlyContribution = Math.max(1000, positiveSavings > 0 ? positiveSavings / 3 : 1500);
    }

    // Historical monthly yield calculation
    const totalYield = validPerformances.reduce((acc, p) => acc + p.monthlyYieldPercent, 0);
    const avgMonthlyYieldPct = totalYield / monthsCount; // e.g. 1.15%

    // Annualized historical return: (1 + r)^12 - 1
    const annualizedHistoricalReturnPct = (Math.pow(1 + (avgMonthlyYieldPct / 100), 12) - 1) * 100;

    // Historical CDI average
    const totalCdi = validPerformances.reduce((acc, p) => acc + p.benchmarkCdiPercent, 0);
    const avgCdiMonthly = totalCdi / monthsCount;
    const annualizedCdiPct = (Math.pow(1 + (avgCdiMonthly / 100), 12) - 1) * 100;

    // Historical monthly dividends received
    const totalDividends = validPerformances.reduce((acc, p) => acc + p.dividendsReceived, 0);
    const avgMonthlyDividends = totalDividends / monthsCount;
    
    // Dividend Yield annualized estimate over current portfolio
    const currentPortfolio = metrics.currentPortfolioValue > 0 ? metrics.currentPortfolioValue : 50000;
    const annualizedDividendYieldPct = currentPortfolio > 0 
      ? Math.min(12, Math.max(4, ((avgMonthlyDividends * 12) / currentPortfolio) * 100))
      : 7.5;

    return {
      monthsAnalyzed: monthsCount,
      currentPortfolio,
      avgMonthlyContribution: Math.round(avgMonthlyContribution),
      avgMonthlyYieldPct: Number(avgMonthlyYieldPct.toFixed(2)),
      annualizedHistoricalReturnPct: Number(annualizedHistoricalReturnPct.toFixed(2)),
      annualizedCdiPct: Number(annualizedCdiPct.toFixed(2)),
      annualizedDividendYieldPct: Number(annualizedDividendYieldPct.toFixed(2)),
    };
  }, [monthlyPerformances, metrics, transactions]);

  // Scenario selection: 'historico' | 'conservador' | 'otimista' | 'custom'
  const [selectedScenario, setSelectedScenario] = useState<'historico' | 'conservador' | 'otimista' | 'custom'>('historico');

  // Interactive user simulation parameters
  const [customMonthlyContribution, setCustomMonthlyContribution] = useState<number>(historicalBaseline.avgMonthlyContribution);
  const [customAnnualReturn, setCustomAnnualReturn] = useState<number>(
    Math.max(6, Math.min(25, historicalBaseline.annualizedHistoricalReturnPct || 12))
  );
  const [customDividendYield, setCustomDividendYield] = useState<number>(historicalBaseline.annualizedDividendYieldPct || 7);
  const [reinvestDividends, setReinvestDividends] = useState<boolean>(true);

  // Sync custom controls when scenario changes
  const activeParams = useMemo(() => {
    const baseInitial = historicalBaseline.currentPortfolio;

    if (selectedScenario === 'historico') {
      return {
        initialAmount: baseInitial,
        monthlyContribution: historicalBaseline.avgMonthlyContribution,
        annualReturnPct: historicalBaseline.annualizedHistoricalReturnPct > 0 ? historicalBaseline.annualizedHistoricalReturnPct : 12.5,
        annualDivYieldPct: historicalBaseline.annualizedDividendYieldPct > 0 ? historicalBaseline.annualizedDividendYieldPct : 7.2,
      };
    }

    if (selectedScenario === 'conservador') {
      // Conservative: 100% CDI or 85% of return
      const conservativeReturn = Math.max(9.5, historicalBaseline.annualizedCdiPct || 10.5);
      return {
        initialAmount: baseInitial,
        monthlyContribution: Math.round(historicalBaseline.avgMonthlyContribution * 0.85),
        annualReturnPct: Number(conservativeReturn.toFixed(2)),
        annualDivYieldPct: 6.0,
      };
    }

    if (selectedScenario === 'otimista') {
      // Optimistic: Historical + 2.5% a.a. and 15% higher contribution
      return {
        initialAmount: baseInitial,
        monthlyContribution: Math.round(historicalBaseline.avgMonthlyContribution * 1.15),
        annualReturnPct: Number((historicalBaseline.annualizedHistoricalReturnPct + 2.5).toFixed(2)),
        annualDivYieldPct: 8.5,
      };
    }

    // Custom
    return {
      initialAmount: baseInitial,
      monthlyContribution: customMonthlyContribution,
      annualReturnPct: customAnnualReturn,
      annualDivYieldPct: customDividendYield,
    };
  }, [selectedScenario, historicalBaseline, customMonthlyContribution, customAnnualReturn, customDividendYield]);

  // Generate 10-year month-by-month compound projection
  const { projections, milestone10Y, inflectionYear } = useMemo(() => {
    const years: YearProjection[] = [];
    const baseYear = new Date().getFullYear(); // e.g. 2026
    
    let currentBalance = activeParams.initialAmount;
    let cumulativeContribution = activeParams.initialAmount; // Initial capital counts as base contribution
    let cumulativeInterest = 0;

    const monthlyReturnRate = Math.pow(1 + (activeParams.annualReturnPct / 100), 1 / 12) - 1;
    const monthlyDivRate = (activeParams.annualDivYieldPct / 100) / 12;

    let foundInflectionYear: number | null = null;

    for (let yearIdx = 1; yearIdx <= 10; yearIdx++) {
      const yearLabel = `${baseYear + yearIdx}`;
      const yearStartBalance = currentBalance;
      let yearInterest = 0;
      let yearContribution = 0;
      let yearDividends = 0;

      for (let m = 1; m <= 12; m++) {
        // Monthly interest on existing balance
        const mInterest = currentBalance * monthlyReturnRate;
        const mDivs = currentBalance * monthlyDivRate;
        const mContrib = activeParams.monthlyContribution;

        yearInterest += mInterest;
        yearContribution += mContrib;
        yearDividends += mDivs;

        // If reinvesting dividends, they are already part of the total return or added
        currentBalance = currentBalance + mInterest + mContrib;
      }

      cumulativeContribution += yearContribution;
      cumulativeInterest += yearInterest;

      // Check if annual compound interest generated in this year exceeded the annual contribution
      if (yearInterest > yearContribution && foundInflectionYear === null) {
        foundInflectionYear = yearIdx;
      }

      // Estimated passive income per month at the end of this year
      const monthlyPassiveIncome = (currentBalance * (activeParams.annualDivYieldPct / 100)) / 12;
      const interestShare = currentBalance > 0 ? (cumulativeInterest / currentBalance) * 100 : 0;

      years.push({
        yearNumber: yearIdx,
        yearLabel,
        startBalance: yearStartBalance,
        annualContribution: yearContribution,
        cumulativeContribution,
        annualInterest: yearInterest,
        cumulativeInterest,
        annualDividends: yearDividends,
        monthlyPassiveIncome,
        endBalance: currentBalance,
        interestSharePercent: interestShare,
      });
    }

    const lastYear = years[years.length - 1];

    return {
      projections: years,
      milestone10Y: lastYear,
      inflectionYear: foundInflectionYear,
    };
  }, [activeParams]);

  // Chart data formatted
  const chartData = useMemo(() => {
    return projections.map(p => ({
      ano: `Ano ${p.yearNumber} (${p.yearLabel})`,
      anoCurto: `'${p.yearLabel.slice(2)}`,
      'Patrimônio Total (R$)': Math.round(p.endBalance),
      'Aportes Acumulados (R$)': Math.round(p.cumulativeContribution),
      'Juros Compostos Acumulados (R$)': Math.round(p.cumulativeInterest),
      'Renda Mensal Estimada (R$)': Math.round(p.monthlyPassiveIncome),
    }));
  }, [projections]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner: Forecast Presentation */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-indigo-900/40">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-400/20">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Projeção Financeira de Longo Prazo</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Previsão Patrimonial para os Próximos 10 Anos
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Projeção matemática calculada a partir dos seus registros reais de lançamentos mês a mês. 
              Veja a evolução exponencial dos juros compostos e a estimativa de renda passiva para a sua independência financeira.
            </p>
          </div>

          {/* Historical Baseline Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 shrink-0 min-w-[280px]">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Base Histórica Detectada
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                {historicalBaseline.monthsAnalyzed} meses
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Patrimônio Base</span>
                <span className="font-mono font-bold text-white text-sm">
                  {formatCurrency(historicalBaseline.currentPortfolio)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Aporte Médio/Mês</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {formatCurrency(historicalBaseline.avgMonthlyContribution)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Rentab. Histórica</span>
                <span className="font-mono font-bold text-indigo-300">
                  {formatPercent(historicalBaseline.annualizedHistoricalReturnPct)} a.a.
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Dividend Yield Médio</span>
                <span className="font-mono font-bold text-amber-300">
                  {formatPercent(historicalBaseline.annualizedDividendYieldPct)} a.a.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scenario Selector & Custom Simulator Controls */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              Cenários de Previsão
            </h3>
            <p className="text-xs text-slate-700">
              Escolha um modelo calibrado com base no seu histórico ou ajuste parâmetros manualmente
            </p>
          </div>

          {/* Scenario Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setSelectedScenario('historico')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedScenario === 'historico'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Base Histórica
            </button>
            <button
              onClick={() => setSelectedScenario('conservador')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedScenario === 'conservador'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Conservador (CDI)
            </button>
            <button
              onClick={() => setSelectedScenario('otimista')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedScenario === 'otimista'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Otimista (+2.5%)
            </button>
            <button
              onClick={() => setSelectedScenario('custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedScenario === 'custom'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Personalizado
            </button>
          </div>
        </div>

        {/* Custom Simulation Inputs */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Aporte Mensal Previsto
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">R$</span>
              <input
                type="number"
                step="100"
                min="0"
                value={selectedScenario === 'custom' ? customMonthlyContribution : activeParams.monthlyContribution}
                onChange={(e) => {
                  setSelectedScenario('custom');
                  setCustomMonthlyContribution(Number(e.target.value) || 0);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold text-slate-900 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <span className="text-[10px] text-slate-700 mt-1 block">
              Base histórica: {formatCurrency(historicalBaseline.avgMonthlyContribution)}/mês
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Rentabilidade Anual (% a.a.)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                min="1"
                max="50"
                value={selectedScenario === 'custom' ? customAnnualReturn : activeParams.annualReturnPct}
                onChange={(e) => {
                  setSelectedScenario('custom');
                  setCustomAnnualReturn(Number(e.target.value) || 0);
                }}
                className="w-full px-3 py-2 text-xs font-mono font-bold text-slate-900 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">% a.a.</span>
            </div>
            <span className="text-[10px] text-slate-700 mt-1 block">
              Equivale a ~{((Math.pow(1 + activeParams.annualReturnPct/100, 1/12) - 1) * 100).toFixed(2)}% ao mês
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Yield de Proventos (% a.a.)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                min="0"
                max="25"
                value={selectedScenario === 'custom' ? customDividendYield : activeParams.annualDivYieldPct}
                onChange={(e) => {
                  setSelectedScenario('custom');
                  setCustomDividendYield(Number(e.target.value) || 0);
                }}
                className="w-full px-3 py-2 text-xs font-mono font-bold text-slate-900 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">% a.a.</span>
            </div>
            <span className="text-[10px] text-slate-700 mt-1 block">
              Taxa anual de dividendos e rendimentos
            </span>
          </div>

          <div className="flex flex-col justify-end">
            <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-semibold text-indigo-900">Reinvestir Proventos</span>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                100% Ativo
              </span>
            </div>
            <span className="text-[10px] text-slate-700 mt-1 block">
              Efeito bola de neve de juros sobre juros
            </span>
          </div>
        </div>
      </div>

      {/* Executive Highlight Metric Cards for 10 Years */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Projected Wealth */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Patrimônio em 10 Anos</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">Ano 10</span>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-700">
            {formatCurrency(milestone10Y.endBalance)}
          </div>
          <div className="mt-1 text-xs text-slate-700 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold text-slate-900 font-mono">
              {(milestone10Y.endBalance / activeParams.initialAmount).toFixed(1)}x
            </span>
            <span>o patrimônio atual</span>
          </div>
        </div>

        {/* Compound Interest vs Contributions */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Juros Compostos Gerados</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-indigo-700">
            {formatCurrency(milestone10Y.cumulativeInterest)}
          </div>
          <div className="mt-1 text-xs text-slate-700">
            <span className="font-semibold text-indigo-700 font-mono">
              {milestone10Y.interestSharePercent.toFixed(1)}% do total
            </span>
            <span> veio de rendimentos</span>
          </div>
        </div>

        {/* Total Contributed from pocket */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Total Aportado do Bolso</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900">
            {formatCurrency(milestone10Y.cumulativeContribution)}
          </div>
          <div className="mt-1 text-xs text-slate-700">
            <span>Aporte médio: </span>
            <span className="font-semibold text-slate-900 font-mono">
              {formatCurrency(activeParams.monthlyContribution)}/mês
            </span>
          </div>
        </div>

        {/* Monthly Passive Income at Year 10 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Renda Passiva Mensal (Ano 10)</span>
            <Coins className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-700">
            {formatCurrency(milestone10Y.monthlyPassiveIncome)}
            <span className="text-xs font-normal text-slate-700">/mês</span>
          </div>
          <div className="mt-1 text-xs text-slate-700">
            <span>Sem consumir o principal</span>
          </div>
        </div>

      </div>

      {/* Ponto de Virada / Inflection Insight */}
      {inflectionYear && (
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
            <Zap className="w-5 h-5" />
          </div>
          <div className="text-xs text-emerald-950">
            <span className="font-bold block text-sm">
              🎯 Ponto de Virada Financeira: Ano {inflectionYear} ({projections[inflectionYear - 1]?.yearLabel})
            </span>
            <p className="mt-0.5 text-emerald-900">
              A partir do {inflectionYear}º ano, o rendimento anual dos seus investimentos (
              <span className="font-mono font-bold">{formatCurrency(projections[inflectionYear - 1]?.annualInterest)}</span>
              ) ultrapassará o valor total que você aporta por ano (
              <span className="font-mono font-bold">{formatCurrency(projections[inflectionYear - 1]?.annualContribution)}</span>
              ). O dinheiro passará a trabalhar mais do que o seu próprio esforço mensal!
            </p>
          </div>
        </div>
      )}

      {/* Chart 1: Evolution of Wealth over 10 Years (Stacked Area) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Evolução Patrimonial Projetada (Próximos 10 Anos)
            </h3>
            <p className="text-xs text-slate-700">
              Comparação entre o capital aportado do próprio bolso e o crescimento gerado pelos juros compostos
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-700">
              <span className="w-3 h-3 rounded bg-indigo-600 inline-block" /> Juros Compostos
            </span>
            <span className="flex items-center gap-1.5 text-slate-700">
              <span className="w-3 h-3 rounded bg-slate-400 inline-block" /> Aportes Acumulados
            </span>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorContrib" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="anoCurto" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={11} 
                tickLine={false}
                tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`} 
              />
              <Tooltip 
                formatter={(val: any, name: any) => [formatCurrency(Number(val)), name]}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="top" height={36} />
              <Area 
                type="monotone" 
                dataKey="Aportes Acumulados (R$)" 
                stackId="1" 
                stroke="#64748b" 
                fill="url(#colorContrib)" 
              />
              <Area 
                type="monotone" 
                dataKey="Juros Compostos Acumulados (R$)" 
                stackId="1" 
                stroke="#4f46e5" 
                fill="url(#colorInterest)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Monthly Passive Income Progression over 10 Years */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-500" />
              Progressão da Renda Passiva Mensal Estimada
            </h3>
            <p className="text-xs text-slate-700">
              Quanto a sua carteira gerará de proventos mensais líquidos em cada ano sem vender nenhum ativo
            </p>
          </div>
          <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-3 py-1 rounded-full border border-amber-200/60">
            Yield estimado: {formatPercent(activeParams.annualDivYieldPct)} a.a.
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="anoCurto" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={11} 
                tickLine={false}
                tickFormatter={(val) => `R$ ${val.toLocaleString('pt-BR')}`}
              />
              <Tooltip 
                formatter={(val: any) => [formatCurrency(Number(val)), 'Renda Mensal Estimada']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
              />
              <Bar 
                dataKey="Renda Mensal Estimada (R$)" 
                fill="#d97706" 
                radius={[6, 6, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed 10-Year Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Tabela Detalhada de Evolução Ano a Ano (10 Anos)
            </h3>
            <p className="text-xs text-slate-700">
              Demonstrativo anualizado com patrimônio inicial, aportes, rendimentos e renda mensal esperada
            </p>
          </div>
          <span className="text-[11px] text-slate-700">
            Valores projetados a partir de {formatCurrency(activeParams.initialAmount)} de patrimônio base
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Ano</th>
                <th className="py-3 px-4 text-right">Patrimônio Inicial</th>
                <th className="py-3 px-4 text-right">Aportes no Ano</th>
                <th className="py-3 px-4 text-right">Aportes Acumulados</th>
                <th className="py-3 px-4 text-right">Rendimento no Ano</th>
                <th className="py-3 px-4 text-right">Juros Acumulados</th>
                <th className="py-3 px-4 text-right text-indigo-700">Patrimônio Final</th>
                <th className="py-3 px-4 text-right text-amber-700">Renda Mensal Estimada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projections.map((row) => (
                <tr 
                  key={row.yearNumber} 
                  className={`hover:bg-slate-50 ${row.yearNumber === inflectionYear ? 'bg-emerald-50/40 font-medium' : ''}`}
                >
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900">Ano {row.yearNumber}</span>
                    <span className="text-[10px] text-slate-700 block font-mono">{row.yearLabel}</span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-700">
                    {formatCurrency(row.startBalance)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-700">
                    {formatCurrency(row.annualContribution)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-600">
                    {formatCurrency(row.cumulativeContribution)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-700">
                    +{formatCurrency(row.annualInterest)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-indigo-700">
                    {formatCurrency(row.cumulativeInterest)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                    {formatCurrency(row.endBalance)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-amber-700">
                    {formatCurrency(row.monthlyPassiveIncome)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold text-slate-900 text-xs">
                <td className="py-3 px-4">Total em 10 Anos</td>
                <td className="py-3 px-4 text-right font-mono text-slate-700">
                  {formatCurrency(activeParams.initialAmount)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-slate-700">
                  {formatCurrency(activeParams.monthlyContribution * 120)}
                </td>
                <td className="py-3 px-4 text-right font-mono">
                  {formatCurrency(milestone10Y.cumulativeContribution)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-emerald-700">
                  +{formatCurrency(milestone10Y.cumulativeInterest)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-indigo-700">
                  {formatCurrency(milestone10Y.cumulativeInterest)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-base text-emerald-700">
                  {formatCurrency(milestone10Y.endBalance)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-amber-700">
                  {formatCurrency(milestone10Y.monthlyPassiveIncome)}/mês
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Methodology & Financial Note */}
      <div className="p-4 bg-slate-100/80 rounded-2xl border border-slate-200/80 flex items-start gap-3 text-xs text-slate-700">
        <Info className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-slate-800 block">Metodologia e Premissas de Cálculo:</span>
          <p>
            As previsões são geradas através da fórmula de juros compostos com capitalização mensal contínua e reinvestimento integral dos rendimentos e proventos. 
            A taxa de rentabilidade e o valor de aporte tomam como base a média aritmética e geométrica dos seus lançamentos cadastrados no sistema. 
            Rentabilidades passadas não garantem rentabilidades futuras, servindo esta ferramenta como modelo de planejamento financeiro pessoal e projeção de metas.
          </p>
        </div>
      </div>

    </div>
  );
};
