import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight, ArrowDownRight, Check, Calendar } from 'lucide-react';
import { Transaction, TransactionType, TransactionStatus, PaymentMethod } from '../types';
import { DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from '../utils/formatters';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (txData: any) => void;
  transactionToEdit?: Transaction | null;
  defaultMonth: string; // YYYY-MM
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  transactionToEdit,
  defaultMonth,
}) => {
  const [type, setType] = useState<TransactionType>('despesa');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<TransactionStatus>('pago');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Default date handling
  useEffect(() => {
    setErrorMsg(null);
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setDescription(transactionToEdit.description);
      setAmount(transactionToEdit.amount.toString());
      setCategory(transactionToEdit.category);
      setDate(transactionToEdit.date);
      setStatus(transactionToEdit.status);
      setPaymentMethod(transactionToEdit.paymentMethod);
      setNotes(transactionToEdit.notes || '');
    } else {
      // Default to today if within defaultMonth, or 15th of defaultMonth
      const todayStr = new Date().toISOString().slice(0, 10);
      const initialDate = todayStr.startsWith(defaultMonth) ? todayStr : `${defaultMonth}-15`;
      setType('despesa');
      setDescription('');
      setAmount('');
      setCategory(DEFAULT_EXPENSE_CATEGORIES[0]);
      setDate(initialDate);
      setStatus('pago');
      setPaymentMethod('pix');
      setNotes('');
    }
  }, [transactionToEdit, defaultMonth, isOpen]);

  // When type toggles, adjust default category if empty
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'receita') {
      setCategory(DEFAULT_INCOME_CATEGORIES[0]);
    } else {
      setCategory(DEFAULT_EXPENSE_CATEGORIES[0]);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Por favor, insira um valor numérico válido maior que zero.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Por favor, informe a descrição do lançamento.');
      return;
    }

    onSave({
      ...(transactionToEdit ? { id: transactionToEdit.id } : {}),
      description: description.trim(),
      amount: numAmount,
      type,
      category: category.trim() || (type === 'receita' ? 'Outras Receitas' : 'Outras Despesas'),
      date: date || new Date().toISOString().slice(0, 10),
      status,
      paymentMethod,
      notes: notes.trim() ? notes.trim() : undefined,
    });

    onClose();
  };

  const categories = type === 'receita' ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">
            {transactionToEdit ? 'Editar Lançamento' : 'Novo Lançamento Financeiro'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
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

          {/* Type Toggle: Receita vs Despesa */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => handleTypeChange('receita')}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                type === 'receita'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Receita (+)</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('despesa')}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                type === 'despesa'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>Despesa (-)</span>
            </button>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Valor (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm font-mono font-bold text-slate-900 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data do Lançamento *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium text-slate-900 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Descrição do Lançamento *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Salário da empresa, Supermercado, Aluguel..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs text-slate-900 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Category & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs text-slate-900 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 text-xs text-slate-900 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="pix">Pix</option>
                <option value="cartao_credito">Cartão de Crédito</option>
                <option value="debito">Cartão de Débito</option>
                <option value="boleto">Boleto Bancário</option>
                <option value="transferencia">Transferência / TED</option>
                <option value="dinheiro">Dinheiro em Espécie</option>
              </select>
            </div>
          </div>

          {/* Status (Pago vs Pendente) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Status do Lançamento
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('pago')}
                className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                  status === 'pago'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                ✓ Pago / Liquidado
              </button>
              <button
                type="button"
                onClick={() => setStatus('pendente')}
                className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                  status === 'pendente'
                    ? 'bg-amber-50 text-amber-700 border-amber-300 font-bold'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                ⏳ Pendente / A Vencer
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações (Opcional)
            </label>
            <input
              type="text"
              placeholder="Anotações adicionais, parcelamento, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs text-slate-900 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
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
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:bg-black rounded-xl shadow-xs transition-colors"
            >
              {transactionToEdit ? 'Atualizar Lançamento' : 'Salvar Lançamento'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
