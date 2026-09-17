import { Transaction, InvestmentAsset, DividendRecord, MonthlyPerformanceRecord } from '../types';

export const INITIAL_TRANSACTIONS: Transaction[] = [
  // Setembro 2026 (Mês Atual)
  {
    id: 'tx-01',
    description: 'Salário Mensal Empresa Tech',
    amount: 12500.00,
    type: 'receita',
    category: 'Salário',
    date: '2026-09-05',
    status: 'pago',
    paymentMethod: 'transferencia',
    notes: 'Salário líquido com descontos'
  },
  {
    id: 'tx-02',
    description: 'Projeto Freelance Design & Consultoria',
    amount: 3200.00,
    type: 'receita',
    category: 'Freelance / Serviços',
    date: '2026-09-12',
    status: 'pago',
    paymentMethod: 'pix',
  },
  {
    id: 'tx-03',
    description: 'Proventos FIIs & Dividendos Ações',
    amount: 985.40,
    type: 'receita',
    category: 'Rendimentos / Investimentos',
    date: '2026-09-15',
    status: 'pago',
    paymentMethod: 'transferencia',
    notes: 'Proventos automáticos da corretora'
  },
  {
    id: 'tx-04',
    description: 'Aluguel do Apartamento e Condomínio',
    amount: 3450.00,
    type: 'despesa',
    category: 'Moradia & Aluguel',
    date: '2026-09-08',
    status: 'pago',
    paymentMethod: 'boleto',
  },
  {
    id: 'tx-05',
    description: 'Supermercado Mensal Pão de Açúcar',
    amount: 1420.80,
    type: 'despesa',
    category: 'Alimentação & Supermercado',
    date: '2026-09-10',
    status: 'pago',
    paymentMethod: 'cartao_credito',
  },
  {
    id: 'tx-06',
    description: 'Feira Orgânica & Sacolão',
    amount: 280.00,
    type: 'despesa',
    category: 'Alimentação & Supermercado',
    date: '2026-09-14',
    status: 'pago',
    paymentMethod: 'pix',
  },
  {
    id: 'tx-07',
    description: 'Combustível Posto Ipiranga',
    amount: 320.00,
    type: 'despesa',
    category: 'Transporte & Combustível',
    date: '2026-09-09',
    status: 'pago',
    paymentMethod: 'cartao_credito',
  },
  {
    id: 'tx-08',
    description: 'Plano de Saúde Unimed Familiar',
    amount: 890.00,
    type: 'despesa',
    category: 'Saúde & Farmácia',
    date: '2026-09-11',
    status: 'pago',
    paymentMethod: 'debito',
  },
  {
    id: 'tx-09',
    description: 'Internet Fibra 600MB + Energia Elétrica',
    amount: 410.00,
    type: 'despesa',
    category: 'Contas de Consumo (Luz/Água/Net)',
    date: '2026-09-15',
    status: 'pago',
    paymentMethod: 'pix',
  },
  {
    id: 'tx-10',
    description: 'Restaurante Fim de Semana',
    amount: 395.00,
    type: 'despesa',
    category: 'Lazer & Restaurantes',
    date: '2026-09-13',
    status: 'pago',
    paymentMethod: 'cartao_credito',
  },
  {
    id: 'tx-11',
    description: 'Assinaturas (Netflix, Spotify, Cloud)',
    amount: 139.90,
    type: 'despesa',
    category: 'Assinaturas & Streaming',
    date: '2026-09-02',
    status: 'pago',
    paymentMethod: 'cartao_credito',
  },
  {
    id: 'tx-12',
    description: 'Farmácia & Vitaminas',
    amount: 185.30,
    type: 'despesa',
    category: 'Saúde & Farmácia',
    date: '2026-09-16',
    status: 'pago',
    paymentMethod: 'pix',
  },
  {
    id: 'tx-13',
    description: 'Curso de Especialização Finanças & Python',
    amount: 450.00,
    type: 'despesa',
    category: 'Educação & Cursos',
    date: '2026-09-22',
    status: 'pendente',
    paymentMethod: 'boleto',
    notes: 'Vencimento dia 22/09'
  },
  {
    id: 'tx-14',
    description: 'Fatura Cartão Black XP',
    amount: 1250.00,
    type: 'despesa',
    category: 'Compras & Vestuário',
    date: '2026-09-25',
    status: 'pendente',
    paymentMethod: 'cartao_credito',
    notes: 'Fechamento dia 18/09'
  },

  // Agosto 2026
  {
    id: 'tx-aug-01',
    description: 'Salário Mensal',
    amount: 12500.00,
    type: 'receita',
    category: 'Salário',
    date: '2026-08-05',
    status: 'pago',
    paymentMethod: 'transferencia'
  },
  {
    id: 'tx-aug-02',
    description: 'Proventos & Dividendos',
    amount: 940.20,
    type: 'receita',
    category: 'Rendimentos / Investimentos',
    date: '2026-08-15',
    status: 'pago',
    paymentMethod: 'transferencia'
  },
  {
    id: 'tx-aug-03',
    description: 'Moradia & Condomínio',
    amount: 3450.00,
    type: 'despesa',
    category: 'Moradia & Aluguel',
    date: '2026-08-08',
    status: 'pago',
    paymentMethod: 'boleto'
  },
  {
    id: 'tx-aug-04',
    description: 'Supermercado & Feira',
    amount: 1720.00,
    type: 'despesa',
    category: 'Alimentação & Supermercado',
    date: '2026-08-14',
    status: 'pago',
    paymentMethod: 'cartao_credito'
  },
  {
    id: 'tx-aug-05',
    description: 'Transporte & Manutenção Carro',
    amount: 860.00,
    type: 'despesa',
    category: 'Transporte & Combustível',
    date: '2026-08-18',
    status: 'pago',
    paymentMethod: 'pix'
  },
  {
    id: 'tx-aug-06',
    description: 'Lazer & Viagem Final de Semana',
    amount: 1100.00,
    type: 'despesa',
    category: 'Lazer & Restaurantes',
    date: '2026-08-22',
    status: 'pago',
    paymentMethod: 'cartao_credito'
  },
  {
    id: 'tx-aug-07',
    description: 'Contas Fixas e Streaming',
    amount: 540.00,
    type: 'despesa',
    category: 'Contas de Consumo (Luz/Água/Net)',
    date: '2026-08-10',
    status: 'pago',
    paymentMethod: 'pix'
  },

  // Julho 2026
  {
    id: 'tx-jul-01',
    description: 'Salário Mensal',
    amount: 12500.00,
    type: 'receita',
    category: 'Salário',
    date: '2026-07-05',
    status: 'pago',
    paymentMethod: 'transferencia'
  },
  {
    id: 'tx-jul-02',
    description: 'Bônus Semestral Performance',
    amount: 6000.00,
    type: 'receita',
    category: 'Bônus / PLR',
    date: '2026-07-15',
    status: 'pago',
    paymentMethod: 'transferencia'
  },
  {
    id: 'tx-jul-03',
    description: 'Proventos da Carteira',
    amount: 910.00,
    type: 'receita',
    category: 'Rendimentos / Investimentos',
    date: '2026-07-15',
    status: 'pago',
    paymentMethod: 'transferencia'
  },
  {
    id: 'tx-jul-04',
    description: 'Despesas Totais Moradia',
    amount: 3450.00,
    type: 'despesa',
    category: 'Moradia & Aluguel',
    date: '2026-07-08',
    status: 'pago',
    paymentMethod: 'boleto'
  },
  {
    id: 'tx-jul-05',
    description: 'Alimentação & Restaurantes',
    amount: 2150.00,
    type: 'despesa',
    category: 'Alimentação & Supermercado',
    date: '2026-07-16',
    status: 'pago',
    paymentMethod: 'cartao_credito'
  }
];

