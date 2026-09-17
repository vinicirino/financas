import React, { useState } from 'react';
import { X, Coins } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

interface DividendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (divData: any) => void;
}

export const DividendModal: React.FC<DividendModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const { investments, selectedMonth } = useFinance();

  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [customTicker, setCustomTicker] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    return today.startsWith(selectedMonth) ? today : `${selectedMonth}-15`;
  });
  const [type, setType] = useState<'dividendo' | 'jcp' | 'rendimento' | 'juros'>('rendimento');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Por favor, insira um valor válido de provento maior que zero.');
      return;
    }

    let ticker = customTicker.trim().toUpperCase();
    let assetId = selectedAssetId;

    if (selectedAssetId && selectedAssetId !== 'custom') {
      const asset = investments.find(a => a.id === selectedAssetId);
      if (asset) {
        ticker = asset.ticker;
        assetId = asset.id;
      }
    }

    if (!ticker) {
      setErrorMsg('Por favor, informe o ticker ou selecione o ativo da carteira.');
      return;
    }

    onSave({
      assetId: assetId || 'custom',
      ticker,
      amount: numAmount,
      paymentDate: paymentDate || new Date().toISOString().slice(0, 10),
      type
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Registrar Provento Recebido</h2>
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

          {/* Select Asset */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ativo da Carteira
            </label>
            <select
              value={selectedAssetId}
              onChange={(e) => {
                setSelectedAssetId(e.target.value);
                if (e.target.value !== 'custom') setCustomTicker('');
              }}
              className="w-full px-3 py-2 text-xs text-slate-900 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            >
              <option value="">Selecione um ativo cadastrado...</option>
              {investments.map(a => (
                <option key={a.id} value={a.id}>
                  {a.ticker} — {a.name}
                </option>
              ))}
              <option value="custom">Outro ativo (digitar ticker)...</option>
            </select>
          </div>

          {/* Custom Ticker if requested */}
          {selectedAssetId === 'custom' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ticker do Ativo *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: BBAS3"
                value={customTicker}
                onChange={(e) => setCustomTicker(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-xs uppercase font-mono font-bold text-slate-900 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
          )}

          {/* Type of Dividend */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tipo de Provento
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-3 py-2 text-xs text-slate-900 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            >
              <option value="rendimento">Rendimento Imobiliário (FII)</option>
              <option value="dividendo">Dividendo de Ações (Isento IR)</option>
              <option value="jcp">Juros sobre Capital Próprio (JCP)</option>
              <option value="juros">Juros Semestrais (Tesouro Direto / Renda Fixa)</option>
            </select>
          </div>

          {/* Amount and Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Valor Total (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono font-bold text-slate-900 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data do Pagamento *
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 text-xs text-slate-900 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
          </div>

          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 text-[11px] text-amber-800">
            ℹ️ O registro do provento também será computado automaticamente nas receitas de investimentos e no relatório de rentabilidade mensal.
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
              className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl shadow-xs transition-colors"
            >
              Confirmar Provento
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
