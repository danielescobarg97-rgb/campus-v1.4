import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Save,
  RotateCcw,
  Activity,
  Layers,
  Server,
  HelpCircle,
  X,
  Sparkles,
} from 'lucide-react';
import {
  isSupabaseConfigured,
  getSupabaseCredentials,
  saveCustomSupabaseConfig,
  clearCustomSupabaseConfig,
  testSupabaseConnection,
} from '../services/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SUPABASE_SETUP_SQL = `-- ==============================================================
-- 🚀 CampusBite (v1.5) - Script SQL para Supabase (PostgreSQL + Auth)
-- Ejecuta este script en: Supabase Dashboard -> SQL Editor -> New query
-- ==============================================================

-- 1. Crear tabla de Estudiantes (students) para Autenticación y Saldo CampusPay
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    wallet_balance NUMERIC NOT NULL DEFAULT 25000,
    transactions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Crear tabla de Pedidos (orders) para Cocina KDS y Seguimiento en Vivo
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    student_name TEXT NOT NULL,
    student_id TEXT NOT NULL,
    notes TEXT,
    total_price NUMERIC NOT NULL,
    pickup_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'recibido',
    items JSONB DEFAULT '[]'::jsonb NOT NULL,
    location_id TEXT NOT NULL,
    location_name TEXT NOT NULL,
    pickup_type TEXT NOT NULL DEFAULT 'inmediato',
    scheduled_time TEXT,
    payment_method TEXT NOT NULL DEFAULT 'campus_wallet',
    is_paid BOOLEAN NOT NULL DEFAULT false,
    is_group_order BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Índices de aceleración para búsquedas instantáneas
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students (lower(email));
CREATE INDEX IF NOT EXISTS idx_orders_student_id ON public.orders (student_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);

