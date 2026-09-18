import React, { useState, useEffect } from 'react';
import { X, TrendingUp, DollarSign, Building, PiggyBank, Sparkles } from 'lucide-react';
import { InvestmentAsset, AssetClass } from '../types';
import { ASSET_CLASS_LABELS } from '../utils/formatters';

export interface InvestmentPreset {
  isSavings?: boolean;
  assetClass?: AssetClass;
  ticker?: string;
  name?: string;
  broker?: string;
  amount?: number | string;
}

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (assetData: any) => void;
  assetToEdit?: InvestmentAsset | null;
  initialPreset?: InvestmentPreset | null;
}

export const InvestmentModal: React.FC<InvestmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  assetToEdit,
  initialPreset,
}) => {
  const [modalMode, setModalMode] = useState<'market' | 'savings'>('market');
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
      const isFixedOrSavings = assetToEdit.assetClass === 'renda_fixa' || 
                               assetToEdit.ticker.toUpperCase().includes('POUP') ||
                               assetToEdit.name.toLowerCase().includes('poupança');
      setModalMode(isFixedOrSavings ? 'savings' : 'market');
      setTicker(assetToEdit.ticker);
      setName(assetToEdit.name);
      setAssetClass(assetToEdit.assetClass);
      setQuantity(assetToEdit.quantity.toString());
      setAveragePrice(assetToEdit.averagePrice.toString());
      setCurrentPrice(assetToEdit.currentPrice.toString());
      setBroker(assetToEdit.broker || '');
      setTargetAllocation(assetToEdit.targetAllocationPercent?.toString() || '');
    } else if (initialPreset) {
      if (initialPreset.isSavings) {
        setModalMode('savings');
        setTicker(initialPreset.ticker || 'POUPANCA');
        setName(initialPreset.name || 'Conta Poupança / Reserva');
        setAssetClass('renda_fixa');
        setQuantity('1');
        const amtStr = initialPreset.amount ? initialPreset.amount.toString() : '';
        setAveragePrice(amtStr);
        setCurrentPrice(amtStr);
        setBroker(initialPreset.broker || 'Banco / Poupança');
        setTargetAllocation('15');
      } else {
        setModalMode('market');
        setTicker(initialPreset.ticker || '');
        setName(initialPreset.name || '');
        setAssetClass(initialPreset.assetClass || 'acoes');
        setQuantity('1');
        setAveragePrice('');
        setCurrentPrice('');
        setBroker(initialPreset.broker || 'XP Investimentos');
        setTargetAllocation('10');
      }
    } else {
      setModalMode('market');
      setTicker('');
      setName('');
      setAssetClass('acoes');
      setQuantity('');
      setAveragePrice('');
      setCurrentPrice('');
      setBroker('XP Investimentos');
      setTargetAllocation('10');
    }
  }, [assetToEdit, initialPreset, isOpen]);

  if (!isOpen) return null;

  const handleApplyPreset = (type: 'poupanca' | 'caixinha' | 'tesouro' | 'cdb') => {
    setModalMode('savings');
    setAssetClass('renda_fixa');
    setQuantity('1');
    if (type === 'poupanca') {
      setTicker('POUPANCA');
      setName('Conta Poupança');
      setBroker('Caixa Econômica');
    } else if (type === 'caixinha') {
      setTicker('CAIXINHA');
      setName('Caixinha Reserva de Emergência');
      setBroker('Nubank');
    } else if (type === 'tesouro') {
      setTicker('LFT');
      setName('Tesouro Selic');
      setBroker('Tesouro Direto / Corretora');
    } else if (type === 'cdb') {
      setTicker('CDB');
      setName('CDB 100% CDI Liquidez Diária');
      setBroker('Banco Inter');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const numQty = parseFloat(quantity.replace(',', '.'));
    const numAvgPrice = parseFloat(averagePrice.replace(',', '.'));
    const numCurrPrice = currentPrice ? parseFloat(currentPrice.replace(',', '.')) : numAvgPrice;
    const numTarget = targetAllocation ? parseFloat(targetAllocation.replace(',', '.')) : undefined;

    const finalTicker = (ticker.trim() || (modalMode === 'savings' ? 'POUPANCA' : '')).toUpperCase();

    if (!finalTicker) {
      setErrorMsg('Por favor, informe o código / identificador do ativo.');
      return;
    }
    if (isNaN(numQty) || numQty <= 0) {
      setErrorMsg('Por favor, insira uma quantidade válida.');
      return;
    }
    if (isNaN(numAvgPrice) || numAvgPrice <= 0) {
      setErrorMsg('Por favor, insira um valor monetário válido maior que zero.');
      return;
    }

    onSave({
      ...(assetToEdit ? { id: assetToEdit.id } : {}),
      ticker: finalTicker,
      name: name.trim() || finalTicker,
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
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[95vh] flex flex-col">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              modalMode === 'savings' ? 'bg-teal-50 text-teal-600' : 'bg-indigo-50 text-indigo-600'
            }`}>
              {modalMode === 'savings' ? <PiggyBank className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {assetToEdit 
                  ? 'Editar Ativo' 
                  : modalMode === 'savings' 
                    ? 'Adicionar Poupança / Reserva' 
                    : 'Adicionar Novo Ativo à Carteira'}
              </h2>
              <p className="text-xs text-slate-500">
                {modalMode === 'savings' 
                  ? 'Cadastre o saldo guardado em poupança ou renda fixa' 
                  : 'Acompanhe rentabilidade e alocação do patrimônio'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          
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

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setModalMode('market');
                setAssetClass('acoes');
              }}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                modalMode === 'market'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Ações / FIIs / Cripto</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setModalMode('savings');
                setAssetClass('renda_fixa');
                if (!ticker) setTicker('POUPANCA');
                if (!name) setName('Conta Poupança');
                if (!quantity) setQuantity('1');
              }}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                modalMode === 'savings'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200/60'
              }`}
            >
              <PiggyBank className="w-3.5 h-3.5" />
              <span>Poupança / Reserva / Renda Fixa</span>
            </button>
          </div>

          {/* Quick Presets for Savings */}
          {modalMode === 'savings' && !assetToEdit && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <span className="block text-[11px] font-semibold text-slate-500">Atalhos rápidos de cadastro:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('poupanca')}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-slate-200 hover:border-teal-400 hover:text-teal-700 transition-colors cursor-pointer"
                >
                  🏦 Conta Poupança
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('caixinha')}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-slate-200 hover:border-teal-400 hover:text-teal-700 transition-colors cursor-pointer"
                >
                  📦 Caixinha Reserva
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('tesouro')}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-slate-200 hover:border-teal-400 hover:text-teal-700 transition-colors cursor-pointer"
                >
                  🏛️ Tesouro Selic
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('cdb')}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-slate-200 hover:border-teal-400 hover:text-teal-700 transition-colors cursor-pointer"
                >
                  📄 CDB 100% CDI
                </button>
              </div>
            </div>
          )}

          {/* Ticker & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {modalMode === 'savings' ? 'Sigla / Identificador' : 'Ticker / Código *'}
              </label>
              <input
                type="text"
                required
                placeholder={modalMode === 'savings' ? 'POUPANCA' : 'Ex: WEGE3'}
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-xs font-mono font-bold text-slate-900 uppercase rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {modalMode === 'savings' ? 'Nome da Conta ou Aplicação *' : 'Nome do Ativo / Descrição *'}
              </label>
              <input
                type="text"
                required
                placeholder={modalMode === 'savings' ? 'Ex: Conta Poupança Caixa, Reserva Nubank...' : 'Ex: WEG S.A., Vale, Tesouro...'}
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

          {/* Savings specific inputs vs Market specific inputs */}
          {modalMode === 'savings' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Saldo / Valor Guardado Total (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="1000,00"
                  value={averagePrice}
                  onChange={(e) => {
                    setAveragePrice(e.target.value);
                    setCurrentPrice(e.target.value);
                    setQuantity('1');
                  }}
                  className="w-full pl-9 pr-3 py-2.5 text-sm font-mono font-bold text-slate-900 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                O valor total aplicado será incorporado ao seu Patrimônio e Gráfico de Alocação.
              </p>
            </div>
          ) : (
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
          )}

          {/* Broker & Target Allocation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {modalMode === 'savings' ? 'Banco / Instituição' : 'Corretora / Custodiante'}
              </label>
              <input
                type="text"
                placeholder={modalMode === 'savings' ? 'Ex: Caixa, Nubank, Itaú...' : 'Ex: XP, BTG, Inter...'}
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
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-colors cursor-pointer ${
                modalMode === 'savings' 
                  ? 'bg-teal-600 hover:bg-teal-700' 
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {assetToEdit ? 'Salvar Alterações' : 'Adicionar à Carteira'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
