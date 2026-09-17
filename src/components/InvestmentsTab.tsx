import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  PlusCircle, 
  Coins, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  DollarSign, 
  PieChart as PieIcon,
  RefreshCw,
  Building,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { InvestmentAsset, DividendRecord, AssetClass } from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { 
  formatCurrency, 
  formatPercent, 
  formatDate, 
  ASSET_CLASS_LABELS 
} from '../utils/formatters';

interface InvestmentsTabProps {
  onOpenAddAssetModal: () => void;
  onEditAsset: (asset: InvestmentAsset) => void;
  onOpenDividendModal: () => void;
}

export const InvestmentsTab: React.FC<InvestmentsTabProps> = ({
  onOpenAddAssetModal,
  onEditAsset,
  onOpenDividendModal,
}) => {
  const { 
    investments, 
    dividends, 
    deleteInvestment, 
    updateAssetPrice, 
    deleteDividend, 
    metrics 
  } = useFinance();

  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('todos');
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPriceInput, setTempPriceInput] = useState<string>('');
  const [assetToDelete, setAssetToDelete] = useState<InvestmentAsset | null>(null);
  const [dividendToDelete, setDividendToDelete] = useState<DividendRecord | null>(null);

  // Enriched investment list
  const enrichedAssets = useMemo(() => {
    return investments.map(asset => {
      const totalInvested = asset.quantity * asset.averagePrice;
      const currentValue = asset.quantity * asset.currentPrice;
      const profitLoss = currentValue - totalInvested;
      const profitLossPct = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;
      const portfolioWeight = metrics.currentPortfolioValue > 0 
        ? (currentValue / metrics.currentPortfolioValue) * 100 
        : 0;

      // Calculate dividends for this asset
      const assetDividends = dividends
        .filter(d => d.assetId === asset.id || d.ticker.toLowerCase() === asset.ticker.toLowerCase())
        .reduce((sum, d) => sum + d.amount, 0);

      return {
        ...asset,
        totalInvested,
        currentValue,
        profitLoss,
        profitLossPct,
        portfolioWeight,
        assetDividends
      };
    });
  }, [investments, dividends, metrics.currentPortfolioValue]);

  // Filtered assets by class
  const filteredAssets = useMemo(() => {
    if (selectedClassFilter === 'todos') return enrichedAssets;
    return enrichedAssets.filter(a => a.assetClass === selectedClassFilter);
  }, [enrichedAssets, selectedClassFilter]);

  // Allocation breakdown
  const allocationData = useMemo(() => {
    const map: Record<string, number> = {};
    enrichedAssets.forEach(a => {
      map[a.assetClass] = (map[a.assetClass] || 0) + a.currentValue;
    });

    const total = Object.values(map).reduce((a, b) => a + b, 0);

    return Object.entries(map).map(([key, val]) => {
      const meta = ASSET_CLASS_LABELS[key] || { label: key, color: '#94a3b8' };
      return {
        key,
        name: meta.label,
        value: val,
        percentage: total > 0 ? (val / total) * 100 : 0,
        color: meta.color
      };
    }).sort((a, b) => b.value - a.value);
  }, [enrichedAssets]);

  // Save quick price edit
  const handleSavePrice = (id: string) => {
    const parsed = parseFloat(tempPriceInput.replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 0) {
      updateAssetPrice(id, parsed);
    }
    setEditingPriceId(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Portfolio Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">Total Aportado</span>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900">
            {formatCurrency(metrics.totalInvested)}
          </div>
          <span className="text-xs text-slate-700 mt-1 block">Custo médio de aquisição</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">Posição Atual</span>
          <div className="mt-2 text-2xl font-bold font-mono text-indigo-900">
            {formatCurrency(metrics.currentPortfolioValue)}
          </div>
          <span className="text-xs text-slate-700 mt-1 block">Valor a mercado atual</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">Resultado / Ganho</span>
          <div className="mt-2 text-2xl font-bold font-mono flex items-baseline gap-2">
            <span className={metrics.totalProfitLoss >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
              {formatPercent(metrics.totalProfitLossPercent)}
            </span>
            <span className="text-sm font-normal text-slate-700">
              ({formatCurrency(metrics.totalProfitLoss)})
            </span>
          </div>
          <span className="text-xs text-slate-700 mt-1 block">Variação de cotação não realizada</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">Proventos Totais</span>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-700">
            {formatCurrency(metrics.allTimeDividends)}
          </div>
          <span className="text-xs text-slate-700 mt-1 block">Dividendos + JCP acumulados</span>
        </div>

      </div>

      {/* Allocation & Class Filter Strip */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-indigo-600" />
              Alocação Estratégica da Carteira
            </h2>
            <p className="text-xs text-slate-700">Distribuição patrimonial entre classes de investimento</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenDividendModal}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors shadow-xs"
            >
              <Coins className="w-4 h-4" />
              <span>Registrar Provento</span>
            </button>

            <button
              id="btn-add-asset-modal"
              onClick={onOpenAddAssetModal}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Novo Ativo</span>
            </button>
          </div>
        </div>

        {/* Visual Allocation Bar */}
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          {allocationData.map((item, idx) => (
            <div
              key={idx}
              style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
              title={`${item.name}: ${item.percentage.toFixed(1)}% (${formatCurrency(item.value)})`}
              className="h-full transition-all duration-300"
            />
          ))}
        </div>

        {/* Asset Class Filter Buttons */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto scrollbar-none pt-1">
          <button
            onClick={() => setSelectedClassFilter('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              selectedClassFilter === 'todos'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Todos os Ativos ({investments.length})
          </button>
          {Object.entries(ASSET_CLASS_LABELS).map(([key, meta]) => {
            const count = investments.filter(a => a.assetClass === key).length;
            if (count === 0 && selectedClassFilter !== key) return null;
            return (
              <button
                key={key}
                onClick={() => setSelectedClassFilter(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  selectedClassFilter === key
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
                <span>{meta.label}</span>
                <span className="text-[11px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Ativos em Carteira</h2>
          <span className="text-xs text-slate-700">
            Dica: clique no valor de cotação para atualizar rapidamente
          </span>
        </div>

        {filteredAssets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Ativo / Código</th>
                  <th className="py-3 px-4">Classe</th>
                  <th className="py-3 px-4 text-right">Qtd</th>
                  <th className="py-3 px-4 text-right">Preço Médio</th>
                  <th className="py-3 px-4 text-right">Preço Atual</th>
                  <th className="py-3 px-4 text-right">Total Investido</th>
                  <th className="py-3 px-4 text-right">Posição Atual</th>
                  <th className="py-3 px-4 text-right">Rentabilidade</th>
                  <th className="py-3 px-4 text-right">Proventos</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssets.map(asset => {
                  const meta = ASSET_CLASS_LABELS[asset.assetClass] || { label: asset.assetClass, color: '#64748b', bgLight: '#f1f5f9' };
                  const isEditingPrice = editingPriceId === asset.id;

                  return (
                    <tr key={asset.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Ativo / Ticker */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm">{asset.ticker}</div>
                        <div className="text-[11px] text-slate-700 truncate max-w-xs">{asset.name}</div>
                        {asset.broker && (
                          <span className="text-[10px] text-slate-700 block mt-0.5">Custódia: {asset.broker}</span>
                        )}
                      </td>

                      {/* Classe */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span 
                          className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border"
                          style={{ 
                            backgroundColor: meta.bgLight, 
                            color: meta.color,
                            borderColor: `${meta.color}30`
                          }}
                        >
                          {meta.label}
                        </span>
                        <div className="text-[10px] text-slate-700 mt-1">
                          Peso: {asset.portfolioWeight.toFixed(1)}%
                        </div>
                      </td>

                      {/* Quantidade */}
                      <td className="py-3 px-4 text-right font-mono font-medium text-slate-800">
                        {asset.quantity % 1 === 0 ? asset.quantity : asset.quantity.toFixed(4)}
                      </td>

                      {/* Preço Médio */}
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {formatCurrency(asset.averagePrice)}
                      </td>

                      {/* Preço Atual (com Quick Edit inline) */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {isEditingPrice ? (
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              step="0.01"
                              value={tempPriceInput}
                              onChange={(e) => setTempPriceInput(e.target.value)}
                              className="w-20 px-1.5 py-1 text-xs border border-indigo-400 rounded bg-white text-right font-mono"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSavePrice(asset.id);
                                if (e.key === 'Escape') setEditingPriceId(null);
                              }}
                            />
                            <button
                              onClick={() => handleSavePrice(asset.id)}
                              className="px-1.5 py-1 bg-indigo-600 text-white rounded text-[10px] font-bold"
                            >
                              OK
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingPriceId(asset.id);
                              setTempPriceInput(asset.currentPrice.toString());
                            }}
                            className="font-mono font-semibold text-slate-900 hover:text-indigo-600 hover:underline inline-flex items-center gap-1 group"
                            title="Clique para atualizar cotação"
                          >
                            <span>{formatCurrency(asset.currentPrice)}</span>
                            <Edit3 className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        )}
                      </td>

                      {/* Total Investido */}
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {formatCurrency(asset.totalInvested)}
                      </td>

                      {/* Posição Atual */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(asset.currentValue)}
                      </td>

                      {/* Rentabilidade */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className={`font-mono font-bold ${asset.profitLoss >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {formatPercent(asset.profitLossPct)}
                        </div>
                        <div className="text-[10px] text-slate-700 font-mono">
                          {formatCurrency(asset.profitLoss)}
                        </div>
                      </td>

                      {/* Proventos Recebidos */}
                      <td className="py-3 px-4 text-right font-mono font-semibold text-amber-700 whitespace-nowrap">
                        {asset.assetDividends > 0 ? formatCurrency(asset.assetDividends) : '—'}
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEditAsset(asset)}
                            className="p-1.5 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Editar Ativo"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setAssetToDelete(asset)}
                            className="p-1.5 text-slate-700 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Excluir Ativo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">Nenhum ativo cadastrado nesta categoria</h3>
            <p className="text-xs text-slate-700 mt-1 max-w-sm mx-auto">
              Adicione ativos à sua carteira para acompanhar a rentabilidade e alocação.
            </p>
            <button
              onClick={onOpenAddAssetModal}
              className="mt-4 inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Adicionar Ativo</span>
            </button>
          </div>
        )}
      </div>

      {/* Proventos / Dividendos Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-500" />
              Histórico de Proventos & Renda Passiva
            </h2>
            <p className="text-xs text-slate-700">Dividendos, JCP, rendimentos imobiliários e juros recebidos</p>
          </div>
          <button
            onClick={onOpenDividendModal}
            className="text-xs font-semibold text-amber-600 hover:text-amber-800 flex items-center gap-1"
          >
            + Lançar Provento
          </button>
        </div>

        {dividends.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Data</th>
                  <th className="py-2.5 px-3">Ativo / Ticker</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3 text-right">Valor Recebido</th>
                  <th className="py-2.5 px-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dividends.slice(0, 8).map(div => (
                  <tr key={div.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-700 font-mono">{formatDate(div.paymentDate)}</td>
                    <td className="py-2 px-3 font-bold text-slate-900">{div.ticker}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 font-semibold uppercase text-[10px]">
                        {div.type}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                      +{formatCurrency(div.amount)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => setDividendToDelete(div)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        title="Remover provento"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-700 text-center py-6">
            Nenhum provento lançado ainda. Clique em "Registrar Provento" para cadastrar pagamentos de dividendos.
          </p>
        )}
      </div>

      {/* Confirmation Modal for Asset Deletion */}
      <ConfirmDeleteModal
        isOpen={!!assetToDelete}
        title="Excluir Ativo da Carteira"
        message="Tem certeza que deseja remover este ativo da sua carteira de investimentos? O valor da posição atual e o histórico do ativo serão excluídos."
        itemName={assetToDelete ? `${assetToDelete.ticker} — ${assetToDelete.name} (${formatCurrency(assetToDelete.quantity * assetToDelete.currentPrice)})` : undefined}
        onCancel={() => setAssetToDelete(null)}
        onConfirm={() => {
          if (assetToDelete) {
            deleteInvestment(assetToDelete.id);
            setAssetToDelete(null);
          }
        }}
      />

      {/* Confirmation Modal for Dividend Deletion */}
      <ConfirmDeleteModal
        isOpen={!!dividendToDelete}
        title="Excluir Registro de Provento"
        message="Tem certeza que deseja remover este lançamento de provento/dividendo?"
        itemName={dividendToDelete ? `${dividendToDelete.ticker} - ${formatCurrency(dividendToDelete.amount)} (${formatDate(dividendToDelete.paymentDate)})` : undefined}
        onCancel={() => setDividendToDelete(null)}
        onConfirm={() => {
          if (dividendToDelete) {
            deleteDividend(dividendToDelete.id);
            setDividendToDelete(null);
          }
        }}
      />

    </div>
  );
};