-- 4. Habilitar Seguridad por Filas (Row Level Security) y Políticas de Acceso Público
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Política de lectura y escritura para clave anónima (Pública para App de Estudiantes y KDS)
DROP POLICY IF EXISTS "Public access for students" ON public.students;
CREATE POLICY "Public access for students" ON public.students
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for orders" ON public.orders;
CREATE POLICY "Public access for orders" ON public.orders
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 5. Habilitar Publicación en Tiempo Real (Supabase Realtime) para pedidos
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- 6. Insertar Estudiantes Semilla para Pruebas Inmediatas
INSERT INTO public.students (id, name, email, password, wallet_balance, transactions)
VALUES 
(
  'EST-2024-491',
  'Valentina Torres',
  'valentina@universidad.edu.co',
  '1234',
  45000,
  '[{"id":"tx-init-1","description":"Bono de bienvenida CampusPay","amount":45000,"date":"2026-03-01T10:00:00Z"}]'::jsonb
),
(
  'EST-2023-118',
  'Camilo Rodríguez',
  'camilo@universidad.edu.co',
  '1234',
  30000,
  '[{"id":"tx-init-2","description":"Recarga PSE Nequi","amount":30000,"date":"2026-03-01T11:30:00Z"}]'::jsonb
)
ON CONFLICT (email) DO NOTHING;
`;

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'status' | 'sql' | 'vercel'>('status');
  const [creds, setCreds] = useState(getSupabaseCredentials());
  const [inputUrl, setInputUrl] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [testResult, setTestResult] = useState<{ loading: boolean; success?: boolean; message?: string }>({
    loading: false,
  });
  const [copiedSql, setCopiedSql] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = getSupabaseCredentials();
      setCreds(current);
      setInputUrl(current.source === 'custom' ? current.url : '');
      setInputKey(current.source === 'custom' ? current.key : '');
      setTestResult({ loading: false });
      setSaveSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTestResult({ loading: true });
    const res = await testSupabaseConnection();
    setTestResult({
      loading: false,
      success: res.success,
      message: res.message,
    });
  };

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim() || !inputKey.trim()) return;
    saveCustomSupabaseConfig(inputUrl, inputKey);
    setCreds(getSupabaseCredentials());
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    handleTestConnection();
  };

  const handleReset = () => {
    clearCustomSupabaseConfig();
    const updated = getSupabaseCredentials();
    setCreds(updated);
    setInputUrl('');
    setInputKey('');
    setTestResult({ loading: false });
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const configured = isSupabaseConfigured();

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-white text-base sm:text-lg">Conexión Supabase BaaS</h3>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                    configured
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {configured ? '● En Línea' : '○ Requiere Configuración'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                PostgreSQL + Autenticación + Saldo CampusPay persistente entre dispositivos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 pt-2 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'status'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Estado y Credenciales</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sql')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'sql'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Script SQL (Tablas)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('vercel')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'vercel'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Variables Vercel (.env)</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs text-slate-300">
          {activeTab === 'status' && (
            <div className="space-y-4">
              {/* Status Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-start gap-3 ${
                  configured
                    ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
                    : 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                }`}
              >
                {configured ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold text-sm text-white mb-0.5">
                    {configured
                      ? 'Supabase está conectado activamente'
                      : 'Supabase no está configurado o usa valores de ejemplo'}
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">
                    {configured
                      ? `Conectado mediante ${creds.source === 'env' ? 'variables de entorno (.env)' : 'credenciales personalizadas'}. Las cuentas de estudiantes, el saldo de CampusPay y los pedidos se sincronizan en la nube PostgreSQL.`
                      : 'Para que las cuentas de estudiantes y su saldo se sincronicen entre PC y celular, ingresa tu URL y Anon Key de Supabase a continuación o configúralas en Vercel.'}
                  </p>
                </div>
              </div>

              {/* Diagnostic Test Button */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-white text-xs">Diagnóstico de Conectividad en Tiempo Real</div>
                  <div className="text-[11px] text-slate-400">
                    Verifica si el cliente JS puede consultar la tabla "students" de Supabase
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testResult.loading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-xl transition-all shadow-md shrink-0 disabled:opacity-50"
                >
                  {testResult.loading ? 'Verificando...' : 'Probar Conexión'}
                </button>
              </div>

              {/* Diagnostic Result */}
              {testResult.message && (
                <div
                  className={`p-3 rounded-2xl border flex items-center gap-2.5 text-xs font-semibold ${
                    testResult.success
                      ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                      : 'bg-red-950/50 border-red-800 text-red-300'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              {/* Current URL & Key viewer */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Configuración Actual Detectada
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">VITE_SUPABASE_URL:</span>
                    <span className="text-slate-200 truncate max-w-[280px]">
                      {creds.url.includes('placeholder') ? '(No configurada)' : creds.url}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">VITE_SUPABASE_ANON_KEY:</span>
                    <span className="text-slate-200 truncate max-w-[280px]">
                      {creds.key.length > 20 ? `${creds.key.substring(0, 15)}...` : '(No configurada)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Direct Configuration Form */}
              <form onSubmit={handleSaveCustom} className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                    Probar con tus llaves de Supabase aquí directamente
                  </span>
                  {creds.source === 'custom' && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Restablecer a .env
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 block">Supabase Project URL</label>
                  <input
                    type="url"
                    placeholder="https://xyzproject.supabase.co"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 block">Supabase Anon Public API Key</label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono text-xs"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-500">
                    Se guarda en el navegador local para pruebas en vivo.
                  </span>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Guardar y Probar</span>
                  </button>
                </div>

                {saveSuccess && (
                  <div className="p-2 bg-emerald-950/60 border border-emerald-800 rounded-xl text-emerald-300 text-center font-bold text-[11px]">
                    ✓ Credenciales guardadas con éxito. Cliente de Supabase reinicializado.
                  </div>
                )}
              </form>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-xs">Script SQL de Inicialización para Supabase</h4>
                  <p className="text-[11px] text-slate-400">
                    Crea las tablas <code className="text-emerald-400 font-mono">students</code> y{' '}
                    <code className="text-emerald-400 font-mono">orders</code>, índices y políticas RLS públicas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedSql ? '¡Copiado!' : 'Copiar Script'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-950 border border-slate-800 rounded-2xl font-mono text-[11px] leading-relaxed overflow-x-auto text-emerald-300 max-h-[360px]">
                  {SUPABASE_SETUP_SQL}
                </pre>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-400 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Pasos en Supabase:</strong> Inicia sesión en{' '}
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 underline font-semibold"
                  >
                    supabase.com/dashboard
                  </a>
                  , abre tu proyecto, ve a <strong>SQL Editor</strong> en la barra lateral izquierda, presiona{' '}
                  <strong>New query</strong>, pega este script y haz clic en <strong>RUN</strong>.
                </span>
              </div>
            </div>
          )}

          {activeTab === 'vercel' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-white text-xs mb-1">
                  Configuración de Variables de Entorno en Vercel
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Dado que Vercel ejecuta las aplicaciones en contenedores Serverless y el frontend en Edge CDN,
                  las variables con prefijo <code className="text-orange-400 font-mono">VITE_</code> se inyectan en
                  tiempo de compilación.
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-400">1. Variables Requeridas:</div>
                <div className="space-y-2 font-mono text-[11px]">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <span className="text-orange-400 font-bold block">VITE_SUPABASE_URL</span>
                    <span className="text-slate-400 text-[10px]">
                      Ej: https://xyzcompany.supabase.co (Obtenido en Supabase: Project Settings → API → Project URL)
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <span className="text-orange-400 font-bold block">VITE_SUPABASE_ANON_KEY</span>
                    <span className="text-slate-400 text-[10px]">
                      Ej: eyJhbGciOi... (Obtenido en Supabase: Project Settings → API → Project API Keys → anon public)
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-[11px]">
                <div className="font-bold text-white">2. Pasos en Vercel Dashboard:</div>
                <ol className="list-decimal list-inside space-y-1 text-slate-400">
                  <li>Ve a tu proyecto en Vercel: vercel.com/dashboard.</li>
                  <li>Entra a la pestaña <strong>Settings</strong> → <strong>Environment Variables</strong>.</li>
                  <li>Agrega <strong className="text-slate-200">VITE_SUPABASE_URL</strong> con tu URL.</li>
                  <li>Agrega <strong className="text-slate-200">VITE_SUPABASE_ANON_KEY</strong> con tu llave anónima.</li>
                  <li>Haz un nuevo Deploy (Redeploy) para que Vite compile con las nuevas credenciales.</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
          <a
            href="https://supabase.com"
            target="_blank"
            rel="noreferrer"
            className="text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors text-[11px]"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Documentación de Supabase</span>
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
