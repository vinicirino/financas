import React, { useRef, useState } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Database,
  Lock,
  LogOut,
  UserMinus,
  Cloud,
  CloudCheck,
  RefreshCw,
  Server
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { 
    clearDatabase, 
    resetToDemoData, 
    exportDataJSON, 
    importDataJSON,
    hasLocalDataToMigrate,
    isMigratedToCloud,
    migrateLocalDataToCloud,
    isSaving,
    syncError,
    clearSyncError
  } = useFinance();

  const { currentUser, logout, lockScreen, deleteAccount } = useAuth();
  
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [isConfirmingDeleteAccount, setIsConfirmingDeleteAccount] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [alsoWipeFinanceData, setAlsoWipeFinanceData] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = await importDataJSON(content);
        if (success) {
          setImportStatus('Dados importados com sucesso para o banco de dados online!');
          setTimeout(() => {
            setImportStatus(null);
            onClose();
          }, 1500);
        } else {
          setErrorMessage('Erro ao importar arquivo. Certifique-se de que o formato JSON é válido.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmReset = async () => {
    await resetToDemoData();
    setIsConfirmingReset(false);
    onClose();
  };

  const handleMigrate = async () => {
    setMigrationStatus(null);
    setErrorMessage(null);
    setIsMigrating(true);
    try {
      const res = await migrateLocalDataToCloud();
      if (res.success) {
        setMigrationStatus(res.message);
      } else {
        setErrorMessage(res.message);
      }
    } finally {
      setIsMigrating(false);
    }
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
      if (alsoWipeFinanceData) {
        await clearDatabase();
      }

      const res = await deleteAccount(deletePassword);
      if (!res.success) {
        setDeleteError(res.error || 'Não foi possível excluir a conta.');
        return;
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
            <h2 className="text-base font-bold text-slate-900">Configurações & Nuvem</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">

          {/* Cloud Connection Status Card */}
          <div className="p-3.5 bg-gradient-to-br from-slate-50 to-indigo-50/40 border border-slate-200/90 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSupabaseConfigured ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}>
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">Banco de Dados</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isSupabaseConfigured 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300/60' 
                        : 'bg-amber-100 text-amber-800 border border-amber-300/60'
                    }`}>
                      {isSupabaseConfigured ? 'Supabase PostgreSQL Online' : 'Pendente Configuração .env'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {isSupabaseConfigured 
                      ? 'Sincronização em tempo real entre computador e celular'
                      : 'Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
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
                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                    title="Bloquear tela (pedir senha)"
                  >
                    <Lock className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      logout();
                    }}
                    className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Sair da conta"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Account Deletion trigger */}
              <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Privacidade e conta</span>
                <button
                  type="button"
                  id="btn-trigger-delete-account"
                  onClick={() => setIsConfirmingDeleteAccount(!isConfirmingDeleteAccount)}
                  className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <UserMinus className="w-3 h-3" />
                  <span>Excluir Minha Conta</span>
                </button>
              </div>
            </div>
          )}

          {/* Delete Account confirmation form */}
          {isConfirmingDeleteAccount && (
            <form onSubmit={handleDeleteAccountSubmit} className="p-4 bg-rose-50/80 border border-rose-200 rounded-2xl space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Excluir Permanentemente a Conta</span>
              </div>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                Esta ação apagará seu perfil e suas credenciais do banco de dados na nuvem.
              </p>

              {deleteError && (
                <div className="p-2 bg-white border border-rose-200 text-rose-700 rounded-xl text-xs">
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
                  placeholder="Digite sua senha do Supabase"
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
                <span>Zerar também todos os meus lançamentos e ativos no banco de dados</span>
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

          {/* Local-to-Cloud Migration Section */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-indigo-600" />
                <span>Migração do Armazenamento Local</span>
              </h4>
              {isMigratedToCloud && (
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Migrado
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {hasLocalDataToMigrate 
                ? 'Identificamos dados gravados anteriormente no navegador (localStorage). Clique abaixo para enviá-los ao Supabase PostgreSQL.' 
                : isMigratedToCloud 
                  ? 'Seus dados já foram migrados para o Supabase. Caso tenha dados locais residuais, você pode sincronizar novamente.' 
                  : 'Sincronize quaisquer dados do seu navegador para sua conta na nuvem.'}
            </p>

            <button
              id="btn-migrate-local-data"
              onClick={handleMigrate}
              disabled={isMigrating || !isSupabaseConfigured}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              {isMigrating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Migrando dados para o Supabase...</span>
                </>
              ) : (
                <>
                  <CloudCheck className="w-4 h-4" />
                  <span>Migrar Dados Locais para o Supabase</span>
                </>
              )}
            </button>
          </div>

          {migrationStatus && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{migrationStatus}</span>
            </div>
          )}

          {importStatus && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{importStatus}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 font-medium">
              <X className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {syncError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center justify-between gap-2 font-medium">
              <span>{syncError}</span>
              <button 
                type="button" 
                onClick={clearSyncError}
                className="text-rose-600 hover:text-rose-900 text-[11px] underline"
              >
                Dispensar
              </button>
            </div>
          )}

          {/* Backup Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Backup e Exportação
            </h4>
            <p className="text-xs text-slate-600">
              Exporte todos os seus lançamentos, carteira e histórico do Supabase para um arquivo JSON em seu computador.
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
            <p className="text-xs text-slate-600">
              Carregue um arquivo JSON de backup para sincronizar os dados na sua conta online do Supabase.
            </p>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex items-center gap-2 pt-1">
              <button
                id="btn-import-backup"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold py-2.5 px-4 rounded-xl border border-slate-300 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-4 h-4 text-slate-600" />
                <span>{isSaving ? 'Importando...' : 'Restaurar do Arquivo (JSON)'}</span>
              </button>
            </div>
          </div>

          <div className="h-px bg-slate-100 my-2" />

          {/* Reset Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider">
              Zerar Dados Financeiros
            </h4>
            <p className="text-xs text-slate-600">
              Remove todas as transações, investimentos e proventos vinculados à sua conta no banco de dados.
            </p>
            
            {!isConfirmingReset ? (
              <button
                id="btn-open-confirm-reset"
                onClick={() => setIsConfirmingReset(true)}
                className="w-full flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold py-2.5 px-4 rounded-xl border border-rose-200 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Zerar Todos os Dados</span>
              </button>
            ) : (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Confirmação Necessária</span>
                </div>
                <p className="text-xs text-rose-700">
                  Tem certeza que deseja apagar todos os lançamentos do banco? Essa ação não pode ser desfeita.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setIsConfirmingReset(false)}
                    className="flex-1 py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    id="btn-confirm-reset"
                    onClick={handleConfirmReset}
                    className="flex-1 py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    Sim, Zerar Dados
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