export const INITIAL_INVESTMENTS: InvestmentAsset[] = [
  {
    id: 'inv-01',
    ticker: 'Tesouro Selic 2029',
    name: 'Tesouro Selic Pós-Fixado LFT',
    assetClass: 'renda_fixa',
    quantity: 2.5,
    averagePrice: 14200.00,
    currentPrice: 14780.00,
    purchaseDate: '2025-06-10',
    broker: 'XP Investimentos',
    targetAllocationPercent: 25
  },
  {
    id: 'inv-02',
    ticker: 'CDB Inter 110% CDI',
    name: 'CDB Liquidez Diária Banco Inter',
    assetClass: 'renda_fixa',
    quantity: 20000,
    averagePrice: 1.00,
    currentPrice: 1.128,
    purchaseDate: '2025-08-15',
    broker: 'Banco Inter',
    targetAllocationPercent: 15
  },
  {
    id: 'inv-03',
    ticker: 'WEGE3',
    name: 'WEG S.A. Ordinárias',
    assetClass: 'acoes',
    quantity: 250,
    averagePrice: 42.50,
    currentPrice: 53.80,
    purchaseDate: '2025-03-20',
    broker: 'BTG Pactual',
    targetAllocationPercent: 12
  },
  {
    id: 'inv-04',
    ticker: 'ITUB4',
    name: 'Itaú Unibanco PN',
    assetClass: 'acoes',
    quantity: 350,
    averagePrice: 31.20,
    currentPrice: 36.90,
    purchaseDate: '2025-05-12',
    broker: 'XP Investimentos',
    targetAllocationPercent: 10
  },
  {
    id: 'inv-05',
    ticker: 'HGLG11',
    name: 'CSHG Logística FII',
    assetClass: 'fiis',
    quantity: 80,
    averagePrice: 158.00,
    currentPrice: 164.50,
    purchaseDate: '2025-04-10',
    broker: 'XP Investimentos',
    targetAllocationPercent: 12
  },
  {
    id: 'inv-06',
    ticker: 'MXRF11',
    name: 'Maxi Renda FII',
    assetClass: 'fiis',
    quantity: 1200,
    averagePrice: 10.15,
    currentPrice: 10.42,
    purchaseDate: '2025-02-18',
    broker: 'BTG Pactual',
    targetAllocationPercent: 8
  },
  {
    id: 'inv-07',
    ticker: 'IVVB11',
    name: 'iShares S&P 500 ETF Fundo de Índice',
    assetClass: 'internacional',
    quantity: 60,
    averagePrice: 285.00,
    currentPrice: 342.00,
    purchaseDate: '2025-01-15',
    broker: 'Avenue / XP',
    targetAllocationPercent: 10
  },
  {
    id: 'inv-08',
    ticker: 'BTC',
    name: 'Bitcoin Core Cripto',
    assetClass: 'cripto',
    quantity: 0.045,
    averagePrice: 340000.00,
    currentPrice: 420000.00,
    purchaseDate: '2025-07-01',
    broker: 'Mercado Bitcoin',
    targetAllocationPercent: 8
  }
];

