export function formatCurrency(value: number): string {
  if (isNaN(value) || value === null || value === undefined) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number, includeSign: boolean = true): string {
  if (isNaN(value) || value === null || value === undefined) {
    return '0,00%';
  }
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));

  if (value > 0 && includeSign) {
    return `+${formatted}%`;
  }
  if (value < 0 && includeSign) {
    return `-${formatted}%`;
  }
  return `${formatted}%`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateString;
}

export function formatMonthYear(monthKey: string): string {
  // monthKey format: "YYYY-MM"
  const [year, month] = monthKey.split('-');
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const mIndex = parseInt(month, 10) - 1;
  if (mIndex >= 0 && mIndex < 12) {
    return `${monthNames[mIndex]} de ${year}`;
  }
  return monthKey;
}

export function formatMonthShort(monthKey: string): string {
  // "2026-09" -> "Set/26"
  const [year, month] = monthKey.split('-');
  const shortMonths = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const mIndex = parseInt(month, 10) - 1;
  const shortYear = year.slice(2);
  return `${shortMonths[mIndex]}/${shortYear}`;
}

export const ASSET_CLASS_LABELS: Record<string, { label: string; color: string; bgLight: string }> = {
  renda_fixa: { label: 'Renda Fixa', color: '#0ea5e9', bgLight: '#e0f2fe' },
  acoes: { label: 'Ações Brasileiras', color: '#10b981', bgLight: '#d1fae5' },
  fiis: { label: 'Fundos Imobiliários (FIIs)', color: '#8b5cf6', bgLight: '#ede9fe' },
  cripto: { label: 'Criptoativos', color: '#f59e0b', bgLight: '#fef3c7' },
  internacional: { label: 'Internacional / BDRs / ETFs', color: '#ec4899', bgLight: '#fce7f3' },
  outros: { label: 'Outros Ativos', color: '#64748b', bgLight: '#f1f5f9' },
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pix: 'Pix',
  cartao_credito: 'Cartão de Crédito',
  debito: 'Cartão de Débito',
  boleto: 'Boleto Bancário',
  dinheiro: 'Dinheiro em Espécie',
  transferencia: 'TED / Transferência',
};

export const DEFAULT_INCOME_CATEGORIES = [
  'Salário',
  'Rendimentos / Investimentos',
  'Resgate de Poupança / Investimento',
  'Freelance / Serviços',
  'Bônus / PLR',
  'Vendas',
  'Aluguel Recebido',
  'Outras Receitas'
];

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Dízimos & Ofertas',
  'Investimentos & Poupança',
  'Reserva de Emergência',
  'Moradia & Aluguel',
  'Alimentação & Supermercado',
  'Transporte & Combustível',
  'Saúde & Farmácia',
  'Educação & Cursos',
  'Lazer & Restaurantes',
  'Contas de Consumo (Luz/Água/Net)',
  'Assinaturas & Streaming',
  'Compras & Vestuário',
  'Doações & Caridade',
  'Outras Despesas'
];
