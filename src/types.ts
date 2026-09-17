export type TransactionType = 'receita' | 'despesa';

export type TransactionStatus = 'pago' | 'pendente';

export type PaymentMethod = 'pix' | 'cartao_credito' | 'debito' | 'boleto' | 'dinheiro' | 'transferencia';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string; // YYYY-MM-DD
  status: TransactionStatus;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export type AssetClass = 'renda_fixa' | 'acoes' | 'fiis' | 'cripto' | 'internacional' | 'outros';

export interface InvestmentAsset {
  id: string;
  ticker: string; // ex: PETR4, HGLG11, Tesouro Selic 2029, BTC
  name: string;
  assetClass: AssetClass;
  quantity: number;
  averagePrice: number; // Preço médio de aquisição por cota
  currentPrice: number; // Preço atual de mercado
  purchaseDate: string;
  broker?: string; // Corretora (ex: NuInvest, XP, BTG, Rico)
  targetAllocationPercent?: number; // Meta de alocação da carteira (%)
}

export interface DividendRecord {
  id: string;
  assetId: string;
  ticker: string;
  amount: number; // Valor total recebido em R$
  paymentDate: string; // YYYY-MM-DD
  type: 'dividendo' | 'jcp' | 'rendimento' | 'juros';
}

export interface MonthlyPerformanceRecord {
  monthKey: string; // "YYYY-MM"
  monthLabel: string; // "Jan/2026"
  startingPortfolioValue: number;
  contributions: number; // Aportes líquidos realizados no mês
  withdrawals: number; // Resgates
  dividendsReceived: number; // Proventos recebidos
  capitalGains: number; // Variação de preço da cotação
  endingPortfolioValue: number;
  netProfit: number; // capitalGains + dividendsReceived
  monthlyYieldPercent: number; // Rentabilidade da carteira no mês (%)
  benchmarkCdiPercent: number; // CDI no mês (%)
  benchmarkIbovPercent: number; // Ibovespa no mês (%)
  benchmarkIpcaPercent: number; // IPCA/Inflação no mês (%)
}

export interface CategoryInfo {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  iconName: string;
}