export const INITIAL_DIVIDENDS: DividendRecord[] = [
  // Setembro 2026
  { id: 'div-01', assetId: 'inv-05', ticker: 'HGLG11', amount: 88.00, paymentDate: '2026-09-15', type: 'rendimento' },
  { id: 'div-02', assetId: 'inv-06', ticker: 'MXRF11', amount: 120.00, paymentDate: '2026-09-15', type: 'rendimento' },
  { id: 'div-03', assetId: 'inv-04', ticker: 'ITUB4', amount: 112.40, paymentDate: '2026-09-02', type: 'jcp' },
  { id: 'div-04', assetId: 'inv-03', ticker: 'WEGE3', amount: 95.00, paymentDate: '2026-09-18', type: 'dividendo' },

  // Agosto 2026
  { id: 'div-05', assetId: 'inv-05', ticker: 'HGLG11', amount: 88.00, paymentDate: '2026-08-15', type: 'rendimento' },
  { id: 'div-06', assetId: 'inv-06', ticker: 'MXRF11', amount: 120.00, paymentDate: '2026-08-15', type: 'rendimento' },
  { id: 'div-07', assetId: 'inv-04', ticker: 'ITUB4', amount: 98.20, paymentDate: '2026-08-01', type: 'jcp' },
  
  // Julho 2026
  { id: 'div-08', assetId: 'inv-05', ticker: 'HGLG11', amount: 88.00, paymentDate: '2026-07-15', type: 'rendimento' },
  { id: 'div-09', assetId: 'inv-06', ticker: 'MXRF11', amount: 120.00, paymentDate: '2026-07-15', type: 'rendimento' },
  { id: 'div-10', assetId: 'inv-03', ticker: 'WEGE3', amount: 145.00, paymentDate: '2026-07-25', type: 'dividendo' },
];

