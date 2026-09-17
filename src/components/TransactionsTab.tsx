import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight, 
  PlusCircle, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  Clock, 
  CreditCard,
  Download,
  Calendar,
  Layers
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Transaction, TransactionType, TransactionStatus } from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { 
  formatCurrency, 
  formatDate, 
  formatMonthYear, 
  PAYMENT_METHOD_LABELS,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES
} from '../utils/formatters';

interface TransactionsTabProps {
  onOpenAddModal: () => void;
  onEditTransaction: (tx: Transaction) => void;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({
  onOpenAddModal,
  onEditTransaction,
}) => {
  const { transactions, selectedMonth, deleteTransaction, updateTransaction } = useFinance();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'todos' | TransactionType>('todos');
  const [statusFilter, setStatusFilter] = useState<'todos' | TransactionStatus>('todos');
  const [categoryFilter, setCategoryFilter] = useState<string>('todos');
  const [onlySelectedMonth, setOnlySelectedMonth] = useState<boolean>(true);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  // All distinct categories in database
  const allCategories = useMemo(() => {
    const set = new Set<string>([...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES]);
    transactions.forEach(t => set.add(t.category));
    return Array.from(set).sort();
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Month check
      if (onlySelectedMonth && !tx.date.startsWith(selectedMonth)) {
        return false;
      }
      // Search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchDesc = tx.description.toLowerCase().includes(term);
        const matchCat = tx.category.toLowerCase().includes(term);
        const matchNotes = tx.notes ? tx.notes.toLowerCase().includes(term) : false;
        if (!matchDesc && !matchCat && !matchNotes) return false;
      }
      // Type
      if (typeFilter !== 'todos' && tx.type !== typeFilter) {
        return false;
      }
      // Status
      if (statusFilter !== 'todos' && tx.status !== statusFilter) {
        return false;
      }
      // Category
      if (categoryFilter !== 'todos' && tx.category !== categoryFilter) {
        return false;
      }
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, selectedMonth, onlySelectedMonth, searchTerm, typeFilter, statusFilter, categoryFilter]);

  // Totals of filtered list
  const filteredTotals = useMemo(() => {
    const receitas = filteredTransactions
      .filter(t => t.type === 'receita')
      .reduce((sum, t) => sum + t.amount, 0);
    const despesas = filteredTransactions
      .filter(t => t.type === 'despesa')
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      receitas,
      despesas,
      saldo: receitas - despesas
    };
  }, [filteredTransactions]);

  // Toggle status shortcut
  const toggleStatus = (tx: Transaction) => {
    updateTransaction({
      ...tx,
      status: tx.status === 'pago' ? 'pendente' : 'pago'
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Filter Controls */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              Lançamentos Financeiros
            </h2>
            <p className="text-xs text-slate-700">
              {onlySelectedMonth 
                ? `Exibindo transações de ${formatMonthYear(selectedMonth)}` 
                : 'Exibindo todo o histórico de lançamentos'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setOnlySelectedMonth(!onlySelectedMonth)}
              className={`text-xs font-semibold px-3 py-2 rounded-xl border transition-colors flex items-center gap-1.5 ${
                onlySelectedMonth 
                  ? 'bg-slate-900 text-white border-slate-900' 
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{onlySelectedMonth ? 'Ver Apenas Este Mês' : 'Ver Todos os Meses'}</span>
            </button>

            <button
              id="btn-new-tx-tab"
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nova Transação</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          
          {/* Search input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            <option value="todos">Todos os Tipos (Receitas & Despesas)</option>
            <option value="receita">Apenas Receitas (+)</option>
            <option value="despesa">Apenas Despesas (-)</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            <option value="todos">Todas as Categorias</option>
            {allCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            <option value="todos">Todos os Status</option>
            <option value="pago">Apenas Pagos / Concluídos</option>
            <option value="pendente">Apenas Pendentes / A Vencer</option>
          </select>

        </div>

        {/* Filtered Summary Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-4 text-slate-700 font-medium">
            <span>{filteredTransactions.length} registro(s) encontrado(s)</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-emerald-700 font-semibold font-mono">
              Receitas: {formatCurrency(filteredTotals.receitas)}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-rose-700 font-semibold font-mono">
              Despesas: {formatCurrency(filteredTotals.despesas)}
            </span>
            <span className="text-slate-300">•</span>
            <span className={`font-bold font-mono ${filteredTotals.saldo >= 0 ? 'text-teal-700' : 'text-rose-700'}`}>
              Saldo: {formatCurrency(filteredTotals.saldo)}
            </span>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Pagamento</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-700 font-mono whitespace-nowrap">
                      {formatDate(tx.date)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{tx.description}</div>
                      {tx.notes && (
                        <div className="text-[11px] text-slate-700 truncate max-w-xs">{tx.notes}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                      {PAYMENT_METHOD_LABELS[tx.paymentMethod] || tx.paymentMethod}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => toggleStatus(tx)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                          tx.status === 'pago'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                        }`}
                        title="Clique para alternar status"
                      >
                        {tx.status === 'pago' ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>Pago</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Pendente</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span className={`font-mono font-bold text-sm ${
                        tx.type === 'receita' ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {tx.type === 'receita' ? '+' : '-'} {formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEditTransaction(tx)}
                          className="p-1.5 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Editar transação"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setTransactionToDelete(tx)}
                          className="p-1.5 text-slate-700 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Excluir transação"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">Nenhum lançamento encontrado</h3>
            <p className="text-xs text-slate-700 mt-1 max-w-sm mx-auto">
              Não existem receitas ou despesas que atendam aos filtros selecionados.
            </p>
            <button
              onClick={onOpenAddModal}
              className="mt-4 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Adicionar Primeira Transação</span>
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Transaction Deletion */}
      <ConfirmDeleteModal
        isOpen={!!transactionToDelete}
        title="Excluir Lançamento"
        message="Tem certeza que deseja excluir esta transação? O valor será removido dos cálculos de receitas/despesas e saldo."
        itemName={transactionToDelete ? `${transactionToDelete.description} (${transactionToDelete.type === 'receita' ? '+' : '-'}${formatCurrency(transactionToDelete.amount)})` : undefined}
        onCancel={() => setTransactionToDelete(null)}
        onConfirm={() => {
          if (transactionToDelete) {
            deleteTransaction(transactionToDelete.id);
            setTransactionToDelete(null);
          }
        }}
      />
    </div>
  );
};
