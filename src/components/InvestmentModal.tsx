import React, { useState, useEffect } from 'react';
import { X, TrendingUp, DollarSign, Building } from 'lucide-react';
import { InvestmentAsset, AssetClass } from '../types';
import { ASSET_CLASS_LABELS } from '../utils/formatters';

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (assetData: any) => void;
  assetToEdit?: InvestmentAsset | null;
}

export const InvestmentModal: React.FC<InvestmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  assetToEdit,
}) => {
  const [ticker, setTicker] = useState('');
  const [name, setName] = useState('');
  const [assetClass, setAssetClass] = useState<AssetClass>('acoes');
  const [quantity, setQuantity] = useState('');
  const [averagePrice, setAveragePrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [broker, setBroker] = useState('');
  const [targetAllocation, setTargetAllocation] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setErrorMsg(null);
    if (assetToEdit) {
      setTicker(assetToEdit.ticker);
      setName(assetToEdit.name);
      setAssetClass(assetToEdit.assetClass);
      setQuantity(assetToEdit.quantity.toString());
      setAveragePrice(assetToEdit.averagePrice.toString());
      setCurrentPrice(assetToEdit.currentPrice.toString());
      setBroker(assetToEdit.broker || '');
      setTargetAllocation(assetToEdit.targetAllocationPercent?.toString() || '');
    } else {
      setTicker('');
      setName('');
      setAssetClass('acoes');
      setQuantity('');
      setAveragePrice('');
      setCurrentPrice('');
      setBroker('XP Investimentos');
      setTargetAllocation('10');
    }
  }, [assetToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const numQty = parseFloat(quantity.replace(',', '.'));
    const numAvgPrice = parseFloat(averagePrice.replace(',', '.'));
    const numCurrPrice = currentPrice ? parseFloat(currentPrice.replace(',', '.')) : numAvgPrice;
    const numTarget = targetAllocation ? parseFloat(targetAllocation.replace(',', '.')) : undefined;

    if (!ticker.trim()) {
      setErrorMsg('Por favor, informe o código / ticker do ativo (ex: PETR4, HGLG11, Tesouro Selic).');
      return;
    }
    if (isNaN(numQty) || numQty <= 0) {
      setErrorMsg('Por favor, insira uma quantidade válida maior que zero.');
      return;
    }
    if (isNaN(numAvgPrice) || numAvgPrice <= 0) {
      setErrorMsg('Por favor, insira um preço médio de compra válido.');
      return;
    }

    onSave({
      ...(assetToEdit ? { id: assetToEdit.id } : {}),
      ticker: ticker.trim().toUpperCase(),
      name: name.trim() || ticker.trim().toUpperCase(),
      assetClass,
      quantity: numQty,
      averagePrice: numAvgPrice,
      currentPrice: !isNaN(numCurrPrice) && numCurrPrice > 0 ? numCurrPrice : numAvgPrice,
      broker: broker.trim() || undefined,
      targetAllocationPercent: numTarget,
      purchaseDate: assetToEdit?.purchaseDate || new Date().toISOString().slice(0, 10),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              {assetToEdit ? 'Editar Ativo' : 'Adicionar Novo Ativo à Carteira'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center justify-between">
              <span>{errorMsg}</span>
              <button 
                type="button" 
                onClick={() => setErrorMsg(null)}
                className="text-rose-500 hover:text-rose-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Ticker & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ticker / Código *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: WEGE3"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-xs font-mono font-bold text-slate-900 uppercase rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome do Ativo / Descrição *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: WEG S.A., Tesouro Selic 2029..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs text-slate-900 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Asset Class */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Classe do Ativo *
            </label>
            <select
              value={assetClass}
              onChange={(e) => setAssetClass(e.target.value as AssetClass)}
              className="w-full px-3 py-2 text-xs text-slate-900 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              {Object.entries(ASSET_CLASS_LABELS).map(([key, meta]) => (
                <option key={key} value={key}>{meta.label}</option>
              ))}
            </select>
          </div>

          {/* Quantity, Average Price & Current Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantidade *
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="Ex: 100"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono text-slate-900 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preço Médio (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0,00"
                value={averagePrice}
                onChange={(e) => setAveragePrice(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono text-slate-900 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preço Atual (R$)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="Cotação atual"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono text-slate-900 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Broker & Target Allocation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Corretora / Custodiante
              </label>
              <input
                type="text"
                placeholder="Ex: XP, BTG, Inter, NuInvest"
                value={broker}
                onChange={(e) => setBroker(e.target.value)}
                className="w-full px-3 py-2 text-xs text-slate-900 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Meta de Alocação (%)
              </label>
              <input
                type="number"
                step="1"
                placeholder="Ex: 15"
                value={targetAllocation}
                onChange={(e) => setTargetAllocation(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono text-slate-900 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition-colors"
            >
              {assetToEdit ? 'Salvar Alterações' : 'Adicionar à Carteira'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
