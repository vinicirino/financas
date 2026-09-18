import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight, ArrowDownRight, Check, Calendar, PiggyBank, Sparkles } from 'lucide-react';
import { Transaction, TransactionType, TransactionStatus, PaymentMethod } from '../types';
import { DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from '../utils/formatters';

export interface TransactionPreset {
  type?: TransactionType;
  category?: string;
  description?: string;
  amount?: number | string;
  isSavings?: boolean;
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (txData: any) => void;
  transactionToEdit?: Transaction | null;
  defaultMonth: string; // YYYY-MM
  initialPreset?: TransactionPreset | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  transactionToEdit,
  defaultMonth,
  initialPreset,
}) => {
  const [type, setType] = useState<TransactionType>('despesa');
  const [isSavingsMode, setIsSavingsMode] = useState<boolean>(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<TransactionStatus>('pago');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Custom Category support
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');

  // Sync to Portfolio option when saving to savings
  const [syncWithInvestments, setSyncWithInvestments] = useState<boolean>(true);
  const [savingsBroker, setSavingsBroker] = useState<string>('Conta Poupança');

  // Default date handling and presets
  useEffect(() => {
    setErrorMsg(null);
    setIsCustomCategory(false);
    setCustomCategoryName('');

    if (transactionToEdit) {
      setType(transactionToEdit.type);
      const isSavingCat = transactionToEdit.category.toLowerCase().includes('poupança') || 
                          transactionToEdit.category.toLowerCase().includes('investimento');
      setIsSavingsMode(isSavingCat && transactionToEdit.type === 'despesa');
      setDescription(transactionToEdit.description);
      setAmount(transactionToEdit.amount.toString());
      setCategory(transactionToEdit.category);
      setDate(transactionToEdit.date);
      setStatus(transactionToEdit.status);
      setPaymentMethod(transactionToEdit.paymentMethod);
      setNotes(transactionToEdit.notes || '');
      setSyncWithInvestments(false);
    } else if (initialPreset) {
      if (initialPreset.isSavings) {
        setType('despesa');
        setIsSavingsMode(true);
        setDescription(initialPreset.description || 'Aplicação Poupança / Reserva');
        setCategory('Investimentos & Poupança');
        setPaymentMethod('transferencia');
      } else {
        setType(initialPreset.type || 'despesa');
        setIsSavingsMode(false);
        setDescription(initialPreset.description || '');
        setCategory(initialPreset.category || (initialPreset.type === 'receita' ? DEFAULT_INCOME_CATEGORIES[0] : DEFAULT_EXPENSE_CATEGORIES[0]));
        setPaymentMethod('pix');
      }
      const todayStr = new Date().toISOString().slice(0, 10);
      const initialDate = todayStr.startsWith(defaultMonth) ? todayStr : `${defaultMonth}-15`;
      setDate(initialDate);
      setAmount(initialPreset.amount !== undefined ? initialPreset.amount.toString() : '');
      setStatus('pago');
      setNotes('');
      setSyncWithInvestments(true);
      setSavingsBroker('Conta Poupança');
    } else {
      const todayStr = new Date().toISOString().slice(0, 10);
      const initialDate = todayStr.startsWith(defaultMonth) ? todayStr : `${defaultMonth}-15`;
      setType('despesa');
      setIsSavingsMode(false);
      setDescription('');
      setAmount('');
      setCategory(DEFAULT_EXPENSE_CATEGORIES[0]);
      setDate(initialDate);
      setStatus('pago');
      setPaymentMethod('pix');
      setNotes('');
      setSyncWithInvestments(false);
    }
  }, [transactionToEdit, initialPreset, defaultMonth, isOpen]);

  // Handlers for switching modes
  const handleSelectReceita = () => {
    setType('receita');
    setIsSavingsMode(false);
    setCategory(DEFAULT_INCOME_CATEGORIES[0]);
  };

  const handleSelectDespesa = () => {
    setType('despesa');
    setIsSavingsMode(false);
    setCategory(DEFAULT_EXPENSE_CATEGORIES[0]);
  };

  const handleSelectPoupanca = () => {
    setType('despesa');
    setIsSavingsMode(true);
    setCategory('Investimentos & Poupança');
    if (!description || description === 'Salário' || description === 'Supermercado') {
      setDescription('Aplicação Poupança / Reserva');
    }
    setPaymentMethod('transferencia');
    setSyncWithInvestments(true);
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

    const finalCategory = isCustomCategory 
      ? (customCategoryName.trim() || (type === 'receita' ? 'Outras Receitas' : 'Dízimos & Ofertas')) 
      : (category.trim() || (type === 'receita' ? 'Outras Receitas' : 'Dízimos & Ofertas'));

    onSave({
      ...(transactionToEdit ? { id: transactionToEdit.id } : {}),
      description: description.trim(),
      amount: numAmount,
      type,
      category: finalCategory,
      date: date || new Date().toISOString().slice(0, 10),
      status,
      paymentMethod,
      notes: notes.trim() ? notes.trim() : undefined,
      syncWithInvestments: !transactionToEdit && isSavingsMode && syncWithInvestments,
      savingsBroker: savingsBroker.trim() || 'Conta Poupança',
      savingsName: description.trim() || 'Conta Poupança',
    });

    onClose();
  };

  const categories = type === 'receita' ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[95vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {transactionToEdit 
                ? 'Editar Lançamento' 
                : isSavingsMode 
                  ? 'Guardar / Aplicar na Poupança' 
                  : 'Novo Lançamento Financeiro'}
            </h2>
            <p className="text-xs text-slate-500">
              {isSavingsMode 
                ? 'Transfere saldo da conta corrente para a sua reserva/poupança' 
                : 'Registre uma movimentação no seu fluxo mensal'}
            </p>
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

          {/* Type Toggle: 3 Modes */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={handleSelectReceita}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                type === 'receita' && !isSavingsMode
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Receita (+)</span>
            </button>
            <button
              type="button"
              onClick={handleSelectDespesa}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                type === 'despesa' && !isSavingsMode
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Despesa (-)</span>
            </button>
            <button
              type="button"
              onClick={handleSelectPoupanca}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                isSavingsMode
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60'
              }`}
            >
              <PiggyBank className="w-3.5 h-3.5" />
              <span>Poupança / Guardar</span>
            </button>
          </div>

          {/* Savings Mode Callout Banner */}
          {isSavingsMode && (
            <div className="p-3.5 bg-gradient-to-r from-indigo-50 to-teal-50 border border-indigo-200/80 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-indigo-900">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Destinar Valor à Poupança ou Reserva</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Este lançamento deduz o valor da sua conta corrente deste mês e direciona para a sua poupança ou investimentos.
              </p>

              {!transactionToEdit && (
                <div className="pt-2 border-t border-indigo-100/80 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={syncWithInvestments}
                      onChange={(e) => setSyncWithInvestments(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <span>Somar automaticamente na Carteira de Investimentos (Patrimônio)</span>
                  </label>

                  {syncWithInvestments && (
                    <div className="mt-1.5">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Instituição / Banco da Poupança:
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Caixa Econômica, NuBank (Caixinha), Inter, Itaú..."
                        value={savingsBroker}
                        onChange={(e) => setSavingsBroker(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs text-slate-900 rounded-lg bg-white border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

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
              placeholder={isSavingsMode ? "Ex: Aplicação Poupança, Caixinha Reserva..." : "Ex: Salário da empresa, Supermercado, Aluguel..."}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs text-slate-900 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Category & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Categoria
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomCategory(!isCustomCategory)}
                  className="text-[11px] text-emerald-700 hover:text-emerald-800 font-medium underline cursor-pointer"
                >
                  {isCustomCategory ? 'Escolher da lista' : '+ Digitar outra'}
                </button>
              </div>

              {isCustomCategory ? (
                <input
                  type="text"
                  placeholder="Ex: Dízimo Igreja, Oferta Missões..."
                  value={customCategoryName}
                  onChange={(e) => setCustomCategoryName(e.target.value)}
                  className="w-full px-3 py-2 text-xs text-slate-900 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              ) : (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs text-slate-900 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              )}

              {/* Quick suggestion badges for expenses */}
              {type === 'despesa' && !isSavingsMode && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {[
                    { label: '⛪ Dízimos & Ofertas', cat: 'Dízimos & Ofertas', defaultDesc: 'Dízimo / Oferta' },
                    { label: '🛒 Supermercado', cat: 'Alimentação & Supermercado', defaultDesc: '' },
                    { label: '🏠 Moradia', cat: 'Moradia & Aluguel', defaultDesc: '' },
                    { label: '🚗 Transporte', cat: 'Transporte & Combustível', defaultDesc: '' },
                  ].map(item => (
                    <button
                      key={item.cat}
                      type="button"
                      onClick={() => {
                        setIsCustomCategory(false);
                        setCategory(item.cat);
                        if (item.defaultDesc && !description) {
                          setDescription(item.defaultDesc);
                        }
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                        category === item.cat && !isCustomCategory
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
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
                <option value="transferencia">Transferência / TED</option>
                <option value="debito">Cartão de Débito</option>
                <option value="cartao_credito">Cartão de Crédito</option>
                <option value="boleto">Boleto Bancário</option>
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
                className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
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
                className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
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
              placeholder="Anotações adicionais, objetivo da poupança, etc."
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
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-colors cursor-pointer ${
                isSavingsMode 
                  ? 'bg-indigo-600 hover:bg-indigo-700' 
                  : 'bg-slate-900 hover:bg-slate-800'
              }`}
            >
              {transactionToEdit 
                ? 'Atualizar Lançamento' 
                : isSavingsMode 
                  ? 'Confirmar Aplicação na Poupança' 
                  : 'Salvar Lançamento'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