export const INITIAL_MONTHLY_PERFORMANCE: MonthlyPerformanceRecord[] = [
  {
    monthKey: '2026-01',
    monthLabel: 'Jan/2026',
    startingPortfolioValue: 118000.00,
    contributions: 3000.00,
    withdrawals: 0,
    dividendsReceived: 620.00,
    capitalGains: 1840.00,
    endingPortfolioValue: 123460.00,
    netProfit: 2460.00,
    monthlyYieldPercent: 2.08,
    benchmarkCdiPercent: 0.95,
    benchmarkIbovPercent: 1.42,
    benchmarkIpcaPercent: 0.42
  },
  {
    monthKey: '2026-02',
    monthLabel: 'Fev/2026',
    startingPortfolioValue: 123460.00,
    contributions: 2500.00,
    withdrawals: 0,
    dividendsReceived: 680.00,
    capitalGains: -920.00,
    endingPortfolioValue: 125720.00,
    netProfit: -240.00,
    monthlyYieldPercent: -0.19,
    benchmarkCdiPercent: 0.88,
    benchmarkIbovPercent: -1.20,
    benchmarkIpcaPercent: 0.83
  },
  {
    monthKey: '2026-03',
    monthLabel: 'Mar/2026',
    startingPortfolioValue: 125720.00,
    contributions: 3000.00,
    withdrawals: 0,
    dividendsReceived: 750.00,
    capitalGains: 2480.00,
    endingPortfolioValue: 131950.00,
    netProfit: 3230.00,
    monthlyYieldPercent: 2.57,
    benchmarkCdiPercent: 0.92,
    benchmarkIbovPercent: 2.10,
    benchmarkIpcaPercent: 0.36
  },
  {
    monthKey: '2026-04',
    monthLabel: 'Abr/2026',
    startingPortfolioValue: 131950.00,
    contributions: 3500.00,
    withdrawals: 0,
    dividendsReceived: 810.00,
    capitalGains: 1950.00,
    endingPortfolioValue: 138210.00,
    netProfit: 2760.00,
    monthlyYieldPercent: 2.09,
    benchmarkCdiPercent: 0.89,
    benchmarkIbovPercent: 1.65,
    benchmarkIpcaPercent: 0.38
  },
  {
    monthKey: '2026-05',
    monthLabel: 'Mai/2026',
    startingPortfolioValue: 138210.00,
    contributions: 3000.00,
    withdrawals: 0,
    dividendsReceived: 840.00,
    capitalGains: 1230.00,
    endingPortfolioValue: 143280.00,
    netProfit: 2070.00,
    monthlyYieldPercent: 1.50,
    benchmarkCdiPercent: 0.91,
    benchmarkIbovPercent: 0.85,
    benchmarkIpcaPercent: 0.46
  },
  {
    monthKey: '2026-06',
    monthLabel: 'Jun/2026',
    startingPortfolioValue: 143280.00,
    contributions: 3000.00,
    withdrawals: 0,
    dividendsReceived: 890.00,
    capitalGains: 2150.00,
    endingPortfolioValue: 149320.00,
    netProfit: 3040.00,
    monthlyYieldPercent: 2.12,
    benchmarkCdiPercent: 0.88,
    benchmarkIbovPercent: 1.95,
    benchmarkIpcaPercent: 0.21
  },
  {
    monthKey: '2026-07',
    monthLabel: 'Jul/2026',
    startingPortfolioValue: 149320.00,
    contributions: 5500.00, // Aporte maior com bônus
    withdrawals: 0,
    dividendsReceived: 910.00,
    capitalGains: 3200.00,
    endingPortfolioValue: 158930.00,
    netProfit: 4110.00,
    monthlyYieldPercent: 2.75,
    benchmarkCdiPercent: 0.94,
    benchmarkIbovPercent: 3.10,
    benchmarkIpcaPercent: 0.38
  },
  {
    monthKey: '2026-08',
    monthLabel: 'Ago/2026',
    startingPortfolioValue: 158930.00,
    contributions: 3000.00,
    withdrawals: 0,
    dividendsReceived: 940.20,
    capitalGains: 2840.00,
    endingPortfolioValue: 165710.20,
    netProfit: 3780.20,
    monthlyYieldPercent: 2.38,
    benchmarkCdiPercent: 0.93,
    benchmarkIbovPercent: 2.45,
    benchmarkIpcaPercent: 0.25
  },
  {
    monthKey: '2026-09',
    monthLabel: 'Set/2026',
    startingPortfolioValue: 165710.20,
    contributions: 3200.00,
    withdrawals: 0,
    dividendsReceived: 415.40, // Proventos até agora no mês corrente
    capitalGains: 2140.00,
    endingPortfolioValue: 171465.60,
    netProfit: 2555.40,
    monthlyYieldPercent: 1.54,
    benchmarkCdiPercent: 0.65, // Parcial do mês
    benchmarkIbovPercent: 1.15,
    benchmarkIpcaPercent: 0.20
  }
];
