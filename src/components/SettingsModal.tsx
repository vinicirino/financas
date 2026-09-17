import React, { useRef, useState } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  RotateCcw, 
  Database, 
  CheckCircle2, 
  Lock, 
  LogOut, 
  UserMinus, 
  AlertTriangle 
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { exportDataJSON, importDataJSON, resetToDemoData, clearDatabase } = useFinance();
  const { currentUser, lockScreen, logout, deleteAccount } = useAuth();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  // Account deletion state
  const [isConfirmingDeleteAccount, setIsConfirmingDeleteAccount] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [alsoWipeFinanceData, setAlsoWipeFinanceData] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importDataJSON(content);
        if (success) {
          setImportStatus('Dados importados com sucesso!');
          setTimeout(() => {
            setImportStatus(null);
            onClose();
          }, 1200);
        } else {
          setErrorMessage('Erro ao importar arquivo. Certifique-se de que o formato JSON é válido.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmReset = () => {
    resetToDemoData();
    setIsConfirmingReset(false);
    onClose();
  };

  const handleDeleteAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);

    if (!deletePassword) {
      setDeleteError('Por favor, informe sua senha para confirmar a exclusão.');
      return;
    }

    setIsDeleting(true);
    try {
      const res = await deleteAccount(deletePassword);
      if (!res.success) {
        setDeleteError(res.error || 'Não foi possível excluir a conta.');
        return;
      }

      if (alsoWipeFinanceData) {
        clearDatabase();
      }

      setIsConfirmingDeleteAccount(false);
      setDeletePassword('');
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Configurações & Backup</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          
          {/* Account Profile Card */}
          {currentUser && (
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    {currentUser.name ? currentUser.name.charAt(0) : 'U'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{currentUser.name}</h4>
                    <p className="text-[11px] text-slate-500">{currentUser.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      lockScreen();
                    }}
                    className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                    title="Bloquear Tela"
                  >
                    <Lock className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      logout();
                    }}
                    className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                    title="Sair da Conta"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Account actions: delete option */}
              <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Sessão criptografada (SHA-256)</span>
                <button
                  type="button"
                  id="btn-open-delete-account"
                  onClick={() => {
                    setIsConfirmingDeleteAccount(!isConfirmingDeleteAccount);
                    setDeleteError(null);
                    setDeletePassword('');
                  }}
                  className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <UserMinus className="w-3.5 h-3.5" />
                  <span>Excluir Conta</span>
                </button>
              </div>
            </div>
          )}

          {/* Delete Account Dialog */}
          {isConfirmingDeleteAccount && currentUser && (
            <form 
              onSubmit={handleDeleteAccountSubmit}
              className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3 animate-in fade-in duration-150"
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-rose-900">Excluir Conta Permanentemente</h4>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    Esta ação removerá o usuário <strong>{currentUser.email}</strong>. Para confirmar, digite sua senha atual:
                  </p>
                </div>
              </div>

              {deleteError && (
                <div className="p-2 bg-rose-100 border border-rose-300 text-rose-800 rounded-xl text-xs font-medium">
                  {deleteError}
                </div>
              )}

              <div>
                <input
                  id="input-delete-account-password"
                  type="password"
                  autoFocus
                  required
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Digite sua senha de acesso"
                  className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 font-mono"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-[11px] text-rose-800 select-none">
                <input
                  type="checkbox"
                  checked={alsoWipeFinanceData}
                  onChange={(e) => setAlsoWipeFinanceData(e.target.checked)}
                  className="rounded-md border-rose-300 text-rose-600 focus:ring-rose-500/20 w-3.5 h-3.5"
                />
                <span>Zerar também todos os lançamentos financeiros deste navegador</span>
              </label>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => {
                    setIsConfirmingDeleteAccount(false);
                    setDeletePassword('');
                    setDeleteError(null);
                  }}
                  className="flex-1 py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="btn-confirm-delete-account"
                  disabled={isDeleting}
                  className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <UserMinus className="w-3.5 h-3.5" />
                  <span>{isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}</span>
                </button>
              </div>
            </form>
          )}

          {importStatus && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{importStatus}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 font-medium">
              <X className="w-4 h-4 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Backup Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Backup e Exportação
            </h4>
            <p className="text-xs text-slate-700">
              Exporte todos os seus lançamentos financeiros, carteira de investimentos e relatórios para um arquivo JSON seguro em seu computador.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                id="btn-export-backup"
                onClick={exportDataJSON}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Exportar Backup (JSON)</span>
              </button>
            </div>
          </div>

          <div className="h-px bg-slate-100 my-2" />

          {/* Import Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Restaurar Backup
            </h4>
            <p className="text-xs text-slate-700">
              Carregue um arquivo JSON de backup previamente exportado para recuperar seus dados.
            </p>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              id="btn-import-backup"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-indigo-600" />
              <span>Importar Arquivo JSON</span>
            </button>
          </div>

          <div className="h-px bg-slate-100 my-2" />

          {/* Reset All Data */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider text-rose-600">
              Zerar Banco de Dados
            </h4>
            <p className="text-xs text-slate-700">
              Limpa permanentemente todos os lançamentos financeiros, investimentos e proventos cadastrados no navegador.
            </p>

            {isConfirmingReset ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                <p className="text-xs font-semibold text-rose-800">
                  Deseja realmente zerar todo o banco de dados? Esta ação apagará todas as transações e ativos.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsConfirmingReset(false)}
                    className="flex-1 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    id="btn-confirm-clear-db"
                    onClick={handleConfirmReset}
                    className="flex-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
                  >
                    Confirmar Limpeza Total
                  </button>
                </div>
              </div>
            ) : (
              <button
                id="btn-open-clear-db"
                onClick={() => setIsConfirmingReset(true)}
                className="w-full flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Zerar Banco de Dados (Limpar Tudo)</span>
              </button>
            )}
          </div>

          <div className="pt-2 text-center">
            <span className="text-[11px] text-slate-700">
              FinanControl Pro v1.0 • Armazenamento local seguro e privacidade garantida
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
